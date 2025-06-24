#!/usr/bin/env python3
"""
gNB Dashboard Main Entry Point
Supports multiple board types with automatic detection
"""

import sys
import os
import subprocess
import importlib.util

# Ensure the backend directory is in the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def check_all_dependencies():
    """
    Check if all required dependencies are available.
    Returns True if all dependencies are installed, False otherwise.
    """
    required_modules = [
        'flask', 
        'flask_cors',
        'zeroconf',  # from mdns_pkgs
        'pexpect',   # from pexpect_pkgs
        'pytest'     # from pytest_pkgs
    ]
    
    missing_modules = []
    
    for module in required_modules:
        if importlib.util.find_spec(module) is None:
            missing_modules.append(module)
    
    if missing_modules:
        print(f"Missing modules detected: {', '.join(missing_modules)}")
        return False
    
    print("All required dependencies are already installed.")
    return True

def install_all_dependencies():
    """
    Install all dependencies from local wheel files.
    This handles boards without internet access by using pre-downloaded packages.
    """
    dependencies_dir = os.path.join(backend_dir, "dependencies")
    
    # List of dependency directories to install from
    dep_dirs = [
        "flask_pkgs",
        "mdns_pkgs", 
        "pexpect_pkgs",
        "pytest_pkgs"
    ]
    
    print("Installing dependencies from local packages...")
    
    for dep_dir in dep_dirs:
        dep_path = os.path.join(dependencies_dir, dep_dir)
        if os.path.exists(dep_path):
            try:
                # Install all .whl files in the directory
                wheel_files = [f for f in os.listdir(dep_path) if f.endswith('.whl')]
                if wheel_files:
                    print(f"Installing packages from {dep_dir}...")
                    for wheel_file in wheel_files:
                        wheel_path = os.path.join(dep_path, wheel_file)
                        try:
                            subprocess.run([
                                sys.executable, "-m", "pip", "install", 
                                wheel_path, "--force-reinstall", "--no-deps"
                            ], check=True, capture_output=True, text=True)
                        except subprocess.CalledProcessError:
                            # Try without --force-reinstall for compatibility
                            try:
                                subprocess.run([
                                    sys.executable, "-m", "pip", "install", 
                                    wheel_path, "--no-deps"
                                ], check=True, capture_output=True, text=True)
                            except subprocess.CalledProcessError as e:
                                print(f"Warning: Could not install {wheel_file}: {e}")
            except Exception as e:
                print(f"Warning: Could not install packages from {dep_dir}: {e}")
                continue
        else:
            print(f"Warning: Directory {dep_path} not found, skipping...")
    
    print("Dependency installation completed.")

def check_critical_imports():
    """
    Check if critical imports are available after installation.
    """
    critical_modules = ['flask', 'flask_cors']
    missing_modules = []
    
    for module in critical_modules:
        if importlib.util.find_spec(module) is None:
            missing_modules.append(module)
    
    if missing_modules:
        print(f"ERROR: Could not find required modules after installation: {', '.join(missing_modules)}")
        print("Please check your Python environment or manually install dependencies.")
        return False
    
    return True

if __name__ == "__main__":
    # Check if dependencies are already installed
    if not check_all_dependencies():
        # Install dependencies only if needed
        install_all_dependencies()
        
        # Verify critical imports are available after installation
        if not check_critical_imports():
            sys.exit(1)
    else:
        print("Skipping dependency installation - all packages already available.")
    
    # Handle command line arguments and help
    try:
        from board_factory import BoardFactory
        
        # Parse arguments - this will handle --help gracefully
        board_type = BoardFactory.parse_board_from_args()
        
    except SystemExit as e:
        # Handle --help or argument errors gracefully
        if e.code == 0:  # --help was called
            sys.exit(0)
        else:  # Invalid arguments
            print("\nFor help, use: python3 WebDashboard.py --help")
            sys.exit(e.code)
    except Exception as e:
        print(f"ERROR: Failed to parse arguments: {str(e)}")
        print("For help, use: python3 WebDashboard.py --help")
        sys.exit(1)
    
    # Display startup information (only on main process, not on Flask restart)
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        print("=" * 60)
        print("gNB Dashboard - Multi-Board Support")
        print("=" * 60)
          # Show detected/selected board type
        if board_type:
            print(f"Board type: {board_type} (explicitly specified)")
        else:
            print("Board type: auto-detect (defaults to EdgeQ)")
        
        print(f"Available boards: {', '.join(BoardFactory.get_available_boards())}")
        print("For help: python3 WebDashboard.py --help")
        print("-" * 60)
    
    try:        # Import and start the Flask application
        from Flask import app
        
        # Only show startup messages on main process
        if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
            print("Starting Flask application...")
            print("Board system initialized successfully")
            print("Dependencies verified")
            print("Access the dashboard at: http://localhost:5000")
            print("=" * 60)
        
        app.run(host="0.0.0.0", port=5000, debug=True)  # Keep debug mode
        
    except Exception as e:
        print(f"ERROR: Failed to start application: {str(e)}")
        print("Please check that all dependencies are installed.")
        print("\nFor board information, use: python3 WebDashboard.py --help")
        sys.exit(1)

