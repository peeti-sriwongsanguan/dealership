# database/service_db.py

import sqlite3
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')


def get_services_by_vehicle(vehicle_id):
    """Get all services for a specific vehicle"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
           s.mechanic_id, s.start_date, s.estimated_completion, 
           s.actual_completion, s.cost, u.username as mechanic_name
    FROM services s
    LEFT JOIN users u ON s.mechanic_id = u.id
    WHERE s.vehicle_id = ?
    ORDER BY s.start_date DESC
    """, (vehicle_id,))

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services


def get_services_by_customer(customer_id):
    """Get all services for a customer's vehicles"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
           s.mechanic_id, s.start_date, s.estimated_completion, 
           s.actual_completion, s.cost, u.username as mechanic_name,
           v.make, v.model, v.year, v.license_plate
    FROM services s
    LEFT JOIN users u ON s.mechanic_id = u.id
    JOIN vehicles v ON s.vehicle_id = v.id
    WHERE v.customer_id = ?
    ORDER BY s.start_date DESC
    """, (customer_id,))

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services


def get_service_by_id(service_id):
    """Get a specific service by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
           s.mechanic_id, s.start_date, s.estimated_completion, 
           s.actual_completion, s.cost, s.check_in_notes, u.username as mechanic_name,
           v.make, v.model, v.year, v.license_plate, v.customer_id,
           c.name as customer_name
    FROM services s
    LEFT JOIN users u ON s.mechanic_id = u.id
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE s.id = ?
    """, (service_id,))

    service = cursor.fetchone()

    conn.close()

    if service:
        return dict(service)
    return None


def create_service(service_data):
    """Create a new service"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    today = datetime.datetime.now().strftime("%Y-%m-%d")

    # Check if start_date is provided, otherwise use today
    start_date = service_data.get('start_date', today)

    cursor.execute("""
    INSERT INTO services (
        vehicle_id, service_type, description, status, 
        mechanic_id, start_date, estimated_completion, cost, check_in_notes
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        service_data.get('vehicle_id'),
        service_data.get('service_type', ''),
        service_data.get('description', ''),
        service_data.get('status', 'Pending'),
        service_data.get('mechanic_id'),
        start_date,
        service_data.get('estimated_completion'),
        service_data.get('cost', 0.0),
        service_data.get('check_in_notes', '')
    ))

    # Get the new service ID
    service_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return service_id


def update_service(service_id, service_data):
    """Update an existing service"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Start building the update query
    update_fields = []
    params = []

    # Add each field that's in the service_data
    if 'service_type' in service_data:
        update_fields.append("service_type = ?")
        params.append(service_data['service_type'])

    if 'description' in service_data:
        update_fields.append("description = ?")
        params.append(service_data['description'])

    if 'status' in service_data:
        update_fields.append("status = ?")
        params.append(service_data['status'])

    if 'mechanic_id' in service_data:
        update_fields.append("mechanic_id = ?")
        params.append(service_data['mechanic_id'])

    if 'estimated_completion' in service_data:
        update_fields.append("estimated_completion = ?")
        params.append(service_data['estimated_completion'])

    if 'actual_completion' in service_data:
        update_fields.append("actual_completion = ?")
        params.append(service_data['actual_completion'])

    if 'cost' in service_data:
        update_fields.append("cost = ?")
        params.append(service_data['cost'])

    if 'check_in_notes' in service_data:
        update_fields.append("check_in_notes = ?")
        params.append(service_data['check_in_notes'])

    # If no fields to update, return early
    if not update_fields:
        return False

    # Build the query
    query = f"UPDATE services SET {', '.join(update_fields)} WHERE id = ?"
    params.append(service_id)

    # Execute the query
    cursor.execute(query, params)

    conn.commit()
    result = cursor.rowcount > 0
    conn.close()

    return result


def delete_service(service_id):
    """Delete a service and its associated photos"""
    from database.photo_db import get_photos_for_service, delete_photo

    # Get all photos for this service so we can delete them
    photos = get_photos_for_service(service_id)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Start transaction
        cursor.execute("BEGIN TRANSACTION")

        # Delete the service
        cursor.execute("DELETE FROM services WHERE id = ?", (service_id,))

        # Commit the transaction
        cursor.execute("COMMIT")
        success = cursor.rowcount > 0
    except:
        # Rollback in case of error
        cursor.execute("ROLLBACK")
        success = False

    conn.close()

    # If service was deleted successfully, delete its photos
    if success and photos:
        for photo in photos:
            delete_photo(photo['id'])

    return success


def get_all_active_services():
    """Get all services that are not completed or cancelled"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
           s.mechanic_id, s.start_date, s.estimated_completion, 
           s.actual_completion, s.cost, u.username as mechanic_name,
           v.make, v.model, v.year, v.license_plate, v.customer_id,
           c.name as customer_name
    FROM services s
    LEFT JOIN users u ON s.mechanic_id = u.id
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE s.status != 'Completed' AND s.status != 'Cancelled'
    ORDER BY s.start_date DESC
    """)

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services


def get_mechanic_services(mechanic_id):
    """Get all active services assigned to a specific mechanic"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.vehicle_id, s.service_type, s.description, s.status, 
           s.mechanic_id, s.start_date, s.estimated_completion, 
           s.actual_completion, s.cost, u.username as mechanic_name,
           v.make, v.model, v.year, v.license_plate, v.customer_id,
           c.name as customer_name
    FROM services s
    LEFT JOIN users u ON s.mechanic_id = u.id
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE s.mechanic_id = ? AND (s.status != 'Completed' AND s.status != 'Cancelled')
    ORDER BY s.start_date DESC
    """, (mechanic_id,))

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services


def get_service_stats(from_date=None, to_date=None):
    """Get statistics about services for reporting"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # If dates not provided, use default range (last 30 days to today)
    if not from_date:
        from_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = datetime.datetime.now().strftime("%Y-%m-%d")

    # Get summary statistics
    cursor.execute("""
    SELECT COUNT(*) as total_services,
           SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
           SUM(CASE WHEN status = 'Awaiting Parts' THEN 1 ELSE 0 END) as awaiting_parts,
           SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold,
           SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
           SUM(cost) as total_revenue,
           AVG(cost) as avg_cost
    FROM services
    WHERE start_date BETWEEN ? AND ?
    """, (from_date, to_date))

    summary = dict(cursor.fetchone())

    # Get services by type
    cursor.execute("""
    SELECT service_type, COUNT(*) as count, 
           SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
           AVG(cost) as avg_cost
    FROM services
    WHERE start_date BETWEEN ? AND ?
    GROUP BY service_type
    ORDER BY count DESC
    """, (from_date, to_date))

    by_type = [dict(row) for row in cursor.fetchall()]

    # Get mechanic performance
    cursor.execute("""
    SELECT u.username as mechanic, 
           COUNT(*) as total_services,
           SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed,
           AVG(julianday(s.actual_completion) - julianday(s.start_date)) as avg_days,
           SUM(s.cost) as total_revenue
    FROM services s
    JOIN users u ON s.mechanic_id = u.id
    WHERE s.start_date BETWEEN ? AND ?
    GROUP BY s.mechanic_id
    ORDER BY total_services DESC
    """, (from_date, to_date))

    by_mechanic = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        'summary': summary,
        'by_type': by_type,
        'by_mechanic': by_mechanic
    }