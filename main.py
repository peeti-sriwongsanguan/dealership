# main.py (Updated for Enhanced System)
import tkinter as tk
import sys
import os
from pathlib import Path
import logging
from typing import Optional

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


# Ensure all required directories exist first
def ensure_directories():
    """Ensure all required directories exist before importing modules"""
    directories = [
        "data", "logs", "assets", "config", "backups",
        "media", "media/photos", "media/damage_reports", "media/temp",
        "assets/vehicle_templates", "assets/icons"
    ]

    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)


# Create directories first
ensure_directories()

try:
    # Import our modules (with better error handling)
    from config.settings_manager import settings_manager, get_ui_theme
    from database.connection_manager import db_manager
    from database.db_setup import setup_database
    from utils.error_handler import error_handler, handle_errors, ErrorSeverity
    from PIL import Image, ImageTk, ImageDraw, ImageFont

    # Import UI modules
    from ui.login_screen import LoginScreen
    from ui.main_menu import MainMenu

    # Import services
    from services.camera_service import camera_service
    from services.image_service import image_service
    from services.damage_service import damage_service

except ImportError as e:
    print(f"Failed to import required modules: {e}")
    print("Please ensure all dependencies are installed: pip install -r requirements.txt")
    sys.exit(1)


class ApplicationManager:
    """Main application manager with improved error handling and lifecycle management"""

    def __init__(self):
        self.root: Optional[tk.Tk] = None
        self.current_screen = None
        self.current_user = None
        self.setup_logging()
        self.setup_directories()

    def setup_logging(self):
        """Setup application logging"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)

        # Configure root logger
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'ol_service.log'),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger(__name__)
        self.logger.info("OL Service POS Application starting...")

    @handle_errors("Directory Setup", ErrorSeverity.CRITICAL)
    def setup_directories(self):
        """Ensure all required directories exist"""
        directories = [
            "data", "logs", "assets", "config", "backups",
            "media/photos", "media/damage_reports", "media/temp",
            "assets/vehicle_templates", "assets/icons", "assets/images",
            "data/exports", "data/damage_reports"
        ]

        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)

        self.logger.info("Directory structure verified")

    @handle_errors("UI Initialization", ErrorSeverity.CRITICAL)
    def initialize_ui(self):
        """Initialize the main UI window"""
        self.root = tk.Tk()

        # Load UI settings
        try:
            ui_config = get_ui_theme()
        except:
            # Fallback if settings not available
            ui_config = {
                'font_family': 'Arial',
                'font_size': 12,
                'theme': 'default'
            }

        # Configure main window
        self.root.title("OL Service POS System")

        # Set window size from config
        try:
            width = settings_manager.config.ui.window_width
            height = settings_manager.config.ui.window_height
        except:
            # Fallback dimensions
            width, height = 1200, 800

        self.root.geometry(f"{width}x{height}")

        # Center window on screen
        self.center_window()

        # Configure styles
        self.setup_styles()

        # Set application icon
        self.set_app_icon()

        # Handle window close event
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

        # Configure for high DPI displays
        try:
            self.root.tk.call('tk', 'scaling', 1.0)
        except:
            pass

        self.logger.info("UI initialized successfully")

    def center_window(self):
        """Center the window on the screen"""
        self.root.update_idletasks()

        # Get window dimensions
        window_width = self.root.winfo_reqwidth()
        window_height = self.root.winfo_reqheight()

        # Get screen dimensions
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        # Calculate position
        pos_x = (screen_width // 2) - (window_width // 2)
        pos_y = (screen_height // 2) - (window_height // 2)

        self.root.geometry(f"{window_width}x{window_height}+{pos_x}+{pos_y}")

    def setup_styles(self):
        """Setup application styles and themes"""
        try:
            from tkinter import ttk

            style = ttk.Style()

            # Configure theme based on settings
            try:
                theme = settings_manager.config.ui.theme
                if theme in style.theme_names():
                    style.theme_use(theme)
            except:
                # Use default theme if settings not available
                pass

            # Custom style configurations
            try:
                font_family = settings_manager.config.ui.font_family
                font_size = settings_manager.config.ui.font_size
            except:
                font_family, font_size = 'Arial', 12

            style.configure('Heading.TLabel',
                            font=(font_family, font_size + 4, 'bold'))
            style.configure('Error.TLabel', foreground='red')
            style.configure('Success.TLabel', foreground='green')

        except Exception as e:
            self.logger.warning(f"Style setup failed: {e}")

    @handle_errors("Icon Setup", ErrorSeverity.WARNING, show_user=False)
    def set_app_icon(self):
        """Set the application icon"""
        icon_path = Path("assets") / "logo.png"

        if not icon_path.exists():
            self.create_default_icon(icon_path)

        try:
            icon = Image.open(icon_path)
            # Resize icon if too large
            if icon.size[0] > 64 or icon.size[1] > 64:
                icon = icon.resize((64, 64), Image.Resampling.LANCZOS)

            icon_photo = ImageTk.PhotoImage(icon)
            self.root.iconphoto(True, icon_photo)
            self.logger.info("Application icon set successfully")
        except Exception as e:
            self.logger.warning(f"Could not set application icon: {e}")

    def create_default_icon(self, icon_path: Path):
        """Create a default application icon"""
        try:
            # Create a simple colored rectangle as placeholder
            img = Image.new('RGBA', (64, 64), color=(76, 175, 80, 255))

            # Add some basic design
            draw = ImageDraw.Draw(img)

            # Draw border
            draw.rectangle([(0, 0), (63, 63)], outline=(255, 255, 255, 255), width=2)

            # Add text
            try:
                font = ImageFont.truetype("arial.ttf", 16)
            except:
                try:
                    font = ImageFont.load_default()
                except:
                    # If all else fails, just save the simple rectangle
                    img.save(icon_path)
                    return

            # Draw "OL" text
            text_bbox = draw.textbbox((0, 0), "OL", font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            text_x = (64 - text_width) // 2
            text_y = (64 - text_height) // 2

            draw.text((text_x, text_y), "OL", font=font, fill=(255, 255, 255, 255))

            img.save(icon_path)
            self.logger.info(f"Default icon created at {icon_path}")

        except Exception as e:
            self.logger.warning(f"Could not create default icon: {e}")

    @handle_errors("Database Initialization", ErrorSeverity.CRITICAL)
    def initialize_database(self):
        """Initialize the database"""
        try:
            # Test database connection
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                if not result:
                    raise Exception("Database connection test failed")

            # Setup database schema
            setup_database()

            self.logger.info("Database initialized successfully")
            return True

        except Exception as e:
            self.logger.critical(f"Database initialization failed: {e}")
            self.show_critical_error(
                "Database Error",
                f"Failed to initialize database: {e}\n\nPlease check your database configuration."
            )
            return False

    @handle_errors("Services Initialization", ErrorSeverity.WARNING, show_user=False)
    def initialize_services(self):
        """Initialize application services"""
        try:
            # Initialize camera service
            available_cameras = camera_service.get_available_cameras()
            if available_cameras:
                self.logger.info(f"Found {len(available_cameras)} camera(s): {available_cameras}")
            else:
                self.logger.warning("No cameras detected")

            # Test image service
            self.logger.info("Image service initialized")

            # Test damage service
            self.logger.info("Damage service initialized")

            return True

        except Exception as e:
            self.logger.warning(f"Services initialization failed: {e}")
            return False

    def show_critical_error(self, title: str, message: str):
        """Show critical error dialog and exit"""
        try:
            from tkinter import messagebox
            messagebox.showerror(title, message)
        except:
            print(f"CRITICAL ERROR - {title}: {message}")

        self.logger.critical(f"{title}: {message}")
        sys.exit(1)

    @handle_errors("Screen Transition", ErrorSeverity.ERROR)
    def show_login_screen(self):
        """Show the login screen"""
        try:
            # Clear current screen
            if self.current_screen:
                self.current_screen.destroy()
                self.current_screen = None

            # Reset user session
            self.current_user = None

            # Create login screen
            self.current_screen = LoginScreen(self.root, self.on_login_success)
            self.logger.info("Login screen displayed")

        except Exception as e:
            self.logger.error(f"Failed to show login screen: {e}")
            # Try to create a minimal login interface
            self.create_minimal_login()

    def create_minimal_login(self):
        """Create a minimal login interface as fallback"""
        try:
            # Clear root
            for widget in self.root.winfo_children():
                widget.destroy()

            frame = tk.Frame(self.root, bg="#f0f0f0")
            frame.pack(fill=tk.BOTH, expand=True)

            # Title
            title = tk.Label(frame, text="OL Service POS",
                             font=("Arial", 24, "bold"), bg="#f0f0f0")
            title.pack(pady=50)

            # Login button (for demo/testing)
            login_btn = tk.Button(frame, text="Login as Admin",
                                  font=("Arial", 14), bg="#4CAF50", fg="white",
                                  command=lambda: self.on_login_success({
                                      'id': 1, 'username': 'admin', 'role': 'admin'
                                  }))
            login_btn.pack(pady=20)

            self.logger.warning("Using minimal login interface")

        except Exception as e:
            self.logger.critical(f"Failed to create minimal login: {e}")
            sys.exit(1)

    @handle_errors("Login Process", ErrorSeverity.ERROR)
    def on_login_success(self, user: dict):
        """Handle successful login"""
        self.current_user = user
        self.logger.info(f"User logged in: {user.get('username', 'Unknown')}")

        try:
            # Clear login screen
            if self.current_screen:
                self.current_screen.destroy()

            # Show main menu
            self.current_screen = MainMenu(
                self.root,
                user,
                self.on_logout
            )

            # Update window title with user info
            self.root.title(f"OL Service POS System - {user.get('username', 'User')}")

        except Exception as e:
            self.logger.error(f"Failed to show main menu: {e}")
            # Fallback to minimal interface
            self.create_minimal_main_menu(user)

    def create_minimal_main_menu(self, user: dict):
        """Create a minimal main menu as fallback"""
        try:
            # Clear root
            for widget in self.root.winfo_children():
                widget.destroy()

            frame = tk.Frame(self.root, bg="#f0f0f0")
            frame.pack(fill=tk.BOTH, expand=True)

            # Header
            header = tk.Frame(frame, bg="#2c3e50", height=60)
            header.pack(fill=tk.X)
            header.pack_propagate(False)

            title = tk.Label(header, text=f"OL Service POS - {user['username']}",
                             font=("Arial", 16, "bold"), bg="#2c3e50", fg="white")
            title.pack(side=tk.LEFT, padx=20, pady=15)

            logout_btn = tk.Button(header, text="Logout",
                                   command=self.on_logout)
            logout_btn.pack(side=tk.RIGHT, padx=20, pady=15)

            # Menu
            menu_frame = tk.Frame(frame, bg="#f0f0f0")
            menu_frame.pack(expand=True)

            tk.Label(menu_frame, text="Main Menu - Minimal Mode",
                     font=("Arial", 18, "bold"), bg="#f0f0f0").pack(pady=50)

            # Basic menu buttons
            from ui.screens.inspection.simple_damage_marker import show_simple_damage_marker

            damage_btn = tk.Button(menu_frame, text="Vehicle Damage Inspector",
                                   font=("Arial", 14), bg="#e74c3c", fg="white",
                                   width=25, height=2,
                                   command=lambda: self.show_damage_inspector())
            damage_btn.pack(pady=10)

            self.logger.warning("Using minimal main menu")

        except Exception as e:
            self.logger.critical(f"Failed to create minimal main menu: {e}")

    def show_damage_inspector(self):
        """Show damage inspector"""
        try:
            from ui.screens.inspection.simple_damage_marker import show_simple_damage_marker

            # Clear current content
            for widget in self.root.winfo_children():
                widget.destroy()

            def on_back():
                self.on_login_success(self.current_user)

            show_simple_damage_marker(self.root, 12345, on_back)

        except Exception as e:
            self.logger.error(f"Failed to show damage inspector: {e}")

    def on_logout(self):
        """Handle user logout"""
        if self.current_user:
            self.logger.info(f"User logged out: {self.current_user.get('username', 'Unknown')}")

        self.show_login_screen()
        self.root.title("OL Service POS System")

    def on_closing(self):
        """Handle application closing"""
        try:
            # Release camera resources
            camera_service.release_camera()

            # Clean up temporary files
            image_service.cleanup_temp_files()

            # Save window geometry
            try:
                geometry = self.root.geometry()
                width, height = geometry.split('+')[0].split('x')

                settings_manager.set('ui', 'window_width', int(width))
                settings_manager.set('ui', 'window_height', int(height))
                settings_manager.save_settings()
            except:
                pass

            # Log user logout if logged in
            if self.current_user:
                self.logger.info(f"Application closed by user: {self.current_user.get('username')}")

            self.logger.info("Application closing...")

        except Exception as e:
            self.logger.error(f"Error during application shutdown: {e}")

        finally:
            self.root.quit()
            self.root.destroy()

    @handle_errors("Application Startup", ErrorSeverity.CRITICAL, reraise=True)
    def run(self):
        """Run the application"""
        try:
            # Initialize components
            self.initialize_ui()

            if not self.initialize_database():
                return

            # Initialize services (non-critical)
            self.initialize_services()

            # Show initial screen
            self.show_login_screen()

            # Start main loop
            self.logger.info("Application started successfully")
            self.root.mainloop()

        except KeyboardInterrupt:
            self.logger.info("Application interrupted by user")

        except Exception as e:
            self.logger.critical(f"Critical application error: {e}")
            raise

        finally:
            self.cleanup()

    def cleanup(self):
        """Cleanup resources"""
        try:
            self.logger.info("Cleaning up resources...")

            # Release camera service
            try:
                camera_service.release_camera()
            except:
                pass

            # Clean up image service
            try:
                image_service.cleanup_temp_files()
            except:
                pass

        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")


class DebugManager:
    """Debug and development utilities"""

    def __init__(self, app_manager: ApplicationManager):
        self.app_manager = app_manager
        self.debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'

    def enable_debug_features(self):
        """Enable debug features if in debug mode"""
        if not self.debug_mode:
            return

        # Add debug menu to main window
        if self.app_manager.root:
            self.add_debug_menu()

    def add_debug_menu(self):
        """Add debug menu to main window"""
        try:
            menubar = self.app_manager.root.nametowidget(self.app_manager.root['menu'])
        except:
            menubar = tk.Menu(self.app_manager.root)
            self.app_manager.root.config(menu=menubar)

        debug_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Debug", menu=debug_menu)

        debug_menu.add_command(label="Show Settings", command=self.show_settings)
        debug_menu.add_command(label="Test Database", command=self.test_database)
        debug_menu.add_command(label="Test Camera", command=self.test_camera)
        debug_menu.add_command(label="View Logs", command=self.view_logs)
        debug_menu.add_separator()
        debug_menu.add_command(label="Reset Settings", command=self.reset_settings)

    def show_settings(self):
        """Show current settings"""
        import json
        from tkinter import messagebox

        try:
            settings_text = json.dumps(settings_manager.config.to_dict(), indent=2)
        except:
            settings_text = "Settings not available"

        # Create a simple text window
        window = tk.Toplevel(self.app_manager.root)
        window.title("Current Settings")
        window.geometry("600x400")

        text_widget = tk.Text(window, wrap=tk.WORD)
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        text_widget.insert(tk.END, settings_text)
        text_widget.config(state=tk.DISABLED)

    def test_database(self):
        """Test database connection"""
        from tkinter import messagebox

        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM users")
                result = cursor.fetchone()
                messagebox.showinfo("Database Test",
                                    f"Database connection successful!\nUsers count: {result[0] if result else 0}")
        except Exception as e:
            messagebox.showerror("Database Test", f"Database test error: {e}")

    def test_camera(self):
        """Test camera functionality"""
        from tkinter import messagebox

        try:
            cameras = camera_service.get_available_cameras()
            if cameras:
                messagebox.showinfo("Camera Test", f"Found {len(cameras)} camera(s): {cameras}")
            else:
                messagebox.showwarning("Camera Test", "No cameras detected")
        except Exception as e:
            messagebox.showerror("Camera Test", f"Camera test error: {e}")

    def view_logs(self):
        """View application logs"""
        log_file = Path("logs/ol_service.log")

        if log_file.exists():
            window = tk.Toplevel(self.app_manager.root)
            window.title("Application Logs")
            window.geometry("800x600")

            text_widget = tk.Text(window, wrap=tk.WORD)
            scrollbar = tk.Scrollbar(window, orient="vertical", command=text_widget.yview)
            text_widget.configure(yscrollcommand=scrollbar.set)

            try:
                with open(log_file, 'r') as f:
                    text_widget.insert(tk.END, f.read())
                text_widget.config(state=tk.DISABLED)

                text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
                scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

            except Exception as e:
                text_widget.insert(tk.END, f"Error reading log file: {e}")
        else:
            from tkinter import messagebox
            messagebox.showinfo("Logs", "No log file found")

    def reset_settings(self):
        """Reset settings to defaults"""
        from tkinter import messagebox

        if messagebox.askyesno("Reset Settings",
                               "Are you sure you want to reset all settings to defaults?"):
            try:
                settings_manager.reset_to_defaults()
                settings_manager.save_settings()
                messagebox.showinfo("Settings Reset", "Settings have been reset to defaults")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to reset settings: {e}")


def main():
    """Main entry point"""
    try:
        # Print startup info
        print("=" * 50)
        print("OL Service POS System")
        print("Vehicle Service Management & Damage Inspection")
        print("=" * 50)

        # Create application manager
        app = ApplicationManager()

        # Setup debug features if enabled
        debug_manager = DebugManager(app)

        # Run application
        app.run()

    except Exception as e:
        # Last resort error handling
        error_msg = f"A critical error occurred:\n{e}\n\nThe application will now exit."

        try:
            import tkinter.messagebox as mb
            root = tk.Tk()
            root.withdraw()  # Hide the root window
            mb.showerror("Critical Error", error_msg)
            root.destroy()
        except:
            print(f"CRITICAL ERROR: {e}")

        sys.exit(1)


if __name__ == "__main__":
    main()