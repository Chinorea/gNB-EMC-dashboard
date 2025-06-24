from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseBoard(ABC):
    """Abstract base class for all board implementations"""
    
    def __init__(self):
        self.config = self.get_board_config()
    
    @abstractmethod
    def get_board_name(self) -> str:
        """Return the board name (e.g., 'EdgeQ')"""
        pass
    
    @abstractmethod
    def get_board_config(self) -> Dict[str, Any]:
        """Return board-specific configuration dictionary"""
        pass
    
    @abstractmethod
    def create_attributes(self):
        """Return dict of board-specific attribute instances"""
        pass
    
    @abstractmethod
    def ensure_config_exists(self) -> bool:
        """Board-specific config creation logic"""
        pass
    
    @abstractmethod
    def get_setup_commands(self) -> Dict[str, List[str]]:
        """Return board-specific setup commands"""
        pass
    
    @abstractmethod
    def get_file_paths(self) -> Dict[str, str]:
        """Return board-specific file paths for logs, etc."""
        pass
    
    # Common methods that use board-specific config
    def get_config_file_path(self) -> str:
        return self.config["config_file_path"]
    
    def get_log_directory(self) -> str:
        return self.config["log_directory"]
    
    def get_timeout_settings(self) -> Dict[str, int]:
        return self.config["timeouts"]