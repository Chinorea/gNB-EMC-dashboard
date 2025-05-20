from flask import Flask, jsonify
from flask_cors import CORS

from backend.logic.attributes.IpAddress          import IpAddress
from backend.logic.attributes.CpuUsage           import CpuUsage
from backend.logic.attributes.SocTemp            import SocTemp
from backend.logic.attributes.RamUsage           import RamUsage
from backend.logic.attributes.DriveSpace         import DriveSpace
from backend.logic.attributes.BroadcastFrequency import BroadcastFrequency
from backend.logic.attributes.BoardDateTime      import BoardDateTime
from backend.logic.attributes.RaptorStatus       import RaptorStatus
from backend.logic.attributes.Network            import Network

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes", methods=["GET"])
def get_attributes():
    ip_address          = IpAddress("/cu/config/me_config.xml")
    cpu_usage           = CpuUsage()
    cpu_temp            = SocTemp()
    ram_usage           = RamUsage()
    drive_space         = DriveSpace()
    broadcast_frequency = BroadcastFrequency("/du/config/gnb_config.xml")
    board_date_time     = BoardDateTime()
    raptor_status       = RaptorStatus("/logdump/du_log.txt")
    core_connection     = Network(ip_address.ipAddressNgc)

    # refresh all
    for attr in (ip_address, cpu_usage, cpu_temp, ram_usage, drive_space,
                 broadcast_frequency, board_date_time, raptor_status, core_connection):
        attr.refresh()

    data = {
        "ip_address_gnb":      ip_address.ipAddressGnb,
        "ip_address_ngc":      ip_address.ipAddressNgc,
        "ip_address_ngu":      ip_address.ipAddressNgu,
        "cpu_usage":           cpu_usage.cpuUsage,
        "cpu_temp":            cpu_temp.core_temp,
        "ram_usage":           ram_usage.ramUsage,
        "ram_total":           ram_usage.totalRam,
        "drive_space":         drive_space.drive_data,
        "frequency_down_link": broadcast_frequency.frequencyDownLink,
        "frequency_up_link":   broadcast_frequency.frequencyUpLink,
        "bandwidth_down_link": broadcast_frequency.downLinkBw,
        "bandwidth_up_link":   broadcast_frequency.upLinkBw,
        "gnb_id":              ip_address.gnb_Id,
        "board_date":          board_date_time.boardDate,
        "board_time":          board_date_time.boardTime,
        "raptor_status":       raptor_status.raptorStatus.name,
        "core_connection":     core_connection.networkStatus.name,
    }
    return jsonify(data)