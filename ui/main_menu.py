# ui/main_menu.py
import tkinter as tk
from ui.customer import CustomerManagement
from ui.service import ServiceManagement
from ui.service import ServiceStatusView
from ui.admin import AdminPanel
import os
from dotenv import load_dotenv
from ui.ui_utils import COLORS, FONTS
from PIL import Image, ImageTk

# Load environment variables
load_dotenv()

# Get assets directory path
APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(APP_ROOT, "assets")


class MainMenu:
    def __init__(self, parent, user, logout_callback):
        self.parent = parent
        self.user = user
        self.logout_callback = logout_callback

        # Create main frame with improved styling
        self.frame = tk.Frame(parent, bg=COLORS['bg'])
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        # Header frame with improved styling
        header_frame = tk.Frame(self.frame, bg=COLORS['primary'], height=60)
        header_frame.pack(fill=tk.X)

        # Try to load and display the logo
        try:
            logo_path = os.path.join(ASSETS_DIR, "logo.png")
            if os.path.exists(logo_path):
                logo_img = Image.open(logo_path)

                # Resize logo to fit header
                logo_height = 50  # pixels
                ratio = logo_height / logo_img.height
                new_width = int(logo_img.width * ratio)
                logo_img = logo_img.resize((new_width, logo_height), Image.LANCZOS)

                # Convert to Tkinter-compatible image
                tk_img = ImageTk.PhotoImage(logo_img)

                # Display logo in header
                logo_label = tk.Label(header_frame, image=tk_img, bg=COLORS['primary'])
                logo_label.image = tk_img  # Keep reference to prevent garbage collection
                logo_label.pack(side=tk.LEFT, padx=10, pady=5)

            # Title with or without logo
            title_label = tk.Label(header_frame, text="OL Service POS System",
                                   font=("Arial", 16, "bold"), bg=COLORS['primary'], fg="white")
            title_label.pack(side=tk.LEFT, padx=20, pady=10)

        except Exception as e:
            # If logo loading fails, just show the title
            title_label = tk.Label(header_frame, text="OL Service POS System",
                                   font=("Arial", 16, "bold"), bg=COLORS['primary'], fg="white")
            title_label.pack(side=tk.LEFT, padx=20, pady=10)
            print(f"Error loading logo: {e}")

        # User info with improved contrast
        user_label = tk.Label(header_frame,
                              text=f"Logged in as: {self.user['username']} ({self.user['role']})",
                              font=("Arial", 10), bg=COLORS['primary'], fg="white")
        user_label.pack(side=tk.RIGHT, padx=20, pady=10)

        # Menu buttons frame with improved styling
        buttons_frame = tk.Frame(self.frame, bg=COLORS['bg'], padx=20, pady=20)
        buttons_frame.pack(fill=tk.BOTH, expand=True)

        # Customer management button with improved styling
        customer_button = tk.Button(buttons_frame, text="Customer Management",
                                    font=FONTS['large_bold'], bg=COLORS['primary'], fg="white",
                                    height=3, width=25, command=self.show_customer_management)
        customer_button.grid(row=0, column=0, padx=10, pady=10)

        # Service management button with improved styling
        service_button = tk.Button(buttons_frame, text="Service Management",
                                   font=FONTS['large_bold'], bg="#2196F3", fg="white",
                                   height=3, width=25, command=self.show_service_management)
        service_button.grid(row=0, column=1, padx=10, pady=10)

        # Admin button - only show if user is admin
        if self.user['role'] == 'admin':
            admin_button = tk.Button(buttons_frame, text="Admin Panel",
                                     font=FONTS['large_bold'], bg=COLORS['danger'], fg="white",
                                     height=3, width=25, command=self.show_admin_panel)
            admin_button.grid(row=1, column=0, padx=10, pady=10)

        # Logout button with improved styling
        logout_button = tk.Button(buttons_frame, text="Logout",
                                  font=FONTS['large_bold'], bg="#9E9E9E", fg="white",
                                  height=3, width=25, command=self.logout)
        logout_button.grid(row=1, column=1, padx=10, pady=10)

        # Version information
        version_info = os.getenv('APP_VERSION', 'v1.0.0')
        version_label = tk.Label(self.frame, text=f"Version: {version_info}",
                                 font=FONTS['small'], bg=COLORS['bg'], fg="#666666")
        version_label.pack(side=tk.BOTTOM, pady=5)

    def show_customer_management(self):
        self.clear_frame()
        CustomerManagement(self.parent, self.user, self.show_main_menu)

    def show_service_management(self):
        self.clear_frame()
        ServiceManagement(self.parent, self.user, self.show_main_menu)

    def show_admin_panel(self):
        self.clear_frame()
        AdminPanel(self.parent, self.user, self.show_main_menu)

    def show_main_menu(self):
        # Recreate main menu
        self.clear_frame()
        self.setup_ui()

    def logout(self):
        self.clear_frame()
        self.logout_callback()

    def clear_frame(self):
        # Remove all widgets from the frame
        for widget in self.frame.winfo_children():
            widget.destroy()

    def destroy(self):
        self.frame.destroy()