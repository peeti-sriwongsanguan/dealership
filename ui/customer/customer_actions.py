# ui/customer/customer_actions.py

import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.customer_db import get_customer_by_id, delete_customer
from database.vehicle_db import get_vehicles_by_customer
from ui.customer.vehicle_selector import VehicleSelector

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


def view_customer_photos(parent, customer_id):
    """View all photos for a customer

    Args:
        parent: The parent widget
        customer_id: ID of the customer
    """
    if not customer_id:
        messagebox.showinfo("Info", "Please select a customer")
        return

    # Import here to avoid circular imports
    from ui.photo_gallery import PhotoGallery

    # Get customer name
    customer = get_customer_by_id(customer_id)
    if not customer:
        messagebox.showerror("Error", "Customer not found")
        return

    # Create photo gallery
    gallery = PhotoGallery(parent, f"Photos for {customer['name']}")
    gallery.load_photos_for_customer(customer_id)


def start_customer_checkin(parent, user, customer_id, callback):
    """Start the check-in process for a customer

    Args:
        parent: The parent widget
        user: Current user information
        customer_id: ID of the customer
        callback: Function to call after check-in completes
    """
    if not customer_id:
        messagebox.showinfo("Info", "Please select a customer")
        return False

    # Select a vehicle
    VehicleSelector(parent, customer_id, lambda vehicle_id: handle_vehicle_selection(
        parent, user, vehicle_id, callback))

    return True


def handle_vehicle_selection(parent, user, vehicle_id, callback):
    """Handle the vehicle selection result

    Args:
        parent: The parent widget
        user: Current user information
        vehicle_id: ID of the selected vehicle, or None if cancelled
        callback: Function to call after check-in completes
    """
    if not vehicle_id:
        return

    # Import here to avoid circular imports
    from ui.checkin import CustomerCheckIn

    # Start check-in
    CustomerCheckIn(parent, user, vehicle_id, callback)


def confirm_delete_customer(parent, customer_id, refresh_callback):
    """Confirm and delete a customer

    Args:
        parent: The parent widget
        customer_id: ID of the customer to delete
        refresh_callback: Function to call to refresh the list after deletion
    """
    if not customer_id:
        messagebox.showinfo("Info", "Please select a customer")
        return False

    # Get customer details
    customer = get_customer_by_id(customer_id)
    if not customer:
        messagebox.showerror("Error", "Customer not found")
        return False

    # Confirm deletion
    if not messagebox.askyesno("Confirm Delete",
                               f"Are you sure you want to delete {customer['name']} and all related data?\n\nThis cannot be undone!"):
        return False

    # Delete customer
    success = delete_customer(customer_id)

    if success:
        messagebox.showinfo("Success", f"{customer['name']} deleted successfully")
        refresh_callback()
        return True
    else:
        messagebox.showerror("Error", "Failed to delete customer")
        return False


def manage_customer_vehicles(parent, user, customer_id, callback):
    """Open the vehicle management screen for a customer

    Args:
        parent: The parent widget
        user: Current user information
        customer_id: ID of the customer
        callback: Function to call when returning from vehicle management
    """
    if not customer_id:
        messagebox.showinfo("Info", "Please select a customer")
        return False

    # Import here to avoid circular imports
    from ui.vehicle import VehicleManagement

    # Show vehicle management
    VehicleManagement(parent, user, customer_id, callback)
    return True


def add_vehicle_for_customer(parent, customer_id, callback):
    """Show form to add a new vehicle for a customer

    Args:
        parent: The parent widget
        customer_id: ID of the customer
        callback: Function to call after adding the vehicle
    """
    # Import here to avoid circular imports
    from ui.vehicle import VehicleForm

    # Get customer details
    customer = get_customer_by_id(customer_id)
    if not customer:
        messagebox.showerror("Error", "Customer not found")
        return False

    # Show form
    VehicleForm(parent, customer_id, callback)
    return True