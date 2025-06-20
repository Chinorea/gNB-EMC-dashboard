#!/usr/bin/env python3
"""
Enhanced mDNS Discovery Test with Detailed Debugging
"""

import time
import socket
from zeroconf import Zeroconf, ServiceBrowser, ServiceListener

class DetailedListener(ServiceListener):
    def __init__(self):
        self.services_found = []
        self.gnb_services_found = []
    
    def add_service(self, zc, type_, name):
        """Called when a new service is discovered"""
        print(f"🔍 Service discovered: {name}")
        print(f"   Type: {type_}")
        
        info = zc.get_service_info(type_, name)
        if info:
            try:
                host = socket.inet_ntoa(info.addresses[0])
                print(f"   Host: {host}:{info.port}")
                print(f"   Addresses: {[socket.inet_ntoa(addr) for addr in info.addresses]}")
                if info.properties:
                    print(f"   Properties: {info.properties}")
                print()
                
                self.services_found.append({
                    'name': name,
                    'type': type_,
                    'host': host,
                    'port': info.port,
                    'addresses': info.addresses,
                    'properties': info.properties
                })
                
                # Check if this is our gNB service
                if '_gnb-scanner._tcp' in type_:
                    print("🎯 FOUND gNB SCANNER SERVICE!")
                    self.gnb_services_found.append(name)
                    
            except Exception as e:
                print(f"   ❌ Error processing service info: {e}")
        else:
            print(f"   ⚠️ No service info available for {name}")
        print("-" * 50)
    
    def remove_service(self, zc, type_, name):
        print(f"❌ Service removed: {name}")
    
    def update_service(self, zc, type_, name):
        print(f"🔄 Service updated: {name}")

def main():
    print("🚀 Enhanced mDNS Discovery Test")
    print("=" * 60)
    print("This test will:")
    print("1. Look specifically for _gnb-scanner._tcp services")
    print("2. Look for all _http._tcp services (for comparison)")
    print("3. Show detailed network and service information")
    print("4. Help identify why gNB service isn't visible")
    print("=" * 60)
    print()
    
    zeroconf = Zeroconf()
    listener = DetailedListener()
    
    # Test 1: Look specifically for gNB scanner services
    print("🎯 Test 1: Looking for _gnb-scanner._tcp services...")
    browser_gnb = ServiceBrowser(zeroconf, "_gnb-scanner._tcp.local.", listener)
    
    # Test 2: Look for HTTP services (should find the ones you saw before)
    print("🌐 Test 2: Looking for _http._tcp services...")
    browser_http = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)
    
    # Test 3: Look for ALL TCP services
    print("📡 Test 3: Looking for ALL TCP services...")
    browser_all = ServiceBrowser(zeroconf, "_services._dns-sd._udp.local.", listener)
    
    try:
        print("\n⏱️  Scanning for 45 seconds...")
        print("   (This should be enough time to discover all services)")
        print("   Press Ctrl+C to stop early")
        
        for i in range(45):
            time.sleep(1)
            if i % 10 == 0 and i > 0:
                print(f"   ... {45-i} seconds remaining")
                
    except KeyboardInterrupt:
        print("\n⏹️ Scan interrupted by user")
    
    print("\n" + "=" * 60)
    print("📊 DISCOVERY RESULTS")
    print("=" * 60)
    
    print(f"Total services found: {len(listener.services_found)}")
    print(f"gNB scanner services found: {len(listener.gnb_services_found)}")
    
    if listener.gnb_services_found:
        print("\n✅ gNB SCANNER SERVICES DISCOVERED:")
        for service in listener.gnb_services_found:
            print(f"  - {service}")
    else:
        print("\n❌ NO gNB SCANNER SERVICES FOUND")
        print("\nPossible issues:")
        print("1. mDNS service not actually publishing (check console)")
        print("2. Service published on wrong network interface")
        print("3. Firewall blocking mDNS multicast traffic")
        print("4. Network segmentation preventing discovery")
        print("5. Bonjour service configuration error")
    
    if listener.services_found:
        print(f"\n📋 All services discovered:")
        for service in listener.services_found:
            service_type = "🎯 gNB SCANNER" if "_gnb-scanner" in service['type'] else "🌐 HTTP" if "_http" in service['type'] else "📡 OTHER"
            print(f"  {service_type}: {service['name']}")
            print(f"     Host: {service['host']}:{service['port']}")
            print(f"     Type: {service['type']}")
    
    # Network diagnostics
    print(f"\n🖥️  LOCAL MACHINE INFO:")
    print(f"Local hostname: {socket.gethostname()}")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        print(f"Primary IP address: {local_ip}")
    except:
        print("Could not determine primary IP")
    
    print(f"\n🔧 TROUBLESHOOTING RECOMMENDATIONS:")
    if not listener.gnb_services_found:
        print("1. Check your mDNS service console for 'SERVICE PUBLISHED SUCCESSFULLY'")
        print("2. Verify dashboard and test script are on same network subnet")
        print("3. Test with: curl http://localhost:3001/api/mdns/status")
        print("4. Check Windows Firewall settings for mDNS (port 5353)")
        print("5. Try restarting the mDNS service")
    else:
        print("✅ gNB scanner service is working correctly!")
    
    zeroconf.close()
    print("\n✅ Enhanced discovery test complete")

if __name__ == "__main__":
    main()