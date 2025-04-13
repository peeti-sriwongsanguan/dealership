# main.py

import tkinter as tk
import os
from dotenv import load_dotenv
from ui.login_screen import LoginScreen
from database.db_setup import setup_database

# Load environment variables
load_dotenv()

# Get photos directory from environment variables
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')


class OLServicePOSApp:
    def __init__(self):
        # Set up the main window
        self.root = tk.Tk()
        self.root.title("OL Service POS System")
        self.root.geometry("800x600")
        self.root.configure(bg="#f0f0f0")

        # Make sure necessary directories exist
        self.ensure_directories()

        # Initialize database
        setup_database()

        # Start with login screen
        self.current_screen = None
        self.show_login_screen()

    def ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(PHOTOS_DIR, exist_ok=True)

    def show_login_screen(self):
        # Clear current screen if exists
        if self.current_screen:
            self.current_screen.destroy()

        # Create login screen
        self.current_screen = LoginScreen(self.root, self.on_login_success)

    def on_login_success(self, user):
        # Will be called when login is successful
        from ui.main_menu import MainMenu

        # Clear login screen
        if self.current_screen:
            self.current_screen.destroy()

        # Show main menu
        self.current_screen = MainMenu(self.root, user, self.show_login_screen)

    def run(self):
        # Start the application
        self.root.mainloop()


if __name__ == "__main__":
    app = OLServicePOSApp()
    app.run()