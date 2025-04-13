# ui/service/service_form.py
import tkinter as tk
from tkinter import ttk, messagebox
import os
import datetime
from dotenv import load_dotenv
from database.service_db import create_service, update_service, get_service_by_id
from database.vehicle_db import get_vehicle_by_id

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

        # Create window
        self.window = tk.Toplevel(parent)

        # Set window title
        if service_id:
            self.service = get_service_by_id(service_id)
            if not self.service:
                messagebox.showerror("Error", "Service not found")
                self.window.destroy()
                return
            self.window.title(f"Edit Service for {self.vehicle['make']} {self.vehicle['model']}")
        else:
            self.service = None
            self.window.title(f"New Service for {self.vehicle['make']} {self.vehicle['model']}")

        self.window.geometry("500x550")
        self.window.configure(bg="#f0f0f0")

        # Get mechanics list
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

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

        service_types = [row[0] for row in cursor.fetchall()]
        if not service_types:
            service_types = ["Maintenance", "Repair", "Diagnosis", "Warranty Work", "Other"]

        conn.close()

        # Setup UI
        self.setup_ui(service_types)

    def setup_ui(self, service_types):
        """Set up the form UI"""
        # Service data frame
        form_frame = tk.Frame(self.window, bg="#f0f0f0", padx=20, pady=20)
        form_frame.pack(fill=tk.BOTH, expand=True)

        # Vehicle and customer info
        vehicle_info = f"{self.vehicle['year']} {self.vehicle['make']} {self.vehicle['model']}"
        if self.vehicle['license_plate']:
            vehicle_info += f" ({self.vehicle['license_plate']})"

        info_label = tk.Label(form_frame,
                              text=f"Vehicle: {vehicle_info}\nCustomer: {self.vehicle['customer_name']}",
                              font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        info_label.grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=10)

        # Service Type
        type_label = tk.Label(form_frame, text="Service Type:", font=("Arial", 12), bg="#f0f0f0")
        type_label.grid(row=1, column=0, sticky=tk.W, pady=5)

        self.service_type_var = tk.StringVar()

        # Allow custom types by using Combobox
        self.type_entry = ttk.Combobox(form_frame, textvariable=self.service_type_var,
                                       values=service_types, width=28)
        self.type_entry.grid(row=1, column=1, pady=5, padx=5, sticky=tk.W)

        # Description
        desc_label = tk.Label(form_frame, text="Description:", font=("Arial", 12), bg="#f0f0f0")
        desc_label.grid(row=2, column=0, sticky=tk.W, pady=5)
        self.desc_text = tk.Text(form_frame, font=("Arial", 12), width=30, height=4)
        self.desc_text.grid(row=2, column=1, pady=5, padx=5, sticky=tk.W)

        # Status
        status_label = tk.Label(form_frame, text="Status:", font=("Arial", 12), bg="#f0f0f0")
        status_label.grid(row=3, column=0, sticky=tk.W, pady=5)

        statuses = ["Pending", "In Progress", "Awaiting Parts", "On Hold", "Completed", "Cancelled"]
        self.status_var = tk.StringVar()
        self.status_var.set(statuses[0])  # Default to pending

        status_dropdown = ttk.Combobox(form_frame, textvariable=self.status_var,
                                       values=statuses, width=28)
        status_dropdown.grid(row=3, column=1, pady=5, padx=5, sticky=tk.W)

        # Mechanic assignment
        mech_label = tk.Label(form_frame, text="Assign To:", font=("Arial", 12), bg="#f0f0f0")
        mech_label.grid(row=4, column=0, sticky=tk.W, pady=5)

        self.mechanic_var = tk.StringVar()

        # Create map of mechanic names to IDs
        self.mechanic_names = []
        self.mechanic_id_map = {}

        for mech_id, mech_name in self.mechanics:
            self.mechanic_names.append(mech_name)
            self.mechanic_id_map[mech_name] = mech_id

        # Default to current user if they're a mechanic
        if self.user and self.user['role'] in ['mechanic', 'admin'] and self.mechanic_names:
            self.mechanic_var.set(self.user['username'])
        elif self.mechanic_names:
            self.mechanic_var.set(self.mechanic_names[0])

        mech_dropdown = ttk.Combobox(form_frame, textvariable=self.mechanic_var,
                                     values=self.mechanic_names, width=28)
        mech_dropdown.grid(row=4, column=1, pady=5, padx=5, sticky=tk.W)

        # Estimated completion
        est_label = tk.Label(form_frame, text="Est. Completion:", font=("Arial", 12), bg="#f0f0f0")
        est_label.grid(row=5, column=0, sticky=tk.W, pady=5)

        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        self.est_date = tk.StringVar()
        self.est_date.set(tomorrow.strftime("%Y-%m-%d"))

        est_entry = tk.Entry(form_frame, font=("Arial", 12), width=30,
                             textvariable=self.est_date)
        est_entry.grid(row=5, column=1, pady=5, padx=5, sticky=tk.W)

        # Cost estimate
        cost_label = tk.Label(form_frame, text="Cost Estimate ($):", font=("Arial", 12), bg="#f0f0f0")
        cost_label.grid(row=6, column=0, sticky=tk.W, pady=5)

        self.cost_var = tk.StringVar()
        self.cost_var.set("0.00")

        cost_entry = tk.Entry(form_frame, font=("Arial", 12), width=30,
                              textvariable=self.cost_var)
        cost_entry.grid(row=6, column=1, pady=5, padx=5, sticky=tk.W)

        # Check-in notes (for new services)
        if not self.service_id:
            notes_label = tk.Label(form_frame, text="Check-in Notes:", font=("Arial", 12), bg="#f0f0f0")
            notes_label.grid(row=7, column=0, sticky=tk.W, pady=5)
            self.notes_text = tk.Text(form_frame, font=("Arial", 12), width=30, height=4)
            self.notes_text.grid(row=7, column=1, pady=5, padx=5, sticky=tk.W)

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
        buttons_frame = tk.Frame(form_frame, bg="#f0f0f0")
        buttons_frame.grid(row=8, column=0, columnspan=2, pady=20)

        # Save button
        save_button = tk.Button(buttons_frame, text="Save", font=("Arial", 12, "bold"),
                                bg="#4CAF50", fg="white", padx=10, command=self.save_service)
        save_button.grid(row=0, column=0, padx=10)

        # Cancel button
        cancel_button = tk.Button(buttons_frame, text="Cancel", font=("Arial", 12, "bold"),
                                  bg="#F44336", fg="white", padx=10, command=self.window.destroy)
        cancel_button.grid(row=0, column=1, padx=10)

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