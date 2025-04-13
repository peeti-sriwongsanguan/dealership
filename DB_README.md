# Updating Database References

To ensure all database references throughout the application use the new database name 'ol_service_pos.db', you'll need to:

1. Make sure the .env file has:
   ```
   DB_PATH=data/ol_service_pos.db
   ```

2. Update these files that might still have hardcoded database paths:
   - Ensure all database/*.py files use DB_PATH from environment variables
   - Check ui/*.py files for direct database connections
   - Update any DB references in utility scripts

3. Specific files to check:
   - database/db_setup.py
   - database/customer_db.py
   - database/vehicle_db.py
   - database/service_db.py
   - database/photo_db.py
   - ui/login_screen.py
   - Any admin functionality files

4. Make sure to add the dotenv loading code to ALL files that connect to the database:
   ```python
   import os
   from dotenv import load_dotenv

   # Load environment variables
   load_dotenv()

   # Get database path from environment variables
   DB_PATH = os.getenv('DB_PATH', 'ol_service_pos.db')
   ```

5. Remember to create the 'data' directory as specified in the DB_PATH.