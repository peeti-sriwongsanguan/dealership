# ui/login_screen.py
# ui/login_screen.py
import tkinter as tk
from tkinter import messagebox
import sqlite3
import os
from dotenv import load_dotenv
from database.db_setup import verify_password
from ui.ui_utils import COLORS, FONTS  # Only import what we need directly

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class LoginScreen:
    def __init__(self, parent, on_login_callback):
        self.parent = parent
        self.on_login_callback = on_login_callback

        # Create main frame
        self.frame = tk.Frame(parent, bg=COLORS['bg'])
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        # Create a centered frame for login
        login_container = tk.Frame(self.frame, bg=COLORS['bg'])
        login_container.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

        # Create form frame within the container
        login_frame = tk.Frame(login_container, bg=COLORS['bg'], padx=20, pady=20)
        login_frame.pack(padx=30, pady=30)

        # Title
        title_label = tk.Label(
            login_frame,
            text="OL Service POS System",
            font=('Arial', 20, 'bold'),
            bg=COLORS['bg'],
            pady=20
        )
        title_label.grid(row=0, column=0, columnspan=2)

        # Username
        username_label = tk.Label(
            login_frame,
            text="Username:",
            font=FONTS['normal'],
            bg=COLORS['bg']
        )
        username_label.grid(row=1, column=0, sticky=tk.W, pady=5)

        self.username_entry = tk.Entry(
            login_frame,
            font=FONTS['normal'],
            width=20
        )
        self.username_entry.grid(row=1, column=1, pady=5, padx=5)

        # Password
        password_label = tk.Label(
            login_frame,
            text="Password:",
            font=FONTS['normal'],
            bg=COLORS['bg']
        )
        password_label.grid(row=2, column=0, sticky=tk.W, pady=5)

        self.password_entry = tk.Entry(
            login_frame,
            font=FONTS['normal'],
            width=20,
            show="*"
        )
        self.password_entry.grid(row=2, column=1, pady=5, padx=5)

        # Login button
        login_button = tk.Button(
            login_frame,
            text="Login",
            font=FONTS['normal_bold'],
            bg=COLORS['primary'],
            fg="white",
            padx=10,
            command=self.login
        )
        login_button.grid(row=3, column=0, columnspan=2, pady=20)

        # Set focus to username entry
        self.username_entry.focus_set()

        # Bind Enter key to login function
        self.parent.bind('<Return>', lambda event: self.login())

    def login(self):
        """Verify login credentials and log user in"""
        username = self.username_entry.get()
        password = self.password_entry.get()

        if not username or not password:
            messagebox.showerror("Error", "Please enter both username and password")
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get the user by username
        cursor.execute("SELECT id, role, password FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        conn.close()

        if user and verify_password(user[2], password):
            user_data = {'id': user[0], 'username': username, 'role': user[1]}
            self.on_login_callback(user_data)
        else:
            messagebox.showerror("Error", "Invalid username or password")

    def destroy(self):
        """Remove the frame and all its children"""
        self.parent.unbind('<Return>')  # Remove the Return key binding
        self.frame.destroy()