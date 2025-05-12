# ui/service/service_form.py
import tkinter as tk
from tkinter import ttk, messagebox
import os
import datetime
from dotenv import load_dotenv
from database.service_db import create_service, update_service, get_service_by_id
from database.vehicle_db import get_vehicle_by_id
from ui.ui_utils import (create_form_window, create_form_frame, create_label,
                         create_entry, create_text_area, create_combobox,
                         create_buttons_frame, create_button, create_info_section)

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class ServiceForm:
    """Form for creating or editing service records"""

    def __init__(self, parent, vehicle_id, callback, service_id=None, user=None):
        """
        Initialize the service form

        Args:
            parent: The parent widget
            vehicle_id: ID of the vehicle for this service
            callback: Function to call after save
            service_id: ID of service to edit, or None for new service
            user: Current user information (optional)
        """
        self.parent = parent
        self.vehicle_id = vehicle_id
        self.callback = callback
        self.service_id = service_id
        self.user = user

        # Get vehicle info
        self.vehicle = get_vehicle_by_id(vehicle_id)
        if not self.vehicle:
            messagebox.showerror("Error", "Vehicle not found")
            return

        # Get service info if editing
        if service_id:
            self.service = get_service_by_id(service_id)
            if not self.service:
                messagebox.showerror("Error", "Service not found")
                return
            title = f"Edit Service for {self.vehicle['make']} {self.vehicle['model']}"
        else:
            self.service = None
            title = f"New Service for {self.vehicle['make']} {self.vehicle['model']}"

        # Create window
        self.window = create_form_window(parent, title, height=550)

        # Fetch data from database
        self.fetch_data()

        # Setup UI
        self.setup_ui()

    def fetch_data(self):
        """Fetch necessary data from the database"""
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get mechanics list
        cursor.execute("""
        SELECT id, username FROM users 
        WHERE role = 'mechanic' OR role = 'admin'
        ORDER BY username
        """)

        self.mechanics = cursor.fetchall()

        # Get common service types
        cursor.execute("""
        SELECT DISTINCT service_type FROM services
        ORDER BY service_type
        """)

        self.service_types = [row[0] for row in cursor.fetchall()]
        if not self.service_types:
            self.service_types = ["Maintenance", "Repair", "Diagnosis", "Warranty Work", "Other"]

        conn.close()

        # Create map of mechanic names to IDs
        self.mechanic_names = []
        self.mechanic_id_map = {}

        for mech_id, mech_name in self.mechanics:
            self.mechanic_names.append(mech_name)
            self.mechanic_id_map[mech_name] = mech_id

    def setup_ui(self):
        """Set up the form UI"""
        # Service data frame
        form_frame = create_form_frame(self.window)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Vehicle and customer info
        vehicle_info = f"{self.vehicle['year']} {self.vehicle['make']} {self.vehicle['model']}"
        if self.vehicle['license_plate']:
            vehicle_info += f" ({self.vehicle['license_plate']})"

        info_text = f"Vehicle: {vehicle_info}\nCustomer: {self.vehicle['customer_name']}"
        create_info_section(form_frame, info_text, 0, 0)

        # Service Type
        create_label(form_frame, "Service Type:", 1, 0)
        self.service_type_var = tk.StringVar()
        self.type_entry = create_combobox(
            form_frame, 1, 1,
            values=self.service_types,
            textvariable=self.service_type_var
        )

        # Description
        create_label(form_frame, "Description:", 2, 0)
        self.desc_text = create_text_area(form_frame, 2, 1)

        # Status
        create_label(form_frame, "Status:", 3, 0)
        statuses = ["Pending", "In Progress", "Awaiting Parts", "On Hold", "Completed", "Cancelled"]
        self.status_var = tk.StringVar()
        self.status_var.set(statuses[0])  # Default to pending
        create_combobox(
            form_frame, 3, 1,
            values=statuses,
            textvariable=self.status_var
        )

        # Mechanic assignment
        create_label(form_frame, "Assign To:", 4, 0)
        self.mechanic_var = tk.StringVar()

        # Default to current user if they're a mechanic
        if self.user and self.user['role'] in ['mechanic', 'admin'] and self.mechanic_names:
            self.mechanic_var.set(self.user['username'])
        elif self.mechanic_names:
            self.mechanic_var.set(self.mechanic_names[0])

        create_combobox(
            form_frame, 4, 1,
            values=self.mechanic_names,
            textvariable=self.mechanic_var
        )

        # Estimated completion
        create_label(form_frame, "Est. Completion:", 5, 0)
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        self.est_date = tk.StringVar()
        self.est_date.set(tomorrow.strftime("%Y-%m-%d"))
        create_entry(form_frame, 5, 1, textvariable=self.est_date)

        # Cost estimate
        create_label(form_frame, "Cost Estimate ($):", 6, 0)
        self.cost_var = tk.StringVar()
        self.cost_var.set("0.00")
        create_entry(form_frame, 6, 1, textvariable=self.cost_var)

        # Check-in notes (for new services)
        if not self.service_id:
            create_label(form_frame, "Check-in Notes:", 7, 0)
            self.notes_text = create_text_area(form_frame, 7, 1)

        # Fill values if editing
        if self.service:
            self.service_type_var.set(self.service.get('service_type', ''))
            self.desc_text.insert("1.0", self.service.get('description', ''))
            self.status_var.set(self.service.get('status', 'Pending'))

            # Set mechanic if assigned
            if self.service.get('mechanic_name'):
                self.mechanic_var.set(self.service['mechanic_name'])

            # Set dates and cost
            if self.service.get('estimated_completion'):
                self.est_date.set(self.service['estimated_completion'])

            if self.service.get('cost') is not None:
                self.cost_var.set(f"{self.service['cost']:.2f}")

        # Buttons frame
        buttons_frame = create_buttons_frame(form_frame, 8, 0)

        # Save button
        create_button(
            buttons_frame,
            "Save",
            self.save_service,
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

    def save_service(self):
        """Save the service to the database"""
        try:
            # Get form values
            service_type = self.service_type_var.get()
            description = self.desc_text.get("1.0", tk.END).strip()
            status = self.status_var.get()
            mechanic_name = self.mechanic_var.get()
            estimated_completion = self.est_date.get()

            # Get check-in notes if new service
            check_in_notes = ""
            if not self.service_id and hasattr(self, 'notes_text'):
                check_in_notes = self.notes_text.get("1.0", tk.END).strip()

            # Parse cost
            try:
                cost = float(self.cost_var.get())
            except ValueError:
                cost = 0.0

            # Get mechanic ID
            mechanic_id = self.mechanic_id_map.get(mechanic_name)

            # Validate
            if not service_type:
                messagebox.showerror("Error", "Service type is required")
                return

            # Create service data
            service_data = {
                'vehicle_id': self.vehicle_id,
                'service_type': service_type,
                'description': description,
                'status': status,
                'mechanic_id': mechanic_id,
                'estimated_completion': estimated_completion,
                'cost': cost,
                'check_in_notes': check_in_notes
            }

            # Set actual completion date if status is Completed
            if status == "Completed":
                service_data['actual_completion'] = datetime.datetime.now().strftime("%Y-%m-%d")

            if self.service_id:
                # Update existing service
                success = update_service(self.service_id, service_data)
                if success:
                    messagebox.showinfo("Success", "Service updated successfully")
                    self.window.destroy()
                    if self.callback:
                        self.callback(self.service_id)
                else:
                    messagebox.showerror("Error", "Failed to update service")
            else:
                # Set start date for new services
                service_data['start_date'] = datetime.datetime.now().strftime("%Y-%m-%d")

                # Create new service
                service_id = create_service(service_data)
                if service_id:
                    messagebox.showinfo("Success", "Service created successfully")
                    self.window.destroy()
                    if self.callback:
                        self.callback(service_id)
                else:
                    messagebox.showerror("Error", "Failed to create service")

        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {str(e)}")