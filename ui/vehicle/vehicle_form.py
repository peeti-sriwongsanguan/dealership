#ui/vehicle/vehicle_form.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.vehicle_db import create_vehicle, update_vehicle, get_vehicle_by_id
from database.customer_db import get_customer_by_id

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

        # Create window
        self.window = tk.Toplevel(parent)

        # Load vehicle data if editing
        self.vehicle = None
        if vehicle_id:
            self.vehicle = get_vehicle_by_id(vehicle_id)
            self.window.title(f"Edit Vehicle: {self.vehicle['make']} {self.vehicle['model']}")
        else:
            self.window.title(f"Add Vehicle for {self.customer['name']}")

        self.window.geometry("500x400")
        self.window.configure(bg="#f0f0f0")

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        """Set up the form UI"""
        # Vehicle data frame
        form_frame = tk.Frame(self.window, bg="#f0f0f0", padx=20, pady=20)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Customer info
        customer_label = tk.Label(form_frame,
                                  text=f"Customer: {self.customer['name']}",
                                  font=("Arial", 12, "bold"), bg="#f0f0f0")
        customer_label.grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=10)

        # Make
        make_label = tk.Label(form_frame, text="Make:", font=("Arial", 12), bg="#f0f0f0")
        make_label.grid(row=1, column=0, sticky=tk.W, pady=5)
        self.make_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.make_entry.grid(row=1, column=1, pady=5, padx=5, sticky=tk.W)

        # Model
        model_label = tk.Label(form_frame, text="Model:", font=("Arial", 12), bg="#f0f0f0")
        model_label.grid(row=2, column=0, sticky=tk.W, pady=5)
        self.model_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.model_entry.grid(row=2, column=1, pady=5, padx=5, sticky=tk.W)

        # Year
        year_label = tk.Label(form_frame, text="Year:", font=("Arial", 12), bg="#f0f0f0")
        year_label.grid(row=3, column=0, sticky=tk.W, pady=5)
        self.year_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.year_entry.grid(row=3, column=1, pady=5, padx=5, sticky=tk.W)

        # VIN
        vin_label = tk.Label(form_frame, text="VIN:", font=("Arial", 12), bg="#f0f0f0")
        vin_label.grid(row=4, column=0, sticky=tk.W, pady=5)
        self.vin_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.vin_entry.grid(row=4, column=1, pady=5, padx=5, sticky=tk.W)

        # License Plate
        plate_label = tk.Label(form_frame, text="License Plate:", font=("Arial", 12), bg="#f0f0f0")
        plate_label.grid(row=5, column=0, sticky=tk.W, pady=5)
        self.plate_entry = tk.Entry(form_frame, font=("Arial", 12), width=30)
        self.plate_entry.grid(row=5, column=1, pady=5, padx=5, sticky=tk.W)

        # Fill values if editing
        if self.vehicle:
            self.make_entry.insert(0, self.vehicle.get('make', ''))
            self.model_entry.insert(0, self.vehicle.get('model', ''))
            self.year_entry.insert(0, str(self.vehicle.get('year', '')))
            self.vin_entry.insert(0, self.vehicle.get('vin', ''))
            self.plate_entry.insert(0, self.vehicle.get('license_plate', ''))

        # Buttons frame
        buttons_frame = tk.Frame(form_frame, bg="#f0f0f0")
        buttons_frame.grid(row=6, column=0, columnspan=2, pady=20)

        # Save button
        save_button = tk.Button(buttons_frame, text="Save", font=("Arial", 12, "bold"),
                                bg="#4CAF50", fg="white", padx=10, command=self.save_vehicle)
        save_button.grid(row=0, column=0, padx=10)

        # Cancel button
        cancel_button = tk.Button(buttons_frame, text="Cancel", font=("Arial", 12, "bold"),
                                  bg="#F44336", fg="white", padx=10, command=self.window.destroy)
        cancel_button.grid(row=0, column=1, padx=10)

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