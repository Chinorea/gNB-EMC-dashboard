from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
import subprocess, os, time, signal
from pathlib import Path
import pexpect
from logic.setupLogManger import LogManager
import threading
import os
import datetime
import re

# Import fcntl for non-blocking I/O
import fcntl

# Configuration constants
CONFIG_FILE_PATH = "/opt/ste/active/commissioning/configs/gnb_webdashboard.json"

from logic.attributes.CpuUsage           import CpuUsage
from logic.attributes.SocTemp            import SocTemp
from logic.attributes.RamUsage           import RamUsage
from logic.attributes.DriveSpace         import DriveSpace
from logic.attributes.BoardDateTime      import BoardDateTime
from logic.attributes.RaptorStatus       import RaptorStatus
from logic.attributes.Network            import Network
from logic.attributes.CoreAttr           import CoreAttr
from logic.attributes.RadioAttr          import RadioAttr

def ensure_config_file_exists():
    """
    Ensure the gNB config file exists. If it doesn't, automatically create it
    by running the GNBCommission script with automated responses.
    """
    if os.path.exists(CONFIG_FILE_PATH):
        return True  # File already exists
    
    logger = LogManager.get_logger('config_creation')
    logger.info(f"Config file {CONFIG_FILE_PATH} not found. Running GNBCommission to create it...")
    
    try:
        # Change to the commissioning directory
        commission_dir = "/opt/ste/active/commissioning"
        
        # Check if GNBCommission exists
        gnb_commission_path = os.path.join(commission_dir, "GNBCommission")
        if not os.path.exists(gnb_commission_path):
            logger.error(f"GNBCommission script not found at {gnb_commission_path}")
            return False
        
        # Make sure configs directory exists
        config_dir = os.path.dirname(CONFIG_FILE_PATH)
        os.makedirs(config_dir, exist_ok=True)
        
        # Run GNBCommission with automated responses
        logger.info("Starting GNBCommission process...")
        proc = pexpect.spawn("python3 GNBCommission", cwd=commission_dir, timeout=120)
        
        # Keep pressing enter until we reach the "Select output filename" prompt
        step_count = 0
        max_steps = 50  # Safety limit to prevent infinite loops
        
        while step_count < max_steps:
            try:
                step_count += 1
                logger.debug(f"Step {step_count}: Waiting for prompt...")
                
                index = proc.expect([
                    r"[Ss]elect output filename.*:.*",  # Look for filename selection prompt
                    r"filename.*:.*",  # Alternative filename prompt pattern
                    r"Enter.*filename.*:.*",  # Another filename prompt pattern
                    r".*:.*",  # Any prompt ending with colon
                    pexpect.TIMEOUT,
                    pexpect.EOF
                ], timeout=10)
                
                if index in [0, 1, 2]:  # Found filename prompt
                    logger.info(f"Found filename prompt at step {step_count}")
                    
                    # Send backspaces to clear existing name (200 times as requested)
                    logger.info("Clearing existing filename...")
                    for _ in range(200):
                        proc.send('\b')  # Send backspace
                      # Send the new filename
                    proc.sendline('gnb_webdashboard')
                    logger.info("Sent filename: gnb_webdashboard")
                    
                    # Wait for the process to complete
                    try:
                        proc.expect(pexpect.EOF, timeout=60)
                        logger.info("GNBCommission process completed")
                    except pexpect.TIMEOUT:
                        logger.warning("Process completion timeout, but continuing...")
                    break
                    
                elif index == 3:  # Other prompt - send enter
                    logger.debug("Found generic prompt, sending enter...")
                    proc.sendline('')
                    continue
                    
                elif index == 4:  # Timeout - probably waiting for input
                    logger.debug("Timeout, sending enter...")
                    proc.sendline('')
                    continue
                    
                else:  # EOF - process ended
                    logger.info("Process ended with EOF")
                    break
                    
            except pexpect.TIMEOUT:
                logger.debug("Timeout exception, sending enter...")
                proc.sendline('')
                continue
            except pexpect.EOF:
                logger.info("Process ended with EOF exception")
                break
        
        if step_count >= max_steps:
            logger.warning(f"Reached maximum steps ({max_steps}) without finding filename prompt")
        
        try:
            proc.close()
        except:
            pass  # Ignore close errors
          # Check if the config file was created
        if os.path.exists(CONFIG_FILE_PATH):
            logger.info(f"Successfully created config file: {CONFIG_FILE_PATH}")
            
            # Add the profile field to the newly created config file
            try:
                import json
                
                # Read the existing config file
                with open(CONFIG_FILE_PATH, 'r') as f:
                    config_data = json.load(f)
                
                # Add the profile field if it doesn't exist
                if 'profile' not in config_data:
                    config_data['profile'] = "40MHz_MET_2x2"
                    
                    # Write the updated config back to the file
                    with open(CONFIG_FILE_PATH, 'w') as f:
                        json.dump(config_data, f, indent=4)
                    
                    logger.info("Added profile field to config file: 40MHz_MET_2x2")
                else:
                    logger.info("Profile field already exists in config file")
                    
            except Exception as e:
                logger.error(f"Failed to add profile field to config file: {str(e)}")
                # Don't return False here as the config file was created successfully
            
            return True
        else:
            logger.error("Config file was not created despite running GNBCommission")
            # Try to list files in the configs directory for debugging 
            try:
                configs_dir = os.path.dirname(CONFIG_FILE_PATH)
                if os.path.exists(configs_dir):
                    files = os.listdir(configs_dir)
                    logger.info(f"Files in {configs_dir}: {files}")
            except Exception as e:
                logger.error(f"Could not list config directory: {e}")
            return False
            
    except Exception as e:
        logger.error(f"Error running GNBCommission: {str(e)}")
        return False

# Initialize attributes
cpu_usage           = CpuUsage()
cpu_temp            = SocTemp()
ram_usage           = RamUsage()
drive_space         = DriveSpace()
board_date_time     = BoardDateTime()
raptor_status       = RaptorStatus("/logdump/du_log.txt")

# Initialize radio and core as None - will be created when needed
radio = None
core = None

def get_or_create_config_attributes():
    """
    Get radio and core attributes, creating them if needed.
    This function ensures the config file exists before creating the attributes.
    """
    global radio, core
    
    # Ensure config file exists
    if not ensure_config_file_exists():
        raise Exception("Failed to create or access config file")
    
    # Create attributes if they don't exist
    if radio is None:
        radio = RadioAttr(CONFIG_FILE_PATH)
    if core is None:
        core = CoreAttr(CONFIG_FILE_PATH)
    
    return radio, core

raptor_status_timeout = 3


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes", methods=["GET"])
def get_attributes():
    
    try:
        # Get or create config-dependent attributes
        radio, core = get_or_create_config_attributes()
        
        # refresh all attributes first
        for attr in (core, radio, cpu_usage, cpu_temp, ram_usage,
                     drive_space, board_date_time):
            attr.refresh()
        
        # then check core connection once
        core_connection = Network(core.ngc_Ip)
        core_connection.refresh()

        data = {
            "gnb_id":              radio.gnb_Id,
            "gnb_id_length":       radio.gnb_Id_Length,
            "nr_band":             radio.nr_Band,
            "scs":                 radio.scs,
            "tx_power":            radio.tx_Power,
            "frequency_down_link": radio.dl_centre_frequency,

            "ip_address_gnb":      core.gnb_Ngu_Ip,
            "ip_address_ngc":      core.ngc_Ip,        
            "ip_address_ngu":      core.ngu_Ip,
            "MCC":                 core.MCC,
            "MNC":                 core.MNC,
            "cell_id":             core.cell_Id,
            "nr_tac":              core.nr_Tac,
            "sst":                 core.sst,
            "sd":                  core.sd,
            "profile":             core.profile,

            "cpu_usage":           cpu_usage.cpuUsage,
            "cpu_usage_history":   list(cpu_usage.usage_history),
            "cpu_temp":            cpu_temp.core_temp,
            "ram_usage":           ram_usage.ramUsage,
            "ram_usage_history":   list(ram_usage.usage_history),
            "ram_total":           ram_usage.totalRam,

            "drive_total":         drive_space.drive_data[0],
            "drive_used":          drive_space.drive_data[1],
            "drive_free":          drive_space.drive_data[2],

            "board_date":          board_date_time.boardDate,
            "board_time":          board_date_time.boardTime,
            "core_connection":     core_connection.networkStatus.name,
        }
        return jsonify(data)
        
    except Exception as e:
        return jsonify({"error": f"Failed to get attributes: {str(e)}"}), 500

@app.route("/api/node_status", methods=["GET"])
def get_raptor_status():
    raptor_status.refresh()
    return jsonify({
        "node_status": raptor_status.raptorStatus.name
    }), 200

# Map of allowed "actions" to the real commands
ACTIONS = {
    "setupv2": ["gnb_ctl", "start"],
    "start": ["/opt/ste/bin/gnb_ctl", "-c", CONFIG_FILE_PATH, "start"],
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
                        logger.info("Setup is successful, gNB is now active")
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
                            logger.info("Setup is successful, gNB is now active")
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

@app.route("/api/config", methods=["POST"])
def set_config():
    """
    Expects JSON { "field":"gnbIP", "value":"1.2.3.4" }
    """
    try:
        data = request.get_json(force=True)
        field = data.get("field")
        val = data.get("value")

        # Get or create config-dependent attributes
        radio, core = get_or_create_config_attributes()

        if radio.edit_config(field, val):
            # create success response
            return jsonify({
                "status": "success",
                "message": f"Updated {field} to {val}"
            }), 200
        else:
            # create error response
            return jsonify({
                "status": "error",
                "message": f"Failed to update {field} to {val}"
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to set config: {str(e)}"
        }), 500


