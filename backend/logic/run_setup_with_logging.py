import subprocess
import sys
import os
import argparse
from setupLogManger import LogManager
import datetime
import pexpect

# Command configurations
ACTIONS = {
    "setup": ["python3", "/webdashboard/setup_drive.py"],
    "start": ["gnb_ctl", "start"],
    "stop": ["gnb_ctl", "stop"],
    "status": ["gnb_ctl", "status"]
}

def handle_start_command(logger, timeout):
    """Handle the 'start' command using pexpect"""
    try:
        child = pexpect.spawn("/bin/bash", ["-i"], encoding="utf-8", timeout=timeout)
        child.logfile_read = sys.stdout
        child.sendline("gnb_ctl start")
        
        patterns = ["CELL_IS_UP", pexpect.TIMEOUT, pexpect.EOF]
        while True:
            index = child.expect(patterns)
            if child.before:
                logger.info(child.before.strip())
            
            if index == 0:  # Found CELL_IS_UP
                logger.info("Success pattern found: CELL_IS_UP")
                child.close()
                return 0
            elif index == 2:  # EOF - process completed
                child.close()
                return 0  # Consider EOF as success since process completed
            elif index == 1:  # Timeout
                logger.error("Process timed out")
                child.close(force=True)
                return 1
    except Exception as e:
        logger.error(f"Error during start command: {str(e)}")
        return 1

def handle_simple_command(logger, cmd):
    """Handle simple commands (stop/status) using check_output"""
    try:
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, universal_newlines=True)
        for line in output.splitlines():
            logger.info(line.strip())
        return 0  # Successful execution
    except subprocess.CalledProcessError as e:
        for line in e.output.splitlines():
            logger.info(line.strip())
        # For stop and status commands, return 0 as they are informational/state-changing
        if cmd[-1] in ["stop", "status"]:
            return 0
        return e.returncode

def run_setup_with_logging(command=None, action=None, timeout_seconds=120):
    """Main function to run commands with logging"""
    logger = LogManager.setup_logging()
    return_code = 0  # Default to success
    
    try:
        # Log start of execution
        logger.info("=" * 50)
        logger.info(f"Starting command execution at {datetime.datetime.now()}")
        if action in ACTIONS:
            cmd = ACTIONS[action]
            logger.info(f"Command: {' '.join(cmd)}")
            
            # Execute command based on type
            if action == "start":
                return_code = handle_start_command(logger, timeout_seconds)
            elif action in ["stop", "status"]:
                return_code = handle_simple_command(logger, cmd)
            # Success case for setup action
            elif action == "setup":
                return_code = handle_simple_command(logger, cmd)
        else:
            if command:
                logger.info(f"Command: {command}")
                # Execute custom command if provided
                try:
                    subprocess.check_call(command, shell=True)
                    return_code = 0
                except subprocess.CalledProcessError as e:
                    return_code = e.returncode
            else:
                logger.warning("No valid action or command provided")
                return_code = 0  # Not an error case, just nothing to do

        # Log completion
        logger.info("=" * 50)
        logger.info(f"Command execution completed at {datetime.datetime.now()}")
        logger.info(f"Exit code: {return_code}")
        
        return return_code

    except Exception as e:
        logger.error(f"Error during execution: {str(e)}")
        return 1
    finally:
        # Clean up logging handlers
        for handler in logger.handlers[:]:
            handler.close()
            logger.removeHandler(handler)

def parse_args():
    parser = argparse.ArgumentParser(description='Run commands with logging')
    parser.add_argument('--action', choices=['setup', 'start', 'stop', 'status'],
                      help='Predefined action to run')
    parser.add_argument('--command', help='Custom command to run')
    parser.add_argument('--timeout', type=int, default=120,
                      help='Timeout in seconds (default: 120)')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    exit_code = run_setup_with_logging(
        command=args.command,
        action=args.action,
        timeout_seconds=args.timeout
    )
    sys.exit(exit_code)