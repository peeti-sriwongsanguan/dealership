# ui/admin/user_management.py
import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3


class UserManagementTab:
    def __init__(self, parent):
        self.parent = parent
        self.setup_ui()

    def setup_ui(self):
        """Setup the user management tab"""
        # Split into left (list) and right (form) panes
        list_frame = tk.Frame(self.parent, bg="#f0f0f0", padx=10, pady=10)
        list_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        form_frame = tk.Frame(self.parent, bg="#f0f0f0", padx=10, pady=10, width=300)
        form_frame.pack(side=tk.RIGHT, fill=tk.Y)
        form_frame.pack_propagate(False)

        # Users treeview
        self.user_tree = ttk.Treeview(list_frame,
                                      columns=("ID", "Username", "Role"),
                                      show="headings", height=15)
        self.user_tree.heading("ID", text="ID")
        self.user_tree.heading("Username", text="Username")
        self.user_tree.heading("Role", text="Role")

        self.user_tree.column("ID", width=40)
        self.user_tree.column("Username", width=150)
        self.user_tree.column("Role", width=100)

        self.user_tree.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        self.user_tree.bind("<ButtonRelease-1>", self.on_user_select)

        # Add scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient="vertical",
                                  command=self.user_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.user_tree.configure(yscrollcommand=scrollbar.set)

        # Form for adding/editing users
        form_label = tk.Label(form_frame, text="User Details",
                              font=("Arial", 14, "bold"), bg="#f0f0f0")
        form_label.pack(pady=10)

        # Username
        username_frame = tk.Frame(form_frame, bg="#f0f0f0")
        username_frame.pack(fill=tk.X, pady=5)

        username_label = tk.Label(username_frame, text="Username:",
                                  font=("Arial", 12), bg="#f0f0f0", width=10, anchor="w")
        username_label.pack(side=tk.LEFT)

        self.username_entry = tk.Entry(username_frame, font=("Arial", 12), width=20)
        self.username_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Password
        password_frame = tk.Frame(form_frame, bg="#f0f0f0")
        password_frame.pack(fill=tk.X, pady=5)

        password_label = tk.Label(password_frame, text="Password:",
                                  font=("Arial", 12), bg="#f0f0f0", width=10, anchor="w")
        password_label.pack(side=tk.LEFT)

        self.password_entry = tk.Entry(password_frame, font=("Arial", 12),
                                       width=20, show="*")
        self.password_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Role
        role_frame = tk.Frame(form_frame, bg="#f0f0f0")
        role_frame.pack(fill=tk.X, pady=5)

        role_label = tk.Label(role_frame, text="Role:",
                              font=("Arial", 12), bg="#f0f0f0", width=10, anchor="w")
        role_label.pack(side=tk.LEFT)

        self.role_var = tk.StringVar()
        roles = ["admin", "mechanic", "receptionist"]
        self.role_var.set(roles[0])

        role_dropdown = ttk.Combobox(role_frame, textvariable=self.role_var,
                                     values=roles, width=18)
        role_dropdown.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Buttons
        buttons_frame = tk.Frame(form_frame, bg="#f0f0f0")
        buttons_frame.pack(fill=tk.X, pady=20)

        self.add_button = tk.Button(buttons_frame, text="Add User",
                                    font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                    command=self.add_user)
        self.add_button.pack(side=tk.LEFT, padx=5)

        self.update_button = tk.Button(buttons_frame, text="Update User",
                                       font=("Arial", 12, "bold"), bg="#2196F3", fg="white",
                                       command=self.update_user)
        self.update_button.pack(side=tk.LEFT, padx=5)
        self.update_button.config(state=tk.DISABLED)

        self.delete_button = tk.Button(buttons_frame, text="Delete User",
                                       font=("Arial", 12, "bold"), bg="#F44336", fg="white",
                                       command=self.delete_user)
        self.delete_button.pack(side=tk.LEFT, padx=5)
        self.delete_button.config(state=tk.DISABLED)

        # Clear form button
        clear_button = tk.Button(form_frame, text="Clear Form",
                                 command=self.clear_user_form)
        clear_button.pack(pady=10)

        # Load users
        self.load_users()

        # Store currently selected user ID
        self.selected_user_id = None

    def load_users(self):
        """Load users into the treeview"""
        # Clear existing data
        for i in self.user_tree.get_children():
            self.user_tree.delete(i)

        # Get users from database
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        cursor.execute("SELECT id, username, role FROM users ORDER BY username")
        users = cursor.fetchall()

        conn.close()

        # Add to treeview
        for user in users:
            self.user_tree.insert("", tk.END, values=user)

    def on_user_select(self, event):
        """Handle user selection in treeview"""
        selected_item = self.user_tree.selection()
        if not selected_item:
            return

        # Get user data
        user_values = self.user_tree.item(selected_item[0], 'values')
        user_id = user_values[0]
        username = user_values[1]
        role = user_values[2]

        # Store selected user ID
        self.selected_user_id = user_id

        # Fill form fields
        self.username_entry.delete(0, tk.END)
        self.username_entry.insert(0, username)

        self.password_entry.delete(0, tk.END)
        self.password_entry.insert(0, "********")  # Placeholder, not actual password

        self.role_var.set(role)

        # Enable update/delete buttons
        self.update_button.config(state=tk.NORMAL)
        self.delete_button.config(state=tk.NORMAL)

    def clear_user_form(self):
        """Clear the user form"""
        self.username_entry.delete(0, tk.END)
        self.password_entry.delete(0, tk.END)
        self.role_var.set("admin")

        # Clear selection
        for item in self.user_tree.selection():
            self.user_tree.selection_remove(item)

        self.selected_user_id = None

        # Disable update/delete buttons
        self.update_button.config(state=tk.DISABLED)
        self.delete_button.config(state=tk.DISABLED)

    def add_user(self):
        """Add a new user"""
        username = self.username_entry.get()
        password = self.password_entry.get()
        role = self.role_var.get()

        if not username or not password:
            messagebox.showerror("Error", "Username and password are required")
            return

        # Check if username already exists
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        existing = cursor.fetchone()

        if existing:
            messagebox.showerror("Error", f"Username '{username}' already exists")
            conn.close()
            return

        # Add new user
        cursor.execute("""
        INSERT INTO users (username, password, role) 
        VALUES (?, ?, ?)
        """, (username, password, role))

        conn.commit()
        conn.close()

        messagebox.showinfo("Success", f"User '{username}' added successfully")

        # Refresh user list
        self.load_users()
        self.clear_user_form()

    def update_user(self):
        """Update an existing user"""
        if not self.selected_user_id:
            return

        username = self.username_entry.get()
        password = self.password_entry.get()
        role = self.role_var.get()

        if not username:
            messagebox.showerror("Error", "Username is required")
            return

        # Check if username already exists for another user
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE username = ? AND id != ?",
                       (username, self.selected_user_id))
        existing = cursor.fetchone()

        if existing:
            messagebox.showerror("Error", f"Username '{username}' already exists")
            conn.close()
            return

        # Update user
        if password == "********":
            # Password not changed, update only username and role
            cursor.execute("""
            UPDATE users SET username = ?, role = ? WHERE id = ?
            """, (username, role, self.selected_user_id))
        else:
            # Update all fields
            cursor.execute("""
            UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?
            """, (username, password, role, self.selected_user_id))

        conn.commit()
        conn.close()

        messagebox.showinfo("Success", f"User '{username}' updated successfully")

        # Refresh user list
        self.load_users()
        self.clear_user_form()

    def delete_user(self):
        """Delete a user"""
        if not self.selected_user_id:
            return

        # Get username
        username = self.username_entry.get()

        # Confirm deletion
        if not messagebox.askyesno("Confirm Delete",
                                   f"Are you sure you want to delete the user '{username}'?"):
            return

        # Check if it's the last admin
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()[0]

        cursor.execute("SELECT role FROM users WHERE id = ?", (self.selected_user_id,))
        user_role = cursor.fetchone()[0]

        if admin_count <= 1 and user_role == 'admin':
            messagebox.showerror("Error", "Cannot delete the last administrator account")
            conn.close()
            return

        # Delete user
        cursor.execute("DELETE FROM users WHERE id = ?", (self.selected_user_id,))

        conn.commit()
        conn.close()

        messagebox.showinfo("Success", f"User '{username}' deleted successfully")

        # Refresh user list
        self.load_users()
        self.clear_user_form()