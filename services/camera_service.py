# services/camera_service.py
import cv2
import numpy as np
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import base64
import io
import logging
from typing import Optional, Tuple, Callable
from pathlib import Path
import threading
import time
from datetime import datetime

logger = logging.getLogger(__name__)


class CameraService:
    """Service for handling camera operations and photo capture"""

    def __init__(self):
        self.camera = None
        self.is_capturing = False
        self.camera_index = 0
        self.last_frame = None
        self.capture_thread = None
        self.frame_callback = None

    def initialize_camera(self, camera_index: int = 0) -> bool:
        """Initialize camera with given index"""
        try:
            self.camera_index = camera_index
            self.camera = cv2.VideoCapture(camera_index)

            if not self.camera.isOpened():
                logger.error(f"Could not open camera at index {camera_index}")
                return False

            # Set camera properties for better quality
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.camera.set(cv2.CAP_PROP_FPS, 30)

            logger.info(f"Camera initialized successfully at index {camera_index}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            return False

    def get_available_cameras(self) -> list:
        """Get list of available camera indices"""
        available_cameras = []

        # Test up to 10 camera indices
        for i in range(10):
            try:
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    available_cameras.append(i)
                    cap.release()
            except:
                continue

        return available_cameras

    def start_preview(self, frame_callback: Callable[[np.ndarray], None]):
        """Start camera preview with callback for frames"""
        if not self.camera or not self.camera.isOpened():
            if not self.initialize_camera():
                raise RuntimeError("Could not initialize camera")

        self.frame_callback = frame_callback
        self.is_capturing = True

        # Start capture thread
        self.capture_thread = threading.Thread(target=self._capture_loop)
        self.capture_thread.daemon = True
        self.capture_thread.start()

        logger.info("Camera preview started")

    def stop_preview(self):
        """Stop camera preview"""
        self.is_capturing = False

        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)

        logger.info("Camera preview stopped")

    def _capture_loop(self):
        """Main capture loop running in separate thread"""
        while self.is_capturing and self.camera and self.camera.isOpened():
            try:
                ret, frame = self.camera.read()

                if ret:
                    self.last_frame = frame.copy()

                    if self.frame_callback:
                        self.frame_callback(frame)

                time.sleep(1 / 30)  # 30 FPS

            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                break

    def capture_photo(self) -> Optional[np.ndarray]:
        """Capture a single photo"""
        if not self.camera or not self.camera.isOpened():
            logger.error("Camera not initialized")
            return None

        try:
            ret, frame = self.camera.read()

            if ret:
                # Apply any image enhancements
                enhanced_frame = self._enhance_image(frame)
                logger.info("Photo captured successfully")
                return enhanced_frame
            else:
                logger.error("Failed to capture frame")
                return None

        except Exception as e:
            logger.error(f"Error capturing photo: {e}")
            return None

    def _enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Apply image enhancements"""
        try:
            # Convert to RGB for processing
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Apply slight sharpening
            kernel = np.array([[-1, -1, -1],
                               [-1, 9, -1],
                               [-1, -1, -1]])
            sharpened = cv2.filter2D(rgb_image, -1, kernel)

            # Blend original and sharpened (subtle effect)
            enhanced = cv2.addWeighted(rgb_image, 0.7, sharpened, 0.3, 0)

            return enhanced

        except Exception as e:
            logger.warning(f"Image enhancement failed: {e}")
            return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    def save_image(self, image: np.ndarray, filepath: str,
                   quality: int = 95) -> bool:
        """Save image to file"""
        try:
            # Convert numpy array to PIL Image
            pil_image = Image.fromarray(image)

            # Save with specified quality
            if filepath.lower().endswith('.jpg') or filepath.lower().endswith('.jpeg'):
                pil_image.save(filepath, 'JPEG', quality=quality, optimize=True)
            else:
                pil_image.save(filepath)

            logger.info(f"Image saved to {filepath}")
            return True

        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            return False

    def image_to_base64(self, image: np.ndarray, format: str = 'JPEG') -> str:
        """Convert image to base64 string for database storage"""
        try:
            pil_image = Image.fromarray(image)
            buffer = io.BytesIO()
            pil_image.save(buffer, format=format, quality=85)

            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return image_base64

        except Exception as e:
            logger.error(f"Failed to convert image to base64: {e}")
            return ""

    def base64_to_image(self, base64_string: str) -> Optional[np.ndarray]:
        """Convert base64 string back to image"""
        try:
            image_data = base64.b64decode(base64_string)
            pil_image = Image.open(io.BytesIO(image_data))
            return np.array(pil_image)

        except Exception as e:
            logger.error(f"Failed to convert base64 to image: {e}")
            return None

    def get_camera_info(self) -> dict:
        """Get camera information"""
        if not self.camera or not self.camera.isOpened():
            return {}

        try:
            info = {
                'width': int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)),
                'height': int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                'fps': int(self.camera.get(cv2.CAP_PROP_FPS)),
                'brightness': self.camera.get(cv2.CAP_PROP_BRIGHTNESS),
                'contrast': self.camera.get(cv2.CAP_PROP_CONTRAST),
                'saturation': self.camera.get(cv2.CAP_PROP_SATURATION)
            }
            return info

        except Exception as e:
            logger.error(f"Failed to get camera info: {e}")
            return {}

    def set_camera_property(self, property_id: int, value: float) -> bool:
        """Set camera property"""
        if not self.camera or not self.camera.isOpened():
            return False

        try:
            result = self.camera.set(property_id, value)
            if result:
                logger.info(f"Set camera property {property_id} to {value}")
            return result

        except Exception as e:
            logger.error(f"Failed to set camera property: {e}")
            return False

    def release_camera(self):
        """Release camera resources"""
        self.stop_preview()

        if self.camera:
            self.camera.release()
            self.camera = None

        logger.info("Camera resources released")

    def __del__(self):
        """Cleanup when object is destroyed"""
        self.release_camera()


class PhotoCaptureDialog:
    """Dialog for capturing photos with live preview"""

    def __init__(self, parent: tk.Widget, title: str = "Capture Photo"):
        self.parent = parent
        self.title = title
        self.dialog = None
        self.camera_service = CameraService()
        self.preview_label = None
        self.captured_image = None
        self.callback = None

        # Camera controls
        self.camera_var = tk.StringVar()
        self.brightness_var = tk.DoubleVar(value=0.5)
        self.contrast_var = tk.DoubleVar(value=0.5)

    def show(self, callback: Callable[[Optional[np.ndarray]], None]):
        """Show the photo capture dialog"""
        self.callback = callback
        self._create_dialog()
        self._setup_camera()

    def _create_dialog(self):
        """Create the dialog window"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title(self.title)
        self.dialog.geometry("800x700")
        self.dialog.resizable(True, True)
        self.dialog.grab_set()  # Make dialog modal

        # Handle dialog close
        self.dialog.protocol("WM_DELETE_WINDOW", self._on_close)

        # Main frame
        main_frame = tk.Frame(self.dialog, bg="#f0f0f0")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Camera selection frame
        camera_frame = tk.LabelFrame(main_frame, text="Camera Settings",
                                     font=("Arial", 12, "bold"))
        camera_frame.pack(fill=tk.X, pady=(0, 10))

        # Camera selection
        tk.Label(camera_frame, text="Camera:").grid(row=0, column=0, padx=5, pady=5)

        self.camera_combo = tk.ttk.Combobox(camera_frame, textvariable=self.camera_var,
                                            state="readonly", width=20)
        self.camera_combo.grid(row=0, column=1, padx=5, pady=5)
        self.camera_combo.bind('<<ComboboxSelected>>', self._on_camera_change)

        # Camera controls
        tk.Label(camera_frame, text="Brightness:").grid(row=0, column=2, padx=5, pady=5)
        brightness_scale = tk.Scale(camera_frame, from_=0, to=1, resolution=0.1,
                                    orient=tk.HORIZONTAL, variable=self.brightness_var,
                                    command=self._on_brightness_change)
        brightness_scale.grid(row=0, column=3, padx=5, pady=5)

        tk.Label(camera_frame, text="Contrast:").grid(row=1, column=2, padx=5, pady=5)
        contrast_scale = tk.Scale(camera_frame, from_=0, to=1, resolution=0.1,
                                  orient=tk.HORIZONTAL, variable=self.contrast_var,
                                  command=self._on_contrast_change)
        contrast_scale.grid(row=1, column=3, padx=5, pady=5)

        # Preview frame
        preview_frame = tk.LabelFrame(main_frame, text="Camera Preview",
                                      font=("Arial", 12, "bold"))
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # Preview label for camera feed
        self.preview_label = tk.Label(preview_frame, bg="black",
                                      text="Initializing camera...", fg="white",
                                      font=("Arial", 16))
        self.preview_label.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Button frame
        button_frame = tk.Frame(main_frame)
        button_frame.pack(fill=tk.X)

        # Capture button
        capture_btn = tk.Button(button_frame, text="📸 Capture Photo",
                                font=("Arial", 14, "bold"), bg="#4CAF50", fg="white",
                                command=self._capture_photo, padx=20, pady=10)
        capture_btn.pack(side=tk.LEFT, padx=(0, 10))

        # Retake button (initially disabled)
        self.retake_btn = tk.Button(button_frame, text="🔄 Retake",
                                    font=("Arial", 12), bg="#FF9800", fg="white",
                                    command=self._retake_photo, padx=20, pady=10,
                                    state=tk.DISABLED)
        self.retake_btn.pack(side=tk.LEFT, padx=(0, 10))

        # Save button (initially disabled)
        self.save_btn = tk.Button(button_frame, text="💾 Save Photo",
                                  font=("Arial", 12), bg="#2196F3", fg="white",
                                  command=self._save_photo, padx=20, pady=10,
                                  state=tk.DISABLED)
        self.save_btn.pack(side=tk.LEFT, padx=(0, 10))

        # Cancel button
        cancel_btn = tk.Button(button_frame, text="❌ Cancel",
                               font=("Arial", 12), bg="#f44336", fg="white",
                               command=self._on_close, padx=20, pady=10)
        cancel_btn.pack(side=tk.RIGHT)

    def _setup_camera(self):
        """Setup camera and populate camera list"""
        try:
            # Get available cameras
            cameras = self.camera_service.get_available_cameras()

            if not cameras:
                messagebox.showerror("No Camera", "No cameras found on this device.")
                self._on_close()
                return

            # Populate camera dropdown
            camera_options = [f"Camera {i}" for i in cameras]
            self.camera_combo['values'] = camera_options

            if cameras:
                self.camera_combo.current(0)  # Select first camera
                self._initialize_selected_camera()

        except Exception as e:
            logger.error(f"Failed to setup camera: {e}")
            messagebox.showerror("Camera Error", f"Failed to setup camera: {e}")
            self._on_close()

    def _initialize_selected_camera(self):
        """Initialize the selected camera"""
        try:
            camera_index = self.camera_combo.current()

            if self.camera_service.initialize_camera(camera_index):
                # Start preview
                self.camera_service.start_preview(self._update_preview)
                self.preview_label.config(text="")
            else:
                self.preview_label.config(text="Failed to initialize camera")

        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            self.preview_label.config(text="Camera initialization failed")

    def _update_preview(self, frame: np.ndarray):
        """Update preview with new frame"""
        try:
            # Resize frame to fit preview
            height, width = frame.shape[:2]
            max_width, max_height = 640, 480

            if width > max_width or height > max_height:
                scale = min(max_width / width, max_height / height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))

            # Convert to PIL Image
            image = Image.fromarray(frame)
            photo = ImageTk.PhotoImage(image)

            # Update preview label
            self.preview_label.config(image=photo)
            self.preview_label.image = photo  # Keep a reference

        except Exception as e:
            logger.error(f"Failed to update preview: {e}")

    def _on_camera_change(self, event):
        """Handle camera selection change"""
        self.camera_service.stop_preview()
        self._initialize_selected_camera()

    def _on_brightness_change(self, value):
        """Handle brightness change"""
        try:
            brightness = float(value)
            self.camera_service.set_camera_property(cv2.CAP_PROP_BRIGHTNESS, brightness)
        except Exception as e:
            logger.error(f"Failed to set brightness: {e}")

    def _on_contrast_change(self, value):
        """Handle contrast change"""
        try:
            contrast = float(value)
            self.camera_service.set_camera_property(cv2.CAP_PROP_CONTRAST, contrast)
        except Exception as e:
            logger.error(f"Failed to set contrast: {e}")

    def _capture_photo(self):
        """Capture a photo"""
        try:
            self.captured_image = self.camera_service.capture_photo()

            if self.captured_image is not None:
                # Stop preview and show captured image
                self.camera_service.stop_preview()

                # Display captured image
                self._display_captured_image()

                # Enable retake and save buttons
                self.retake_btn.config(state=tk.NORMAL)
                self.save_btn.config(state=tk.NORMAL)

            else:
                messagebox.showerror("Capture Failed", "Failed to capture photo")

        except Exception as e:
            logger.error(f"Failed to capture photo: {e}")
            messagebox.showerror("Capture Error", f"Failed to capture photo: {e}")

    def _display_captured_image(self):
        """Display the captured image in preview"""
        try:
            if self.captured_image is not None:
                # Resize for display
                height, width = self.captured_image.shape[:2]
                max_width, max_height = 640, 480

                if width > max_width or height > max_height:
                    scale = min(max_width / width, max_height / height)
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    display_image = cv2.resize(self.captured_image, (new_width, new_height))
                else:
                    display_image = self.captured_image

                # Convert and display
                image = Image.fromarray(display_image)
                photo = ImageTk.PhotoImage(image)

                self.preview_label.config(image=photo)
                self.preview_label.image = photo

        except Exception as e:
            logger.error(f"Failed to display captured image: {e}")

    def _retake_photo(self):
        """Retake the photo"""
        self.captured_image = None
        self.retake_btn.config(state=tk.DISABLED)
        self.save_btn.config(state=tk.DISABLED)

        # Restart preview
        self._initialize_selected_camera()

    def _save_photo(self):
        """Save the captured photo"""
        if self.captured_image is not None and self.callback:
            self.callback(self.captured_image)
            self._on_close()

    def _on_close(self):
        """Handle dialog close"""
        self.camera_service.release_camera()

        if self.dialog:
            self.dialog.destroy()

        if self.callback:
            self.callback(None)


# Global camera service instance
camera_service = CameraService()