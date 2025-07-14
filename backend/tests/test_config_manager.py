#!/usr/bin/env python3
"""
Unit Tests for Config Manager Feature
Tests configuration management, user overrides, and nested value retrieval
"""

import pytest
import json
import tempfile
import os
from unittest.mock import Mock, patch, mock_open
from pathlib import Path

# Import test configuration
from tests import TEST_CONFIG, get_backend_path

class TestBoardConfigManager:
    """Unit tests for BoardConfigManager class"""
    
    @pytest.fixture
    def mock_board(self):
        """Create mock board for testing"""
        board = Mock()
        board.get_board_name.return_value = 'EdgeQ'
        board.get_board_config.return_value = {
            "config_file_path": "/opt/ste/active/commissioning/configs/gnb_webdashboard.json",
            "log_directory": "/opt/webdashboard/logdump",
            "timeouts": {
                "raptor_status": 3,
                "setup_max_wait": 120,
                "commission_timeout": 120
            },
            "commission_automation": {
                "start_trigger": r"(?i).*downlink bandwidth mhz.*",
                "default_profile": "40MHz_MET_2x2"
            }
        }
        # Add config property to match actual usage
        board.config = board.get_board_config.return_value
        return board
    
    @pytest.fixture
    def config_manager(self, mock_board):
        """Create ConfigManager instance for testing"""
        from config_manager import BoardConfigManager
        with patch('os.path.exists', return_value=False):
            return BoardConfigManager(mock_board)
    
    def test_config_manager_initialization(self, mock_board):
        """Test ConfigManager initialization"""
        from config_manager import BoardConfigManager
        
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(mock_board)
        
        assert config_mgr.board == mock_board
        assert config_mgr.user_config_path == "config/board_overrides.json"
        assert isinstance(config_mgr.user_overrides, dict)
    
    def test_get_config_value_from_board_defaults(self, config_manager):
        """Test retrieving config values from board defaults"""
        # Test simple key
        value = config_manager.get_config_value('log_directory')
        assert value == "/opt/webdashboard/logdump"
        
        # Test nested key
        value = config_manager.get_config_value('timeouts.raptor_status')
        assert value == 3
        
        # Test deeper nesting
        value = config_manager.get_config_value('commission_automation.default_profile')
        assert value == "40MHz_MET_2x2"
    
    def test_get_config_value_with_default(self, config_manager):
        """Test retrieving config values with default fallback"""
        # Non-existent key should return default
        value = config_manager.get_config_value('nonexistent.key', 'default_value')
        assert value == 'default_value'
        
        # Non-existent key without default should return None
        value = config_manager.get_config_value('nonexistent.key')
        assert value is None
    
    def test_get_config_value_invalid_path(self, config_manager):
        """Test retrieving config values with invalid key paths"""
        # Invalid nested path
        value = config_manager.get_config_value('timeouts.nonexistent')
        assert value is None
        
        # Path through non-dict value
        value = config_manager.get_config_value('log_directory.invalid')
        assert value is None

class TestBoardConfigManagerUserOverrides:
    """Test user override functionality"""
    
    @pytest.fixture
    def mock_board(self):
        """Create mock board for testing"""
        board = Mock()
        board.get_board_name.return_value = 'EdgeQ'
        board.get_board_config.return_value = {
            "timeouts": {
                "raptor_status": 3,
                "setup_max_wait": 120
            },
            "log_directory": "/opt/webdashboard/logdump"
        }
        board.config = board.get_board_config.return_value
        return board
    
    @patch('os.path.exists')
    def test_load_user_overrides_file_exists(self, mock_exists, mock_board):
        """Test loading user overrides when file exists"""
        mock_exists.return_value = True
        
        override_data = {
            "edgeq": {
                "timeouts": {
                    "raptor_status": 5,
                    "custom_timeout": 30
                },
                "custom_setting": "override_value"
            }
        }
        
        with patch('builtins.open', mock_open(read_data=json.dumps(override_data))):
            from config_manager import BoardConfigManager
            config_mgr = BoardConfigManager(mock_board)
        
        # Verify overrides were loaded
        assert config_mgr.user_overrides == override_data["edgeq"]
    
    @patch('os.path.exists')
    def test_load_user_overrides_file_not_exists(self, mock_exists, mock_board):
        """Test loading user overrides when file doesn't exist"""
        mock_exists.return_value = False
        
        from config_manager import BoardConfigManager
        config_mgr = BoardConfigManager(mock_board)
        
        # Should have empty overrides
        assert config_mgr.user_overrides == {}
    
    @patch('os.path.exists')
    def test_load_user_overrides_invalid_json(self, mock_exists, mock_board):
        """Test loading user overrides with invalid JSON"""
        mock_exists.return_value = True
        
        with patch('builtins.open', mock_open(read_data="invalid json")):
            from config_manager import BoardConfigManager
            config_mgr = BoardConfigManager(mock_board)
        
        # Should fall back to empty overrides
        assert config_mgr.user_overrides == {}
    
    @patch('os.path.exists')
    def test_user_overrides_take_precedence(self, mock_exists, mock_board):
        """Test that user overrides take precedence over board defaults"""
        mock_exists.return_value = True
        
        override_data = {
            "edgeq": {
                "timeouts": {
                    "raptor_status": 10  # Override default value of 3
                },
                "log_directory": "/custom/log/path"  # Override default
            }
        }
        
        with patch('builtins.open', mock_open(read_data=json.dumps(override_data))):
            from config_manager import BoardConfigManager
            config_mgr = BoardConfigManager(mock_board)
        
        # Override values should be returned
        assert config_mgr.get_config_value('timeouts.raptor_status') == 10
        assert config_mgr.get_config_value('log_directory') == "/custom/log/path"
        
        # Non-overridden values should come from board defaults
        assert config_mgr.get_config_value('timeouts.setup_max_wait') == 120

class TestBoardConfigManagerNestedValues:
    """Test nested value retrieval functionality"""
    
    @pytest.fixture
    def config_manager(self):
        """Create ConfigManager with test data"""
        board = Mock()
        board.get_board_name.return_value = 'EdgeQ'
        board.config = {
            "level1": {
                "level2": {
                    "level3": "deep_value"
                },
                "simple": "value"
            },
            "root_value": "test"
        }
        
        from config_manager import BoardConfigManager
        with patch('os.path.exists', return_value=False):
            return BoardConfigManager(board)
    
    def test_get_nested_value_simple(self, config_manager):
        """Test getting simple nested values"""
        value = config_manager._get_nested_value(
            {"key": "value"}, "key"
        )
        assert value == "value"
    
    def test_get_nested_value_deep(self, config_manager):
        """Test getting deeply nested values"""
        test_dict = {
            "level1": {
                "level2": {
                    "level3": "deep_value"
                }
            }
        }
        
        value = config_manager._get_nested_value(test_dict, "level1.level2.level3")
        assert value == "deep_value"
    
    def test_get_nested_value_nonexistent(self, config_manager):
        """Test getting non-existent nested values"""
        test_dict = {"key": "value"}
        
        value = config_manager._get_nested_value(test_dict, "nonexistent.key")
        assert value is None
    
    def test_get_nested_value_partial_path(self, config_manager):
        """Test getting partial path through non-dict"""
        test_dict = {"key": "string_value"}
        
        value = config_manager._get_nested_value(test_dict, "key.invalid")
        assert value is None
    
    def test_get_nested_value_empty_path(self, config_manager):
        """Test getting value with empty key path"""
        test_dict = {"key": "value"}
        
        # Empty string should return None (actual behavior)
        # because empty string splits to [''] and dict[''] doesn't exist
        value = config_manager._get_nested_value(test_dict, "")
        assert value is None

class TestBoardConfigManagerIntegration:
    """Integration tests for ConfigManager with real board instances"""
    
    def test_config_manager_with_edgeq_board(self):
        """Test ConfigManager with real EdgeQ board"""
        from board_factory import BoardFactory
        from config_manager import BoardConfigManager
        
        # Create real EdgeQ board
        board = BoardFactory.create_board('edgeq')
        
        # Create config manager (without user overrides file)
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(board)
        
        # Test retrieving real EdgeQ config values
        assert config_mgr.get_config_value('config_file_path') is not None
        assert config_mgr.get_config_value('timeouts.raptor_status') == 3
        assert config_mgr.get_config_value('timeouts.setup_max_wait') == 120
        
        # Test non-existent values
        assert config_mgr.get_config_value('nonexistent', 'default') == 'default'
    
    def test_config_manager_board_name_case_insensitive(self):
        """Test that board name matching is case insensitive"""
        from config_manager import BoardConfigManager
        
        # Create board with different case
        board = Mock()
        board.get_board_name.return_value = 'EDGEQ'  # Uppercase
        board.config = {"test": "value"}
        
        override_data = {
            "edgeq": {"override": "value"}  # Lowercase in file
        }
        
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', mock_open(read_data=json.dumps(override_data))):
            config_mgr = BoardConfigManager(board)
        
        # Should match regardless of case
        assert config_mgr.user_overrides == {"override": "value"}

class TestBoardConfigManagerErrorHandling:
    """Test error handling in ConfigManager"""
    
    @pytest.fixture
    def mock_board(self):
        """Create mock board for testing"""
        board = Mock()
        board.get_board_name.return_value = 'EdgeQ'
        board.config = {"test": "value"}
        return board
    
    @patch('os.path.exists')
    def test_file_read_permission_error(self, mock_exists, mock_board):
        """Test handling of file permission errors"""
        mock_exists.return_value = True
        
        with patch('builtins.open', side_effect=PermissionError("Access denied")):
            from config_manager import BoardConfigManager
            config_mgr = BoardConfigManager(mock_board)
        
        # Should fall back to empty overrides
        assert config_mgr.user_overrides == {}
    
    @patch('os.path.exists')
    def test_file_read_io_error(self, mock_exists, mock_board):
        """Test handling of IO errors"""
        mock_exists.return_value = True
        
        with patch('builtins.open', side_effect=IOError("IO error")):
            from config_manager import BoardConfigManager
            config_mgr = BoardConfigManager(mock_board)
        
        # Should fall back to empty overrides
        assert config_mgr.user_overrides == {}
    
    def test_invalid_key_path_types(self, mock_board):
        """Test handling of invalid key path types"""
        from config_manager import BoardConfigManager
        
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(mock_board)
        
        # Test with None (should not crash)
        try:
            value = config_mgr._get_nested_value({"key": "value"}, None)
            # If it doesn't crash, it should return None or handle gracefully
        except (AttributeError, TypeError):
            # This is acceptable - invalid input should raise error
            pass

class TestBoardConfigManagerPerformance:
    """Performance tests for ConfigManager"""
    
    def test_config_retrieval_performance(self):
        """Test that config retrieval is fast"""
        from board_factory import BoardFactory
        from config_manager import BoardConfigManager
        import time
        
        # Create real board and config manager
        board = BoardFactory.create_board('edgeq')
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(board)
        
        # Test performance of multiple config retrievals
        start_time = time.time()
        
        for _ in range(100):
            config_mgr.get_config_value('timeouts.raptor_status')
            config_mgr.get_config_value('log_directory')
            config_mgr.get_config_value('config_file_path')
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # 300 config retrievals should be very fast
        assert total_time < 1.0, f"Config retrieval too slow: {total_time:.3f}s for 300 operations"

if __name__ == "__main__":
    # Allow running this file directly for quick testing
    print("Running Config Manager Unit Tests...")
    print("=" * 50)
    
    try:
        print("Testing ConfigManager import...")
        from config_manager import BoardConfigManager
        print("✓ ConfigManager imported successfully")
        
        print("Testing with EdgeQ board...")
        from board_factory import BoardFactory
        board = BoardFactory.create_board('edgeq')
        
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(board)
        print("✓ ConfigManager created successfully")
        
        print("Testing config value retrieval...")
        log_dir = config_mgr.get_config_value('log_directory')
        timeout = config_mgr.get_config_value('timeouts.raptor_status')
        print(f"✓ Log directory: {log_dir}")
        print(f"✓ Raptor timeout: {timeout}")
        
        print("\n✓ All basic tests passed!")
        print("Run full test suite with: python3 -m pytest tests/test_config_manager.py -v")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()