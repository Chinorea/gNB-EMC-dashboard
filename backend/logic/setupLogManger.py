import logging
import logging.handlers
import os
import threading

class LogManager:
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    _LOG_FILE = "setup_log.txt"
    _file_handler = None
    _board_config_manager = None  # Reference to the board config manager

    @classmethod
    def set_config_manager(cls, config_manager):
        """
        Set the board config manager as the single source of truth for log directory.
        This should be called once during application initialization.
        """
        with cls._lock:
            cls._board_config_manager = config_manager
            # Reset initialization to force re-initialization with new config
            if cls._initialized:
                cls._initialized = False
                cls._file_handler = None

    @classmethod
    def get_log_directory(cls):
        """
        Get log directory from board config manager (single source of truth).
        Falls back to hardcoded path if config manager not available.
        """
        if cls._board_config_manager:
            return cls._board_config_manager.get_config_value('log_directory')
        else:
            # Fallback for legacy usage or if config manager not set
            return "/opt/webdashboard/logdump"

    @classmethod
    def get_logger(cls, name='setup_script'):
        """
        Get a logger instance in a thread-safe way.
        Each logger is unique to the name provided but shares the same file handler.
        """
        with cls._lock:
            if not cls._initialized:
                cls._initialize_logging()
            
            # Get a logger specific to this request
            logger = logging.getLogger(name)
            logger.setLevel(logging.DEBUG)  # Set logger level
            
            if not logger.handlers:  # Only add handlers if they don't exist
                # Add handlers specific to this logger instance
                console_handler = logging.StreamHandler()
                console_handler.setLevel(logging.INFO)
                console_formatter = logging.Formatter('%(levelname)s: %(message)s')
                console_handler.setFormatter(console_formatter)
                logger.addHandler(console_handler)
                
                # Add the shared file handler
                if cls._file_handler:
                    logger.addHandler(cls._file_handler)
            
            # Enable propagation for better visibility
            logger.propagate = True
                
            return logger

    @classmethod
    def _initialize_logging(cls):
        """Initialize shared logging configuration using board config as single source of truth"""
        if cls._initialized:
            return

        # Set root logger level
        logging.getLogger().setLevel(logging.DEBUG)

        # Get log directory from single source of truth
        log_dir = cls.get_log_directory()

        # Ensure log directory exists
        if not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir)
            except PermissionError:
                # Fallback to local logs directory if configured path is not writable
                log_dir = "logs"
                if not os.path.exists(log_dir):
                    os.makedirs(log_dir)

        # Setup shared file handler with immediate flushing
        log_file = os.path.join(log_dir, cls._LOG_FILE)
        cls._file_handler = RealTimeRotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        cls._file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '[%(asctime)s] - [%(name)s] - [%(levelname)s] - %(message)s'
        )
        cls._file_handler.setFormatter(file_formatter)
        
        cls._initialized = True

    @staticmethod
    def setup_logging():
        """
        Maintained for backward compatibility.
        Returns a logger instance for the setup script.
        """
        return LogManager.get_logger('setup_script')

class RealTimeRotatingFileHandler(logging.handlers.RotatingFileHandler):
    """Custom RotatingFileHandler that ensures immediate writes"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.mode = 'a'  # Always append mode
        
    def emit(self, record):
        """Override emit to force flush after each write"""
        try:
            super().emit(record)
            self.flush()
            if self.stream:
                self.stream.flush()
                os.fsync(self.stream.fileno())
        except Exception:
            self.handleError(record)