# database/db_setup.py
import sqlite3
import os
import hashlib
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()

# Get database path from environment variables
DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')

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
    os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else '.', exist_ok=True)

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

    # Insert a default admin user if none exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (admin_username,))
    if not cursor.fetchone():
        hashed_admin_password = hash_password(admin_password)
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                       (admin_username, hashed_admin_password, admin_role))

    # Insert a default mechanic user if none exists
    cursor.execute("SELECT * FROM users WHERE username = ?", (mechanic_username,))
    if not cursor.fetchone():
        hashed_mechanic_password = hash_password(mechanic_password)
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                       (mechanic_username, hashed_mechanic_password, mechanic_role))

    conn.commit()
    conn.close()