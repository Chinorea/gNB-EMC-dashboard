#!/usr/bin/env python3
"""
pytest configuration file (conftest.py)
Automatically loaded by pytest to configure test environment
"""

import sys
import os
from pathlib import Path

# Get the backend directory (parent of tests directory)
backend_dir = Path(__file__).parent.parent.absolute()

# Add backend directory to Python path
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change working directory to backend for proper relative imports
os.chdir(backend_dir)

# Ensure we can import all backend modules
print(f"Test environment setup: backend_dir = {backend_dir}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path includes: {backend_dir}")

# Test that critical imports work
try:
    import board_factory
    print("✓ board_factory import successful")
except ImportError as e:
    print(f"✗ board_factory import failed: {e}")

try:
    from boards.edgeq_board import EdgeQBoard
    print("✓ EdgeQBoard import successful")
except ImportError as e:
    print(f"✗ EdgeQBoard import failed: {e}")

try:
    import config_manager
    print("✓ config_manager import successful")
except ImportError as e:
    print(f"✗ config_manager import failed: {e}")