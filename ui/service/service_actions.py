# ui/service/service_actions.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.service_db import get_service_by_id, update_service, delete_service
from database.vehicle_db import get_vehicle_by_id
from database.photo_db import get_photos_for_service

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


def view_service_photos(parent, service_id):
    """View all photos for a service

    Args:
        parent: The parent widget
        service_id: ID of the service
    """
    if not service_id:
        messagebox.showinfo("Info", "Please select a service")
        return

    # Import here to avoid circular imports
    from ui.photo_gallery import PhotoGallery

    # Get service info
    service = get_service_by_id(service_id)
    if not service:
        messagebox.showerror("Error", "Service not found")
        return

    # Get photos
    photos = get_photos_for_service(service_id)
    if not photos:
        messagebox.showinfo("Info", "No photos available for this service")
        return

    # Create title for gallery
    title = f"Photos for {service['service_type']} - {service['make']} {service['model']}"

    # Create photo gallery
    gallery = PhotoGallery(parent, title)
    gallery.load_photos_for_service(service_id)


def update_service_status(service_id, new_status, description=None, callback=None):
    """Update the status of a service

    Args:
        service_id: ID of the service
        new_status: New status value
        description: Optional updated description
        callback: Function to call after update

    Returns:
        bool: Success or failure
    """
    if not service_id:
        messagebox.showinfo("Info", "Please select a service")
        return False

    # Get current service data
    service = get_service_by_id(service_id)
    if not service:
        messagebox.showerror("Error", "Service not found")
        return False

    # Prepare update data
    update_data = {'status': new_status}

    # Add description if provided
    if description is not None:
        update_data['description'] = description

    # If completing service, set completion date
    import datetime
    if new_status == "Completed" and service['status'] != "Completed":
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        update_data['actual_completion'] = today

    # Update database
    success = update_service(service_id, update_data)

    if success:
        messagebox.showinfo("Success", "Service status updated")
        if callback:
            callback()
        return True
    else:
        messagebox.showerror("Error", "Failed to update service status")
        return False


def confirm_delete_service(parent, service_id, refresh_callback):
    """Confirm and delete a service

    Args:
        parent: The parent widget
        service_id: ID of the service to delete
        refresh_callback: Function to call to refresh the list after deletion

    Returns:
        bool: Success or failure
    """
    if not service_id:
        messagebox.showinfo("Info", "Please select a service")
        return False

    # Get service details
    service = get_service_by_id(service_id)
    if not service:
        messagebox.showerror("Error", "Service not found")
        return False

    # Format service info for display
    service_info = f"{service['service_type']} for {service['make']} {service['model']}"

    # Confirm deletion
    if not messagebox.askyesno("Confirm Delete",
                               f"Are you sure you want to delete this service?\n\n{service_info}\n\nThis cannot be undone!"):
        return False

    # Delete service
    success = delete_service(service_id)

    if success:
        messagebox.showinfo("Success", "Service deleted successfully")
        refresh_callback()
        return True
    else:
        messagebox.showerror("Error", "Failed to delete service")
        return False


def get_service_status_color(status):
    """Get a color representing a service status

    Args:
        status: Service status string

    Returns:
        str: Color hex code
    """
    status_colors = {
        "Pending": "#FFC107",  # Amber
        "In Progress": "#2196F3",  # Blue
        "Awaiting Parts": "#FF9800",  # Orange
        "On Hold": "#9E9E9E",  # Grey
        "Completed": "#4CAF50",  # Green
        "Cancelled": "#F44336"  # Red
    }

    return status_colors.get(status, "#000000")  # Default to black if unknown


def assign_mechanic_to_service(parent, service_id, callback=None):
    """Show dialog to assign a mechanic to a service

    Args:
        parent: The parent widget
        service_id: ID of the service
        callback: Function to call after assignment
    """
    if not service_id:
        messagebox.showinfo("Info", "Please select a service")
        return False

    # Get service
    service = get_service_by_id(service_id)
    if not service:
        messagebox.showerror("Error", "Service not found")
        return False

    # Get mechanics
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, username FROM users 
    WHERE role = 'mechanic' OR role = 'admin'
    ORDER BY username
    """)

    mechanics = cursor.fetchall()
    conn.close()

    if not mechanics:
        messagebox.showinfo("Info", "No mechanics found in the system")
        return False

    # Create dialog
    dialog = tk.Toplevel(parent)
    dialog.title("Assign Mechanic")
    dialog.geometry("300x300")
    dialog.configure(bg="#f0f0f0")

    # Create frame
    frame = tk.Frame(dialog, bg="#f0f0f0", padx=20, pady=20)
    frame.pack(fill=tk.BOTH, expand=True)

    # Service info
    service_label = tk.Label(frame,
                             text=f"Service: {service['service_type']}\nVehicle: {service['make']} {service['model']}",
                             font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
    service_label.pack(anchor=tk.W, pady=10)

    # Mechanic selection
    mech_label = tk.Label(frame, text="Select Mechanic:",
                          font=("Arial", 12), bg="#f0f0f0")
    mech_label.pack(anchor=tk.W, pady=5)

    # Listbox for mechanics
    mech_listbox = tk.Listbox(frame, font=("Arial", 12), height=8)
    mech_listbox.pack(fill=tk.BOTH, expand=True, pady=5)

    # Add mechanics to listbox
    mech_map = {}  # Map listbox indices to mechanic IDs
    for i, (mech_id, mech_name) in enumerate(mechanics):
        mech_listbox.insert(tk.END, mech_name)
        mech_map[i] = mech_id

        # Select current mechanic if assigned
        if service.get('mechanic_id') == mech_id:
            mech_listbox.selection_set(i)

    # Buttons
    button_frame = tk.Frame(frame, bg="#f0f0f0")
    button_frame.pack(fill=tk.X, pady=10)

    def on_assign():
        # Get selected mechanic
        selected = mech_listbox.curselection()
        if not selected:
            messagebox.showinfo("Info", "Please select a mechanic")
            return

        mechanic_id = mech_map[selected[0]]

        # Update service
        update_data = {'mechanic_id': mechanic_id}
        success = update_service(service_id, update_data)

        if success:
            messagebox.showinfo("Success", "Mechanic assigned successfully")
            dialog.destroy()
            if callback:
                callback()
        else:
            messagebox.showerror("Error", "Failed to assign mechanic")

    assign_button = tk.Button(button_frame, text="Assign", font=("Arial", 12, "bold"),
                              bg="#4CAF50", fg="white", padx=10, command=on_assign)
    assign_button.pack(side=tk.LEFT, padx=10)

    cancel_button = tk.Button(button_frame, text="Cancel", font=("Arial", 12, "bold"),
                              bg="#F44336", fg="white", padx=10, command=dialog.destroy)
    cancel_button.pack(side=tk.RIGHT, padx=10)

    return True