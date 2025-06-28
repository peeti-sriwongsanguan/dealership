# migrate_truck_repair.py
"""
Migration script to add truck repair features to existing OL Service POS database
Run this if you have an existing database and want to add truck repair functionality
"""

import sys
import os
from pathlib import Path

# Add the project root to the path so we can import our modules
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

try:
    from database.db_setup import migrate_existing_database
except ImportError:
    print("❌ Could not import database modules. Make sure you're running this from the project root directory.")
    sys.exit(1)


def main():
    """Main migration function"""
    print("🚛 OL Service POS - Truck Repair Migration Tool")
    print("=" * 50)
    print("This script will add truck repair management features to your existing database.")
    print("It's safe to run multiple times - it will only add missing tables/data.")
    print()

    # Confirm with user
    response = input("Do you want to proceed with the migration? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Migration cancelled.")
        sys.exit(0)

    print("\n🔄 Starting migration...")

    try:
        success = migrate_existing_database()

        if success:
            print("\n🎉 Migration completed successfully!")
            print("\n🚛 New Truck Repair Features Added:")
            print("   ✅ Material requisition forms (Thai language)")
            print("   ✅ Repair quote system with itemized pricing")
            print("   ✅ Truck parts inventory management")
            print("   ✅ Integration with existing service system")
            print("   ✅ Sample Thai truck repair data")
            print("\n📝 How to use:")
            print("   1. Go to Services module")
            print("   2. Create a new service with type 'Truck Repair'")
            print("   3. Click 'Truck Repair System' button")
            print("   4. Create material forms and quotes in Thai")
            print("\n🔧 Updated application.py:")
            print("   - Make sure to update your application.py with the new API routes")
            print("   - Add the CSS and JavaScript files as described in the integration guide")

        else:
            print("\n❌ Migration failed. Please check the error messages above.")
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ Migration failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()