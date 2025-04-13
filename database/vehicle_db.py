# database/vehicle_db.py

import sqlite3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')


def get_vehicles_by_customer(customer_id):
    """Get all vehicles for a specific customer"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, customer_id, make, model, year, vin, license_plate
    FROM vehicles
    WHERE customer_id = ?
    ORDER BY make, model
    """, (customer_id,))

    vehicles = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return vehicles


def get_vehicle_by_id(vehicle_id):
    """Get a specific vehicle by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate, c.name as customer_name
    FROM vehicles v
    JOIN customers c ON v.customer_id = c.id
    WHERE v.id = ?
    """, (vehicle_id,))

    vehicle = cursor.fetchone()

    conn.close()

    if vehicle:
        return dict(vehicle)
    return None


def create_vehicle(vehicle_data):
    """Create a new vehicle"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate) 
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        vehicle_data.get('customer_id'),
        vehicle_data.get('make', ''),
        vehicle_data.get('model', ''),
        vehicle_data.get('year'),
        vehicle_data.get('vin', ''),
        vehicle_data.get('license_plate', '')
    ))

    # Get the new vehicle ID
    vehicle_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return vehicle_id


def update_vehicle(vehicle_id, vehicle_data):
    """Update an existing vehicle"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE vehicles 
    SET make = ?, model = ?, year = ?, vin = ?, license_plate = ?
    WHERE id = ?
    """, (
        vehicle_data.get('make', ''),
        vehicle_data.get('model', ''),
        vehicle_data.get('year'),
        vehicle_data.get('vin', ''),
        vehicle_data.get('license_plate', ''),
        vehicle_id
    ))

    conn.commit()

    success = cursor.rowcount > 0
    conn.close()

    return success


def delete_vehicle(vehicle_id):
    """Delete a vehicle and all related services"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Begin transaction
        cursor.execute("BEGIN TRANSACTION")

        # Get service IDs for this vehicle (for photo deletion)
        cursor.execute("SELECT id FROM services WHERE vehicle_id = ?", (vehicle_id,))
        service_ids = [row[0] for row in cursor.fetchall()]

        # Delete services for this vehicle
        cursor.execute("DELETE FROM services WHERE vehicle_id = ?", (vehicle_id,))

        # Delete the vehicle
        cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))

        # Commit transaction
        cursor.execute("COMMIT")
        success = True

        # Delete photos associated with the deleted services
        if service_ids:
            from database.photo_db import get_photos_for_service, delete_photo
            for service_id in service_ids:
                photos = get_photos_for_service(service_id)
                for photo in photos:
                    delete_photo(photo['id'])
    except Exception as e:
        # Rollback in case of error
        cursor.execute("ROLLBACK")
        print(f"Error deleting vehicle: {e}")
        success = False

    conn.close()
    return success


def search_vehicles(search_term):
    """Search vehicles by make, model, VIN, or license plate"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate, c.name as customer_name
    FROM vehicles v
    JOIN customers c ON v.customer_id = c.id
    WHERE v.make LIKE ? OR v.model LIKE ? OR v.vin LIKE ? OR v.license_plate LIKE ?
    ORDER BY v.make, v.model
    """, (
        f'%{search_term}%',
        f'%{search_term}%',
        f'%{search_term}%',
        f'%{search_term}%'
    ))

    vehicles = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return vehicles


def get_vehicles_by_license_plate(license_plate):
    """Get a vehicle by its license plate"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate, c.name as customer_name
    FROM vehicles v
    JOIN customers c ON v.customer_id = c.id
    WHERE v.license_plate = ?
    """, (license_plate,))

    vehicle = cursor.fetchone()

    conn.close()

    if vehicle:
        return dict(vehicle)
    return None


def get_vehicle_count_by_make():
    """Get count of vehicles by make for reporting"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT make, COUNT(*) as count
    FROM vehicles
    GROUP BY make
    ORDER BY count DESC
    """)

    results = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return results


def get_vehicle_stats():
    """Get vehicle statistics for reporting"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get total count and average year
    cursor.execute("""
    SELECT COUNT(*) as total_vehicles,
           AVG(year) as avg_year,
           MIN(year) as oldest_year,
           MAX(year) as newest_year
    FROM vehicles
    """)

    summary = dict(cursor.fetchone())

    # Get counts by make
    cursor.execute("""
    SELECT make, COUNT(*) as count
    FROM vehicles
    GROUP BY make
    ORDER BY count DESC
    """)

    by_make = [dict(row) for row in cursor.fetchall()]

    # Get counts by year range
    cursor.execute("""
    SELECT 
        CASE 
            WHEN year >= 2020 THEN '2020+'
            WHEN year >= 2015 THEN '2015-2019'
            WHEN year >= 2010 THEN '2010-2014'
            WHEN year >= 2005 THEN '2005-2009'
            WHEN year >= 2000 THEN '2000-2004'
            ELSE 'Pre-2000'
        END as year_range,
        COUNT(*) as count
    FROM vehicles
    GROUP BY year_range
    ORDER BY MIN(year) DESC
    """)

    by_year_range = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        'summary': summary,
        'by_make': by_make,
        'by_year_range': by_year_range
    }