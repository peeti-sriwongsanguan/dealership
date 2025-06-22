# services/image_service.py
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import base64
import io
import logging
from typing import Tuple, Optional, List, Dict, Any
from pathlib import Path
import hashlib
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Advanced image processing for vehicle photos and damage documentation"""

    def __init__(self):
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.thumbnail_size = (200, 150)
        self.watermark_opacity = 0.3

    def enhance_image(self, image: np.ndarray, enhancement_type: str = "auto") -> np.ndarray:
        """
        Enhance image quality using various techniques

        Args:
            image: Input image as numpy array
            enhancement_type: Type of enhancement ('auto', 'brightness', 'contrast', 'sharpness')

        Returns:
            Enhanced image as numpy array
        """
        try:
            # Convert to PIL Image for processing
            if len(image.shape) == 3 and image.shape[2] == 3:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image)

            if enhancement_type == "auto":
                # Auto enhancement pipeline
                pil_image = self._auto_enhance(pil_image)
            elif enhancement_type == "brightness":
                enhancer = ImageEnhance.Brightness(pil_image)
                pil_image = enhancer.enhance(1.2)
            elif enhancement_type == "contrast":
                enhancer = ImageEnhance.Contrast(pil_image)
                pil_image = enhancer.enhance(1.1)
            elif enhancement_type == "sharpness":
                enhancer = ImageEnhance.Sharpness(pil_image)
                pil_image = enhancer.enhance(1.2)

            # Convert back to numpy array
            if pil_image.mode == 'RGB':
                return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            else:
                return np.array(pil_image)

        except Exception as e:
            logger.error(f"Image enhancement failed: {e}")
            return image

    def _auto_enhance(self, image: Image.Image) -> Image.Image:
        """Apply automatic enhancement pipeline"""
        try:
            # Slight brightness adjustment
            brightness = ImageEnhance.Brightness(image)
            image = brightness.enhance(1.05)

            # Contrast enhancement
            contrast = ImageEnhance.Contrast(image)
            image = contrast.enhance(1.1)

            # Subtle sharpening
            sharpness = ImageEnhance.Sharpness(image)
            image = sharpness.enhance(1.15)

            # Color saturation (slight)
            color = ImageEnhance.Color(image)
            image = color.enhance(1.05)

            return image

        except Exception as e:
            logger.error(f"Auto enhancement failed: {e}")
            return image

    def resize_image(self, image: np.ndarray, target_size: Tuple[int, int],
                     maintain_aspect: bool = True) -> np.ndarray:
        """
        Resize image to target dimensions

        Args:
            image: Input image
            target_size: (width, height) tuple
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Resized image
        """
        try:
            height, width = image.shape[:2]
            target_width, target_height = target_size

            if maintain_aspect:
                # Calculate scale factor
                scale_w = target_width / width
                scale_h = target_height / height
                scale = min(scale_w, scale_h)

                # Calculate new dimensions
                new_width = int(width * scale)
                new_height = int(height * scale)

                # Resize image
                resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)

                # Create canvas and center the image
                canvas = np.ones((target_height, target_width, image.shape[2] if len(image.shape) == 3 else 1),
                                 dtype=image.dtype) * 255

                # Calculate position to center the image
                start_y = (target_height - new_height) // 2
                start_x = (target_width - new_width) // 2

                if len(image.shape) == 3:
                    canvas[start_y:start_y + new_height, start_x:start_x + new_width] = resized
                else:
                    canvas[start_y:start_y + new_height, start_x:start_x + new_width, 0] = resized

                return canvas
            else:
                # Direct resize without maintaining aspect ratio
                return cv2.resize(image, target_size, interpolation=cv2.INTER_LANCZOS4)

        except Exception as e:
            logger.error(f"Image resize failed: {e}")
            return image

    def create_thumbnail(self, image: np.ndarray, size: Tuple[int, int] = None) -> np.ndarray:
        """Create thumbnail of image"""
        thumbnail_size = size or self.thumbnail_size
        return self.resize_image(image, thumbnail_size, maintain_aspect=True)

    def add_watermark(self, image: np.ndarray, watermark_text: str,
                      position: str = "bottom_right") -> np.ndarray:
        """
        Add watermark to image

        Args:
            image: Input image
            watermark_text: Text to add as watermark
            position: Position of watermark ('top_left', 'top_right', 'bottom_left', 'bottom_right', 'center')

        Returns:
            Image with watermark
        """
        try:
            # Convert to PIL Image
            if len(image.shape) == 3:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image)

            # Create transparent overlay
            overlay = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # Try to load a font
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()

            # Get text dimensions
            bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            # Calculate position
            margin = 20
            if position == "top_left":
                x, y = margin, margin
            elif position == "top_right":
                x, y = pil_image.width - text_width - margin, margin
            elif position == "bottom_left":
                x, y = margin, pil_image.height - text_height - margin
            elif position == "bottom_right":
                x, y = pil_image.width - text_width - margin, pil_image.height - text_height - margin
            elif position == "center":
                x, y = (pil_image.width - text_width) // 2, (pil_image.height - text_height) // 2
            else:
                x, y = pil_image.width - text_width - margin, pil_image.height - text_height - margin

            # Draw watermark
            alpha = int(255 * self.watermark_opacity)
            draw.text((x, y), watermark_text, font=font, fill=(255, 255, 255, alpha))

            # Composite with original image
            if pil_image.mode != 'RGBA':
                pil_image = pil_image.convert('RGBA')

            watermarked = Image.alpha_composite(pil_image, overlay)

            # Convert back to numpy array
            if watermarked.mode == 'RGBA':
                watermarked = watermarked.convert('RGB')

            return cv2.cvtColor(np.array(watermarked), cv2.COLOR_RGB2BGR)

        except Exception as e:
            logger.error(f"Watermark addition failed: {e}")
            return image

    def detect_blur(self, image: np.ndarray) -> float:
        """
        Detect if image is blurry using Laplacian variance

        Returns:
            Blur score (higher values indicate sharper images)
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            # Calculate Laplacian variance
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            return laplacian_var

        except Exception as e:
            logger.error(f"Blur detection failed: {e}")
            return 0.0

    def auto_orient(self, image: np.ndarray, exif_data: Dict = None) -> np.ndarray:
        """Auto-orient image based on EXIF data"""
        try:
            if exif_data and 'Orientation' in exif_data:
                orientation = exif_data['Orientation']

                if orientation == 3:
                    image = cv2.rotate(image, cv2.ROTATE_180)
                elif orientation == 6:
                    image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
                elif orientation == 8:
                    image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

            return image

        except Exception as e:
            logger.error(f"Auto-orientation failed: {e}")
            return image

    def compress_image(self, image: np.ndarray, quality: int = 85,
                       format: str = 'JPEG') -> bytes:
        """
        Compress image to bytes

        Args:
            image: Input image
            quality: Compression quality (1-100)
            format: Image format ('JPEG', 'PNG', 'WEBP')

        Returns:
            Compressed image as bytes
        """
        try:
            # Convert to PIL Image
            if len(image.shape) == 3:
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(image)

            # Create bytes buffer
            buffer = io.BytesIO()

            # Save with compression
            if format.upper() == 'JPEG':
                if pil_image.mode in ('RGBA', 'LA', 'P'):
                    pil_image = pil_image.convert('RGB')
                pil_image.save(buffer, format='JPEG', quality=quality, optimize=True)
            elif format.upper() == 'PNG':
                pil_image.save(buffer, format='PNG', optimize=True)
            elif format.upper() == 'WEBP':
                pil_image.save(buffer, format='WEBP', quality=quality, optimize=True)
            else:
                pil_image.save(buffer, format=format)

            return buffer.getvalue()

        except Exception as e:
            logger.error(f"Image compression failed: {e}")
            return b''

    def extract_metadata(self, image_path: str) -> Dict[str, Any]:
        """Extract metadata from image file"""
        try:
            from PIL.ExifTags import TAGS

            image = Image.open(image_path)
            metadata = {
                'filename': Path(image_path).name,
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'file_size': Path(image_path).stat().st_size
            }

            # Extract EXIF data
            exif = image.getexif()
            if exif:
                exif_data = {}
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    exif_data[tag] = value
                metadata['exif'] = exif_data

            return metadata

        except Exception as e:
            logger.error(f"Metadata extraction failed: {e}")
            return {}

    def calculate_hash(self, image: np.ndarray) -> str:
        """Calculate hash of image for duplicate detection"""
        try:
            # Convert to bytes
            image_bytes = cv2.imencode('.jpg', image)[1].tobytes()

            # Calculate MD5 hash
            hash_md5 = hashlib.md5()
            hash_md5.update(image_bytes)

            return hash_md5.hexdigest()

        except Exception as e:
            logger.error(f"Hash calculation failed: {e}")
            return ""

    def validate_image(self, image_path: str) -> Dict[str, Any]:
        """
        Validate image file

        Returns:
            Dictionary with validation results
        """
        result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'metadata': {}
        }

        try:
            # Check if file exists
            if not Path(image_path).exists():
                result['errors'].append("File does not exist")
                return result

            # Check file size
            file_size = Path(image_path).stat().st_size
            if file_size > self.max_file_size:
                result['errors'].append(f"File size ({file_size} bytes) exceeds maximum ({self.max_file_size} bytes)")

            # Check file extension
            file_ext = Path(image_path).suffix.lower()
            if file_ext not in self.supported_formats:
                result['errors'].append(f"Unsupported format: {file_ext}")

            # Try to open image
            try:
                image = Image.open(image_path)
                result['metadata'] = {
                    'format': image.format,
                    'mode': image.mode,
                    'size': image.size,
                    'file_size': file_size
                }

                # Check image dimensions
                width, height = image.size
                if width < 100 or height < 100:
                    result['warnings'].append("Image dimensions are very small")

                # Check for common issues
                if image.mode not in ['RGB', 'RGBA', 'L']:
                    result['warnings'].append(f"Unusual color mode: {image.mode}")

            except Exception as e:
                result['errors'].append(f"Cannot open image: {e}")

            # Set valid flag
            result['valid'] = len(result['errors']) == 0

            return result

        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            result['errors'].append(f"Validation error: {e}")
            return result


class ImageService:
    """High-level image service for the application"""

    def __init__(self):
        self.processor = ImageProcessor()
        self.storage_dir = Path("media/photos")
        self.temp_dir = Path("media/temp")

        # Ensure directories exist
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def process_vehicle_photo(self, image: np.ndarray, vehicle_id: int,
                              service_id: Optional[int] = None,
                              photo_type: str = "general") -> Dict[str, Any]:
        """
        Process and save vehicle photo

        Returns:
            Dictionary with processing results and file paths
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Enhance image
            enhanced_image = self.processor.enhance_image(image, "auto")

            # Create thumbnail
            thumbnail = self.processor.create_thumbnail(enhanced_image)

            # Add watermark
            watermark_text = f"OL Service - {timestamp}"
            if service_id:
                watermark_text += f" - Service #{service_id}"

            watermarked = self.processor.add_watermark(enhanced_image, watermark_text)

            # Calculate quality metrics
            blur_score = self.processor.detect_blur(enhanced_image)
            image_hash = self.processor.calculate_hash(enhanced_image)

            # Generate filenames
            base_filename = f"vehicle_{vehicle_id}_{photo_type}_{timestamp}"
            main_filename = f"{base_filename}.jpg"
            thumb_filename = f"{base_filename}_thumb.jpg"

            # Save main image
            main_path = self.storage_dir / main_filename
            main_bytes = self.processor.compress_image(watermarked, quality=90)
            with open(main_path, 'wb') as f:
                f.write(main_bytes)

            # Save thumbnail
            thumb_path = self.storage_dir / thumb_filename
            thumb_bytes = self.processor.compress_image(thumbnail, quality=80)
            with open(thumb_path, 'wb') as f:
                f.write(thumb_bytes)

            return {
                'success': True,
                'main_path': str(main_path),
                'thumbnail_path': str(thumb_path),
                'main_size': len(main_bytes),
                'thumbnail_size': len(thumb_bytes),
                'hash': image_hash,
                'blur_score': blur_score,
                'dimensions': enhanced_image.shape[:2],
                'filename': main_filename,
                'thumbnail_filename': thumb_filename
            }

        except Exception as e:
            logger.error(f"Photo processing failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def create_damage_overlay(self, base_image: np.ndarray,
                              damage_points: List[Dict]) -> np.ndarray:
        """
        Create damage overlay on vehicle image

        Args:
            base_image: Base vehicle image
            damage_points: List of damage point dictionaries

        Returns:
            Image with damage overlay
        """
        try:
            # Convert to PIL for easier drawing
            if len(base_image.shape) == 3:
                pil_image = Image.fromarray(cv2.cvtColor(base_image, cv2.COLOR_BGR2RGB))
            else:
                pil_image = Image.fromarray(base_image)

            # Create overlay
            overlay = Image.new('RGBA', pil_image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # Try to load font
            try:
                font = ImageFont.truetype("arial.ttf", 16)
                small_font = ImageFont.truetype("arial.ttf", 12)
            except:
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()

            # Colors for different damage types and severities
            damage_colors = {
                "Scratch": "#FF6B6B",
                "Dent": "#4ECDC4",
                "Crack": "#45B7D1",
                "Rust": "#96CEB4",
                "Paint": "#FECA57",
                "Electrical": "#54A0FF",
                "Other": "#C44569"
            }

            severity_sizes = {
                "Minor": 20,
                "Moderate": 25,
                "Severe": 30,
                "Critical": 35
            }

            # Draw damage points
            for i, point in enumerate(damage_points):
                # Convert relative coordinates to absolute
                x = int(point['x'] * pil_image.width)
                y = int(point['y'] * pil_image.height)

                # Get colors and size
                damage_type = point.get('damage_type', 'Other')
                severity = point.get('severity', 'Minor')
                color = damage_colors.get(damage_type, "#FF0000")
                size = severity_sizes.get(severity, 20)

                # Convert hex color to RGB with alpha
                hex_color = color.lstrip('#')
                rgb_color = tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
                rgba_color = rgb_color + (200,)  # Add alpha

                # Draw outer circle
                draw.ellipse([x - size // 2, y - size // 2, x + size // 2, y + size // 2],
                             fill=rgba_color, outline=(0, 0, 0, 255), width=2)

                # Draw inner circle
                inner_size = size // 2
                draw.ellipse([x - inner_size // 2, y - inner_size // 2, x + inner_size // 2, y + inner_size // 2],
                             fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=1)

                # Draw number
                number = point.get('number', i + 1)
                draw.text((x, y), str(number), font=small_font, fill=(0, 0, 0, 255), anchor="mm")

                # Draw label below
                label = f"{damage_type} ({severity})"
                label_y = y + size // 2 + 15
                draw.text((x, label_y), label, font=small_font, fill=(0, 0, 0, 255), anchor="mm")

            # Composite overlay with base image
            if pil_image.mode != 'RGBA':
                pil_image = pil_image.convert('RGBA')

            result = Image.alpha_composite(pil_image, overlay)

            # Convert back to BGR for OpenCV
            if result.mode == 'RGBA':
                result = result.convert('RGB')

            return cv2.cvtColor(np.array(result), cv2.COLOR_RGB2BGR)

        except Exception as e:
            logger.error(f"Damage overlay creation failed: {e}")
            return base_image

    def generate_comparison_image(self, before_image: np.ndarray,
                                  after_image: np.ndarray) -> np.ndarray:
        """Generate before/after comparison image"""
        try:
            # Resize images to same height
            height = min(before_image.shape[0], after_image.shape[0])

            before_resized = self.processor.resize_image(before_image, (
            height * before_image.shape[1] // before_image.shape[0], height))
            after_resized = self.processor.resize_image(after_image,
                                                        (height * after_image.shape[1] // after_image.shape[0], height))

            # Create side-by-side comparison
            comparison = np.hstack([before_resized, after_resized])

            # Add labels
            pil_comparison = Image.fromarray(cv2.cvtColor(comparison, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(pil_comparison)

            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()

            # Add "BEFORE" and "AFTER" labels
            draw.text((50, 30), "BEFORE", font=font, fill=(255, 255, 255))
            draw.text((before_resized.shape[1] + 50, 30), "AFTER", font=font, fill=(255, 255, 255))

            return cv2.cvtColor(np.array(pil_comparison), cv2.COLOR_RGB2BGR)

        except Exception as e:
            logger.error(f"Comparison image generation failed: {e}")
            return before_image

    def cleanup_temp_files(self, max_age_hours: int = 24):
        """Clean up temporary files older than specified hours"""
        try:
            current_time = datetime.now()

            for file_path in self.temp_dir.glob("*"):
                if file_path.is_file():
                    file_age = current_time - datetime.fromtimestamp(file_path.stat().st_mtime)

                    if file_age.total_seconds() > max_age_hours * 3600:
                        file_path.unlink()
                        logger.info(f"Cleaned up temp file: {file_path}")

        except Exception as e:
            logger.error(f"Temp file cleanup failed: {e}")


# Global image service instance
image_service = ImageService()