# ui/admin/settings_tab.py
import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import json
import os

# Define default settings
DEFAULT_SETTINGS = {
    "company_name": "ol Service",
    "company_address": "123 Auto Street",
    "company_phone": "555-123-4567",
    "company_email": "service@cardealer.com",
    "tax_rate": 7.5,
    "enable_email_notifications": False,
    "enable_sms_notifications": False,
    "default_service_reminder_days": 90
}


class SettingsTab:
    def __init__(self, parent):
        self.parent = parent
        self.settings = self.load_settings()
        self.setup_ui()

    def setup_ui(self):
        """Setup the system settings tab"""
        # Create a notebook for different setting categories
        settings_notebook = ttk.Notebook(self.parent)
        settings_notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # General settings tab
        general_frame = tk.Frame(settings_notebook, bg="#f0f0f0", padx=20, pady=20)
        settings_notebook.add(general_frame, text="General Settings")

        # Notification settings tab
        notification_frame = tk.Frame(settings_notebook, bg="#f0f0f0", padx=20, pady=20)
        settings_notebook.add(notification_frame, text="Notifications")

        # Setup general settings
        self.setup_general_settings(general_frame)

        # Setup notification settings
        self.setup_notification_settings(notification_frame)

        # Save button at the bottom
        save_frame = tk.Frame(self.parent, bg="#f0f0f0")
        save_frame.pack(fill=tk.X, padx=20, pady=10)

        save_button = tk.Button(save_frame, text="Save All Settings",
                                font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                padx=20, pady=5, command=self.save_all_settings)
        save_button.pack(side=tk.RIGHT)

    def setup_general_settings(self, parent):
        """Setup the general settings section"""
        # Company information
        company_frame = tk.LabelFrame(parent, text="Company Information",
                                      font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        company_frame.pack(fill=tk.X, pady=10)

        # Company name
        name_label = tk.Label(company_frame, text="Company Name:",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        name_label.grid(row=0, column=0, sticky=tk.W, pady=5)

        self.company_name_var = tk.StringVar()
        self.company_name_var.set(self.settings.get("company_name", ""))

        name_entry = tk.Entry(company_frame, font=("Arial", 12), width=40,
                              textvariable=self.company_name_var)
        name_entry.grid(row=0, column=1, sticky=tk.W, pady=5, padx=5)

        # Company address
        address_label = tk.Label(company_frame, text="Address:",
                                 font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        address_label.grid(row=1, column=0, sticky=tk.W, pady=5)

        self.company_address_var = tk.StringVar()
        self.company_address_var.set(self.settings.get("company_address", ""))

        address_entry = tk.Entry(company_frame, font=("Arial", 12), width=40,
                                 textvariable=self.company_address_var)
        address_entry.grid(row=1, column=1, sticky=tk.W, pady=5, padx=5)

        # Company phone
        phone_label = tk.Label(company_frame, text="Phone:",
                               font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        phone_label.grid(row=2, column=0, sticky=tk.W, pady=5)

        self.company_phone_var = tk.StringVar()
        self.company_phone_var.set(self.settings.get("company_phone", ""))

        phone_entry = tk.Entry(company_frame, font=("Arial", 12), width=40,
                               textvariable=self.company_phone_var)
        phone_entry.grid(row=2, column=1, sticky=tk.W, pady=5, padx=5)

        # Company email
        email_label = tk.Label(company_frame, text="Email:",
                               font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        email_label.grid(row=3, column=0, sticky=tk.W, pady=5)

        self.company_email_var = tk.StringVar()
        self.company_email_var.set(self.settings.get("company_email", ""))

        email_entry = tk.Entry(company_frame, font=("Arial", 12), width=40,
                               textvariable=self.company_email_var)
        email_entry.grid(row=3, column=1, sticky=tk.W, pady=5, padx=5)

        # Financial settings
        financial_frame = tk.LabelFrame(parent, text="Financial Settings",
                                        font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        financial_frame.pack(fill=tk.X, pady=10)

        # Tax rate
        tax_label = tk.Label(financial_frame, text="Tax Rate (%):",
                             font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        tax_label.grid(row=0, column=0, sticky=tk.W, pady=5)

        self.tax_rate_var = tk.StringVar()
        self.tax_rate_var.set(str(self.settings.get("tax_rate", 0)))

        tax_entry = tk.Entry(financial_frame, font=("Arial", 12), width=10,
                             textvariable=self.tax_rate_var)
        tax_entry.grid(row=0, column=1, sticky=tk.W, pady=5, padx=5)

    def setup_notification_settings(self, parent):
        """Setup the notification settings section"""
        # Email notifications
        email_frame = tk.LabelFrame(parent, text="Email Notifications",
                                    font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        email_frame.pack(fill=tk.X, pady=10)

        # Enable email notifications
        self.email_enabled_var = tk.BooleanVar()
        self.email_enabled_var.set(self.settings.get("enable_email_notifications", False))

        email_check = tk.Checkbutton(email_frame, text="Enable Email Notifications",
                                     font=("Arial", 12), bg="#f0f0f0",
                                     variable=self.email_enabled_var)
        email_check.pack(anchor=tk.W, pady=5)

        email_note = tk.Label(email_frame,
                              text="Note: Email server configuration required for this feature.",
                              font=("Arial", 10), fg="gray", bg="#f0f0f0")
        email_note.pack(anchor=tk.W, pady=5)

        # SMS notifications
        sms_frame = tk.LabelFrame(parent, text="SMS Notifications",
                                  font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        sms_frame.pack(fill=tk.X, pady=10)

        # Enable SMS notifications
        self.sms_enabled_var = tk.BooleanVar()
        self.sms_enabled_var.set(self.settings.get("enable_sms_notifications", False))

        sms_check = tk.Checkbutton(sms_frame, text="Enable SMS Notifications",
                                   font=("Arial", 12), bg="#f0f0f0",
                                   variable=self.sms_enabled_var)
        sms_check.pack(anchor=tk.W, pady=5)

        sms_note = tk.Label(sms_frame,
                            text="Note: SMS gateway configuration required for this feature.",
                            font=("Arial", 10), fg="gray", bg="#f0f0f0")
        sms_note.pack(anchor=tk.W, pady=5)

        # Service reminders
        reminder_frame = tk.LabelFrame(parent, text="Service Reminders",
                                       font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        reminder_frame.pack(fill=tk.X, pady=10)

        # Default days for service reminder
        reminder_label = tk.Label(reminder_frame, text="Remind customers after (days):",
                                  font=("Arial", 12), bg="#f0f0f0")
        reminder_label.pack(anchor=tk.W, pady=5)

        self.reminder_days_var = tk.StringVar()
        self.reminder_days_var.set(str(self.settings.get("default_service_reminder_days", 90)))

        reminder_entry = tk.Entry(reminder_frame, font=("Arial", 12), width=10,
                                  textvariable=self.reminder_days_var)
        reminder_entry.pack(anchor=tk.W, pady=5)

    def load_settings(self):
        """Load settings from database or create with defaults if not exists"""
        # Check if settings table exists
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        # Check if settings table exists
        cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='settings'
        """)

        if not cursor.fetchone():
            # Create settings table
            cursor.execute("""
            CREATE TABLE settings (
                id INTEGER PRIMARY KEY,
                settings_json TEXT NOT NULL
            )
            """)

            # Insert default settings
            cursor.execute("""
            INSERT INTO settings (id, settings_json) VALUES (1, ?)
            """, (json.dumps(DEFAULT_SETTINGS),))

            conn.commit()
            conn.close()

            return DEFAULT_SETTINGS

        # Load settings from database
        cursor.execute("SELECT settings_json FROM settings WHERE id = 1")
        result = cursor.fetchone()

        conn.close()

        if result:
            return json.loads(result[0])
        else:
            return DEFAULT_SETTINGS

    def save_all_settings(self):
        """Save all settings to the database"""
        try:
            # Validate tax rate
            try:
                tax_rate = float(self.tax_rate_var.get())
                if tax_rate < 0:
                    raise ValueError("Tax rate cannot be negative")
            except ValueError:
                messagebox.showerror("Error", "Tax rate must be a valid number")
                return

            # Validate reminder days
            try:
                reminder_days = int(self.reminder_days_var.get())
                if reminder_days < 0:
                    raise ValueError("Reminder days cannot be negative")
            except ValueError:
                messagebox.showerror("Error", "Reminder days must be a valid number")
                return

            # Gather settings from UI
            settings = {
                "company_name": self.company_name_var.get(),
                "company_address": self.company_address_var.get(),
                "company_phone": self.company_phone_var.get(),
                "company_email": self.company_email_var.get(),
                "tax_rate": tax_rate,
                "enable_email_notifications": self.email_enabled_var.get(),
                "enable_sms_notifications": self.sms_enabled_var.get(),
                "default_service_reminder_days": reminder_days
            }

            # Save to database
            conn = sqlite3.connect('ol_service_pos.db')
            cursor = conn.cursor()

            cursor.execute("""
            UPDATE settings SET settings_json = ? WHERE id = 1
            """, (json.dumps(settings),))

            # If no settings row exists, create one
            if cursor.rowcount == 0:
                cursor.execute("""
                INSERT INTO settings (id, settings_json) VALUES (1, ?)
                """, (json.dumps(settings),))

            conn.commit()
            conn.close()

            # Update the current settings
            self.settings = settings

            messagebox.showinfo("Success", "Settings saved successfully")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to save settings: {str(e)}")