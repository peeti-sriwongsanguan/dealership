# ui/customer_vehicle_selector.py
import tkinter as tk
from tkinter import messagebox
import os
from dotenv import load_dotenv
from database.vehicle_db import get_vehicles_by_customer

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class VehicleSelector:
    """Dialog for selecting a vehicle from a customer's vehicles"""

    def __init__(self, parent, customer_id, callback):
        """
        Initialize the vehicle selector

        Args:
            parent: The parent widget
            customer_id: ID of the customer whose vehicles to show
            callback: Function to call with selected vehicle_id
        """
        self.parent = parent
        self.customer_id = customer_id
        self.callback = callback

        # Get vehicles
        self.vehicles = get_vehicles_by_customer(customer_id)

        # Create window if vehicles exist
        if not self.vehicles:
            messagebox.showinfo("No Vehicles", "This customer has no vehicles.")
            callback(None)
            return

        # If only one vehicle, select it automatically
        if len(self.vehicles) == 1:
            callback(self.vehicles[0]['id'])
            return

        # Multiple vehicles - create selector
        self.window = tk.Toplevel(parent)
        self.window.title("Select Vehicle")
        self.window.geometry("400x300")
        self.window.configure(bg="#f0f0f0")

        self.setup_ui()

    def setup_ui(self):
        """Set up the UI"""
        # Create frame
        frame = tk.Frame(self.window, bg="#f0f0f0", padx=20, pady=20)
        frame.pack(fill=tk.BOTH, expand=True)

        # Instructions
        label = tk.Label(frame, text="Select a vehicle:",
                         font=("Arial", 12, "bold"), bg="#f0f0f0")
        label.pack(pady=10)

        # Vehicle listbox
        self.vehicle_listbox = tk.Listbox(frame, font=("Arial", 12), height=10)
        self.vehicle_listbox.pack(fill=tk.BOTH, expand=True, pady=10)

        # Add vehicles to listbox
        self.vehicle_map = {}  # Map listbox indices to vehicle IDs
        for i, vehicle in enumerate(self.vehicles):
            vehicle_text = f"{vehicle.get('year', '')} {vehicle['make']} {vehicle['model']}"
            if vehicle.get('license_plate'):
                vehicle_text += f" ({vehicle['license_plate']})"

            self.vehicle_listbox.insert(tk.END, vehicle_text)
            self.vehicle_map[i] = vehicle['id']

        # Add double-click binding
        self.vehicle_listbox.bind("<Double-1>", self.on_double_click)

        # Buttons
        button_frame = tk.Frame(frame, bg="#f0f0f0")
        button_frame.pack(fill=tk.X, pady=10)

        select_button = tk.Button(button_frame, text="Select", font=("Arial", 12, "bold"),
                                  bg="#4CAF50", fg="white", padx=10, command=self.on_select)
        select_button.pack(side=tk.LEFT, padx=10)

        cancel_button = tk.Button(button_frame, text="Cancel", font=("Arial", 12, "bold"),
                                  bg="#F44336", fg="white", padx=10, command=self.on_cancel)
        cancel_button.pack(side=tk.RIGHT, padx=10)

    def on_double_click(self, event):
        """Handle double-click on a listbox item"""
        self.on_select()

    def on_select(self):
        """Handle vehicle selection"""
        selected_index = self.vehicle_listbox.curselection()
        if not selected_index:
            messagebox.showinfo("Info", "Please select a vehicle")
            return

        vehicle_id = self.vehicle_map[selected_index[0]]
        self.window.destroy()
        self.callback(vehicle_id)

    def on_cancel(self):
        """Handle cancel button"""
        self.window.destroy()
        self.callback(None)