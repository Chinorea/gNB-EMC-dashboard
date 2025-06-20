#!/usr/bin/env python3
"""
mDNS Subscriber for gNB Nodes
Discovers dashboard mDNS service and registers with it
Runs separately from Flask application
"""

import time
import json
import socket
import requests
import threading
import logging
from zeroconf import ServiceBrowser, ServiceListener, Zeroconf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GnbMdnsSubscriber:
    def __init__(self, node_name, flask_port=5000):
        """
        Initialize gNB mDNS subscriber
        
        Args:
            node_name (str): Unique identifier for this gNB node
            flask_port (int): Port where Flask app is running
        """
        self.node_name = node_name
        self.flask_port = flask_port
        self.zeroconf = Zeroconf()
        self.dashboard_service = None
        self.registration_thread = None
        self.running = False
        
        logger.info(f"Initialized gNB mDNS subscriber for node: {node_name}")
    
    def get_local_ip(self):
        """Get local IP address of this machine"""
        try:
            # Connect to a dummy address to get local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception as e:
            logger.warning(f"Could not determine local IP: {e}")
            return "127.0.0.1"
    
    def get_flask_status(self):
        """Get status from local Flask application"""
        try:
            response = requests.get(
                f"http://localhost:{self.flask_port}/status", 
                timeout=2
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Flask app returned status {response.status_code}")
                return None
        except Exception as e:
            logger.warning(f"Could not reach Flask app: {e}")
            return None
    
    def get_battery_level(self):
        """Get battery level - implement based on your hardware"""
        try:
            # Example implementation - replace with your actual battery reading
            # This could read from system files, hardware APIs, etc.
            flask_status = self.get_flask_status()
            if flask_status and 'batteryLevel' in flask_status:
                return flask_status['batteryLevel']
            else:
                # Default fallback value
                return 12.0
        except Exception as e:
            logger.warning(f"Could not get battery level: {e}")
            return 12.0
    
    class DashboardListener(ServiceListener):
        """Listener for dashboard mDNS services"""
        
        def __init__(self, parent):
            self.parent = parent
        
        def add_service(self, zc, type_, name):
            """Called when a new service is discovered"""
            info = zc.get_service_info(type_, name)
            if info:
                dashboard_host = socket.inet_ntoa(info.addresses[0])
                dashboard_port = info.port
                
                logger.info(f"📡 Dashboard discovered: {dashboard_host}:{dashboard_port}")
                logger.info(f"   Service name: {name}")
                logger.info(f"   Service type: {type_}")
                
                self.parent.register_with_dashboard(dashboard_host, dashboard_port)
        
        def remove_service(self, zc, type_, name):
            """Called when a service is removed"""
            logger.warning(f"⚠️  Dashboard service lost: {name}")
            self.parent.dashboard_service = None
            self.parent.stop_registration()
        
        def update_service(self, zc, type_, name):
            """Called when a service is updated"""
            logger.info(f"🔄 Dashboard service updated: {name}")
    
    def start_discovery(self):
        """Start looking for dashboard mDNS service"""
        logger.info("🔍 Starting mDNS discovery...")
        logger.info("   Looking for dashboard service: _gnb-scanner._tcp.local.")
        
        self.running = True
        listener = self.DashboardListener(self)
        
        # Browse for dashboard service
        browser = ServiceBrowser(
            self.zeroconf,
            "_gnb-scanner._tcp.local.",
            listener
        )
        
        logger.info("✅ mDNS discovery started - waiting for dashboard...")
        return browser
    
    def register_with_dashboard(self, dashboard_host, dashboard_port):
        """Register this gNB node with discovered dashboard"""
        self.dashboard_service = {
            'host': dashboard_host,
            'port': dashboard_port
        }
        
        # Prepare registration data
        registration_data = {
            'ip': self.get_local_ip(),
            'nodeName': self.node_name,
            'nodeType': 'gNB',
            'capabilities': [
                'status_reporting',
                'network_monitoring', 
                'battery_reporting'
            ],
            'batteryLevel': self.get_battery_level(),
            'flaskPort': self.flask_port,
            'timestamp': time.time()
        }
        
        logger.info("📝 Registering with dashboard...")
        logger.info(f"   Dashboard: {dashboard_host}:{dashboard_port}")
        logger.info(f"   Node data: {json.dumps(registration_data, indent=2)}")
        
        # Start registration in background thread
        if self.registration_thread is None or not self.registration_thread.is_alive():
            self.registration_thread = threading.Thread(
                target=self._registration_worker,
                args=(registration_data,),
                daemon=True
            )
            self.registration_thread.start()
    
    def _registration_worker(self, initial_data):
        """Background worker for dashboard registration and heartbeat"""
        try:
            # Initial registration
            response = requests.post(
                f"http://{self.dashboard_service['host']}:{self.dashboard_service['port']}/api/gnb/register",
                json=initial_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("✅ Successfully registered with dashboard!")
                logger.info("💓 Starting heartbeat loop...")
                
                # Start heartbeat loop
                while self.running and self.dashboard_service:
                    time.sleep(30)  # 30 second heartbeat interval
                    
                    try:
                        # Get current Flask status for heartbeat
                        flask_status = self.get_flask_status()
                        
                        heartbeat_data = {
                            'ip': self.get_local_ip(),
                            'timestamp': time.time(),
                            'batteryLevel': self.get_battery_level(),
                            'status': 'active' if flask_status else 'flask_unreachable'
                        }
                        
                        response = requests.post(
                            f"http://{self.dashboard_service['host']}:{self.dashboard_service['port']}/api/gnb/heartbeat",
                            json=heartbeat_data,
                            timeout=5
                        )
                        
                        if response.status_code == 200:
                            logger.debug(f"💓 Heartbeat sent - Battery: {heartbeat_data['batteryLevel']}")
                        else:
                            logger.warning(f"⚠️  Heartbeat failed: HTTP {response.status_code}")
                            
                    except Exception as e:
                        logger.error(f"❌ Heartbeat error: {e}")
                        break
                        
            else:
                logger.error(f"❌ Registration failed: HTTP {response.status_code}")
                if response.text:
                    logger.error(f"   Response: {response.text}")
                
        except Exception as e:
            logger.error(f"❌ Registration error: {e}")
    
    def stop_registration(self):
        """Stop registration heartbeat"""
        logger.info("🛑 Stopping registration...")
        self.running = False
        if self.registration_thread:
            self.registration_thread.join(timeout=2)
    
    def cleanup(self):
        """Cleanup mDNS resources"""
        logger.info("🧹 Cleaning up mDNS subscriber...")
        self.stop_registration()
        self.zeroconf.close()
        logger.info("✅ Cleanup complete")

def main():
    """Main function - customize this for your gNB node"""
    import sys
    
    # Get node name from command line or use default
    if len(sys.argv) > 1:
        node_name = sys.argv[1]
    else:
        node_name = f"gNB-Node-{int(time.time()) % 1000}"
    
    # Get Flask port from command line or use default
    if len(sys.argv) > 2:
        flask_port = int(sys.argv[2])
    else:
        flask_port = 5000
    
    logger.info("🚀 Starting gNB mDNS Subscriber")
    logger.info(f"   Node Name: {node_name}")
    logger.info(f"   Flask Port: {flask_port}")
    logger.info("")
    
    # Create and start subscriber
    subscriber = GnbMdnsSubscriber(node_name, flask_port)
    
    try:
        # Start discovery
        browser = subscriber.start_discovery()
        
        # Keep running
        logger.info("Press Ctrl+C to stop...")
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("\n⏹️  Received stop signal")
        
    finally:
        subscriber.cleanup()
        logger.info("👋 gNB mDNS Subscriber stopped")

if __name__ == "__main__":
    main()