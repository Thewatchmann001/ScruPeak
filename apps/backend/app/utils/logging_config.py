"""
Logging configuration for structured logging
"""
import sys
from typing import Dict, Any


def get_logging_config(settings) -> Dict[str, Any]:
    """Get logging configuration dictionary"""
    
    if settings.LOG_FORMAT == "json":
        # JSON structured logging
        formatter_class = "app.utils.logging_config.JSONFormatter"
    else:
        # Standard text logging
        formatter_class = "logging.Formatter"
    
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(funcName)s() - %(message)s"
            },
            "json": {
                "()": "app.utils.logging_config.JSONFormatter"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.LOG_LEVEL,
                "formatter": "json" if settings.LOG_FORMAT == "json" else "standard",
                "stream": "ext://sys.stdout"
            }
        },
        "loggers": {
            "app": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False
            }
        },
        "root": {
            "level": settings.LOG_LEVEL,
            "handlers": ["console"]
        }
    }


import json
import logging
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """JSON structured logging formatter"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        
        return json.dumps(log_obj)
