# ui/vehicle/vehicle_management.py

import tkinter as tk
from tkinter import ttk, messagebox
import os
from dotenv import load_dotenv
from database.customer_db import get_customer_by_id
from database.vehicle_db import get_vehicles_by_customer, get_vehicle_by_id
from database.service_db import get_services_by_vehicle
from ui.vehicle.vehicle_form import VehicleForm
from ui.vehicle.vehicle_actions import (
    view_vehicle_photos,
    start_vehicle_checkin,
    confirm_delete_vehicle,
    view_vehicle_services
)

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class VehicleManagement:
    """Vehicle management screen for a specific customer"""

    def __init__(self, parent, user, customer_id, callback):
        """
        Initialize the vehicle management screen

        Args:
            parent: The parent widget
            user: Current user information
            customer_id: ID of the customer whose vehicles to manage
            callback: Function to call when returning to previous screen
        """
        self.parent = parent
        self.user = user
        self.customer_id = customer_id
        self.callback = callback

        # Get customer info
        self.customer = get_customer_by_id(customer_id)
        if not self.customer:
            messagebox.showerror("Error", "Customer not found")
            self.callback()
            return

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.setup_ui()

    def setup_ui(self):
        """Set up the UI components"""
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text=f"Vehicles for {self.customer['name']}",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Main content - split into left (vehicles) and right (services) panes
        content_frame = tk.Frame(self.frame, bg="#f0f0f0", padx=20, pady=20)
        content_frame.pack(fill=tk.BOTH, expand=True)

        # Left pane - Vehicles list
        vehicles_frame = tk.LabelFrame(content_frame, text="Vehicles",
                                       font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        vehicles_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        # Vehicles treeview
        self.vehicle_tree = ttk.Treeview(vehicles_frame,
                                         columns=("ID", "Make", "Model", "Year", "Plate"),
                                         show="headings", height=10)
        self.vehicle_tree.heading("ID", text="ID")
        self.vehicle_tree.heading("Make", text="Make")
        self.vehicle_tree.heading("Model", text="Model")
        self.vehicle_tree.heading("Year", text="Year")
        self.vehicle_tree.heading("Plate", text="License")

        self.vehicle_tree.column("ID", width=40)
        self.vehicle_tree.column("Make", width=100)
        self.vehicle_tree.column("Model", width=100)
        self.vehicle_tree.column("Year", width=60)
        self.vehicle_tree.column("Plate", width=80)

        self.vehicle_tree.pack(fill=tk.BOTH, expand=True, pady=5)
        self.vehicle_tree.bind("<ButtonRelease-1>", self.on_vehicle_select)

        # Add scrollbar
        vehicle_scrollbar = ttk.Scrollbar(vehicles_frame, orient="vertical",
                                          command=self.vehicle_tree.yview)
        vehicle_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.vehicle_tree.configure(yscrollcommand=vehicle_scrollbar.set)

        # Vehicle buttons frame
        vehicle_buttons = tk.Frame(vehicles_frame, bg="#f0f0f0")
        vehicle_buttons.pack(fill=tk.X, pady=10)

        add_button = tk.Button(vehicle_buttons, text="Add Vehicle",
                               font=("Arial", 10, "bold"), bg="#4CAF50", fg="white",
                               command=self.add_vehicle)
        add_button.pack(side=tk.LEFT, padx=5)

        edit_button = tk.Button(vehicle_buttons, text="Edit Vehicle",
                                font=("Arial", 10, "bold"), bg="#2196F3", fg="white",
                                command=self.edit_vehicle)
        edit_button.pack(side=tk.LEFT, padx=5)

        delete_button = tk.Button(vehicle_buttons, text="Delete Vehicle",
                                  font=("Arial", 10, "bold"), bg="#F44336", fg="white",
                                  command=self.delete_vehicle)
        delete_button.pack(side=tk.LEFT, padx=5)

        photos_button = tk.Button(vehicle_buttons, text="View Photos",
                                  font=("Arial", 10, "bold"), bg="#00BCD4", fg="white",
                                  command=self.view_photos)
        photos_button.pack(side=tk.RIGHT, padx=5)

        checkin_button = tk.Button(vehicle_buttons, text="New Check-In",
                                   font=("Arial", 10, "bold"), bg="#9C27B0", fg="white",
                                   command=self.new_checkin)
        checkin_button.pack(side=tk.RIGHT, padx=5)

        # Right pane - Services
        services_frame = tk.LabelFrame(content_frame, text="Service History",
                                       font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        services_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        # Services treeview
        self.service_tree = ttk.Treeview(services_frame,
                                         columns=("ID", "Type", "Date", "Status", "Cost"),
                                         show="headings", height=10)
        self.service_tree.heading("ID", text="ID")
        self.service_tree.heading("Type", text="Type")
        self.service_tree.heading("Date", text="Date")
        self.service_tree.heading("Status", text="Status")
        self.service_tree.heading("Cost", text="Cost")

        self.service_tree.column("ID", width=40)
        self.service_tree.column("Type", width=100)
        self.service_tree.column("Date", width=80)
        self.service_tree.column("Status", width=80)
        self.service_tree.column("Cost", width=60)

        self.service_tree.pack(fill=tk.BOTH, expand=True, pady=5)
        self.service_tree.bind("<Double-1>", self.view_service)

        # Add scrollbar
        service_scrollbar = ttk.Scrollbar(services_frame, orient="vertical",
                                          command=self.service_tree.yview)
        service_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.service_tree.configure(yscrollcommand=service_scrollbar.set)

        # Service instruction label
        instruction_label = tk.Label(services_frame,
                                     text="Double-click a service to view details",
                                     font=("Arial", 10), bg="#f0f0f0")
        instruction_label.pack(pady=5)

        # Load vehicles
        self.load_vehicles()

    def load_vehicles(self):
        """Load vehicles for the customer"""
        # Clear existing data
        for i in self.vehicle_tree.get_children():
            self.vehicle_tree.delete(i)

        # Get vehicles
        vehicles = get_vehicles_by_customer(self.customer_id)

        # Insert into treeview
        for vehicle in vehicles:
            self.vehicle_tree.insert("", tk.END, values=(
                vehicle['id'],
                vehicle['make'],
                vehicle['model'],
                vehicle.get('year', ''),
                vehicle.get('license_plate', '')
            ))

        # Clear services
        for i in self.service_tree.get_children():
            self.service_tree.delete(i)

    def on_vehicle_select(self, event):
        """Handle vehicle selection"""
        selected_item = self.vehicle_tree.selection()
        if not selected_item:
            return

        # Get vehicle ID
        vehicle_id = self.vehicle_tree.item(selected_item[0], 'values')[0]

        # Load services for this vehicle
        self.load_services(vehicle_id)

    def load_services(self, vehicle_id):
        """Load services for a vehicle"""
        # Clear existing data
        for i in self.service_tree.get_children():
            self.service_tree.delete(i)

        # Get services
        services = get_services_by_vehicle(vehicle_id)

        # Insert into treeview
        for service in services:
            # Format cost as currency
            cost = f"${service.get('cost', 0):.2f}" if service.get('cost') is not None else "N/A"

            self.service_tree.insert("", tk.END, values=(
                service['id'],
                service['service_type'],
                service.get('start_date', ''),
                service['status'],
                cost
            ))

    def add_vehicle(self):
        """Show form to add a new vehicle"""
        VehicleForm(
            self.parent,
            self.customer_id,
            lambda _: self.load_vehicles()
        )

    def edit_vehicle(self):
        """Show form to edit an existing vehicle"""
        vehicle_id = self.get_selected_vehicle_id()
        if vehicle_id:
            VehicleForm(
                self.parent,
                self.customer_id,
                lambda _: self.load_vehicles(),
                vehicle_id
            )

    def delete_vehicle(self):
        """Delete a vehicle and all related services"""
        vehicle_id = self.get_selected_vehicle_id()
        if vehicle_id:
            confirm_delete_vehicle(
                self.parent,
                vehicle_id,
                self.load_vehicles
            )

    def new_checkin(self):
        """Start a new check-in for the selected vehicle"""
        vehicle_id = self.get_selected_vehicle_id()
        if vehicle_id:
            self.frame.pack_forget()
            start_vehicle_checkin(
                self.parent,
                self.user,
                vehicle_id,
                self.show_vehicle_management
            )

    def view_photos(self):
        """View photos for the selected vehicle"""
        vehicle_id = self.get_selected_vehicle_id()
        if vehicle_id:
            view_vehicle_photos(self.parent, vehicle_id)

    def view_service(self, event):
        """View details of a service"""
        selected_item = self.service_tree.selection()
        if not selected_item:
            return

        # Get service ID
        service_id = self.service_tree.item(selected_item[0], 'values')[0]

        # Show service details
        self.show_service_details(service_id)

    def show_service_details(self, service_id):
        """Show the service details screen"""
        # Hide current frame
        self.frame.pack_forget()

        # Import here to avoid circular imports
        from ui.service_status import ServiceStatusView

        # Show service details screen
        ServiceStatusView(self.parent, self.user, service_id, self.show_vehicle_management)

    def get_selected_vehicle_id(self):
        """Get the ID of the selected vehicle"""
        selected_item = self.vehicle_tree.selection()
        if not selected_item:
            messagebox.showinfo("Info", "Please select a vehicle")
            return None

        vehicle_id = self.vehicle_tree.item(selected_item[0], 'values')[0]
        return vehicle_id

    def on_back(self):
        """Return to the previous screen"""
        self.destroy()
        self.callback()

    def show_vehicle_management(self):
        """Show the vehicle management screen again"""
        self.frame.pack(fill=tk.BOTH, expand=True)
        self.load_vehicles()

    def destroy(self):
        """Clean up resources"""
        self.frame.destroy()