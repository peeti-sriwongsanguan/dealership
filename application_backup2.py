# application.py - Enhanced with Photo Documentation System
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

# Try to import database modules - with fallback for first-time deployment
try:
    from database.db_setup import setup_database
    from database import DB_PATH
except ImportError:
    from database.db_setup import setup_database
    DB_PATH = os.getenv('DB_PATH', 'data/ol_service_pos.db')

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask application
application = app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Configure uploads
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'media/photos')
THUMBNAILS_DIR = os.getenv('THUMBNAILS_DIR', 'media/thumbnails')
DAMAGE_REPORTS_DIR = os.getenv('DAMAGE_REPORTS_DIR', 'media/damage_reports')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
THUMBNAIL_SIZE = (300, 300)

# Set the upload folder for vehicle photos
app.config['UPLOAD_FOLDER'] = PHOTOS_DIR
app.config['THUMBNAILS_FOLDER'] = THUMBNAILS_DIR
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure necessary directories exist
os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(THUMBNAILS_DIR, exist_ok=True)
os.makedirs(DAMAGE_REPORTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Initialize the database
setup_database()


# Database helper functions
def get_db_connection():
    """Get a database connection with row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def allowed_file(filename):
    """Check if a file has an allowed extension"""
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def create_thumbnail(image_path, thumbnail_path, size=THUMBNAIL_SIZE):
    """Create a thumbnail from an image"""
    try:
        with Image.open(image_path) as image:
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')

            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)
            image.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            return True
    except Exception as e:
        logger.error(f"Error creating thumbnail: {e}")
        return False


# Basic Routes
@app.route('/', methods=['GET'])
def index():
    """Serve the home page"""
    return send_from_directory('static', 'index.html')


@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "OL Service POS API with Photo Documentation",
        "version": os.getenv('APP_VERSION', '2.0.0'),
        "database": DB_PATH,
        "features": [
            "Customer Management",
            "Vehicle Management",
            "Service Management",
            "Photo Documentation System",
            "Check-in/Check-out Photo Sessions",
            "Damage Inspection",
            "Automated Thumbnail Generation"
        ]
    })


@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)


# Photo Session Management API
@app.route('/api/photo-sessions', methods=['GET'])
def get_photo_sessions():
    """Get all photo sessions with optional filtering"""
    try:
        vehicle_id = request.args.get('vehicle_id')
        customer_id = request.args.get('customer_id')
        service_id = request.args.get('service_id')
        session_type = request.args.get('session_type')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT ps.*,
                   c.name as customer_name,
                   v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info,
                   s.service_type
            FROM photo_sessions ps
            LEFT JOIN customers c ON ps.customer_id = c.id
            LEFT JOIN vehicles v ON ps.vehicle_id = v.id
            LEFT JOIN services s ON ps.service_id = s.id
            WHERE 1=1
        """

        params = []

        if vehicle_id:
            query += " AND ps.vehicle_id = ?"
            params.append(vehicle_id)

        if customer_id:
            query += " AND ps.customer_id = ?"
            params.append(customer_id)

        if service_id:
            query += " AND ps.service_id = ?"
            params.append(service_id)

        if session_type:
            query += " AND ps.session_type = ?"
            params.append(session_type)

        query += " ORDER BY ps.start_time DESC"

        cursor.execute(query, params)
        sessions = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({"sessions": sessions})

    except Exception as e:
        logger.error(f"Error getting photo sessions: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photo-sessions', methods=['POST'])
def create_photo_session():
    """Create a new photo session"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['vehicle_id', 'customer_id', 'session_type']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert new photo session
        cursor.execute("""
            INSERT INTO photo_sessions (
                vehicle_id, customer_id, service_id, session_type, session_name,
                created_by, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['vehicle_id'],
            data['customer_id'],
            data.get('service_id'),
            data['session_type'],
            data.get('session_name', f"{data['session_type'].title()} Session"),
            data.get('created_by', 'system'),
            data.get('notes', ''),
            'active'
        ))

        session_id = cursor.lastrowid
        conn.commit()

        # Get the created session
        cursor.execute("""
            SELECT ps.*,
                   c.name as customer_name,
                   v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info
            FROM photo_sessions ps
            LEFT JOIN customers c ON ps.customer_id = c.id
            LEFT JOIN vehicles v ON ps.vehicle_id = v.id
            WHERE ps.id = ?
        """, (session_id,))

        session = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            "message": "Photo session created successfully",
            "session": session
        }), 201

    except Exception as e:
        logger.error(f"Error creating photo session: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photo-sessions/<int:session_id>', methods=['GET'])
def get_photo_session(session_id):
    """Get a specific photo session with its photos"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get session details
        cursor.execute("""
            SELECT ps.*,
                   c.name as customer_name,
                   v.make || ' ' || v.model || ' (' || v.year || ')' as vehicle_info,
                   s.service_type
            FROM photo_sessions ps
            LEFT JOIN customers c ON ps.customer_id = c.id
            LEFT JOIN vehicles v ON ps.vehicle_id = v.id
            LEFT JOIN services s ON ps.service_id = s.id
            WHERE ps.id = ?
        """, (session_id,))

        session_row = cursor.fetchone()
        if not session_row:
            conn.close()
            return jsonify({"error": "Photo session not found"}), 404

        session = dict(session_row)

        # Get photos in this session
        cursor.execute("""
            SELECT vp.*, sp.sequence_order
            FROM vehicle_photos vp
            JOIN session_photos sp ON vp.id = sp.photo_id
            WHERE sp.session_id = ?
            ORDER BY sp.sequence_order, vp.timestamp
        """, (session_id,))

        photos = [dict(row) for row in cursor.fetchall()]
        session['photos'] = photos

        conn.close()
        return jsonify(session)

    except Exception as e:
        logger.error(f"Error getting photo session: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photo-sessions/<int:session_id>', methods=['PUT'])
def update_photo_session(session_id):
    """Update a photo session"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if session exists
        cursor.execute("SELECT id FROM photo_sessions WHERE id = ?", (session_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Photo session not found"}), 404

        # Update session
        update_fields = []
        params = []

        if 'session_name' in data:
            update_fields.append("session_name = ?")
            params.append(data['session_name'])

        if 'notes' in data:
            update_fields.append("notes = ?")
            params.append(data['notes'])

        if 'status' in data:
            update_fields.append("status = ?")
            params.append(data['status'])

        if 'end_time' in data:
            update_fields.append("end_time = ?")
            params.append(data['end_time'])

        if update_fields:
            query = f"UPDATE photo_sessions SET {', '.join(update_fields)} WHERE id = ?"
            params.append(session_id)
            cursor.execute(query, params)
            conn.commit()

        conn.close()
        return jsonify({"message": "Photo session updated successfully"})

    except Exception as e:
        logger.error(f"Error updating photo session: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/photo-sessions/<int:session_id>/close', methods=['POST'])
def close_photo_session(session_id):
    """Close/complete a photo session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update session end time and status
        cursor.execute("""
            UPDATE photo_sessions
            SET end_time = ?, status = 'completed'
            WHERE id = ?
        """, (datetime.now().isoformat(), session_id))

        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Photo session not found"}), 404

        conn.commit()
        conn.close()

        return jsonify({"message": "Photo session closed successfully"})

    except Exception as e:
        logger.error(f"Error closing photo session: {e}")
        return jsonify({"error": str(e)}), 500


# Photo Management API
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


# Customer Management API
@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers with vehicle count"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT c.*, 
                   COUNT(v.id) as vehicle_count
            FROM customers c
            LEFT JOIN vehicles v ON c.id = v.customer_id
            GROUP BY c.id
            ORDER BY c.name
        """)

        customers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"customers": customers})

    except Exception as e:
        logger.error(f"Error getting customers: {e}")
        return jsonify({"error": str(e), "customers": []}), 500


@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get a specific customer with vehicles and recent services"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get customer info
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = cursor.fetchone()

        if customer is None:
            conn.close()
            return jsonify({"error": "Customer not found"}), 404

        customer_data = dict(customer)

        # Get customer's vehicles
        cursor.execute('SELECT * FROM vehicles WHERE customer_id = ?', (customer_id,))
        vehicles = [dict(row) for row in cursor.fetchall()]

        # Get recent services
        cursor.execute("""
            SELECT s.*, v.make || ' ' || v.model as vehicle_info
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
            LIMIT 10
        """, (customer_id,))
        services = [dict(row) for row in cursor.fetchall()]

        customer_data['vehicles'] = vehicles
        customer_data['recent_services'] = services

        conn.close()
        return jsonify(customer_data)
    except Exception as e:
        logger.error(f"Error getting customer: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/customers', methods=['POST'])
def add_customer():
    """Add a new customer"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields - adjust for your schema
        required_fields = ['name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO customers (name, phone, email, address)
            VALUES (?, ?, ?, ?)
        """, (
            data['name'],
            data.get('phone', ''),
            data.get('email', ''),
            data.get('address', '')
        ))

        customer_id = cursor.lastrowid
        conn.commit()

        # Return the created customer
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        new_customer = dict(cursor.fetchone())

        conn.close()
        return jsonify({
            "message": "Customer created successfully",
            "customer": new_customer
        }), 201

    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        return jsonify({"error": str(e)}), 500


# Vehicle Management API
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles with customer information"""
    try:
        customer_id = request.args.get('customer_id')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT v.*, 
                   COALESCE(c.name, 'Unknown Customer') as customer_name
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
        """
        params = []

        if customer_id:
            query += " WHERE v.customer_id = ?"
            params.append(customer_id)

        query += " ORDER BY v.id DESC"

        cursor.execute(query, params)
        vehicles = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({"vehicles": vehicles})

    except Exception as e:
        logger.error(f"Error getting vehicles: {e}")
        return jsonify({"error": str(e), "vehicles": []}), 500


@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    """Add a new vehicle"""
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['customer_id', 'make', 'model']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data['customer_id'],
            data['make'],
            data['model'],
            data.get('year'),
            data.get('vin', ''),
            data.get('license_plate', '')
        ))

        vehicle_id = cursor.lastrowid
        conn.commit()

        # Return the created vehicle with customer info
        cursor.execute("""
            SELECT v.*, 
                   COALESCE(c.name, 'Unknown Customer') as customer_name
            FROM vehicles v
            LEFT JOIN customers c ON v.customer_id = c.id
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


# Service Management API
@app.route('/api/services', methods=['GET'])
def get_services():
    """Get all services with customer and vehicle information"""
    try:
        status = request.args.get('status')
        vehicle_id = request.args.get('vehicle_id')
        customer_id = request.args.get('customer_id')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT s.*,
                   c.name as customer_name,
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

        query += " ORDER BY s.created_at DESC"

        cursor.execute(query, params)
        services = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return jsonify({"services": services})
    except Exception as e:
        logger.error(f"Error getting services: {e}")
        return jsonify({"error": str(e)}), 500


# Health check endpoint
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
            "thumbnails_dir": os.path.exists(THUMBNAILS_DIR)
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Truck Repair Management API Routes
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
                total_items, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('vehicle_registration', ''),
            data.get('date', datetime.now().strftime('%Y-%m-%d')),
            data['requester_name'],
            data.get('recipient_name', ''),
            len(data['items']),
            datetime.now().isoformat()
        ))

        form_id = cursor.lastrowid

        # Insert form items
        for item in data['items']:
            cursor.execute("""
                INSERT INTO material_form_items (
                    form_id, item_number, material_description, material_code,
                    quantity, unit
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                form_id,
                item.get('item_number', 1),
                item.get('material_description', ''),
                item.get('material_code', ''),
                item.get('quantity', 0),
                item.get('unit', '')
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
                vehicle_year, vehicle_color, repair_type, total_amount, status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            data.get('status', 'new'),
            datetime.now().isoformat()
        ))

        quote_id = cursor.lastrowid

        # Insert quote items
        for item in data['items']:
            cursor.execute("""
                INSERT INTO repair_quote_items (
                    quote_id, item_number, part_code, description, color,
                    side, quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                quote_id,
                item.get('item_number', 1),
                item.get('part_code', ''),
                item.get('description', ''),
                item.get('color', ''),
                item.get('side', ''),
                item.get('quantity', 1),
                item.get('unit_price', 0),
                item.get('total_price', 0)
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


@app.route('/api/quotes/generate-number', methods=['GET'])
def generate_quote_number():
    """Generate a new quote number"""
    try:
        year = request.args.get('year', datetime.now().year)
        month = request.args.get('month', datetime.now().month)

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


# Database setup additions for truck repair tables
def setup_truck_repair_tables():
    """Setup database tables for truck repair system"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Material Forms table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS material_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_registration TEXT,
            date TEXT,
            requester_name TEXT NOT NULL,
            recipient_name TEXT,
            total_items INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
            FOREIGN KEY (form_id) REFERENCES material_forms (id)
        )
    """)

    # Repair Quotes table
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
            status TEXT DEFAULT 'new',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
            FOREIGN KEY (quote_id) REFERENCES repair_quotes (id)
        )
    """)

    conn.commit()
    conn.close()

# Add this to your setup_database() function call
# setup_truck_repair_tables()

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


# The application will be referenced by Elastic Beanstalk
if __name__ == '__main__':
    # For local development
    port = int(os.getenv('PORT', 5007))
    app.run(host='0.0.0.0', port=port, debug=True)