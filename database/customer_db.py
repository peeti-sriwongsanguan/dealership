# database/customer_db.py (Enhanced with Thai ID OCR Support)
from typing import List, Dict, Optional, Any
import datetime
import json
from dataclasses import dataclass
from database.connection_manager import db_manager
import logging

logger = logging.getLogger(__name__)


@dataclass
class Customer:
    """Customer data class for type safety with Thai ID support"""
    id: Optional[int] = None
    first_name: str = ""
    last_name: str = ""
    name: str = ""  # Computed field
    phone: str = ""
    email: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    notes: str = ""

    # Thai ID Card specific fields
    thai_id_number: str = ""
    thai_name: str = ""
    english_name: str = ""
    date_of_birth: str = ""
    id_card_address: str = ""
    issue_date: str = ""
    expiry_date: str = ""

    # Driver License specific fields
    driver_license_number: str = ""
    license_class: str = ""
    english_address: str = ""
    document_type: str = ""  # 'thai_id', 'driver_license', or ''

    # Metadata
    registration_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': self.name or f"{self.first_name} {self.last_name}".strip(),
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'notes': self.notes,
            'thai_id_number': self.thai_id_number,
            'thai_name': self.thai_name,
            'english_name': self.english_name,
            'date_of_birth': self.date_of_birth,
            'id_card_address': self.id_card_address,
            'issue_date': self.issue_date,
            'expiry_date': self.expiry_date,
            'driver_license_number': self.driver_license_number,
            'license_class': self.license_class,
            'english_address': self.english_address,
            'document_type': self.document_type,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Customer':
        """Create Customer instance from dictionary"""
        # Handle the computed name field
        customer = cls()
        for key, value in data.items():
            if hasattr(customer, key):
                setattr(customer, key, value)

        # Ensure name is computed if not provided
        if not customer.name and (customer.first_name or customer.last_name):
            customer.name = f"{customer.first_name} {customer.last_name}".strip()

        return customer

    @classmethod
    def from_ocr_data(cls, ocr_data: Dict[str, Any], manual_data: Dict[str, Any] = None) -> 'Customer':
        """Create Customer from OCR extracted data with manual overrides"""
        customer = cls()

        # Start with manual data if provided
        if manual_data:
            for key, value in manual_data.items():
                if hasattr(customer, key) and value:
                    setattr(customer, key, value)

        # Determine document type
        if ocr_data.get('license_number') or ocr_data.get('driver_license_number'):
            customer.document_type = 'driver_license'
            customer.driver_license_number = ocr_data.get('license_number') or ocr_data.get('driver_license_number', '')
            customer.license_class = ocr_data.get('license_class', '')
        elif ocr_data.get('id_number'):
            customer.document_type = 'thai_id'
            customer.thai_id_number = ocr_data.get('id_number', '')

        # Handle names
        if ocr_data.get('thai_name'):
            customer.thai_name = ocr_data['thai_name']
            # Use Thai name as primary if no manual name provided
            if not customer.name and not customer.first_name:
                name_parts = ocr_data['thai_name'].split(' ', 1)
                customer.first_name = name_parts[0] if name_parts else ''
                customer.last_name = name_parts[1] if len(name_parts) > 1 else ''
                customer.name = ocr_data['thai_name']

        if ocr_data.get('english_name'):
            customer.english_name = ocr_data['english_name']
            # Use English name if no Thai name and no manual name
            if not customer.name and not customer.thai_name:
                name_parts = ocr_data['english_name'].split(' ', 1)
                customer.first_name = name_parts[0] if name_parts else ''
                customer.last_name = name_parts[1] if len(name_parts) > 1 else ''
                customer.name = ocr_data['english_name']

        # Handle addresses
        if ocr_data.get('english_address'):
            customer.english_address = ocr_data['english_address']
            # Prefer English address for primary address
            if not customer.address:
                customer.address = ocr_data['english_address']

        if ocr_data.get('thai_address') and not customer.address:
            customer.address = ocr_data['thai_address']

        # Map other OCR fields
        field_mapping = {
            'date_of_birth': 'date_of_birth',
            'address': 'id_card_address',  # General address goes to id_card_address
            'issue_date': 'issue_date',
            'expiry_date': 'expiry_date',
            'phone': 'phone',
            'email': 'email'
        }

        for ocr_key, customer_key in field_mapping.items():
            if ocr_data.get(ocr_key) and not getattr(customer, customer_key):
                setattr(customer, customer_key, ocr_data[ocr_key])

        return customer


class CustomerRepository:
    """Repository pattern for customer data access with Thai ID support"""

    def __init__(self):
        # Add Thai ID fields to the database schema if they don't exist
        self._ensure_thai_id_fields()

    def _ensure_thai_id_fields(self):
        """Add Thai ID and driver license fields to customers table if they don't exist"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                # Check existing columns
                cursor.execute("PRAGMA table_info(customers)")
                columns = [col[1] for col in cursor.fetchall()]

                # All new fields (Thai ID + Driver License)
                new_fields = [
                    ('thai_id_number', 'TEXT'),
                    ('thai_name', 'TEXT'),
                    ('english_name', 'TEXT'),
                    ('date_of_birth', 'TEXT'),
                    ('id_card_address', 'TEXT'),
                    ('issue_date', 'TEXT'),
                    ('expiry_date', 'TEXT'),
                    ('driver_license_number', 'TEXT'),
                    ('license_class', 'TEXT'),
                    ('english_address', 'TEXT'),
                    ('document_type', 'TEXT')
                ]

                for field_name, field_type in new_fields:
                    if field_name not in columns:
                        try:
                            cursor.execute(f"ALTER TABLE customers ADD COLUMN {field_name} {field_type}")
                            logger.info(f"Added column {field_name} to customers table")
                        except Exception as e:
                            logger.warning(f"Could not add column {field_name}: {e}")

                conn.commit()

        except Exception as e:
            logger.error(f"Error ensuring database fields: {e}")

    def _ensure_driver_license_fields(self):
        """Add driver license fields to customers table if they don't exist"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                # Check if driver license fields exist
                cursor.execute("PRAGMA table_info(customers)")
                columns = [col[1] for col in cursor.fetchall()]

                # Add missing driver license fields
                driver_license_fields = [
                    ('driver_license_number', 'TEXT'),
                    ('license_class', 'TEXT'),
                    ('english_address', 'TEXT'),
                    ('document_type', 'TEXT')  # 'thai_id' or 'driver_license'
                ]

                for field_name, field_type in driver_license_fields:
                    if field_name not in columns:
                        try:
                            cursor.execute(f"ALTER TABLE customers ADD COLUMN {field_name} {field_type}")
                            logger.info(f"Added column {field_name} to customers table")
                        except Exception as e:
                            logger.warning(f"Could not add column {field_name}: {e}")

                conn.commit()

        except Exception as e:
            logger.error(f"Error ensuring driver license fields: {e}")

    def get_all(self, limit: int = None, offset: int = 0) -> List[Customer]:
        """Get all customers with pagination support"""
        query = """
        SELECT 
            id, first_name, last_name, name, email, phone, address, city, state, zip_code,
            notes, created_at, updated_at,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type
        FROM customers 
        ORDER BY name, first_name, last_name
        """

        if limit:
            query += f" LIMIT {limit} OFFSET {offset}"

        results = db_manager.execute_query(query, fetch_all=True)
        return [Customer.from_dict(row) for row in results] if results else []


    def search(self, search_term: str) -> List[Customer]:
        """Enhanced search including driver license fields"""
        if not search_term.strip():
            return self.get_all()

        query = """
        SELECT 
            id, first_name, last_name, name, email, phone, address, city, state, zip_code,
            notes, created_at, updated_at,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type
        FROM customers
        WHERE 
            name LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR 
            phone LIKE ? OR email LIKE ? OR 
            thai_name LIKE ? OR english_name LIKE ? OR thai_id_number LIKE ? OR
            driver_license_number LIKE ? OR english_address LIKE ?
        ORDER BY name, first_name, last_name
        """

        search_pattern = f'%{search_term}%'
        params = tuple([search_pattern] * 10)  # 10 search fields now
        results = db_manager.execute_query(query, params, fetch_all=True)

        return [Customer.from_dict(row) for row in results] if results else []

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        query = """
        SELECT 
            id, first_name, last_name, name, email, phone, address, city, state, zip_code,
            notes, created_at, updated_at,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type
        FROM customers
        WHERE id = ?
        """

        result = db_manager.execute_query(query, (customer_id,), fetch_one=True)
        return Customer.from_dict(result) if result else None

    def get_by_thai_id(self, thai_id_number: str) -> Optional[Customer]:
        """Get customer by Thai ID number"""
        if not thai_id_number:
            return None

        query = """
        SELECT 
            id, first_name, last_name, name, email, phone, address, city, state, zip_code,
            notes, created_at, updated_at,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type
        FROM customers
        WHERE thai_id_number = ?
        """

        result = db_manager.execute_query(query, (thai_id_number,), fetch_one=True)
        return Customer.from_dict(result) if result else None


    def create(self, customer: Customer) -> Optional[int]:
        """Enhanced create method with driver license support"""
        # Validation
        if not customer.name and not customer.first_name and not customer.thai_name:
            raise ValueError("Customer name (Thai or English) is required")

        # Check for duplicate Thai ID if provided
        if customer.thai_id_number and self.get_by_thai_id(customer.thai_id_number):
            raise ValueError("Customer with this Thai ID already exists")

        # Check for duplicate driver license if provided
        if customer.driver_license_number and self.get_by_license_number(customer.driver_license_number):
            raise ValueError("Customer with this driver license number already exists")

        # Check for duplicate email if provided
        if customer.email and self._email_exists(customer.email):
            raise ValueError("Email already exists")

        # Ensure name fields are properly set
        if not customer.name:
            customer.name = f"{customer.first_name} {customer.last_name}".strip()

        if not customer.first_name and customer.name:
            name_parts = customer.name.split(' ', 1)
            customer.first_name = name_parts[0]
            customer.last_name = name_parts[1] if len(name_parts) > 1 else ''

        customer.created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        customer.updated_at = customer.created_at

        query = """
        INSERT INTO customers (
            first_name, last_name, email, phone, address, city, state, zip_code, notes,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        customer_id = db_manager.execute_query(
            query,
            (
                customer.first_name, customer.last_name, customer.email, customer.phone,
                customer.address, customer.city, customer.state, customer.zip_code, customer.notes,
                customer.thai_id_number, customer.thai_name, customer.english_name,
                customer.date_of_birth, customer.id_card_address, customer.issue_date,
                customer.expiry_date, customer.driver_license_number, customer.license_class,
                customer.english_address, customer.document_type,
                customer.created_at, customer.updated_at
            )
        )

        if customer_id:
            logger.info(f"Created customer: {customer.name} (ID: {customer_id}, Type: {customer.document_type})")

        return customer_id

    def create_from_ocr(self, ocr_data: Dict[str, Any], manual_data: Dict[str, Any] = None) -> Optional[int]:
        """Create customer from OCR data with manual overrides"""
        try:
            # Check if customer already exists by Thai ID
            thai_id = ocr_data.get('id_number') or manual_data.get('thai_id_number')
            if thai_id:
                existing = self.get_by_thai_id(thai_id)
                if existing:
                    raise ValueError(f"Customer with Thai ID {thai_id} already exists")

            # Create customer from OCR data
            customer = Customer.from_ocr_data(ocr_data, manual_data)

            # Validate required fields
            if not customer.name and not customer.first_name and not customer.thai_name:
                raise ValueError("At least one name field is required")

            return self.create(customer)

        except Exception as e:
            logger.error(f"Error creating customer from OCR: {e}")
            raise

    def get_by_license_number(self, license_number: str) -> Optional[Customer]:
        """Get customer by driver license number"""
        if not license_number:
            return None

        query = """
        SELECT 
            id, first_name, last_name, name, email, phone, address, city, state, zip_code,
            notes, created_at, updated_at,
            thai_id_number, thai_name, english_name, date_of_birth, 
            id_card_address, issue_date, expiry_date,
            driver_license_number, license_class, english_address, document_type
        FROM customers
        WHERE driver_license_number = ?
        """

        result = db_manager.execute_query(query, (license_number,), fetch_one=True)
        return Customer.from_dict(result) if result else None

    def update(self, customer_id: int, customer: Customer) -> bool:
        """Enhanced update method with driver license support"""
        if not customer.name and not customer.first_name and not customer.thai_name:
            raise ValueError("Customer name is required")

        # Get existing customer for validation
        existing = self.get_by_id(customer_id)
        if not existing:
            raise ValueError("Customer not found")

        # Check for duplicate Thai ID if provided and different from current
        if customer.thai_id_number:
            if existing.thai_id_number != customer.thai_id_number:
                if self.get_by_thai_id(customer.thai_id_number):
                    raise ValueError("Thai ID already exists for another customer")

        # Check for duplicate driver license if provided and different from current
        if customer.driver_license_number:
            if existing.driver_license_number != customer.driver_license_number:
                if self.get_by_license_number(customer.driver_license_number):
                    raise ValueError("Driver license number already exists for another customer")

        # Check for duplicate email if provided and different from current
        if customer.email and existing:
            if existing.email != customer.email and self._email_exists(customer.email):
                raise ValueError("Email already exists")

        customer.updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        query = """
        UPDATE customers
        SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, 
            city = ?, state = ?, zip_code = ?, notes = ?,
            thai_id_number = ?, thai_name = ?, english_name = ?, date_of_birth = ?,
            id_card_address = ?, issue_date = ?, expiry_date = ?,
            driver_license_number = ?, license_class = ?, english_address = ?, 
            document_type = ?, updated_at = ?
        WHERE id = ?
        """

        result = db_manager.execute_query(
            query,
            (
                customer.first_name, customer.last_name, customer.email, customer.phone,
                customer.address, customer.city, customer.state, customer.zip_code, customer.notes,
                customer.thai_id_number, customer.thai_name, customer.english_name,
                customer.date_of_birth, customer.id_card_address, customer.issue_date,
                customer.expiry_date, customer.driver_license_number, customer.license_class,
                customer.english_address, customer.document_type, customer.updated_at,
                customer_id
            )
        )

        success = result is not None
        if success:
            logger.info(f"Updated customer ID: {customer_id}")

        return success

    def delete(self, customer_id: int) -> bool:
        """Delete a customer and all related data"""
        try:
            # Get related data for cleanup
            vehicle_ids_query = "SELECT id FROM vehicles WHERE customer_id = ?"
            vehicle_results = db_manager.execute_query(
                vehicle_ids_query, (customer_id,), fetch_all=True
            )
            vehicle_ids = [row['id'] for row in vehicle_results] if vehicle_results else []

            # Prepare transaction queries
            queries = []

            # Delete photos and related data for all vehicles
            for vehicle_id in vehicle_ids:
                queries.extend([
                    ("DELETE FROM vehicle_photos WHERE vehicle_id = ?", (vehicle_id,)),
                    ("DELETE FROM photos WHERE vehicle_id = ?", (vehicle_id,)),
                    ("DELETE FROM services WHERE vehicle_id = ?", (vehicle_id,))
                ])

            # Delete vehicles
            queries.append(("DELETE FROM vehicles WHERE customer_id = ?", (customer_id,)))

            # Delete customer (with all new fields)
            queries.append(("DELETE FROM customers WHERE id = ?", (customer_id,)))

            # Execute transaction
            success = db_manager.execute_transaction(queries)

            if success:
                logger.info(f"Deleted customer ID: {customer_id} and all related data")
                # Clean up photo files
                self._cleanup_photo_files(vehicle_ids)

            return success

        except Exception as e:
            logger.error(f"Error deleting customer {customer_id}: {e}")
            return False


    def get_statistics(self) -> Dict[str, Any]:
        """Enhanced statistics including driver license data"""
        queries = {
            'total_customers': "SELECT COUNT(*) as count FROM customers",
            'with_thai_id': "SELECT COUNT(*) as count FROM customers WHERE thai_id_number IS NOT NULL AND thai_id_number != ''",
            'with_driver_license': "SELECT COUNT(*) as count FROM customers WHERE driver_license_number IS NOT NULL AND driver_license_number != ''",
            'with_phone': "SELECT COUNT(*) as count FROM customers WHERE phone IS NOT NULL AND phone != ''",
            'with_email': "SELECT COUNT(*) as count FROM customers WHERE email IS NOT NULL AND email != ''",
            'thai_id_only': "SELECT COUNT(*) as count FROM customers WHERE document_type = 'thai_id'",
            'driver_license_only': "SELECT COUNT(*) as count FROM customers WHERE document_type = 'driver_license'",
            'new_last_30_days': """
                SELECT COUNT(*) as count FROM customers 
                WHERE created_at >= date('now', '-30 days')
            """,
            'new_last_90_days': """
                SELECT COUNT(*) as count FROM customers 
                WHERE created_at >= date('now', '-90 days')
            """
        }

        stats = {}
        for key, query in queries.items():
            result = db_manager.execute_query(query, fetch_one=True)
            stats[key] = result['count'] if result else 0

        # Calculate percentages
        if stats['total_customers'] > 0:
            stats['thai_id_percentage'] = round(
                (stats['with_thai_id'] / stats['total_customers']) * 100, 1
            )
            stats['driver_license_percentage'] = round(
                (stats['with_driver_license'] / stats['total_customers']) * 100, 1
            )
        else:
            stats['thai_id_percentage'] = 0
            stats['driver_license_percentage'] = 0

        return stats

    def get_top_by_revenue(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top customers by revenue"""
        query = """
        SELECT c.id, c.first_name, c.last_name, c.name, c.thai_name,
               COUNT(s.id) as service_count, 
               COALESCE(SUM(s.actual_cost), 0) as total_spent
        FROM customers c
        JOIN vehicles v ON c.id = v.customer_id
        JOIN services s ON v.id = s.vehicle_id
        WHERE s.status = 'Completed'
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT ?
        """

        results = db_manager.execute_query(query, (limit,), fetch_all=True)
        return results if results else []

    def _email_exists(self, email: str, exclude_id: int = None) -> bool:
        """Check if email already exists"""
        query = "SELECT id FROM customers WHERE email = ?"
        params = (email,)

        if exclude_id:
            query += " AND id != ?"
            params = (email, exclude_id)

        result = db_manager.execute_query(query, params, fetch_one=True)
        return result is not None

    def _cleanup_photo_files(self, vehicle_ids: List[int]):
        """Clean up photo files for deleted vehicles"""
        try:
            import os
            from pathlib import Path

            for vehicle_id in vehicle_ids:
                # Clean up vehicle_photos
                photo_query = "SELECT file_path, thumbnail_path FROM vehicle_photos WHERE vehicle_id = ?"
                photos = db_manager.execute_query(photo_query, (vehicle_id,), fetch_all=True)

                if photos:
                    for photo in photos:
                        for path_field in ['file_path', 'thumbnail_path']:
                            file_path = photo.get(path_field)
                            if file_path and os.path.exists(file_path):
                                try:
                                    os.remove(file_path)
                                except Exception as e:
                                    logger.warning(f"Could not delete file {file_path}: {e}")

        except Exception as e:
            logger.error(f"Error cleaning up photo files: {e}")


# Global repository instance
customer_repository = CustomerRepository()


# Enhanced backward compatibility functions with OCR support
def get_all_customers():
    """Get all customers as dictionaries"""
    customers = customer_repository.get_all()
    result = []

    for customer in customers:
        customer_dict = customer.to_dict()
        # Add vehicle count for compatibility
        try:
            vehicle_count_query = "SELECT COUNT(*) as count FROM vehicles WHERE customer_id = ?"
            count_result = db_manager.execute_query(vehicle_count_query, (customer.id,), fetch_one=True)
            customer_dict['vehicle_count'] = count_result['count'] if count_result else 0
        except:
            customer_dict['vehicle_count'] = 0

        # Add registration_date for compatibility
        customer_dict['registration_date'] = customer.created_at

        result.append(customer_dict)

    return result


def search_customers(search_term):
    """Search customers with vehicle count"""
    customers = customer_repository.search(search_term)
    result = []

    for customer in customers:
        customer_dict = customer.to_dict()
        try:
            vehicle_count_query = "SELECT COUNT(*) as count FROM vehicles WHERE customer_id = ?"
            count_result = db_manager.execute_query(vehicle_count_query, (customer.id,), fetch_one=True)
            customer_dict['vehicle_count'] = count_result['count'] if count_result else 0
        except:
            customer_dict['vehicle_count'] = 0

        customer_dict['registration_date'] = customer.created_at
        result.append(customer_dict)

    return result


def get_customer_by_id(customer_id):
    """Get customer by ID as dictionary"""
    customer = customer_repository.get_by_id(customer_id)
    if not customer:
        return None

    customer_dict = customer.to_dict()
    customer_dict['registration_date'] = customer.created_at
    return customer_dict


def create_customer(customer_data):
    """Create customer from dictionary data with OCR support"""
    try:
        # Check if this is OCR data
        if customer_data.get('id_number') or customer_data.get('thai_name'):
            # This looks like OCR data
            ocr_fields = {
                'id_number': customer_data.get('id_number'),
                'thai_name': customer_data.get('thai_name'),
                'english_name': customer_data.get('english_name'),
                'date_of_birth': customer_data.get('date_of_birth'),
                'address': customer_data.get('address'),
                'phone': customer_data.get('phone'),
                'email': customer_data.get('email')
            }

            # Manual form data
            manual_fields = {
                'name': customer_data.get('name'),
                'first_name': customer_data.get('first_name'),
                'last_name': customer_data.get('last_name'),
                'phone': customer_data.get('phone'),
                'email': customer_data.get('email'),
                'address': customer_data.get('address'),
                'city': customer_data.get('city'),
                'state': customer_data.get('state'),
                'zip_code': customer_data.get('zip_code'),
                'notes': customer_data.get('notes')
            }

            return customer_repository.create_from_ocr(ocr_fields, manual_fields)
        else:
            # Regular customer creation
            customer = Customer.from_dict(customer_data)
            return customer_repository.create(customer)

    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        raise


def update_customer(customer_id, customer_data):
    """Update customer from dictionary data"""
    customer = Customer.from_dict(customer_data)
    return customer_repository.update(customer_id, customer)


def delete_customer(customer_id):
    """Delete customer"""
    return customer_repository.delete(customer_id)


def get_customer_stats():
    """Get customer statistics"""
    return customer_repository.get_statistics()


def get_top_customers_by_revenue(limit=10):
    """Get top customers by revenue"""
    return customer_repository.get_top_by_revenue(limit)


def get_customer_by_thai_id(thai_id_number):
    """Get customer by Thai ID number"""
    customer = customer_repository.get_by_thai_id(thai_id_number)
    return customer.to_dict() if customer else None