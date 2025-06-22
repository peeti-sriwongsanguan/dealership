# ui/screens/inspection/damage_inspector.py
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import cv2
import numpy as np
from PIL import Image, ImageTk, ImageDraw, ImageFont
import json
import logging
from typing import List, Dict, Tuple, Optional, Callable, Any
from pathlib import Path
from datetime import datetime
import math
import uuid

logger = logging.getLogger(__name__)


class DamagePoint:
    """Represents a damage point on the vehicle"""

    def __init__(self, x: float, y: float, damage_type: str, severity: str,
                 description: str = "", timestamp: str = None):
        self.x = x  # Relative position (0-1)
        self.y = y  # Relative position (0-1)
        self.damage_type = damage_type
        self.severity = severity
        self.description = description
        self.timestamp = timestamp or datetime.now().isoformat()
        self.id = f"damage_{uuid.uuid4().hex[:8]}"
        self.estimated_cost = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'damage_type': self.damage_type,
            'severity': self.severity,
            'description': self.description,
            'timestamp': self.timestamp,
            'estimated_cost': self.estimated_cost
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DamagePoint':
        """Create from dictionary"""
        point = cls(
            data['x'], data['y'],
            data['damage_type'], data['severity'],
            data.get('description', ''),
            data.get('timestamp')
        )
        point.id = data.get('id', point.id)
        point.estimated_cost = data.get('estimated_cost', 0.0)
        return point

    def estimate_repair_cost(self) -> float:
        """Estimate repair cost based on damage type and severity"""
        base_costs = {
            'Scratch': 75,
            'Dent': 150,
            'Crack': 200,
            'Rust': 250,
            'Paint': 100,
            'Glass': 300,
            'Electrical': 400,
            'Other': 100
        }

        severity_multipliers = {
            'Minor': 1.0,
            'Moderate': 1.8,
            'Severe': 3.0,
            'Critical': 4.5
        }

        base_cost = base_costs.get(self.damage_type, 100)
        multiplier = severity_multipliers.get(self.severity, 1.0)

        self.estimated_cost = round(base_cost * multiplier, 2)
        return self.estimated_cost


class VehicleTemplateManager:
    """Manages vehicle template images"""

    def __init__(self, templates_dir: str = "assets/vehicle_templates"):
        self.templates_dir = Path(templates_dir)
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, Dict[str, str]]:
        """Load available vehicle templates"""
        templates = {
            'truck': {
                'side': 'truck_side.png',
                'front': 'truck_front.png',
                'rear': 'truck_rear.png',
                'top': 'truck_top.png'
            },
            'car': {
                'side': 'car_side.png',
                'front': 'car_front.png',
                'rear': 'car_rear.png',
                'top': 'car_top.png'
            },
            'van': {
                'side': 'van_side.png',
                'front': 'van_front.png',
                'rear': 'van_rear.png',
                'top': 'van_top.png'
            },
            'motorcycle': {
                'side': 'motorcycle_side.png',
                'front': 'motorcycle_front.png'
            }
        }

        # Create default templates if they don't exist
        self._ensure_templates_exist()
        return templates

    def _ensure_templates_exist(self):
        """Create default vehicle templates if they don't exist"""
        self.templates_dir.mkdir(parents=True, exist_ok=True)

        # Create simple vehicle outlines if templates don't exist
        for vehicle_type, views in self.templates.items():
            for view, filename in views.items():
                filepath = self.templates_dir / filename
                if not filepath.exists():
                    self._create_default_template(filepath, vehicle_type, view)

    def _create_default_template(self, filepath: Path, vehicle_type: str, view: str):
        """Create a default vehicle template"""
        try:
            # Create a basic vehicle outline
            width, height = 800, 600
            img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
            draw = ImageDraw.Draw(img)

            # Draw basic vehicle outline based on type and view
            if vehicle_type == 'truck':
                if view == 'side':
                    self._draw_truck_side(draw, width, height)
                elif view == 'front':
                    self._draw_truck_front(draw, width, height)
                elif view == 'rear':
                    self._draw_truck_rear(draw, width, height)
                elif view == 'top':
                    self._draw_truck_top(draw, width, height)
            elif vehicle_type == 'car':
                if view == 'side':
                    self._draw_car_side(draw, width, height)
                elif view == 'front':
                    self._draw_car_front(draw, width, height)
                elif view == 'rear':
                    self._draw_car_rear(draw, width, height)
                elif view == 'top':
                    self._draw_car_top(draw, width, height)
            elif vehicle_type == 'van':
                if view == 'side':
                    self._draw_van_side(draw, width, height)
                elif view == 'front':
                    self._draw_van_front(draw, width, height)
                elif view == 'rear':
                    self._draw_van_rear(draw, width, height)
                elif view == 'top':
                    self._draw_van_top(draw, width, height)

            img.save(filepath)
            logger.info(f"Created default template: {filepath}")

        except Exception as e:
            logger.error(f"Failed to create template {filepath}: {e}")

    def _draw_truck_side(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw truck side view"""
        # Main cab
        cab_x1, cab_y1 = width * 0.1, height * 0.3
        cab_x2, cab_y2 = width * 0.35, height * 0.7
        draw.rectangle([cab_x1, cab_y1, cab_x2, cab_y2], outline='black', width=3)

        # Trailer
        trailer_x1, trailer_y1 = width * 0.35, height * 0.25
        trailer_x2, trailer_y2 = width * 0.85, height * 0.7
        draw.rectangle([trailer_x1, trailer_y1, trailer_x2, trailer_y2], outline='black', width=3)

        # Wheels
        wheel_y = height * 0.7
        wheel_radius = 25
        # Cab wheels
        draw.ellipse([width * 0.15 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.15 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)
        draw.ellipse([width * 0.28 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.28 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)
        # Trailer wheels
        draw.ellipse([width * 0.65 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.65 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)
        draw.ellipse([width * 0.75 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.75 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)

    def _draw_truck_front(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw truck front view"""
        # Main outline
        truck_x1, truck_y1 = width * 0.2, height * 0.2
        truck_x2, truck_y2 = width * 0.8, height * 0.8
        draw.rectangle([truck_x1, truck_y1, truck_x2, truck_y2], outline='black', width=3)

        # Windshield
        wind_x1, wind_y1 = width * 0.25, height * 0.25
        wind_x2, wind_y2 = width * 0.75, height * 0.45
        draw.rectangle([wind_x1, wind_y1, wind_x2, wind_y2], outline='black', width=2)

        # Grille
        grille_x1, grille_y1 = width * 0.3, height * 0.5
        grille_x2, grille_y2 = width * 0.7, height * 0.65
        draw.rectangle([grille_x1, grille_y1, grille_x2, grille_y2], outline='black', width=2)

        # Headlights
        draw.ellipse([width * 0.22, height * 0.55, width * 0.28, height * 0.62],
                     outline='black', width=2)
        draw.ellipse([width * 0.72, height * 0.55, width * 0.78, height * 0.62],
                     outline='black', width=2)

    def _draw_truck_rear(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw truck rear view"""
        # Main outline (similar to front)
        truck_x1, truck_y1 = width * 0.2, height * 0.2
        truck_x2, truck_y2 = width * 0.8, height * 0.8
        draw.rectangle([truck_x1, truck_y1, truck_x2, truck_y2], outline='black', width=3)

        # Rear doors
        door_x = width * 0.5
        draw.line([door_x, truck_y1, door_x, truck_y2], fill='black', width=2)

        # Tail lights
        draw.rectangle([width * 0.22, height * 0.6, width * 0.28, height * 0.7],
                       outline='red', width=2)
        draw.rectangle([width * 0.72, height * 0.6, width * 0.78, height * 0.7],
                       outline='red', width=2)

    def _draw_truck_top(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw truck top view"""
        # Cab
        cab_x1, cab_y1 = width * 0.2, height * 0.1
        cab_x2, cab_y2 = width * 0.8, height * 0.35
        draw.rectangle([cab_x1, cab_y1, cab_x2, cab_y2], outline='black', width=3)

        # Trailer
        trailer_x1, trailer_y1 = width * 0.15, height * 0.35
        trailer_x2, trailer_y2 = width * 0.85, height * 0.9
        draw.rectangle([trailer_x1, trailer_y1, trailer_x2, trailer_y2], outline='black', width=3)

    def _draw_van_side(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw van side view"""
        # Main body
        body_x1, body_y1 = width * 0.1, height * 0.3
        body_x2, body_y2 = width * 0.85, height * 0.7
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], outline='black', width=3)

        # Front section
        front_x1, front_y1 = width * 0.05, height * 0.35
        front_x2, front_y2 = width * 0.15, height * 0.65
        draw.rectangle([front_x1, front_y1, front_x2, front_y2], outline='black', width=3)

        # Windshield
        draw.line([front_x2, front_y1, front_x2 + 30, front_y1 - 20], fill='black', width=2)
        draw.line([front_x2 + 30, front_y1 - 20, body_x1 + 50, body_y1], fill='black', width=2)

        # Wheels
        wheel_y = height * 0.7
        wheel_radius = 25
        draw.ellipse([width * 0.2 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.2 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)
        draw.ellipse([width * 0.7 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.7 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)

        # Side door
        door_x = width * 0.5
        draw.line([door_x, body_y1, door_x, body_y2], fill='black', width=2)

    def _draw_van_front(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw van front view"""
        # Main outline
        van_x1, van_y1 = width * 0.2, height * 0.25
        van_x2, van_y2 = width * 0.8, height * 0.8
        draw.rectangle([van_x1, van_y1, van_x2, van_y2], outline='black', width=3)

        # Windshield
        wind_x1, wind_y1 = width * 0.25, height * 0.15
        wind_x2, wind_y2 = width * 0.75, height * 0.3
        draw.rectangle([wind_x1, wind_y1, wind_x2, wind_y2], outline='black', width=2)

        # Grille
        grille_x1, grille_y1 = width * 0.35, height * 0.5
        grille_x2, grille_y2 = width * 0.65, height * 0.65
        draw.rectangle([grille_x1, grille_y1, grille_x2, grille_y2], outline='black', width=2)

        # Headlights
        draw.ellipse([width * 0.25, height * 0.55, width * 0.32, height * 0.62],
                     outline='black', width=2)
        draw.ellipse([width * 0.68, height * 0.55, width * 0.75, height * 0.62],
                     outline='black', width=2)

    def _draw_van_rear(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw van rear view"""
        # Main outline
        van_x1, van_y1 = width * 0.2, height * 0.25
        van_x2, van_y2 = width * 0.8, height * 0.8
        draw.rectangle([van_x1, van_y1, van_x2, van_y2], outline='black', width=3)

        # Rear doors
        door_x = width * 0.5
        draw.line([door_x, van_y1, door_x, van_y2], fill='black', width=2)

        # Door handles
        draw.rectangle([door_x - 20, (van_y1 + van_y2) // 2 - 3,
                        door_x - 15, (van_y1 + van_y2) // 2 + 3], fill='black')
        draw.rectangle([door_x + 15, (van_y1 + van_y2) // 2 - 3,
                        door_x + 20, (van_y1 + van_y2) // 2 + 3], fill='black')

        # Tail lights
        draw.rectangle([width * 0.22, height * 0.6, width * 0.28, height * 0.7],
                       outline='red', width=2)
        draw.rectangle([width * 0.72, height * 0.6, width * 0.78, height * 0.7],
                       outline='red', width=2)

    def _draw_van_top(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw van top view"""
        # Main body
        body_x1, body_y1 = width * 0.25, height * 0.1
        body_x2, body_y2 = width * 0.75, height * 0.9
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], outline='black', width=3)

        # Front section
        front_x1, front_y1 = width * 0.3, height * 0.05
        front_x2, front_y2 = width * 0.7, height * 0.15
        draw.rectangle([front_x1, front_y1, front_x2, front_y2], outline='black', width=2)

        # Side doors (lines)
        door_y1 = height * 0.4
        door_y2 = height * 0.7
        draw.line([body_x1, door_y1, body_x1 - 10, door_y1], fill='black', width=2)
        draw.line([body_x1, door_y2, body_x1 - 10, door_y2], fill='black', width=2)
        draw.line([body_x2, door_y1, body_x2 + 10, door_y1], fill='black', width=2)
        draw.line([body_x2, door_y2, body_x2 + 10, door_y2], fill='black', width=2)

    def _draw_car_side(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw car side view"""
        # Main body
        body_x1, body_y1 = width * 0.15, height * 0.4
        body_x2, body_y2 = width * 0.85, height * 0.7
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], outline='black', width=3)

        # Roof
        roof_x1, roof_y1 = width * 0.25, height * 0.25
        roof_x2, roof_y2 = width * 0.75, height * 0.4
        draw.rectangle([roof_x1, roof_y1, roof_x2, roof_y2], outline='black', width=3)

        # Windows
        draw.rectangle([width * 0.28, height * 0.28, width * 0.45, height * 0.38],
                       outline='black', width=2)
        draw.rectangle([width * 0.55, height * 0.28, width * 0.72, height * 0.38],
                       outline='black', width=2)

        # Wheels
        wheel_y = height * 0.7
        wheel_radius = 20
        draw.ellipse([width * 0.25 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.25 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)
        draw.ellipse([width * 0.75 - wheel_radius, wheel_y - wheel_radius,
                      width * 0.75 + wheel_radius, wheel_y + wheel_radius],
                     outline='black', width=3)

    def _draw_car_front(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw car front view"""
        # Main outline
        car_x1, car_y1 = width * 0.25, height * 0.3
        car_x2, car_y2 = width * 0.75, height * 0.8
        draw.rectangle([car_x1, car_y1, car_x2, car_y2], outline='black', width=3)

        # Windshield
        wind_x1, wind_y1 = width * 0.3, height * 0.2
        wind_x2, wind_y2 = width * 0.7, height * 0.35
        draw.polygon([wind_x1, wind_y1, wind_x2, wind_y1,
                      car_x2, car_y1, car_x1, car_y1], outline='black', width=2)

        # Grille
        grille_x1, grille_y1 = width * 0.35, height * 0.5
        grille_x2, grille_y2 = width * 0.65, height * 0.65
        draw.rectangle([grille_x1, grille_y1, grille_x2, grille_y2], outline='black', width=2)

        # Headlights
        draw.ellipse([width * 0.28, height * 0.55, width * 0.33, height * 0.62],
                     outline='black', width=2)
        draw.ellipse([width * 0.67, height * 0.55, width * 0.72, height * 0.62],
                     outline='black', width=2)

    def _draw_car_rear(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw car rear view"""
        # Similar to front but with tail lights
        car_x1, car_y1 = width * 0.25, height * 0.3
        car_x2, car_y2 = width * 0.75, height * 0.8
        draw.rectangle([car_x1, car_y1, car_x2, car_y2], outline='black', width=3)

        # Rear window
        wind_x1, wind_y1 = width * 0.3, height * 0.2
        wind_x2, wind_y2 = width * 0.7, height * 0.35
        draw.polygon([wind_x1, wind_y1, wind_x2, wind_y1,
                      car_x2, car_y1, car_x1, car_y1], outline='black', width=2)

        # Tail lights
        draw.rectangle([width * 0.27, height * 0.6, width * 0.32, height * 0.7],
                       outline='red', width=2)
        draw.rectangle([width * 0.68, height * 0.6, width * 0.73, height * 0.7],
                       outline='red', width=2)

    def _draw_car_top(self, draw: ImageDraw.Draw, width: int, height: int):
        """Draw car top view"""
        # Main body
        body_x1, body_y1 = width * 0.3, height * 0.15
        body_x2, body_y2 = width * 0.7, height * 0.85
        draw.rectangle([body_x1, body_y1, body_x2, body_y2], outline='black', width=3)

        # Hood
        hood_x1, hood_y1 = width * 0.32, height * 0.1
        hood_x2, hood_y2 = width * 0.68, height * 0.25
        draw.rectangle([hood_x1, hood_y1, hood_x2, hood_y2], outline='black', width=2)

        # Trunk
        trunk_x1, trunk_y1 = width * 0.32, height * 0.75
        trunk_x2, trunk_y2 = width * 0.68, height * 0.9
        draw.rectangle([trunk_x1, trunk_y1, trunk_x2, trunk_y2], outline='black', width=2)

    def get_template_path(self, vehicle_type: str, view: str) -> Optional[Path]:
        """Get path to template file"""
        if vehicle_type in self.templates and view in self.templates[vehicle_type]:
            return self.templates_dir / self.templates[vehicle_type][view]
        return None

    def get_available_types(self) -> List[str]:
        """Get list of available vehicle types"""
        return list(self.templates.keys())

    def get_available_views(self, vehicle_type: str) -> List[str]:
        """Get list of available views for a vehicle type"""
        return list(self.templates.get(vehicle_type, {}).keys())


class DamageCanvas(tk.Canvas):
    """Interactive canvas for marking damage on vehicle templates"""

    def __init__(self, parent: tk.Widget, **kwargs):
        super().__init__(parent, **kwargs)

        self.damage_points: List[DamagePoint] = []
        self.current_damage_type = "Scratch"
        self.current_severity = "Minor"
        self.drawing_mode = False
        self.drawing_path: List[Tuple[int, int]] = []
        self.template_image = None
        self.template_photo = None
        self.canvas_width = 800
        self.canvas_height = 600
        self.scale_factor = 1.0
        self.offset_x = 0
        self.offset_y = 0

        # Colors for different damage types
        self.damage_colors = {
            "Scratch": "#FF6B6B",
            "Dent": "#4ECDC4",
            "Crack": "#45B7D1",
            "Rust": "#96CEB4",
            "Paint": "#FECA57",
            "Glass": "#FF9FF3",
            "Electrical": "#54A0FF",
            "Other": "#C44569"
        }

        # Severity indicators
        self.severity_sizes = {
            "Minor": 15,
            "Moderate": 25,
            "Severe": 35,
            "Critical": 50
        }

        self.configure(width=self.canvas_width, height=self.canvas_height,
                       bg='white', highlightthickness=1, highlightbackground='gray')

        # Bind events
        self.bind("<Button-1>", self._on_click)
        self.bind("<B1-Motion>", self._on_drag)
        self.bind("<ButtonRelease-1>", self._on_release)
        self.bind("<Button-3>", self._on_right_click)  # Right click for context menu
        self.bind("<Double-Button-1>", self._on_double_click)

        # Enable focus for keyboard events
        self.focus_set()
        self.bind("<Key>", self._on_key_press)

    def load_template(self, template_path: Path):
        """Load vehicle template image"""
        try:
            if not template_path.exists():
                logger.warning(f"Template not found: {template_path}")
                return False

            # Load and resize image to fit canvas
            self.template_image = Image.open(template_path)

            # Calculate scale to fit canvas while maintaining aspect ratio
            img_width, img_height = self.template_image.size
            scale_w = self.canvas_width / img_width
            scale_h = self.canvas_height / img_height
            self.scale_factor = min(scale_w, scale_h) * 0.9  # 90% to leave some margin

            # Resize image
            new_width = int(img_width * self.scale_factor)
            new_height = int(img_height * self.scale_factor)
            resized_image = self.template_image.resize((new_width, new_height),
                                                       Image.Resampling.LANCZOS)

            # Center image on canvas
            self.offset_x = (self.canvas_width - new_width) // 2
            self.offset_y = (self.canvas_height - new_height) // 2

            # Convert to PhotoImage
            self.template_photo = ImageTk.PhotoImage(resized_image)

            # Clear canvas and draw template
            self.delete("all")
            self.create_image(self.offset_x, self.offset_y, anchor=tk.NW,
                              image=self.template_photo, tags="template")

            # Redraw damage points
            self._redraw_damage_points()

            logger.info(f"Template loaded: {template_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to load template: {e}")
            return False

    def _canvas_to_relative(self, canvas_x: int, canvas_y: int) -> Tuple[float, float]:
        """Convert canvas coordinates to relative coordinates (0-1)"""
        if not self.template_image:
            return 0.0, 0.0

        # Account for offset and scaling
        rel_x = (canvas_x - self.offset_x) / (self.template_image.width * self.scale_factor)
        rel_y = (canvas_y - self.offset_y) / (self.template_image.height * self.scale_factor)

        # Clamp to 0-1 range
        rel_x = max(0.0, min(1.0, rel_x))
        rel_y = max(0.0, min(1.0, rel_y))

        return rel_x, rel_y

    def _relative_to_canvas(self, rel_x: float, rel_y: float) -> Tuple[int, int]:
        """Convert relative coordinates to canvas coordinates"""
        if not self.template_image:
            return 0, 0

        canvas_x = int(rel_x * self.template_image.width * self.scale_factor + self.offset_x)
        canvas_y = int(rel_y * self.template_image.height * self.scale_factor + self.offset_y)

        return canvas_x, canvas_y

    def _on_click(self, event):
        """Handle mouse click"""
        if self.drawing_mode:
            # Start drawing path
            self.drawing_path = [(event.x, event.y)]
        else:
            # Add damage point
            self._add_damage_point(event.x, event.y)

    def _on_drag(self, event):
        """Handle mouse drag"""
        if self.drawing_mode and self.drawing_path:
            # Add point to drawing path
            self.drawing_path.append((event.x, event.y))

            # Draw line segment
            if len(self.drawing_path) > 1:
                x1, y1 = self.drawing_path[-2]
                x2, y2 = self.drawing_path[-1]
                self.create_line(x1, y1, x2, y2,
                                 fill=self.damage_colors[self.current_damage_type],
                                 width=3, tags="drawing")

    def _on_release(self, event):
        """Handle mouse release"""
        if self.drawing_mode and self.drawing_path:
            # Finish drawing and create damage area
            self._create_damage_area_from_path()
            self.drawing_path = []

    def _on_right_click(self, event):
        """Handle right click - show context menu"""
        # Find damage point near click
        damage_point = self._find_damage_point_at(event.x, event.y)

        if damage_point:
            self._show_damage_context_menu(event, damage_point)

    def _on_double_click(self, event):
        """Handle double click - edit damage point"""
        damage_point = self._find_damage_point_at(event.x, event.y)

        if damage_point:
            self._edit_damage_point(damage_point)

    def _on_key_press(self, event):
        """Handle key press"""
        if event.keysym == "Delete":
            # Delete selected damage points
            selected_points = [p for p in self.damage_points if hasattr(p, 'selected') and p.selected]
            for point in selected_points:
                self._remove_damage_point(point)
        elif event.keysym == "Escape":
            # Cancel drawing mode
            self.drawing_mode = False
            self.delete("drawing")
            self.drawing_path = []

    def _add_damage_point(self, canvas_x: int, canvas_y: int):
        """Add a damage point at the specified location"""
        try:
            # Convert to relative coordinates
            rel_x, rel_y = self._canvas_to_relative(canvas_x, canvas_y)

            # Create damage point
            damage_point = DamagePoint(
                rel_x, rel_y,
                self.current_damage_type,
                self.current_severity,
                f"{self.current_damage_type} - {self.current_severity}"
            )

            # Estimate cost
            damage_point.estimate_repair_cost()

            self.damage_points.append(damage_point)

            # Draw the damage point
            self._draw_damage_point(damage_point)

            logger.info(f"Added damage point: {damage_point.damage_type} at ({rel_x:.3f}, {rel_y:.3f})")

        except Exception as e:
            logger.error(f"Failed to add damage point: {e}")

    def _draw_damage_point(self, damage_point: DamagePoint):
        """Draw a damage point on the canvas"""
        try:
            # Convert to canvas coordinates
            canvas_x, canvas_y = self._relative_to_canvas(damage_point.x, damage_point.y)

            # Get color and size
            color = self.damage_colors.get(damage_point.damage_type, "#FF0000")
            size = self.severity_sizes.get(damage_point.severity, 20)

            # Draw circle
            circle_id = self.create_oval(
                canvas_x - size // 2, canvas_y - size // 2,
                canvas_x + size // 2, canvas_y + size // 2,
                fill=color, outline="black", width=2,
                tags=("damage_point", damage_point.id)
            )

            # Draw severity indicator (inner circle)
            inner_size = max(3, size // 4)
            self.create_oval(
                canvas_x - inner_size // 2, canvas_y - inner_size // 2,
                canvas_x + inner_size // 2, canvas_y + inner_size // 2,
                fill="white", outline="black", width=1,
                tags=("damage_point", damage_point.id)
            )

            # Add damage type text
            self.create_text(
                canvas_x, canvas_y + size // 2 + 15,
                text=damage_point.damage_type[:3].upper(),
                font=("Arial", 8, "bold"),
                fill="black",
                tags=("damage_point", damage_point.id)
            )

        except Exception as e:
            logger.error(f"Failed to draw damage point: {e}")

    def _redraw_damage_points(self):
        """Redraw all damage points"""
        # Remove existing damage point drawings
        self.delete("damage_point")

        # Redraw all points
        for damage_point in self.damage_points:
            self._draw_damage_point(damage_point)

    def _find_damage_point_at(self, canvas_x: int, canvas_y: int) -> Optional[DamagePoint]:
        """Find damage point near the specified canvas coordinates"""
        threshold = 30  # pixels

        for damage_point in self.damage_points:
            point_x, point_y = self._relative_to_canvas(damage_point.x, damage_point.y)
            distance = math.sqrt((canvas_x - point_x) ** 2 + (canvas_y - point_y) ** 2)

            if distance <= threshold:
                return damage_point

        return None

    def _show_damage_context_menu(self, event, damage_point: DamagePoint):
        """Show context menu for damage point"""
        context_menu = tk.Menu(self, tearoff=0)

        context_menu.add_command(
            label=f"Edit {damage_point.damage_type}",
            command=lambda: self._edit_damage_point(damage_point)
        )

        context_menu.add_command(
            label="Delete",
            command=lambda: self._remove_damage_point(damage_point)
        )

        context_menu.add_separator()

        context_menu.add_command(
            label="Add Description",
            command=lambda: self._add_description(damage_point)
        )

        context_menu.add_command(
            label=f"Cost Estimate: ${damage_point.estimated_cost}",
            state="disabled"
        )

        try:
            context_menu.tk_popup(event.x_root, event.y_root)
        finally:
            context_menu.grab_release()

    def _edit_damage_point(self, damage_point: DamagePoint):
        """Edit damage point properties"""
        DamagePointEditor(self, damage_point, self._on_damage_point_updated)

    def _remove_damage_point(self, damage_point: DamagePoint):
        """Remove a damage point"""
        try:
            # Remove from list
            if damage_point in self.damage_points:
                self.damage_points.remove(damage_point)

            # Remove from canvas
            self.delete(damage_point.id)

            # Redraw to ensure clean state
            self._redraw_damage_points()

            logger.info(f"Removed damage point: {damage_point.id}")

        except Exception as e:
            logger.error(f"Failed to remove damage point: {e}")

    def _add_description(self, damage_point: DamagePoint):
        """Add description to damage point"""
        from tkinter.simpledialog import askstring

        description = askstring(
            "Damage Description",
            f"Enter description for {damage_point.damage_type}:",
            initialvalue=damage_point.description
        )

        if description is not None:
            damage_point.description = description
            logger.info(f"Updated description for {damage_point.id}")

    def _on_damage_point_updated(self, damage_point: DamagePoint):
        """Handle damage point update"""
        damage_point.estimate_repair_cost()
        self._redraw_damage_points()

    def _create_damage_area_from_path(self):
        """Create damage area from drawing path"""
        if len(self.drawing_path) < 3:
            return

        # Calculate center of path
        center_x = sum(p[0] for p in self.drawing_path) / len(self.drawing_path)
        center_y = sum(p[1] for p in self.drawing_path) / len(self.drawing_path)

        # Create damage point at center
        self._add_damage_point(int(center_x), int(center_y))

        # Clear drawing
        self.delete("drawing")

    def set_damage_type(self, damage_type: str):
        """Set current damage type"""
        self.current_damage_type = damage_type

    def set_severity(self, severity: str):
        """Set current severity"""
        self.current_severity = severity

    def toggle_drawing_mode(self):
        """Toggle drawing mode"""
        self.drawing_mode = not self.drawing_mode
        if not self.drawing_mode:
            self.delete("drawing")
            self.drawing_path = []

    def clear_damage_points(self):
        """Clear all damage points"""
        self.damage_points.clear()
        self._redraw_damage_points()

    def get_damage_data(self) -> List[Dict[str, Any]]:
        """Get all damage data as dictionaries"""
        return [point.to_dict() for point in self.damage_points]

    def load_damage_data(self, damage_data: List[Dict[str, Any]]):
        """Load damage data from dictionaries"""
        try:
            self.damage_points = [DamagePoint.from_dict(data) for data in damage_data]
            self._redraw_damage_points()
            logger.info(f"Loaded {len(self.damage_points)} damage points")
        except Exception as e:
            logger.error(f"Failed to load damage data: {e}")

    def export_damage_report(self, filepath: Path):
        """Export damage report to JSON"""
        try:
            report_data = {
                'timestamp': datetime.now().isoformat(),
                'total_damage_points': len(self.damage_points),
                'total_estimated_cost': sum(p.estimated_cost for p in self.damage_points),
                'damage_points': self.get_damage_data(),
                'summary': {
                    'by_type': {},
                    'by_severity': {}
                }
            }

            # Generate summary
            for point in self.damage_points:
                # By type
                if point.damage_type not in report_data['summary']['by_type']:
                    report_data['summary']['by_type'][point.damage_type] = {'count': 0, 'cost': 0}
                report_data['summary']['by_type'][point.damage_type]['count'] += 1
                report_data['summary']['by_type'][point.damage_type]['cost'] += point.estimated_cost

                # By severity
                if point.severity not in report_data['summary']['by_severity']:
                    report_data['summary']['by_severity'][point.severity] = {'count': 0, 'cost': 0}
                report_data['summary']['by_severity'][point.severity]['count'] += 1
                report_data['summary']['by_severity'][point.severity]['cost'] += point.estimated_cost

            with open(filepath, 'w') as f:
                json.dump(report_data, f, indent=2)

            logger.info(f"Damage report exported to {filepath}")
            return True

        except Exception as e:
            logger.error(f"Failed to export damage report: {e}")
            return False


class DamagePointEditor:
    """Dialog for editing damage point details"""

    def __init__(self, parent: tk.Widget, damage_point: DamagePoint,
                 callback: Callable[[DamagePoint], None]):
        self.parent = parent
        self.damage_point = damage_point
        self.callback = callback
        self._create_dialog()

    def _create_dialog(self):
        """Create the edit dialog"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title(f"Edit Damage Point")
        self.dialog.geometry("450x400")
        self.dialog.resizable(False, False)
        self.dialog.grab_set()
        self.dialog.transient(self.parent)

        # Center the dialog
        self._center_dialog()

        main_frame = tk.Frame(self.dialog, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Title
        title_label = tk.Label(
            main_frame,
            text=f"Edit Damage Point",
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 20))

        # Damage type
        tk.Label(main_frame, text="Damage Type:", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=(0, 5))

        self.damage_type_var = tk.StringVar(value=self.damage_point.damage_type)
        damage_types = ["Scratch", "Dent", "Crack", "Rust", "Paint", "Glass", "Electrical", "Other"]
        damage_combo = ttk.Combobox(main_frame, textvariable=self.damage_type_var,
                                    values=damage_types, state="readonly", width=40)
        damage_combo.pack(anchor=tk.W, pady=(0, 15))

        # Severity
        tk.Label(main_frame, text="Severity:", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=(0, 5))

        self.severity_var = tk.StringVar(value=self.damage_point.severity)
        severities = ["Minor", "Moderate", "Severe", "Critical"]
        severity_combo = ttk.Combobox(main_frame, textvariable=self.severity_var,
                                      values=severities, state="readonly", width=40)
        severity_combo.pack(anchor=tk.W, pady=(0, 15))

        # Description
        tk.Label(main_frame, text="Description:", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=(0, 5))

        self.description_text = tk.Text(main_frame, width=50, height=6, font=("Arial", 10))
        self.description_text.pack(pady=(0, 15))
        self.description_text.insert("1.0", self.damage_point.description)

        # Cost estimate (read-only)
        cost_frame = tk.Frame(main_frame)
        cost_frame.pack(fill=tk.X, pady=(0, 20))

        tk.Label(cost_frame, text="Estimated Cost:", font=("Arial", 12, "bold")).pack(side=tk.LEFT)
        self.cost_label = tk.Label(cost_frame, text=f"${self.damage_point.estimated_cost:.2f}",
                                   font=("Arial", 12), fg="#e74c3c")
        self.cost_label.pack(side=tk.LEFT, padx=(10, 0))

        # Update cost when severity/type changes
        damage_combo.bind("<<ComboboxSelected>>", self._update_cost_estimate)
        severity_combo.bind("<<ComboboxSelected>>", self._update_cost_estimate)

        # Buttons
        button_frame = tk.Frame(main_frame)
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

    def _center_dialog(self):
        """Center the dialog on screen"""
        self.dialog.update_idletasks()
        width = self.dialog.winfo_width()
        height = self.dialog.winfo_height()
        x = (self.dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (self.dialog.winfo_screenheight() // 2) - (height // 2)
        self.dialog.geometry(f"{width}x{height}+{x}+{y}")

    def _update_cost_estimate(self, event=None):
        """Update cost estimate based on current selections"""
        try:
            # Create temporary damage point to calculate cost
            temp_point = DamagePoint(0, 0, self.damage_type_var.get(), self.severity_var.get())
            temp_point.estimate_repair_cost()
            self.cost_label.config(text=f"${temp_point.estimated_cost:.2f}")
        except Exception as e:
            logger.error(f"Failed to update cost estimate: {e}")

    def _save_changes(self):
        """Save changes to damage point"""
        try:
            # Update damage point
            self.damage_point.damage_type = self.damage_type_var.get()
            self.damage_point.severity = self.severity_var.get()
            self.damage_point.description = self.description_text.get("1.0", tk.END).strip()

            # Recalculate cost
            self.damage_point.estimate_repair_cost()

            # Call callback
            if self.callback:
                self.callback(self.damage_point)

            self.dialog.destroy()

        except Exception as e:
            logger.error(f"Failed to save damage point changes: {e}")
            messagebox.showerror("Error", f"Failed to save changes: {e}")


class DamageInspector:
    """Main damage inspection interface"""

    def __init__(self, parent: tk.Widget, vehicle_id: int, callback: Optional[Callable] = None):
        self.parent = parent
        self.vehicle_id = vehicle_id
        self.callback = callback

        self.template_manager = VehicleTemplateManager()
        self.current_vehicle_type = "van"
        self.current_view = "side"

        self._create_interface()
        self._load_initial_template()

    def _create_interface(self):
        """Create the main interface"""
        self.frame = tk.Frame(self.parent)
        self.frame.pack(fill=tk.BOTH, expand=True)

        # Header
        self._create_header()

        # Main content
        content_frame = tk.Frame(self.frame)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left panel - controls
        self._create_control_panel(content_frame)

        # Right panel - canvas
        self._create_canvas_panel(content_frame)

    def _create_header(self):
        """Create header with title and controls"""
        header_frame = tk.Frame(self.frame, bg="#2c3e50", height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        # Title
        title_label = tk.Label(
            header_frame,
            text="🔍 Advanced Damage Inspector",
            font=("Arial", 20, "bold"),
            bg="#2c3e50",
            fg="white"
        )
        title_label.pack(side=tk.LEFT, padx=20, pady=20)

        # Vehicle info
        info_label = tk.Label(
            header_frame,
            text=f"Vehicle ID: {self.vehicle_id}",
            font=("Arial", 12),
            bg="#2c3e50",
            fg="#bdc3c7"
        )
        info_label.pack(side=tk.LEFT, padx=20, pady=20)

        # Action buttons
        button_frame = tk.Frame(header_frame, bg="#2c3e50")
        button_frame.pack(side=tk.RIGHT, padx=20, pady=20)

        export_btn = tk.Button(
            button_frame,
            text="📄 Export Report",
            font=("Arial", 12, "bold"),
            bg="#3498db",
            fg="white",
            padx=15,
            pady=5,
            command=self._export_report
        )
        export_btn.pack(side=tk.LEFT, padx=5)

        save_btn = tk.Button(
            button_frame,
            text="💾 Save",
            font=("Arial", 12, "bold"),
            bg="#27ae60",
            fg="white",
            padx=15,
            pady=5,
            command=self._save_inspection
        )
        save_btn.pack(side=tk.LEFT, padx=5)

        back_btn = tk.Button(
            button_frame,
            text="← Back",
            font=("Arial", 12),
            bg="#95a5a6",
            fg="white",
            padx=15,
            pady=5,
            command=self._on_back
        )
        back_btn.pack(side=tk.LEFT, padx=5)

    def _create_control_panel(self, parent):
        """Create left control panel"""
        control_frame = tk.Frame(parent, width=300)
        control_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        control_frame.pack_propagate(False)

        # Vehicle template selection
        template_frame = tk.LabelFrame(control_frame, text="Vehicle Template", font=("Arial", 12, "bold"))
        template_frame.pack(fill=tk.X, pady=(0, 10))

        # Vehicle type
        tk.Label(template_frame, text="Type:", font=("Arial", 10, "bold")).pack(anchor=tk.W, padx=10, pady=(10, 5))
        self.vehicle_type_var = tk.StringVar(value=self.current_vehicle_type)
        type_combo = ttk.Combobox(template_frame, textvariable=self.vehicle_type_var,
                                  values=self.template_manager.get_available_types(),
                                  state="readonly", width=25)
        type_combo.pack(padx=10, pady=(0, 10))
        type_combo.bind("<<ComboboxSelected>>", self._on_vehicle_type_changed)

        # View
        tk.Label(template_frame, text="View:", font=("Arial", 10, "bold")).pack(anchor=tk.W, padx=10, pady=(0, 5))
        self.view_var = tk.StringVar(value=self.current_view)
        self.view_combo = ttk.Combobox(template_frame, textvariable=self.view_var,
                                       values=self.template_manager.get_available_views(self.current_vehicle_type),
                                       state="readonly", width=25)
        self.view_combo.pack(padx=10, pady=(0, 10))
        self.view_combo.bind("<<ComboboxSelected>>", self._on_view_changed)

        # Damage marking controls
        damage_frame = tk.LabelFrame(control_frame, text="Damage Marking", font=("Arial", 12, "bold"))
        damage_frame.pack(fill=tk.X, pady=(0, 10))

        # Damage type
        tk.Label(damage_frame, text="Type:", font=("Arial", 10, "bold")).pack(anchor=tk.W, padx=10, pady=(10, 5))
        self.damage_type_var = tk.StringVar(value="Scratch")
        damage_types = ["Scratch", "Dent", "Crack", "Rust", "Paint", "Glass", "Electrical", "Other"]
        damage_type_combo = ttk.Combobox(damage_frame, textvariable=self.damage_type_var,
                                         values=damage_types, state="readonly", width=25)
        damage_type_combo.pack(padx=10, pady=(0, 10))
        damage_type_combo.bind("<<ComboboxSelected>>", self._on_damage_type_changed)

        # Severity
        tk.Label(damage_frame, text="Severity:", font=("Arial", 10, "bold")).pack(anchor=tk.W, padx=10, pady=(0, 5))
        self.severity_var = tk.StringVar(value="Minor")
        severities = ["Minor", "Moderate", "Severe", "Critical"]
        severity_combo = ttk.Combobox(damage_frame, textvariable=self.severity_var,
                                      values=severities, state="readonly", width=25)
        severity_combo.pack(padx=10, pady=(0, 10))
        severity_combo.bind("<<ComboboxSelected>>", self._on_severity_changed)

        # Drawing mode toggle
        self.drawing_mode_var = tk.BooleanVar()
        drawing_check = tk.Checkbutton(
            damage_frame,
            text="Drawing Mode",
            variable=self.drawing_mode_var,
            font=("Arial", 10, "bold"),
            command=self._toggle_drawing_mode
        )
        drawing_check.pack(padx=10, pady=(0, 10))

        # Actions
        action_frame = tk.LabelFrame(control_frame, text="Actions", font=("Arial", 12, "bold"))
        action_frame.pack(fill=tk.X, pady=(0, 10))

        clear_btn = tk.Button(
            action_frame,
            text="🗑️ Clear All",
            font=("Arial", 11, "bold"),
            bg="#e74c3c",
            fg="white",
            width=20,
            command=self._clear_all_damage
        )
        clear_btn.pack(padx=10, pady=10)

        # Damage summary
        summary_frame = tk.LabelFrame(control_frame, text="Summary", font=("Arial", 12, "bold"))
        summary_frame.pack(fill=tk.BOTH, expand=True)

        self.summary_text = tk.Text(summary_frame, width=30, height=10, font=("Arial", 9))
        summary_scrollbar = ttk.Scrollbar(summary_frame, orient="vertical", command=self.summary_text.yview)
        self.summary_text.configure(yscrollcommand=summary_scrollbar.set)

        self.summary_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        summary_scrollbar.pack(side=tk.RIGHT, fill=tk.Y, pady=10)

    def _create_canvas_panel(self, parent):
        """Create right canvas panel"""
        canvas_frame = tk.LabelFrame(parent, text="Vehicle Inspection Canvas", font=("Arial", 12, "bold"))
        canvas_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        # Create damage canvas
        self.damage_canvas = DamageCanvas(canvas_frame, width=800, height=600)
        self.damage_canvas.pack(padx=10, pady=10)

        # Instructions
        instructions = tk.Label(
            canvas_frame,
            text="Click to add damage points • Right-click for options • Double-click to edit",
            font=("Arial", 10),
            fg="#7f8c8d"
        )
        instructions.pack(pady=(0, 10))

    def _load_initial_template(self):
        """Load initial vehicle template"""
        self._load_template()

    def _load_template(self):
        """Load current vehicle template"""
        template_path = self.template_manager.get_template_path(self.current_vehicle_type, self.current_view)
        if template_path:
            success = self.damage_canvas.load_template(template_path)
            if not success:
                messagebox.showwarning("Template Error", f"Failed to load template: {template_path}")
        else:
            messagebox.showwarning("Template Not Found",
                                   f"No template found for {self.current_vehicle_type} {self.current_view}")

    def _on_vehicle_type_changed(self, event=None):
        """Handle vehicle type change"""
        self.current_vehicle_type = self.vehicle_type_var.get()

        # Update available views
        available_views = self.template_manager.get_available_views(self.current_vehicle_type)
        self.view_combo['values'] = available_views

        # Reset to first available view
        if available_views:
            self.current_view = available_views[0]
            self.view_var.set(self.current_view)

        self._load_template()

    def _on_view_changed(self, event=None):
        """Handle view change"""
        self.current_view = self.view_var.get()
        self._load_template()

    def _on_damage_type_changed(self, event=None):
        """Handle damage type change"""
        self.damage_canvas.set_damage_type(self.damage_type_var.get())

    def _on_severity_changed(self, event=None):
        """Handle severity change"""
        self.damage_canvas.set_severity(self.severity_var.get())

    def _toggle_drawing_mode(self):
        """Toggle drawing mode"""
        self.damage_canvas.toggle_drawing_mode()

    def _clear_all_damage(self):
        """Clear all damage points"""
        if self.damage_canvas.damage_points:
            if messagebox.askyesno("Clear All", "Remove all damage points?"):
                self.damage_canvas.clear_damage_points()
                self._update_summary()

    def _update_summary(self):
        """Update damage summary"""
        try:
            self.summary_text.delete("1.0", tk.END)

            damage_points = self.damage_canvas.damage_points
            if not damage_points:
                self.summary_text.insert("1.0", "No damage points recorded.")
                return

            # Overall summary
            total_cost = sum(p.estimated_cost for p in damage_points)
            summary = f"Total Damage Points: {len(damage_points)}\n"
            summary += f"Total Estimated Cost: ${total_cost:.2f}\n\n"

            # By damage type
            type_summary = {}
            for point in damage_points:
                if point.damage_type not in type_summary:
                    type_summary[point.damage_type] = {'count': 0, 'cost': 0}
                type_summary[point.damage_type]['count'] += 1
                type_summary[point.damage_type]['cost'] += point.estimated_cost

            summary += "By Damage Type:\n"
            for damage_type, data in type_summary.items():
                summary += f"  {damage_type}: {data['count']} (${data['cost']:.2f})\n"

            # By severity
            severity_summary = {}
            for point in damage_points:
                if point.severity not in severity_summary:
                    severity_summary[point.severity] = {'count': 0, 'cost': 0}
                severity_summary[point.severity]['count'] += 1
                severity_summary[point.severity]['cost'] += point.estimated_cost

            summary += "\nBy Severity:\n"
            for severity, data in severity_summary.items():
                summary += f"  {severity}: {data['count']} (${data['cost']:.2f})\n"

            self.summary_text.insert("1.0", summary)

        except Exception as e:
            logger.error(f"Failed to update summary: {e}")

    def _export_report(self):
        """Export damage report"""
        try:
            if not self.damage_canvas.damage_points:
                messagebox.showwarning("No Data", "No damage points to export.")
                return

            # Ask for save location
            filepath = filedialog.asksaveasfilename(
                title="Export Damage Report",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )

            if filepath:
                success = self.damage_canvas.export_damage_report(Path(filepath))
                if success:
                    messagebox.showinfo("Export Complete", f"Damage report exported to:\n{filepath}")
                else:
                    messagebox.showerror("Export Failed", "Failed to export damage report.")

        except Exception as e:
            logger.error(f"Failed to export report: {e}")
            messagebox.showerror("Export Error", f"Export failed: {e}")

    def _save_inspection(self):
        """Save inspection data"""
        try:
            # In a real application, this would save to database
            # For now, save to local file
            reports_dir = Path("data/damage_reports")
            reports_dir.mkdir(parents=True, exist_ok=True)

            filename = f"vehicle_{self.vehicle_id}_inspection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = reports_dir / filename

            inspection_data = {
                'vehicle_id': self.vehicle_id,
                'vehicle_type': self.current_vehicle_type,
                'view': self.current_view,
                'timestamp': datetime.now().isoformat(),
                'damage_points': self.damage_canvas.get_damage_data(),
                'total_estimated_cost': sum(p.estimated_cost for p in self.damage_canvas.damage_points)
            }

            with open(filepath, 'w') as f:
                json.dump(inspection_data, f, indent=2)

            messagebox.showinfo("Saved", f"Inspection saved to:\n{filename}")
            logger.info(f"Inspection saved: {filepath}")

        except Exception as e:
            logger.error(f"Failed to save inspection: {e}")
            messagebox.showerror("Save Error", f"Failed to save inspection: {e}")

    def _on_back(self):
        """Handle back button"""
        if self.damage_canvas.damage_points:
            if not messagebox.askyesno("Unsaved Changes", "You have unsaved damage points. Go back anyway?"):
                return

        self.destroy()
        if self.callback:
            self.callback()

    def destroy(self):
        """Clean up resources"""
        if hasattr(self, 'frame'):
            self.frame.destroy()


# Utility functions for integration
def show_damage_inspector(parent: tk.Widget, vehicle_id: int, callback: Optional[Callable] = None):
    """Show the damage inspector interface"""
    return DamageInspector(parent, vehicle_id, callback)


def load_inspection_from_file(filepath: Path) -> Optional[Dict[str, Any]]:
    """Load inspection data from file"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load inspection from {filepath}: {e}")
        return None


def validate_damage_data(damage_data: List[Dict[str, Any]]) -> bool:
    """Validate damage data structure"""
    required_fields = ['x', 'y', 'damage_type', 'severity']

    try:
        for point_data in damage_data:
            for field in required_fields:
                if field not in point_data:
                    return False

            # Validate coordinate ranges
            if not (0 <= point_data['x'] <= 1 and 0 <= point_data['y'] <= 1):
                return False

        return True
    except Exception:
        return False


# Example usage and testing
if __name__ == "__main__":
    # Create test application
    root = tk.Tk()
    root.title("Damage Inspector Test")
    root.geometry("1200x800")


    def on_back():
        root.quit()


    # Show damage inspector
    inspector = DamageInspector(root, vehicle_id=123, callback=on_back)

    root.mainloop()