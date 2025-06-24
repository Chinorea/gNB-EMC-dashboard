import os
import json
from typing import Dict, Any

class BoardConfigManager:
    """Manages board-specific configurations and overrides"""
    
    def __init__(self, board):
        self.board = board
        self.user_config_path = "config/board_overrides.json"
        self.user_overrides = self._load_user_overrides()
    
    def _load_user_overrides(self) -> Dict[str, Any]:
        """Load user-specific configuration overrides"""
        if os.path.exists(self.user_config_path):
            try:
                with open(self.user_config_path, 'r') as f:
                    overrides = json.load(f)
                    board_name = self.board.get_board_name().lower()
                    return overrides.get(board_name, {})
            except Exception:
                pass
        return {}
    
    def get_config_value(self, key_path: str, default=None):
        """Get configuration value with override support
        
        Args:
            key_path: Dot-separated path like 'timeouts.setup_max_wait'
            default: Default value if not found
        """
        # Check user overrides first
        value = self._get_nested_value(self.user_overrides, key_path)
        if value is not None:
            return value
        
        # Fall back to board default config
        value = self._get_nested_value(self.board.config, key_path)
        return value if value is not None else default
    
    def _get_nested_value(self, config_dict: Dict, key_path: str):
        """Get value from nested dictionary using dot notation"""
        keys = key_path.split('.')
        value = config_dict
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        
        return value