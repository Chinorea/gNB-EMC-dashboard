#!/usr/bin/env python3
"""
Enhanced Backend Discovery Test
"""

import time
import socket
from zeroconf import Zeroconf, ServiceBrowser, ServiceListener
import requests

class VerboseListener(ServiceListener):
    def __init__(self):
        self.services_found = []
        print("🔍 VerboseListener initialized")
    
    def add_service(self, zc, type_, name):
        print(f"✅ FOUND SERVICE: {name}")
        print(f"   Type: {type_}")
        
        try:
            info = zc.get_service_info(type_, name)
            if info:
                host = socket.inet_ntoa(info.addresses[0])
                print(f"   Host: {host}:{info.port}")
                print(f"   Addresses: {[socket.inet_ntoa(addr) for addr in info.addresses]}")
                if info.properties:
                    print(f"   Properties: {info.properties}")
                
                self.services_found.append({
                    'name': name,
                    'host': host,
                    'port': info.port
                })
            else:
                print(f"   ⚠️ No service info available")
        except Exception as e:
            print(f"   ❌ Error getting service info: {e}")
        
        print("-" * 50)
    
    def remove_service(self, zc, type_, name):
        print(f"❌ Service removed: {name}")
    
    def update_service(self, zc, type_, name):
        print(f"🔄 Service updated: {name}")

def test_direct_registration():
    """Test direct registration without mDNS discovery"""
    print("\n🎯 Testing Direct Registration (Bypass mDNS)")
    print("=" * 50)
    
    dashboard_ip = "192.168.2.104"
    dashboard_port = 3001
    
    try:
        # Test health endpoint
        print(f"🔍 Testing dashboard connectivity...")
        health_response = requests.get(f"http://{dashboard_ip}:{dashboard_port}/health", timeout=5)
        print(f"   Health check: {health_response.status_code}")
        
        # Test direct registration
        print(f"📝 Testing node registration...")
        registration_data = {
            'ip': get_backend_ip(),
            'nodeName': 'Backend-Test-Node',
            'nodeType': 'gNB',
            'capabilities': ['status_reporting', 'network_monitoring', 'battery_reporting'],
            'batteryLevel': 12.5,
            'flaskPort': 5000,
            'timestamp': time.time()
        }
        
        register_response = requests.post(
            f"http://{dashboard_ip}:{dashboard_port}/api/gnb/register",
            json=registration_data,
            timeout=10
        )
        
        print(f"   Registration response: {register_response.status_code}")
        if register_response.status_code == 200:
            print("✅ Direct registration successful!")
            print("💡 Check your React frontend - node should appear immediately")
            return True
        else:
            print(f"❌ Registration failed: {register_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Direct registration test failed: {e}")
        return False

def get_backend_ip():
    """Get backend IP address"""
    try:
        # Try connecting to dashboard to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("192.168.2.104", 3001))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            # Alternative method using hostname
            import subprocess
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            if result.returncode == 0:
                ips = result.stdout.strip().split()
                for ip in ips:
                    if not ip.startswith('127.') and not ip.startswith('::'):
                        return ip
        except Exception:
            pass
        return "127.0.0.1"

def main():
    print("🚀 Enhanced Backend Discovery Test")
    print("Testing if backend can discover mDNS service...")
    print("=" * 60)
    
    # Test 1: mDNS Discovery
    print("📡 Creating Zeroconf instance...")
    zc = Zeroconf()
    
    print("👂 Creating listener...")
    listener = VerboseListener()
    
    print("🔍 Starting service browser for: _gnb-scanner._tcp.local.")
    browser = ServiceBrowser(zc, '_gnb-scanner._tcp.local.', listener)
    
    print("⏱️  Scanning for 15 seconds...")
    try:
        for i in range(15):
            time.sleep(1)
            if i % 5 == 0 and i > 0:
                print(f"   ... {15-i} seconds remaining")
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted")
    
    print(f"\n📊 mDNS DISCOVERY RESULTS:")
    print(f"Services found: {len(listener.services_found)}")
    
    mdns_success = False
    if listener.services_found:
        print("✅ Successfully discovered services:")
        for service in listener.services_found:
            print(f"  - {service['name']} at {service['host']}:{service['port']}")
        print("\n🎉 Backend can discover mDNS service!")
        mdns_success = True
    else:
        print("❌ No services discovered via mDNS")
        print("\nPossible issues:")
        print("1. Zeroconf version incompatibility")
        print("2. Network interface binding issue")
        print("3. Firewall blocking mDNS multicast")
        print("4. Python and mDNS service on different networks")
    
    print(f"\n🖥️  Backend machine info:")
    backend_ip = get_backend_ip()
    print(f"Backend IP: {backend_ip}")
    print(f"Expected dashboard IP: 192.168.2.104")
    if backend_ip != "192.168.2.104":
        print("⚠️  WARNING: Backend and dashboard on different IPs!")
        print("   This may prevent mDNS discovery")
    
    print("\n🧹 Cleaning up mDNS...")
    zc.close()
    
    # Test 2: Direct Registration (if mDNS failed)
    if not mdns_success:
        print("\n" + "=" * 60)
        print("🔄 Since mDNS discovery failed, testing direct registration...")
        direct_success = test_direct_registration()
        
        if direct_success:
            print("\n✅ RECOMMENDATION: Use direct registration mode")
            print("   Command: python gnb_mdns_subscriber.py <node_name> direct 192.168.2.104")
        else:
            print("\n❌ Both mDNS discovery and direct registration failed")
            print("   Check network connectivity to dashboard")
    
    print("\n✅ Test complete")

if __name__ == "__main__":
    main()