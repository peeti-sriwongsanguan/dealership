# ui/screens/inspection/simple_damage_marker.py
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk, ImageDraw
import json
import math
from typing import List, Dict, Tuple, Optional, Callable
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SimpleDamagePoint:
    """Simple damage point for touch interface"""

    def __init__(self, x: float, y: float, damage_type: str = "Damage",
                 severity: str = "Minor", description: str = ""):
        self.x = x  # Relative position (0-1)
        self.y = y  # Relative position (0-1)
        self.damage_type = damage_type
        self.severity = severity
        self.description = description
        self.timestamp = datetime.now().isoformat()
        self.id = f"dmg_{int(datetime.now().timestamp() * 1000)}"
        self.number = 1  # Will be set by the manager

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'number': self.number,
            'x': self.x,
            'y': self.y,
            'damage_type': self.damage_type,
            'severity': self.severity,
            'description': self.description,
            'timestamp': self.timestamp
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'SimpleDamagePoint':
        """Create from dictionary"""
        point = cls(
            data['x'], data['y'],
            data.get('damage_type', 'Damage'),
            data.get('severity', 'Minor'),
            data.get('description', '')
        )
        point.id = data.get('id', point.id)
        point.number = data.get('number', 1)
        point.timestamp = data.get('timestamp', point.timestamp)
        return point


class TouchFriendlyDamageMarker:
    """Simple, touch-friendly damage marking interface"""

    def __init__(self, parent: tk.Widget, vehicle_id: int, callback: Callable):
        self.parent = parent
        self.vehicle_id = vehicle_id
        self.callback = callback

        # Current state
        self.damage_points: List[SimpleDamagePoint] = []
        self.current_damage_type = "Scratch"
        self.current_severity = "Minor"
        self.next_damage_number = 1

        # Vehicle template
        self.vehicle_image = None
        self.vehicle_photo = None
        self.canvas_width = 900
        self.canvas_height = 600
        self.scale_factor = 1.0
        self.offset_x = 0
        self.offset_y = 0

        # Colors for damage severity
        self.severity_colors = {
            "Minor": "#FFD700",  # Gold
            "Moderate": "#FF8C00",  # Dark Orange
            "Severe": "#FF4500",  # Red Orange
            "Critical": "#DC143C"  # Crimson
        }

        # Damage type icons/colors
        self.damage_type_colors = {
            "Scratch": "#FF6B6B",
            "Dent": "#4ECDC4",
            "Crack": "#45B7D1",
            "Rust": "#96CEB4",
            "Paint": "#FECA57",
            "Electrical": "#54A0FF",
            "Other": "#C44569"
        }

        self._create_interface()
        self._load_vehicle_template()

    def _create_interface(self):
        """Create the main interface"""
        self.frame = tk.Frame(self.parent, bg="#f0f0f0")
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Header
        self._create_header()

        # Main content - side by side layout
        content_frame = tk.Frame(self.frame, bg="#f0f0f0")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left side - Vehicle diagram
        self._create_vehicle_canvas(content_frame)

        # Right side - Controls and damage list
        self._create_controls_panel(content_frame)

    def _create_header(self):
        """Create header with title and navigation"""
        header_frame = tk.Frame(self.frame, bg="#2c3e50", height=70)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        # Title
        title_label = tk.Label(
            header_frame,
            text="🚐 Vehicle Damage Inspector",
            font=("Arial", 20, "bold"),
            bg="#2c3e50",
            fg="white"
        )
        title_label.pack(side=tk.LEFT, padx=20, pady=15)

        # Vehicle info (if available)
        info_label = tk.Label(
            header_frame,
            text=f"Vehicle ID: {self.vehicle_id}",
            font=("Arial", 12),
            bg="#2c3e50",
            fg="#bdc3c7"
        )
        info_label.pack(side=tk.LEFT, padx=20, pady=15)

        # Navigation buttons
        nav_frame = tk.Frame(header_frame, bg="#2c3e50")
        nav_frame.pack(side=tk.RIGHT, padx=20, pady=15)

        save_btn = tk.Button(
            nav_frame,
            text="💾 Save Report",
            font=("Arial", 12, "bold"),
            bg="#27ae60",
            fg="white",
            padx=20,
            pady=5,
            command=self._save_report
        )
        save_btn.pack(side=tk.LEFT, padx=5)

        back_btn = tk.Button(
            nav_frame,
            text="← Back",
            font=("Arial", 12),
            bg="#95a5a6",
            fg="white",
            padx=20,
            pady=5,
            command=self._on_back
        )
        back_btn.pack(side=tk.LEFT, padx=5)

    def _create_vehicle_canvas(self, parent):
        """Create the vehicle diagram canvas"""
        # Canvas frame
        canvas_frame = tk.LabelFrame(
            parent,
            text="Touch the vehicle image to mark damage areas",
            font=("Arial", 14, "bold"),
            bg="#f0f0f0",
            padx=10,
            pady=10
        )
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))

        # Create canvas
        self.canvas = tk.Canvas(
            canvas_frame,
            width=self.canvas_width,
            height=self.canvas_height,
            bg="white",
            relief=tk.SUNKEN,
            bd=2,
            highlightthickness=1,
            highlightbackground="#34495e"
        )
        self.canvas.pack(pady=10)

        # Bind events - make it touch/click friendly
        self.canvas.bind("<Button-1>", self._on_canvas_click)
        self.canvas.bind("<Button-3>", self._on_canvas_right_click)  # Right click for context menu
        self.canvas.bind("<Double-Button-1>", self._on_canvas_double_click)

        # Instructions below canvas
        instructions = tk.Label(
            canvas_frame,
            text="👆 Touch or click on the vehicle to mark damage • Right-click to remove damage points",
            font=("Arial", 11),
            fg="#7f8c8d",
            bg="#f0f0f0"
        )
        instructions.pack(pady=5)

    def _create_controls_panel(self, parent):
        """Create the controls and damage list panel"""
        # Controls frame
        controls_frame = tk.Frame(parent, bg="#f0f0f0", width=350)
        controls_frame.pack(side=tk.RIGHT, fill=tk.Y)
        controls_frame.pack_propagate(False)

        # Damage marking controls
        self._create_damage_controls(controls_frame)

        # Damage points list
        self._create_damage_list(controls_frame)

    def _create_damage_controls(self, parent):
        """Create damage marking controls"""
        controls_frame = tk.LabelFrame(
            parent,
            text="Damage Marking Options",
            font=("Arial", 12, "bold"),
            bg="#f0f0f0",
            padx=15,
            pady=15
        )
        controls_frame.pack(fill=tk.X, pady=(0, 10))

        # Damage type selection
        tk.Label(
            controls_frame,
            text="Damage Type:",
            font=("Arial", 11, "bold"),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, pady=(0, 5))

        # Create damage type buttons (larger for touch)
        damage_types = [
            ("Scratch", "#FF6B6B"),
            ("Dent", "#4ECDC4"),
            ("Crack", "#45B7D1"),
            ("Rust", "#96CEB4"),
            ("Paint", "#FECA57"),
            ("Other", "#C44569")
        ]

        self.damage_type_var = tk.StringVar(value="Scratch")

        type_frame = tk.Frame(controls_frame, bg="#f0f0f0")
        type_frame.pack(fill=tk.X, pady=(0, 15))

        for i, (damage_type, color) in enumerate(damage_types):
            btn = tk.Radiobutton(
                type_frame,
                text=damage_type,
                variable=self.damage_type_var,
                value=damage_type,
                font=("Arial", 10, "bold"),
                bg=color,
                fg="white",
                selectcolor=color,
                activebackground=color,
                activeforeground="white",
                indicatoron=False,
                width=8,
                height=2,
                command=self._on_damage_type_change
            )
            btn.grid(row=i // 2, column=i % 2, padx=2, pady=2, sticky="ew")

        type_frame.grid_columnconfigure(0, weight=1)
        type_frame.grid_columnconfigure(1, weight=1)

        # Severity selection
        tk.Label(
            controls_frame,
            text="Severity Level:",
            font=("Arial", 11, "bold"),
            bg="#f0f0f0"
        ).pack(anchor=tk.W, pady=(10, 5))

        severities = [
            ("Minor", "#FFD700"),
            ("Moderate", "#FF8C00"),
            ("Severe", "#FF4500"),
            ("Critical", "#DC143C")
        ]

        self.severity_var = tk.StringVar(value="Minor")

        severity_frame = tk.Frame(controls_frame, bg="#f0f0f0")
        severity_frame.pack(fill=tk.X, pady=(0, 15))

        for i, (severity, color) in enumerate(severities):
            btn = tk.Radiobutton(
                severity_frame,
                text=severity,
                variable=self.severity_var,
                value=severity,
                font=("Arial", 10, "bold"),
                bg=color,
                fg="white",
                selectcolor=color,
                activebackground=color,
                activeforeground="white",
                indicatoron=False,
                width=7,
                height=2,
                command=self._on_severity_change
            )
            btn.grid(row=i // 2, column=i % 2, padx=2, pady=2, sticky="ew")

        severity_frame.grid_columnconfigure(0, weight=1)
        severity_frame.grid_columnconfigure(1, weight=1)

        # Action buttons
        action_frame = tk.Frame(controls_frame, bg="#f0f0f0")
        action_frame.pack(fill=tk.X, pady=(10, 0))

        clear_btn = tk.Button(
            action_frame,
            text="🗑️ Clear All",
            font=("Arial", 11, "bold"),
            bg="#e74c3c",
            fg="white",
            height=2,
            command=self._clear_all_damage
        )
        clear_btn.pack(fill=tk.X, pady=2)

        undo_btn = tk.Button(
            action_frame,
            text="↶ Undo Last",
            font=("Arial", 11, "bold"),
            bg="#f39c12",
            fg="white",
            height=2,
            command=self._undo_last_damage
        )
        undo_btn.pack(fill=tk.X, pady=2)

    def _create_damage_list(self, parent):
        """Create damage points list"""
        list_frame = tk.LabelFrame(
            parent,
            text="Damage Points",
            font=("Arial", 12, "bold"),
            bg="#f0f0f0",
            padx=10,
            pady=10
        )
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))

        # Scrollable list
        list_container = tk.Frame(list_frame, bg="#f0f0f0")
        list_container.pack(fill=tk.BOTH, expand=True)

        # Create treeview for damage points
        columns = ("No", "Type", "Severity", "Time")
        self.damage_tree = ttk.Treeview(
            list_container,
            columns=columns,
            show="headings",
            height=12
        )

        # Configure columns
        self.damage_tree.heading("No", text="#")
        self.damage_tree.heading("Type", text="Type")
        self.damage_tree.heading("Severity", text="Severity")
        self.damage_tree.heading("Time", text="Time")

        self.damage_tree.column("No", width=30, anchor="center")
        self.damage_tree.column("Type", width=80, anchor="center")
        self.damage_tree.column("Severity", width=80, anchor="center")
        self.damage_tree.column("Time", width=60, anchor="center")

        # Scrollbar
        scrollbar = ttk.Scrollbar(list_container, orient="vertical", command=self.damage_tree.yview)
        self.damage_tree.configure(yscrollcommand=scrollbar.set)

        # Pack components
        self.damage_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Bind events
        self.damage_tree.bind("<Double-1>", self._on_damage_point_double_click)
        self.damage_tree.bind("<Button-3>", self._on_damage_point_right_click)

        # Summary label
        self.summary_label = tk.Label(
            list_frame,
            text="Total damage points: 0",
            font=("Arial", 10, "bold"),
            bg="#f0f0f0",
            fg="#2c3e50"
        )
        self.summary_label.pack(pady=(10, 0))

    def _load_vehicle_template(self):
        """Load default vehicle template"""
        try:
            # Create a simple van template if no image exists
            self._create_simple_van_template()

        except Exception as e:
            logger.error(f"Failed to load vehicle template: {e}")
            self._create_fallback_template()

    def _create_simple_van_template(self):
        """Create a simple van outline template"""
        # Create image
        img_width, img_height = 700, 400
        self.vehicle_image = Image.new('RGB', (img_width, img_height), 'white')
        draw = ImageDraw.Draw(self.vehicle_image)

        # Draw van outline (side view)
        # Main body
        body_x1, body_y1 = 100, 150
        body_x2, body_y2 = 550, 300
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], outline='#2c3e50', width=4)

        # Cab/front
        cab_x1, cab_y1 = 50, 180
        cab_x2, cab_y2 = 150, 280
        draw.rectangle([cab_x1, cab_y1, cab_x2, cab_y2], outline='#2c3e50', width=4)

        # Windshield
        draw.line([cab_x1, cab_y1, cab_x1 + 40, cab_y1 - 20], fill='#2c3e50', width=3)
        draw.line([cab_x1 + 40, cab_y1 - 20, cab_x2 - 10, cab_y1], fill='#2c3e50', width=3)

        # Wheels
        wheel_radius = 25
        # Front wheel
        wheel1_x, wheel1_y = 120, 300
        draw.ellipse([wheel1_x - wheel_radius, wheel1_y - wheel_radius,
                      wheel1_x + wheel_radius, wheel1_y + wheel_radius],
                     outline='#2c3e50', width=4)

        # Rear wheel
        wheel2_x, wheel2_y = 450, 300
        draw.ellipse([wheel2_x - wheel_radius, wheel2_y - wheel_radius,
                      wheel2_x + wheel_radius, wheel2_y + wheel_radius],
                     outline='#2c3e50', width=4)

        # Door lines
        door1_x = 200
        door2_x = 350
        draw.line([door1_x, body_y1, door1_x, body_y2], fill='#2c3e50', width=2)
        draw.line([door2_x, body_y1, door2_x, body_y2], fill='#2c3e50', width=2)

        # Door handles
        handle_y = (body_y1 + body_y2) // 2
        draw.rectangle([door1_x + 10, handle_y - 3, door1_x + 20, handle_y + 3],
                       fill='#2c3e50')
        draw.rectangle([door2_x + 10, handle_y - 3, door2_x + 20, handle_y + 3],
                       fill='#2c3e50')

        # Headlight
        draw.ellipse([45, 200, 65, 220], outline='#f39c12', width=3)

        # Tail light
        draw.rectangle([545, 200, 555, 220], fill='#e74c3c')

        # Grille
        for i in range(3):
            y = 220 + i * 8
            draw.line([45, y, 70, y], fill='#2c3e50', width=2)

        # Add labels
        draw.text((300, 50), "Commercial Van - Side View", fill='#2c3e50', anchor="mm")
        draw.text((100, 350), "Front", fill='#7f8c8d', anchor="mm")
        draw.text((500, 350), "Rear", fill='#7f8c8d', anchor="mm")

        # Convert to display format
        self._resize_and_display_image()

    def _create_fallback_template(self):
        """Create a simple fallback template"""
        img_width, img_height = 600, 300
        self.vehicle_image = Image.new('RGB', (img_width, img_height), 'white')
        draw = ImageDraw.Draw(self.vehicle_image)

        # Simple rectangle for vehicle
        draw.rectangle([50, 50, 550, 250], outline='#2c3e50', width=3)
        draw.text((300, 150), "Vehicle Template", fill='#2c3e50', anchor="mm")
        draw.text((300, 30), "Click anywhere to mark damage", fill='#7f8c8d', anchor="mm")

        self._resize_and_display_image()

    def _resize_and_display_image(self):
        """Resize and display the vehicle image"""
        if not self.vehicle_image:
            return

        # Calculate scale to fit canvas
        img_width, img_height = self.vehicle_image.size
        scale_w = (self.canvas_width - 40) / img_width
        scale_h = (self.canvas_height - 40) / img_height
        self.scale_factor = min(scale_w, scale_h)

        # Resize image
        new_width = int(img_width * self.scale_factor)
        new_height = int(img_height * self.scale_factor)
        resized_image = self.vehicle_image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Center on canvas
        self.offset_x = (self.canvas_width - new_width) // 2
        self.offset_y = (self.canvas_height - new_height) // 2

        # Convert to PhotoImage
        self.vehicle_photo = ImageTk.PhotoImage(resized_image)

        # Display on canvas
        self.canvas.delete("all")
        self.canvas.create_image(
            self.offset_x, self.offset_y,
            anchor=tk.NW,
            image=self.vehicle_photo,
            tags="vehicle_template"
        )

        # Redraw damage points
        self._redraw_damage_points()

    def _canvas_to_relative(self, canvas_x: int, canvas_y: int) -> Tuple[float, float]:
        """Convert canvas coordinates to relative coordinates (0-1)"""
        if not self.vehicle_image:
            return 0.0, 0.0

        # Account for offset and scaling
        rel_x = (canvas_x - self.offset_x) / (self.vehicle_image.width * self.scale_factor)
        rel_y = (canvas_y - self.offset_y) / (self.vehicle_image.height * self.scale_factor)

        # Clamp to 0-1 range
        rel_x = max(0.0, min(1.0, rel_x))
        rel_y = max(0.0, min(1.0, rel_y))

        return rel_x, rel_y

    def _relative_to_canvas(self, rel_x: float, rel_y: float) -> Tuple[int, int]:
        """Convert relative coordinates to canvas coordinates"""
        if not self.vehicle_image:
            return 0, 0

        canvas_x = int(rel_x * self.vehicle_image.width * self.scale_factor + self.offset_x)
        canvas_y = int(rel_y * self.vehicle_image.height * self.scale_factor + self.offset_y)

        return canvas_x, canvas_y

    def _on_canvas_click(self, event):
        """Handle canvas click - add damage point"""
        try:
            # Convert to relative coordinates
            rel_x, rel_y = self._canvas_to_relative(event.x, event.y)

            # Only add point if it's on the vehicle template
            if 0 <= rel_x <= 1 and 0 <= rel_y <= 1:
                self._add_damage_point(rel_x, rel_y)
        except Exception as e:
            logger.error(f"Error handling canvas click: {e}")

    def _on_canvas_right_click(self, event):
        """Handle right click - remove nearby damage point"""
        # Find damage point near click
        damage_point = self._find_damage_point_near(event.x, event.y)
        if damage_point:
            self._remove_damage_point(damage_point)

    def _on_canvas_double_click(self, event):
        """Handle double click - edit damage point"""
        damage_point = self._find_damage_point_near(event.x, event.y)
        if damage_point:
            self._edit_damage_point(damage_point)

    def _add_damage_point(self, rel_x: float, rel_y: float):
        """Add a damage point"""
        try:
            # Create damage point
            damage_point = SimpleDamagePoint(
                rel_x, rel_y,
                self.damage_type_var.get(),
                self.severity_var.get()
            )
            damage_point.number = self.next_damage_number

            # Add to list
            self.damage_points.append(damage_point)
            self.next_damage_number += 1

            # Draw on canvas
            self._draw_damage_point(damage_point)

            # Update damage list
            self._update_damage_list()

            logger.info(f"Added damage point #{damage_point.number}")

        except Exception as e:
            logger.error(f"Failed to add damage point: {e}")

    def _draw_damage_point(self, damage_point: SimpleDamagePoint):
        """Draw a damage point on the canvas"""
        try:
            # Convert to canvas coordinates
            canvas_x, canvas_y = self._relative_to_canvas(damage_point.x, damage_point.y)

            # Get colors
            type_color = self.damage_type_colors.get(damage_point.damage_type, "#FF0000")
            severity_color = self.severity_colors.get(damage_point.severity, "#FFD700")

            # Size based on severity
            sizes = {"Minor": 20, "Moderate": 25, "Severe": 30, "Critical": 35}
            size = sizes.get(damage_point.severity, 20)

            # Draw outer circle (severity color)
            outer_id = self.canvas.create_oval(
                canvas_x - size // 2, canvas_y - size // 2,
                canvas_x + size // 2, canvas_y + size // 2,
                fill=severity_color,
                outline="#2c3e50",
                width=3,
                tags=(f"damage_{damage_point.id}", "damage_point")
            )

            # Draw inner circle (damage type color)
            inner_size = size // 2
            inner_id = self.canvas.create_oval(
                canvas_x - inner_size // 2, canvas_y - inner_size // 2,
                canvas_x + inner_size // 2, canvas_y + inner_size // 2,
                fill=type_color,
                outline="white",
                width=2,
                tags=(f"damage_{damage_point.id}", "damage_point")
            )

            # Draw number
            number_id = self.canvas.create_text(
                canvas_x, canvas_y,
                text=str(damage_point.number),
                font=("Arial", 10, "bold"),
                fill="white",
                tags=(f"damage_{damage_point.id}", "damage_point")
            )

        except Exception as e:
            logger.error(f"Failed to draw damage point: {e}")

    def _redraw_damage_points(self):
        """Redraw all damage points"""
        # Clear existing damage points
        self.canvas.delete("damage_point")

        # Redraw all points
        for damage_point in self.damage_points:
            self._draw_damage_point(damage_point)

    def _find_damage_point_near(self, canvas_x: int, canvas_y: int) -> Optional[SimpleDamagePoint]:
        """Find damage point near canvas coordinates"""
        threshold = 30  # pixels

        for damage_point in self.damage_points:
            point_x, point_y = self._relative_to_canvas(damage_point.x, damage_point.y)
            distance = math.sqrt((canvas_x - point_x) ** 2 + (canvas_y - point_y) ** 2)

            if distance <= threshold:
                return damage_point

        return None

    def _remove_damage_point(self, damage_point: SimpleDamagePoint):
        """Remove a damage point"""
        try:
            # Remove from list
            if damage_point in self.damage_points:
                self.damage_points.remove(damage_point)

            # Remove from canvas
            self.canvas.delete(f"damage_{damage_point.id}")

            # Update damage list
            self._update_damage_list()

            logger.info(f"Removed damage point #{damage_point.number}")

        except Exception as e:
            logger.error(f"Failed to remove damage point: {e}")

    def _edit_damage_point(self, damage_point: SimpleDamagePoint):
        """Edit damage point details"""
        DamagePointEditDialog(self.parent, damage_point, self._on_damage_point_updated)

    def _on_damage_point_updated(self, damage_point: SimpleDamagePoint):
        """Handle damage point update"""
        self._redraw_damage_points()
        self._update_damage_list()

    def _update_damage_list(self):
        """Update the damage points list"""
        # Clear existing items
        for item in self.damage_tree.get_children():
            self.damage_tree.delete(item)

        # Add damage points
        for damage_point in sorted(self.damage_points, key=lambda p: p.number):
            time_str = datetime.fromisoformat(damage_point.timestamp).strftime("%H:%M")

            self.damage_tree.insert(
                "",
                tk.END,
                values=(
                    damage_point.number,
                    damage_point.damage_type,
                    damage_point.severity,
                    time_str
                ),
                tags=(damage_point.id,)
            )

        # Update summary
        self.summary_label.config(text=f"Total damage points: {len(self.damage_points)}")

    def _on_damage_type_change(self):
        """Handle damage type change"""
        self.current_damage_type = self.damage_type_var.get()

    def _on_severity_change(self):
        """Handle severity change"""
        self.current_severity = self.severity_var.get()

    def _clear_all_damage(self):
        """Clear all damage points"""
        if not self.damage_points:
            return

        if messagebox.askyesno("Clear All", f"Remove all {len(self.damage_points)} damage points?"):
            self.damage_points.clear()
            self.next_damage_number = 1
            self.canvas.delete("damage_point")
            self._update_damage_list()

    def _undo_last_damage(self):
        """Remove the last added damage point"""
        if self.damage_points:
            last_point = max(self.damage_points, key=lambda p: p.number)
            self._remove_damage_point(last_point)

    def _on_damage_point_double_click(self, event):
        """Handle double click on damage list"""
        selected_item = self.damage_tree.selection()
        if selected_item:
            # Get damage point ID from tags
            item_tags = self.damage_tree.item(selected_item[0], "tags")
            if item_tags:
                damage_id = item_tags[0]
                damage_point = next((p for p in self.damage_points if p.id == damage_id), None)
                if damage_point:
                    self._edit_damage_point(damage_point)

    def _on_damage_point_right_click(self, event):
        """Handle right click on damage list"""
        selected_item = self.damage_tree.selection()
        if selected_item:
            item_tags = self.damage_tree.item(selected_item[0], "tags")
            if item_tags:
                damage_id = item_tags[0]
                damage_point = next((p for p in self.damage_points if p.id == damage_id), None)
                if damage_point:
                    if messagebox.askyesno("Remove Damage", f"Remove damage point #{damage_point.number}?"):
                        self._remove_damage_point(damage_point)

    def _save_report(self):
        """Save the damage report"""
        try:
            if not self.damage_points:
                messagebox.showwarning("No Damage", "No damage points to save.")
                return

            # Create report data
            report_data = {
                'vehicle_id': self.vehicle_id,
                'inspection_date': datetime.now().isoformat(),
                'total_damage_points': len(self.damage_points),
                'damage_points': [point.to_dict() for point in self.damage_points],
                'summary': {
                    'minor': len([p for p in self.damage_points if p.severity == "Minor"]),
                    'moderate': len([p for p in self.damage_points if p.severity == "Moderate"]),
                    'severe': len([p for p in self.damage_points if p.severity == "Severe"]),
                    'critical': len([p for p in self.damage_points if p.severity == "Critical"])
                }
            }

            # Save to file (in real app, save to database)
            reports_dir = Path("data/damage_reports")
            reports_dir.mkdir(parents=True, exist_ok=True)

            filename = f"vehicle_{self.vehicle_id}_damage_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = reports_dir / filename

            with open(filepath, 'w') as f:
                json.dump(report_data, f, indent=2)

            # Show success message
            messagebox.showinfo(
                "Report Saved",
                f"Damage report saved successfully!\n\n"
                f"• {len(self.damage_points)} damage points recorded\n"
                f"• Saved to: {filename}"
            )

            logger.info(f"Damage report saved: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save damage report: {e}")
            messagebox.showerror("Save Error", f"Failed to save report: {e}")

    def _on_back(self):
        """Handle back button"""
        if self.damage_points:
            if not messagebox.askyesno("Unsaved Changes", "You have unsaved damage points. Go back anyway?"):
                return

        self.destroy()
        if self.callback:
            self.callback()

    def destroy(self):
        """Clean up resources"""
        if self.frame:
            self.frame.destroy()


class DamagePointEditDialog:
    """Simple dialog for editing damage point details"""

    def __init__(self, parent: tk.Widget, damage_point: SimpleDamagePoint,
                 callback: Callable[[SimpleDamagePoint], None]):
        self.parent = parent
        self.damage_point = damage_point
        self.callback = callback

        self._create_dialog()

    def _create_dialog(self):
        """Create the edit dialog"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title(f"Edit Damage Point #{self.damage_point.number}")
        self.dialog.geometry("400x350")
        self.dialog.resizable(False, False)
        self.dialog.grab_set()

        # Center the dialog
        self.dialog.transient(self.parent)

        main_frame = tk.Frame(self.dialog, padx=20, pady=20, bg="#f0f0f0")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Title
        title_label = tk.Label(
            main_frame,
            text=f"Damage Point #{self.damage_point.number}",
            font=("Arial", 16, "bold"),
            bg="#f0f0f0"
        )
        title_label.pack(pady=(0, 20))

        # Damage type
        tk.Label(main_frame, text="Damage Type:", font=("Arial", 12, "bold"), bg="#f0f0f0").pack(anchor=tk.W,
                                                                                                 pady=(0, 5))

        self.damage_type_var = tk.StringVar(value=self.damage_point.damage_type)
        damage_types = ["Scratch", "Dent", "Crack", "Rust", "Paint", "Electrical", "Other"]
        damage_combo = ttk.Combobox(main_frame, textvariable=self.damage_type_var,
                                    values=damage_types, state="readonly", width=30)
        damage_combo.pack(anchor=tk.W, pady=(0, 15))

        # Severity
        tk.Label(main_frame, text="Severity:", font=("Arial", 12, "bold"), bg="#f0f0f0").pack(anchor=tk.W, pady=(0, 5))

        self.severity_var = tk.StringVar(value=self.damage_point.severity)
        severities = ["Minor", "Moderate", "Severe", "Critical"]
        severity_combo = ttk.Combobox(main_frame, textvariable=self.severity_var,
                                      values=severities, state="readonly", width=30)
        severity_combo.pack(anchor=tk.W, pady=(0, 15))

        # Description
        tk.Label(main_frame, text="Description:", font=("Arial", 12, "bold"), bg="#f0f0f0").pack(anchor=tk.W,
                                                                                                 pady=(0, 5))

        self.description_text = tk.Text(main_frame, width=40, height=6, font=("Arial", 10))
        self.description_text.pack(pady=(0, 20))
        self.description_text.insert("1.0", self.damage_point.description)

        # Buttons
        button_frame = tk.Frame(main_frame, bg="#f0f0f0")
        button_frame.pack(fill=tk.X)

        save_btn = tk.Button(
            button_frame,
            text="💾 Save Changes",
            font=("Arial", 12, "bold"),
            bg="#27ae60",
            fg="white",
            padx=20,
            pady=8,
            command=self._save_changes
        )
        save_btn.pack(side=tk.LEFT, padx=(0, 10))

        cancel_btn = tk.Button(
            button_frame,
            text="❌ Cancel",
            font=("Arial", 12),
            bg="#95a5a6",
            fg="white",
            padx=20,
            pady=8,
            command=self.dialog.destroy
        )
        cancel_btn.pack(side=tk.RIGHT)

    def _save_changes(self):
        """Save changes to damage point"""
        try:
            # Update damage point
            self.damage_point.damage_type = self.damage_type_var.get()
            self.damage_point.severity = self.severity_var.get()
            self.damage_point.description = self.description_text.get("1.0", tk.END).strip()

            # Call callback
            if self.callback:
                self.callback(self.damage_point)

            self.dialog.destroy()

        except Exception as e:
            logger.error(f"Failed to save damage point changes: {e}")
            messagebox.showerror("Error", f"Failed to save changes: {e}")


# Usage function
def show_simple_damage_marker(parent: tk.Widget, vehicle_id: int, callback: Callable):
    """Show the simple damage marker interface"""
    return TouchFriendlyDamageMarker(parent, vehicle_id, callback)