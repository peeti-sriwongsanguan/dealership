# debug_app.py - Add this file to test your Flask setup
import sys
import os

sys.path.append('.')

from application import app, get_db_connection
import sqlite3


def test_database():
    """Test database connection and queries"""
    print("🔍 Testing database connection...")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Test basic connection
        cursor.execute("SELECT 1")
        print("✅ Database connection successful")

        # Test customers table
        cursor.execute("SELECT COUNT(*) FROM customers")
        customer_count = cursor.fetchone()[0]
        print(f"✅ Customers table: {customer_count} records")

        # Test vehicles table
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        vehicle_count = cursor.fetchone()[0]
        print(f"✅ Vehicles table: {vehicle_count} records")

        # Test the actual query from get_vehicles()
        cursor.execute("""
            SELECT v.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            ORDER BY v.created_at DESC
            LIMIT 5
        """)
        vehicles = [dict(row) for row in cursor.fetchall()]
        print(f"✅ Vehicles query successful: {len(vehicles)} records")

        # Test the actual query from get_customers()
        cursor.execute("""
            SELECT c.*, 
                   COUNT(v.id) as vehicle_count
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            GROUP BY c.id
            ORDER BY c.first_name, c.last_name
            LIMIT 5
        """)
        customers = [dict(row) for row in cursor.fetchall()]
        print(f"✅ Customers query successful: {len(customers)} records")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return False


def test_flask_routes():
    """Test Flask routes"""
    print("\n🔍 Testing Flask routes...")

    with app.test_client() as client:
        try:
            # Test vehicles endpoint
            print("Testing /api/vehicles...")
            response = client.get('/api/vehicles')
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error data: {response.get_data(as_text=True)}")
            else:
                data = response.get_json()
                print(f"✅ Vehicles endpoint: {len(data.get('vehicles', []))} vehicles")

            # Test customers endpoint
            print("Testing /api/customers...")
            response = client.get('/api/customers')
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error data: {response.get_data(as_text=True)}")
            else:
                data = response.get_json()
                print(f"✅ Customers endpoint: {len(data.get('customers', []))} customers")

        except Exception as e:
            print(f"❌ Flask route error: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")


if __name__ == "__main__":
    print("🚀 Starting Flask App Debug...")

    # Test database first
    db_ok = test_database()

    if db_ok:
        # Test Flask routes
        test_flask_routes()
    else:
        print("❌ Database tests failed, skipping Flask route tests")

    print("\n✅ Debug complete!")