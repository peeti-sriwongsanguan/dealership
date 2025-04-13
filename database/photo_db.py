# database/photo_db.py

import sqlite3
import datetime
import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database and photos directory from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')


def ensure_photos_directory():
    """Make sure the photos directory exists"""
    if not os.path.exists(PHOTOS_DIR):
        os.makedirs(PHOTOS_DIR)


def save_photo(service_id, photo_data, description=''):
    """Save a vehicle photo to disk and database

    Args:
        service_id: ID of the service this photo is linked to
        photo_data: Binary image data
        description: Optional description of the photo

    Returns:
        ID of the saved photo record
    """
    # Get customer and vehicle info
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    SELECT v.id as vehicle_id, v.customer_id, c.name as customer_name,
           v.make, v.model, v.year
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE s.id = ?
    """, (service_id,))

    service_info = cursor.fetchone()

    if not service_info:
        raise ValueError("Service not found")

    vehicle_id = service_info[0]
    customer_id = service_info[1]
    customer_name = service_info[2]
    vehicle_info = f"{service_info[4]}_{service_info[3]}_{service_info[5]}"

    # Create directory structure: photos/customer_ID_name/vehicle_ID_info/
    customer_dir = f"{PHOTOS_DIR}/{customer_id}_{customer_name.replace(' ', '_')}"
    vehicle_dir = f"{customer_dir}/{vehicle_id}_{vehicle_info}"

    # Ensure directories exist
    os.makedirs(customer_dir, exist_ok=True)
    os.makedirs(vehicle_dir, exist_ok=True)

    # Generate unique filename
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = os.path.join(vehicle_dir, filename)

    # Save photo to disk
    with open(filepath, 'wb') as f:
        f.write(photo_data)

    # Save record to database with customer_id and vehicle_id
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO vehicle_photos (service_id, vehicle_id, customer_id, photo_path, description, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (service_id, vehicle_id, customer_id, filepath, description, timestamp))

    photo_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return photo_id


def get_photos_for_service(service_id):
    """Get all photos for a specific service"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, service_id, vehicle_id, customer_id, photo_path, description, timestamp
    FROM vehicle_photos
    WHERE service_id = ?
    ORDER BY timestamp
    """, (service_id,))

    photos = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return photos


def get_photos_for_vehicle(vehicle_id):
    """Get all photos for a specific vehicle"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT vp.id, vp.service_id, vp.vehicle_id, vp.customer_id, vp.photo_path, vp.description, vp.timestamp,
           s.service_type, s.status
    FROM vehicle_photos vp
    JOIN services s ON vp.service_id = s.id
    WHERE vp.vehicle_id = ?
    ORDER BY vp.timestamp DESC
    """, (vehicle_id,))

    photos = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return photos


def get_photos_for_customer(customer_id):
    """Get all photos for a specific customer's vehicles"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT vp.id, vp.service_id, vp.vehicle_id, vp.customer_id, vp.photo_path, vp.description, vp.timestamp,
           v.make, v.model, v.year, v.license_plate,
           s.service_type, s.status
    FROM vehicle_photos vp
    JOIN services s ON vp.service_id = s.id
    JOIN vehicles v ON vp.vehicle_id = v.id
    WHERE vp.customer_id = ?
    ORDER BY vp.timestamp DESC
    """, (customer_id,))

    photos = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return photos


def get_photo_by_id(photo_id):
    """Get a specific photo by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, service_id, vehicle_id, customer_id, photo_path, description, timestamp
    FROM vehicle_photos
    WHERE id = ?
    """, (photo_id,))

    photo = cursor.fetchone()

    conn.close()

    if photo:
        return dict(photo)
    return None


def update_photo_description(photo_id, description):
    """Update the description of a photo"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE vehicle_photos 
    SET description = ?
    WHERE id = ?
    """, (description, photo_id))

    conn.commit()
    conn.close()

    return cursor.rowcount > 0


def delete_photo(photo_id):
    """Delete a photo from disk and database"""
    # Get photo path first
    photo = get_photo_by_id(photo_id)
    if not photo:
        return False

    # Delete from database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM vehicle_photos WHERE id = ?", (photo_id,))

    success = cursor.rowcount > 0

    conn.commit()
    conn.close()

    # Delete from disk if database deletion was successful
    if success and os.path.exists(photo['photo_path']):
        try:
            os.remove(photo['photo_path'])
        except:
            # If file deletion fails, still return True as the database record is gone
            pass

    return success