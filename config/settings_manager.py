# config/settings_manager.py
"""
Settings Manager for OL Service POS System
Handles configuration loading, validation, and management
"""

import os
import json
import configparser
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dotenv import load_dotenv


class SettingsManager:
    """Centralized settings management for the POS system"""

    def __init__(self):
        self.config_dir = Path("config")
        self.config_file = self.config_dir / "settings.ini"
        self.env_file = Path(".env")

        # Load environment variables
        load_dotenv(self.env_file)

        # Initialize configuration
        self.config = configparser.ConfigParser()
        self._load_default_config()
        self._load_config_file()

        # Validate configuration
        self.validation_errors = self.validate_config()

    def _load_default_config(self):
        """Load default configuration settings"""
        defaults = {
            'database': {
                'path': 'data/ol_service_pos.db',
                'backup_enabled': 'true',
                'backup_interval': '24',  # hours
                'max_backups': '7'
            },
            'ui': {
                'theme': 'default',
                'window_width': '1200',
                'window_height': '800',
                'fullscreen': 'false',
                'font_size': '12',
                'touch_mode': 'false'
            },
            'camera': {
                'default_camera': '0',
                'resolution_width': '1280',
                'resolution_height': '720',
                'fps': '30',
                'auto_focus': 'true'
            },
            'images': {
                'max_file_size': '10485760',  # 10MB in bytes
                'thumbnail_size': '200',
                'compression_quality': '85',
                'allowed_formats': 'jpg,jpeg,png,bmp'
            },
            'security': {
                'session_timeout': '3600',  # 1 hour in seconds
                'max_login_attempts': '3',
                'password_min_length': '6',
                'require_password_change': 'false'
            },
            'logging': {
                'level': 'INFO',
                'file_path': 'logs/ol_service.log',
                'max_file_size': '10485760',  # 10MB
                'backup_count': '5'
            },
            'system': {
                'auto_backup': 'true',
                'check_updates': 'true',
                'data_retention_days': '365',
                'temp_cleanup_interval': '24'  # hours
            }
        }

        # Add defaults to config
        for section, settings in defaults.items():
            self.config.add_section(section)
            for key, value in settings.items():
                self.config.set(section, key, value)

    def _load_config_file(self):
        """Load configuration from file if it exists"""
        if self.config_file.exists():
            try:
                self.config.read(self.config_file)
            except Exception as e:
                print(f"Warning: Could not load config file {self.config_file}: {e}")

    def save_config(self) -> bool:
        """Save current configuration to file"""
        try:
            # Ensure config directory exists
            self.config_dir.mkdir(exist_ok=True)

            with open(self.config_file, 'w') as f:
                self.config.write(f)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False

    def get(self, section: str, key: str, fallback: Any = None) -> Any:
        """Get a configuration value with type conversion"""
        try:
            value = self.config.get(section, key, fallback=str(fallback) if fallback is not None else None)

            # Try to convert to appropriate type
            if value is None:
                return fallback

            # Handle boolean values
            if value.lower() in ('true', 'false'):
                return value.lower() == 'true'

            # Try integer conversion
            try:
                return int(value)
            except ValueError:
                pass

            # Try float conversion
            try:
                return float(value)
            except ValueError:
                pass

            # Return as string
            return value

        except Exception:
            return fallback

    def set(self, section: str, key: str, value: Any) -> bool:
        """Set a configuration value"""
        try:
            if not self.config.has_section(section):
                self.config.add_section(section)

            self.config.set(section, key, str(value))
            return True
        except Exception as e:
            print(f"Error setting config value: {e}")
            return False

    def get_section(self, section: str) -> Dict[str, Any]:
        """Get all values from a section"""
        if not self.config.has_section(section):
            return {}

        return {key: self.get(section, key) for key in self.config.options(section)}

    def update_section(self, section: str, values: Dict[str, Any]) -> bool:
        """Update multiple values in a section"""
        try:
            if not self.config.has_section(section):
                self.config.add_section(section)

            for key, value in values.items():
                self.config.set(section, key, str(value))
            return True
        except Exception as e:
            print(f"Error updating section {section}: {e}")
            return False

    def reset_section(self, section: str) -> bool:
        """Reset a section to default values"""
        try:
            if self.config.has_section(section):
                self.config.remove_section(section)

            # Reload defaults
            temp_manager = SettingsManager()
            if temp_manager.config.has_section(section):
                self.config.add_section(section)
                for key in temp_manager.config.options(section):
                    value = temp_manager.config.get(section, key)
                    self.config.set(section, key, value)

            return True
        except Exception as e:
            print(f"Error resetting section {section}: {e}")
            return False

    def validate_config(self) -> Dict[str, List[str]]:
        """Validate configuration and return any errors"""
        errors = {}

        # Validate database settings
        db_errors = []
        db_path = self.get('database', 'path')
        if db_path:
            db_dir = Path(db_path).parent
            if not db_dir.exists():
                try:
                    db_dir.mkdir(parents=True, exist_ok=True)
                except Exception:
                    db_errors.append(f"Cannot create database directory: {db_dir}")
        else:
            db_errors.append("Database path not specified")

        if db_errors:
            errors['database'] = db_errors

        # Validate UI settings
        ui_errors = []
        width = self.get('ui', 'window_width', 1200)
        height = self.get('ui', 'window_height', 800)

        if not isinstance(width, int) or width < 800:
            ui_errors.append("Window width must be at least 800 pixels")
        if not isinstance(height, int) or height < 600:
            ui_errors.append("Window height must be at least 600 pixels")

        if ui_errors:
            errors['ui'] = ui_errors

        # Validate camera settings
        camera_errors = []
        camera_id = self.get('camera', 'default_camera', 0)
        if not isinstance(camera_id, int) or camera_id < 0:
            camera_errors.append("Camera ID must be a non-negative integer")

        if camera_errors:
            errors['camera'] = camera_errors

        # Validate image settings
        image_errors = []
        max_size = self.get('images', 'max_file_size', 10485760)
        if not isinstance(max_size, int) or max_size <= 0:
            image_errors.append("Max file size must be a positive integer")

        quality = self.get('images', 'compression_quality', 85)
        if not isinstance(quality, int) or not (1 <= quality <= 100):
            image_errors.append("Compression quality must be between 1 and 100")

        if image_errors:
            errors['images'] = image_errors

        # Validate security settings
        security_errors = []
        timeout = self.get('security', 'session_timeout', 3600)
        if not isinstance(timeout, int) or timeout <= 0:
            security_errors.append("Session timeout must be a positive integer")

        min_password = self.get('security', 'password_min_length', 6)
        if not isinstance(min_password, int) or min_password < 4:
            security_errors.append("Password minimum length must be at least 4")

        if security_errors:
            errors['security'] = security_errors

        return errors

    def get_validation_summary(self) -> str:
        """Get a human-readable summary of validation results"""
        if not self.validation_errors:
            return "✅ Configuration is valid"

        summary = ["❌ Configuration validation errors:"]
        for section, errors in self.validation_errors.items():
            summary.append(f"\n[{section}]")
            for error in errors:
                summary.append(f"  - {error}")

        return "\n".join(summary)

    def export_config(self, file_path: Union[str, Path]) -> bool:
        """Export configuration to a JSON file"""
        try:
            config_dict = {}
            for section in self.config.sections():
                config_dict[section] = dict(self.config.items(section))

            with open(file_path, 'w') as f:
                json.dump(config_dict, f, indent=2)
            return True
        except Exception as e:
            print(f"Error exporting config: {e}")
            return False

    def import_config(self, file_path: Union[str, Path]) -> bool:
        """Import configuration from a JSON file"""
        try:
            with open(file_path, 'r') as f:
                config_dict = json.load(f)

            for section, settings in config_dict.items():
                if not self.config.has_section(section):
                    self.config.add_section(section)
                for key, value in settings.items():
                    self.config.set(section, key, str(value))

            # Re-validate after import
            self.validation_errors = self.validate_config()
            return True
        except Exception as e:
            print(f"Error importing config: {e}")
            return False

    def create_sample_env_file(self) -> bool:
        """Create a sample .env file with common settings"""
        try:
            sample_content = """# OL Service POS System Configuration
# Copy this file to .env and modify as needed

# Database Settings
DATABASE_PATH=data/ol_service_pos.db
DATABASE_BACKUP_ENABLED=true

# UI Settings
UI_THEME=default
UI_FULLSCREEN=false
UI_TOUCH_MODE=false

# Security Settings
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=3
PASSWORD_MIN_LENGTH=6

# Logging Settings
LOG_LEVEL=INFO
LOG_FILE=logs/ol_service.log

# System Settings
AUTO_BACKUP=true
CHECK_UPDATES=true
"""

            sample_file = Path(".env.sample")
            with open(sample_file, 'w') as f:
                f.write(sample_content)
            return True
        except Exception as e:
            print(f"Error creating sample .env file: {e}")
            return False


def get_ui_theme() -> str:
    """Get the current UI theme"""
    return settings_manager.get('ui', 'theme', 'default')


def get_window_size() -> tuple:
    """Get the window size configuration"""
    width = settings_manager.get('ui', 'window_width', 1200)
    height = settings_manager.get('ui', 'window_height', 800)
    return (width, height)


def is_fullscreen_enabled() -> bool:
    """Check if fullscreen mode is enabled"""
    return settings_manager.get('ui', 'fullscreen', False)


def is_touch_mode_enabled() -> bool:
    """Check if touch mode is enabled"""
    return settings_manager.get('ui', 'touch_mode', False)


def get_database_path() -> str:
    """Get the database file path"""
    return settings_manager.get('database', 'path', 'data/ol_service_pos.db')


def is_backup_enabled() -> bool:
    """Check if automatic backup is enabled"""
    return settings_manager.get('system', 'auto_backup', True)


# Global settings manager instance
settings_manager = SettingsManager()