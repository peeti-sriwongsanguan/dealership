# database/customer_db.py
import sqlite3
import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')


def get_all_customers():
    """Get all customers from the database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, phone, email, address, registration_date FROM customers ORDER BY name")
    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return customers


def search_customers(search_term):
    """Search customers by name, phone, or email"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, name, phone, email, address, registration_date 
    FROM customers 
    WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
    ORDER BY name
    """, (f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))

    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return customers


def get_customer_by_id(customer_id):
    """Get a specific customer by ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, name, phone, email, address, registration_date 
    FROM customers 
    WHERE id = ?
    """, (customer_id,))

    customer = cursor.fetchone()

    conn.close()

    if customer:
        return dict(customer)
    return None


def get_customer_with_vehicles(customer_id):
    """Get a customer with their vehicles"""
    customer = get_customer_by_id(customer_id)
    if not customer:
        return None

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT id, make, model, year, vin, license_plate
    FROM vehicles
    WHERE customer_id = ?
    ORDER BY make, model
    """, (customer_id,))

    vehicles = [dict(row) for row in cursor.fetchall()]

    conn.close()

    customer['vehicles'] = vehicles
    return customer


def create_customer(customer_data):
    """Create a new customer"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    today = datetime.datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO customers (name, phone, email, address, registration_date) 
    VALUES (?, ?, ?, ?, ?)
    """, (
        customer_data.get('name', ''),
        customer_data.get('phone', ''),
        customer_data.get('email', ''),
        customer_data.get('address', ''),
        today
    ))

    # Get the new customer ID
    customer_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return customer_id


def update_customer(customer_id, customer_data):
    """Update an existing customer"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE customers 
    SET name = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
    """, (
        customer_data.get('name', ''),
        customer_data.get('phone', ''),
        customer_data.get('email', ''),
        customer_data.get('address', ''),
        customer_id
    ))

    conn.commit()

    success = cursor.rowcount > 0
    conn.close()

    return success


def delete_customer(customer_id):
    """Delete a customer and all related vehicles and services"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Begin transaction
        cursor.execute("BEGIN TRANSACTION")

        # Get all vehicles for this customer
        cursor.execute("SELECT id FROM vehicles WHERE customer_id = ?", (customer_id,))
        vehicle_ids = [row[0] for row in cursor.fetchall()]

        # Get all services for these vehicles
        service_ids = []
        for vehicle_id in vehicle_ids:
            cursor.execute("SELECT id FROM services WHERE vehicle_id = ?", (vehicle_id,))
            service_ids.extend([row[0] for row in cursor.fetchall()])

        # Delete services for all vehicles
        for vehicle_id in vehicle_ids:
            cursor.execute("DELETE FROM services WHERE vehicle_id = ?", (vehicle_id,))

        # Delete all vehicles
        cursor.execute("DELETE FROM vehicles WHERE customer_id = ?", (customer_id,))

        # Delete the customer
        cursor.execute("DELETE FROM customers WHERE id = ?", (customer_id,))

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
        print(f"Error deleting customer: {e}")
        success = False

    conn.close()
    return success


def get_customer_stats():
    """Get customer statistics for reporting"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get total customers and recent registrations
    cursor.execute("""
    SELECT COUNT(*) as total_customers,
           SUM(CASE WHEN registration_date >= date('now', '-30 days') THEN 1 ELSE 0 END) as new_last_30_days,
           SUM(CASE WHEN registration_date >= date('now', '-90 days') THEN 1 ELSE 0 END) as new_last_90_days
    FROM customers
    """)

    summary = dict(cursor.fetchone())

    # Get customers with most vehicles
    cursor.execute("""
    SELECT c.id, c.name, COUNT(v.id) as vehicle_count
    FROM customers c
    JOIN vehicles v ON c.customer_id = v.id
    GROUP BY c.id
    ORDER BY vehicle_count DESC
    LIMIT 10
    """)

    most_vehicles = [dict(row) for row in cursor.fetchall()]

    # Get customers with most services
    cursor.execute("""
    SELECT c.id, c.name, COUNT(s.id) as service_count, SUM(s.cost) as total_spent
    FROM customers c
    JOIN vehicles v ON c.id = v.customer_id
    JOIN services s ON v.id = s.vehicle_id
    GROUP BY c.id
    ORDER BY service_count DESC
    LIMIT 10
    """)

    most_services = [dict(row) for row in cursor.fetchall()]

    # Get monthly registrations trend
    cursor.execute("""
    SELECT strftime('%Y-%m', registration_date) as month, COUNT(*) as count
    FROM customers
    WHERE registration_date >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month
    """)

    monthly_registrations = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        'summary': summary,
        'most_vehicles': most_vehicles,
        'most_services': most_services,
        'monthly_registrations': monthly_registrations
    }


def get_top_customers_by_revenue(limit=10):
    """Get top customers by revenue spent"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT c.id, c.name, COUNT(s.id) as service_count, SUM(s.cost) as total_spent
    FROM customers c
    JOIN vehicles v ON c.id = v.customer_id
    JOIN services s ON v.id = s.vehicle_id
    WHERE s.status = 'Completed'
    GROUP BY c.id
    ORDER BY total_spent DESC
    LIMIT ?
    """, (limit,))

    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return customers


def get_customer_service_history(customer_id):
    """Get the complete service history for a customer"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.service_type, s.description, s.status, s.start_date,
           s.estimated_completion, s.actual_completion, s.cost,
           v.make, v.model, v.year, v.license_plate,
           u.username as mechanic_name
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN users u ON s.mechanic_id = u.id
    WHERE v.customer_id = ?
    ORDER BY s.start_date DESC
    """, (customer_id,))

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services


def get_customer_spend(customer_id):
    """Get spending statistics for a specific customer"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get total spent and service counts
    cursor.execute("""
    SELECT COUNT(s.id) as total_services,
           SUM(s.cost) as total_spent,
           AVG(s.cost) as avg_service_cost,
           MAX(s.cost) as most_expensive_service,
           COUNT(DISTINCT v.id) as vehicle_count
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    WHERE v.customer_id = ? AND s.status = 'Completed'
    """, (customer_id,))

    spending = dict(cursor.fetchone() or {})

    # Set defaults for empty results
    if not spending.get('total_services'):
        spending = {
            'total_services': 0,
            'total_spent': 0,
            'avg_service_cost': 0,
            'most_expensive_service': 0,
            'vehicle_count': 0
        }

    # Get spending by service type
    cursor.execute("""
    SELECT s.service_type, COUNT(s.id) as count, SUM(s.cost) as total_cost
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    WHERE v.customer_id = ? AND s.status = 'Completed'
    GROUP BY s.service_type
    ORDER BY total_cost DESC
    """, (customer_id,))

    by_service_type = [dict(row) for row in cursor.fetchall()]

    # Get spending by vehicle
    cursor.execute("""
    SELECT v.id, v.make, v.model, v.year, v.license_plate,
           COUNT(s.id) as service_count, SUM(s.cost) as total_cost
    FROM vehicles v
    LEFT JOIN services s ON v.id = s.vehicle_id AND s.status = 'Completed'
    WHERE v.customer_id = ?
    GROUP BY v.id
    ORDER BY total_cost DESC
    """, (customer_id,))

    by_vehicle = [dict(row) for row in cursor.fetchall()]

    # Get recent services
    cursor.execute("""
    SELECT s.id, s.service_type, s.description, s.status, s.start_date,
           s.actual_completion, s.cost,
           v.make, v.model, v.year
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    WHERE v.customer_id = ?
    ORDER BY s.start_date DESC
    LIMIT 5
    """, (customer_id,))

    recent_services = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        'summary': spending,
        'by_service_type': by_service_type,
        'by_vehicle': by_vehicle,
        'recent_services': recent_services
    }


def get_customers_without_recent_service(days=90):
    """Get customers who haven't had service in the specified days"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT c.id, c.name, c.phone, c.email,
           MAX(s.start_date) as last_service_date,
           julianday('now') - julianday(MAX(s.start_date)) as days_since_service
    FROM customers c
    JOIN vehicles v ON c.id = v.customer_id
    LEFT JOIN services s ON v.id = s.vehicle_id
    GROUP BY c.id
    HAVING days_since_service > ? OR days_since_service IS NULL
    ORDER BY days_since_service DESC
    """, (days,))

    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return customers