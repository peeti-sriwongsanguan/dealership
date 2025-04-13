# ui/photo_gallery.py
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import os
from database.photo_db import get_photos_for_vehicle, get_photos_for_customer, get_photo_by_id, \
    update_photo_description, delete_photo


class PhotoGallery:
    """A reusable photo gallery UI component for viewing vehicle photos"""

    def __init__(self, parent, title="Vehicle Photos", max_width=800, max_height=600):
        self.parent = parent
        self.title = title
        self.max_width = max_width
        self.max_height = max_height

        # Create the window
        self.window = tk.Toplevel(parent)
        self.window.title(title)
        self.window.geometry(f"{max_width}x{max_height}")
        self.window.configure(bg="#f0f0f0")

        # Store references to photos to prevent garbage collection
        self.thumbnail_refs = []
        self.current_photo = None

        # Set up UI
        self.setup_ui()

    def setup_ui(self):
        """Create the gallery UI"""
        # Header frame
        header_frame = tk.Frame(self.window, bg="#333333", height=50)
        header_frame.pack(fill=tk.X)

        # Title
        title_label = tk.Label(header_frame, text=self.title,
                               font=("Arial", 16, "bold"), bg="#333333", fg="white")
        title_label.pack(side=tk.LEFT, padx=20, pady=10)

        # Close button
        close_button = tk.Button(header_frame, text="Close",
                                 font=("Arial", 10), bg="#9E9E9E", fg="white",
                                 command=self.window.destroy)
        close_button.pack(side=tk.RIGHT, padx=20, pady=10)

        # Main content frame
        content_frame = tk.Frame(self.window, bg="#f0f0f0")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Split into top (thumbnails) and bottom (selected photo) sections
        self.thumbnails_frame = tk.Frame(content_frame, bg="#f0f0f0", height=120)
        self.thumbnails_frame.pack(fill=tk.X, pady=10)

        # Create a canvas for scrollable thumbnails
        self.canvas = tk.Canvas(self.thumbnails_frame, bg="#f0f0f0", height=120)
        self.canvas.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Add horizontal scrollbar to canvas
        scrollbar = ttk.Scrollbar(self.thumbnails_frame, orient=tk.HORIZONTAL,
                                  command=self.canvas.xview)
        scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        self.canvas.configure(xscrollcommand=scrollbar.set)

        # Create a frame inside the canvas to hold thumbnails
        self.thumbnails_container = tk.Frame(self.canvas, bg="#f0f0f0")
        self.canvas.create_window((0, 0), window=self.thumbnails_container, anchor=tk.NW)

        # Photo display frame
        self.photo_frame = tk.Frame(content_frame, bg="white")
        self.photo_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # Photo info frame (below photo)
        self.info_frame = tk.Frame(content_frame, bg="#f0f0f0")
        self.info_frame.pack(fill=tk.X, pady=10)

        # Description
        desc_label = tk.Label(self.info_frame, text="Description:",
                              font=("Arial", 12, "bold"), bg="#f0f0f0")
        desc_label.grid(row=0, column=0, sticky=tk.W, pady=5)

        self.desc_var = tk.StringVar()
        self.desc_entry = tk.Entry(self.info_frame, font=("Arial", 12),
                                   textvariable=self.desc_var, width=50)
        self.desc_entry.grid(row=0, column=1, sticky=tk.W, pady=5, padx=5)

        # Update description button
        self.update_desc_button = tk.Button(self.info_frame, text="Update Description",
                                            command=self.update_description)
        self.update_desc_button.grid(row=0, column=2, padx=5, pady=5)
        self.update_desc_button.config(state=tk.DISABLED)

        # Date/time info
        self.timestamp_label = tk.Label(self.info_frame, text="",
                                        font=("Arial", 10), bg="#f0f0f0")
        self.timestamp_label.grid(row=1, column=1, sticky=tk.W, pady=5)

        # Service/vehicle info
        self.service_label = tk.Label(self.info_frame, text="",
                                      font=("Arial", 10), bg="#f0f0f0")
        self.service_label.grid(row=2, column=1, sticky=tk.W, pady=5)

        # Placeholder for the main photo display
        self.photo_placeholder = tk.Label(self.photo_frame, text="No photo selected",
                                          font=("Arial", 14), bg="white",
                                          width=80, height=20)
        self.photo_placeholder.pack(fill=tk.BOTH, expand=True)

    def load_photos_for_vehicle(self, vehicle_id):
        """Load and display photos for a specific vehicle"""
        self.photos = get_photos_for_vehicle(vehicle_id)

        if not self.photos:
            tk.Label(self.thumbnails_container, text="No photos available for this vehicle",
                     font=("Arial", 12), bg="#f0f0f0").pack(padx=20, pady=20)
            return

        self.display_thumbnails()

    def load_photos_for_customer(self, customer_id):
        """Load and display photos for all vehicles of a customer"""
        self.photos = get_photos_for_customer(customer_id)

        if not self.photos:
            tk.Label(self.thumbnails_container, text="No photos available for this customer",
                     font=("Arial", 12), bg="#f0f0f0").pack(padx=20, pady=20)
            return

        self.display_thumbnails()

    def display_thumbnails(self):
        """Display photo thumbnails in the thumbnails container"""
        # Clear existing thumbnails
        for widget in self.thumbnails_container.winfo_children():
            widget.destroy()

        self.thumbnail_refs = []  # Clear thumbnail references

        # Create and display thumbnails
        for i, photo in enumerate(self.photos):
            try:
                # Create thumbnail frame
                thumb_frame = tk.Frame(self.thumbnails_container, bg="#f0f0f0",
                                       padx=5, pady=5, borderwidth=1, relief=tk.RAISED)
                thumb_frame.pack(side=tk.LEFT, padx=5, pady=5)

                # Load image if file exists
                if os.path.exists(photo['photo_path']):
                    img = Image.open(photo['photo_path'])
                    img.thumbnail((100, 75), Image.LANCZOS)
                    photo_img = ImageTk.PhotoImage(img)

                    # Store reference
                    self.thumbnail_refs.append(photo_img)

                    # Create label with image
                    img_label = tk.Label(thumb_frame, image=photo_img, bg="#f0f0f0")
                    img_label.pack()

                    # Add click event
                    img_label.bind("<Button-1>",
                                   lambda event, p=photo: self.display_photo(p))

                    # Add description as tooltip if available
                    desc = photo.get('description', '')
                    if desc:
                        ToolTip(img_label, desc)
                else:
                    # Missing image placeholder
                    missing_label = tk.Label(thumb_frame, text="Missing Image",
                                             font=("Arial", 10), bg="#f0f0f0",
                                             width=12, height=5)
                    missing_label.pack()
            except Exception as e:
                print(f"Error loading thumbnail: {e}")

        # Update canvas scroll region
        self.thumbnails_container.update_idletasks()
        self.canvas.config(scrollregion=self.canvas.bbox("all"))

        # If photos exist, display the first one
        if self.photos:
            self.display_photo(self.photos[0])

    def display_photo(self, photo):
        """Display a full-size photo in the main viewing area"""
        self.current_photo = photo

        # Update info fields
        self.desc_var.set(photo.get('description', ''))
        self.timestamp_label.config(text=f"Taken: {photo.get('timestamp', 'N/A')}")

        # Update service/vehicle info if available
        vehicle_info = ""
        if photo.get('make') and photo.get('model'):
            vehicle_info = f"Vehicle: {photo.get('year', '')} {photo.get('make', '')} {photo.get('model', '')}"
            if photo.get('license_plate'):
                vehicle_info += f" ({photo.get('license_plate', '')})"

        if photo.get('service_type'):
            vehicle_info += f" - Service: {photo.get('service_type', '')}"

        self.service_label.config(text=vehicle_info)

        # Enable update button
        self.update_desc_button.config(state=tk.NORMAL)

        # Clear existing photo
        for widget in self.photo_frame.winfo_children():
            widget.destroy()

        try:
            # Check if image exists
            if not os.path.exists(photo['photo_path']):
                label = tk.Label(self.photo_frame, text="Image file not found",
                                 font=("Arial", 14), bg="white")
                label.pack(fill=tk.BOTH, expand=True)
                return

            # Load and display image
            img = Image.open(photo['photo_path'])

            # Calculate size to fit in frame while maintaining aspect ratio
            img_width, img_height = img.size
            frame_width = self.photo_frame.winfo_width() or self.max_width - 40  # Account for padding
            frame_height = self.photo_frame.winfo_height() or self.max_height - 200  # Account for other UI elements

            # Adjust if the image is larger than the frame
            if img_width > frame_width or img_height > frame_height:
                # Calculate scaling factor
                width_ratio = frame_width / img_width
                height_ratio = frame_height / img_height
                scale_factor = min(width_ratio, height_ratio)

                # Calculate new dimensions
                new_width = int(img_width * scale_factor)
                new_height = int(img_height * scale_factor)

                # Resize image
                img = img.resize((new_width, new_height), Image.LANCZOS)

            # Convert to PhotoImage
            self.current_img = ImageTk.PhotoImage(img)

            # Display in label
            img_label = tk.Label(self.photo_frame, image=self.current_img, bg="white")
            img_label.pack(fill=tk.BOTH, expand=True)

        except Exception as e:
            # Display error message
            error_label = tk.Label(self.photo_frame, text=f"Error displaying image: {str(e)}",
                                   font=("Arial", 14), bg="white")
            error_label.pack(fill=tk.BOTH, expand=True)

    def update_description(self):
        """Update the description of the current photo"""
        if not self.current_photo:
            return

        new_description = self.desc_var.get()
        photo_id = self.current_photo['id']

        success = update_photo_description(photo_id, new_description)

        if success:
            messagebox.showinfo("Success", "Photo description updated")

            # Update the photo in our list
            for photo in self.photos:
                if photo['id'] == photo_id:
                    photo['description'] = new_description
                    break
        else:
            messagebox.showerror("Error", "Failed to update photo description")


class ToolTip:
    """Simple tooltip implementation"""

    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tooltip = None

        self.widget.bind("<Enter>", self.show_tooltip)
        self.widget.bind("<Leave>", self.hide_tooltip)

    def show_tooltip(self, event=None):
        """Display the tooltip near the widget"""
        x, y, _, _ = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25

        # Create a toplevel window
        self.tooltip = tk.Toplevel(self.widget)
        self.tooltip.wm_overrideredirect(True)
        self.tooltip.wm_geometry(f"+{x}+{y}")

        # Create the tooltip label
        label = tk.Label(self.tooltip, text=self.text, justify=tk.LEFT,
                         background="#ffffe0", relief=tk.SOLID, borderwidth=1,
                         font=("Arial", "10", "normal"))
        label.pack(padx=2, pady=2)

    def hide_tooltip(self, event=None):
        """Hide the tooltip"""
        if self.tooltip:
            self.tooltip.destroy()
            self.tooltip = None