#!/usr/bin/env python3
from attributes.IpAddress import IpAddress

xml_path = "/cu/config/me_config.xml"
ip = IpAddress(xml_path)

ip.refresh()

ip.print_Ip_Status()