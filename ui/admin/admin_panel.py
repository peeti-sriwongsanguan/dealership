# ui/admin/admin_panel.py
import tkinter as tk
from tkinter import ttk, messagebox

from ui.admin.user_management import UserManagementTab
from ui.admin.settings_tab import SettingsTab
from ui.admin.reports_tab import ReportsTab


class AdminPanel:
    def __init__(self, parent, user, callback):
        self.parent = parent
        self.user = user
        self.callback = callback

        # Verify user is admin
        if self.user['role'] != 'admin':
            messagebox.showerror("Access Denied", "You must be an administrator to access this panel")
            self.callback()
            return

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.setup_ui()

    def setup_ui(self):
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text="Admin Panel",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back to Menu",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Notebook for tabs
        self.notebook = ttk.Notebook(self.frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Users tab
        users_frame = tk.Frame(self.notebook, bg="#f0f0f0")
        self.notebook.add(users_frame, text="User Management")

        # System settings tab
        settings_frame = tk.Frame(self.notebook, bg="#f0f0f0")
        self.notebook.add(settings_frame, text="System Settings")

        # Reports tab
        reports_frame = tk.Frame(self.notebook, bg="#f0f0f0")
        self.notebook.add(reports_frame, text="Reports")

        # Initialize tabs
        self.user_management_tab = UserManagementTab(users_frame)
        self.settings_tab = SettingsTab(settings_frame)
        self.reports_tab = ReportsTab(reports_frame)

    def on_back(self):
        """Return to the main menu"""
        self.destroy()
        self.callback()

    def destroy(self):
        """Clean up resources"""
        self.frame.destroy()