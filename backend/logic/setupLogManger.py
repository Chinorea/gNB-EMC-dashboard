import logging
import logging.handlers
import os
import threading

class LogManager:
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    _LOG_DIR = "/logdump"
    _LOG_FILE = "setup_log.txt"

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
            if not logger.handlers:  # Only add handlers if they don't exist
                # Add handlers specific to this logger instance
                console_handler = logging.StreamHandler()
                console_handler.setLevel(logging.INFO)
                console_formatter = logging.Formatter('%(levelname)s: %(message)s')
                console_handler.setFormatter(console_formatter)
                logger.addHandler(console_handler)
                
                # Add the shared file handler
                logger.addHandler(cls._file_handler)
            
            # Force immediate output without buffering
            logger.propagate = False
            for handler in logger.handlers:
                handler.flush()
                
            return logger

    @classmethod
    def _initialize_logging(cls):
        """Initialize shared logging configuration"""
        if cls._initialized:
            return

        # Ensure log directory exists
        if not os.path.exists(cls._LOG_DIR):
            try:
                os.makedirs(cls._LOG_DIR)
            except PermissionError:
                # Fallback to local logs directory if /logdump is not writable
                cls._LOG_DIR = "logs"
                if not os.path.exists(cls._LOG_DIR):
                    os.makedirs(cls._LOG_DIR)

        # Setup shared file handler with immediate flushing
        log_file = os.path.join(cls._LOG_DIR, cls._LOG_FILE)
        cls._file_handler = RealTimeRotatingFileHandler(  # Custom handler for real-time writes
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
        super().emit(record)
        self.flush()
        if self.stream:
            self.stream.flush()
            os.fsync(self.stream.fileno())