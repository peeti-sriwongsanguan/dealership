# ui/service/service_management.py
import tkinter as tk
from tkinter import ttk, messagebox
import os
from dotenv import load_dotenv
import sqlite3
from database.service_db import get_all_active_services, get_mechanic_services
from ui.service.service_status import ServiceStatusView
from ui.service.service_form import ServiceForm
from ui.service.service_actions import confirm_delete_service, get_service_status_color

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


class ServiceManagement:
    """Main service management screen"""

    def __init__(self, parent, user, callback, vehicle_id=None):
        """
        Initialize the service management screen

        Args:
            parent: The parent widget
            user: Current user information
            callback: Function to call when returning to main menu
            vehicle_id: Optional ID to filter services for a specific vehicle
        """
        self.parent = parent
        self.user = user
        self.callback = callback
        self.vehicle_id = vehicle_id
        self.filter_vehicle = vehicle_id is not None

        # Get vehicle info if filtering
        self.vehicle_info = None
        if self.filter_vehicle:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
            SELECT v.make, v.model, v.year, v.license_plate, c.name as customer_name
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
            """, (vehicle_id,))

            self.vehicle_info = dict(cursor.fetchone()) if cursor.fetchone() else None
            conn.close()

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        self.setup_ui()

    def setup_ui(self):
        """Set up the UI components"""
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_text = "Service Management"
        if self.filter_vehicle and self.vehicle_info:
            vehicle_text = f"{self.vehicle_info['make']} {self.vehicle_info['model']}"
            title_text = f"Services for {vehicle_text}"

        title_label = tk.Label(header_frame, text=title_text,
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Main content
        content_frame = tk.Frame(self.frame, bg="#f0f0f0", padx=20, pady=20)
        content_frame.pack(fill=tk.BOTH, expand=True)

        # Vehicle info for filtered view
        if self.filter_vehicle and self.vehicle_info:
            vehicle_frame = tk.Frame(content_frame, bg="#f0f0f0", padx=10, pady=10)
            vehicle_frame.pack(fill=tk.X)

            vehicle_text = f"{self.vehicle_info['year']} {self.vehicle_info['make']} {self.vehicle_info['model']}"
            if self.vehicle_info.get('license_plate'):
                vehicle_text += f" ({self.vehicle_info['license_plate']})"

            vehicle_label = tk.Label(vehicle_frame,
                                     text=f"Vehicle: {vehicle_text}\nCustomer: {self.vehicle_info['customer_name']}",
                                     font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
            vehicle_label.pack(side=tk.LEFT)

            # Add new service button
            add_button = tk.Button(vehicle_frame, text="Add New Service",
                                   font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                   command=self.add_service)
            add_button.pack(side=tk.RIGHT, padx=10)

        # Add filter controls if not filtering by vehicle
        if not self.filter_vehicle:
            filter_frame = tk.Frame(content_frame, bg="#f0f0f0")
            filter_frame.pack(fill=tk.X, pady=10)

            # Filter label
            filter_label = tk.Label(filter_frame, text="View:",
                                    font=("Arial", 12), bg="#f0f0f0")
            filter_label.pack(side=tk.LEFT, padx=5)

            # Filter options
            self.filter_var = tk.StringVar()
            self.filter_var.set("All Active Services")

            filter_options = ["All Active Services"]

            # Add "My Services" option for mechanics
            if self.user['role'] in ['mechanic', 'admin']:
                filter_options.append("My Assigned Services")

            # Status filter
            filter_options.extend(["Pending", "In Progress", "Awaiting Parts", "On Hold"])

            filter_dropdown = ttk.Combobox(filter_frame, textvariable=self.filter_var,
                                           values=filter_options, width=20)
            filter_dropdown.pack(side=tk.LEFT, padx=5)

            filter_button = tk.Button(filter_frame, text="Apply Filter",
                                      command=self.apply_filter)
            filter_button.pack(side=tk.LEFT, padx=5)

            # Search frame
            search_frame = tk.Frame(content_frame, bg="#f0f0f0")
            search_frame.pack(fill=tk.X, pady=10)

            search_label = tk.Label(search_frame, text="Search:",
                                    font=("Arial", 12), bg="#f0f0f0")
            search_label.pack(side=tk.LEFT, padx=5)

            self.search_entry = tk.Entry(search_frame, width=30)
            self.search_entry.pack(side=tk.LEFT, padx=5)

            search_button = tk.Button(search_frame, text="Search",
                                      command=self.search_services)
            search_button.pack(side=tk.LEFT, padx=5)

        # Services treeview frame
        tree_frame = tk.LabelFrame(content_frame, text="Services",
                                   font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # Services treeview
        columns = ["ID", "Customer", "Vehicle", "Type", "Status", "Date", "Mechanic"]
        if self.filter_vehicle:
            # Remove vehicle and customer columns when filtering
            columns = ["ID", "Type", "Status", "Date", "Mechanic", "Cost"]

        self.service_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)

        # Setup column headings
        for col in columns:
            self.service_tree.heading(col, text=col)

        # Setup column widths
        if self.filter_vehicle:
            self.service_tree.column("ID", width=40)
            self.service_tree.column("Type", width=120)
            self.service_tree.column("Status", width=100)
            self.service_tree.column("Date", width=80)
            self.service_tree.column("Mechanic", width=100)
            self.service_tree.column("Cost", width=70)
        else:
            self.service_tree.column("ID", width=40)
            self.service_tree.column("Customer", width=120)
            self.service_tree.column("Vehicle", width=150)
            self.service_tree.column("Type", width=100)
            self.service_tree.column("Status", width=100)
            self.service_tree.column("Date", width=80)
            self.service_tree.column("Mechanic", width=100)

        self.service_tree.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        self.service_tree.bind("<Double-1>", self.view_service_details)

        # Add color coding for status
        self.service_tree.tag_configure("pending", background="#FFF9C4")  # Light yellow
        self.service_tree.tag_configure("in_progress", background="#BBDEFB")  # Light blue
        self.service_tree.tag_configure("awaiting_parts", background="#FFE0B2")  # Light orange
        self.service_tree.tag_configure("on_hold", background="#E0E0E0")  # Light gray
        self.service_tree.tag_configure("completed", background="#C8E6C9")  # Light green
        self.service_tree.tag_configure("cancelled", background="#FFCDD2")  # Light red

        # Add scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical",
                                  command=self.service_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.service_tree.configure(yscrollcommand=scrollbar.set)

        # Action buttons
        buttons_frame = tk.Frame(content_frame, bg="#f0f0f0")
        buttons_frame.pack(fill=tk.X, pady=10)

        if not self.filter_vehicle:
            # Add service button (only when not filtering)
            add_button = tk.Button(buttons_frame, text="Add Service",
                                   font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                   command=self.add_service_prompt)
            add_button.pack(side=tk.LEFT, padx=10)

        # Update status button
        update_button = tk.Button(buttons_frame, text="Update Status",
                                  font=("Arial", 12), bg="#2196F3", fg="white",
                                  command=self.update_status)
        update_button.pack(side=tk.LEFT, padx=10)

        # View details button
        view_button = tk.Button(buttons_frame, text="View Details",
                                font=("Arial", 12), bg="#9C27B0", fg="white",
                                command=self.view_selected_service)
        view_button.pack(side=tk.LEFT, padx=10)

        # Delete button
        delete_button = tk.Button(buttons_frame, text="Delete Service",
                                  font=("Arial", 12), bg="#F44336", fg="white",
                                  command=self.delete_service)
        delete_button.pack(side=tk.RIGHT, padx=10)

        # Instructions
        instruction_label = tk.Label(content_frame, text="Double-click a service to view details",
                                     font=("Arial", 10), bg="#f0f0f0")
        instruction_label.pack(pady=5)

        # Load initial data
        self.load_services()

    def load_services(self):
        """Load services based on the current filter or vehicle"""
        # Clear existing data
        for i in self.service_tree.get_children():
            self.service_tree.delete(i)

        if self.filter_vehicle:
            # If filtering by vehicle, load services for that vehicle
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
            SELECT s.id, s.service_type, s.status, s.start_date, 
                   s.mechanic_id, u.username as mechanic_name, s.cost
            FROM services s
            LEFT JOIN users u ON s.mechanic_id = u.id
            WHERE s.vehicle_id = ?
            ORDER BY s.start_date DESC
            """, (self.vehicle_id,))

            services = [dict(row) for row in cursor.fetchall()]
            conn.close()

            # Insert into treeview
            for service in services:
                # Determine tag based on status
                tag = service['status'].lower().replace(' ', '_')

                # Format cost
                cost = f"${service['cost']:.2f}" if service['cost'] is not None else "N/A"

                self.service_tree.insert("", tk.END, values=(
                    service['id'],
                    service['service_type'],
                    service['status'],
                    service.get('start_date', ''),
                    service.get('mechanic_name', 'Unassigned'),
                    cost
                ), tags=(tag,))
        else:
            # If not filtering, use regular filters
            filter_option = self.filter_var.get()

            # Get services based on filter
            if filter_option == "My Assigned Services" and self.user['role'] in ['mechanic', 'admin']:
                services = get_mechanic_services(self.user['id'])
            elif filter_option in ["Pending", "In Progress", "Awaiting Parts", "On Hold"]:
                # Get services by status
                conn = sqlite3.connect(DB_PATH)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()

                cursor.execute("""
                SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
                       s.mechanic_id, s.start_date, s.estimated_completion, 
                       s.actual_completion, s.cost, u.username as mechanic_name,
                       v.make, v.model, v.year, v.license_plate, v.customer_id,
                       c.name as customer_name
                FROM services s
                LEFT JOIN users u ON s.mechanic_id = u.id
                JOIN vehicles v ON s.vehicle_id = v.id
                JOIN customers c ON v.customer_id = c.id
                WHERE s.status = ?
                ORDER BY s.start_date DESC
                """, (filter_option,))

                services = [dict(row) for row in cursor.fetchall()]

                conn.close()
            else:
                # All active services
                services = get_all_active_services()

            # Insert into treeview
            for service in services:
                # Format vehicle info
                vehicle_info = f"{service['year']} {service['make']} {service['model']}"
                if service.get('license_plate'):
                    vehicle_info += f" ({service['license_plate']})"

                # Determine tag based on status
                tag = service['status'].lower().replace(' ', '_')

                self.service_tree.insert("", tk.END, values=(
                    service['id'],
                    service['customer_name'],
                    vehicle_info,
                    service['service_type'],
                    service['status'],
                    service.get('start_date', ''),
                    service.get('mechanic_name', 'Unassigned')
                ), tags=(tag,))

    def apply_filter(self):
        """Apply the selected filter"""
        self.load_services()

    def search_services(self):
        """Search services by customer name, vehicle info, or service type"""
        search_term = self.search_entry.get().lower()

        if not search_term:
            self.load_services()
            return

        # Get all visible items
        all_items = self.service_tree.get_children()

        # Hide items that don't match
        for item in all_items:
            values = self.service_tree.item(item, 'values')

            # Check if search term is in any visible column
            if any(search_term in str(value).lower() for value in values):
                # Keep visible
                pass
            else:
                # Hide
                self.service_tree.detach(item)

    def add_service_prompt(self):
        """Prompt for vehicle selection to add a new service"""
        # First we need to get a vehicle id
        dialog = tk.Toplevel(self.parent)
        dialog.title("Select Vehicle for Service")
        dialog.geometry("400x200")
        dialog.configure(bg="#f0f0f0")

        frame = tk.Frame(dialog, bg="#f0f0f0", padx=20, pady=20)
        frame.pack(fill=tk.BOTH, expand=True)

        label = tk.Label(frame, text="Enter Vehicle ID or License Plate:",
                         font=("Arial", 12), bg="#f0f0f0")
        label.pack(pady=10)

        entry = tk.Entry(frame, font=("Arial", 12), width=20)
        entry.pack(pady=10)
        entry.focus_set()

        button_frame = tk.Frame(frame, bg="#f0f0f0")
        button_frame.pack(fill=tk.X, pady=10)

        def search_vehicle():
            search_term = entry.get().strip()
            if not search_term:
                messagebox.showinfo("Info", "Please enter a Vehicle ID or License Plate")
                return

            # Search for the vehicle
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Try to find by ID
            try:
                vehicle_id = int(search_term)
                cursor.execute("SELECT id FROM vehicles WHERE id = ?", (vehicle_id,))
                result = cursor.fetchone()

                if result:
                    conn.close()
                    dialog.destroy()
                    self.add_service(result['id'])
                    return
            except:
                pass

            # Try to find by license plate
            cursor.execute("SELECT id FROM vehicles WHERE license_plate = ?", (search_term,))
            result = cursor.fetchone()

            if result:
                conn.close()
                dialog.destroy()
                self.add_service(result['id'])
            else:
                messagebox.showinfo("Not Found", "No vehicle found with that ID or License Plate")

            conn.close()

        search_button = tk.Button(button_frame, text="Search", font=("Arial", 12, "bold"),
                                  bg="#4CAF50", fg="white", padx=10, command=search_vehicle)
        search_button.pack(side=tk.LEFT, padx=10)

        cancel_button = tk.Button(button_frame, text="Cancel", font=("Arial", 12, "bold"),
                                  bg="#F44336", fg="white", padx=10, command=dialog.destroy)
        cancel_button.pack(side=tk.RIGHT, padx=10)

        # Bind Enter key to search
        entry.bind("<Return>", lambda event: search_vehicle())

    def add_service(self, vehicle_id=None):
        """Show form to add a new service"""
        # If no vehicle_id provided, use the filtered vehicle
        if vehicle_id is None and self.filter_vehicle:
            vehicle_id = self.vehicle_id

        if not vehicle_id:
            messagebox.showinfo("Info", "No vehicle selected")
            return

        # Create the service form
        ServiceForm(
            self.parent,
            vehicle_id,
            lambda service_id: self.after_service_added(service_id),
            None,
            self.user
        )

    def after_service_added(self, service_id):
        """Handle after a service is added"""
        if service_id:
            self.load_services()

            # Offer to view the service details
            if messagebox.askyesno("View Service", "Service added successfully. Would you like to view the details?"):
                self.view_service_details_by_id(service_id)

    def update_status(self):
        """Update the status of the selected service"""
        service_id = self.get_selected_service_id()
        if service_id:
            self.view_service_details_by_id(service_id)

    def view_selected_service(self):
        """View details of the selected service"""
        service_id = self.get_selected_service_id()
        if service_id:
            self.view_service_details_by_id(service_id)

    def delete_service(self):
        """Delete the selected service"""
        service_id = self.get_selected_service_id()
        if service_id:
            confirm_delete_service(self.parent, service_id, self.load_services)

    def view_service_details(self, event):
        """View details of a service (double-click handler)"""
        selected_item = self.service_tree.selection()
        if not selected_item:
            return

        # Get service ID
        service_id = self.service_tree.item(selected_item[0], 'values')[0]

        # Show service details
        self.view_service_details_by_id(service_id)

    def view_service_details_by_id(self, service_id):
        """Show the service details screen for a specific service ID"""
        # Hide current frame
        self.frame.pack_forget()

        # Show service details screen
        ServiceStatusView(self.parent, self.user, service_id, self.show_service_management)

    def get_selected_service_id(self):
        """Get the ID of the selected service"""
        selected_item = self.service_tree.selection()
        if not selected_item:
            messagebox.showinfo("Info", "Please select a service")
            return None

        service_id = self.service_tree.item(selected_item[0], 'values')[0]
        return service_id

    def on_back(self):
        """Return to the main menu or previous screen"""
        self.destroy()
        self.callback()

    def show_service_management(self):
        """Show the service management screen again"""
        self.frame.pack(fill=tk.BOTH, expand=True)
        self.load_services()

    def destroy(self):
        """Clean up resources"""
        self.frame.destroy()