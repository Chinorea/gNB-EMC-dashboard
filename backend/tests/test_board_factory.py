#!/usr/bin/env python3
"""
Unit Tests for Board Factory Feature
Tests the core board creation, detection, and management functionality
"""

import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

# Add backend directory to path for imports - more robust approach
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

# Import after fixing path
try:
    from board_factory import BoardFactory
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    # Try alternative import path
    sys.path.insert(0, str(backend_dir.parent))
    from backend.board_factory import BoardFactory

class TestBoardFactory:
    """Unit tests for BoardFactory class"""
    
    def test_get_available_boards(self):
        """Test that BoardFactory returns correct list of available boards"""
        boards = BoardFactory.get_available_boards()
        
        # Verify return type and content
        assert isinstance(boards, list), "get_available_boards should return a list"
        assert len(boards) > 0, "Should have at least one available board"
        assert 'edgeq' in boards, "EdgeQ board should be available"
        
        # Verify all boards are strings
        for board in boards:
            assert isinstance(board, str), f"Board name {board} should be a string"
    
    def test_create_board_edgeq(self):
        """Test creating EdgeQ board instance"""
        board = BoardFactory.create_board('edgeq')
        
        # Verify board was created successfully
        assert board is not None, "Board creation should not return None"
        assert board.get_board_name() == 'EdgeQ', "Board name should be 'EdgeQ'"
        
        # Verify board has required methods
        assert hasattr(board, 'get_board_config'), "Board should have get_board_config method"
        assert hasattr(board, 'get_setup_commands'), "Board should have get_setup_commands method"
        assert hasattr(board, 'get_file_paths'), "Board should have get_file_paths method"
        assert hasattr(board, 'create_attributes'), "Board should have create_attributes method"
    
    def test_create_board_invalid(self):
        """Test creating board with invalid type"""
        # Fix: Use the actual error message from BoardFactory
        with pytest.raises(ValueError, match="Unsupported board type"):
            BoardFactory.create_board('invalid_board')
    
    def test_create_board_none(self):
        """Test creating board with None type (should auto-detect and work)"""
        # Fix: When None is passed, BoardFactory auto-detects and returns a board
        # This should NOT raise an error - it should work and return EdgeQ board
        board = BoardFactory.create_board(None)
        assert board is not None, "Auto-detection should return a board"
        assert board.get_board_name() == 'EdgeQ', "Auto-detection should default to EdgeQ"
    
    def test_create_board_empty_string(self):
        """Test creating board with empty string"""
        # Fix: Use the actual error message from BoardFactory
        with pytest.raises(ValueError, match="Unsupported board type"):
            BoardFactory.create_board('')
    
    @patch('sys.argv', ['script_name'])
    def test_parse_board_from_args_no_args(self):
        """Test parsing board type with no command line arguments"""
        board_type = BoardFactory.parse_board_from_args()
        # Should default to None (auto-detect)
        assert board_type is None
    
    @patch('sys.argv', ['script_name', '--edgeq'])
    def test_parse_board_from_args_edgeq(self):
        """Test parsing board type with --edgeq argument"""
        board_type = BoardFactory.parse_board_from_args()
        assert board_type == 'edgeq'
    
    @patch('sys.argv', ['script_name', '--help'])
    def test_parse_board_from_args_help(self):
        """Test parsing board type with --help argument"""
        # --help should cause SystemExit
        with pytest.raises(SystemExit):
            BoardFactory.parse_board_from_args()
    
    def test_board_factory_singleton_behavior(self):
        """Test that creating multiple boards of same type works correctly"""
        board1 = BoardFactory.create_board('edgeq')
        board2 = BoardFactory.create_board('edgeq')
        
        # Should create separate instances
        assert board1 is not board2, "Should create separate board instances"
        assert board1.get_board_name() == board2.get_board_name(), "Both should be EdgeQ boards"

class TestBoardFactoryAutoDetection:
    """Test BoardFactory auto-detection functionality"""
    
    @patch('os.path.exists')
    def test_detect_board_type_edgeq_commission_path(self, mock_exists):
        """Test auto-detection with EdgeQ commission script present"""
        def exists_side_effect(path):
            return path == "/opt/ste/bin/gnb_commission"
        
        mock_exists.side_effect = exists_side_effect
        
        board_type = BoardFactory.detect_board_type()
        assert board_type == 'edgeq'
    
    @patch('os.path.exists')
    def test_detect_board_type_edgeq_config_path(self, mock_exists):
        """Test auto-detection with EdgeQ config directory present"""
        def exists_side_effect(path):
            return path == "/opt/ste/active/commissioning/configs/"
        
        mock_exists.side_effect = exists_side_effect
        
        board_type = BoardFactory.detect_board_type()
        assert board_type == 'edgeq'
    
    @patch('os.path.exists')
    def test_detect_board_type_default_edgeq(self, mock_exists):
        """Test auto-detection defaults to EdgeQ when no specific paths found"""
        mock_exists.return_value = False
        
        board_type = BoardFactory.detect_board_type()
        assert board_type == 'edgeq'

class TestEdgeQBoardIntegration:
    """Integration tests for EdgeQ board created by BoardFactory"""
    
    @pytest.fixture
    def edgeq_board(self):
        """Create EdgeQ board for testing"""
        return BoardFactory.create_board('edgeq')
    
    def test_edgeq_board_config_structure(self, edgeq_board):
        """Test EdgeQ board configuration structure"""
        config = edgeq_board.get_board_config()
        
        # Verify config is a dictionary
        assert isinstance(config, dict), "Board config should be a dictionary"
        
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
        
        # Verify timeout structure
        timeouts = config['timeouts']
        assert isinstance(timeouts, dict), "Timeouts should be a dictionary"
        assert 'raptor_status' in timeouts, "Should have raptor_status timeout"
        assert 'setup_max_wait' in timeouts, "Should have setup_max_wait timeout"
    
    def test_edgeq_setup_commands_structure(self, edgeq_board):
        """Test EdgeQ setup commands structure"""
        commands = edgeq_board.get_setup_commands()
        
        # Verify commands is a dictionary
        assert isinstance(commands, dict), "Setup commands should be a dictionary"
        
        # Verify required commands exist
        required_commands = ['start', 'stop', 'status', 'setupv2']
        for cmd in required_commands:
            assert cmd in commands, f"Should have '{cmd}' command"
            assert isinstance(commands[cmd], list), f"Command '{cmd}' should be a list"
            assert len(commands[cmd]) > 0, f"Command '{cmd}' should not be empty"
    
    def test_edgeq_file_paths_structure(self, edgeq_board):
        """Test EdgeQ file paths structure"""
        file_paths = edgeq_board.get_file_paths()
        
        # Verify file_paths is a dictionary
        assert isinstance(file_paths, dict), "File paths should be a dictionary"
        
        # Verify required file types exist
        expected_files = ['cu_log', 'du_log', 'setup_log']
        for file_type in expected_files:
            assert file_type in file_paths, f"Should have '{file_type}' file path"
            assert isinstance(file_paths[file_type], str), f"File path for '{file_type}' should be a string"
            assert len(file_paths[file_type]) > 0, f"File path for '{file_type}' should not be empty"
    
    @patch('os.path.exists')
    def test_edgeq_config_file_path_validation(self, mock_exists, edgeq_board):
        """Test EdgeQ config file path validation"""
        mock_exists.return_value = True
        
        config_path = edgeq_board.get_config_file_path()
        
        # Verify config path is a string and not empty
        assert isinstance(config_path, str), "Config file path should be a string"
        assert len(config_path) > 0, "Config file path should not be empty"
        assert config_path.endswith('.json'), "Config file should be a JSON file"

class TestBoardFactoryErrorHandling:
    """Test error handling in BoardFactory"""
    
    def test_create_board_case_insensitive(self):
        """Test that board creation is case insensitive"""
        board_lower = BoardFactory.create_board('edgeq')
        board_upper = BoardFactory.create_board('EDGEQ')
        board_mixed = BoardFactory.create_board('EdgeQ')
        
        # All should create EdgeQ boards
        assert board_lower.get_board_name() == 'EdgeQ'
        assert board_upper.get_board_name() == 'EdgeQ'
        assert board_mixed.get_board_name() == 'EdgeQ'
    
    def test_available_boards_consistency(self):
        """Test that available boards list is consistent"""
        boards1 = BoardFactory.get_available_boards()
        boards2 = BoardFactory.get_available_boards()
        
        # Should return the same list each time
        assert boards1 == boards2, "Available boards list should be consistent"
    
    def test_board_creation_failure_handling(self):
        """Test handling of board creation failures"""
        # Instead of mocking the class, test with invalid board type
        # This tests the actual error handling path in BoardFactory
        with pytest.raises(ValueError, match="Unsupported board type"):
            BoardFactory.create_board('nonexistent_board')
    
    @patch('sys.argv', ['script_name', '--invalid-arg'])
    def test_parse_args_invalid_argument(self):
        """Test handling of invalid command line arguments"""
        with pytest.raises(SystemExit):
            BoardFactory.parse_board_from_args()

class TestBoardFactoryPerformance:
    """Performance tests for BoardFactory"""
    
    def test_board_creation_performance(self):
        """Test that board creation is reasonably fast"""
        import time
        
        start_time = time.time()
        board = BoardFactory.create_board('edgeq')
        end_time = time.time()
        
        creation_time = end_time - start_time
        assert creation_time < 2.0, f"Board creation too slow: {creation_time:.2f}s"
        assert board is not None, "Board should be created successfully"
    
    def test_multiple_board_creation_performance(self):
        """Test creating multiple boards in succession"""
        import time
        
        start_time = time.time()
        boards = []
        
        for _ in range(5):
            board = BoardFactory.create_board('edgeq')
            boards.append(board)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        assert total_time < 5.0, f"Creating 5 boards too slow: {total_time:.2f}s"
        assert len(boards) == 5, "Should create 5 boards"
        
        # Verify all boards are valid
        for board in boards:
            assert board.get_board_name() == 'EdgeQ'

if __name__ == "__main__":
    # Allow running this file directly for quick testing
    print("Running Board Factory Unit Tests...")
    print("=" * 50)
    
    # Basic smoke tests
    try:
        print("Testing BoardFactory import...")
        from board_factory import BoardFactory
        print("✓ BoardFactory imported successfully")
        
        print("Testing available boards...")
        boards = BoardFactory.get_available_boards()
        print(f"✓ Available boards: {boards}")
        
        print("Testing EdgeQ board creation...")
        board = BoardFactory.create_board('edgeq')
        print(f"✓ EdgeQ board created: {board.get_board_name()}")
        
        print("Testing board configuration...")
        config = board.get_board_config()
        print(f"✓ Board config keys: {list(config.keys())}")
        
        print("\n✓ All basic tests passed!")
        print("Run full test suite with: python3 -m pytest test_board_factory.py -v")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()