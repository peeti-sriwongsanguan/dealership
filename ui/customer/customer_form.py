# ui/customer/customer_form.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.customer_db import create_customer, update_customer, get_customer_by_id
from ui.ui_utils import (create_logo_window, create_form_frame, create_label,
                        create_entry, create_buttons_frame, create_button)

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class CustomerForm:
    """A form for adding or editing customer information"""

    def __init__(self, parent, callback, customer_id=None):
        """
        Initialize the customer form

        Args:
            parent: The parent widget
            callback: Function to call after save (with customer_id as parameter)
            customer_id: ID of customer to edit, or None for new customer
        """
        self.parent = parent
        self.callback = callback
        self.customer_id = customer_id

        # Load customer data if editing
        self.customer = None
        if customer_id:
            self.customer = get_customer_by_id(customer_id)
            title = f"Edit Customer: {self.customer['name']}"
        else:
            title = "New Customer"

        # Create window with logo header
        self.window, self.content_frame = create_logo_window(parent, title)

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        """Set up the form UI"""
        # Customer data frame
        form_frame = create_form_frame(self.content_frame)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Name
        create_label(form_frame, "Name:", 0, 0)
        self.name_entry = create_entry(form_frame, 0, 1)

        # Phone
        create_label(form_frame, "Phone:", 1, 0)
        self.phone_entry = create_entry(form_frame, 1, 1)

        # Email
        create_label(form_frame, "Email:", 2, 0)
        self.email_entry = create_entry(form_frame, 2, 1)

        # Address
        create_label(form_frame, "Address:", 3, 0)
        self.address_entry = create_entry(form_frame, 3, 1)

        # Fill values if editing
        if self.customer:
            self.name_entry.insert(0, self.customer.get('name', ''))
            self.phone_entry.insert(0, self.customer.get('phone', ''))
            self.email_entry.insert(0, self.customer.get('email', ''))
            self.address_entry.insert(0, self.customer.get('address', ''))

            # Show registration date if available
            if self.customer.get('registration_date'):
                create_label(form_frame, "Registered:", 4, 0)
                create_label(form_frame, self.customer.get('registration_date', ''), 4, 1)

        # Buttons frame
        buttons_frame = create_buttons_frame(form_frame, 5, 0)

        # Save button
        create_button(
            buttons_frame,
            "Save",
            self.save_customer,
            column=0,
            is_primary=True
        )

        # Cancel button
        create_button(
            buttons_frame,
            "Cancel",
            self.window.destroy,
            column=1,
            is_primary=False,
            is_danger=True
        )

    def save_customer(self):
        """Save the customer to the database"""
        # Get form values
        name = self.name_entry.get()
        phone = self.phone_entry.get()
        email = self.email_entry.get()
        address = self.address_entry.get()

        # Validate
        if not name:
            messagebox.showerror("Error", "Name is required")
            return

        # Prepare customer data
        customer_data = {
            'name': name,
            'phone': phone,
            'email': email,
            'address': address
        }

        if self.customer_id:
            # Update existing customer
            success = update_customer(self.customer_id, customer_data)
            if success:
                messagebox.showinfo("Success", "Customer details updated")
                self.window.destroy()
                self.callback(self.customer_id)
            else:
                messagebox.showerror("Error", "Failed to update customer details")
        else:
            # Create new customer
            customer_id = create_customer(customer_data)
            if customer_id:
                messagebox.showinfo("Success", f"Customer {name} added successfully")
                self.window.destroy()
                self.callback(customer_id)
            else:
                messagebox.showerror("Error", "Failed to add customer")