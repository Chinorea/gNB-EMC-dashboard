#!/usr/bin/env python3
#Input command ":set fileformat=unix" on new file upload to board
from attributes.IpAddress import IpAddress
from attributes.BoardDateTime import BoardDateTime
from attributes.BroadcastFrequency import BroadcastFrequency
from attributes.RaptorStatus import RaptorStatus

ip_path = "/cu/config/me_config.xml"
freq_path = "/du/config/gnb_config.xml"
raptor_path = "/logdump/du_log.txt"

ip = IpAddress(ip_path)
boardDateTime = BoardDateTime()
freq = BroadcastFrequency(freq_path)
raptorStatus = RaptorStatus(raptor_path)

boardDateTime.print_Current_time()
ip.refresh()
ip.print_Ip_Status()

freq.refresh()
freq.print_Freq_Status()

raptorStatus.refresh()
raptorStatus.print_Raptor_Status()