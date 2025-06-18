import os
import json
import time
import pexpect
import datetime
from typing import Dict, Any, List
from .base_board import BaseBoard
from logic.attributes.CpuUsage import CpuUsage
from logic.attributes.SocTemp import SocTemp
from logic.attributes.RamUsage import RamUsage
from logic.attributes.DriveSpace import DriveSpace
from logic.attributes.BoardDateTime import BoardDateTime
from logic.attributes.RaptorStatus import RaptorStatus
from logic.attributes.CoreAttr import CoreAttr
from logic.attributes.RadioAttr import RadioAttr
from logic.setupLogManger import LogManager

class EdgeQBoard(BaseBoard):
    def get_board_name(self) -> str:
        return "EdgeQ"
    
    def get_board_config(self) -> Dict[str, Any]:
        return {
            "config_file_path": "/opt/ste/active/commissioning/configs/gnb_webdashboard.json",
            "commission_script_path": "/opt/ste/bin/gnb_commission",
            "gnb_ctl_path": "/opt/ste/bin/gnb_ctl",
            "raptor_log_path": "/logdump/du_log.txt",
            "log_directory": "/opt/webdashboard/logdump",
            "timeouts": {
                "raptor_status": 3,
                "setup_max_wait": 120,
                "commission_timeout": 120,
                "process_kill_timeout": 5
            },
            "commission_automation": {
                "start_trigger": r"(?i).*downlink bandwidth mhz.*",
                "end_trigger": r"(?i).*service differentiator.*",
                "filename_trigger": r".*filename.*",
                "custom_filename": "gnb_webdashboard.json",
                "default_profile": "40MHz_MET_2x2"
            },
            "file_paths": {
                "cu_log": "/logdump/cu_log.txt",
                "du_log": "/logdump/du_log.txt",
                "setup_log": "/opt/webdashboard/logdump/setup_log.txt"
            }
        }
    
    def create_attributes(self):
        config_path = self.get_config_file_path()
        raptor_log_path = self.config["raptor_log_path"]
        
        return {
            'cpu_usage': CpuUsage(),
            'cpu_temp': SocTemp(),
            'ram_usage': RamUsage(),
            'drive_space': DriveSpace(),
            'board_date_time': BoardDateTime(),
            'raptor_status': RaptorStatus(raptor_log_path),
            'radio': RadioAttr(config_path),
            'core': CoreAttr(config_path)
        }
    
    def get_setup_commands(self) -> Dict[str, List[str]]:
        config_path = self.get_config_file_path()
        gnb_ctl_path = self.config["gnb_ctl_path"]
        
        return {
            "setupv2": ["gnb_ctl", "start"],
            "start": [gnb_ctl_path, "-c", config_path, "start"],
            "stop": ["gnb_ctl", "stop"],
            "status": ["gnb_ctl", "status"]
        }
    
    def get_file_paths(self) -> Dict[str, str]:
        return self.config["file_paths"]
    
    def ensure_config_exists(self) -> bool:
        """EdgeQ-specific config file creation logic - moved from Flask.py"""
        logger = LogManager.get_logger('edgeq_config_creation')
        config_path = self.get_config_file_path()
        
        if os.path.exists(config_path):
            logger.info(f"Config file {config_path} found.")
            return True
        
        logger.info(f"Config file {config_path} not found. Generating...")
        
        try:
            commission_script = self.config["commission_script_path"]
            config_dir = os.path.dirname(config_path)
            commission_config = self.config["commission_automation"]
            timeout = self.config["timeouts"]["commission_timeout"]
            
            # Validate prerequisites
            if not os.path.exists(commission_script):
                logger.error(f"Commission script not found at {commission_script}")
                return False
            
            if not os.path.exists(config_dir):
                logger.error(f"Config directory {config_dir} does not exist")
                return False
            else:
                logger.debug(f"Config directory {config_dir} found")
            
            # Run EdgeQ-specific commissioning process
            return self._run_edgeq_commission(logger, commission_config, timeout)
            
        except Exception as e:
            logger.error(f"Error during EdgeQ config file generation: {str(e)}")
            return False
    
    def _run_edgeq_commission(self, logger, commission_config, timeout):
        """EdgeQ-specific commissioning automation - moved from Flask.py"""
        config_path = self.get_config_file_path()
        
        try:
            logger.debug("Starting EdgeQ gnb_commission process with -g flag...")
            proc = pexpect.spawn("gnb_commission -g", timeout=timeout)
            
            # Log commission output
            log_file_path = f"/tmp/gnb_commission_output_{int(time.time())}.log"
            try:
                proc.logfile_read = open(log_file_path, "wb")
                logger.debug(f"Commission output logging to {log_file_path}")
            except Exception:
                proc.logfile_read = None
            
            # EdgeQ-specific automation logic
            step_count = 0
            max_steps = 50
            automation_started = False
            
            while step_count < max_steps:
                step_count += 1
                logger.debug(f"Step {step_count}: Waiting for prompt...")
                
                try:
                    if not automation_started:
                        index = proc.expect([
                            commission_config["start_trigger"],
                            r".*:.*",
                            pexpect.TIMEOUT,
                            pexpect.EOF
                        ], timeout=10)
                        
                        if index == 0:  # Found start trigger
                            logger.debug("EdgeQ automation started...")
                            automation_started = True
                            proc.sendline('')
                            time.sleep(0.1)
                            continue
                        elif index == 1:  # Ignore other prompts before automation
                            continue
                    else:
                        index = proc.expect([
                            commission_config["end_trigger"],
                            r".*:.*",
                            pexpect.TIMEOUT,
                            pexpect.EOF
                        ], timeout=10)
                        
                        if index == 0:  # Found end trigger
                            logger.debug("EdgeQ automation end trigger found...")
                            proc.sendline('')
                            time.sleep(0.1)
                            
                            # Handle filename customization
                            self._handle_filename_customization(proc, commission_config, logger)
                            break
                        elif index == 1:  # Continue automation
                            proc.sendline('')
                            time.sleep(0.1)
                            continue
                
                except (pexpect.TIMEOUT, pexpect.EOF):
                    if step_count >= max_steps:
                        break
                    continue
            
            # Cleanup and validate
            try:
                proc.close()
                if proc.logfile_read and not proc.logfile_read.closed:
                    proc.logfile_read.close()
            except Exception as e:
                logger.warning(f"Error closing EdgeQ commission process: {e}")
            
            # Validate and enhance config file
            if os.path.exists(config_path):
                logger.info(f"Successfully generated EdgeQ config: {config_path}")
                self._enhance_config_file(config_path, commission_config, logger)
                return True
            else:
                logger.error(f"Failed to generate EdgeQ config: {config_path}")
                return False
                
        except Exception as e:
            logger.error(f"EdgeQ commission process error: {str(e)}")
            return False
    
    def _handle_filename_customization(self, proc, commission_config, logger):
        """Handle EdgeQ-specific filename customization"""
        try:
            filename_index = proc.expect([
                commission_config["filename_trigger"],
                pexpect.TIMEOUT,
                pexpect.EOF
            ], timeout=15)
            
            if filename_index == 0:
                logger.debug("EdgeQ filename customization...")
                time.sleep(0.1)
                proc.send('\x15')  # Ctrl+U
                time.sleep(0.2)
                proc.send(commission_config["custom_filename"])
                time.sleep(0.1)
                proc.sendline('')
                time.sleep(0.1)
                logger.debug("EdgeQ filename customization complete")
        except Exception as e:
            logger.warning(f"EdgeQ filename customization error: {e}")
    
    def _enhance_config_file(self, config_path, commission_config, logger):
        """Add EdgeQ-specific enhancements to generated config"""
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            if 'profile' not in config_data:
                config_data['profile'] = commission_config["default_profile"]
                with open(config_path, 'w') as f:
                    json.dump(config_data, f, indent=4)
                logger.info(f"Added EdgeQ profile: {commission_config['default_profile']}")
        except Exception as e:
            logger.error(f"Failed to enhance EdgeQ config: {str(e)}")