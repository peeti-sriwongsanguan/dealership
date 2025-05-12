# ui/vehicle/vehicle_form.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.vehicle_db import create_vehicle, update_vehicle, get_vehicle_by_id
from database.customer_db import get_customer_by_id
from ui.ui_utils import (create_form_window, create_form_frame, create_label,
                        create_entry, create_buttons_frame, create_button,
                        FONTS)

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class VehicleForm:
    """A form for adding or editing vehicle information"""

    def __init__(self, parent, customer_id, callback, vehicle_id=None):
        """
        Initialize the vehicle form

        Args:
            parent: The parent widget
            customer_id: ID of the customer who owns the vehicle
            callback: Function to call after save
            vehicle_id: ID of vehicle to edit, or None for new vehicle
        """
        self.parent = parent
        self.customer_id = customer_id
        self.callback = callback
        self.vehicle_id = vehicle_id

        # Get customer info
        self.customer = get_customer_by_id(customer_id)
        if not self.customer:
            messagebox.showerror("Error", "Customer not found")
            return

        # Load vehicle data if editing
        self.vehicle = None
        if vehicle_id:
            self.vehicle = get_vehicle_by_id(vehicle_id)
            title = f"Edit Vehicle: {self.vehicle['make']} {self.vehicle['model']}"
        else:
            title = f"Add Vehicle for {self.customer['name']}"

        # Create window
        self.window = create_form_window(parent, title)

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        """Set up the form UI"""
        # Vehicle data frame
        form_frame = create_form_frame(self.window)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Customer info
        create_label(form_frame,
                    f"Customer: {self.customer['name']}",
                    0, 0,
                    columnspan=2,
                    font=FONTS['normal_bold'],
                    pady=10)

        # Make
        create_label(form_frame, "Make:", 1, 0)
        self.make_entry = create_entry(form_frame, 1, 1)

        # Model
        create_label(form_frame, "Model:", 2, 0)
        self.model_entry = create_entry(form_frame, 2, 1)

        # Year
        create_label(form_frame, "Year:", 3, 0)
        self.year_entry = create_entry(form_frame, 3, 1)

        # VIN
        create_label(form_frame, "VIN:", 4, 0)
        self.vin_entry = create_entry(form_frame, 4, 1)

        # License Plate
        create_label(form_frame, "License Plate:", 5, 0)
        self.plate_entry = create_entry(form_frame, 5, 1)

        # Fill values if editing
        if self.vehicle:
            self.make_entry.insert(0, self.vehicle.get('make', ''))
            self.model_entry.insert(0, self.vehicle.get('model', ''))
            self.year_entry.insert(0, str(self.vehicle.get('year', '')))
            self.vin_entry.insert(0, self.vehicle.get('vin', ''))
            self.plate_entry.insert(0, self.vehicle.get('license_plate', ''))

        # Buttons frame
        buttons_frame = create_buttons_frame(form_frame, 6, 0)

        # Save button
        create_button(
            buttons_frame,
            "Save",
            self.save_vehicle,
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

    def save_vehicle(self):
        """Save the vehicle to the database"""
        # Get form values
        make = self.make_entry.get()
        model = self.model_entry.get()
        year = self.year_entry.get()
        vin = self.vin_entry.get()
        plate = self.plate_entry.get()

        # Validate
        if not make or not model:
            messagebox.showerror("Error", "Make and Model are required")
            return

        # Validate year if provided
        if year:
            try:
                year = int(year)
            except ValueError:
                messagebox.showerror("Error", "Year must be a number")
                return
        else:
            year = None

        # Prepare vehicle data
        vehicle_data = {
            'customer_id': self.customer_id,
            'make': make,
            'model': model,
            'year': year,
            'vin': vin,
            'license_plate': plate
        }

        if self.vehicle_id:
            # Update existing vehicle
            success = update_vehicle(self.vehicle_id, vehicle_data)
            if success:
                messagebox.showinfo("Success", "Vehicle details updated")
                self.window.destroy()
                if self.callback:
                    self.callback(self.vehicle_id)
            else:
                messagebox.showerror("Error", "Failed to update vehicle details")
        else:
            # Create new vehicle
            vehicle_id = create_vehicle(vehicle_data)
            if vehicle_id:
                messagebox.showinfo("Success", f"{make} {model} added successfully")
                self.window.destroy()

                # Ask if user wants to start a check-in
                if self.callback:
                    self.callback(vehicle_id)

                    # Import later to avoid circular imports
                    if messagebox.askyesno("Start Check-In",
                                           "Do you want to start a service check-in for this vehicle?"):
                        from ui.checkin_ui import CustomerCheckIn
                        CustomerCheckIn(self.parent, None, vehicle_id, lambda: None)
            else:
                messagebox.showerror("Error", "Failed to add vehicle")