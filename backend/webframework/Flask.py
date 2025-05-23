from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
import subprocess, os, time, signal
from pathlib import Path
from backend.logic.editConfig import update_xml_by_path, read_xml_by_path

from backend.logic.attributes.IpAddress          import IpAddress
from backend.logic.attributes.CpuUsage           import CpuUsage
from backend.logic.attributes.SocTemp            import SocTemp
from backend.logic.attributes.RamUsage           import RamUsage
from backend.logic.attributes.DriveSpace         import DriveSpace
from backend.logic.attributes.BroadcastFrequency import BroadcastFrequency
from backend.logic.attributes.BoardDateTime      import BoardDateTime
from backend.logic.attributes.RaptorStatus       import RaptorStatus
from backend.logic.attributes.Network            import Network
from backend.logic.attributes.TxPower            import TxPower

ip_address          = IpAddress("/cu/config/me_config.xml")
cpu_usage           = CpuUsage()
cpu_temp            = SocTemp()
ram_usage           = RamUsage()
drive_space         = DriveSpace()
broadcast_frequency = BroadcastFrequency("/du/config/gnb_config.xml")
board_date_time     = BoardDateTime()
raptor_status       = RaptorStatus("/logdump/du_log.txt")
tx_power            = TxPower("/du/config/me_config.xml")

raptor_status_timeout = 3


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes", methods=["GET"])
def get_attributes():
    
    # refresh all attributes first
    for attr in (ip_address, cpu_usage, cpu_temp, ram_usage,
                 drive_space, broadcast_frequency, tx_power,
                 board_date_time):
        attr.refresh()

    # then check core connection once
    core_connection = Network(ip_address.ipAddressNgc)
    core_connection.refresh()

    data = {
        "ip_address_gnb":      ip_address.ipAddressGnb,
        "ip_address_ngc":      ip_address.ipAddressNgc,
        "ip_address_ngu":      ip_address.ipAddressNgu,
        "gnb_id":              ip_address.gnb_Id,
        "gnb_pci":             ip_address.gnb_Pci[0],
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
        "board_date":          board_date_time.boardDate,
        "board_time":          board_date_time.boardTime,
        "core_connection":     core_connection.networkStatus.name,
        "tx_power":            tx_power.tx_power,
    }
    return jsonify(data)

@app.route("/api/node_status", methods=["GET"])
def get_raptor_status():
    raptor_status.refresh()
    return jsonify({
        "node_status": raptor_status.raptorStatus.name
    }), 200

# Map of allowed “actions” to the real commands
ACTIONS = {
    "setup": ["python3", "/webdashboard/setup_drive.py"],
    "setupv2": ["gnb_ctl", "start"],
    "stop" : ["gnb_ctl", "stop"]
}

@app.route("/api/setup_script", methods=["POST"])
def setup_script():
    MAX_WAIT = 120
    data   = request.get_json(force=True, silent=True) or {}
    action = data.get("action")

    if action not in ACTIONS:
        return jsonify({"error": f"Unknown action '{action}'."}), 400

    cmd = ACTIONS[action]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    # STOP: wait for clean exit
    if action == "stop":
        out, err = proc.communicate()
        return jsonify({
            "action": action,
            "status": "stopped",
            "output": out.strip()
        }), 200

    # SETUP/START: stream stdout until CELL_IS_UP or timeout
    import time, signal
    start    = time.time()
    collected = []

    while True:
        line = proc.stdout.readline()
        if line:
            collected.append(line)
            if "CELL_IS_UP" in line:
                # success: send Ctrl-C and return immediately
                proc.send_signal(signal.SIGINT)
                proc.wait(timeout=2)
                return jsonify({
                    "action": action,
                    "status": "ok",
                    "output": "".join(collected).strip()
                }), 200
        else:
            # no new output yet → check timeout
            if time.time() - start > MAX_WAIT:
                proc.send_signal(signal.SIGINT)
                return jsonify({
                    "action": action,
                    "error": "timeout",
                    "details": f"No CELL_IS_UP in {MAX_WAIT}s"
                }), 504
            # else loop again

    # (the loop always returns)

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

# Map logical field names → (file path, xml xpath)
XML_MAPPING = {
    "gnbIP": {
        "file": Path("/cu/config/me_config.xml"),
        "xpath": "GNBCUFunction/EP_NgC/localIpAddress"
    },
    "PCI": {
        "file": Path("/cu/config/me_config.xml"),
        "xpath": "GNBCUFunction/DPCIConfigurationFunction/nRPciList/NRPci"
    },
    "gnbId": {
        "file": Path("/cu/config/me_config.xml"),
        "xpath": "GNBCUFunction/gNBId"
    },
    "ngcIp": {
        "file": Path("/cu/config/me_config.xml"),
        "xpath": "GNBCUFunction/EP_NgC/remoteAddress"
    },
    "nguIp": {
        "file": Path("/cu/config/me_config.xml"),
        "xpath": "GNBCUFunction/EP_NgU/remoteAddress"
    },
    "ulFreq": {
        "file": Path("/du/config/gnb_config.xml"),
        "xpath": "gnbDuCfg/gnbCellDuVsCfg/l1-CfgInfo/nUlCenterFreq"
    },
    "dlFreq": {
        "file": Path("/du/config/gnb_config.xml"),
        "xpath": "gnbDuCfg/gnbCellDuVsCfg/l1-CfgInfo/nDlCenterFreq"
    },
    "maxTx": {
        "file": Path("/du/config/me_config.xml"),
        "xpath": "GNBDUFunction/NRSectorCarrier/configuredMaxTxPower"
    }
    # …your other writable fields…
}

@app.route("/api/config", methods=["POST"])
def set_config():
    """
    Expects JSON { "field":"gnbIP", "value":"1.2.3.4" }
    """
    data = request.get_json(force=True)
    field = data.get("field")
    val   = data.get("value")

    if field not in XML_MAPPING:
        return jsonify({"error": f"Unknown field '{field}'"}), 400

    spec = XML_MAPPING[field]
    try:
        update_xml_by_path(spec["file"], { spec["xpath"]: val })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"field": field, "value": val}), 200

@app.route("/api/config", methods=["GET"])
def get_config():
    """
    Returns a JSON mapping each writable field in XML_MAPPING to its current value.
    """
    snapshot = {}
    for field, spec in XML_MAPPING.items():
        try:
            # read_xml_by_path returns { xpath: [list of matches] }
            values = read_xml_by_path(spec["file"], [spec["xpath"]])[spec["xpath"]]
            # if multiple nodes match, we take the first; else None
            snapshot[field] = values[0] if values else None
        except Exception as e:
            # on error (file missing, parse error, etc.) report null
            snapshot[field] = None

    return jsonify(snapshot), 200

