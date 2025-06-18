import argparse
import os
import sys
from boards.edgeq_board import EdgeQBoard

class BoardFactory:
    # Available board types mapping
    AVAILABLE_BOARDS = {
        'edgeq': EdgeQBoard
    }
    
    @staticmethod
    def create_board(board_type: str = None):
        """Create board instance based on type or auto-detection"""
        
        if board_type is None:
            board_type = BoardFactory.detect_board_type()
        
        board_type_lower = board_type.lower()
        if board_type_lower in BoardFactory.AVAILABLE_BOARDS:
            return BoardFactory.AVAILABLE_BOARDS[board_type_lower]()
        else:
            available = ', '.join(BoardFactory.AVAILABLE_BOARDS.keys())
            raise ValueError(f"Unsupported board type: {board_type}. Available: {available}")
    
    @staticmethod
    def detect_board_type():
        """Auto-detect board type based on system characteristics"""
        # Check for EdgeQ-specific paths from your current code
        if os.path.exists("/opt/ste/bin/gnb_commission"):
            return "edgeq"
        if os.path.exists("/opt/ste/active/commissioning/configs/"):
            return "edgeq"
        
        # Default to EdgeQ if no specific detection (maintains backward compatibility)
        return "edgeq"
    
    @staticmethod
    def parse_board_from_args():
        """Parse board type from command line arguments with new interface"""
        parser = argparse.ArgumentParser(
            description='gNB Dashboard - Multi-Board Support',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  python3 WebDashboard.py          # Auto-detect board (defaults to EdgeQ)
  python3 WebDashboard.py --edgeq  # Use EdgeQ board explicitly
  python3 WebDashboard.py --help   # Show this help message

Supported Boards:
  EdgeQ - 5G gNodeB platform with EdgeQ chipsets
            """
        )
        
        # Create mutually exclusive group for board selection
        board_group = parser.add_mutually_exclusive_group()
        
        # Add board-specific arguments (without --board prefix)
        board_group.add_argument('--edgeq', action='store_true',
                               help='Use EdgeQ board configuration')
        
        # Future board types can be added here:
        # board_group.add_argument('--qualcomm', action='store_true', 
        #                        help='Use Qualcomm board configuration')
        # board_group.add_argument('--intel', action='store_true',
        #                        help='Use Intel board configuration')
        
        try:
            args = parser.parse_args()
        except SystemExit as e:
            # argparse calls sys.exit() for --help or invalid args
            # Re-raise to let the caller handle it gracefully
            raise e
        
        # Determine which board was selected
        if args.edgeq:
            return 'edgeq'
        
        # If no specific board argument provided, return None for auto-detection
        return None
    
    @staticmethod
    def get_available_boards():
        """Get list of available board types"""
        return list(BoardFactory.AVAILABLE_BOARDS.keys())
    
    @staticmethod
    def show_board_info():
        """Show information about available boards"""
        print("Available Board Types:")
        print("=" * 50)
        
        for board_name, board_class in BoardFactory.AVAILABLE_BOARDS.items():
            try:
                # Create temporary instance to get board info
                temp_board = board_class()
                config = temp_board.get_board_config()
                
                print(f"• {board_name.upper()}")
                print(f"  Description: {board_class.__doc__ or '5G gNodeB platform'}")
                print(f"  Config Path: {config.get('config_file_path', 'N/A')}")
                print(f"  Log Directory: {config.get('log_directory', 'N/A')}")
                print()
            except Exception as e:
                print(f"• {board_name.upper()}: Error loading board info - {e}")
                print()