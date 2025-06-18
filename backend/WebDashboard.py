#!/usr/bin/env python3
"""
gNB Dashboard Main Entry Point
Supports multiple board types with automatic detection
"""

import sys
import os

# Ensure the backend directory is in the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
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
    
    try:
        # Import and start the Flask application
        from Flask import app
        
        # Only show startup messages on main process
        if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
            print("Starting Flask application...")
            print("Board system initialized successfully")
            print("Access the dashboard at: http://localhost:5000")
            print("=" * 60)
        
        app.run(host="0.0.0.0", port=5000, debug=True)  # Keep debug mode
        
    except Exception as e:
        print(f"ERROR: Failed to start application: {str(e)}")
        print("Please check that all dependencies are installed.")
        print("\nFor board information, use: python3 WebDashboard.py --help")
        sys.exit(1)

