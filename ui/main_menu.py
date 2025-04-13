# ui/main_menu.py

import tkinter as tk
from ui.customer import CustomerManagement


from ui.service import ServiceManagement
from ui.vehicle import VehicleManagement



from ui.service import ServiceStatusView
from ui.admin import AdminPanel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class MainMenu:
    def __init__(self, parent, user, logout_callback):
        self.parent = parent
        self.user = user
        self.logout_callback = logout_callback

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.setup_ui()

    def setup_ui(self):
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text="OL Service POS System",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # User info
        user_label = tk.Label(header_frame,
                              text=f"Logged in as: {self.user['username']} ({self.user['role']})",
                              font=("Arial", 10), bg="#333333", fg="white")
        user_label.pack(side=tk.RIGHT, padx=20, pady=10)

        # Menu buttons frame
        buttons_frame = tk.Frame(self.frame, bg="#f0f0f0", padx=20, pady=20)
        buttons_frame.pack(fill=tk.BOTH, expand=True)

        # Customer management button
        customer_button = tk.Button(buttons_frame, text="Customer Management",
                                    font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                    height=3, width=25, command=self.show_customer_management)
        customer_button.grid(row=0, column=0, padx=10, pady=10)

        # Service management button
        service_button = tk.Button(buttons_frame, text="Service Management",
                                   font=("Arial", 12, "bold"), bg="#2196F3", fg="white",
                                   height=3, width=25, command=self.show_service_management)
        service_button.grid(row=0, column=1, padx=10, pady=10)

        # Admin button - only show if user is admin
        if self.user['role'] == 'admin':
            admin_button = tk.Button(buttons_frame, text="Admin Panel",
                                     font=("Arial", 12, "bold"), bg="#FF5722", fg="white",
                                     height=3, width=25, command=self.show_admin_panel)
            admin_button.grid(row=1, column=0, padx=10, pady=10)

        # Logout button
        logout_button = tk.Button(buttons_frame, text="Logout",
                                  font=("Arial", 12, "bold"), bg="#9E9E9E", fg="white",
                                  height=3, width=25, command=self.logout)
        logout_button.grid(row=1, column=1, padx=10, pady=10)

        # Version information
        version_info = os.getenv('APP_VERSION', 'v1.0.0')
        version_label = tk.Label(self.frame, text=f"Version: {version_info}",
                                 font=("Arial", 8), bg="#f0f0f0", fg="#666666")
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