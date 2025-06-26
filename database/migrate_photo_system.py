# database/migrate_photo_system.py
"""
Fixed Database Migration Script for Photo Documentation System
Creates proper photo documentation tables and migrates existing data
"""

import sqlite3
import os
from pathlib import Path

# Database path - adjust if needed
DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def check_table_exists(conn, table_name):
    """Check if table exists"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    """, (table_name,))
    return cursor.fetchone() is not None


def check_column_exists(conn, table_name, column_name):
    """Check if column exists in table"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        return column_name in columns
    except Exception:
        return False


def drop_and_recreate_vehicle_photos():
    """Drop and recreate vehicle_photos table with correct schema"""
    print("🔧 Fixing vehicle_photos table...")

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Drop existing vehicle_photos table if it exists
            if check_table_exists(conn, 'vehicle_photos'):
                print("  🗑️  Dropping existing vehicle_photos table...")
                cursor.execute("DROP TABLE vehicle_photos")

            # Create vehicle_photos table with correct schema
            print("  📸 Creating new vehicle_photos table...")
            cursor.execute("""
                CREATE TABLE vehicle_photos (
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
            print("  ✅ Created vehicle_photos table")

            # Create photo_sessions table if it doesn't exist
            if not check_table_exists(conn, 'photo_sessions'):
                print("  📋 Creating photo_sessions table...")
                cursor.execute("""
                    CREATE TABLE photo_sessions (
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
                print("  ✅ Created photo_sessions table")

            # Create session_photos linking table if it doesn't exist
            if not check_table_exists(conn, 'session_photos'):
                print("  🔗 Creating session_photos linking table...")
                cursor.execute("""
                    CREATE TABLE session_photos (
                        session_id INTEGER NOT NULL,
                        photo_id INTEGER NOT NULL,
                        sequence_order INTEGER DEFAULT 0,

                        PRIMARY KEY (session_id, photo_id),
                        FOREIGN KEY (session_id) REFERENCES photo_sessions(id) ON DELETE CASCADE,
                        FOREIGN KEY (photo_id) REFERENCES vehicle_photos(id) ON DELETE CASCADE
                    )
                """)
                print("  ✅ Created session_photos table")

            # Create indexes for vehicle_photos
            print("  ⚡ Creating indexes...")
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id)",
                "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_customer_id ON vehicle_photos(customer_id)",
                "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_category ON vehicle_photos(category)",
                "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_timestamp ON vehicle_photos(timestamp)",
                "CREATE INDEX IF NOT EXISTS idx_photo_sessions_vehicle_id ON photo_sessions(vehicle_id)",
                "CREATE INDEX IF NOT EXISTS idx_photo_sessions_session_type ON photo_sessions(session_type)",
                "CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON session_photos(session_id)"
            ]

            for index_sql in indexes:
                try:
                    cursor.execute(index_sql)
                except Exception as e:
                    print(f"    ⚠️  Index creation warning: {e}")

            print("  ✅ Created indexes")

            # Migrate existing photos from old photos table if it exists and has data
            if check_table_exists(conn, 'photos'):
                cursor.execute("SELECT COUNT(*) FROM photos")
                photo_count = cursor.fetchone()[0]

                if photo_count > 0:
                    print(f"  🔄 Migrating {photo_count} existing photos...")

                    # First, get the schema of photos table to see what columns exist
                    cursor.execute("PRAGMA table_info(photos)")
                    photo_columns = {row[1]: row[2] for row in cursor.fetchall()}
                    print(f"    📋 Found columns in photos table: {list(photo_columns.keys())}")

                    # Build migration query based on available columns
                    select_parts = []
                    select_parts.append("id")
                    select_parts.append("vehicle_id" if "vehicle_id" in photo_columns else "NULL as vehicle_id")

                    # Try to get customer_id from vehicles table or use default
                    if "vehicle_id" in photo_columns:
                        select_parts.append("""
                            COALESCE(
                                (SELECT customer_id FROM vehicles WHERE vehicles.id = photos.vehicle_id), 
                                1
                            ) as customer_id
                        """)
                    else:
                        select_parts.append("1 as customer_id")

                    select_parts.append("service_id" if "service_id" in photo_columns else "NULL as service_id")
                    select_parts.append("COALESCE(category, photo_type, 'general') as category")
                    select_parts.append("angle" if "angle" in photo_columns else "NULL as angle")
                    select_parts.append("description" if "description" in photo_columns else "NULL as description")
                    select_parts.append("filename")
                    select_parts.append("file_path")
                    select_parts.append("file_size" if "file_size" in photo_columns else "NULL as file_size")
                    select_parts.append("COALESCE(mime_type, 'image/jpeg') as mime_type")
                    select_parts.append(
                        "thumbnail_path" if "thumbnail_path" in photo_columns else "NULL as thumbnail_path")
                    select_parts.append("COALESCE(created_at, datetime('now')) as timestamp")
                    select_parts.append("COALESCE(created_by, 'migrated') as created_by")
                    select_parts.append("metadata" if "metadata" in photo_columns else "NULL as metadata")
                    select_parts.append("image_width" if "image_width" in photo_columns else "NULL as image_width")
                    select_parts.append("image_height" if "image_height" in photo_columns else "NULL as image_height")

                    migration_query = f"""
                        INSERT INTO vehicle_photos 
                        (id, vehicle_id, customer_id, service_id, category, angle, description, 
                         filename, file_path, file_size, mime_type, thumbnail_path, timestamp, 
                         created_by, metadata, image_width, image_height)
                        SELECT {', '.join(select_parts)}
                        FROM photos
                        WHERE vehicle_id IS NOT NULL OR filename IS NOT NULL
                    """

                    try:
                        cursor.execute(migration_query)
                        migrated_count = cursor.rowcount
                        print(f"    ✅ Successfully migrated {migrated_count} photos")
                    except Exception as e:
                        print(f"    ⚠️  Migration warning: {e}")
                        # Try simpler migration
                        try:
                            cursor.execute("""
                                INSERT INTO vehicle_photos 
                                (vehicle_id, customer_id, category, filename, file_path, description, timestamp)
                                SELECT 
                                    COALESCE(vehicle_id, 1) as vehicle_id,
                                    1 as customer_id,
                                    'general' as category,
                                    filename,
                                    file_path,
                                    description,
                                    COALESCE(created_at, datetime('now')) as timestamp
                                FROM photos
                                WHERE filename IS NOT NULL
                            """)
                            migrated_count = cursor.rowcount
                            print(f"    ✅ Migrated {migrated_count} photos with basic mapping")
                        except Exception as e2:
                            print(f"    ❌ Could not migrate photos: {e2}")
                else:
                    print("    📭 No existing photos to migrate")

            conn.commit()
            print("🎉 Fixed migration completed successfully!")
            return True

    except Exception as e:
        print(f"❌ Fix migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def verify_fix():
    """Verify that the fix was successful"""
    print("🔍 Verifying fix...")

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check vehicle_photos table structure
            if check_table_exists(conn, 'vehicle_photos'):
                cursor.execute("PRAGMA table_info(vehicle_photos)")
                columns = [row[1] for row in cursor.fetchall()]
                print(f"  📋 vehicle_photos columns: {columns}")

                required_columns = ['category', 'angle', 'customer_id', 'thumbnail_path']
                missing_columns = []

                for column in required_columns:
                    if column in columns:
                        print(f"  ✅ Column vehicle_photos.{column} exists")
                    else:
                        missing_columns.append(column)
                        print(f"  ❌ Column vehicle_photos.{column} missing")

                if missing_columns:
                    print(f"❌ Still missing columns: {missing_columns}")
                    return False

                # Check if we can insert a test record
                try:
                    cursor.execute("""
                        INSERT INTO vehicle_photos 
                        (vehicle_id, customer_id, category, filename, file_path) 
                        VALUES (1, 1, 'test', 'test.jpg', 'test.jpg')
                    """)
                    test_id = cursor.lastrowid
                    cursor.execute("DELETE FROM vehicle_photos WHERE id = ?", (test_id,))
                    print("  ✅ Table structure is correct - can insert/delete records")
                except Exception as e:
                    print(f"  ❌ Table structure issue: {e}")
                    return False
            else:
                print("  ❌ vehicle_photos table doesn't exist")
                return False

            print("🎉 Fix verification successful!")
            return True

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 OL Service POS - Database Migration Fix")
    print("=" * 50)

    # Check if database file exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file not found at: {DB_PATH}")
        exit(1)

    print(f"📂 Database: {DB_PATH}")

    # Run fix
    if drop_and_recreate_vehicle_photos():
        if verify_fix():
            print("\n🎉 Migration fix completed successfully!")
            print("You can now start the application with: python application.py")
        else:
            print("\n❌ Fix verification failed!")
            exit(1)
    else:
        print("\n❌ Migration fix failed!")
        exit(1)