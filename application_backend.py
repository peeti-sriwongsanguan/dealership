# application_backend.py
import os
import sqlite3
from dotenv import load_dotenv
from database.db_setup import verify_password

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')


def login(username, password):
    """Backend function for login verification

    This can be called directly from a web API
    """
    if not username or not password:
        return {"success": False, "message": "Username and password are required"}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get the user by username
    cursor.execute("SELECT id, role, password FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    conn.close()

    if user and verify_password(user[2], password):
        return {
            "success": True,
            "user": {
                'id': user[0],
                'username': username,
                'role': user[1]
            }
        }
    else:
        return {"success": False, "message": "Invalid username or password"}


def get_all_customers():
    """Get all customers - example backend function"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, phone, email, address FROM customers ORDER BY name")
    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return customers


def get_active_services():
    """Get all active services - example backend function"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.id, s.service_type, s.status, s.start_date, s.estimated_completion,
           v.make, v.model, v.year, c.name as customer_name
    FROM services s
    JOIN vehicles v ON s.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE s.status != 'Completed' AND s.status != 'Cancelled'
    ORDER BY s.start_date DESC
    """)

    services = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return services