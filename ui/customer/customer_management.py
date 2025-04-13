# ui/customer/customer_management.py
import tkinter as tk
from tkinter import ttk, messagebox
import os
from dotenv import load_dotenv
from database.customer_db import get_all_customers, search_customers
from ui.customer.customer_form import CustomerForm
from ui.customer.customer_actions import (
    view_customer_photos,
    start_customer_checkin,
    confirm_delete_customer,
    manage_customer_vehicles,
    add_vehicle_for_customer
)

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class CustomerManagement:
    """Main customer management screen"""

    def __init__(self, parent, user, callback):
        """
        Initialize the customer management screen

        Args:
            parent: The parent widget
            user: Current user information
            callback: Function to call when returning to main menu
        """
        self.parent = parent
        self.user = user
        self.callback = callback

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.setup_ui()

    def setup_ui(self):
        """Set up the UI components"""
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text="Customer Management",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back to Menu",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Content frame
        content_frame = tk.Frame(self.frame, bg="#f0f0f0", padx=20, pady=20)
        content_frame.pack(fill=tk.BOTH, expand=True)

        # Left frame - Customer list
        list_frame = tk.Frame(content_frame, bg="white", padx=10, pady=10)
        list_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Search frame
        search_frame = tk.Frame(list_frame, bg="white")
        search_frame.pack(fill=tk.X, padx=5, pady=5)

        search_label = tk.Label(search_frame, text="Search:", bg="white")
        search_label.pack(side=tk.LEFT, padx=5)

        self.search_entry = tk.Entry(search_frame, width=25)
        self.search_entry.pack(side=tk.LEFT, padx=5)

        search_button = tk.Button(search_frame, text="Search",
                                  command=self.search_customers)
        search_button.pack(side=tk.LEFT, padx=5)

        # Customer treeview
        self.customer_tree = ttk.Treeview(list_frame, columns=("ID", "Name", "Phone"),
                                          show="headings", height=20)
        self.customer_tree.heading("ID", text="ID")
        self.customer_tree.heading("Name", text="Name")
        self.customer_tree.heading("Phone", text="Phone")

        self.customer_tree.column("ID", width=50)
        self.customer_tree.column("Name", width=150)
        self.customer_tree.column("Phone", width=120)

        self.customer_tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.customer_tree.bind("<Double-1>", self.on_customer_select)

        # Add scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=self.customer_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.customer_tree.configure(yscrollcommand=scrollbar.set)

        # Load customer data
        self.load_customers()

        # Right frame - Customer details/actions
        action_frame = tk.Frame(content_frame, bg="#f0f0f0", padx=10, pady=10, width=300)
        action_frame.pack(side=tk.RIGHT, fill=tk.Y)
        action_frame.pack_propagate(False)

        # New customer button
        new_customer_button = tk.Button(action_frame, text="New Customer",
                                        font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                        height=2, width=20, command=self.new_customer)
        new_customer_button.pack(pady=10)

        # View/Edit customer button
        view_customer_button = tk.Button(action_frame, text="View/Edit Customer",
                                         font=("Arial", 12, "bold"), bg="#2196F3", fg="white",
                                         height=2, width=20, command=self.view_customer)
        view_customer_button.pack(pady=10)

        # Manage vehicles button
        vehicles_button = tk.Button(action_frame, text="Manage Vehicles",
                                    font=("Arial", 12, "bold"), bg="#FF9800", fg="white",
                                    height=2, width=20, command=self.manage_vehicles)
        vehicles_button.pack(pady=10)

        # New check-in button
        checkin_button = tk.Button(action_frame, text="New Service Check-In",
                                   font=("Arial", 12, "bold"), bg="#9C27B0", fg="white",
                                   height=2, width=20, command=self.new_checkin)
        checkin_button.pack(pady=10)

        # View photos button
        photos_button = tk.Button(action_frame, text="View Customer Photos",
                                  font=("Arial", 12, "bold"), bg="#00BCD4", fg="white",
                                  height=2, width=20, command=self.view_photos)
        photos_button.pack(pady=10)

        # Delete customer button
        delete_button = tk.Button(action_frame, text="Delete Customer",
                                  font=("Arial", 12, "bold"), bg="#F44336", fg="white",
                                  height=2, width=20, command=self.delete_customer)
        delete_button.pack(pady=10)

    def load_customers(self):
        """Load customer data into the treeview"""
        # Clear existing data
        for i in self.customer_tree.get_children():
            self.customer_tree.delete(i)

        # Get all customers
        customers = get_all_customers()

        # Insert data into treeview
        for customer in customers:
            self.customer_tree.insert("", tk.END, values=(
                customer['id'],
                customer['name'],
                customer.get('phone', '')
            ))

    def search_customers(self):
        """Search customers by name or phone"""
        search_term = self.search_entry.get()

        if not search_term:
            self.load_customers()
            return

        # Clear existing data
        for i in self.customer_tree.get_children():
            self.customer_tree.delete(i)

        # Search customers
        customers = search_customers(search_term)

        # Insert data into treeview
        for customer in customers:
            self.customer_tree.insert("", tk.END, values=(
                customer['id'],
                customer['name'],
                customer.get('phone', '')
            ))

    def on_customer_select(self, event):
        """Handle customer selection from treeview"""
        selected_item = self.customer_tree.selection()
        if selected_item:
            self.view_customer()

    def get_selected_customer_id(self):
        """Get the ID of the selected customer"""
        selected_item = self.customer_tree.selection()
        if not selected_item:
            messagebox.showinfo("Info", "Please select a customer")
            return None

        customer_id = self.customer_tree.item(selected_item[0], 'values')[0]
        return customer_id

    def new_customer(self):
        """Show form to add a new customer"""
        CustomerForm(
            self.parent,
            lambda customer_id: self.after_new_customer(customer_id)
        )

    def after_new_customer(self, customer_id):
        """Handle after a new customer is added

        Args:
            customer_id: ID of the new customer, or None if cancelled
        """
        if customer_id:
            # Refresh customer list
            self.load_customers()

            # Ask if they want to add a vehicle
            if messagebox.askyesno("Add Vehicle", "Do you want to add a vehicle for this customer?"):
                add_vehicle_for_customer(
                    self.parent,
                    customer_id,
                    lambda: self.load_customers()
                )

    def view_customer(self):
        """View/edit customer details"""
        customer_id = self.get_selected_customer_id()
        if customer_id:
            CustomerForm(
                self.parent,
                lambda _: self.load_customers(),
                customer_id
            )

    def manage_vehicles(self):
        """Manage vehicles for the selected customer"""
        customer_id = self.get_selected_customer_id()
        if customer_id:
            self.frame.pack_forget()
            manage_customer_vehicles(
                self.parent,
                self.user,
                customer_id,
                self.show_customer_management
            )

    def new_checkin(self):
        """Start a new check-in for the selected customer"""
        customer_id = self.get_selected_customer_id()
        if customer_id:
            self.frame.pack_forget()
            start_customer_checkin(
                self.parent,
                self.user,
                customer_id,
                self.show_customer_management
            )

    def view_photos(self):
        """View photos for the selected customer"""
        customer_id = self.get_selected_customer_id()
        if customer_id:
            view_customer_photos(self.parent, customer_id)

    def delete_customer(self):
        """Delete the selected customer"""
        customer_id = self.get_selected_customer_id()
        if customer_id:
            confirm_delete_customer(
                self.parent,
                customer_id,
                self.load_customers
            )

    def on_back(self):
        """Return to the main menu"""
        self.destroy()
        self.callback()

    def show_customer_management(self):
        """Show the customer management screen again"""
        self.frame.pack(fill=tk.BOTH, expand=True)
        self.load_customers()

    def destroy(self):
        """Clean up resources"""
        self.frame.destroy()