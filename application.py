# application.py - OL Service POS with Photo Documentation and Truck Repair Management
# Properly organized and structured

from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import sqlite3
import json
from datetime import datetime
import logging
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
from PIL import Image
import io
import base64

# =============================================================================
# APPLICATION SETUP AND CONFIGURATION
# =============================================================================

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import database modules
try:
    from database.db_setup import setup_database
    from database import DB_PATH
except ImportError:
    from database.db_setup import setup_database

    DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')

# Initialize Flask application
application = app = Flask(__name__, static_folder='static')
CORS(app)

# Upload configuration
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'media/photos')
THUMBNAILS_DIR = os.getenv('THUMBNAILS_DIR', 'media/thumbnails')
DAMAGE_REPORTS_DIR = os.getenv('DAMAGE_REPORTS_DIR', 'media/damage_reports')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
THUMBNAIL_SIZE = (300, 300)

app.config['UPLOAD_FOLDER'] = PHOTOS_DIR
app.config['THUMBNAILS_FOLDER'] = THUMBNAILS_DIR
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create directories
os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)
os.makedirs(DAMAGE_REPORTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Initialize database
setup_database()


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_db_connection():
    """Get database connection with row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def create_thumbnail(image_path, thumbnail_path, size=THUMBNAIL_SIZE):
    """Create thumbnail from image"""
    try:
        with Image.open(image_path) as image:
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            image.thumbnail(size, Image.Resampling.LANCZOS)
            image.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            return True
    except Exception as e:
        logger.error(f"Error creating thumbnail: {e}")
        return False


# =============================================================================
# BASIC ROUTES
# =============================================================================

@app.route('/', methods=['GET'])
def index():
    """Serve the home page"""
    return send_from_directory('static', 'index.html')


@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)


@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "OL Service POS API",
        "version": "3.0.0",
        "database": DB_PATH,
        "features": [
            "Customer Management",
            "Vehicle Management",
            "Service Management",
            "Photo Documentation",
            "Truck Repair Management",
            "Thai Language Support",
            "Material Requisition",
            "Repair Quotes",
            "Parts Inventory"
        ]
    })






# =============================================================================
# ENHANCED CUSTOMER MANAGEMENT API WITH THAI ID OCR SUPPORT
# =============================================================================

def ensure_thai_id_columns():
    """Ensure Thai ID columns exist in customers table"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get current table schema
        cursor.execute("PRAGMA table_info(customers)")
        columns = [col[1] for col in cursor.fetchall()]

        # Add Thai ID columns if they don't exist
        thai_columns = [
            ('thai_id_number', 'TEXT'),
            ('thai_name', 'TEXT'),
            ('english_name', 'TEXT'),
            ('date_of_birth', 'TEXT'),
            ('id_card_address', 'TEXT'),
            ('issue_date', 'TEXT'),
            ('expiry_date', 'TEXT')
        ]

        for column_name, column_type in thai_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE customers ADD COLUMN {column_name} {column_type}")
                    logger.info(f"Added column {column_name} to customers table")
                except Exception as e:
                    logger.warning(f"Could not add column {column_name}: {e}")

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"Error ensuring Thai ID columns: {e}")


# Initialize Thai ID columns on startup
ensure_thai_id_columns()


@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers with computed name field and Thai ID support"""
    try:
        search_term = request.args.get('search', '').strip()

        conn = get_db_connection()
        cursor = conn.cursor()

        if search_term:
            # Enhanced search including Thai ID fields
            cursor.execute("""
                SELECT c.*, 
                       COALESCE(c.first_name || ' ' || c.last_name, c.first_name, '') as name,
                       COUNT(v.id) as vehicle_count
                FROM customers c
                LEFT JOIN vehicles v ON c.id = v.customer_id
                WHERE 
                    c.first_name LIKE ? OR c.last_name LIKE ? OR 
                    c.phone LIKE ? OR c.email LIKE ? OR
                    c.thai_name LIKE ? OR c.english_name LIKE ? OR 
                    c.thai_id_number LIKE ?
                GROUP BY c.id
                ORDER BY c.first_name, c.last_name
            """, tuple([f'%{search_term}%'] * 7))
        else:
            cursor.execute("""
                SELECT c.*, 
                       COALESCE(c.first_name || ' ' || c.last_name, c.first_name, '') as name,
                       COUNT(v.id) as vehicle_count
                FROM customers c
                LEFT JOIN vehicles v ON c.id = v.customer_id
                GROUP BY c.id
                ORDER BY c.first_name, c.last_name
            """)

        customers = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({
            "success": True,
            "customers": customers,
            "total": len(customers)
        })

    except Exception as e:
        logger.error(f"Error getting customers: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers', methods=['POST'])
def add_customer():
    """Enhanced add customer with Thai ID OCR support"""
    try:
        if not request.is_json:
            return jsonify({"success": False, "error": "Request must be JSON"}), 400

        data = request.get_json()
        logger.info(f"Received customer data: {data}")

        # Check if this is OCR-enhanced data
        has_ocr_data = any(key in data for key in ['id_number', 'thai_name', 'english_name', 'date_of_birth'])

        # Check for duplicate Thai ID if provided
        thai_id = data.get('id_number', '').strip()
        if thai_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, first_name, last_name FROM customers WHERE thai_id_number = ?", (thai_id,))
            existing = cursor.fetchone()
            if existing:
                conn.close()
                return jsonify({
                    "success": False,
                    "error": f"Customer with Thai ID {thai_id} already exists",
                    "existing_customer": {
                        "id": existing['id'],
                        "name": f"{existing['first_name']} {existing['last_name']}".strip()
                    }
                }), 409
            conn.close()

        # Handle name format - support both single 'name' and separate first/last names
        if 'name' in data and data['name'].strip():
            # Split full name into first and last
            name_parts = data['name'].strip().split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''
        else:
            # Use separate first/last names
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()

        # If OCR data provided, use Thai name as primary if no manual name
        if has_ocr_data and not first_name and data.get('thai_name'):
            thai_name_parts = data['thai_name'].strip().split(' ', 1)
            first_name = thai_name_parts[0]
            last_name = thai_name_parts[1] if len(thai_name_parts) > 1 else ''
        elif has_ocr_data and not first_name and data.get('english_name'):
            english_name_parts = data['english_name'].strip().split(' ', 1)
            first_name = english_name_parts[0]
            last_name = english_name_parts[1] if len(english_name_parts) > 1 else ''

        if not first_name:
            return jsonify({"success": False, "error": "Customer name is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert customer with Thai ID fields
        cursor.execute("""
            INSERT INTO customers (
                first_name, last_name, phone, email, address, city, state, zip_code, notes,
                thai_id_number, thai_name, english_name, date_of_birth, 
                id_card_address, issue_date, expiry_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            first_name,
            last_name,
            data.get('phone', ''),
            data.get('email', ''),
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('zip_code', ''),
            data.get('notes', ''),
            # Thai ID fields
            thai_id,
            data.get('thai_name', ''),
            data.get('english_name', ''),
            data.get('date_of_birth', ''),
            data.get('id_card_address', '') or data.get('address', ''),
            data.get('issue_date', ''),
            data.get('expiry_date', ''),
            datetime.now().isoformat()
        ))

        customer_id = cursor.lastrowid
        conn.commit()

        # Get the created customer with computed name field
        cursor.execute("""
            SELECT *, 
                   COALESCE(first_name || ' ' || last_name, first_name, '') as name
            FROM customers 
            WHERE id = ?
        """, (customer_id,))
        new_customer = dict(cursor.fetchone())

        conn.close()

        logger.info(f"Customer created successfully: {new_customer}")

        return jsonify({
            "success": True,
            "message": "Customer created successfully",
            "customer": new_customer,
            "customer_id": customer_id
        }), 201

    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get specific customer with Thai ID information"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *, 
                   COALESCE(first_name || ' ' || last_name, first_name, '') as name
            FROM customers 
            WHERE id = ?
        """, (customer_id,))
        customer = cursor.fetchone()

        if not customer:
            conn.close()
            return jsonify({"success": False, "error": "Customer not found"}), 404

        customer_data = dict(customer)

        # Get vehicles
        cursor.execute('SELECT * FROM vehicles WHERE customer_id = ?', (customer_id,))
        customer_data['vehicles'] = [dict(row) for row in cursor.fetchall()]

        # Get recent services
        cursor.execute("""
            SELECT s.*, v.make || ' ' || v.model as vehicle_info
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.customer_id = ? ORDER BY s.created_at DESC LIMIT 10
        """, (customer_id,))
        customer_data['recent_services'] = [dict(row) for row in cursor.fetchall()]

        # Add registration_date for compatibility
        customer_data['registration_date'] = customer_data['created_at']

        conn.close()
        return jsonify({
            "success": True,
            "customer": customer_data
        })

    except Exception as e:
        logger.error(f"Error getting customer: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update customer with Thai ID support"""
    try:
        if not request.is_json:
            return jsonify({"success": False, "error": "Request must be JSON"}), 400

        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check exists
        cursor.execute("SELECT id FROM customers WHERE id = ?", (customer_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "error": "Customer not found"}), 404

        # Check for duplicate Thai ID if being updated
        if 'thai_id_number' in data and data['thai_id_number']:
            cursor.execute("""
                SELECT id FROM customers 
                WHERE thai_id_number = ? AND id != ?
            """, (data['thai_id_number'], customer_id))
            if cursor.fetchone():
                conn.close()
                return jsonify({
                    "success": False,
                    "error": "Another customer already has this Thai ID number"
                }), 409

        update_fields = []
        params = []

        # Handle name
        if 'name' in data:
            name_parts = data['name'].strip().split(' ', 1)
            update_fields.extend(["first_name = ?", "last_name = ?"])
            params.extend([name_parts[0], name_parts[1] if len(name_parts) > 1 else ''])

        # Standard fields
        standard_fields = ['first_name', 'last_name', 'phone', 'email', 'address',
                           'city', 'state', 'zip_code', 'notes']
        for field in standard_fields:
            if field in data and field != 'name':
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        # Thai ID fields
        thai_fields = ['thai_id_number', 'thai_name', 'english_name', 'date_of_birth',
                       'id_card_address', 'issue_date', 'expiry_date']
        for field in thai_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(customer_id)

            cursor.execute(f"UPDATE customers SET {', '.join(update_fields)} WHERE id = ?", params)
            conn.commit()

        conn.close()
        return jsonify({
            "success": True,
            "message": "Customer updated successfully"
        })

    except Exception as e:
        logger.error(f"Error updating customer: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete customer (unchanged but with success response format)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check exists
        cursor.execute("SELECT first_name, last_name FROM customers WHERE id = ?", (customer_id,))
        customer = cursor.fetchone()
        if not customer:
            conn.close()
            return jsonify({"success": False, "error": "Customer not found"}), 404

        customer_name = f"{customer['first_name']} {customer['last_name']}".strip()

        # Check dependencies
        cursor.execute("SELECT COUNT(*) FROM vehicles WHERE customer_id = ?", (customer_id,))
        if cursor.fetchone()[0] > 0:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Cannot delete customer with vehicles"
            }), 400

        cursor.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Customer {customer_name} deleted successfully"
        })

    except Exception as e:
        logger.error(f"Error deleting customer: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# =============================================================================
# ADDITIONAL THAI ID SPECIFIC ENDPOINTS
# =============================================================================

@app.route('/api/customers/search', methods=['GET'])
def search_customers():
    """Enhanced search customers including Thai names and ID"""
    try:
        search_term = request.args.get('q', '').strip()

        if not search_term:
            return jsonify({
                "success": True,
                "customers": [],
                "message": "No search term provided"
            })

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT c.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, '') as name,
                   COUNT(v.id) as vehicle_count
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            WHERE 
                c.first_name LIKE ? OR c.last_name LIKE ? OR 
                c.phone LIKE ? OR c.email LIKE ? OR
                c.thai_name LIKE ? OR c.english_name LIKE ? OR 
                c.thai_id_number LIKE ?
            GROUP BY c.id
            ORDER BY c.first_name, c.last_name
        """, tuple([f'%{search_term}%'] * 7))

        customers = [dict(row) for row in cursor.fetchall()]

        # Add registration_date for compatibility
        for customer in customers:
            customer['registration_date'] = customer['created_at']

        conn.close()

        return jsonify({
            "success": True,
            "customers": customers,
            "total": len(customers),
            "search_term": search_term
        })

    except Exception as e:
        logger.error(f"Error searching customers: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/thai-id/<thai_id>', methods=['GET'])
def get_customer_by_thai_id(thai_id):
    """Get customer by Thai ID number"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *, 
                   COALESCE(first_name || ' ' || last_name, first_name, '') as name
            FROM customers 
            WHERE thai_id_number = ?
        """, (thai_id,))

        customer = cursor.fetchone()

        if not customer:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Customer with this Thai ID not found"
            }), 404

        customer_dict = dict(customer)
        customer_dict['registration_date'] = customer_dict['created_at']

        conn.close()

        return jsonify({
            "success": True,
            "customer": customer_dict
        })

    except Exception as e:
        logger.error(f"Error getting customer by Thai ID {thai_id}: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/validate-thai-id', methods=['POST'])
def validate_thai_id():
    """Validate Thai ID number and check for duplicates"""
    try:
        data = request.get_json()
        thai_id = data.get('thai_id_number', '').strip()

        if not thai_id:
            return jsonify({
                "success": False,
                "error": "Thai ID number is required"
            }), 400

        # Basic format validation (Thai ID is 13 digits)
        clean_id = thai_id.replace('-', '').replace(' ', '')
        if not clean_id.isdigit() or len(clean_id) != 13:
            return jsonify({
                "success": False,
                "error": "Invalid Thai ID format. Must be 13 digits."
            }), 400

        # Check for existing customer
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, first_name, last_name, thai_name 
            FROM customers 
            WHERE thai_id_number = ?
        """, (thai_id,))

        existing_customer = cursor.fetchone()
        conn.close()

        if existing_customer:
            return jsonify({
                "success": False,
                "error": f"Customer with Thai ID {thai_id} already exists",
                "existing_customer": {
                    "id": existing_customer['id'],
                    "name": f"{existing_customer['first_name']} {existing_customer['last_name']}".strip(),
                    "thai_name": existing_customer['thai_name']
                }
            }), 409  # Conflict

        return jsonify({
            "success": True,
            "message": "Thai ID is valid and available"
        })

    except Exception as e:
        logger.error(f"Error validating Thai ID: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/customers/statistics', methods=['GET'])
def get_customer_statistics():
    """Get customer statistics including Thai ID usage"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        stats = {}

        # Total customers
        cursor.execute("SELECT COUNT(*) as count FROM customers")
        stats['total_customers'] = cursor.fetchone()['count']

        # Customers with Thai ID
        cursor.execute("""
            SELECT COUNT(*) as count FROM customers 
            WHERE thai_id_number IS NOT NULL AND thai_id_number != ''
        """)
        stats['with_thai_id'] = cursor.fetchone()['count']

        # Customers with phone
        cursor.execute("""
            SELECT COUNT(*) as count FROM customers 
            WHERE phone IS NOT NULL AND phone != ''
        """)
        stats['with_phone'] = cursor.fetchone()['count']

        # Customers with email
        cursor.execute("""
            SELECT COUNT(*) as count FROM customers 
            WHERE email IS NOT NULL AND email != ''
        """)
        stats['with_email'] = cursor.fetchone()['count']

        # New customers last 30 days
        cursor.execute("""
            SELECT COUNT(*) as count FROM customers 
            WHERE created_at >= datetime('now', '-30 days')
        """)
        stats['new_last_30_days'] = cursor.fetchone()['count']

        # New customers last 90 days
        cursor.execute("""
            SELECT COUNT(*) as count FROM customers 
            WHERE created_at >= datetime('now', '-90 days')
        """)
        stats['new_last_90_days'] = cursor.fetchone()['count']

        # Calculate Thai ID usage percentage
        if stats['total_customers'] > 0:
            stats['thai_id_percentage'] = round(
                (stats['with_thai_id'] / stats['total_customers']) * 100, 1
            )
        else:
            stats['thai_id_percentage'] = 0

        conn.close()

        return jsonify({
            "success": True,
            "statistics": stats
        })

    except Exception as e:
        logger.error(f"Error getting customer statistics: {e}")
        return jsonify({"success": False, "error": str(e)}), 500




# =============================================================================
# VEHICLE MANAGEMENT API
# =============================================================================


@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles with photo information"""
    try:
        customer_id = request.args.get('customer_id')
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT v.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Unknown Customer') as customer_name,
                   c.phone as customer_phone,
                   c.email as customer_email,
                   vp.id as photo_id
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN vehicle_photos vp ON v.id = vp.vehicle_id AND vp.is_primary = 1
        """
        params = []

        if customer_id:
            query += " WHERE v.customer_id = ?"
            params.append(customer_id)

        query += " ORDER BY v.id DESC"

        cursor.execute(query, params)
        vehicles = []

        for row in cursor.fetchall():
            vehicle = dict(row)

            # Add photo URL if primary photo exists
            if vehicle['photo_id']:
                vehicle['photo_url'] = f'/api/photos/{vehicle["photo_id"]}'
                vehicle['thumbnail_url'] = f'/api/photos/{vehicle["photo_id"]}/thumbnail'
                vehicle['photos'] = [{'url': vehicle['photo_url']}]  # For compatibility

            # Remove photo-specific fields
            vehicle.pop('photo_id', None)

            vehicles.append(vehicle)

        conn.close()
        return jsonify({"vehicles": vehicles})
    except Exception as e:
        logger.error(f"Error getting vehicles: {e}")
        return jsonify({"error": str(e)}), 500




@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    """Get specific vehicle with photo information"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT v.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Unknown Customer') as customer_name,
                   c.phone as customer_phone,
                   c.email as customer_email
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
        """, (vehicle_id,))

        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        vehicle_data = dict(vehicle)

        # Get services
        cursor.execute("SELECT * FROM services WHERE vehicle_id = ? ORDER BY created_at DESC", (vehicle_id,))
        vehicle_data['services'] = [dict(row) for row in cursor.fetchall()]

        # Get photo count and primary photo
        cursor.execute("SELECT COUNT(*) FROM vehicle_photos WHERE vehicle_id = ?", (vehicle_id,))
        vehicle_data['photo_count'] = cursor.fetchone()[0]

        # Get primary photo
        cursor.execute("""
            SELECT id FROM vehicle_photos 
            WHERE vehicle_id = ? AND is_primary = 1 
            ORDER BY created_at DESC LIMIT 1
        """, (vehicle_id,))

        primary_photo = cursor.fetchone()
        if primary_photo:
            vehicle_data['photo_url'] = f'/api/photos/{primary_photo["id"]}'
            vehicle_data['thumbnail_url'] = f'/api/photos/{primary_photo["id"]}/thumbnail'

        conn.close()
        return jsonify(vehicle_data)
    except Exception as e:
        logger.error(f"Error getting vehicle: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    """Add new vehicle"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        required_fields = ['customer_id', 'make', 'model']

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage, vehicle_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['customer_id'], data['make'], data['model'],
            data.get('year'), data.get('vin', ''), data.get('license_plate', ''),
            data.get('color', ''), data.get('mileage', 0),
            data.get('vehicle_type', 'car'), data.get('notes', '')
        ))

        vehicle_id = cursor.lastrowid
        conn.commit()

        cursor.execute("""
            SELECT v.*, COALESCE(c.name, 'Unknown Customer') as customer_name
            FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
        """, (vehicle_id,))

        new_vehicle = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            "message": "Vehicle created successfully",
            "vehicle": new_vehicle
        }), 201
    except Exception as e:
        logger.error(f"Error creating vehicle: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    """Update vehicle"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM vehicles WHERE id = ?", (vehicle_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        update_fields = []
        params = []

        updatable_fields = ['customer_id', 'make', 'model', 'year', 'vin',
                            'license_plate', 'color', 'mileage', 'vehicle_type', 'notes']

        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(vehicle_id)

            cursor.execute(f"UPDATE vehicles SET {', '.join(update_fields)} WHERE id = ?", params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Vehicle updated successfully"})
    except Exception as e:
        logger.error(f"Error updating vehicle: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    """Delete vehicle"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM vehicles WHERE id = ?", (vehicle_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        cursor.execute("SELECT COUNT(*) FROM services WHERE vehicle_id = ?", (vehicle_id,))
        if cursor.fetchone()[0] > 0:
            conn.close()
            return jsonify({"error": "Cannot delete vehicle with services"}), 400

        cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Vehicle deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting vehicle: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# SERVICE MANAGEMENT API
# =============================================================================

@app.route('/api/services', methods=['GET'])
def get_services():
    """Get all services"""
    try:
        status = request.args.get('status')
        vehicle_id = request.args.get('vehicle_id')
        customer_id = request.args.get('customer_id')
        service_type = request.args.get('service_type')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT s.*, c.name as customer_name,
                   v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND s.status = ?"
            params.append(status)
        if vehicle_id:
            query += " AND s.vehicle_id = ?"
            params.append(vehicle_id)
        if customer_id:
            query += " AND s.customer_id = ?"
            params.append(customer_id)
        if service_type:
            query += " AND s.service_type = ?"
            params.append(service_type)

        query += " ORDER BY s.created_at DESC"

        cursor.execute(query, params)
        services = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"services": services})
    except Exception as e:
        logger.error(f"Error getting services: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Get specific service"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   v.make || ' ' || v.model as vehicle_info, v.license_plate
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        """, (service_id,))

        service = cursor.fetchone()
        if not service:
            conn.close()
            return jsonify({"error": "Service not found"}), 404

        service_data = dict(service)

        # Get service items
        cursor.execute("SELECT * FROM service_items WHERE service_id = ?", (service_id,))
        service_data['items'] = [dict(row) for row in cursor.fetchall()]

        # Get photo count
        cursor.execute("SELECT COUNT(*) FROM vehicle_photos WHERE service_id = ?", (service_id,))
        service_data['photo_count'] = cursor.fetchone()[0]

        # Truck repair data
        if service_data.get('service_type') == 'truck_repair':
            cursor.execute("SELECT COUNT(*) FROM material_forms WHERE service_id = ?", (service_id,))
            service_data['material_forms_count'] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM repair_quotes WHERE service_id = ?", (service_id,))
            service_data['quotes_count'] = cursor.fetchone()[0]

        conn.close()
        return jsonify(service_data)
    except Exception as e:
        logger.error(f"Error getting service: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/services', methods=['POST'])
def add_service():
    """Add new service"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        required_fields = ['customer_id', 'vehicle_id', 'service_type']

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO services (customer_id, vehicle_id, service_type, description, status, 
                                estimated_cost, scheduled_date, priority, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['customer_id'], data['vehicle_id'], data['service_type'],
            data.get('description', ''), data.get('status', 'pending'),
            data.get('estimated_cost', 0.0), data.get('scheduled_date'),
            data.get('priority', 'normal'), data.get('notes', '')
        ))

        service_id = cursor.lastrowid
        conn.commit()

        cursor.execute("""
            SELECT s.*, c.name as customer_name,
                   v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.id = ?
        """, (service_id,))

        new_service = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            "message": "Service created successfully",
            "service": new_service
        }), 201
    except Exception as e:
        logger.error(f"Error creating service: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    """Update service"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM services WHERE id = ?", (service_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Service not found"}), 404

        update_fields = []
        params = []

        updatable_fields = ['customer_id', 'vehicle_id', 'service_type', 'description',
                            'status', 'estimated_cost', 'actual_cost', 'scheduled_date',
                            'completed_date', 'priority', 'notes']

        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(service_id)

            cursor.execute(f"UPDATE services SET {', '.join(update_fields)} WHERE id = ?", params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Service updated successfully"})
    except Exception as e:
        logger.error(f"Error updating service: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    """Delete service"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM services WHERE id = ?", (service_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Service not found"}), 404

        cursor.execute("DELETE FROM services WHERE id = ?", (service_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Service deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting service: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# PHOTO MANAGEMENT API
# =============================================================================

@app.route('/api/photos', methods=['POST'])
def upload_photo():
    """Upload a photo and optionally add it to a session"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not (file and allowed_file(file.filename)):
            return jsonify({'error': 'File type not allowed'}), 400

        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the file
        file.save(file_path)

        # Create thumbnail
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = os.path.join(app.config['THUMBNAILS_FOLDER'], thumbnail_filename)
        create_thumbnail(file_path, thumbnail_path)

        # Get file info
        file_size = os.path.getsize(file_path)

        # Get image dimensions
        image_width, image_height = None, None
        try:
            with Image.open(file_path) as img:
                image_width, image_height = img.size
        except Exception:
            pass

        # Get form data
        vehicle_id = request.form.get('vehicle_id')
        customer_id = request.form.get('customer_id')
        service_id = request.form.get('service_id')
        session_id = request.form.get('session_id')
        category = request.form.get('category', 'general')
        angle = request.form.get('angle', '')
        description = request.form.get('description', '')
        created_by = request.form.get('created_by', 'system')

        if not vehicle_id or not customer_id:
            return jsonify({'error': 'vehicle_id and customer_id are required'}), 400

        # Insert photo record
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO vehicle_photos (
                vehicle_id, customer_id, service_id, category, angle, description,
                filename, file_path, file_size, mime_type, thumbnail_path,
                created_by, image_width, image_height
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            vehicle_id, customer_id, service_id, category, angle, description,
            filename, filename, file_size, file.mimetype, thumbnail_filename,
            created_by, image_width, image_height
        ))

        photo_id = cursor.lastrowid

        # Add to session if session_id provided
        if session_id:
            # Get current photo count for sequence order
            cursor.execute("""
                SELECT COUNT(*) FROM session_photos WHERE session_id = ?
            """, (session_id,))
            sequence_order = cursor.fetchone()[0]

            # Link photo to session
            cursor.execute("""
                INSERT INTO session_photos (session_id, photo_id, sequence_order)
                VALUES (?, ?, ?)
            """, (session_id, photo_id, sequence_order))

            # Update session photo count
            cursor.execute("""
                UPDATE photo_sessions
                SET total_photos = total_photos + 1
                WHERE id = ?
            """, (session_id,))

        conn.commit()

        # Get the created photo record
        cursor.execute("SELECT * FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = dict(cursor.fetchone())

        conn.close()

        return jsonify({
            'success': True,
            'photo': photo,
            'thumbnail_url': f'/api/photos/{photo_id}/thumbnail',
            'photo_url': f'/api/photos/{photo_id}'
        }), 201

    except Exception as e:
        logger.error(f"Error uploading photo: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/photos/<int:photo_id>', methods=['GET'])
def get_photo(photo_id):
    """Get a specific photo file"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = cursor.fetchone()

        if not photo:
            conn.close()
            return jsonify({"error": "Photo not found"}), 404

        conn.close()
        return send_from_directory(app.config['UPLOAD_FOLDER'], photo['filename'])

    except Exception as e:
        logger.error(f"Error getting photo: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photos/<int:photo_id>/thumbnail', methods=['GET'])
def get_photo_thumbnail(photo_id):
    """Get a photo thumbnail"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT thumbnail_path FROM vehicle_photos WHERE id = ?", (photo_id,))
        result = cursor.fetchone()

        if not result or not result['thumbnail_path']:
            conn.close()
            return jsonify({"error": "Thumbnail not found"}), 404

        conn.close()
        return send_from_directory(app.config['THUMBNAILS_FOLDER'], result['thumbnail_path'])

    except Exception as e:
        logger.error(f"Error getting thumbnail: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photos/<int:photo_id>/info', methods=['GET'])
def get_photo_info(photo_id):
    """Get photo information without the file"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = cursor.fetchone()

        if not photo:
            conn.close()
            return jsonify({"error": "Photo not found"}), 404

        conn.close()
        return jsonify(dict(photo))

    except Exception as e:
        logger.error(f"Error getting photo info: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>/photos', methods=['GET'])
def get_vehicle_photos(vehicle_id):
    """Get all photos for a specific vehicle"""
    try:
        category = request.args.get('category')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM vehicle_photos WHERE vehicle_id = ?"
        params = [vehicle_id]

        if category:
            query += " AND category = ?"
            params.append(category)

        query += " ORDER BY timestamp DESC"

        cursor.execute(query, params)
        photos = [dict(row) for row in cursor.fetchall()]

        # Add URLs for each photo
        for photo in photos:
            photo['photo_url'] = f'/api/photos/{photo["id"]}'
            photo['thumbnail_url'] = f'/api/photos/{photo["id"]}/thumbnail'

        conn.close()
        return jsonify({"photos": photos})

    except Exception as e:
        logger.error(f"Error getting vehicle photos: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# VEHICLE PHOTO MANAGEMENT API (Additional Endpoints)
# =============================================================================

@app.route('/api/vehicles/photos', methods=['POST'])
def upload_vehicle_photo():
    """Upload a photo specifically for a vehicle (matches frontend expectation)"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo file provided'}), 400

        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not (file and allowed_file(file.filename)):
            return jsonify({'error': 'File type not allowed'}), 400

        # Get form data
        vehicle_id = request.form.get('vehicle_id')
        caption = request.form.get('caption', '')
        is_primary = request.form.get('is_primary') == '1'

        if not vehicle_id:
            return jsonify({'error': 'vehicle_id is required'}), 400

        # Get vehicle info to get customer_id
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT customer_id FROM vehicles WHERE id = ?", (vehicle_id,))
        vehicle = cursor.fetchone()

        if not vehicle:
            conn.close()
            return jsonify({'error': 'Vehicle not found'}), 404

        customer_id = vehicle['customer_id']

        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the file
        file.save(file_path)

        # Create thumbnail
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = os.path.join(app.config['THUMBNAILS_FOLDER'], thumbnail_filename)
        create_thumbnail(file_path, thumbnail_path)

        # Get file info
        file_size = os.path.getsize(file_path)

        # Get image dimensions
        image_width, image_height = None, None
        try:
            with Image.open(file_path) as img:
                image_width, image_height = img.size
        except Exception:
            pass

        # If this is set as primary, unset other primary photos for this vehicle
        if is_primary:
            cursor.execute("""
                UPDATE vehicle_photos 
                SET is_primary = 0 
                WHERE vehicle_id = ? AND is_primary = 1
            """, (vehicle_id,))

        # Insert photo record
        cursor.execute("""
            INSERT INTO vehicle_photos (
                vehicle_id, customer_id, category, description, caption,
                filename, file_path, file_size, mime_type, thumbnail_path,
                created_by, image_width, image_height, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            vehicle_id, customer_id, 'vehicle_photo', caption, caption,
            filename, filename, file_size, file.mimetype, thumbnail_filename,
            'user', image_width, image_height, is_primary
        ))

        photo_id = cursor.lastrowid
        conn.commit()

        # Get the created photo record
        cursor.execute("SELECT * FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = dict(cursor.fetchone())

        # Add URLs
        photo['url'] = f'/api/photos/{photo_id}'
        photo['thumbnail_url'] = f'/api/photos/{photo_id}/thumbnail'

        conn.close()

        return jsonify({
            'success': True,
            'message': 'Photo uploaded successfully',
            'photo': photo
        }), 201

    except Exception as e:
        logger.error(f"Error uploading vehicle photo: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>/details', methods=['GET'])
def get_vehicle_details(vehicle_id):
    """Get detailed vehicle information (matches frontend expectation)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get vehicle with customer info
        cursor.execute("""
            SELECT v.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Unknown Customer') as customer_name,
                   c.phone as customer_phone,
                   c.email as customer_email
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
        """, (vehicle_id,))

        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        vehicle_data = dict(vehicle)

        # Get primary photo
        cursor.execute("""
            SELECT * FROM vehicle_photos 
            WHERE vehicle_id = ? AND is_primary = 1 
            ORDER BY created_at DESC LIMIT 1
        """, (vehicle_id,))

        primary_photo = cursor.fetchone()
        if primary_photo:
            vehicle_data['photo_url'] = f'/api/photos/{primary_photo["id"]}'
            vehicle_data['thumbnail_url'] = f'/api/photos/{primary_photo["id"]}/thumbnail'

        # Get photo count
        cursor.execute("SELECT COUNT(*) as count FROM vehicle_photos WHERE vehicle_id = ?", (vehicle_id,))
        photo_count = cursor.fetchone()
        vehicle_data['photo_count'] = photo_count['count'] if photo_count else 0

        conn.close()
        return jsonify({
            "success": True,
            "vehicle": vehicle_data
        })

    except Exception as e:
        logger.error(f"Error getting vehicle details: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>/service-history', methods=['GET'])
def get_vehicle_service_history(vehicle_id):
    """Get service history for a vehicle (matches frontend expectation)"""
    try:
        limit = request.args.get('limit', type=int)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if vehicle exists
        cursor.execute("SELECT id FROM vehicles WHERE id = ?", (vehicle_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        # Get service history
        query = """
            SELECT s.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Unknown') as customer_name
            FROM services s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.vehicle_id = ?
            ORDER BY s.created_at DESC
        """
        params = [vehicle_id]

        if limit:
            query += " LIMIT ?"
            params.append(limit)

        cursor.execute(query, params)
        service_records = [dict(row) for row in cursor.fetchall()]

        # Format service records to match expected structure
        formatted_records = []
        for record in service_records:
            formatted_record = {
                "id": record["id"],
                "service_date": record.get("scheduled_date") or record.get("created_at", "").split("T")[0],
                "description": record.get("description", "Service"),
                "service_type": record.get("service_type", "general"),
                "total_cost": record.get("actual_cost") or record.get("estimated_cost", 0),
                "mileage": None,  # Add mileage field to services table if needed
                "technician": record.get("notes", "").split("Technician:")[-1].strip() if "Technician:" in record.get(
                    "notes", "") else None,
                "notes": record.get("notes", ""),
                "service_items": [],  # Could be populated from service_items table
                "parts_used": []  # Could be populated from parts table
            }
            formatted_records.append(formatted_record)

        conn.close()
        return jsonify({
            "success": True,
            "service_records": formatted_records
        })

    except Exception as e:
        logger.error(f"Error getting vehicle service history: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/<int:vehicle_id>/photos', methods=['GET'])
def get_vehicle_photos_enhanced(vehicle_id):
    """Enhanced get vehicle photos (replaces existing endpoint)"""
    try:
        category = request.args.get('category')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if vehicle exists and get vehicle info
        cursor.execute("""
            SELECT v.*, 
                   COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Unknown') as customer_name
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
            WHERE v.id = ?
        """, (vehicle_id,))

        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({"error": "Vehicle not found"}), 404

        # Get photos
        query = "SELECT * FROM vehicle_photos WHERE vehicle_id = ?"
        params = [vehicle_id]

        if category:
            query += " AND category = ?"
            params.append(category)

        query += " ORDER BY is_primary DESC, created_at DESC"

        cursor.execute(query, params)
        photos = [dict(row) for row in cursor.fetchall()]

        # Add URLs for each photo
        for photo in photos:
            photo['url'] = f'/api/photos/{photo["id"]}'
            photo['thumbnail_url'] = f'/api/photos/{photo["id"]}/thumbnail'

        conn.close()
        return jsonify({
            "success": True,
            "photos": photos,
            "vehicle": dict(vehicle)
        })

    except Exception as e:
        logger.error(f"Error getting vehicle photos: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/photos/<int:photo_id>', methods=['DELETE'])
def delete_vehicle_photo(photo_id):
    """Delete a vehicle photo"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get photo info before deletion
        cursor.execute("SELECT * FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = cursor.fetchone()

        if not photo:
            conn.close()
            return jsonify({"error": "Photo not found"}), 404

        # Delete files from filesystem
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], photo['filename'])
            if os.path.exists(file_path):
                os.remove(file_path)

            if photo['thumbnail_path']:
                thumbnail_path = os.path.join(app.config['THUMBNAILS_FOLDER'], photo['thumbnail_path'])
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
        except Exception as e:
            logger.warning(f"Error deleting photo files: {e}")

        # Delete from database
        cursor.execute("DELETE FROM vehicle_photos WHERE id = ?", (photo_id,))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Photo deleted successfully"
        })

    except Exception as e:
        logger.error(f"Error deleting vehicle photo: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/vehicles/photos/<int:photo_id>/primary', methods=['POST'])
def set_primary_vehicle_photo(photo_id):
    """Set a photo as primary for the vehicle"""
    try:
        data = request.get_json() if request.is_json else {}

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get photo info
        cursor.execute("SELECT vehicle_id FROM vehicle_photos WHERE id = ?", (photo_id,))
        photo = cursor.fetchone()

        if not photo:
            conn.close()
            return jsonify({"error": "Photo not found"}), 404

        vehicle_id = photo['vehicle_id']

        # Unset all primary photos for this vehicle
        cursor.execute("""
            UPDATE vehicle_photos 
            SET is_primary = 0 
            WHERE vehicle_id = ?
        """, (vehicle_id,))

        # Set this photo as primary
        cursor.execute("""
            UPDATE vehicle_photos 
            SET is_primary = 1 
            WHERE id = ?
        """, (photo_id,))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Photo set as primary successfully"
        })

    except Exception as e:
        logger.error(f"Error setting primary photo: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# DATABASE SCHEMA UPDATE (Run this once to add missing columns)
# =============================================================================

def update_vehicle_photos_table():
    """Update vehicle_photos table to add missing columns"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Add missing columns if they don't exist
        try:
            cursor.execute("ALTER TABLE vehicle_photos ADD COLUMN is_primary INTEGER DEFAULT 0")
        except:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE vehicle_photos ADD COLUMN caption TEXT")
        except:
            pass  # Column already exists

        conn.commit()
        conn.close()
        logger.info("Vehicle photos table updated successfully")

    except Exception as e:
        logger.error(f"Error updating vehicle photos table: {e}")


# Call this function when the app starts
update_vehicle_photos_table()

# =============================================================================
# TRUCK REPAIR MANAGEMENT API
# =============================================================================

@app.route('/api/forms', methods=['POST'])
def create_material_form():
    """Create a new material requisition form"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['requester_name', 'items']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        if not data['items'] or len(data['items']) == 0:
            return jsonify({"error": "At least one item is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert material form
        cursor.execute("""
            INSERT INTO material_forms (
                vehicle_registration, date, requester_name, recipient_name, 
                total_items, service_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('vehicle_registration', ''),
            data.get('date', datetime.now().strftime('%Y-%m-%d')),
            data['requester_name'],
            data.get('recipient_name', ''),
            len(data['items']),
            data.get('service_id'),
            datetime.now().isoformat()
        ))

        form_id = cursor.lastrowid

        # Insert form items
        for item in data['items']:
            cursor.execute("""
                INSERT INTO material_form_items (
                    form_id, item_number, material_description, material_code,
                    quantity, unit, unit_cost, total_cost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                form_id,
                item.get('item_number', 1),
                item.get('material_description', ''),
                item.get('material_code', ''),
                item.get('quantity', 0),
                item.get('unit', ''),
                item.get('unit_cost', 0.0),
                item.get('total_cost', 0.0)
            ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Material form created successfully",
            "id": form_id
        }), 201

    except Exception as e:
        logger.error(f"Error creating material form: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/forms', methods=['GET'])
def get_material_forms():
    """Get all material forms"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT mf.*, COUNT(mfi.id) as item_count
            FROM material_forms mf
            LEFT JOIN material_form_items mfi ON mf.id = mfi.form_id
            GROUP BY mf.id
            ORDER BY mf.created_at DESC
        """)

        forms = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"forms": forms})

    except Exception as e:
        logger.error(f"Error getting material forms: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/forms/<int:form_id>', methods=['GET'])
def get_material_form(form_id):
    """Get a specific material form with items"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get form details
        cursor.execute("SELECT * FROM material_forms WHERE id = ?", (form_id,))
        form = cursor.fetchone()

        if not form:
            conn.close()
            return jsonify({"error": "Form not found"}), 404

        form_data = dict(form)

        # Get form items
        cursor.execute("""
            SELECT * FROM material_form_items 
            WHERE form_id = ? 
            ORDER BY item_number
        """, (form_id,))

        items = [dict(row) for row in cursor.fetchall()]
        form_data['items'] = items

        conn.close()
        return jsonify(form_data)

    except Exception as e:
        logger.error(f"Error getting material form: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/forms/<int:form_id>', methods=['PUT'])
def update_material_form(form_id):
    """Update a material form"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if form exists
        cursor.execute("SELECT id FROM material_forms WHERE id = ?", (form_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Form not found"}), 404

        # Update form
        update_fields = []
        params = []

        updatable_fields = ['vehicle_registration', 'date', 'requester_name',
                            'recipient_name', 'status', 'notes']

        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())

            query = f"UPDATE material_forms SET {', '.join(update_fields)} WHERE id = ?"
            params.append(form_id)
            cursor.execute(query, params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Material form updated successfully"})

    except Exception as e:
        logger.error(f"Error updating material form: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/quotes', methods=['POST'])
def create_quote():
    """Create a new repair quote"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['quote_number', 'quote_date', 'items']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        if not data['items'] or len(data['items']) == 0:
            return jsonify({"error": "At least one item is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert quote
        cursor.execute("""
            INSERT INTO repair_quotes (
                quote_number, vehicle_registration, chassis_number, engine_number,
                damage_date, quote_date, customer_name, vehicle_make, vehicle_model,
                vehicle_year, vehicle_color, repair_type, total_amount, tax_amount,
                discount_amount, final_amount, status, service_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['quote_number'],
            data.get('vehicle_registration', ''),
            data.get('chassis_number', ''),
            data.get('engine_number', ''),
            data.get('damage_date'),
            data['quote_date'],
            data.get('customer_name', ''),
            data.get('vehicle_make', ''),
            data.get('vehicle_model', ''),
            data.get('vehicle_year'),
            data.get('vehicle_color', ''),
            data.get('repair_type', 'general'),
            data.get('total_amount', 0),
            data.get('tax_amount', 0),
            data.get('discount_amount', 0),
            data.get('final_amount', 0),
            data.get('status', 'new'),
            data.get('service_id'),
            datetime.now().isoformat()
        ))

        quote_id = cursor.lastrowid

        # Insert quote items
        for item in data['items']:
            cursor.execute("""
                INSERT INTO repair_quote_items (
                    quote_id, item_number, part_code, description, color,
                    side, quantity, unit_price, total_price, category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                quote_id,
                item.get('item_number', 1),
                item.get('part_code', ''),
                item.get('description', ''),
                item.get('color', ''),
                item.get('side', ''),
                item.get('quantity', 1),
                item.get('unit_price', 0),
                item.get('total_price', 0),
                item.get('category', 'parts')
            ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Quote created successfully",
            "id": quote_id,
            "quote_number": data['quote_number']
        }), 201

    except Exception as e:
        logger.error(f"Error creating quote: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/quotes', methods=['GET'])
def get_quotes():
    """Get all repair quotes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT rq.*, COUNT(rqi.id) as item_count
            FROM repair_quotes rq
            LEFT JOIN repair_quote_items rqi ON rq.id = rqi.quote_id
            GROUP BY rq.id
            ORDER BY rq.created_at DESC
        """)

        quotes = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"quotes": quotes})

    except Exception as e:
        logger.error(f"Error getting quotes: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/quotes/<int:quote_id>', methods=['GET'])
def get_quote(quote_id):
    """Get a specific quote with items"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get quote details
        cursor.execute("SELECT * FROM repair_quotes WHERE id = ?", (quote_id,))
        quote = cursor.fetchone()

        if not quote:
            conn.close()
            return jsonify({"error": "Quote not found"}), 404

        quote_data = dict(quote)

        # Get quote items
        cursor.execute("""
            SELECT * FROM repair_quote_items 
            WHERE quote_id = ? 
            ORDER BY item_number
        """, (quote_id,))

        items = [dict(row) for row in cursor.fetchall()]
        quote_data['items'] = items

        conn.close()
        return jsonify(quote_data)

    except Exception as e:
        logger.error(f"Error getting quote: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/quotes/<int:quote_id>', methods=['PUT'])
def update_quote(quote_id):
    """Update a repair quote"""
    try:

        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if quote exists
        cursor.execute("SELECT id FROM repair_quotes WHERE id = ?", (quote_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Quote not found"}), 404

        # Update quote
        update_fields = []
        params = []

        updatable_fields = ['vehicle_registration', 'chassis_number', 'engine_number',
                            'damage_date', 'quote_date', 'customer_name', 'vehicle_make',
                            'vehicle_model', 'vehicle_year', 'vehicle_color', 'repair_type',
                            'total_amount', 'tax_amount', 'discount_amount', 'final_amount',
                            'status', 'approved_by', 'approved_date', 'notes']

        for field in updatable_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                params.append(data[field])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())

            query = f"UPDATE repair_quotes SET {', '.join(update_fields)} WHERE id = ?"
            params.append(quote_id)
            cursor.execute(query, params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Quote updated successfully"})

    except Exception as e:
        logger.error(f"Error updating quote: {e}")
    return jsonify({"error": str(e)}), 500


@app.route('/api/quotes/generate-number', methods=['GET'])
def generate_quote_number():
    """Generate a new quote number"""
    try:
        # Convert to integers since request.args.get() returns strings
        year = int(request.args.get('year', datetime.now().year))
        month = int(request.args.get('month', datetime.now().month))

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get the last quote number for the given year/month
        cursor.execute("""
                SELECT quote_number FROM repair_quotes 
                WHERE quote_number LIKE ?
                ORDER BY created_at DESC 
                LIMIT 1
            """, (f"Q{str(year)[2:]}{month:02d}%",))

        result = cursor.fetchone()
        conn.close()

        if result:
            # Extract the sequence number and increment
            last_number = result['quote_number']
            try:
                sequence = int(last_number[-4:]) + 1
            except (ValueError, IndexError):
                sequence = 1
        else:
            sequence = 1

        # Generate new quote number
        quote_number = f"Q{str(year)[2:]}{month:02d}{sequence:04d}"

        return jsonify({
            "quote_number": quote_number
        })

    except Exception as e:
        logger.error(f"Error generating quote number: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/truck-parts', methods=['GET'])
def get_truck_parts():
    """Get truck parts inventory"""
    try:
        category = request.args.get('category')
        search = request.args.get('search')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM truck_parts_inventory WHERE is_active = 1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if search:
            query += " AND (part_name_thai LIKE ? OR part_name_english LIKE ? OR part_code LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])

        query += " ORDER BY part_name_thai"

        cursor.execute(query, params)
        parts = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({"parts": parts})

    except Exception as e:
        logger.error(f"Error getting truck parts: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/truck-parts/<int:part_id>', methods=['GET'])
def get_truck_part(part_id):
    """Get a specific truck part"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM truck_parts_inventory WHERE id = ?", (part_id,))
        part = cursor.fetchone()

        if not part:
            conn.close()
            return jsonify({"error": "Part not found"}), 404

        conn.close()
        return jsonify(dict(part))

    except Exception as e:
        logger.error(f"Error getting truck part: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/truck-parts', methods=['POST'])
def add_truck_part():
    """Add a new truck part to inventory"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['part_code', 'part_name_thai']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
                INSERT INTO truck_parts_inventory (
                    part_code, part_name_thai, part_name_english, category, supplier,
                    cost_price, selling_price, quantity_in_stock, min_stock_level, location
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
            data['part_code'],
            data['part_name_thai'],
            data.get('part_name_english', ''),
            data.get('category', ''),
            data.get('supplier', ''),
            data.get('cost_price', 0.0),
            data.get('selling_price', 0.0),
            data.get('quantity_in_stock', 0),
            data.get('min_stock_level', 0),
            data.get('location', '')
        ))

        part_id = cursor.lastrowid
        conn.commit()

        # Get the created part
        cursor.execute("SELECT * FROM truck_parts_inventory WHERE id = ?", (part_id,))
        new_part = dict(cursor.fetchone())

        conn.close()
        return jsonify({
            "message": "Part added successfully",
            "part": new_part
        }), 201

    except Exception as e:
        logger.error(f"Error adding truck part: {e}")
        return jsonify({"error": str(e)}), 500




# =============================================================================
# SETTINGS API
# =============================================================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get application settings"""
    try:
        category = request.args.get('category')

        conn = get_db_connection()
        cursor = conn.cursor()

        if category:
            cursor.execute("SELECT * FROM settings WHERE category = ? ORDER BY key", (category,))
        else:
            cursor.execute("SELECT * FROM settings ORDER BY category, key")

        settings = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({"settings": settings})

    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/settings', methods=['POST'])
def update_setting():
    """Update or create a setting"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        required_fields = ['category', 'key', 'value']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
                INSERT OR REPLACE INTO settings (category, key, value, description, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
            data['category'],
            data['key'],
            data['value'],
            data.get('description', ''),
            datetime.now().isoformat()
        ))

        conn.commit()
        conn.close()

        return jsonify({"message": "Setting updated successfully"})

    except Exception as e:
        logger.error(f"Error updating setting: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# DAMAGE REPORTS API
# =============================================================================

@app.route('/api/damage-reports', methods=['GET'])
def get_damage_reports():
    """Get all damage reports"""
    try:
        customer_id = request.args.get('customer_id')
        vehicle_id = request.args.get('vehicle_id')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
                SELECT dr.*, 
                       c.name as customer_name,
                       v.make || ' ' || v.model as vehicle_info
                FROM damage_reports dr
                LEFT JOIN customers c ON dr.customer_id = c.id
                LEFT JOIN vehicles v ON dr.vehicle_id = v.id
                WHERE 1=1
            """
        params = []

        if customer_id:
            query += " AND dr.customer_id = ?"
            params.append(customer_id)

        if vehicle_id:
            query += " AND dr.vehicle_id = ?"
            params.append(vehicle_id)

        query += " ORDER BY dr.created_at DESC"

        cursor.execute(query, params)
        reports = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({"reports": reports})

    except Exception as e:
        logger.error(f"Error getting damage reports: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/damage-reports', methods=['POST'])
def create_damage_report():
    """Create a new damage report"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        required_fields = ['customer_id', 'vehicle_id', 'vehicle_type']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
                INSERT INTO damage_reports (customer_id, vehicle_id, vehicle_type, damage_points, 
                                          total_estimated_cost, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
            data['customer_id'],
            data['vehicle_id'],
            data['vehicle_type'],
            json.dumps(data.get('damage_points', [])),
            data.get('total_estimated_cost', 0.0),
            data.get('notes', ''),
            data.get('status', 'active')
        ))

        report_id = cursor.lastrowid
        conn.commit()

        # Get the created report
        cursor.execute("""
                SELECT dr.*, 
                       c.name as customer_name,
                       v.make || ' ' || v.model as vehicle_info
                FROM damage_reports dr
                LEFT JOIN customers c ON dr.customer_id = c.id
                LEFT JOIN vehicles v ON dr.vehicle_id = v.id
                WHERE dr.id = ?
            """, (report_id,))

        new_report = dict(cursor.fetchone())

        conn.close()
        return jsonify({
            "message": "Damage report created successfully",
            "report": new_report
        }), 201

    except Exception as e:
        logger.error(f"Error creating damage report: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/damage-reports/<int:report_id>', methods=['GET'])
def get_damage_report(report_id):
    """Get a specific damage report"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
                SELECT dr.*, 
                       c.name as customer_name,
                       v.make || ' ' || v.model as vehicle_info
                FROM damage_reports dr
                LEFT JOIN customers c ON dr.customer_id = c.id
                LEFT JOIN vehicles v ON dr.vehicle_id = v.id
                WHERE dr.id = ?
            """, (report_id,))

        report = cursor.fetchone()

        if not report:
            conn.close()
            return jsonify({"error": "Damage report not found"}), 404

        report_data = dict(report)

        # Parse damage_points JSON
        if report_data['damage_points']:
            try:
                report_data['damage_points'] = json.loads(report_data['damage_points'])
            except json.JSONDecodeError:
                report_data['damage_points'] = []

        conn.close()
        return jsonify(report_data)

    except Exception as e:
        logger.error(f"Error getting damage report: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/damage-reports/<int:report_id>', methods=['PUT'])
def update_damage_report(report_id):
    """Update a damage report"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if report exists
        cursor.execute("SELECT id FROM damage_reports WHERE id = ?", (report_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Damage report not found"}), 404

        # Update report
        update_fields = []
        params = []

        if 'damage_points' in data:
            update_fields.append("damage_points = ?")
            params.append(json.dumps(data['damage_points']))

        if 'total_estimated_cost' in data:
            update_fields.append("total_estimated_cost = ?")
            params.append(data['total_estimated_cost'])

        if 'notes' in data:
            update_fields.append("notes = ?")
            params.append(data['notes'])

        if 'status' in data:
            update_fields.append("status = ?")
            params.append(data['status'])

        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())

            query = f"UPDATE damage_reports SET {', '.join(update_fields)} WHERE id = ?"
            params.append(report_id)
            cursor.execute(query, params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Damage report updated successfully"})

    except Exception as e:
        logger.error(f"Error updating damage report: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# STATISTICS AND DASHBOARD API
# =============================================================================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        stats = {}

        # Customer stats
        cursor.execute("SELECT COUNT(*) FROM customers")
        stats['total_customers'] = cursor.fetchone()[0]

        # Vehicle stats
        cursor.execute("SELECT COUNT(*) FROM vehicles")
        stats['total_vehicles'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM vehicles WHERE vehicle_type = 'truck'")
        stats['total_trucks'] = cursor.fetchone()[0]

        # Service stats
        cursor.execute("SELECT COUNT(*) FROM services")
        stats['total_services'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM services WHERE status = 'pending'")
        stats['pending_services'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM services WHERE status = 'in_progress'")
        stats['active_services'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM services WHERE status = 'completed'")
        stats['completed_services'] = cursor.fetchone()[0]

        # Truck repair stats
        cursor.execute("SELECT COUNT(*) FROM services WHERE service_type = 'truck_repair'")
        stats['truck_repair_services'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM material_forms")
        stats['material_forms'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM repair_quotes")
        stats['repair_quotes'] = cursor.fetchone()[0]

        # Photo stats
        cursor.execute("SELECT COUNT(*) FROM vehicle_photos")
        stats['total_photos'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM photo_sessions")
        stats['photo_sessions'] = cursor.fetchone()[0]

        # Revenue stats
        cursor.execute("SELECT SUM(actual_cost) FROM services WHERE status = 'completed'")
        result = cursor.fetchone()[0]
        stats['total_revenue'] = result if result else 0

        cursor.execute("SELECT SUM(final_amount) FROM repair_quotes WHERE status = 'approved'")
        result = cursor.fetchone()[0]
        stats['quote_revenue'] = result if result else 0

        # Recent activity
        cursor.execute("""
                SELECT COUNT(*) FROM services 
                WHERE created_at >= datetime('now', '-7 days')
            """)
        stats['services_this_week'] = cursor.fetchone()[0]

        cursor.execute("""
                SELECT COUNT(*) FROM customers 
                WHERE created_at >= datetime('now', '-30 days')
            """)
        stats['new_customers_this_month'] = cursor.fetchone()[0]

        conn.close()
        return jsonify({"stats": stats})

    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/dashboard/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity for dashboard"""
    try:
        limit = request.args.get('limit', 10, type=int)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Recent services
        cursor.execute("""
                SELECT s.*, c.name as customer_name, v.make || ' ' || v.model as vehicle_info
                FROM services s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                ORDER BY s.created_at DESC
                LIMIT ?
            """, (limit,))

        recent_services = [dict(row) for row in cursor.fetchall()]

        # Recent quotes
        cursor.execute("""
                SELECT * FROM repair_quotes 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (limit,))

        recent_quotes = [dict(row) for row in cursor.fetchall()]

        # Recent material forms
        cursor.execute("""
                SELECT * FROM material_forms 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (limit,))

        recent_forms = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({
            "recent_services": recent_services,
            "recent_quotes": recent_quotes,
            "recent_material_forms": recent_forms
        })

    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        return jsonify({"error": str(e)}), 500


# =============================================================================
# HEALTH CHECK AND ERROR HANDLERS
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()

        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "photos_dir": os.path.exists(PHOTOS_DIR),
            "thumbnails_dir": os.path.exists(THUMBNAILS_DIR),
            "features": {
                "photo_documentation": True,
                "truck_repair_management": True,
                "thai_language_support": True,
                "material_requisition": True,
                "repair_quotes": True,
                "parts_inventory": True
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    logger.error(f"Server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors"""
    return jsonify({"error": "File too large. Maximum size is 16MB"}), 413


@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors"""
    return jsonify({"error": "Bad request"}), 400


# =============================================================================
# MAIN APPLICATION ENTRY POINT
# =============================================================================

# The application will be referenced by Elastic Beanstalk
if __name__ == '__main__':
    # For local development
    port = int(os.getenv('PORT', 5007))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 'yes']

    print("🚀 Starting OL Service POS API Server...")
    print("=" * 60)
    print(f"📋 Features enabled:")
    print(f"   ✅ Customer & Vehicle Management")
    print(f"   ✅ Service Management & Tracking")
    print(f"   ✅ Photo Documentation System")
    print(f"   ✅ Check-in/Check-out Photo Sessions")
    print(f"   ✅ Truck Repair Management (Thai Language)")
    print(f"   ✅ Material Requisition Forms")
    print(f"   ✅ Repair Quote Generation")
    print(f"   ✅ Parts Inventory Integration")
    print(f"   ✅ Damage Assessment & Reporting")
    print(f"   ✅ Dashboard & Analytics")
    print(f"   ✅ Complete RESTful API")
    print("=" * 60)
    print(f"🌐 Server running on http://localhost:{port}")
    print(f"🔧 Debug mode: {'ON' if debug_mode else 'OFF'}")
    print(f"📁 Database: {DB_PATH}")
    print(f"📸 Photos: {PHOTOS_DIR}")
    print(f"🖼️  Thumbnails: {THUMBNAILS_DIR}")
    print("=" * 60)
    print("🎯 API Endpoints Summary:")
    print("   📊 /api - API information")
    print("   👥 /api/customers - Customer management")
    print("   🚗 /api/vehicles - Vehicle management")
    print("   🔧 /api/services - Service management")
    print("   📸 /api/photos - Photo management")
    print("   📋 /api/photo-sessions - Photo session management")
    print("   🚛 /api/forms - Material requisition forms")
    print("   💰 /api/quotes - Repair quotes")
    print("   🔩 /api/truck-parts - Parts inventory")
    print("   ⚙️  /api/settings - Application settings")
    print("   🏥 /health - Health check")
    print("=" * 60)

    app.run(host='0.0.0.0', port=port,
            debug=debug_mode)  # application.py - Complete Enhanced with Photo Documentation System and Truck Repair Management

