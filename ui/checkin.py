# ui/checkin.py

import tkinter as tk
from tkinter import ttk, messagebox
import datetime
import os
import cv2
from PIL import Image, ImageTk
import io
from dotenv import load_dotenv
import sqlite3
from database.service_db import create_service, update_service, get_service_by_id
from database.photo_db import save_photo, get_photos_for_service
from database.vehicle_db import get_vehicle_by_id

# Load environment variables
load_dotenv()

# Get database path and photos directory from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')


class CustomerCheckIn:
    def __init__(self, parent, user, vehicle_id, callback):
        """
        Initialize the customer check-in screen

        Args:
            parent: The parent widget
            user: Current user information
            vehicle_id: ID of the vehicle being checked in
            callback: Function to call when returning to previous screen
        """
        self.parent = parent
        self.user = user
        self.vehicle_id = vehicle_id
        self.callback = callback

        # Get vehicle info
        self.vehicle = get_vehicle_by_id(vehicle_id)
        if not self.vehicle:
            messagebox.showerror("Error", "Vehicle not found")
            self.callback()
            return

        # Initialize camera variables
        self.camera = None
        self.is_capturing = False
        self.captured_photos = []

        # Create frame
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
        title_label = tk.Label(header_frame, text="Customer Check-In",
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Back button
        back_button = tk.Button(header_frame, text="Back",
                                font=("Arial", 10), bg="#9E9E9E", fg="white",
                                command=self.on_back)
        back_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Main content area - split into left and right panes
        content_frame = tk.Frame(self.frame, bg="#f0f0f0")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Left pane (service info)
        left_frame = tk.LabelFrame(content_frame, text="Service Information",
                                   font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Vehicle info
        vehicle_info = f"{self.vehicle.get('year', '')} {self.vehicle['make']} {self.vehicle['model']}"
        if self.vehicle.get('license_plate'):
            vehicle_info += f" ({self.vehicle['license_plate']})"

        vehicle_label = tk.Label(left_frame, text=f"Vehicle: {vehicle_info}",
                                 font=("Arial", 12), bg="#f0f0f0", anchor="w")
        vehicle_label.pack(fill=tk.X, pady=5)

        customer_label = tk.Label(left_frame, text=f"Customer: {self.vehicle['customer_name']}",
                                  font=("Arial", 12), bg="#f0f0f0", anchor="w")
        customer_label.pack(fill=tk.X, pady=5)

        # Get service types from database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT service_type FROM services")
        service_types = [row[0] for row in cursor.fetchall()]
        if not service_types:
            service_types = ["Maintenance", "Repair", "Diagnosis", "Warranty Work", "Other"]

        # Get mechanics
        cursor.execute("""
        SELECT id, username FROM users 
        WHERE role = 'mechanic' OR role = 'admin'
        """)
        self.mechanics = cursor.fetchall()

        conn.close()

        # Service type
        type_frame = tk.Frame(left_frame, bg="#f0f0f0")
        type_frame.pack(fill=tk.X, pady=5)

        type_label = tk.Label(type_frame, text="Service Type:",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        type_label.pack(side=tk.LEFT)

        self.service_type_var = tk.StringVar()
        self.service_type_var.set(service_types[0])

        type_dropdown = ttk.Combobox(type_frame, textvariable=self.service_type_var,
                                     values=service_types, width=30)
        type_dropdown.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Mechanic assignment
        mech_frame = tk.Frame(left_frame, bg="#f0f0f0")
        mech_frame.pack(fill=tk.X, pady=5)

        mech_label = tk.Label(mech_frame, text="Assign To:",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        mech_label.pack(side=tk.LEFT)

        self.mechanic_var = tk.StringVar()
        mech_values = []
        self.mech_id_map = {}

        for mech_id, mech_name in self.mechanics:
            mech_values.append(mech_name)
            self.mech_id_map[mech_name] = mech_id

        mech_dropdown = ttk.Combobox(mech_frame, textvariable=self.mechanic_var,
                                     values=mech_values, width=30)
        if mech_values:
            self.mechanic_var.set(mech_values[0])

        mech_dropdown.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Estimated completion
        est_frame = tk.Frame(left_frame, bg="#f0f0f0")
        est_frame.pack(fill=tk.X, pady=5)

        est_label = tk.Label(est_frame, text="Est. Completion:",
                             font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        est_label.pack(side=tk.LEFT)

        today = datetime.datetime.now()
        tomorrow = today + datetime.timedelta(days=1)
        self.est_date = tk.StringVar()
        self.est_date.set(tomorrow.strftime("%Y-%m-%d"))

        est_entry = tk.Entry(est_frame, font=("Arial", 12),
                             textvariable=self.est_date, width=30)
        est_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Cost estimate
        cost_frame = tk.Frame(left_frame, bg="#f0f0f0")
        cost_frame.pack(fill=tk.X, pady=5)

        cost_label = tk.Label(cost_frame, text="Cost Estimate ($):",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        cost_label.pack(side=tk.LEFT)

        self.cost_var = tk.StringVar()
        self.cost_var.set("0.00")

        cost_entry = tk.Entry(cost_frame, font=("Arial", 12),
                              textvariable=self.cost_var, width=30)
        cost_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Description / notes
        desc_label = tk.Label(left_frame, text="Description / Notes:",
                              font=("Arial", 12), bg="#f0f0f0", anchor="w")
        desc_label.pack(fill=tk.X, pady=5)

        self.desc_text = tk.Text(left_frame, font=("Arial", 12), height=6)
        self.desc_text.pack(fill=tk.BOTH, expand=True, pady=5)

        # Right pane (camera/photos)
        right_frame = tk.LabelFrame(content_frame, text="Vehicle Photos",
                                    font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Camera view
        self.camera_frame = tk.Frame(right_frame, bg="black", width=320, height=240)
        self.camera_frame.pack(pady=10)

        # Default camera view label
        self.camera_label = tk.Label(self.camera_frame, text="No Camera Feed",
                                     fg="white", bg="black", width=40, height=15)
        self.camera_label.pack(fill=tk.BOTH, expand=True)

        # Camera controls
        camera_controls = tk.Frame(right_frame, bg="#f0f0f0")
        camera_controls.pack(fill=tk.X, pady=5)

        self.camera_btn = tk.Button(camera_controls, text="Start Camera",
                                    command=self.toggle_camera)
        self.camera_btn.pack(side=tk.LEFT, padx=5)

        self.capture_btn = tk.Button(camera_controls, text="Capture Photo",
                                     command=self.capture_photo, state=tk.DISABLED)
        self.capture_btn.pack(side=tk.LEFT, padx=5)

        # Photo description
        photo_desc_frame = tk.Frame(right_frame, bg="#f0f0f0")
        photo_desc_frame.pack(fill=tk.X, pady=5)

        photo_desc_label = tk.Label(photo_desc_frame, text="Photo Description:",
                                    font=("Arial", 12), bg="#f0f0f0")
        photo_desc_label.pack(side=tk.LEFT)

        self.photo_desc_var = tk.StringVar()
        photo_desc_entry = tk.Entry(photo_desc_frame, font=("Arial", 12),
                                    textvariable=self.photo_desc_var, width=30)
        photo_desc_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Captured photos list
        photos_label = tk.Label(right_frame, text="Captured Photos:",
                                font=("Arial", 12), bg="#f0f0f0", anchor="w")
        photos_label.pack(fill=tk.X, pady=5)

        self.photos_listbox = tk.Listbox(right_frame, font=("Arial", 12), height=6)
        self.photos_listbox.pack(fill=tk.BOTH, expand=True, pady=5)

        # Bottom buttons frame
        buttons_frame = tk.Frame(self.frame, bg="#f0f0f0", padx=20, pady=10)
        buttons_frame.pack(fill=tk.X)

        save_button = tk.Button(buttons_frame, text="Save Check-In",
                                font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                padx=20, pady=5, command=self.save_checkin)
        save_button.pack(side=tk.RIGHT, padx=5)

        cancel_button = tk.Button(buttons_frame, text="Cancel",
                                  font=("Arial", 12, "bold"), bg="#F44336", fg="white",
                                  padx=20, pady=5, command=self.on_back)
        cancel_button.pack(side=tk.RIGHT, padx=5)

    def toggle_camera(self):
        """Start or stop the camera feed"""
        if self.is_capturing:
            # Stop camera
            self.is_capturing = False
            self.camera_btn.config(text="Start Camera")
            self.capture_btn.config(state=tk.DISABLED)

            if self.camera is not None:
                self.camera.release()
                self.camera = None

            # Reset camera view
            self.camera_label.config(text="No Camera Feed", image="")

        else:
            # Start camera
            try:
                self.camera = cv2.VideoCapture(0)  # 0 is usually the default camera
                if not self.camera.isOpened():
                    messagebox.showerror("Error", "Could not open camera")
                    return

                self.is_capturing = True
                self.camera_btn.config(text="Stop Camera")
                self.capture_btn.config(state=tk.NORMAL)

                # Start camera feed
                self.update_camera()

            except Exception as e:
                messagebox.showerror("Error", f"Failed to start camera: {str(e)}")

    def update_camera(self):
        """Update the camera feed"""
        if self.is_capturing and self.camera is not None:
            ret, frame = self.camera.read()
            if ret:
                # Convert frame to format for tkinter
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame = cv2.resize(frame, (320, 240))

                img = Image.fromarray(frame)
                imgtk = ImageTk.PhotoImage(image=img)

                self.camera_label.config(image=imgtk, text="")
                self.camera_label.image = imgtk  # Keep reference

            # Call this function again after a delay
            self.parent.after(10, self.update_camera)

    def capture_photo(self):
        """Capture a photo from the camera feed"""
        if not self.is_capturing or self.camera is None:
            return

        ret, frame = self.camera.read()
        if ret:
            # Get photo description
            description = self.photo_desc_var.get()

            # Convert to JPEG format in memory
            _, img_encoded = cv2.imencode('.jpg', frame)
            img_bytes = img_encoded.tobytes()

            # Store captured photo
            self.captured_photos.append((img_bytes, description))

            # Add to listbox
            listbox_text = f"Photo {len(self.captured_photos)}"
            if description:
                listbox_text += f": {description}"

            self.photos_listbox.insert(tk.END, listbox_text)

            # Clear description
            self.photo_desc_var.set("")

            messagebox.showinfo("Success", "Photo captured")

    def save_checkin(self):
        """Save the check-in service record and photos"""
        try:
            # Get service data
            service_type = self.service_type_var.get()
            description = self.desc_text.get("1.0", tk.END).strip()

            # Convert mechanic name to ID
            mechanic_name = self.mechanic_var.get()
            mechanic_id = None
            for m_id, m_name in self.mechanics:
                if m_name == mechanic_name:
                    mechanic_id = m_id
                    break

            # Parse cost
            try:
                cost = float(self.cost_var.get())
            except ValueError:
                cost = 0.0

            # Create service record
            service_data = {
                'vehicle_id': self.vehicle_id,
                'service_type': service_type,
                'description': description,
                'status': 'Pending',
                'mechanic_id': mechanic_id,
                'estimated_completion': self.est_date.get(),
                'cost': cost
            }

            service_id = create_service(service_data)

            # Save photos
            for photo_data, photo_desc in self.captured_photos:
                save_photo(service_id, photo_data, photo_desc)

            messagebox.showinfo("Success", "Check-in completed successfully")

            # Clean up camera if running
            if self.is_capturing and self.camera is not None:
                self.camera.release()
                self.camera = None

            # Return to calling screen
            self.on_back()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to save check-in: {str(e)}")

    def on_back(self):
        """Return to the previous screen"""
        # Clean up camera if running
        if self.is_capturing and self.camera is not None:
            self.camera.release()
            self.camera = None

        # Destroy frame
        self.frame.destroy()

        # Call callback
        self.callback()