# web_api.py
from flask import Flask, render_template, request, jsonify, session
import application_backend as backend
import os
from dotenv import load_dotenv
from functools import wraps
import secrets

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"success": False, "message": "Authentication required"}), 401
        return f(*args, **kwargs)

    return decorated_function


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    result = backend.login(username, password)

    if result['success']:
        session['user_id'] = result['user']['id']
        session['username'] = result['user']['username']
        session['role'] = result['user']['role']

    return jsonify(result)


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/api/customers', methods=['GET'])
@login_required
def get_customers():
    customers = backend.get_all_customers()
    return jsonify({"success": True, "customers": customers})


@app.route('/api/services/active', methods=['GET'])
@login_required
def get_active_services():
    services = backend.get_active_services()
    return jsonify({"success": True, "services": services})


# Add more API endpoints for your application features

if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=8080, debug=True)