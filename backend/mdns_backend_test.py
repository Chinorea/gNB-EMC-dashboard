#!/usr/bin/env python3
"""
Enhanced gNB mDNS Subscriber with Network Discovery
Discovers multiple dashboards via network scanning + direct registration
"""
import socket
import threading
import time
import requests
import json
import ipaddress
import logging
from concurrent.futures import ThreadPoolExecutor
import subprocess

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MultiDashboardDiscovery:
    def __init__(self, node_name, flask_port=5000):
        self.node_name = node_name
        self.flask_port = flask_port
        self.discovered_dashboards = {}
        self.registration_threads = {}
        self.running = True
        self.discovery_interval = 60  # Re-scan every 60 seconds
        
    def get_local_network(self):
        """Determine local network subnet for scanning"""
        try:
            # Get default route interface
            result = subprocess.run(['ip', 'route', 'show', 'default'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                # Extract interface name
                default_route = result.stdout.strip()
                if 'dev' in default_route:
                    interface = default_route.split('dev')[1].split()[0]
                    
                    # Get IP and subnet for this interface
                    ip_result = subprocess.run(['ip', 'addr', 'show', interface], 
                                             capture_output=True, text=True)
                    if ip_result.returncode == 0:
                        for line in ip_result.stdout.split('\n'):
                            if 'inet ' in line and not '127.0.0.1' in line:
                                ip_cidr = line.split('inet')[1].split()[0]
                                return str(ipaddress.IPv4Network(ip_cidr, strict=False))
        except Exception as e:
            logger.warning(f"Could not determine network automatically: {e}")
        
        # Fallback: try to determine from local IP
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
            s.close()
            
            # Assume /24 subnet
            network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
            return str(network)
        except:
            pass
        
        return "192.168.2.0/24"  # Default fallback
    
    def scan_for_dashboard(self, ip, port=3001, timeout=2):
        """Test if a specific IP:port is a gNB dashboard"""
        try:
            response = requests.get(f"http://{ip}:{port}/health", timeout=timeout)
            if response.status_code == 200:
                data = response.json()
                if 'gNB' in data.get('service', '') or 'mDNS' in data.get('service', ''):
                    return {
                        'ip': ip,
                        'port': port,
                        'service': data.get('service', 'Unknown'),
                        'hostname': data.get('hostname', 'Unknown')
                    }
        except:
            pass
        return None
    
    def network_discovery_scan(self, network_cidr="auto", port=3001, max_workers=50):
        """Scan network for gNB dashboards"""
        if network_cidr == "auto":
            network_cidr = self.get_local_network()
        
        logger.info(f"🔍 Scanning network {network_cidr} for gNB dashboards...")
        
        network = ipaddress.IPv4Network(network_cidr)
        discovered = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all IP scan tasks
            futures = {}
            for ip in network.hosts():
                if ip != ipaddress.IPv4Address(self.get_local_ip()):  # Skip self
                    future = executor.submit(self.scan_for_dashboard, str(ip), port)
                    futures[future] = str(ip)
            
            # Collect results
            completed = 0
            total = len(futures)
            for future in futures:
                result = future.result()
                completed += 1
                
                if completed % 50 == 0:  # Progress indicator
                    logger.info(f"   Scanned {completed}/{total} addresses...")
                
                if result:
                    discovered.append(result)
                    logger.info(f"✅ Found dashboard: {result['ip']}:{result['port']} - {result['service']}")
        
        logger.info(f"🎯 Network scan complete: Found {len(discovered)} dashboards")
        return discovered
    
    def register_with_dashboard(self, dashboard_info):
        """Register with a specific dashboard"""
        dashboard_id = f"{dashboard_info['ip']}:{dashboard_info['port']}"
        
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
            'timestamp': time.time(),
            'discoveryMethod': 'network_scan'
        }
        
        try:
            response = requests.post(
                f"http://{dashboard_info['ip']}:{dashboard_info['port']}/api/gnb/register",
                json=registration_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Registered with {dashboard_id}")
                return True
            else:
                logger.warning(f"⚠️ Registration failed with {dashboard_id}: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Registration error with {dashboard_id}: {e}")
            return False
    
    def heartbeat_worker(self, dashboard_info):
        """Maintain heartbeat with a specific dashboard"""
        dashboard_id = f"{dashboard_info['ip']}:{dashboard_info['port']}"
        heartbeat_count = 0
        
        while self.running and dashboard_id in self.discovered_dashboards:
            time.sleep(30)  # 30 second intervals
            heartbeat_count += 1
            
            try:
                heartbeat_data = {
                    'ip': self.get_local_ip(),
                    'timestamp': time.time(),
                    'batteryLevel': self.get_battery_level(),
                    'status': 'active',
                    'heartbeat_count': heartbeat_count
                }
                
                response = requests.post(
                    f"http://{dashboard_info['ip']}:{dashboard_info['port']}/api/gnb/heartbeat",
                    json=heartbeat_data,
                    timeout=5
                )
                
                if response.status_code == 200:
                    logger.debug(f"💓 Heartbeat to {dashboard_id} - #{heartbeat_count}")
                else:
                    logger.warning(f"⚠️ Heartbeat failed to {dashboard_id}: HTTP {response.status_code}")
                    
                    # Try re-registration
                    if response.status_code in [404, 500]:
                        logger.info(f"🔄 Re-registering with {dashboard_id}")
                        self.register_with_dashboard(dashboard_info)
                        
            except Exception as e:
                logger.warning(f"❌ Heartbeat error to {dashboard_id}: {e}")
    
    def start_multi_dashboard_discovery(self, network_cidr="auto", port=3001):
        """Start discovery and registration with multiple dashboards"""
        logger.info(f"🚀 Starting Multi-Dashboard Discovery")
        logger.info(f"   Node: {self.node_name}")
        logger.info(f"   Network: {network_cidr}")
        logger.info(f"   Port: {port}")
        
        try:
            while self.running:
                # Discover dashboards on network
                discovered = self.network_discovery_scan(network_cidr, port)
                
                # Register with newly discovered dashboards
                for dashboard in discovered:
                    dashboard_id = f"{dashboard['ip']}:{dashboard['port']}"
                    
                    if dashboard_id not in self.discovered_dashboards:
                        # New dashboard found
                        logger.info(f"🆕 New dashboard discovered: {dashboard_id}")
                        
                        # Register with it
                        if self.register_with_dashboard(dashboard):
                            self.discovered_dashboards[dashboard_id] = dashboard
                            
                            # Start heartbeat thread
                            heartbeat_thread = threading.Thread(
                                target=self.heartbeat_worker,
                                args=(dashboard,),
                                daemon=True
                            )
                            heartbeat_thread.start()
                            self.registration_threads[dashboard_id] = heartbeat_thread
                
                # Remove dashboards that are no longer reachable
                current_dashboard_ids = {f"{d['ip']}:{d['port']}" for d in discovered}
                for dashboard_id in list(self.discovered_dashboards.keys()):
                    if dashboard_id not in current_dashboard_ids:
                        logger.info(f"📤 Dashboard no longer reachable: {dashboard_id}")
                        del self.discovered_dashboards[dashboard_id]
                        if dashboard_id in self.registration_threads:
                            del self.registration_threads[dashboard_id]
                
                logger.info(f"📊 Currently registered with {len(self.discovered_dashboards)} dashboards")
                
                # Wait before next discovery cycle
                logger.info(f"⏱️ Waiting {self.discovery_interval} seconds before next scan...")
                time.sleep(self.discovery_interval)
                
        except KeyboardInterrupt:
            logger.info("⏹️ Discovery stopped by user")
            self.running = False
        except Exception as e:
            logger.error(f"❌ Discovery error: {e}")
    
    def get_local_ip(self):
        """Get local IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def get_battery_level(self):
        """Get battery level (mock for now)"""
        return 12.0 + (time.time() % 10) / 10  # Simulate changing battery

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python multi_dashboard_discovery.py <node_name> [network_cidr] [port]")
        print("Example: python multi_dashboard_discovery.py MyGnbNode")
        print("Example: python multi_dashboard_discovery.py MyGnbNode 192.168.1.0/24")
        print("Example: python multi_dashboard_discovery.py MyGnbNode auto 3001")
        sys.exit(1)
    
    node_name = sys.argv[1]
    network_cidr = sys.argv[2] if len(sys.argv) > 2 else "auto"
    port = int(sys.argv[3]) if len(sys.argv) > 3 else 3001
    
    discovery = MultiDashboardDiscovery(node_name)
    discovery.start_multi_dashboard_discovery(network_cidr, port)

if __name__ == "__main__":
    main()