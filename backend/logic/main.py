#!/usr/bin/env python3
#Input command ":set fileformat=unix" on new file upload to board
from attributes.IpAddress import IpAddress
from attributes.BoardDateTime import BoardDateTime

xml_path = "/cu/config/me_config.xml"
ip = IpAddress(xml_path)
boardDateTime = BoardDateTime()

ip.refresh()

boardDateTime.print_Current_time()
ip.print_Ip_Status()