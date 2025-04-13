# ui/customer/customer_form.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.customer_db import create_customer, update_customer, get_customer_by_id

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

        # Create window
        self.window = tk.Toplevel(parent)

        # Load customer data if editing
        self.customer = None
        if customer_id:
            self.customer = get_customer_by_id(customer_id)
            self.window.title(f"Edit Customer: {self.customer['name']}")
        else:
            self.window.title("New Customer")

        self.window.geometry("500x400")
        self.window.configure(bg="#f0f0f0")

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        """Set up the form UI"""
        # Customer data frame
        form_frame = tk.Frame(self.window, bg="#f0f0f0", padx=20, pady=20)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Name
        name_label = tk.Label(form_frame, text="Name:", font=("Arial", 12), bg="#f0f0f0")
        name_label.grid(row=0, column=0, sticky=tk.W, pady=5)
        self.name_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.name_entry.grid(row=0, column=1, pady=5, padx=5, sticky=tk.W)

        # Phone
        phone_label = tk.Label(form_frame, text="Phone:", font=("Arial", 12), bg="#f0f0f0")
        phone_label.grid(row=1, column=0, sticky=tk.W, pady=5)
        self.phone_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.phone_entry.grid(row=1, column=1, pady=5, padx=5, sticky=tk.W)

        # Email
        email_label = tk.Label(form_frame, text="Email:", font=("Arial", 12), bg="#f0f0f0")
        email_label.grid(row=2, column=0, sticky=tk.W, pady=5)
        self.email_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.email_entry.grid(row=2, column=1, pady=5, padx=5, sticky=tk.W)

        # Address
        address_label = tk.Label(form_frame, text="Address:", font=("Arial", 12), bg="#f0f0f0")
        address_label.grid(row=3, column=0, sticky=tk.W, pady=5)
        self.address_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.address_entry.grid(row=3, column=1, pady=5, padx=5, sticky=tk.W)

        # Fill values if editing
        if self.customer:
            self.name_entry.insert(0, self.customer.get('name', ''))
            self.phone_entry.insert(0, self.customer.get('phone', ''))
            self.email_entry.insert(0, self.customer.get('email', ''))
            self.address_entry.insert(0, self.customer.get('address', ''))

            # Show registration date if available
            if self.customer.get('registration_date'):
                reg_label = tk.Label(form_frame, text="Registered:", font=("Arial", 12), bg="#f0f0f0")
                reg_label.grid(row=4, column=0, sticky=tk.W, pady=5)
                reg_value = tk.Label(form_frame, text=self.customer.get('registration_date', ''),
                                     font=("Arial", 12), bg="#f0f0f0")
                reg_value.grid(row=4, column=1, pady=5, padx=5, sticky=tk.W)

        # Buttons frame
        buttons_frame = tk.Frame(form_frame, bg="#f0f0f0")
        buttons_frame.grid(row=5, column=0, columnspan=2, pady=20)

        # Save button
        save_button = tk.Button(buttons_frame, text="Save", font=("Arial", 12, "bold"),
                                bg="#4CAF50", fg="white", padx=10, command=self.save_customer)
        save_button.grid(row=0, column=0, padx=10)

        # Cancel button
        cancel_button = tk.Button(buttons_frame, text="Cancel", font=("Arial", 12, "bold"),
                                  bg="#F44336", fg="white", padx=10, command=self.window.destroy)
        cancel_button.grid(row=0, column=1, padx=10)

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