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
import json # ADDED: Import json module

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
    by running the gnb_commission script with automated responses.
    """
    logger = LogManager.get_logger('config_creation') # Moved logger init up

    if os.path.exists(CONFIG_FILE_PATH):
        logger.info(f"Config file {CONFIG_FILE_PATH} found.") # MODIFIED
        return True
    
    logger.info(f"Config file {CONFIG_FILE_PATH} not found. Generating...") # MODIFIED
    
    try:
        # Check if gnb_commission script exists in /opt/ste/bin/
        gnb_commission_path = "/opt/ste/bin/gnb_commission"
        if not os.path.exists(gnb_commission_path):
            logger.error(f"gnb_commission script not found at {gnb_commission_path}")
            return False
        
        # Check if configs directory exists (don't create it)
        config_dir = os.path.dirname(CONFIG_FILE_PATH)
        if not os.path.exists(config_dir):
            logger.error(f"Config directory {config_dir} does not exist")
            return False
        else:
            logger.debug(f"Config directory {config_dir} found") # MODIFIED from info to debug
        
        # Run gnb_commission with -g flag and automated responses
        logger.debug("Starting gnb_commission process with -g flag...") # MODIFIED from info to debug
        proc = pexpect.spawn("gnb_commission -g", timeout=120)
        
        # Log gnb_commission output to a file
        try:
            log_file_path = f"/tmp/gnb_commission_output_{int(time.time())}.log"
            proc.logfile_read = open(log_file_path, "wb")
            logger.debug(f"gnb_commission output will be logged to {log_file_path}")
        except Exception as log_e:
            logger.warning(f"Could not open log file for gnb_commission: {log_e}. Output will not be saved to file.")
            proc.logfile_read = None # Ensure it's None if opening failed

        step_count = 0
        max_steps = 50  # Safety limit to prevent infinite loops
        automation_started = False  # Flag to track when to start automation
        
        while step_count < max_steps:
            try:
                step_count += 1
                logger.debug(f"Step {step_count}: Waiting for prompt...")
                
                if not automation_started:
                    # Look for "Downlink Bandwidth MHz" to start automation
                    index = proc.expect([
                        r"(?i).*downlink bandwidth mhz.*",  # Look for Downlink Bandwidth MHz
                        r".*:.*",  # Any other prompt with colon
                        pexpect.TIMEOUT,
                        pexpect.EOF
                    ], timeout=10)
                else:
                    # After automation started, look for Service Differentiator to stop
                    index = proc.expect([
                        r"(?i).*service differentiator.*",  # Look for Service Differentiator (last prompt)
                        r".*:.*",  # Any other prompt with colon
                        pexpect.TIMEOUT,
                        pexpect.EOF
                    ], timeout=10)
                
                # Log what we received (at debug level)
                if hasattr(proc, 'before') and proc.before:
                    output_text = proc.before.decode('utf-8', errors='ignore')
                    logger.debug(f"Script output: {repr(output_text)}") # MODIFIED from info to debug
                if hasattr(proc, 'after') and proc.after:
                    match_text = proc.after.decode('utf-8', errors='ignore')
                    logger.debug(f"Matched pattern: {repr(match_text)}") # MODIFIED from info to debug
                
                if not automation_started:
                    if index == 0:  # Found "Downlink Bandwidth MHz"
                        logger.debug(f"Found 'Downlink Bandwidth MHz' at step {step_count}, starting automation...") # MODIFIED from info to debug
                        automation_started = True
                        proc.sendline('')  # Press Enter for this prompt
                        time.sleep(0.1)
                        continue
                    elif index == 1:  # Other colon prompt before automation starts - IGNORE
                        logger.debug("Found colon prompt before automation start, IGNORING (not responding)...")
                        continue
                    elif index == 2:  # Timeout
                        logger.debug("Timeout before automation start, continuing...")
                        continue
                    else:  # EOF
                        logger.debug("Process ended with EOF before automation started") # MODIFIED from info to debug
                        break
                else:
                    # Automation has started
                    if index == 0:  # Found "Service Differentiator" (last prompt)
                        logger.debug(f"Found 'Service Differentiator' at step {step_count}, this is the last prompt...") # MODIFIED from info to debug
                        proc.sendline('')  # Press Enter for this final prompt
                        time.sleep(0.1)
                        
                        logger.debug("Service Differentiator complete. Looking for filename prompt to customize...") # MODIFIED from info to debug
                        
                        try:
                            filename_index = proc.expect([
                                r".*filename.*",  # Look for filename prompt
                                pexpect.TIMEOUT,
                                pexpect.EOF
                            ], timeout=15)
                            
                            if filename_index == 0:  # Found filename prompt
                                logger.debug("Found filename prompt, customizing filename...") # MODIFIED from info to debug
                                time.sleep(0.1)
                                logger.debug("Sending Ctrl+U to clear preset filename...") # MODIFIED from info to debug
                                proc.send('\x15')  # Ctrl+U
                                time.sleep(0.2)
                                logger.debug("Typing custom filename: gnb_webdashboard.json") # MODIFIED from info to debug
                                proc.send('gnb_webdashboard.json')
                                time.sleep(0.1)
                                logger.debug("Pressing Enter to confirm filename...") # MODIFIED from info to debug
                                proc.sendline('')
                                time.sleep(0.1)
                                logger.debug("Filename customization complete!") # MODIFIED from info to debug
                            else: # Timeout or EOF
                                logger.warning("No filename prompt found or timeout/EOF occurred during filename customization")
                                
                        except (pexpect.TIMEOUT, pexpect.EOF) as e:
                            logger.warning(f"Exception while looking for filename prompt: {e}")
                        
                        logger.debug("Ignoring any further prompts and waiting for process to end...") # MODIFIED from info to debug
                        
                        try:
                            while True: # Loop to consume any remaining output until EOF
                                final_index = proc.expect([
                                    r".*:.*",  # Any colon prompt - but we'll ignore it
                                    pexpect.TIMEOUT,
                                    pexpect.EOF
                                ], timeout=10)
                                
                                if final_index == 0:  # Colon prompt after Service Differentiator - IGNORE
                                    logger.debug("Found colon prompt after filename handling, IGNORING...")
                                    if hasattr(proc, 'before') and proc.before: # Log ignored output at debug
                                        logger.debug(f"Ignored output: {proc.before.decode('utf-8', errors='ignore')}")
                                    continue
                                elif final_index == 1:  # Timeout
                                    logger.debug("Timeout after filename handling, continuing to wait for EOF...")
                                    continue
                                else:  # EOF
                                    logger.debug("gnb_commission process completed (EOF) after filename handling") # MODIFIED from info to debug
                                    if hasattr(proc, 'before') and proc.before:
                                        final_output = proc.before.decode('utf-8', errors='ignore')
                                        logger.debug(f"Final script output before EOF: {repr(final_output)}") # MODIFIED from info to debug
                                    break 
                        except pexpect.EOF:
                            logger.debug("Process ended with EOF after filename handling (expected)") # MODIFIED from info to debug
                        except pexpect.TIMEOUT:
                            logger.warning("Final timeout after filename handling, process might not have exited cleanly.")
                        break # Exit the main while loop
                        
                    elif index == 1:  # Other colon prompt during automation
                        logger.debug(f"Found colon prompt during automation at step {step_count}, pressing Enter...") # MODIFIED from info to debug
                        proc.sendline('')
                        time.sleep(0.1)
                        continue
                        
                    elif index == 2:  # Timeout during automation
                        logger.debug("Timeout during automation, continuing...")
                        continue
                    else:  # EOF during automation
                        logger.debug("Process ended with EOF during automation") # MODIFIED from info to debug
                        if hasattr(proc, 'before') and proc.before:
                            final_output = proc.before.decode('utf-8', errors='ignore')
                            logger.debug(f"Final script output before EOF: {repr(final_output)}") # MODIFIED from info to debug
                        break
                    
            except pexpect.TIMEOUT:
                logger.debug("Timeout exception in main automation loop, continuing...")
                continue
            except pexpect.EOF:
                logger.debug("Process ended with EOF exception in main automation loop") # MODIFIED from info to debug
                if hasattr(proc, 'before') and proc.before:
                    final_output = proc.before.decode('utf-8', errors='ignore')
                    logger.debug(f"Final script output before EOF: {repr(final_output)}") # MODIFIED from info to debug
                break
        
        if step_count >= max_steps:
            logger.warning(f"Reached maximum steps ({max_steps}) without completing automation.")
        
        try:
            proc.close()
            # Close the log file if it was opened
            if proc.logfile_read and not proc.logfile_read.closed:
                proc.logfile_read.close()
        except Exception as close_e:
            logger.warning(f"Error closing pexpect process or log file: {close_e}")
        
        # Check if the config file was created
        if os.path.exists(CONFIG_FILE_PATH):
            logger.info(f"Successfully generated config file: {CONFIG_FILE_PATH}") # MODIFIED
            
            # Add the profile field to the newly created config file
            try:
                with open(CONFIG_FILE_PATH, 'r') as f:
                    config_data = json.load(f)
                
                if 'profile' not in config_data:
                    config_data['profile'] = "40MHz_MET_2x2"
                    with open(CONFIG_FILE_PATH, 'w') as f:
                        json.dump(config_data, f, indent=4)
                    logger.info("Added profile field to config file: 40MHz_MET_2x2")
                else:
                    logger.info("Profile field already exists in config file")
            except Exception as e:
                logger.error(f"Failed to add profile field to config file: {str(e)}")
            return True
        else:
            logger.error(f"Failed to generate config file: {CONFIG_FILE_PATH}") # MODIFIED
            # Removed listing files in config_dir for brevity
            return False
            
    except Exception as e:
        logger.error(f"Error during config file generation: {str(e)}") # MODIFIED
        # Ensure logfile is closed if open on exception
        if 'proc' in locals() and hasattr(proc, 'logfile_read') and proc.logfile_read and not proc.logfile_read.closed:
            try:
                proc.logfile_read.close()
            except Exception as log_close_e:
                logger.warning(f"Could not close gnb_commission log file on error: {log_close_e}")
        return False

# Initialize attributes
cpu_usage           = CpuUsage()
cpu_temp            = SocTemp()
ram_usage           = RamUsage()
drive_space         = DriveSpace()
board_date_time     = BoardDateTime()
raptor_status       = RaptorStatus("/logdump/du_log.txt")

# Initialize config file check and radio/core attributes at startup
print("Checking for gNB config file at startup...")
if not ensure_config_file_exists():
    raise Exception("Failed to create or access config file during startup")

# Initialize radio and core attributes now that config file exists
print("Initializing radio and core attributes...")
radio = RadioAttr(CONFIG_FILE_PATH)
core = CoreAttr(CONFIG_FILE_PATH)
print("Flask application initialization complete.")

raptor_status_timeout = 3


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/attributes", methods=["GET"])
def get_attributes():
    
    try:
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


