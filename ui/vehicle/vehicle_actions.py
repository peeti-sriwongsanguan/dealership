# ui/vehicle/vehicle_actions.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.vehicle_db import get_vehicle_by_id, delete_vehicle
from database.customer_db import get_customer_by_id

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


def view_vehicle_photos(parent, vehicle_id):
    """View all photos for a vehicle

    Args:
        parent: The parent widget
        vehicle_id: ID of the vehicle
    """
    if not vehicle_id:
        messagebox.showinfo("Info", "Please select a vehicle")
        return

    # Import here to avoid circular imports
    from ui.photo_gallery import PhotoGallery

    # Get vehicle info
    vehicle = get_vehicle_by_id(vehicle_id)
    if not vehicle:
        messagebox.showerror("Error", "Vehicle not found")
        return

    # Create title for gallery
    title = f"Photos for {vehicle['year']} {vehicle['make']} {vehicle['model']}"
    if vehicle.get('license_plate'):
        title += f" ({vehicle['license_plate']})"

    # Create photo gallery
    gallery = PhotoGallery(parent, title)
    gallery.load_photos_for_vehicle(vehicle_id)


def start_vehicle_checkin(parent, user, vehicle_id, callback):
    """Start the check-in process for a vehicle

    Args:
        parent: The parent widget
        user: Current user information
        vehicle_id: ID of the vehicle
        callback: Function to call after check-in completes
    """
    if not vehicle_id:
        messagebox.showinfo("Info", "Please select a vehicle")
        return False

    # Import here to avoid circular imports
    from ui.checkin_ui import CustomerCheckIn

    # Start check-in
    CustomerCheckIn(parent, user, vehicle_id, callback)
    return True


def confirm_delete_vehicle(parent, vehicle_id, refresh_callback):
    """Confirm and delete a vehicle

    Args:
        parent: The parent widget
        vehicle_id: ID of the vehicle to delete
        refresh_callback: Function to call to refresh the list after deletion
    """
    if not vehicle_id:
        messagebox.showinfo("Info", "Please select a vehicle")
        return False

    # Get vehicle details
    vehicle = get_vehicle_by_id(vehicle_id)
    if not vehicle:
        messagebox.showerror("Error", "Vehicle not found")
        return False

    # Format vehicle info for display
    vehicle_info = f"{vehicle['year']} {vehicle['make']} {vehicle['model']}"
    if vehicle.get('license_plate'):
        vehicle_info += f" ({vehicle['license_plate']})"

    # Confirm deletion
    if not messagebox.askyesno("Confirm Delete",
                               f"Are you sure you want to delete the {vehicle_info} and all related service records?\n\nThis cannot be undone!"):
        return False

    # Delete vehicle
    success = delete_vehicle(vehicle_id)

    if success:
        messagebox.showinfo("Success", f"{vehicle_info} deleted successfully")
        refresh_callback()
        return True
    else:
        messagebox.showerror("Error", "Failed to delete vehicle")
        return False


def view_vehicle_services(parent, user, vehicle_id, callback):
    """View services for a specific vehicle

    Args:
        parent: The parent widget
        user: Current user information
        vehicle_id: ID of the vehicle
        callback: Function to call when returning from service view
    """
    if not vehicle_id:
        messagebox.showinfo("Info", "Please select a vehicle")
        return False

    # Import here to avoid circular imports
    from ui.service_ui import ServiceManagement

    # Show services filtered for this vehicle
    ServiceManagement(parent, user, callback, vehicle_id=vehicle_id)
    return True