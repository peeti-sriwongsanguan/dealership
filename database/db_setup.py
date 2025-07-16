# database/db_setup.py

"""
Database Setup for OL Service POS System
Creates tables and core configuration only
Enhanced with comprehensive photo documentation system and truck repair management
"""

import sqlite3
import bcrypt
from datetime import datetime
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
                name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
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

        # Enhanced Vehicle Photos Table for comprehensive documentation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicle_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                service_id INTEGER,
                category VARCHAR(50) NOT NULL DEFAULT 'general',
                angle VARCHAR(100),
                description TEXT,
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100) DEFAULT 'image/jpeg',
                thumbnail_path VARCHAR(500),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                metadata TEXT,
                image_width INTEGER,
                image_height INTEGER,

                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
            )
        """)

        # Photo Sessions Table (groups related photos)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS photo_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                service_id INTEGER,
                session_type VARCHAR(50) NOT NULL,
                session_name VARCHAR(200),
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                created_by VARCHAR(100),
                notes TEXT,
                total_photos INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'active',

                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
            )
        """)

        # Link photos to sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_photos (
                session_id INTEGER NOT NULL,
                photo_id INTEGER NOT NULL,
                sequence_order INTEGER DEFAULT 0,

                PRIMARY KEY (session_id, photo_id),
                FOREIGN KEY (session_id) REFERENCES photo_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (photo_id) REFERENCES vehicle_photos(id) ON DELETE CASCADE
            )
        """)

        # Photos table (keeping for backwards compatibility)
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

        # TRUCK REPAIR MANAGEMENT TABLES

        # Material Forms table for truck repair material requisitions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS material_forms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_registration TEXT,
                date TEXT,
                requester_name TEXT NOT NULL,
                recipient_name TEXT,
                total_items INTEGER DEFAULT 0,
                service_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)

        # Material Form Items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS material_form_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                form_id INTEGER NOT NULL,
                item_number INTEGER,
                material_description TEXT,
                material_code TEXT,
                quantity INTEGER DEFAULT 0,
                unit TEXT,
                unit_cost REAL DEFAULT 0.0,
                total_cost REAL DEFAULT 0.0,
                supplier TEXT,
                notes TEXT,
                FOREIGN KEY (form_id) REFERENCES material_forms (id) ON DELETE CASCADE
            )
        """)

        # Repair Quotes table for truck repair estimates
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS repair_quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_number TEXT UNIQUE NOT NULL,
                vehicle_registration TEXT,
                chassis_number TEXT,
                engine_number TEXT,
                damage_date TEXT,
                quote_date TEXT NOT NULL,
                customer_name TEXT,
                vehicle_make TEXT,
                vehicle_model TEXT,
                vehicle_year INTEGER,
                vehicle_color TEXT,
                repair_type TEXT DEFAULT 'general',
                total_amount REAL DEFAULT 0,
                tax_amount REAL DEFAULT 0,
                discount_amount REAL DEFAULT 0,
                final_amount REAL DEFAULT 0,
                status TEXT DEFAULT 'new',
                service_id INTEGER,
                approved_by TEXT,
                approved_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        """)

        # Repair Quote Items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS repair_quote_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_id INTEGER NOT NULL,
                item_number INTEGER,
                part_code TEXT,
                description TEXT,
                color TEXT,
                side TEXT,
                quantity INTEGER DEFAULT 1,
                unit_price REAL DEFAULT 0,
                total_price REAL DEFAULT 0,
                category TEXT DEFAULT 'parts',
                supplier TEXT,
                estimated_delivery TEXT,
                notes TEXT,
                FOREIGN KEY (quote_id) REFERENCES repair_quotes (id) ON DELETE CASCADE
            )
        """)

        # Truck Parts Inventory table (for parts management)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS truck_parts_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                part_code TEXT UNIQUE NOT NULL,
                part_name_thai TEXT NOT NULL,
                part_name_english TEXT,
                category TEXT,
                supplier TEXT,
                cost_price REAL DEFAULT 0,
                selling_price REAL DEFAULT 0,
                quantity_in_stock INTEGER DEFAULT 0,
                min_stock_level INTEGER DEFAULT 0,
                location TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        """)

        # Payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                vehicle_id INTEGER,
                payment_method TEXT NOT NULL,
                amount REAL NOT NULL,
                fees REAL DEFAULT 0.0,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                processed_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                receipt_number TEXT,
                notes TEXT,
                FOREIGN KEY (service_id) REFERENCES services (id),
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
            )
        """)

        # Insurance Claims table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS insurance_claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER,
                customer_id INTEGER NOT NULL,
                vehicle_id INTEGER NOT NULL,
                claim_number TEXT UNIQUE NOT NULL,
                insurance_company TEXT,
                claim_amount REAL DEFAULT 0.0,
                deductible REAL DEFAULT 0.0,
                status TEXT DEFAULT 'pending',
                submitted_date TEXT,
                approved_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (service_id) REFERENCES services (id),
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
            )
        """)

        # Installment Plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS installment_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                vehicle_id INTEGER,
                total_amount REAL NOT NULL,
                down_payment REAL DEFAULT 0.0,
                monthly_payment REAL NOT NULL,
                number_of_months INTEGER NOT NULL,
                interest_rate REAL DEFAULT 0.0,
                next_payment_date TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES services (id),
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
            )
        """)


        # Create indexes for better performance

        # Photo system indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_photos_customer_id ON vehicle_photos(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_photos_category ON vehicle_photos(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_photos_timestamp ON vehicle_photos(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_photo_sessions_vehicle_id ON photo_sessions(vehicle_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_photo_sessions_session_type ON photo_sessions(session_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON session_photos(session_id)")

        # Truck repair indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_material_forms_date ON material_forms(date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_material_forms_status ON material_forms(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_material_forms_service_id ON material_forms(service_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_repair_quotes_quote_number ON repair_quotes(quote_number)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_repair_quotes_status ON repair_quotes(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_repair_quotes_service_id ON repair_quotes(service_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_truck_parts_part_code ON truck_parts_inventory(part_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_truck_parts_category ON truck_parts_inventory(category)")


        # Payment system indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_service_id ON payments(service_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer_id ON insurance_claims(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_customer_id ON installment_plans(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status)")

        # Insurance claims indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_service_id ON insurance_claims(service_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer_id ON insurance_claims(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_vehicle_id ON insurance_claims(vehicle_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_number ON insurance_claims(claim_number)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_insurance_claims_insurance_company ON insurance_claims(insurance_company)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_insurance_claims_submitted_date ON insurance_claims(submitted_date)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_insurance_claims_approved_date ON insurance_claims(approved_date)")

        # Installment plans indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_service_id ON installment_plans(service_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_customer_id ON installment_plans(customer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_vehicle_id ON installment_plans(vehicle_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_installment_plans_next_payment_date ON installment_plans(next_payment_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_installment_plans_created_at ON installment_plans(created_at)")

        conn.commit()
        print("✅ Database tables created successfully")


def fix_and_create_settings_table():
    """Fix settings table schema and create if needed"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if settings table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='settings'
        """)

        if not cursor.fetchone():
            # Table doesn't exist, create new one
            print("📝 Creating new settings table...")
            cursor.execute("""
                CREATE TABLE settings (
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
            conn.commit()
            return

        # Check current table structure
        cursor.execute("PRAGMA table_info(settings)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        # If we don't have category column, recreate table
        required_columns = {'category', 'key', 'value', 'description', 'created_at', 'updated_at'}
        if not required_columns.issubset(set(column_names)):

            print("🔄 Migrating settings table to new schema...")

            # Backup existing data
            cursor.execute("SELECT * FROM settings")
            existing_data = cursor.fetchall()
            old_columns = column_names

            # Drop and recreate
            cursor.execute("DROP TABLE settings")
            cursor.execute("""
                CREATE TABLE settings (
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

            # Try to migrate old data if any
            if existing_data:
                print(f"📦 Migrating {len(existing_data)} existing settings...")
                for row in existing_data:
                    old_row_dict = dict(zip(old_columns, row))

                    # Map old structure to new
                    category = old_row_dict.get('category', 'system')
                    key = old_row_dict.get('key',
                                           old_row_dict.get('name', f'setting_{old_row_dict.get("id", "unknown")}'))
                    value = old_row_dict.get('value', '')
                    description = old_row_dict.get('description', '')

                    try:
                        cursor.execute("""
                            INSERT INTO settings (category, key, value, description)
                            VALUES (?, ?, ?, ?)
                        """, (category, key, value, description))
                    except Exception as e:
                        print(f"Warning: Could not migrate setting {key}: {e}")

            conn.commit()
            print("✅ Settings table migration completed")


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


def create_default_settings():
    """Create default application settings"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if settings already exist
        cursor.execute("SELECT COUNT(*) FROM settings")
        settings_count = cursor.fetchone()[0]

        if settings_count == 0:
            default_settings = [
                ("ui", "theme", "default", "Application theme"),
                ("ui", "window_width", "1200", "Main window width"),
                ("ui", "window_height", "800", "Main window height"),
                ("camera", "default_camera", "0", "Default camera device ID"),
                ("camera", "photo_quality", "high", "Default photo quality setting"),
                ("camera", "auto_thumbnail", "true", "Generate thumbnails automatically"),
                ("photos", "required_angles", "front,rear,driver_side,passenger_side",
                 "Required photo angles for check-in"),
                ("photos", "max_file_size", "10485760", "Maximum photo file size in bytes (10MB)"),
                ("truck_repair", "default_tax_rate", "7", "Default tax rate percentage for quotes"),
                ("truck_repair", "quote_validity_days", "30", "Quote validity period in days"),
                ("truck_repair", "auto_generate_quote_number", "true", "Auto-generate quote numbers"),
                ("truck_repair", "require_approval", "true", "Require approval for material forms"),
                ("system", "backup_enabled", "true", "Enable automatic backups"),
                ("system", "backup_interval", "24", "Backup interval in hours")
            ]

            for setting in default_settings:
                cursor.execute("""
                    INSERT OR IGNORE INTO settings (category, key, value, description)
                    VALUES (?, ?, ?, ?)
                """, setting)

            conn.commit()
            print("✅ Default settings created successfully")
        else:
            print("✅ Settings already exist, skipping creation")


def initialize_truck_parts_inventory():
    """Initialize the truck parts inventory with common parts"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if parts already exist
        cursor.execute("SELECT COUNT(*) FROM truck_parts_inventory")
        parts_count = cursor.fetchone()[0]

        if parts_count == 0:
            # Common truck parts with Thai names
            truck_parts = [
                ("MIR1", "ขากระจก", "Mirror Bracket", "exterior", "Local Supplier", 150.00, 300.00, 50, 10, "A-01"),
                ("HEA1", "ไฟหน้า", "Headlight", "lighting", "OEM Parts", 800.00, 1500.00, 20, 5, "B-02"),
                ("DOO1", "ประตู", "Door", "body", "Body Parts Co", 2500.00, 4500.00, 10, 2, "C-01"),
                ("WIN1", "กระจก", "Window/Glass", "glass", "Glass Specialist", 600.00, 1200.00, 15, 3, "D-01"),
                ("TAI1", "ไฟท้าย", "Tail Light", "lighting", "OEM Parts", 450.00, 850.00, 25, 5, "B-03"),
                ("FRO1", "กระจังหน้า", "Front Grille", "exterior", "Local Supplier", 1200.00, 2200.00, 8, 2, "A-02"),
                ("FRO2", "กันชนหน้า", "Front Bumper", "body", "Body Parts Co", 3500.00, 6000.00, 6, 1, "C-02"),
                ("TUR1", "ไฟเลี้ยว", "Turn Signal", "lighting", "OEM Parts", 250.00, 480.00, 30, 8, "B-04"),
                ("DOO2", "เบ้ามือโด", "Door Handle Housing", "hardware", "Hardware Plus", 180.00, 350.00, 40, 10,
                 "E-01"),
                (
                    "WIN2", "ที่ปัดน้ำฝน", "Windshield Wiper", "maintenance", "Auto Parts", 120.00, 250.00, 60, 15,
                    "F-01"),
                ("LIG1", "แก้มไฟหรือหน้า", "Light Panel or Front Cover", "lighting", "OEM Parts", 350.00, 650.00, 18, 4,
                 "B-05"),
                ("REA1", "พลาสติกบังฝุ่นหลัง", "Rear Dust Cover (Plastic)", "exterior", "Plastic Parts", 95.00, 190.00,
                 35, 8, "A-03"),
                ("BUM1", "พลาสติกมุมกันชน", "Bumper Corner Plastic", "body", "Plastic Parts", 220.00, 420.00, 22, 5,
                 "C-03"),
                ("BUM2", "พลาสติกปิดมุมกันชน", "Bumper Corner Cover", "body", "Plastic Parts", 180.00, 350.00, 28, 6,
                 "C-04"),
                ("BUM3", "ไฟในกันชน", "Bumper Light", "lighting", "OEM Parts", 320.00, 600.00, 16, 4, "B-06"),
                ("BUM4", "พลาสติกปิดกันชน", "Bumper Cover", "body", "Plastic Parts", 450.00, 850.00, 12, 3, "C-05"),
                ("WAS1", "กระป๋องดีดน้ำ", "Washer Fluid Container", "maintenance", "Auto Parts", 85.00, 170.00, 45, 10,
                 "F-02"),
                ("BRA1", "แป้นจ่ายเบรคตรัซ", "Brake/Clutch Pedal", "brake_system", "Brake Specialist", 280.00, 520.00,
                 14, 3, "G-01"),
                ("FRO3", "มือจับแยงหน้า", "Front Handle", "hardware", "Hardware Plus", 130.00, 260.00, 38, 8, "E-02"),
                ("DOO3", "กันสาดประตู", "Door Visor/Rain Guard", "exterior", "Accessories", 75.00, 150.00, 55, 12,
                 "A-04")
            ]

            for part in truck_parts:
                cursor.execute("""
                    INSERT INTO truck_parts_inventory (
                        part_code, part_name_thai, part_name_english, category, supplier,
                        cost_price, selling_price, quantity_in_stock, min_stock_level, location
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, part)

            conn.commit()
            print("✅ Truck parts inventory initialized successfully")
        else:
            print("✅ Truck parts inventory already exists, skipping initialization")


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
    """Main database setup function - creates tables and essential configuration only"""
    try:
        print("🔧 Setting up database...")

        # Ensure data directory exists
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)

        # Create tables (excluding settings table)
        create_tables()

        # Fix and create settings table with proper schema FIRST
        fix_and_create_settings_table()

        # Create default users
        create_default_users()

        # Create default settings (now that table has proper schema)
        create_default_settings()

        # Initialize truck parts inventory
        initialize_truck_parts_inventory()

        print("✅ Database setup completed successfully")
        return True

    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Run setup when called directly
    print("🚀 Initializing OL Service POS Database (Core Schema)...")
    success = setup_database()

    if success:
        print("\n✅ Core database setup complete!")
        print("📋 You can now start the application")
        print("🔑 Default login credentials:")
        print("   Username: admin    Password: admin123")
        print("   Username: mechanic Password: mech123")
        print("   Username: manager  Password: manager123")
        print("\n📝 Next steps:")
        print("   - Run 'python -m database.sample_data' to add sample data (optional)")
        print("   - Start the application with 'python main.py'")
    else:
        print("\n❌ Database setup failed. Please check the error messages above.")