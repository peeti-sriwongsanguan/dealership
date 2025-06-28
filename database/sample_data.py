# database/sample_data.py
"""
Sample Data Generator for OL Service POS System
Separate from core database setup for cleaner organization
Includes comprehensive test data for all modules including truck repair
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database.connection_manager import db_manager


def create_sample_customers():
    """Create sample customers including Thai customers"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if customers already exist
        cursor.execute("SELECT COUNT(*) FROM customers")
        customer_count = cursor.fetchone()[0]

        if customer_count > 0:
            print("✅ Customers already exist, skipping customer creation")
            return

        sample_customers = [
            ("John", "Smith", "john.smith@email.com", "555-1234", "123 Main St", "Springfield", "IL", "62701"),
            ("Jane", "Doe", "jane.doe@email.com", "555-5678", "456 Oak Ave", "Springfield", "IL", "62702"),
            ("Bob", "Johnson", "bob.johnson@email.com", "555-9012", "789 Pine Rd", "Springfield", "IL", "62703"),
            ("Alice", "Williams", "alice.williams@email.com", "555-3456", "321 Elm St", "Springfield", "IL", "62704"),
            ("Mike", "Brown", "mike.brown@email.com", "555-7890", "654 Maple Dr", "Springfield", "IL", "62705"),
            ("สมชาย", "ใจดี", "somchai@email.com", "02-123-4567", "123 ถ.สุขุมวิท", "กรุงเทพ", "กทม", "10110"),
            ("สมหญิง", "รักดี", "somying@email.com", "02-234-5678", "456 ถ.รัชดา", "กรุงเทพ", "กทม", "10310"),
            ("วิชัย", "ขยันดี", "wichai@email.com", "02-345-6789", "789 ถ.พระราม 4", "กรุงเทพ", "กทม", "10500"),
            ("นิรันดร์", "ทำดี", "niran@email.com", "02-456-7890", "321 ถ.ลาดพร้าว", "กรุงเทพ", "กทม", "10230")
        ]

        for customer in sample_customers:
            cursor.execute("""
                INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, customer)

        conn.commit()
        print("✅ Sample customers created successfully")


def create_sample_vehicles():
    """Create sample vehicles including trucks with Thai license plates"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if vehicles already exist
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        vehicle_count = cursor.fetchone()[0]

        if vehicle_count > 0:
            print("✅ Vehicles already exist, skipping vehicle creation")
            return

        sample_vehicles = [
            (1, "Toyota", "Camry", 2020, "1HGBH41JXMN109186", "ABC123", "Silver", 25000, "car"),
            (1, "Honda", "Civic", 2019, "2HGFC2F59JH123456", "DEF456", "Blue", 30000, "car"),
            (2, "Ford", "F-150", 2021, "1FTFW1ET5MFA12345", "GHI789", "Red", 15000, "truck"),
            (3, "Chevrolet", "Malibu", 2018, "1G1ZD5ST4JF123456", "JKL012", "White", 45000, "car"),
            (4, "BMW", "X5", 2022, "5UXCR6C05M0A12345", "MNO345", "Black", 8000, "suv"),
            (5, "Mercedes", "Sprinter", 2020, "WD3PE8CD5L5123456", "PQR678", "White", 35000, "van"),
            (6, "Isuzu", "NPR", 2021, "JALC4B16517000123", "กก-1234", "White", 12000, "truck"),
            (7, "Hino", "XZU720", 2022, "JHFC7RY68M0000456", "ขข-5678", "Blue", 8500, "truck"),
            (8, "Mitsubishi", "Fuso", 2020, "JMFMC15R5L0000789", "คค-9012", "Red", 15000, "truck"),
            (9, "UD Trucks", "Condor", 2019, "JNKMF15R1M0001234", "งง-3456", "Yellow", 28000, "truck")
        ]

        for vehicle in sample_vehicles:
            cursor.execute("""
                INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage, vehicle_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, vehicle)

        conn.commit()
        print("✅ Sample vehicles created successfully")


def create_sample_services():
    """Create sample services including truck repairs"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if services already exist
        cursor.execute("SELECT COUNT(*) FROM services")
        service_count = cursor.fetchone()[0]

        if service_count > 0:
            print("✅ Services already exist, skipping service creation")
            return

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
             (datetime.now() + timedelta(days=1)).isoformat(), None, 300.0, 0.0, 2),
            (6, 7, "truck_repair", "Engine overhaul and body repair", "in_progress",
             datetime.now().isoformat(), None, 15000.0, 0.0, 2),
            (7, 8, "truck_repair", "Collision damage repair", "pending",
             (datetime.now() + timedelta(days=3)).isoformat(), None, 25000.0, 0.0, 2),
            (8, 9, "truck_repair", "Transmission and brake system repair", "in_progress",
             (datetime.now() - timedelta(days=1)).isoformat(), None, 18000.0, 12500.0, 2),
            (9, 10, "truck_repair", "Full vehicle restoration", "pending",
             (datetime.now() + timedelta(days=5)).isoformat(), None, 35000.0, 0.0, 2)
        ]

        for service in sample_services:
            cursor.execute("""
                INSERT INTO services (customer_id, vehicle_id, service_type, description, status, 
                                    scheduled_date, completed_date, estimated_cost, actual_cost, technician_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, service)

        conn.commit()
        print("✅ Sample services created successfully")


def create_sample_photo_sessions():
    """Create sample photo sessions"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if photo sessions already exist
        cursor.execute("SELECT COUNT(*) FROM photo_sessions")
        session_count = cursor.fetchone()[0]

        if session_count > 0:
            print("✅ Photo sessions already exist, skipping creation")
            return

        sample_photo_sessions = [
            (6, 5, 5, "check-in", "Pre-delivery Check-in Photos",
             (datetime.now() - timedelta(hours=2)).isoformat(), None, "admin",
             "Initial vehicle documentation for pre-delivery inspection", 0),
            (3, 2, 2, "service-documentation", "Brake Inspection Photos",
             (datetime.now() - timedelta(hours=4)).isoformat(), None, "mechanic",
             "Documentation during brake system inspection", 0),
            (7, 6, 6, "damage-assessment", "Truck Damage Assessment",
             (datetime.now() - timedelta(hours=6)).isoformat(), None, "admin",
             "Initial damage assessment for truck repair", 0),
            (8, 7, 7, "check-in", "Truck Check-in Documentation",
             (datetime.now() - timedelta(hours=8)).isoformat(), None, "mechanic",
             "Check-in photos for collision damage repair", 0),
            (9, 8, 8, "progress-documentation", "Repair Progress Photos",
             (datetime.now() - timedelta(hours=12)).isoformat(), None, "admin",
             "Progress documentation during transmission repair", 0)
        ]

        for session in sample_photo_sessions:
            cursor.execute("""
                INSERT INTO photo_sessions (vehicle_id, customer_id, service_id, session_type, session_name,
                                          start_time, end_time, created_by, notes, total_photos)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, session)

        conn.commit()
        print("✅ Sample photo sessions created successfully")


def create_sample_material_forms():
    """Create sample material forms for truck repair"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if material forms already exist
        cursor.execute("SELECT COUNT(*) FROM material_forms")
        forms_count = cursor.fetchone()[0]

        if forms_count > 0:
            print("✅ Material forms already exist, skipping creation")
            return

        sample_material_forms = [
            ("กก-1234", datetime.now().strftime('%Y-%m-%d'), "ช่างสมชาย", "คลังอะไหล่", 3, 6, 'pending'),
            ("ขข-5678", (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'), "ช่างสมหญิง", "คลังอะไหล่", 5, 7,
             'approved'),
            ("คค-9012", (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'), "ช่างวิชัย", "คลังอะไหล่", 4, 8,
             'completed'),
            ("งง-3456", (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'), "ช่างนิรันดร์", "คลังอะไหล่", 6, 9,
             'pending')
        ]

        for form in sample_material_forms:
            cursor.execute("""
                INSERT INTO material_forms (vehicle_registration, date, requester_name, recipient_name, 
                                          total_items, service_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, form)

        # Create sample material form items
        sample_form_items = [
            (1, 1, "ไฟหน้า", "HEA1", 2, "ชุด", 1500.00, 3000.00),
            (1, 2, "กันชนหน้า", "FRO2", 1, "ชิ้น", 6000.00, 6000.00),
            (1, 3, "กระจังหน้า", "FRO1", 1, "ชิ้น", 2200.00, 2200.00),
            (2, 1, "ขากระจก", "MIR1", 2, "ชิ้น", 300.00, 600.00),
            (2, 2, "ไฟเลี้ยว", "TUR1", 4, "ชิ้น", 480.00, 1920.00),
            (2, 3, "กระจก", "WIN1", 2, "ชิ้น", 1200.00, 2400.00),
            (2, 4, "ไฟท้าย", "TAI1", 2, "ชุด", 850.00, 1700.00),
            (2, 5, "พลาสติกปิดกันชน", "BUM4", 2, "ชิ้น", 850.00, 1700.00),
            (3, 1, "ประตู", "DOO1", 1, "ชิ้น", 4500.00, 4500.00),
            (3, 2, "กระจกประตู", "WIN1", 2, "ชิ้น", 1200.00, 2400.00),
            (3, 3, "มือจับประตู", "DOO2", 2, "ชิ้น", 350.00, 700.00),
            (3, 4, "ไฟเลี้ยวข้าง", "TUR1", 2, "ชิ้น", 480.00, 960.00),
            (4, 1, "กันชนหลัง", "FRO2", 1, "ชิ้น", 5500.00, 5500.00),
            (4, 2, "ไฟท้าย", "TAI1", 2, "ชุด", 850.00, 1700.00),
            (4, 3, "ป้ายทะเบียน", "LIC1", 1, "ชิ้น", 250.00, 250.00),
            (4, 4, "สติ๊กเกอร์สะท้อนแสง", "", 10, "ชิ้น", 50.00, 500.00),
            (4, 5, "ไฟป้ายทะเบียน", "LIC1", 2, "ชิ้น", 180.00, 360.00),
            (4, 6, "กันสาดหลัง", "DOO3", 1, "ชิ้น", 150.00, 150.00)
        ]

        for item in sample_form_items:
            cursor.execute("""
                INSERT INTO material_form_items (form_id, item_number, material_description, material_code,
                                               quantity, unit, unit_cost, total_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, item)

        conn.commit()
        print("✅ Sample material forms created successfully")


def create_sample_repair_quotes():
    """Create sample repair quotes"""

    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        # Check if quotes already exist
        cursor.execute("SELECT COUNT(*) FROM repair_quotes")
        quotes_count = cursor.fetchone()[0]

        if quotes_count > 0:
            print("✅ Repair quotes already exist, skipping creation")
            return

        sample_quotes = [
            ("Q25010001", "กก-1234", "JALC4B16517000123", "4JJ1-TC001",
             (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
             datetime.now().strftime('%Y-%m-%d'), "บริษัท ขนส่ง ABC จำกัด",
             "Isuzu", "NPR", 2021, "White", "collision", 45000.00, 3150.00, 0.00, 48150.00, "pending", 6),
            ("Q25010002", "ขข-5678", "JHFC7RY68M0000456", "J08E-TE001",
             (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d'),
             datetime.now().strftime('%Y-%m-%d'), "บริษัท ขนส่งดี จำกัด",
             "Hino", "XZU720", 2022, "Blue", "maintenance", 28500.00, 1995.00, 2000.00, 28495.00, "approved", 7),
            ("Q25010003", "คค-9012", "JMFMC15R5L0000789", "4M50-T6001",
             (datetime.now() - timedelta(days=8)).strftime('%Y-%m-%d'),
             (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'), "บริษัท โลจิสติกส์ เร็ว จำกัด",
             "Mitsubishi", "Fuso", 2020, "Red", "engine_repair", 32000.00, 2240.00, 1500.00, 32740.00, "completed", 8),
            ("Q25010004", "งง-3456", "JNKMF15R1M0001234", "GH11-TA001",
             (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
             datetime.now().strftime('%Y-%m-%d'), "บริษัท ขนส่งไทย จำกัด",
             "UD Trucks", "Condor", 2019, "Yellow", "restoration", 65000.00, 4550.00, 5000.00, 64550.00, "pending", 9)
        ]

        for quote in sample_quotes:
            cursor.execute("""
                INSERT INTO repair_quotes (quote_number, vehicle_registration, chassis_number, engine_number,
                                         damage_date, quote_date, customer_name, vehicle_make, vehicle_model,
                                         vehicle_year, vehicle_color, repair_type, total_amount, tax_amount,
                                         discount_amount, final_amount, status, service_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, quote)

        # Create sample quote items
        sample_quote_items = [
            # Quote 1 items (Collision repair)
            (1, 1, "HEA1", "ไฟหน้าซ้าย", "", "ซ้าย", 1, 1500.00, 1500.00, "parts"),
            (1, 2, "HEA1", "ไฟหน้าขวา", "", "ขวา", 1, 1500.00, 1500.00, "parts"),
            (1, 3, "FRO2", "กันชนหน้า", "White", "", 1, 6000.00, 6000.00, "parts"),
            (1, 4, "FRO1", "กระจังหน้า", "White", "", 1, 2200.00, 2200.00, "parts"),
            (1, 5, "", "ค่าแรงซ่อม", "", "", 1, 15000.00, 15000.00, "labor"),
            (1, 6, "", "ค่าทำสี", "White", "", 1, 8000.00, 8000.00, "paint"),
            (1, 7, "", "ค่าบริการอื่นๆ", "", "", 1, 2800.00, 2800.00, "service"),

            # Quote 2 items (Maintenance)
            (2, 1, "MIR1", "ขากระจกซ้าย", "", "ซ้าย", 1, 300.00, 300.00, "parts"),
            (2, 2, "MIR1", "ขากระจกขวา", "", "ขวา", 1, 300.00, 300.00, "parts"),
            (2, 3, "TUR1", "ไฟเลี้ยวหน้า", "", "", 2, 480.00, 960.00, "parts"),
            (2, 4, "TUR1", "ไฟเลี้ยวหลัง", "", "", 2, 480.00, 960.00, "parts"),
            (2, 5, "WIN1", "กระจกประตูซ้าย", "", "ซ้าย", 1, 1200.00, 1200.00, "parts"),
            (2, 6, "WIN1", "กระจกประตูขวา", "", "ขวา", 1, 1200.00, 1200.00, "parts"),
            (2, 7, "", "ค่าแรงติดตั้ง", "", "", 1, 12000.00, 12000.00, "labor"),
            (2, 8, "", "ค่าบริการตรวจสอบ", "", "", 1, 3580.00, 3580.00, "service"),

            # Quote 3 items (Engine repair)
            (3, 1, "", "ชุดลูกสูบ", "", "", 1, 8500.00, 8500.00, "parts"),
            (3, 2, "", "ชุดวาล์ว", "", "", 1, 6500.00, 6500.00, "parts"),
            (3, 3, "", "ปะเก็นหัวเครื่อง", "", "", 1, 1200.00, 1200.00, "parts"),
            (3, 4, "", "น้ำมันเครื่อง", "", "", 12, 85.00, 1020.00, "fluids"),
            (3, 5, "", "ค่าแรงซ่อมเครื่องยนต์", "", "", 1, 12000.00, 12000.00, "labor"),
            (3, 6, "", "ค่าทดสอบเครื่องยนต์", "", "", 1, 2780.00, 2780.00, "service"),

            # Quote 4 items (Full restoration)
            (4, 1, "DOO1", "ประตูหน้าซ้าย", "Yellow", "ซ้าย", 1, 4500.00, 4500.00, "parts"),
            (4, 2, "DOO1", "ประตูหน้าขวา", "Yellow", "ขวา", 1, 4500.00, 4500.00, "parts"),
            (4, 3, "", "ชุดเกียร์ใหม่", "", "", 1, 15000.00, 15000.00, "parts"),
            (4, 4, "", "ชุดเบรค", "", "", 1, 8500.00, 8500.00, "parts"),
            (4, 5, "", "ระบบไฟฟ้าใหม่", "", "", 1, 6500.00, 6500.00, "parts"),
            (4, 6, "", "ค่าแรงซ่อมทั้งคัน", "", "", 1, 20000.00, 20000.00, "labor"),
            (4, 7, "", "ค่าทำสีทั้งคัน", "Yellow", "", 1, 6000.00, 6000.00, "paint")
        ]

        for item in sample_quote_items:
            cursor.execute("""
                INSERT INTO repair_quote_items (quote_id, item_number, part_code, description, color,
                                              side, quantity, unit_price, total_price, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, item)

        conn.commit()
        print("✅ Sample repair quotes created successfully")


def create_all_sample_data():
    """Create all sample data"""
    print("🚀 Creating comprehensive sample data for OL Service POS...")

    create_sample_customers()
    create_sample_vehicles()
    create_sample_services()
    create_sample_photo_sessions()
    create_sample_material_forms()
    create_sample_repair_quotes()

    print("\n🎉 All sample data created successfully!")
    print("\n📊 Sample Data Summary:")

    # Print summary statistics
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM customers")
        customers_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM vehicles")
        vehicles_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM services")
        services_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM services WHERE service_type = 'truck_repair'")
        truck_services_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM material_forms")
        forms_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM repair_quotes")
        quotes_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM photo_sessions")
        sessions_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM settings")
        settings_count = cursor.fetchone()[0]

        print(f"   👥 Customers: {customers_count} (including Thai customers)")
        print(f"   🚗 Vehicles: {vehicles_count} (including {vehicles_count - 6} trucks)")
        print(f"   🔧 Services: {services_count} ({truck_services_count} truck repairs)")
        print(f"   📋 Material Forms: {forms_count}")
        print(f"   💰 Repair Quotes: {quotes_count}")
        print(f"   📸 Photo Sessions: {sessions_count}")
        print(f"   ⚙️ Settings: {settings_count}")

        print("\n🚛 Truck Repair Features Ready:")
        print("   ✅ Thai language interface")
        print("   ✅ Material requisition system")
        print("   ✅ Comprehensive quote generation")
        print("   ✅ Parts inventory integration")
        print("   ✅ Service workflow integration")


if __name__ == "__main__":
    print("📋 OL Service POS - Sample Data Generator")
    print("=" * 50)

    # Confirm with user
    response = input(
        "Do you want to create sample data? This will add test customers, vehicles, and truck repair data. (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Sample data creation cancelled.")
        sys.exit(0)

    try:
        create_all_sample_data()
    except Exception as e:
        print(f"\n❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)