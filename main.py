# main.py
import tkinter as tk
import os
from dotenv import load_dotenv
from ui.login_screen import LoginScreen
from database.db_setup import setup_database
from ui.ui_utils import setup_styles, COLORS
from PIL import Image, ImageTk

# Load environment variables
load_dotenv()

# Get photos directory from environment variables
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')
# Create assets directory path
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")


class OLServicePOSApp:
    def __init__(self):
        # Set up the main window with styling
        self.root = tk.Tk()
        self.root.title("OL Service POS System")
        self.root.geometry("1024x768")  # Slightly larger for better layout
        self.root.configure(bg=COLORS['bg'])

        # Set up ttk styles
        setup_styles()

        # Set application icon
        self.set_app_icon()

        # Make sure necessary directories exist
        self.ensure_directories()

        # Initialize database
        setup_database()

        # Start with login screen
        self.current_screen = None
        self.show_login_screen()

    def set_app_icon(self):
        """Set the application icon using the logo"""
        try:
            # Find the assets directory
            app_root = os.path.dirname(os.path.abspath(__file__))
            icon_path = os.path.join(app_root, "assets", "logo.png")

            # Load the icon if it exists
            if os.path.exists(icon_path):
                icon = Image.open(icon_path)
                icon_photo = ImageTk.PhotoImage(icon)
                self.root.iconphoto(True, icon_photo)
        except Exception as e:
            print(f"Error setting application icon: {e}")

    def ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(PHOTOS_DIR, exist_ok=True)

        # Also ensure assets directory exists
        os.makedirs(ASSETS_DIR, exist_ok=True)

        # Create a placeholder logo if it doesn't exist
        placeholder_logo_path = os.path.join(ASSETS_DIR, "logo.png")
        if not os.path.exists(placeholder_logo_path):
            try:
                # Try to create a simple colored rectangle as a placeholder logo
                from PIL import Image, ImageDraw

                # Create a 200x100 image with green background
                img = Image.new('RGBA', (200, 100), color=(76, 175, 80, 255))
                draw = ImageDraw.Draw(img)

                # Add a border
                draw.rectangle(
                    [(0, 0), (199, 99)],
                    outline=(255, 255, 255, 255),
                    width=2
                )

                # Save the placeholder logo
                img.save(placeholder_logo_path)
                print(f"Created placeholder logo at {placeholder_logo_path}")
            except Exception as e:
                print(f"Could not create placeholder logo: {e}")
                # Just continue without a logo

    def show_login_screen(self):
        # Clear current screen if exists
        if self.current_screen:
            self.current_screen.destroy()

        # Create login screen with new styling
        self.current_screen = LoginScreen(self.root, self.on_login_success)

    def on_login_success(self, user):
        # Will be called when login is successful
        from ui.main_menu import MainMenu

        # Clear login screen
        if self.current_screen:
            self.current_screen.destroy()

        # Show main menu with new styling
        self.current_screen = MainMenu(self.root, user, self.show_login_screen)

    def run(self):
        # Start the application
        self.root.mainloop()


if __name__ == "__main__":
    app = OLServicePOSApp()
    app.run()