import logging
import sys
from datetime import datetime

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels."""
    
    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record):
        # Add color to the level name
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.COLORS['RESET']}"
        
        # Format the message
        return super().format(record)

def setup_logging():
    """Set up enhanced logging configuration."""
    
    # Create formatters
    detailed_formatter = ColoredFormatter(
        '%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s',
        datefmt='%H:%M:%S'
    )
    
    simple_formatter = ColoredFormatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    loggers_config = {
        'frontline.agents': {'level': logging.INFO, 'formatter': simple_formatter},
        'frontline.gemini': {'level': logging.INFO, 'formatter': simple_formatter},
        'frontline.flow': {'level': logging.INFO, 'formatter': simple_formatter},
        'google_adk': {'level': logging.INFO, 'formatter': simple_formatter},
        'google_adk.agents': {'level': logging.INFO, 'formatter': simple_formatter},
        'uvicorn': {'level': logging.WARNING, 'formatter': simple_formatter},
        'uvicorn.access': {'level': logging.WARNING, 'formatter': simple_formatter},
    }
    
    for logger_name, config in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(config['level'])
        
        # Remove existing handlers
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)
        
        # Add console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(config['level'])
        handler.setFormatter(config['formatter'])
        logger.addHandler(handler)
    
    # Disable propagation for specific loggers to avoid duplicate messages
    for logger_name in ['frontline.agents', 'frontline.gemini', 'frontline.flow']:
        logging.getLogger(logger_name).propagate = False
    # Also disable propagation for google_adk to avoid duplicate messages
    for logger_name in ['google_adk', 'google_adk.agents']:
        logging.getLogger(logger_name).propagate = False

def log_separator(title: str = "", char: str = "=", length: int = 60):
    """Log a visual separator."""
    if title:
        padding = (length - len(title) - 2) // 2
        separator = f"{char * padding} {title} {char * padding}"
    else:
        separator = char * length
    
    print(f"\n{separator}")

def log_case_summary(case_id: str, case_type: str, urgency: str, lite: bool, target_name: str = None):
    """Log a formatted case summary."""
    print(f"\n📋 CASE SUMMARY")
    print(f"   ID: {case_id}")
    print(f"   Type: {case_type.upper()}")
    print(f"   Urgency: {urgency.upper()}")
    print(f"   Mode: {'LITE' if lite else 'FULL'}")
    if target_name:
        print(f"   Target: {target_name}")
    print(f"   Time: {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 40)

