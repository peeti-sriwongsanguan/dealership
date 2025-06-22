# utils/error_handler.py
import logging
import traceback
from functools import wraps
from typing import Callable, Any, Optional
import tkinter as tk
from tkinter import messagebox
from enum import Enum


class ErrorSeverity(Enum):
    """Error severity levels"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ErrorHandler:
    """Centralized error handling for the application"""

    def __init__(self):
        self.setup_logging()

    def setup_logging(self):
        """Configure application logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/ol_service.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def handle_exception(self, exception: Exception, context: str = "",
                         severity: ErrorSeverity = ErrorSeverity.ERROR,
                         show_user: bool = True) -> None:
        """Handle exceptions with logging and user notification"""

        error_msg = f"Error in {context}: {str(exception)}"

        # Log the error
        if severity == ErrorSeverity.CRITICAL:
            self.logger.critical(error_msg, exc_info=True)
        elif severity == ErrorSeverity.ERROR:
            self.logger.error(error_msg, exc_info=True)
        elif severity == ErrorSeverity.WARNING:
            self.logger.warning(error_msg)
        else:
            self.logger.info(error_msg)

        # Show user-friendly message
        if show_user:
            self._show_user_message(exception, context, severity)

    def _show_user_message(self, exception: Exception, context: str,
                           severity: ErrorSeverity) -> None:
        """Show user-friendly error message"""
        try:
            if severity == ErrorSeverity.CRITICAL:
                title = "Critical Error"
                message = f"A critical error occurred in {context}. The application may need to be restarted."
                messagebox.showerror(title, message)
            elif severity == ErrorSeverity.ERROR:
                title = "Error"
                message = f"An error occurred: {self._get_user_friendly_message(exception)}"
                messagebox.showerror(title, message)
            elif severity == ErrorSeverity.WARNING:
                title = "Warning"
                message = f"Warning: {str(exception)}"
                messagebox.showwarning(title, message)
            else:
                title = "Information"
                message = str(exception)
                messagebox.showinfo(title, message)
        except:
            # Fallback if GUI message fails
            print(f"Error: {exception}")

    def _get_user_friendly_message(self, exception: Exception) -> str:
        """Convert technical exceptions to user-friendly messages"""
        error_map = {
            'UNIQUE constraint failed': 'This record already exists.',
            'FOREIGN KEY constraint failed': 'Cannot delete - this record is being used elsewhere.',
            'NOT NULL constraint failed': 'Required information is missing.',
            'database is locked': 'Database is busy. Please try again.',
            'no such table': 'Database error - table not found.',
            'disk I/O error': 'Disk error - please check disk space.',
        }

        error_str = str(exception).lower()
        for key, friendly_msg in error_map.items():
            if key.lower() in error_str:
                return friendly_msg

        return "An unexpected error occurred. Please try again."


# Global error handler instance
error_handler = ErrorHandler()


def handle_errors(context: str = "", severity: ErrorSeverity = ErrorSeverity.ERROR,
                  show_user: bool = True, reraise: bool = False):
    """Decorator for automatic error handling"""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                error_handler.handle_exception(
                    e,
                    context or func.__name__,
                    severity,
                    show_user
                )
                if reraise:
                    raise
                return None

        return wrapper

    return decorator


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


class BusinessLogicError(Exception):
    """Custom exception for business logic errors"""
    pass


class DatabaseError(Exception):
    """Custom exception for database errors"""
    pass


def validate_input(value: Any, field_name: str, required: bool = False,
                   min_length: int = 0, max_length: int = None,
                   pattern: str = None) -> str:
    """Validate input with common rules"""
    import re

    if value is None:
        value = ""

    value = str(value).strip()

    # Required field check
    if required and not value:
        raise ValidationError(f"{field_name} is required")

    # Length checks
    if value and len(value) < min_length:
        raise ValidationError(f"{field_name} must be at least {min_length} characters")

    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name} cannot exceed {max_length} characters")

    # Pattern validation
    if pattern and value and not re.match(pattern, value):
        raise ValidationError(f"{field_name} format is invalid")

    return value


def validate_email(email: str) -> str:
    """Validate email format"""
    if not email:
        return ""

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return validate_input(email, "Email", pattern=pattern)


def validate_phone(phone: str) -> str:
    """Validate phone number format"""
    if not phone:
        return ""

    # Remove non-digit characters for validation
    digits_only = ''.join(filter(str.isdigit, phone))

    if len(digits_only) < 10:
        raise ValidationError("Phone number must have at least 10 digits")

    return phone


@handle_errors("Database Connection Test")
def test_database_connection():
    """Test database connection"""
    from database.connection_manager import db_manager

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()

    if result:
        error_handler.logger.info("Database connection test successful")
        return True
    else:
        raise DatabaseError("Database connection test failed")


# Example usage in a form validation function
@handle_errors("Customer Form Validation", ErrorSeverity.WARNING)
def validate_customer_form(name: str, email: str, phone: str) -> dict:
    """Validate customer form data"""
    validated_data = {}

    validated_data['name'] = validate_input(
        name, "Customer Name", required=True, min_length=2, max_length=100
    )

    validated_data['email'] = validate_email(email)
    validated_data['phone'] = validate_phone(phone)

    return validated_data