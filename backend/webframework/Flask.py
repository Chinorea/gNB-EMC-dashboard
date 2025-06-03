from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
import subprocess, os, time, signal
from pathlib import Path
from backend.logic.editConfig import update_xml_by_path, read_xml_by_path
import pexpect
from backend.logic.setupLogManger import LogManager
import threading
import os
import datetime
import re

# Import fcntl for non-blocking I/O
import fcntl

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

# Map of allowed "actions" to the real commands
ACTIONS = {
    "setupv2": ["gnb_ctl", "start"],
    "start": ["gnb_ctl", "start"],
    "stop": ["gnb_ctl", "stop"],
    "status": ["gnb_ctl", "status"]
}

# Define a log directory for command outputs
CMD_LOG_DIR = "/webdashboard/logdump"
if not os.path.exists(CMD_LOG_DIR):
    try:
        os.makedirs(CMD_LOG_DIR)
    except:
        # Fallback to local logs directory if not writable
        CMD_LOG_DIR = "logs"
        if not os.path.exists(CMD_LOG_DIR):
            os.makedirs(CMD_LOG_DIR)

@app.route("/api/setup_script", methods=["POST"])
def setup_script():
    MAX_WAIT = 120  # seconds
    data = request.get_json(force=True, silent=True) or {}
    action = data.get("action")
    logger = LogManager.get_logger('setup_script')

    if action not in ACTIONS:
        return jsonify({"error": f"Unknown action '{action}'"}), 400

    cmd = ACTIONS[action]
    logger.info(f"Executing action '{action}' with command: {' '.join(cmd)}")
    
    # Use a consistent log file name
    log_filename = "setup_log.txt"
    log_filepath = os.path.join(CMD_LOG_DIR, log_filename)
    
    # Clear the log file if this is a start command (setupv2 or start)
    if action in ["setupv2", "start"]:
        try:
            # Make sure the directory exists
            os.makedirs(os.path.dirname(log_filepath), exist_ok=True)
            # Clear the file by opening it with 'w' mode and immediately closing
            open(log_filepath, 'w').close()
            logger.info(f"Cleared log file {log_filepath} for {action} command")
        except Exception as e:
            logger.error(f"Failed to clear log file: {str(e)}")
    
    try:
        # Open the log file (in append mode since we may have cleared it already)
        with open(log_filepath, 'a') as log_file:
            # Write a header to the log file
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"=== {action} command started at {timestamp} ===\n")
            log_file.flush()
            
            # Start the process with output redirected to the log file
            proc = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=log_file,
                text=True,
                bufsize=1,  # Line buffered
                universal_newlines=True  # Ensures text mode works consistently
            )
            
            logger.info(f"Process started. Output being logged to {log_filepath}")
            
            # For stop and status commands, just wait for completion
            if action in ["stop", "status"]:
                try:
                    proc.wait(timeout=MAX_WAIT)
                    # Read the log file to get output
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    logger.info(f"Action '{action}' completed with no issue, exit code 0")
                    return jsonify({
                        "action": action,
                        "status": "completed",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": 0  # Always return 0 for stop and status commands
                    }), 200
                except subprocess.TimeoutExpired:
                    logger.warning(f"Action '{action}' timed out. Killing process.")
                    proc.kill()
                    proc.wait()  # Make sure it's dead
                    
                    # Read partial output
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    return jsonify({
                        "action": action,
                        "error": "timeout",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": -1
                    }), 504
            
            # For start/setup actions, monitor the log file for "CELL_IS_UP"
            start_time = time.time()
            
            # Monitor the log file for the "CELL_IS_UP" marker
            while True:
                # Check for timeout first
                if time.time() - start_time > MAX_WAIT:
                    logger.warning(f"Timeout: No CELL_IS_UP in {MAX_WAIT}s.")
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait()
                    
                    # Get the content from the log file
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    return jsonify({
                        "action": action,
                        "error": "timeout",
                        "details": f"No CELL_IS_UP in {MAX_WAIT}s",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": -1
                    }), 504
                
                # Check if the process has terminated
                if proc.poll() is not None:
                    # Process has exited, read the log file
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    # Check if "CELL_IS_UP" is in the output
                    if "CELL_IS_UP" in output:
                        logger.info("CELL_IS_UP detected in log.")
                        return jsonify({
                            "action": action,
                            "status": "ok",
                            "output": output.strip(),
                            "log_file": log_filepath,
                            "exit_code": 0
                        }), 200
                    else:
                        logger.warning(f"Process terminated prematurely with code {proc.returncode}.")
                        return jsonify({
                            "action": action,
                            "error": "process_terminated_unexpectedly",
                            "details": f"Process terminated (code {proc.returncode}) before CELL_IS_UP was detected.",
                            "output": output.strip(),
                            "log_file": log_filepath,
                            "exit_code": proc.returncode
                        }), 500
                
                # Check the log file for "CELL_IS_UP" without loading the whole thing
                try:
                    with open(log_filepath, 'r') as f:
                        # Read the last 4KB of the file to check for the marker
                        f.seek(0, os.SEEK_END)
                        file_size = f.tell()
                        offset = max(0, file_size - 4096)  # Last 4KB
                        f.seek(offset, os.SEEK_SET)
                        recent_content = f.read()
                        
                        if "CELL_IS_UP" in recent_content:
                            logger.info("CELL_IS_UP detected in log.")
                            proc.terminate()
                            try:
                                proc.wait(timeout=5)
                            except subprocess.TimeoutExpired:
                                proc.kill()
                        
                            # Get the full content
                            with open(log_filepath, 'r') as full_f:
                                output = full_f.read()
                        
                            return jsonify({
                                "action": action,
                                "status": "ok", 
                                "output": output.strip(),
                                "log_file": log_filepath,
                                "exit_code": proc.returncode
                            }), 200
                except Exception as e:
                    logger.error(f"Error reading log file: {str(e)}")
                
                # Sleep briefly before checking again
                time.sleep(0.5)

    except Exception as e:
        logger.error(f"Error in setup_script: {str(e)}")
        if 'proc' in locals():
            try:
                proc.kill()
            except:
                pass
        return jsonify({
            "action": action,
            "error": "execution_error",
            "details": str(e),
            "exit_code": -2
        }), 500

# map a URL‐friendly key to the real filesystem path
FILE_PATHS = {
    "cu_log":     "/logdump/cu_log.txt",
    "du_log":     "/logdump/du_log.txt",
    "setup_log": "/webdashboard/logdump/setup_log.txt",
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
        "paths": {
            "ngc": "GNBCUFunction/EP_NgC/localIpAddress",
            "ngu": "GNBCUFunction/EP_NgU/localIpAddress"
        }
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
    For gnbIP, updates both NgC and NgU local IP addresses
    """
    data = request.get_json(force=True)
    field = data.get("field")
    val = data.get("value")

    if field not in XML_MAPPING:
        return jsonify({"error": f"Unknown field '{field}'"}), 400

    spec = XML_MAPPING[field]
    try:
        if field == "gnbIP":
            # For gnbIP, update both paths with the same value
            updates = {path: val for path in spec["paths"].values()}
            update_xml_by_path(spec["file"], updates)
        else:
            # For other fields, update single xpath
            update_xml_by_path(spec["file"], {spec["xpath"]: val})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"field": field, "value": val}), 200

@app.route("/api/config", methods=["GET"])
def get_config():
    """
    Returns a JSON mapping each writable field in XML_MAPPING to its current value.
    For gnbIP, returns the NgC local IP address value.
    """
    snapshot = {}
    for field, spec in XML_MAPPING.items():
        try:
            if field == "gnbIP":
                # For gnbIP, read NgC path (both NgC and NgU should have same value)
                ngc_path = spec["paths"]["ngc"]
                values = read_xml_by_path(spec["file"], [ngc_path])[ngc_path]
                snapshot[field] = values[0] if values else None
            else:
                values = read_xml_by_path(spec["file"], [spec["xpath"]])[spec["xpath"]]
                snapshot[field] = values[0] if values else None
        except Exception as e:
            # on error (file missing, parse error, etc.) report null
            snapshot[field] = None

    return jsonify(snapshot), 200