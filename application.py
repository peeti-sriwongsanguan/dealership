# application.py - For AWS Elastic Beanstalk deployment
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
PHOTOS_DIR = os.getenv('PHOTOS_DIR', 'vehicle_photos')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Set the upload folder for vehicle photos
app.config['UPLOAD_FOLDER'] = PHOTOS_DIR
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure necessary directories exist
os.makedirs(PHOTOS_DIR, exist_ok=True)
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


# Routes
@app.route('/', methods=['GET'])
def index():
    """Serve the home page"""
    return send_from_directory('static', 'index.html')


@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "Auto Service Management API",
        "version": os.getenv('APP_VERSION', '1.0.0'),
        "database": DB_PATH,
        "endpoints": [
            {"path": "/", "methods": ["GET"], "description": "Home page"},
            {"path": "/api", "methods": ["GET"], "description": "API information"},
            {"path": "/api/customers", "methods": ["GET", "POST"],
             "description": "Get all customers or create a new customer"},
            {"path": "/api/customers/<id>", "methods": ["GET", "PUT", "DELETE"],
             "description": "Get, update or delete a specific customer"},
            {"path": "/api/vehicles", "methods": ["GET", "POST"],
             "description": "Get all vehicles or create a new vehicle"},
            {"path": "/api/vehicles/<id>", "methods": ["GET", "PUT", "DELETE"],
             "description": "Get, update or delete a specific vehicle"},
            {"path": "/api/services", "methods": ["GET", "POST"],
             "description": "Get all services or create a new service"},
            {"path": "/api/services/<id>", "methods": ["GET", "PUT", "DELETE"],
             "description": "Get, update or delete a specific service"},
            {"path": "/forms", "methods": ["GET", "POST"], "description": "Get all forms or create a new form"},
            {"path": "/quotes", "methods": ["GET", "POST"], "description": "Get all quotes or create a new quote"}
        ]
    })


@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)


@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM customers ORDER BY name')
    customers = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify({"customers": customers})


@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get a specific customer"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
    customer = cursor.fetchone()

    if customer is None:
        conn.close()
        return jsonify({"error": "Customer not found"}), 404

    # Get customer's vehicles
    cursor.execute('SELECT * FROM vehicles WHERE customer_id = ?', (customer_id,))
    vehicles = [dict(row) for row in cursor.fetchall()]

    customer_data = dict(customer)
    customer_data['vehicles'] = vehicles

    conn.close()
    return jsonify(customer_data)


@app.route('/api/customers', methods=['POST'])
def add_customer():
    """Add a new customer"""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    # Validate required fields
    if 'name' not in data:
        return jsonify({"error": "Name is required"}), 400

    # Prepare customer data
    customer_data = {
        'name': data['name'],
        'phone': data.get('phone', ''),
        'email': data.get('email', ''),
        'address': data.get('address', ''),
        'registration_date': data.get('registration_date', datetime.now().strftime('%Y-%m-%d'))
    }

    # Insert into database
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            '''INSERT INTO customers (name, phone, email, address, registration_date) 
               VALUES (?, ?, ?, ?, ?)''',
            (
                customer_data['name'],
                customer_data['phone'],
                customer_data['email'],
                customer_data['address'],
                customer_data['registration_date']
            )
        )

        conn.commit()
        customer_id = cursor.lastrowid

        # Return the created customer
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        new_customer = dict(cursor.fetchone())

        conn.close()
        return jsonify({
            "message": "Customer created successfully",
            "customer": new_customer
        }), 201

    except Exception as e:
        conn.rollback()
        conn.close()
        logger.error(f"Error creating customer: {str(e)}")
        return jsonify({"error": f"Failed to create customer: {str(e)}"}), 500


# Similar endpoints for vehicles, services, etc. would be implemented here

@app.route('/forms', methods=['GET'])
def show_forms():
    """Serve the forms page"""
    return send_from_directory('static', 'forms.html')


@app.route('/quotes', methods=['GET'])
def show_quotes():
    """Serve the quotes page"""
    return send_from_directory('static', 'quote.html')


@app.route('/upload_photo', methods=['POST'])
def upload_photo():
    """Upload a vehicle photo"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        # Generate a secure unique filename
        filename = str(uuid.uuid4()) + '-' + secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the file
        file.save(file_path)

        # Get additional data
        vehicle_id = request.form.get('vehicle_id')
        service_id = request.form.get('service_id')
        description = request.form.get('description', '')

        # Add entry to database
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                '''INSERT INTO vehicle_photos (vehicle_id, service_id, photo_path, description, timestamp) 
                   VALUES (?, ?, ?, ?, ?)''',
                (
                    vehicle_id,
                    service_id,
                    filename,
                    description,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                )
            )

            conn.commit()
            photo_id = cursor.lastrowid

            conn.close()
            return jsonify({
                'success': True,
                'photo_id': photo_id,
                'filename': filename,
                'path': f'/photos/{filename}'
            })

        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'File type not allowed'}), 400


@app.route('/photos/<filename>')
def get_photo(filename):
    """Serve a photo file"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


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