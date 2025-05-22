from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
import subprocess, os

from backend.logic.attributes.IpAddress          import IpAddress
from backend.logic.attributes.CpuUsage           import CpuUsage
from backend.logic.attributes.SocTemp            import SocTemp
from backend.logic.attributes.RamUsage           import RamUsage
from backend.logic.attributes.DriveSpace         import DriveSpace
from backend.logic.attributes.BroadcastFrequency import BroadcastFrequency
from backend.logic.attributes.BoardDateTime      import BoardDateTime
from backend.logic.attributes.RaptorStatus       import RaptorStatus
from backend.logic.attributes.Network            import Network

ip_address          = IpAddress("/cu/config/me_config.xml")
cpu_usage           = CpuUsage()
cpu_temp            = SocTemp()
ram_usage           = RamUsage()
drive_space         = DriveSpace()
broadcast_frequency = BroadcastFrequency("/du/config/gnb_config.xml")
board_date_time     = BoardDateTime()
raptor_status       = RaptorStatus("/logdump/du_log.txt")


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes", methods=["GET"])
def get_attributes():
    
    # refresh all attributes first
    for attr in (ip_address, cpu_usage, cpu_temp, ram_usage,
                 drive_space, broadcast_frequency,
                 board_date_time, raptor_status):
        attr.refresh()

    # then check core connection once
    core_connection = Network(ip_address.ipAddressNgc)
    core_connection.refresh()

    data = {
        "ip_address_gnb":      ip_address.ipAddressGnb,
        "ip_address_ngc":      ip_address.ipAddressNgc,
        "ip_address_ngu":      ip_address.ipAddressNgu,
        "cpu_usage":           cpu_usage.cpuUsage,
        "cpu_usage_history":   list(cpu_usage.usage_history),
        "cpu_temp":            cpu_temp.core_temp,
        "ram_usage":           ram_usage.ramUsage,
        "ram_usage_history":   list(ram_usage.usage_history),
        "ram_total":           ram_usage.totalRam,
        "drive_total":         drive_space.drive_data[0],
        "drive_used":          drive_space.drive_data[1],
        "drive_free":          drive_space.drive_data[2],
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

# Map of allowed “actions” to the real commands
ACTIONS = {
    "setup": ["python3", "/webdashboard/setup_drive.py"],
    "setupv2": ["gnb_ctl", "start"]
}

@app.route("/api/setup_script", methods=["POST"])
def setup_script():
    data = request.get_json(force=True, silent=True) or {}
    action = data.get("action")
    if action not in ACTIONS:
        return jsonify({"error": f"Unknown action '{action}'."}), 400

    cmd = ACTIONS[action]
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return jsonify({
            "action": action,
            "output": result.stdout.strip()
        }), 200

    except subprocess.CalledProcessError as e:
        return jsonify({
            "action": action,
            "error": f"Exit {e.returncode}",
            "stderr": e.stderr.strip()
        }), 500


# map a URL‐friendly key to the real filesystem path
FILE_PATHS = {
    "cu_log":     "/logdump/cu_log.txt",
    "du_log":     "/logdump/du_log.txt",
}

@app.route("/api/download/<file_key>", methods=["GET"])
def download_file(file_key):
    """
    Download one of the pre-registered files.
    e.g. /api/download/cu_log  or  /api/download/du_log
    """
    file_path = FILE_PATHS.get(file_key)
    # 1) key must exist
    if file_path is None:
        return jsonify({"error": f"Unknown file key '{file_key}'"}), 404

    # 2) file must exist on disk
    if not os.path.isfile(file_path):
        return jsonify({"error": f"File not found on server: {file_path}"}), 404

    # 3) send it as an attachment (will trigger Save‐As in the browser)
    return send_file(
        file_path,
        as_attachment=True,
        download_name=os.path.basename(file_path),
        mimetype="text/plain",
    )
