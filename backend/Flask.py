from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS
import subprocess, os, time, signal
from pathlib import Path
import pexpect
from logic.setupLogManger import LogManager
import threading
import datetime
import re
import json
import socket
import platform
import sys

# Import fcntl for non-blocking I/O
import fcntl

# Try to import psutil for system info
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

# Import board factory and config manager
from board_factory import BoardFactory
from config_manager import BoardConfigManager
from logic.shared_attributes.Network import Network
import sys

# Check if we're running in a test environment
def is_testing():
    """Check if we're running in a test environment"""
    return 'pytest' in sys.modules or 'unittest' in sys.modules or any('test' in arg for arg in sys.argv)

# Check if we're running in a test environment
def is_testing():
    """Check if we're running in a test environment"""
    return 'pytest' in sys.modules or 'unittest' in sys.modules or any('test' in arg for arg in sys.argv)

# Initialize board based on command line args or auto-detection (defaults to EdgeQ)
if is_testing():
    # For testing, use default EdgeQ board without parsing args
    board_type = 'edgeq'
    current_board = BoardFactory.create_board(board_type)
else:
    # Normal execution - parse command line arguments
    board_type = BoardFactory.parse_board_from_args()
    current_board = BoardFactory.create_board(board_type)

# Initialize config manager
config_manager = BoardConfigManager(current_board)

# Set up LogManager with board config as single source of truth
LogManager.set_config_manager(config_manager)

print(f"Initializing {current_board.get_board_name()} board...")
print(f"Board type: {board_type if board_type else 'auto-detected'}")

# Initialize config file check using board-specific logic
print("Checking for gNB config file at startup...")
if not current_board.ensure_config_exists():
    raise Exception("Failed to create or access config file during startup")

# Initialize board-specific attributes
print("Initializing board attributes...")
attributes = current_board.create_attributes()

# Extract commonly used attributes for easier access
radio = attributes['radio']
core = attributes['core']
cpu_usage = attributes['cpu_usage']
cpu_temp = attributes['cpu_temp']
ram_usage = attributes['ram_usage']
drive_space = attributes['drive_space']
board_date_time = attributes['board_date_time']
raptor_status = attributes['raptor_status']

# Get board-specific configuration values
raptor_status_timeout = config_manager.get_config_value('timeouts.raptor_status', 3)
CMD_LOG_DIR = config_manager.get_config_value('log_directory')  # Remove incorrect fallback

# Ensure log directory exists
if not os.path.exists(CMD_LOG_DIR):
    try:
        os.makedirs(CMD_LOG_DIR)
    except:
        # Fallback to local logs directory if not writable
        CMD_LOG_DIR = "logs"
        if not os.path.exists(CMD_LOG_DIR):
            os.makedirs(CMD_LOG_DIR)

print(f"Using log directory: {CMD_LOG_DIR}")

# Initialize API logging
API_LOG_FILENAME = "api_logs.txt"
API_LOG_FILEPATH = os.path.join(CMD_LOG_DIR, API_LOG_FILENAME)

# Create/clear the API log file on startup for a fresh logging session
try:
    # Make sure the directory exists
    os.makedirs(os.path.dirname(API_LOG_FILEPATH), exist_ok=True)
    # Clear the file by opening it with 'w' mode and immediately closing
    with open(API_LOG_FILEPATH, 'w') as api_log_file:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        api_log_file.write(f"=== API Logging Session Started at {timestamp} ===\n")
    print(f"API logging initialized: {API_LOG_FILEPATH}")
except Exception as e:
    print(f"Warning: Failed to initialize API log file: {str(e)}")

def log_api_request(endpoint, method, request_data=None, response_data=None, status_code=None, error=None):
    """Log API requests and responses to the API log file in Apache-style format"""
    try:
        # Get client IP address
        client_ip = request.remote_addr if request else "unknown"
        
        # Format timestamp like Apache logs
        timestamp = datetime.datetime.now().strftime("%d/%b/%Y %H:%M:%S")
        
        # Format the log entry in Apache Common Log Format style
        # client_ip - - [timestamp] "METHOD /endpoint HTTP/1.1" status_code -
        log_entry = f'{client_ip} - - [{timestamp}] "{method} {endpoint} HTTP/1.1" {status_code or "000"} -\n'
        
        with open(API_LOG_FILEPATH, 'a') as api_log_file:
            api_log_file.write(log_entry)
            api_log_file.flush()  # Ensure immediate write to file
            
    except Exception as e:
        # Don't let logging errors break the API
        print(f"Warning: Failed to write to API log: {str(e)}")

print(f"Flask application initialization complete for {current_board.get_board_name()}.")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/board-info", methods=["GET"])
def get_board_info():
    """Get current board information and configuration"""
    try:
        response_data = {
            "board_type": current_board.get_board_name(),
            "config_path": current_board.get_config_file_path(),
            "log_directory": config_manager.get_config_value('log_directory'),
            "available_files": list(current_board.get_file_paths().keys()),
            "timeouts": config_manager.get_config_value('timeouts')
        }
        
        log_api_request("/api/board-info", "GET", response_data=response_data, status_code=200)
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Failed to get board info: {str(e)}"
        log_api_request("/api/board-info", "GET", error=error_msg, status_code=500)
        return jsonify({"error": error_msg}), 500

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
        
        log_api_request("/api/attributes", "GET", response_data=data, status_code=200)
        return jsonify(data)
        
    except Exception as e:
        error_msg = f"Failed to get attributes: {str(e)}"
        log_api_request("/api/attributes", "GET", error=error_msg, status_code=500)
        return jsonify({"error": error_msg}), 500

@app.route("/api/node_status", methods=["GET"])
def get_raptor_status():
    try:
        raptor_status.refresh()
        response_data = {
            "node_status": raptor_status.raptorStatus.name
        }
        
        log_api_request("/api/node_status", "GET", response_data=response_data, status_code=200)
        return jsonify(response_data), 200
        
    except Exception as e:
        error_msg = f"Failed to get raptor status: {str(e)}"
        log_api_request("/api/node_status", "GET", error=error_msg, status_code=500)
        return jsonify({"error": error_msg}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Minimal health check endpoint for fast network discovery"""
    try:
        response_data = {"status": "online"}
        log_api_request("/api/health", "GET", response_data=response_data, status_code=200)
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Health check failed: {str(e)}"
        log_api_request("/api/health", "GET", error=error_msg, status_code=500)
        return jsonify({"error": error_msg}), 500

@app.route("/api/setup_script", methods=["POST"])
def setup_script():
    # Use board-specific configuration
    MAX_WAIT = config_manager.get_config_value('timeouts.setup_max_wait', 120)
    data = request.get_json(force=True, silent=True) or {}
    action = data.get("action")
    logger = LogManager.get_logger('setup_script')

    # Log the incoming request
    log_api_request("/api/setup_script", "POST", request_data=data)

    # Get board-specific commands
    ACTIONS = current_board.get_setup_commands()
    
    if action not in ACTIONS:
        error_response = {"error": f"Unknown action '{action}' for {current_board.get_board_name()}"}
        log_api_request("/api/setup_script", "POST", request_data=data, response_data=error_response, status_code=400)
        return jsonify(error_response), 400

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
                    response_data = {
                        "action": action,
                        "status": "completed",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": 0  # Always return 0 for stop and status commands
                    }
                    log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=200)
                    return jsonify(response_data), 200
                except subprocess.TimeoutExpired:
                    logger.warning(f"Action '{action}' timed out. Killing process.")
                    proc.kill()
                    proc.wait()  # Make sure it's dead
                    
                    # Read partial output
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    response_data = {
                        "action": action,
                        "error": "timeout",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": -1
                    }
                    log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=504)
                    return jsonify(response_data), 504
            
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
                    
                    response_data = {
                        "action": action,
                        "error": "timeout",
                        "details": f"No CELL_IS_UP in {MAX_WAIT}s",
                        "output": output.strip(),
                        "log_file": log_filepath,
                        "exit_code": -1
                    }
                    log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=504)
                    return jsonify(response_data), 504
                
                # Check if the process has terminated
                if proc.poll() is not None:
                    # Process has exited, read the log file
                    with open(log_filepath, 'r') as f:
                        output = f.read()
                    
                    # Check if "CELL_IS_UP" is in the output
                    if "CELL_IS_UP" in output:
                        logger.info("Setup is successful, gNB is now active")
                        response_data = {
                            "action": action,
                            "status": "ok",
                            "output": output.strip(),
                            "log_file": log_filepath,
                            "exit_code": 0
                        }
                        log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=200)
                        return jsonify(response_data), 200
                    else:
                        logger.warning(f"Process terminated prematurely with code {proc.returncode}.")
                        response_data = {
                            "action": action,
                            "error": "process_terminated_unexpectedly",
                            "details": f"Process terminated (code {proc.returncode}) before CELL_IS_UP was detected.",
                            "output": output.strip(),
                            "log_file": log_filepath,
                            "exit_code": proc.returncode
                        }
                        log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=500)
                        return jsonify(response_data), 500
                
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
                        
                            response_data = {
                                "action": action,
                                "status": "ok", 
                                "output": output.strip(),
                                "log_file": log_filepath,
                                "exit_code": proc.returncode
                            }
                            log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=200)
                            return jsonify(response_data), 200
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
        response_data = {
            "action": action,
            "error": "execution_error",
            "details": str(e),
            "exit_code": -2
        }
        log_api_request("/api/setup_script", "POST", request_data=data, response_data=response_data, status_code=500)
        return jsonify(response_data), 500

@app.route("/api/download/<file_key>", methods=["GET"])
def download_file(file_key):
    """Download board-specific files"""
    try:
        # Get board-specific file paths
        FILE_PATHS = current_board.get_file_paths()
        
        file_path = FILE_PATHS.get(file_key)
        if file_path is None:
            available_files = list(FILE_PATHS.keys())
            error_response = {
                "error": f"Unknown file key '{file_key}' for {current_board.get_board_name()}",
                "available_files": available_files
            }
            log_api_request(f"/api/download/{file_key}", "GET", response_data=error_response, status_code=404)
            return jsonify(error_response), 404

        # file must exist on disk
        if not os.path.isfile(file_path):
            error_response = {"error": f"File not found on server: {file_path}"}
            log_api_request(f"/api/download/{file_key}", "GET", response_data=error_response, status_code=404)
            return jsonify(error_response), 404

        # Log successful file download (don't include file content in log)
        log_api_request(f"/api/download/{file_key}", "GET", response_data={"file_downloaded": os.path.basename(file_path)}, status_code=200)
        
        # send it as an attachment (will trigger Save-As in the browser)
        return send_file(
            file_path,
            as_attachment=True,
            download_name=os.path.basename(file_path),
            mimetype="text/plain",
        )
    except Exception as e:
        error_msg = f"Failed to download file: {str(e)}"
        log_api_request(f"/api/download/{file_key}", "GET", error=error_msg, status_code=500)
        return jsonify({"error": error_msg}), 500

@app.route("/api/config", methods=["POST"])
def set_config():
    """
    Expects JSON { "field":"gnbIP", "value":"1.2.3.4" }
    """
    try:
        data = request.get_json(force=True)
        field = data.get("field")
        val = data.get("value")

        # Log the incoming request
        log_api_request("/api/config", "POST", request_data=data)

        if radio.edit_config(field, val):
            # create success response
            response_data = {
                "status": "success",
                "message": f"Updated {field} to {val}"
            }
            log_api_request("/api/config", "POST", request_data=data, response_data=response_data, status_code=200)
            return jsonify(response_data), 200
        else:
            # create error response
            response_data = {
                "status": "error",
                "message": f"Failed to update {field} to {val}"
            }
            log_api_request("/api/config", "POST", request_data=data, response_data=response_data, status_code=400)
            return jsonify(response_data), 400
            
    except Exception as e:
        error_response = {
            "status": "error",
            "message": f"Failed to set config: {str(e)}"
        }
        log_api_request("/api/config", "POST", request_data=data if 'data' in locals() else None, response_data=error_response, status_code=500)
        return jsonify(error_response), 500


