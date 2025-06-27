# Test configuration and utilities for backend unit tests
import sys
import os
import pytest
from pathlib import Path

# Add backend directory to Python path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Also add the parent directory to handle relative imports within backend
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Add specific subdirectories that contain modules
boards_dir = backend_dir / "boards"
logic_dir = backend_dir / "logic"

if str(boards_dir) not in sys.path:
    sys.path.insert(0, str(boards_dir))
if str(logic_dir) not in sys.path:
    sys.path.insert(0, str(logic_dir))

# Test configuration
TEST_CONFIG = {
    "timeout": 30,
    "mock_hardware": True,
    "log_level": "DEBUG"
}

def get_backend_path():
    """Get the absolute path to the backend directory"""
    return backend_dir

def get_test_data_path():
    """Get the path to test data directory"""
    return Path(__file__).parent / "data"

# Common test fixtures and utilities can be defined here
@pytest.fixture
def mock_config():
    """Mock configuration for testing"""
    return {
        "config_file_path": "/opt/test/config.json",
        "log_directory": "/tmp/test_logs",
        "timeouts": {
            "raptor_status": 3,
            "setup_max_wait": 120
        }
    }