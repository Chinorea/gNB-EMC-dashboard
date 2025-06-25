#!/usr/bin/env python3
"""
Enhanced UDP MANET Device Discovery Script

This script implements UDP-based communication for discovering and communicating
with MANET (Mobile Ad-hoc Network) devices using JSON message format.
Enhanced to handle multiple network interfaces and cross-subnet communication.

Features:
- Multi-network interface support
- Direct device targeting (bypassing broadcast limitations)
- Device discovery via broadcast messages
- JSON message encapsulation
- Bidirectional UDP communication
- Automatic source IP detection
- Response handling and logging
"""

import socket
import json
import time
import threading
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
import ipaddress

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('udp_manet_discovery.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EnhancedMANETDiscovery:
    """
    Enhanced MANET Device Discovery and Communication Handler
    Supports multiple network interfaces and direct device communication
    """
    
    def __init__(self, discovery_port: int = 7000, listen_port: int = 7001, preferred_interface: str = None):
        """
        Initialize Enhanced MANET Discovery
        
        Args:
            discovery_port: Port for sending discovery messages (default: 7000)
            listen_port: Port for listening to responses (default: 7001)
            preferred_interface: Preferred IP interface to use (optional)
        """
        self.discovery_port = discovery_port
        self.listen_port = listen_port
        self.broadcast_address = "255.255.255.255"
        self.preferred_interface = preferred_interface
        
        # Get all available network interfaces
        self.available_interfaces = self._get_all_interfaces()
        
        # Select the best interface for communication
        self.source_ip = self._select_best_interface()
        
        self.discovered_devices = {}
        self.is_listening = False
        self.listener_thread = None
        
        # Create sockets
        self.send_socket = None
        self.listen_socket = None
        
        logger.info(f"Enhanced MANET Discovery initialized")
        logger.info(f"Available interfaces: {self.available_interfaces}")
        logger.info(f"Selected interface: {self.source_ip}")
        logger.info(f"Discovery port: {discovery_port}, Listen port: {listen_port}")
    
    def _get_all_interfaces(self) -> List[str]:
        """
        Get all available network interfaces
        
        Returns:
            List[str]: List of IP addresses for all interfaces
        """
        interfaces = []
        hostname = socket.gethostname()
        
        try:
            # Get all IP addresses associated with the hostname
            addresses = socket.getaddrinfo(hostname, None, socket.AF_INET)
            for addr_info in addresses:
                ip = addr_info[4][0]
                if ip not in interfaces and not ip.startswith('127.'):
                    interfaces.append(ip)
        except Exception as e:
            logger.warning(f"Could not get all interfaces via hostname: {e}")
        
        # Fallback method using socket connection
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                primary_ip = s.getsockname()[0]
                if primary_ip not in interfaces:
                    interfaces.append(primary_ip)
        except Exception as e:
            logger.warning(f"Could not determine primary interface: {e}")
        
        # Add localhost if nothing else found
        if not interfaces:
            interfaces.append("127.0.0.1")
            
        return interfaces
    
    def _select_best_interface(self) -> str:
        """
        Select the best network interface for communication
        
        Returns:
            str: Selected IP address
        """
        if self.preferred_interface and self.preferred_interface in self.available_interfaces:
            return self.preferred_interface
        
        # If no preference, try to find an interface in the same subnet as common targets
        target_subnets = ['192.168.2.', '192.168.1.', '10.0.0.', '172.16.']
        
        for interface in self.available_interfaces:
            for subnet in target_subnets:
                if interface.startswith(subnet):
                    logger.info(f"Selected interface {interface} (matches target subnet {subnet})")
                    return interface
        
        # Default to first available interface
        return self.available_interfaces[0] if self.available_interfaces else "127.0.0.1"
    
    def _setup_sockets(self):
        """Setup UDP sockets for sending and receiving"""
        try:
            # Setup a single socket for both sending and receiving
            # This ensures responses come back to the same port we send from
            self.send_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.send_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            self.send_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            
            # Bind to a specific port so responses come back to this port
            self.send_socket.bind((self.source_ip, self.listen_port))
            
            # Use the same socket for listening (responses will come to the sender's port)
            self.listen_socket = self.send_socket
            self.listen_socket.settimeout(1.0)  # 1 second timeout for non-blocking
            
            # Get the actual port we're bound to
            actual_port = self.send_socket.getsockname()[1]
            logger.info(f"UDP socket setup successfully on {self.source_ip}:{actual_port}")
            logger.info(f"Using same port for sending and receiving responses")
            
        except Exception as e:
            logger.error(f"Failed to setup sockets: {e}")
            raise
    
    def create_discovery_message(self, device_type: str = "mesh") -> Dict[str, Any]:
        """
        Create a JSON discovery message
        
        Args:
            device_type: Type of device to search for (default: "mesh")
            
        Returns:
            dict: JSON discovery message in the format {"device": "mesh", "method": "discover"}
        """
        message = {
            "device": device_type,
            "method": "discover"
        }
        return message
    
    def send_direct_discovery(self, target_ip: str, device_type: str = "mesh") -> bool:
        """
        Send discovery message directly to a specific IP address
        This bypasses broadcast limitations for cross-subnet communication
        
        Args:
            target_ip: IP address of target device
            device_type: Type of device to discover
            
        Returns:
            bool: True if message sent successfully
        """
        try:
            if not self.send_socket:
                self._setup_sockets()
            
            message = self.create_discovery_message(device_type)
            json_message = json.dumps(message)
            
            # Send direct message to specific IP
            bytes_sent = self.send_socket.sendto(
                json_message.encode('utf-8'),
                (target_ip, self.discovery_port)
            )
            
            logger.info(f"Direct discovery sent to {target_ip}:{self.discovery_port} - {bytes_sent} bytes")
            logger.info(f"Message: {json_message}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send direct discovery to {target_ip}: {e}")
            return False
    
    def send_discovery_broadcast(self, device_type: str = "mesh") -> bool:
        """
        Send device discovery broadcast message
        
        Args:
            device_type: Type of device to discover (default: "mesh")
            
        Returns:
            bool: True if message sent successfully
        """
        try:
            if not self.send_socket:
                self._setup_sockets()
            
            message = self.create_discovery_message(device_type)
            json_message = json.dumps(message)
            
            # Send broadcast message
            bytes_sent = self.send_socket.sendto(
                json_message.encode('utf-8'),
                (self.broadcast_address, self.discovery_port)
            )
            
            logger.info(f"Discovery broadcast sent: {bytes_sent} bytes")
            logger.info(f"Message: {json_message}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send discovery broadcast: {e}")
            return False
    
    def scan_subnet_for_devices(self, subnet: str = "192.168.2.0/24", device_type: str = "mesh") -> List[str]:
        """
        Scan a specific subnet for MANET devices by sending direct discovery messages
        
        Args:
            subnet: Subnet to scan in CIDR notation (e.g., "192.168.2.0/24")
            device_type: Type of device to discover
            
        Returns:
            List[str]: List of responding device IPs
        """
        responding_devices = []
        
        try:
            network = ipaddress.IPv4Network(subnet, strict=False)
            logger.info(f"Scanning subnet {subnet} for {device_type} devices...")
            
            # Send discovery to each IP in the subnet
            for ip in network.hosts():
                ip_str = str(ip)
                logger.debug(f"Sending discovery to {ip_str}")
                
                if self.send_direct_discovery(ip_str, device_type):
                    # Small delay between sends to avoid overwhelming the network
                    time.sleep(0.01)
            
            logger.info(f"Subnet scan complete for {subnet}")
            
        except Exception as e:
            logger.error(f"Error scanning subnet {subnet}: {e}")
        
        return responding_devices

    # ...existing code for other methods...
    
    def send_message_to_device(self, target_ip: str, target_port: int, message: Dict[str, Any]) -> bool:
        """
        Send a specific message to a discovered device
        
        Args:
            target_ip: Target device IP address
            target_port: Target device port
            message: Message dictionary to send
            
        Returns:
            bool: True if message sent successfully
        """
        try:
            if not self.send_socket:
                self._setup_sockets()
            
            json_message = json.dumps(message)
            bytes_sent = self.send_socket.sendto(
                json_message.encode('utf-8'),
                (target_ip, target_port)
            )
            
            logger.info(f"Message sent to {target_ip}:{target_port} - {bytes_sent} bytes")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send message to {target_ip}:{target_port}: {e}")
            return False
    
    def _listen_for_responses(self):
        """
        Listen for incoming UDP responses (runs in separate thread)
        """
        logger.info(f"Started listening for responses on port {self.listen_port}")
        
        while self.is_listening:
            try:
                data, addr = self.listen_socket.recvfrom(4096)
                
                # Parse JSON message
                try:
                    message = json.loads(data.decode('utf-8'))
                    self._handle_received_message(message, addr)
                except json.JSONDecodeError as e:
                    logger.warning(f"Received invalid JSON from {addr}: {e}")
                    logger.debug(f"Raw data: {data}")
                
            except socket.timeout:
                continue  # Normal timeout, continue listening
            except Exception as e:
                if self.is_listening:  # Only log if we're still supposed to be listening
                    logger.error(f"Error in listener: {e}")
    
    def _handle_received_message(self, message: Dict[str, Any], sender_addr: tuple):
        """
        Handle received UDP message
        
        Args:
            message: Parsed JSON message
            sender_addr: (IP, port) tuple of sender
        """
        sender_ip, sender_port = sender_addr
        
        logger.info(f"✓ DEVICE RESPONSE from {sender_ip}:{sender_port}")
        logger.info(f"Message content: {json.dumps(message, indent=2)}")
        
        # Store discovered device
        device_info = {
            'ip': sender_ip,
            'port': sender_port,
            'last_seen': datetime.now().isoformat(),
            'device_info': message,
            'response_message': message
        }
        self.discovered_devices[sender_ip] = device_info
        logger.info(f"✓ Device {sender_ip} added to discovered devices list")
    
    def start_listening(self):
        """Start listening for incoming messages"""
        if self.is_listening:
            logger.warning("Already listening for responses")
            return
        
        try:
            if not self.listen_socket:
                self._setup_sockets()
            
            self.is_listening = True
            self.listener_thread = threading.Thread(target=self._listen_for_responses, daemon=True)
            self.listener_thread.start()
            
            logger.info("Started listening for incoming messages")
            
        except Exception as e:
            logger.error(f"Failed to start listening: {e}")
            self.is_listening = False
    
    def stop_listening(self):
        """Stop listening for incoming messages"""
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join(timeout=2)
        logger.info("Stopped listening for messages")
    
    def get_discovered_devices(self) -> Dict[str, Any]:
        """
        Get list of discovered devices
        
        Returns:
            dict: Dictionary of discovered devices
        """
        return self.discovered_devices.copy()
    
    def test_device_connectivity(self, target_ip: str) -> bool:
        """
        Test connectivity to a specific device using ping
        
        Args:
            target_ip: IP address to test
            
        Returns:
            bool: True if device is reachable
        """
        import subprocess
        try:
            result = subprocess.run(['ping', '-n', '1', target_ip], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Connectivity test failed for {target_ip}: {e}")
            return False
    
    def cleanup(self):
        """Cleanup resources"""
        self.stop_listening()
        
        if self.send_socket:
            self.send_socket.close()
        if self.listen_socket:
            self.listen_socket.close()
        
        logger.info("Cleanup completed")

def main():
    """Main function for testing the enhanced MANET discovery system"""
    print("=== Enhanced MANET Device Discovery System ===")
    print("Multi-network support with direct device targeting\n")
    
    # Initialize enhanced discovery system
    discovery = EnhancedMANETDiscovery()
    
    # Known device for testing
    known_device = "192.168.2.141"
    
    try:
        # Test connectivity to known device
        print(f"1. Testing connectivity to known device {known_device}...")
        if discovery.test_device_connectivity(known_device):
            print(f"✓ Device {known_device} is reachable via ping\n")
        else:
            print(f"✗ Device {known_device} is not reachable\n")
        
        # Start listening for responses
        print("2. Starting response listener...")
        discovery.start_listening()
        print("✓ Listening for device responses\n")
        
        # Send direct discovery to known device
        print(f"3. Sending direct discovery to {known_device}...")
        if discovery.send_direct_discovery(known_device, "mesh"):
            print(f"✓ Direct discovery sent to {known_device}:7000")
        else:
            print(f"✗ Failed to send direct discovery to {known_device}")
        
        # Also try broadcast for good measure
        print("\n4. Sending broadcast discovery...")
        if discovery.send_discovery_broadcast("mesh"):
            print("✓ Broadcast discovery sent")
        else:
            print("✗ Failed to send broadcast discovery")
        
        # Wait for responses
        print("\n5. Waiting for device responses (15 seconds)...")
        for i in range(15):
            time.sleep(1)
            devices = discovery.get_discovered_devices()
            if devices:
                print(f"   Response received after {i+1} seconds!")
                break
            if (i + 1) % 5 == 0:
                print(f"   Still waiting... ({i+1}/15 seconds)")
        
        # Display results
        devices = discovery.get_discovered_devices()
        print(f"\n6. Discovery Results:")
        print(f"   Found {len(devices)} device(s)")
        
        if devices:
            for ip, device_info in devices.items():
                print(f"   ✓ Device: {ip}")
                print(f"     Last seen: {device_info['last_seen']}")
                print(f"     Port: {device_info['port']}")
                print(f"     Response: {device_info['response_message']}")
        else:
            print("   No devices responded")
            print(f"   This could mean:")
            print(f"   - Device {known_device} is not running MANET software")
            print(f"   - Device is not listening on port 7000")
            print(f"   - Firewall is blocking UDP traffic")
            print(f"   - Device expects different message format")
        
        # Interactive mode
        print(f"\n7. Interactive Mode")
        print(f"Commands: 'direct'=send to {known_device}, 'broadcast'=send broadcast, 'list'=show devices, 'q'=quit")
        
        while True:
            user_input = input("Command: ").strip().lower()
            if user_input == 'q':
                break
            elif user_input == 'direct':
                print(f"Sending direct discovery to {known_device}...")
                discovery.send_direct_discovery(known_device, "mesh")
                time.sleep(2)
                devices = discovery.get_discovered_devices()
                print(f"Total devices discovered: {len(devices)}")
            elif user_input == 'broadcast':
                print("Sending broadcast discovery...")
                discovery.send_discovery_broadcast("mesh")
                time.sleep(2)
                devices = discovery.get_discovered_devices()
                print(f"Total devices discovered: {len(devices)}")
            elif user_input == 'list':
                devices = discovery.get_discovered_devices()
                print(f"Discovered devices: {len(devices)}")
                for ip in devices:
                    print(f"  - {ip}")
            else:
                print("Commands: 'direct', 'broadcast', 'list', 'q'")
    
    except KeyboardInterrupt:
        print("\nShutting down...")
    
    finally:
        discovery.cleanup()
        print("System shutdown complete")

if __name__ == "__main__":
    main()