#!/usr/bin/env python3
"""
Unit Tests for EdgeQ Board Implementation
Tests EdgeQ-specific board functionality including configuration, commands, and file paths
"""

import pytest
import json
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock, mock_open
from pathlib import Path

# Import test configuration
from tests import TEST_CONFIG, get_backend_path

class TestEdgeQBoard:
    """Unit tests for EdgeQ board implementation"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board instance for testing"""
        from boards.edgeq_board import EdgeQBoard
        return EdgeQBoard()
    
    def test_board_name(self, edgeq_board):
        """Test EdgeQ board name"""
        assert edgeq_board.get_board_name() == 'EdgeQ'
    
    def test_board_config_structure(self, edgeq_board):
        """Test EdgeQ board configuration structure"""
        config = edgeq_board.get_board_config()
        
        # Verify config is a dictionary
        assert isinstance(config, dict)
        
        # Verify required configuration keys exist
        required_keys = [
            'config_file_path',
            'commission_script_path',
            'gnb_ctl_path',
            'raptor_log_path',
            'log_directory',
            'timeouts',
            'commission_automation',
            'file_paths'
        ]
        
        for key in required_keys:
            assert key in config, f"Config should contain '{key}' key"
        
        # Verify specific EdgeQ paths
        assert config['config_file_path'] == "/opt/ste/active/commissioning/configs/gnb_webdashboard.json"
        assert config['commission_script_path'] == "/opt/ste/bin/gnb_commission"
        assert config['gnb_ctl_path'] == "/opt/ste/bin/gnb_ctl"
        assert config['raptor_log_path'] == "/logdump/du_log.txt"
        assert config['log_directory'] == "/opt/webdashboard/logdump"
    
    def test_timeout_configuration(self, edgeq_board):
        """Test EdgeQ timeout configuration"""
        config = edgeq_board.get_board_config()
        timeouts = config['timeouts']
        
        assert isinstance(timeouts, dict)
        assert timeouts['raptor_status'] == 3
        assert timeouts['setup_max_wait'] == 120
        assert timeouts['commission_timeout'] == 120
        assert timeouts['process_kill_timeout'] == 5
    
    def test_commission_automation_config(self, edgeq_board):
        """Test EdgeQ commission automation configuration"""
        config = edgeq_board.get_board_config()
        automation = config['commission_automation']
        
        assert isinstance(automation, dict)
        assert 'start_trigger' in automation
        assert 'end_trigger' in automation
        assert 'filename_trigger' in automation
        assert automation['custom_filename'] == "gnb_webdashboard.json"
        assert automation['default_profile'] == "40MHz_MET_2x2"
    
    def test_setup_commands(self, edgeq_board):
        """Test EdgeQ setup commands"""
        commands = edgeq_board.get_setup_commands()
        
        assert isinstance(commands, dict)
        
        # Verify required commands exist
        required_commands = ['start', 'stop', 'status', 'setupv2']
        for cmd in required_commands:
            assert cmd in commands
            assert isinstance(commands[cmd], list)
            assert len(commands[cmd]) > 0
        
        # Verify specific EdgeQ commands
        assert commands['setupv2'] == ["gnb_ctl", "start"]
        assert commands['stop'] == ["gnb_ctl", "stop"]
        assert commands['status'] == ["gnb_ctl", "status"]
        
        # Start command should include config path
        start_cmd = commands['start']
        assert "/opt/ste/bin/gnb_ctl" in start_cmd
        assert "-c" in start_cmd
    
    def test_file_paths(self, edgeq_board):
        """Test EdgeQ file paths"""
        file_paths = edgeq_board.get_file_paths()
        
        assert isinstance(file_paths, dict)
        
        # Verify required file types exist
        expected_files = ['cu_log', 'du_log', 'setup_log']
        for file_type in expected_files:
            assert file_type in file_paths
            assert isinstance(file_paths[file_type], str)
            assert len(file_paths[file_type]) > 0
        
        # Verify specific EdgeQ file paths
        assert file_paths['cu_log'] == "/logdump/cu_log.txt"
        assert file_paths['du_log'] == "/logdump/du_log.txt"
        assert file_paths['setup_log'] == "/opt/webdashboard/logdump/setup_log.txt"
    
    def test_config_file_path(self, edgeq_board):
        """Test EdgeQ config file path"""
        config_path = edgeq_board.get_config_file_path()
        
        assert isinstance(config_path, str)
        assert len(config_path) > 0
        assert config_path.endswith('.json')
        assert config_path == "/opt/ste/active/commissioning/configs/gnb_webdashboard.json"

class TestEdgeQBoardAttributes:
    """Test EdgeQ board attribute creation"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board instance for testing"""
        from boards.edgeq_board import EdgeQBoard
        return EdgeQBoard()
    
    @patch('os.path.exists')
    def test_create_attributes(self, mock_exists, edgeq_board):
        """Test EdgeQ attribute creation"""
        mock_exists.return_value = True
        
        with patch('boards.edgeq_board.EdgeQCpuUsage'), \
             patch('boards.edgeq_board.EdgeQSocTemp'), \
             patch('boards.edgeq_board.EdgeQRamUsage'), \
             patch('boards.edgeq_board.DriveSpace'), \
             patch('boards.edgeq_board.BoardDateTime'), \
             patch('boards.edgeq_board.EdgeQRaptorStatus'), \
             patch('boards.edgeq_board.EdgeQRadioAttr'), \
             patch('boards.edgeq_board.EdgeQCoreAttr'):
            
            attributes = edgeq_board.create_attributes()
            
            # Verify all required attributes are created
            required_attributes = [
                'cpu_usage', 'cpu_temp', 'ram_usage', 'drive_space',
                'board_date_time', 'raptor_status', 'radio', 'core'
            ]
            
            for attr in required_attributes:
                assert attr in attributes, f"Attribute '{attr}' should be created"
                assert attributes[attr] is not None

class TestEdgeQBoardConfigCreation:
    """Test EdgeQ board configuration file creation"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board instance for testing"""
        from boards.edgeq_board import EdgeQBoard
        return EdgeQBoard()
    
    @patch('os.path.exists')
    def test_ensure_config_exists_file_present(self, mock_exists, edgeq_board):
        """Test config existence check when file is present"""
        mock_exists.return_value = True
        
        result = edgeq_board.ensure_config_exists()
        assert result is True
    
    @patch('os.path.exists')
    @patch('boards.edgeq_board.EdgeQBoard._run_edgeq_commission')
    def test_ensure_config_exists_file_missing(self, mock_commission, mock_exists, edgeq_board):
        """Test config creation when file is missing"""
        # Mock file doesn't exist initially
        mock_exists.side_effect = lambda path: path != "/opt/ste/active/commissioning/configs/gnb_webdashboard.json"
        mock_commission.return_value = True
        
        result = edgeq_board.ensure_config_exists()
        assert result is True
        mock_commission.assert_called_once()
    
    @patch('os.path.exists')
    def test_ensure_config_exists_commission_script_missing(self, mock_exists, edgeq_board):
        """Test config creation when commission script is missing"""
        def exists_side_effect(path):
            if path == "/opt/ste/active/commissioning/configs/gnb_webdashboard.json":
                return False  # Config file doesn't exist
            elif path == "/opt/ste/bin/gnb_commission":
                return False  # Commission script doesn't exist
            else:
                return True
        
        mock_exists.side_effect = exists_side_effect
        
        result = edgeq_board.ensure_config_exists()
        assert result is False

class TestEdgeQBoardCommissionAutomation:
    """Test EdgeQ commission automation functionality"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board instance for testing"""
        from boards.edgeq_board import EdgeQBoard
        return EdgeQBoard()
    
    @patch('pexpect.spawn')
    @patch('os.path.exists')
    @patch('time.sleep')
    def test_run_edgeq_commission_success(self, mock_sleep, mock_exists, mock_spawn, edgeq_board):
        """Test successful EdgeQ commission process"""
        mock_exists.return_value = True
        
        # Mock pexpect process
        mock_proc = Mock()
        mock_proc.expect.side_effect = [0, 0, 0]  # Simulate finding triggers
        mock_proc.close.return_value = None
        mock_proc.logfile_read = Mock()
        mock_proc.logfile_read.closed = False
        mock_spawn.return_value = mock_proc
        
        # Mock file operations
        with patch('builtins.open', mock_open()), \
             patch('json.load', return_value={}), \
             patch('json.dump'):
            
            result = edgeq_board._run_edgeq_commission(
                Mock(),  # logger
                edgeq_board.get_board_config()['commission_automation'],
                120  # timeout
            )
            
            assert result is True
            mock_spawn.assert_called_once_with("gnb_commission -g", timeout=120)
    
    @patch('pexpect.spawn')
    def test_run_edgeq_commission_failure(self, mock_spawn, edgeq_board):
        """Test EdgeQ commission process failure"""
        mock_spawn.side_effect = Exception("Commission failed")
        
        result = edgeq_board._run_edgeq_commission(
            Mock(),  # logger
            edgeq_board.get_board_config()['commission_automation'],
            120  # timeout
        )
        
        assert result is False

class TestEdgeQBoardFileOperations:
    """Test EdgeQ board file operations"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board instance for testing"""
        from boards.edgeq_board import EdgeQBoard
        return EdgeQBoard()
    
    def test_enhance_config_file_success(self, edgeq_board):
        """Test config file enhancement"""
        config_data = {"existing_key": "existing_value"}
        
        with patch('builtins.open', mock_open()), \
             patch('json.load', return_value=config_data), \
             patch('json.dump') as mock_dump:
            
            edgeq_board._enhance_config_file(
                "/test/config.json",
                {"default_profile": "test_profile"},
                Mock()  # logger
            )
            
            # Verify json.dump was called (config was written back)
            mock_dump.assert_called_once()
    
    def test_enhance_config_file_with_existing_profile(self, edgeq_board):
        """Test config file enhancement when profile already exists"""
        config_data = {"profile": "existing_profile"}
        
        with patch('builtins.open', mock_open()), \
             patch('json.load', return_value=config_data), \
             patch('json.dump') as mock_dump:
            
            edgeq_board._enhance_config_file(
                "/test/config.json",
                {"default_profile": "test_profile"},
                Mock()  # logger
            )
            
            # Should not modify file if profile already exists
            mock_dump.assert_not_called()

class TestEdgeQBoardIntegration:
    """Integration tests for EdgeQ board"""
    
    def test_full_board_workflow(self):
        """Test complete EdgeQ board workflow"""
        from board_factory import BoardFactory
        
        # Create board through factory
        board = BoardFactory.create_board('edgeq')
        
        # Verify it's an EdgeQ board
        assert board.get_board_name() == 'EdgeQ'
        
        # Test configuration retrieval
        config = board.get_board_config()
        assert isinstance(config, dict)
        assert len(config) > 0
        
        # Test command retrieval
        commands = board.get_setup_commands()
        assert isinstance(commands, dict)
        assert 'start' in commands
        
        # Test file paths
        file_paths = board.get_file_paths()
        assert isinstance(file_paths, dict)
        assert len(file_paths) > 0

if __name__ == "__main__":
    print("Running EdgeQ Board Unit Tests...")
    print("=" * 50)
    
    try:
        from boards.edgeq_board import EdgeQBoard
        
        print("Testing EdgeQ board creation...")
        board = EdgeQBoard()
        print(f"✓ EdgeQ board created: {board.get_board_name()}")
        
        print("Testing board configuration...")
        config = board.get_board_config()
        print(f"✓ Config keys: {list(config.keys())}")
        
        print("Testing setup commands...")
        commands = board.get_setup_commands()
        print(f"✓ Available commands: {list(commands.keys())}")
        
        print("\n✓ All basic tests passed!")
        print("Run full test suite with: python3 -m pytest tests/boards/test_edgeq_board.py -v")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()