#!/usr/bin/env python3
#Input command ":set fileformat=unix" on new file upload to board
from attributes.BoardDateTime import BoardDateTime
from attributes.CpuUsage import CpuUsage
from attributes.RamUsage import RamUsage
from attributes.SocTemp import SocTemp
from attributes.DriveSpace import DriveSpace
from attributes.Network import Network
from attributes.RadioAttr import RadioAttr
from attributes.CoreAttr import CoreAttr

ping = "192.168.2.10"
CONFIG_FILE_PATH = "/opt/ste/active/commissioning/configs/gNB_webdashboard_config.json"

radio = RadioAttr(CONFIG_FILE_PATH)
core = CoreAttr(CONFIG_FILE_PATH)
boardDateTime = BoardDateTime()
cpu = CpuUsage()
ram = RamUsage()
temp = SocTemp()
driveSpace = DriveSpace()
network = Network(ping)


boardDateTime.print_Current_time()

cpu.refresh()
ram.refresh()
cpu.print_cpu_usage()
ram.print_ram_usage()

driveSpace.refresh()
driveSpace.print_drive_space()

radio.refresh()
core.refresh()
radio.print_attributes()
core.print_attributes()
#core.edit_config("gNBIdLength", "28") //For testing edit functionality

configs = [radio, core]
for config in configs:
    config.refresh()
    config.print_attributes()

