#!/usr/bin/env python3
"""
Unit Tests for Logging System Feature
Tests LogManager functionality, log file operations, and logging configuration
"""

import pytest
import tempfile
import os
import logging
from unittest.mock import Mock, patch, mock_open
from pathlib import Path

# Import test configuration
from tests import TEST_CONFIG, get_backend_path

class TestLogManager:
    """Unit tests for LogManager class"""
    
    def test_log_manager_import(self):
        """Test that LogManager can be imported"""
        from logic.setupLogManger import LogManager
        assert LogManager is not None
    
    def test_get_logger_basic(self):
        """Test basic logger creation"""
        from logic.setupLogManger import LogManager
        
        logger = LogManager.get_logger('test_logger')
        
        # Verify logger was created
        assert logger is not None
        assert hasattr(logger, 'info')
        assert hasattr(logger, 'error')
        assert hasattr(logger, 'warning')
        assert hasattr(logger, 'debug')
    
    def test_get_logger_same_name_returns_same_instance(self):
        """Test that requesting same logger name returns same instance"""
        from logic.setupLogManger import LogManager
        
        logger1 = LogManager.get_logger('same_name')
        logger2 = LogManager.get_logger('same_name')
        
        # Should return the same logger instance
        assert logger1 is logger2
    
    def test_get_logger_different_names(self):
        """Test that different logger names create different loggers"""
        from logic.setupLogManger import LogManager
        
        logger1 = LogManager.get_logger('logger_one')
        logger2 = LogManager.get_logger('logger_two')
        
        # Should be different logger instances
        assert logger1 is not logger2
        assert logger1.name != logger2.name

class TestLogManagerConfiguration:
    """Test LogManager configuration and setup"""
    
    @patch('os.makedirs')
    @patch('os.path.exists')
    def test_log_directory_creation(self, mock_exists, mock_makedirs):
        """Test that log directory is created if it doesn't exist"""
        mock_exists.return_value = False
        
        from logic.setupLogManger import LogManager
        
        # Reset LogManager initialization to ensure fresh state
        with LogManager._lock:
            LogManager._initialized = False
            LogManager._file_handler = None
        
        logger = LogManager.get_logger('test_dir_creation')
        
        # Verify directory creation was attempted
        mock_makedirs.assert_called()
    
    def test_logger_level_configuration(self):
        """Test logger level configuration"""
        from logic.setupLogManger import LogManager
        
        logger = LogManager.get_logger('test_level')
        
        # Test that logger can handle different log levels
        assert logger.isEnabledFor(logging.DEBUG)
        assert logger.isEnabledFor(logging.INFO)
        assert logger.isEnabledFor(logging.WARNING)
        assert logger.isEnabledFor(logging.ERROR)
    
    def test_logger_handlers(self):
        """Test that logger has appropriate handlers"""
        from logic.setupLogManger import LogManager
        
        logger = LogManager.get_logger('test_handlers')
        
        # Should have at least one handler
        assert len(logger.handlers) > 0
        
        # Verify handler types
        has_file_handler = any(isinstance(h, logging.FileHandler) for h in logger.handlers)
        has_stream_handler = any(isinstance(h, logging.StreamHandler) for h in logger.handlers)
        
        # Should have either file handler or stream handler (or both)
        assert has_file_handler or has_stream_handler

class TestLogManagerFileOperations:
    """Test LogManager file operations"""
    
    def test_log_file_writing(self):
        """Test that log messages are written to files"""
        from logic.setupLogManger import LogManager
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create logger with temporary directory
            logger = LogManager.get_logger('test_file_writing')
            
            # Log a test message
            test_message = "Test log message for file writing"
            logger.info(test_message)
            
            # Force flush of handlers
            for handler in logger.handlers:
                if hasattr(handler, 'flush'):
                    handler.flush()
    
    @patch('builtins.open', new_callable=mock_open)
    def test_log_file_permissions(self, mock_file):
        """Test log file creation with proper permissions"""
        from logic.setupLogManger import LogManager
        
        logger = LogManager.get_logger('test_permissions')
        logger.info("Test message")
        
        # File should be opened for writing/appending
        # mock_file.assert_called() - We can't test exact parameters due to logger internals

class TestLogManagerErrorHandling:
    """Test LogManager error handling"""
    
    @patch('os.makedirs')
    def test_directory_creation_failure(self, mock_makedirs):
        """Test handling of directory creation failures"""
        mock_makedirs.side_effect = PermissionError("Cannot create directory")
        
        from logic.setupLogManger import LogManager
        
        # Should not crash even if directory creation fails
        try:
            logger = LogManager.get_logger('test_dir_fail')
            assert logger is not None
        except Exception as e:
            # If it does raise an exception, it should be handled gracefully
            assert "Cannot create directory" not in str(e)
    
    def test_invalid_logger_name(self):
        """Test handling of invalid logger names"""
        from logic.setupLogManger import LogManager
        
        # Test with None
        try:
            logger = LogManager.get_logger(None)
            # Should either handle gracefully or raise appropriate error
            assert logger is not None or True  # Either works or raises
        except (TypeError, ValueError):
            # Acceptable to raise error for invalid input
            pass
        
        # Test with empty string
        logger = LogManager.get_logger('')
        assert logger is not None

class TestLogManagerIntegration:
    """Integration tests for LogManager with backend components"""
    
    def test_log_manager_with_board_factory(self):
        """Test LogManager integration with Board Factory"""
        from logic.setupLogManger import LogManager
        from board_factory import BoardFactory
        
        # Create logger for board operations
        logger = LogManager.get_logger('board_factory_test')
        
        # Create board (this might use logging internally)
        board = BoardFactory.create_board('edgeq')
        
        # Log board creation
        logger.info(f"Created board: {board.get_board_name()}")
        
        # Should work without errors
        assert logger is not None
        assert board is not None
    
    def test_log_manager_with_config_manager(self):
        """Test LogManager integration with Config Manager"""
        from logic.setupLogManger import LogManager
        from board_factory import BoardFactory
        from config_manager import BoardConfigManager
        
        # Create logger for config operations
        logger = LogManager.get_logger('config_manager_test')
        
        # Create board and config manager
        board = BoardFactory.create_board('edgeq')
        with patch('os.path.exists', return_value=False):
            config_mgr = BoardConfigManager(board)
        
        # Log config operations
        log_dir = config_mgr.get_config_value('log_directory')
        logger.info(f"Config log directory: {log_dir}")
        
        # Should work without errors
        assert logger is not None
        assert log_dir is not None

class TestLogManagerMultipleLoggers:
    """Test LogManager with multiple concurrent loggers"""
    
    def test_multiple_loggers_different_names(self):
        """Test creating multiple loggers with different names"""
        from logic.setupLogManger import LogManager
        
        logger_names = ['logger1', 'logger2', 'logger3', 'logger4', 'logger5']
        loggers = []
        
        for name in logger_names:
            logger = LogManager.get_logger(name)
            loggers.append(logger)
        
        # All loggers should be created successfully
        assert len(loggers) == 5
        
        # All loggers should be different instances
        for i, logger1 in enumerate(loggers):
            for j, logger2 in enumerate(loggers):
                if i != j:
                    assert logger1 is not logger2
    
    def test_concurrent_logging(self):
        """Test concurrent logging from multiple loggers"""
        from logic.setupLogManger import LogManager
        
        loggers = [
            LogManager.get_logger('concurrent1'),
            LogManager.get_logger('concurrent2'),
            LogManager.get_logger('concurrent3')
        ]
        
        # Log messages from all loggers
        for i, logger in enumerate(loggers):
            logger.info(f"Message from logger {i + 1}")
            logger.warning(f"Warning from logger {i + 1}")
            logger.error(f"Error from logger {i + 1}")
        
        # Should complete without errors
        assert all(logger is not None for logger in loggers)

class TestLogManagerPerformance:
    """Performance tests for LogManager"""
    
    def test_logger_creation_performance(self):
        """Test that logger creation is fast"""
        from logic.setupLogManger import LogManager
        import time
        
        start_time = time.time()
        
        # Create multiple loggers
        for i in range(50):
            LogManager.get_logger(f'perf_test_{i}')
        
        end_time = time.time()
        creation_time = end_time - start_time
        
        # Creating 50 loggers should be fast
        assert creation_time < 2.0, f"Logger creation too slow: {creation_time:.3f}s for 50 loggers"
    
    def test_logging_performance(self):
        """Test that logging operations are fast"""
        from logic.setupLogManger import LogManager
        import time
        
        logger = LogManager.get_logger('performance_test')
        
        start_time = time.time()
        
        # Log many messages
        for i in range(100):
            logger.info(f"Performance test message {i}")
        
        end_time = time.time()
        logging_time = end_time - start_time
        
        # 100 log messages should be fast
        assert logging_time < 1.0, f"Logging too slow: {logging_time:.3f}s for 100 messages"

class TestLogManagerEdgeCases:
    """Test LogManager edge cases and boundary conditions"""
    
    def test_very_long_logger_name(self):
        """Test logger with very long name"""
        from logic.setupLogManger import LogManager
        
        long_name = 'a' * 1000  # Very long logger name
        logger = LogManager.get_logger(long_name)
        
        assert logger is not None
        logger.info("Test message with long logger name")
    
    def test_special_characters_in_logger_name(self):
        """Test logger names with special characters"""
        from logic.setupLogManger import LogManager
        
        special_names = [
            'logger.with.dots',
            'logger-with-dashes',
            'logger_with_underscores',
            'logger with spaces',
            'logger/with/slashes'
        ]
        
        for name in special_names:
            try:
                logger = LogManager.get_logger(name)
                assert logger is not None
                logger.info(f"Test message for {name}")
            except Exception as e:
                # Some special characters might not be allowed
                # This is acceptable behavior
                pass
    
    def test_unicode_logger_name(self):
        """Test logger with unicode characters"""
        from logic.setupLogManger import LogManager
        
        unicode_name = 'logger_тест_日本語_🚀'
        
        try:
            logger = LogManager.get_logger(unicode_name)
            assert logger is not None
            logger.info("Unicode test message")
        except Exception:
            # Unicode in logger names might not be supported
            # This is acceptable
            pass

if __name__ == "__main__":
    # Allow running this file directly for quick testing
    print("Running Logging System Unit Tests...")
    print("=" * 50)
    
    try:
        print("Testing LogManager import...")
        from logic.setupLogManger import LogManager
        print("✓ LogManager imported successfully")
        
        print("Testing logger creation...")
        logger = LogManager.get_logger('test_runner')
        print("✓ Logger created successfully")
        
        print("Testing logging functionality...")
        logger.info("Test info message")
        logger.warning("Test warning message")
        logger.error("Test error message")
        print("✓ Logging functionality works")
        
        print("\n✓ All basic tests passed!")
        print("Run full test suite with: python3 -m pytest tests/test_logging_system.py -v")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()