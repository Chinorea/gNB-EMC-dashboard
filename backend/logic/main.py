#!/usr/bin/env python3
#Input command ":set fileformat=unix" on new file upload to board
from attributes.IpAddress import IpAddress
from attributes.BoardDateTime import BoardDateTime
from attributes.BroadcastFrequency import BroadcastFrequency

ip_path = "/cu/config/me_config.xml"
freq_path = "/du/config/gnb_config.xml"

ip = IpAddress(ip_path)
boardDateTime = BoardDateTime()
freq = BroadcastFrequency(freq_path)

ip.refresh()
freq.refresh()

boardDateTime.print_Current_time()
ip.print_Ip_Status()
freq.print_Freq_Status()