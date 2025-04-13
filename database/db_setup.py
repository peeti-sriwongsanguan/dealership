# database/db_setup.py
import sqlite3
import os
import hashlib
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')


def hash_password(password):
    """Hash a password using bcrypt"""
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')  # Store as string in the database


def verify_password(stored_hash, provided_password):
    """Verify a password against its hash"""
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hash.encode('utf-8'))


def setup_database():
    """Create database and tables if they don't exist"""
    # Create database directory if it doesn't exist
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')

    # Create Customers table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        registration_date TEXT
    )
    ''')

    # Create Vehicles table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        vin TEXT UNIQUE,
        license_plate TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
    ''')

    # Create Services table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        vehicle_id INTEGER,
        service_type TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        mechanic_id INTEGER,
        start_date TEXT,
        estimated_completion TEXT,
        actual_completion TEXT,
        cost REAL,
        check_in_notes TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
        FOREIGN KEY (mechanic_id) REFERENCES users (id)
    )
    ''')

    # Create Photos table with customer_id and vehicle_id fields
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vehicle_photos (
        id INTEGER PRIMARY KEY,
        service_id INTEGER,
        vehicle_id INTEGER,
        customer_id INTEGER,
        photo_path TEXT NOT NULL,
        description TEXT,
        timestamp TEXT,
        FOREIGN KEY (service_id) REFERENCES services (id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
    ''')

    # Create Settings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        settings_json TEXT NOT NULL
    )
    ''')

    # Get admin credentials from environment variables
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    admin_role = os.getenv('ADMIN_ROLE', 'admin')

    # Get mechanic credentials from environment variables
    mechanic_username = os.getenv('MECHANIC_USERNAME', 'mechanic')
    mechanic_password = os.getenv('MECHANIC_PASSWORD', 'mech123')
    mechanic_role = os.getenv('MECHANIC_ROLE', 'mechanic')

    # Check if admin user exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (admin_username,))
    if not cursor.fetchone():
        # Insert admin user with hashed password
        hashed_admin_password = hash_password(admin_password)
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                       (admin_username, hashed_admin_password, admin_role))

    # Check if mechanic user exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (mechanic_username,))
    if not cursor.fetchone():
        # Insert mechanic user with hashed password
        hashed_mechanic_password = hash_password(mechanic_password)
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                       (mechanic_username, hashed_mechanic_password, mechanic_role))

    # Add indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles (customer_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON services (vehicle_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_services_mechanic_id ON services (mechanic_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_service_id ON vehicle_photos (service_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_vehicle_id ON vehicle_photos (vehicle_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_photos_customer_id ON vehicle_photos (customer_id)")

    conn.commit()
    conn.close()


def create_test_data():
    """Create test data for development and testing"""
    from datetime import datetime, timedelta
    import random

    # Check if there's already data in the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM customers")
    customer_count = cursor.fetchone()[0]

    # If there's already data, don't add more
    if customer_count > 0:
        conn.close()
        return

    # Customer data
    customer_data = [
        {"name": "John Smith", "phone": "555-123-4567", "email": "john.smith@example.com", "address": "123 Main St"},
        {"name": "Jane Doe", "phone": "555-234-5678", "email": "jane.doe@example.com", "address": "456 Oak Ave"},
        {"name": "Bob Johnson", "phone": "555-345-6789", "email": "bob.johnson@example.com",
         "address": "789 Pine Blvd"},
        {"name": "Alice Williams", "phone": "555-456-7890", "email": "alice.williams@example.com",
         "address": "321 Elm St"},
        {"name": "David Brown", "phone": "555-567-8901", "email": "david.brown@example.com", "address": "654 Maple Dr"}
    ]

    # Vehicle data (make, model, year range)
    vehicle_data = [
        {"make": "Toyota", "model": "Camry", "min_year": 2010, "max_year": 2023},
        {"make": "Honda", "model": "Accord", "min_year": 2012, "max_year": 2023},
        {"make": "Ford", "model": "F-150", "min_year": 2015, "max_year": 2023},
        {"make": "Chevrolet", "model": "Silverado", "min_year": 2014, "max_year": 2023},
        {"make": "Nissan", "model": "Altima", "min_year": 2013, "max_year": 2023},
        {"make": "Toyota", "model": "RAV4", "min_year": 2016, "max_year": 2023},
        {"make": "Honda", "model": "Civic", "min_year": 2015, "max_year": 2023},
        {"make": "Ford", "model": "Explorer", "min_year": 2017, "max_year": 2023},
        {"make": "Jeep", "model": "Wrangler", "min_year": 2018, "max_year": 2023},
        {"make": "Subaru", "model": "Outback", "min_year": 2016, "max_year": 2023}
    ]

    # Service types
    service_types = ["Oil Change", "Brake Service", "Tire Rotation", "Engine Tune-Up", "Transmission Service",
                     "Air Conditioning Service", "Battery Replacement", "Wheel Alignment", "Diagnostic Test",
                     "Scheduled Maintenance"]

    # Service statuses
    service_statuses = ["Pending", "In Progress", "Awaiting Parts", "On Hold", "Completed", "Cancelled"]

    # Get mechanic ID
    cursor.execute("SELECT id FROM users WHERE role = 'mechanic' LIMIT 1")
    mechanic_id = cursor.fetchone()[0]

    # Insert customers
    customer_ids = []
    for customer in customer_data:
        reg_date = (datetime.now() - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d")
        cursor.execute("""
        INSERT INTO customers (name, phone, email, address, registration_date) 
        VALUES (?, ?, ?, ?, ?)
        """, (customer["name"], customer["phone"], customer["email"], customer["address"], reg_date))
        customer_ids.append(cursor.lastrowid)

    # Insert vehicles (1-3 per customer)
    vehicle_ids = []
    for customer_id in customer_ids:
        num_vehicles = random.randint(1, 3)
        for _ in range(num_vehicles):
            vehicle = random.choice(vehicle_data)
            year = random.randint(vehicle["min_year"], vehicle["max_year"])
            vin = f"VIN{random.randint(10000000, 99999999)}"
            license_plate = f"{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1000, 9999)}"

            cursor.execute("""
            INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate) 
            VALUES (?, ?, ?, ?, ?, ?)
            """, (customer_id, vehicle["make"], vehicle["model"], year, vin, license_plate))
            vehicle_ids.append(cursor.lastrowid)

    # Insert services (1-5 per vehicle)
    for vehicle_id in vehicle_ids:
        num_services = random.randint(1, 5)
        for _ in range(num_services):
            service_type = random.choice(service_types)
            status = random.choice(service_statuses)

            # Generate dates
            days_ago = random.randint(1, 180)
            start_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

            estimated_completion = (datetime.now() - timedelta(days=days_ago - random.randint(1, 7))).strftime(
                "%Y-%m-%d")

            actual_completion = None
            if status == "Completed":
                actual_completion = (datetime.now() - timedelta(days=days_ago - random.randint(1, 10))).strftime(
                    "%Y-%m-%d")

            # Generate cost
            cost = round(random.uniform(50, 1500), 2)

            # Description
            description = f"{service_type} service performed on vehicle. " + \
                          random.choice(["Routine maintenance.", "Customer reported issues.",
                                         "Follow-up service.", "Warranty service.", ""])

            cursor.execute("""
            INSERT INTO services (vehicle_id, service_type, description, status, mechanic_id, 
                                start_date, estimated_completion, actual_completion, cost) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (vehicle_id, service_type, description, status, mechanic_id,
                  start_date, estimated_completion, actual_completion, cost))

    conn.commit()
    conn.close()
    print("Test data created successfully!")


if __name__ == "__main__":
    # Execute when run directly
    setup_database()
    create_test_data()
    print(f"Database initialized at {DB_PATH}")