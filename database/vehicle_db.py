# database/vehicle_db.py
import sqlite3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')

# --- IMPORTANT ---
# You need to run this SQL command on your database ONE TIME to add the new columns.
# You can use a tool like DB Browser for SQLite or the sqlite3 command-line tool.
#
# ALTER TABLE vehicles ADD COLUMN insurance_company TEXT;
# ALTER TABLE vehicles ADD COLUMN insurance_policy_number TEXT;
# ALTER TABLE vehicles ADD COLUMN insurance_class INTEGER;
# ALTER TABLE vehicles ADD COLUMN insurance_expiration_date TEXT;
#
# --- END IMPORTANT ---


def get_all_vehicles():
    """Get all vehicles from the database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate,
            v.insurance_company, v.insurance_policy_number, v.insurance_class, v.insurance_expiration_date,
            c.name as customer_name
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.id
        ORDER BY v.make, v.model
    """)
    vehicles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return vehicles


def get_vehicles_by_customer(customer_id):
    """Get all vehicles for a specific customer"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            id, customer_id, make, model, year, vin, license_plate,
            insurance_company, insurance_policy_number, insurance_class, insurance_expiration_date
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
        SELECT 
            v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate,
            v.insurance_company, v.insurance_policy_number, v.insurance_class, v.insurance_expiration_date,
            c.name as customer_name
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.id = ?
    """, (vehicle_id,))
    vehicle = cursor.fetchone()
    conn.close()
    return dict(vehicle) if vehicle else None


def create_vehicle(vehicle_data):
    """Create a new vehicle"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vehicles (
            customer_id, make, model, year, vin, license_plate,
            insurance_company, insurance_policy_number, insurance_class, insurance_expiration_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        vehicle_data.get('customer_id'),
        vehicle_data.get('make', ''),
        vehicle_data.get('model', ''),
        vehicle_data.get('year'),
        vehicle_data.get('vin', ''),
        vehicle_data.get('license_plate', ''),
        vehicle_data.get('insurance_company'),
        vehicle_data.get('insurance_policy_number'),
        vehicle_data.get('insurance_class'),
        vehicle_data.get('insurance_expiration_date')
    ))
    vehicle_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return vehicle_id


def update_vehicle(vehicle_id, vehicle_data):
    """Update an existing vehicle"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE vehicles SET
            make = ?, model = ?, year = ?, vin = ?, license_plate = ?,
            insurance_company = ?, insurance_policy_number = ?, insurance_class = ?, insurance_expiration_date = ?
        WHERE id = ?
    """, (
        vehicle_data.get('make', ''),
        vehicle_data.get('model', ''),
        vehicle_data.get('year'),
        vehicle_data.get('vin', ''),
        vehicle_data.get('license_plate', ''),
        vehicle_data.get('insurance_company'),
        vehicle_data.get('insurance_policy_number'),
        vehicle_data.get('insurance_class'),
        vehicle_data.get('insurance_expiration_date'),
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
        cursor.execute("BEGIN TRANSACTION")
        cursor.execute("SELECT id FROM services WHERE vehicle_id = ?", (vehicle_id,))
        service_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("DELETE FROM services WHERE vehicle_id = ?", (vehicle_id,))
        cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
        cursor.execute("COMMIT")
        success = True
        if service_ids:
            from database.photo_db import get_photos_for_service, delete_photo
            for service_id in service_ids:
                photos = get_photos_for_service(service_id)
                for photo in photos:
                    delete_photo(photo['id'])
    except Exception as e:
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
    query = f'%{search_term}%'
    cursor.execute("""
        SELECT 
            v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate,
            v.insurance_company, v.insurance_policy_number, v.insurance_class, v.insurance_expiration_date,
            c.name as customer_name
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.make LIKE ? OR v.model LIKE ? OR v.vin LIKE ? OR v.license_plate LIKE ? OR c.name LIKE ?
        ORDER BY v.make, v.model
    """, (query, query, query, query, query))
    vehicles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return vehicles


def get_vehicles_by_license_plate(license_plate):
    """Get a vehicle by its license plate"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            v.id, v.customer_id, v.make, v.model, v.year, v.vin, v.license_plate,
            v.insurance_company, v.insurance_policy_number, v.insurance_class, v.insurance_expiration_date,
            c.name as customer_name
        FROM vehicles v
        LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.license_plate = ?
    """, (license_plate,))
    vehicle = cursor.fetchone()
    conn.close()
    return dict(vehicle) if vehicle else None


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
    cursor.execute("""
        SELECT COUNT(*) as total_vehicles,
               AVG(year) as avg_year,
               MIN(year) as oldest_year,
               MAX(year) as newest_year
        FROM vehicles
        WHERE year IS NOT NULL AND year > 1900
    """)
    summary = dict(cursor.fetchone())
    cursor.execute("""
        SELECT make, COUNT(*) as count
        FROM vehicles
        GROUP BY make
        ORDER BY count DESC
    """)
    by_make = [dict(row) for row in cursor.fetchall()]
    cursor.execute("""
        SELECT 
            CASE 
                WHEN year >= 2020 THEN '2020+'
                WHEN year >= 2015 THEN '2015-2019'
                WHEN year >= 2010 THEN '2010-2014'
                ELSE 'Pre-2010'
            END as year_range,
            COUNT(*) as count
        FROM vehicles
        WHERE year IS NOT NULL
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

