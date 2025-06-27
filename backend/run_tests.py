#!/usr/bin/env python3
"""
Test Runner for Backend Unit Tests
Provides easy commands to run different test suites
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """Run a command and display results"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print('='*60)
    
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent, capture_output=False)
        return result.returncode == 0
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def main():
    """Main test runner function"""
    if len(sys.argv) < 2:
        print("Backend Test Runner")
        print("==================")
        print("Usage: python run_tests.py <command>")
        print()
        print("Available commands:")
        print("  all           - Run all tests")
        print("  board_factory - Run Board Factory tests")
        print("  config_manager- Run Config Manager tests")
        print("  logging_system- Run Logging System tests")
        print("  edgeq_attributes- Run EdgeQ Attributes tests")
        print("  flask_api     - Run Flask API tests")
        print("  edgeq_board   - Run EdgeQ Board tests")
        print("  unit          - Run only unit tests")
        print("  integration   - Run only integration tests")
        print("  quick         - Run quick tests (no slow tests)")
        print("  coverage      - Run tests with coverage report")
        print("  verbose       - Run tests with maximum verbosity")
        print()
        print("Examples:")
        print("  python run_tests.py all")
        print("  python run_tests.py board_factory")
        print("  python run_tests.py config_manager")
        print("  python run_tests.py logging_system")
        print("  python run_tests.py edgeq_attributes")
        print("  python run_tests.py flask_api")
        return

    command = sys.argv[1].lower()
    
    # Base pytest command
    base_cmd = [sys.executable, "-m", "pytest"]
    
    if command == "all":
        cmd = base_cmd + ["tests/", "-v"]
        success = run_command(cmd, "All Tests")
    
    elif command == "board_factory":
        cmd = base_cmd + ["tests/test_board_factory.py", "-v"]
        success = run_command(cmd, "Board Factory Tests")
    
    elif command == "config_manager":
        cmd = base_cmd + ["tests/test_config_manager.py", "-v"]
        success = run_command(cmd, "Config Manager Tests")
    
    elif command == "logging_system":
        cmd = base_cmd + ["tests/test_logging_system.py", "-v"]
        success = run_command(cmd, "Logging System Tests")
    
    elif command == "edgeq_attributes":
        cmd = base_cmd + ["tests/test_edgeq_attributes.py", "-v"]
        success = run_command(cmd, "EdgeQ Attributes Tests")
    
    elif command == "flask_api":
        cmd = base_cmd + ["tests/test_flask_api.py", "-v"]
        success = run_command(cmd, "Flask API Tests")
    
    elif command == "edgeq_board":
        cmd = base_cmd + ["tests/boards/test_edgeq_board.py", "-v"]
        success = run_command(cmd, "EdgeQ Board Tests")
    
    elif command == "unit":
        cmd = base_cmd + ["tests/", "-m", "unit", "-v"]
        success = run_command(cmd, "Unit Tests Only")
    
    elif command == "integration":
        cmd = base_cmd + ["tests/", "-m", "integration", "-v"]
        success = run_command(cmd, "Integration Tests Only")
    
    elif command == "quick":
        cmd = base_cmd + ["tests/", "-m", "not slow", "-v"]
        success = run_command(cmd, "Quick Tests (No Slow Tests)")
    
    elif command == "coverage":
        # First try to run with coverage
        try:
            cmd = [sys.executable, "-m", "pytest", "tests/", "--cov=.", "--cov-report=html", "--cov-report=term", "-v"]
            success = run_command(cmd, "Tests with Coverage Report")
            if success:
                print("\nCoverage report generated in htmlcov/ directory")
        except:
            print("Coverage package not installed. Running tests without coverage...")
            cmd = base_cmd + ["tests/", "-v"]
            success = run_command(cmd, "All Tests (No Coverage)")
    
    elif command == "verbose":
        cmd = base_cmd + ["tests/", "-vvv", "--tb=long"]
        success = run_command(cmd, "Verbose Tests")
    
    else:
        print(f"Unknown command: {command}")
        print("Run 'python run_tests.py' to see available commands")
        return
    
    # Summary
    print(f"\n{'='*60}")
    if success:
        print("✓ Tests completed successfully!")
    else:
        print("✗ Some tests failed!")
    print('='*60)

if __name__ == "__main__":
    main()