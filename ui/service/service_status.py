# ui/service/service_status.py
import tkinter as tk
from tkinter import ttk, messagebox
import os
from PIL import Image, ImageTk
from dotenv import load_dotenv
from database.service_db import get_service_by_id
from database.photo_db import get_photos_for_service
from ui.service.service_actions import update_service_status, get_service_status_color

# Load environment variables
load_dotenv()

# Get database path and photos directory from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')


class ServiceStatusView:
    """View for displaying and updating service status"""

    def __init__(self, parent, user, service_id, callback):
        """
        Initialize the service status view

        Args:
            parent: The parent widget
            user: Current user information
            service_id: ID of the service to display
            callback: Function to call when returning to previous screen
        """
        self.parent = parent
        self.user = user
        self.service_id = service_id
        self.callback = callback

        # Load service data
        self.service = get_service_by_id(service_id)
        if not self.service:
            messagebox.showerror("Error", "Service not found")
            self.callback()
            return

        # Load photos
        self.photos = get_photos_for_service(service_id)

        self.frame = tk.Frame(parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        """Set up the UI components"""
        # Header frame
        header_frame = tk.Frame(self.frame, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text="Service Status",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Main content frame - split into top and bottom sections
        content_frame = tk.Frame(self.frame, bg="#f0f0f0")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Top section - Service and vehicle info
        top_frame = tk.Frame(content_frame, bg="#f0f0f0")
        top_frame.pack(fill=tk.X, pady=10)

        # Vehicle info
        vehicle_frame = tk.LabelFrame(top_frame, text="Vehicle Information",
                                      font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        vehicle_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        # Format vehicle info
        vehicle_info = f"{self.service.get('year', '')} {self.service['make']} {self.service['model']}"
        if self.service.get('license_plate'):
            vehicle_info += f"\nLicense: {self.service['license_plate']}"

        vehicle_label = tk.Label(vehicle_frame, text=vehicle_info,
                                 font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        vehicle_label.pack(anchor=tk.W)

        customer_label = tk.Label(vehicle_frame, text=f"Customer: {self.service['customer_name']}",
                                  font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        customer_label.pack(anchor=tk.W, pady=5)

        # Service info
        service_frame = tk.LabelFrame(top_frame, text="Service Information",
                                      font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        service_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        service_type_label = tk.Label(service_frame, text=f"Type: {self.service['service_type']}",
                                      font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        service_type_label.pack(anchor=tk.W)

        # Status with color indicator
        status_frame = tk.Frame(service_frame, bg="#f0f0f0")
        status_frame.pack(anchor=tk.W, fill=tk.X, pady=5)

        status_label = tk.Label(status_frame, text="Status: ",
                                font=("Arial", 12), bg="#f0f0f0")
        status_label.pack(side=tk.LEFT)

        status_color = get_service_status_color(self.service['status'])
        status_indicator = tk.Canvas(status_frame, width=15, height=15, bg=status_color,
                                     highlightthickness=0)
        status_indicator.pack(side=tk.LEFT, padx=5)

        status_value = tk.Label(status_frame, text=self.service['status'],
                                font=("Arial", 12, "bold"), bg="#f0f0f0")
        status_value.pack(side=tk.LEFT)

        # Mechanic
        mechanic_label = tk.Label(service_frame,
                                  text=f"Assigned to: {self.service.get('mechanic_name', 'Unassigned')}",
                                  font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        mechanic_label.pack(anchor=tk.W, pady=5)

        # Dates
        dates_frame = tk.Frame(service_frame, bg="#f0f0f0")
        dates_frame.pack(fill=tk.X, pady=5, anchor=tk.W)

        start_date = self.service.get('start_date', 'N/A')
        est_date = self.service.get('estimated_completion', 'N/A')

        dates_label = tk.Label(dates_frame,
                               text=f"Started: {start_date}\nEst. completion: {est_date}",
                               font=("Arial", 12), bg="#f0f0f0", justify=tk.LEFT)
        dates_label.pack(anchor=tk.W)

        # Middle section - Service description and status update
        middle_frame = tk.Frame(content_frame, bg="#f0f0f0")
        middle_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # Service description
        desc_frame = tk.LabelFrame(middle_frame, text="Service Description",
                                   font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        desc_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        self.desc_text = tk.Text(desc_frame, font=("Arial", 12), height=6, width=30)
        self.desc_text.insert("1.0", self.service.get('description', ''))

        # Make text readonly for non-staff
        if self.user['role'] not in ['admin', 'mechanic']:
            self.desc_text.config(state=tk.DISABLED)

        self.desc_text.pack(fill=tk.BOTH, expand=True)

        # Status update (only for staff)
        if self.user['role'] in ['admin', 'mechanic']:
            status_frame = tk.LabelFrame(middle_frame, text="Update Status",
                                         font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
            status_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

            # Status dropdown
            status_label = tk.Label(status_frame, text="Current Status:",
                                    font=("Arial", 12), bg="#f0f0f0")
            status_label.pack(anchor=tk.W, pady=5)

            statuses = ["Pending", "In Progress", "Awaiting Parts", "On Hold", "Completed", "Cancelled"]
            self.status_var = tk.StringVar()
            self.status_var.set(self.service['status'])

            status_dropdown = ttk.Combobox(status_frame, textvariable=self.status_var,
                                           values=statuses, width=20)
            status_dropdown.pack(anchor=tk.W, pady=5)

            # Update button
            update_button = tk.Button(status_frame, text="Update Service",
                                      font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                      command=self.update_service_status)
            update_button.pack(anchor=tk.W, pady=10)

            # Reassign button
            reassign_button = tk.Button(status_frame, text="Reassign Mechanic",
                                        font=("Arial", 12), bg="#2196F3", fg="white",
                                        command=self.reassign_mechanic)
            reassign_button.pack(anchor=tk.W, pady=5)

        # Bottom section - Photos display
        photos_frame = tk.LabelFrame(content_frame, text="Vehicle Photos",
                                     font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        photos_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        if not self.photos:
            no_photos_label = tk.Label(photos_frame, text="No photos available for this service",
                                       font=("Arial", 12), bg="#f0f0f0")
            no_photos_label.pack(pady=20)
        else:
            # Create a frame for the thumbnails
            thumbnails_frame = tk.Frame(photos_frame, bg="#f0f0f0")
            thumbnails_frame.pack(fill=tk.X, pady=10)

            # Load and display thumbnails
            self.thumbnail_refs = []  # Keep references to prevent garbage collection

            for i, photo in enumerate(self.photos):
                try:
                    # Create thumbnail frame
                    thumb_frame = tk.Frame(thumbnails_frame, bg="#f0f0f0",
                                           padx=5, pady=5, borderwidth=1, relief=tk.RAISED)
                    thumb_frame.pack(side=tk.LEFT, padx=10)

                    # Load image
                    if os.path.exists(photo['photo_path']):
                        img = Image.open(photo['photo_path'])
                        img = img.resize((100, 75), Image.LANCZOS)
                        photo_img = ImageTk.PhotoImage(img)

                        # Store reference
                        self.thumbnail_refs.append(photo_img)

                        # Create label with image
                        img_label = tk.Label(thumb_frame, image=photo_img, bg="#f0f0f0")
                        img_label.pack()

                        # Description label
                        desc = photo.get('description', '')
                        if len(desc) > 15:
                            desc = desc[:15] + "..."

                        if desc:
                            desc_label = tk.Label(thumb_frame, text=desc,
                                                  font=("Arial", 10), bg="#f0f0f0")
                            desc_label.pack()

                        # Add click event to show full image
                        img_label.bind("<Button-1>",
                                       lambda event, p=photo: self.show_full_image(p))
                    else:
                        missing_label = tk.Label(thumb_frame, text="Missing Image",
                                                 font=("Arial", 10), bg="#f0f0f0",
                                                 width=12, height=5)
                        missing_label.pack()
                except Exception as e:
                    print(f"Error loading image: {e}")

            # View all photos button
            view_all_button = tk.Button(photos_frame, text="View All Photos",
                                        command=self.view_all_photos)
            view_all_button.pack(pady=10)

    def show_full_image(self, photo):
        """Display a full-size image in a new window"""
        try:
            # Check if image exists
            if not os.path.exists(photo['photo_path']):
                messagebox.showerror("Error", "Image file not found")
                return

            # Create new window
            img_window = tk.Toplevel(self.parent)
            img_window.title("Vehicle Photo")

            # Load image
            img = Image.open(photo['photo_path'])

            # Resize if too large, maintaining aspect ratio
            max_size = (800, 600)
            img.thumbnail(max_size, Image.LANCZOS)

            photo_img = ImageTk.PhotoImage(img)

            # Display image
            img_label = tk.Label(img_window, image=photo_img)
            img_label.image = photo_img  # Keep a reference
            img_label.pack(pady=10)

            # Display description if available
            if photo.get('description'):
                desc_label = tk.Label(img_window, text=photo['description'],
                                      font=("Arial", 12))
                desc_label.pack(pady=5)

            # Display timestamp
            if photo.get('timestamp'):
                time_label = tk.Label(img_window, text=f"Taken: {photo['timestamp']}",
                                      font=("Arial", 10))
                time_label.pack(pady=5)

            # Close button
            close_button = tk.Button(img_window, text="Close",
                                     command=img_window.destroy)
            close_button.pack(pady=10)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to display image: {str(e)}")

    def view_all_photos(self):
        """Open photo gallery to view all photos"""
        from ui.service.service_actions import view_service_photos
        view_service_photos(self.parent, self.service_id)

    def update_service_status(self):
        """Update the service status"""
        new_status = self.status_var.get()
        description = self.desc_text.get("1.0", tk.END).strip()

        update_service_status(
            self.service_id,
            new_status,
            description,
            self.refresh_service_data
        )

    def reassign_mechanic(self):
        """Show dialog to reassign mechanic"""
        from ui.service.service_actions import assign_mechanic_to_service
        assign_mechanic_to_service(
            self.parent,
            self.service_id,
            self.refresh_service_data
        )

    def refresh_service_data(self):
        """Refresh the service data"""
        self.service = get_service_by_id(self.service_id)

        # Rebuild UI
        self.frame.destroy()
        self.frame = tk.Frame(self.parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)
        self.setup_ui()

    def on_back(self):
        """Return to the previous screen"""
        self.frame.destroy()
        self.callback()