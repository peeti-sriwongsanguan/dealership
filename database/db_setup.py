# database/db_setup.py (Enhanced Version)

"""
Database Setup for OL Service POS System
Creates tables and initializes the database with sample data
"""

import sqlite3
import bcrypt
from datetime import datetime, timedelta
from pathlib import Path
from database.connection_manager import db_manager


def create_tables():
    """Create all necessary tables for the POS system"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Users table for authentication
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                full_name TEXT,
                email TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT,
                is_active INTEGER DEFAULT 1
            )
        """)

        # Customers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            )
        """)

        # Vehicles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                make TEXT NOT NULL,
                model TEXT NOT NULL,
                year INTEGER,
                vin TEXT UNIQUE,
                license_plate TEXT,
                color TEXT,
                mileage INTEGER,
                vehicle_type TEXT DEFAULT 'car',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        """)

        # Services table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                vehicle_id INTEGER NOT NULL,
                service_type TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                scheduled_date TEXT,
                completed_date TEXT,
                estimated_cost REAL DEFAULT 0.0,
                actual_cost REAL DEFAULT 0.0,
                technician_id INTEGER,
                priority TEXT DEFAULT 'normal',
                notes TEXT,
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
                FOREIGN KEY (technician_id) REFERENCES users (id)
            )
        """)

        # Photos table for vehicle documentation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id INTEGER,
                service_id INTEGER,
                file_path TEXT NOT NULL,
                filename TEXT NOT NULL,
                description TEXT,
                photo_type TEXT DEFAULT 'general',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                file_size INTEGER,
                image_width INTEGER,
                image_height INTEGER,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)

        # Damage reports table for vehicle damage tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS damage_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                vehicle_id INTEGER NOT NULL,
                vehicle_type TEXT NOT NULL,
                damage_points TEXT DEFAULT '[]',
                total_estimated_cost REAL DEFAULT 0.0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
            )
        """)

        # Service items table for detailed service breakdown
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS service_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                description TEXT,
                quantity REAL DEFAULT 1.0,
                unit_price REAL DEFAULT 0.0,
                total_price REAL DEFAULT 0.0,
                category TEXT DEFAULT 'service',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)

        # Settings table for application configuration
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, key)
            )
        """)

        # Audit log table for tracking changes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                table_name TEXT NOT NULL,
                record_id INTEGER,
                action TEXT NOT NULL,
                old_values TEXT,
                new_values TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        conn.commit()
        print("✅ Database tables created successfully")


def create_default_users():
    """Create default user accounts"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if users already exist
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        if user_count == 0:
            # Create default admin user
            admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO users (username, password_hash, role, full_name, email)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "admin",
                admin_password.decode('utf-8'),
                "admin",
                "System Administrator",
                "admin@olservice.com"
            ))

            # Create default mechanic user
            mechanic_password = bcrypt.hashpw("mech123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO users (username, password_hash, role, full_name, email)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "mechanic",
                mechanic_password.decode('utf-8'),
                "technician",
                "John Mechanic",
                "mechanic@olservice.com"
            ))

            # Create default manager user
            manager_password = bcrypt.hashpw("manager123".encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO users (username, password_hash, role, full_name, email)
                VALUES (?, ?, ?, ?, ?)
            """, (
                "manager",
                manager_password.decode('utf-8'),
                "manager",
                "Service Manager",
                "manager@olservice.com"
            ))

            conn.commit()
            print("✅ Default users created successfully")
        else:
            print("✅ Users already exist, skipping user creation")


def create_test_data():
    """Create sample test data for development and testing"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if test data already exists
        cursor.execute("SELECT COUNT(*) FROM customers")
        customer_count = cursor.fetchone()[0]

        if customer_count == 0:
            # Create sample customers
            sample_customers = [
                ("John", "Smith", "john.smith@email.com", "555-1234", "123 Main St", "Springfield", "IL", "62701"),
                ("Jane", "Doe", "jane.doe@email.com", "555-5678", "456 Oak Ave", "Springfield", "IL", "62702"),
                ("Bob", "Johnson", "bob.johnson@email.com", "555-9012", "789 Pine Rd", "Springfield", "IL", "62703"),
                ("Alice", "Williams", "alice.williams@email.com", "555-3456", "321 Elm St", "Springfield", "IL",
                 "62704"),
                ("Mike", "Brown", "mike.brown@email.com", "555-7890", "654 Maple Dr", "Springfield", "IL", "62705")
            ]

            for customer in sample_customers:
                cursor.execute("""
                    INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, customer)

            # Create sample vehicles
            sample_vehicles = [
                (1, "Toyota", "Camry", 2020, "1HGBH41JXMN109186", "ABC123", "Silver", 25000, "car"),
                (1, "Honda", "Civic", 2019, "2HGFC2F59JH123456", "DEF456", "Blue", 30000, "car"),
                (2, "Ford", "F-150", 2021, "1FTFW1ET5MFA12345", "GHI789", "Red", 15000, "truck"),
                (3, "Chevrolet", "Malibu", 2018, "1G1ZD5ST4JF123456", "JKL012", "White", 45000, "car"),
                (4, "BMW", "X5", 2022, "5UXCR6C05M0A12345", "MNO345", "Black", 8000, "suv"),
                (5, "Mercedes", "Sprinter", 2020, "WD3PE8CD5L5123456", "PQR678", "White", 35000, "van")
            ]

            for vehicle in sample_vehicles:
                cursor.execute("""
                    INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage, vehicle_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, vehicle)

            # Create sample services
            sample_services = [
                (1, 1, "Oil Change", "Regular oil change service", "completed",
                 (datetime.now() - timedelta(days=7)).isoformat(),
                 (datetime.now() - timedelta(days=6)).isoformat(), 50.0, 45.0, 2),
                (2, 3, "Brake Inspection", "Annual brake system inspection", "in_progress",
                 datetime.now().isoformat(), None, 150.0, 0.0, 2),
                (3, 4, "Tire Rotation", "Rotate all four tires", "pending",
                 (datetime.now() + timedelta(days=2)).isoformat(), None, 80.0, 0.0, 2),
                (4, 5, "Transmission Service", "Transmission fluid change", "completed",
                 (datetime.now() - timedelta(days=14)).isoformat(),
                 (datetime.now() - timedelta(days=13)).isoformat(), 200.0, 185.0, 2),
                (5, 6, "Pre-delivery Inspection", "Complete vehicle inspection before delivery", "pending",
                 (datetime.now() + timedelta(days=1)).isoformat(), None, 300.0, 0.0, 2)
            ]

            for service in sample_services:
                cursor.execute("""
                    INSERT INTO services (customer_id, vehicle_id, service_type, description, status, 
                                        scheduled_date, completed_date, estimated_cost, actual_cost, technician_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, service)

            # Create sample damage reports
            sample_damage_reports = [
                (5, 6, "van", "[]", 0.0, datetime.now().isoformat(), datetime.now().isoformat(),
                 "Pre-delivery inspection damage assessment"),
                (2, 3, "truck", "[]", 0.0, (datetime.now() - timedelta(days=3)).isoformat(),
                 (datetime.now() - timedelta(days=3)).isoformat(), "Customer reported damage assessment")
            ]

            for report in sample_damage_reports:
                cursor.execute("""
                    INSERT INTO damage_reports (customer_id, vehicle_id, vehicle_type, damage_points, 
                                              total_estimated_cost, created_at, updated_at, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, report)

            # Create sample settings
            sample_settings = [
                ("ui", "theme", "default", "Application theme"),
                ("ui", "window_width", "1200", "Main window width"),
                ("ui", "window_height", "800", "Main window height"),
                ("camera", "default_camera", "0", "Default camera device ID"),
                ("system", "backup_enabled", "true", "Enable automatic backups"),
                ("system", "backup_interval", "24", "Backup interval in hours")
            ]

            for setting in sample_settings:
                cursor.execute("""
                    INSERT INTO settings (category, key, value, description)
                    VALUES (?, ?, ?, ?)
                """, setting)

            conn.commit()
            print("✅ Test data created successfully")
        else:
            print("✅ Test data already exists, skipping data creation")


def verify_password(username: str, password: str) -> bool:
    """Verify user password against database"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT password_hash FROM users 
                WHERE username = ? AND is_active = 1
            """, (username,))

            result = cursor.fetchone()
            if result:
                stored_hash = result['password_hash']
                return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
            return False

    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


def get_user_info(username: str) -> dict:
    """Get user information from database"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, role, full_name, email 
                FROM users 
                WHERE username = ? AND is_active = 1
            """, (username,))

            result = cursor.fetchone()
            if result:
                return {
                    'id': result['id'],
                    'username': result['username'],
                    'role': result['role'],
                    'full_name': result['full_name'],
                    'email': result['email']
                }
            return {}

    except Exception as e:
        print(f"Error getting user info: {e}")
        return {}


def update_last_login(username: str) -> bool:
    """Update user's last login timestamp"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users 
                SET last_login = ? 
                WHERE username = ?
            """, (datetime.now().isoformat(), username))

            conn.commit()
            return cursor.rowcount > 0

    except Exception as e:
        print(f"Error updating last login: {e}")
        return False


def setup_database():
    """Main database setup function"""
    try:
        print("🔧 Setting up database...")

        # Ensure data directory exists
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)

        # Create tables
        create_tables()

        # Create default users
        create_default_users()

        print("✅ Database setup completed successfully")
        return True

    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False


def initialize_with_test_data():
    """Initialize database with test data"""
    try:
        setup_database()
        create_test_data()
        print("✅ Database initialized with test data")
        return True

    except Exception as e:
        print(f"❌ Error initializing test data: {e}")
        return False


if __name__ == "__main__":
    # Run setup when called directly
    print("🚀 Initializing OL Service POS Database...")
    success = initialize_with_test_data()

    if success:
        print("\n🎉 Database setup complete!")
        print("📋 You can now start the application with: python main.py")
        print("🔑 Default login credentials:")
        print("   Username: admin    Password: admin123")
        print("   Username: mechanic Password: mech123")
        print("   Username: manager  Password: manager123")
    else:
        print("\n❌ Database setup failed. Please check the error messages above.")