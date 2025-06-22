# database/customer_db.py (Improved Version)
from typing import List, Dict, Optional, Any
import datetime
from dataclasses import dataclass
from database.connection_manager import db_manager
import logging

logger = logging.getLogger(__name__)


@dataclass
class Customer:
    """Customer data class for type safety"""
    id: Optional[int] = None
    name: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    registration_date: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations"""
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'registration_date': self.registration_date
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Customer':
        """Create Customer instance from dictionary"""
        return cls(**data)


class CustomerRepository:
    """Repository pattern for customer data access"""

    def get_all(self, limit: int = None, offset: int = 0) -> List[Customer]:
        """Get all customers with pagination support"""
        query = """
        SELECT id, name, phone, email, address, registration_date 
        FROM customers 
        ORDER BY name
        """

        if limit:
            query += f" LIMIT {limit} OFFSET {offset}"

        results = db_manager.execute_query(query, fetch_all=True)
        return [Customer.from_dict(row) for row in results] if results else []

    def search(self, search_term: str) -> List[Customer]:
        """Search customers by name, phone, or email"""
        if not search_term.strip():
            return self.get_all()

        query = """
        SELECT id, name, phone, email, address, registration_date
        FROM customers
        WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
        ORDER BY name
        """

        search_pattern = f'%{search_term}%'
        results = db_manager.execute_query(
            query,
            (search_pattern, search_pattern, search_pattern),
            fetch_all=True
        )

        return [Customer.from_dict(row) for row in results] if results else []

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        query = """
        SELECT id, name, phone, email, address, registration_date
        FROM customers
        WHERE id = ?
        """

        result = db_manager.execute_query(query, (customer_id,), fetch_one=True)
        return Customer.from_dict(result) if result else None

    def create(self, customer: Customer) -> Optional[int]:
        """Create a new customer"""
        if not customer.name.strip():
            raise ValueError("Customer name is required")

        # Check for duplicate email if provided
        if customer.email and self._email_exists(customer.email):
            raise ValueError("Email already exists")

        customer.registration_date = datetime.datetime.now().strftime("%Y-%m-%d")

        query = """
        INSERT INTO customers (name, phone, email, address, registration_date)
        VALUES (?, ?, ?, ?, ?)
        """

        customer_id = db_manager.execute_query(
            query,
            (customer.name, customer.phone, customer.email,
             customer.address, customer.registration_date)
        )

        if customer_id:
            logger.info(f"Created customer: {customer.name} (ID: {customer_id})")

        return customer_id

    def update(self, customer_id: int, customer: Customer) -> bool:
        """Update an existing customer"""
        if not customer.name.strip():
            raise ValueError("Customer name is required")

        # Check for duplicate email if provided and different from current
        if customer.email:
            existing = self.get_by_id(customer_id)
            if existing and existing.email != customer.email and self._email_exists(customer.email):
                raise ValueError("Email already exists")

        query = """
        UPDATE customers
        SET name = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
        """

        result = db_manager.execute_query(
            query,
            (customer.name, customer.phone, customer.email,
             customer.address, customer_id)
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

            # Delete services for all vehicles
            for vehicle_id in vehicle_ids:
                queries.append((
                    "DELETE FROM vehicle_photos WHERE vehicle_id = ?",
                    (vehicle_id,)
                ))
                queries.append((
                    "DELETE FROM services WHERE vehicle_id = ?",
                    (vehicle_id,)
                ))

            # Delete vehicles
            queries.append((
                "DELETE FROM vehicles WHERE customer_id = ?",
                (customer_id,)
            ))

            # Delete customer
            queries.append((
                "DELETE FROM customers WHERE id = ?",
                (customer_id,)
            ))

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
        """Get customer statistics"""
        queries = {
            'total_customers': "SELECT COUNT(*) as count FROM customers",
            'new_last_30_days': """
                SELECT COUNT(*) as count FROM customers 
                WHERE registration_date >= date('now', '-30 days')
            """,
            'new_last_90_days': """
                SELECT COUNT(*) as count FROM customers 
                WHERE registration_date >= date('now', '-90 days')
            """
        }

        stats = {}
        for key, query in queries.items():
            result = db_manager.execute_query(query, fetch_one=True)
            stats[key] = result['count'] if result else 0

        return stats

    def get_top_by_revenue(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top customers by revenue"""
        query = """
        SELECT c.id, c.name, COUNT(s.id) as service_count, 
               COALESCE(SUM(s.cost), 0) as total_spent
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
            from database.photo_db import PhotoRepository
            photo_repo = PhotoRepository()

            for vehicle_id in vehicle_ids:
                photo_repo.cleanup_vehicle_photos(vehicle_id)

        except Exception as e:
            logger.error(f"Error cleaning up photo files: {e}")


# Global repository instance
customer_repository = CustomerRepository()


# Backward compatibility functions
def get_all_customers():
    return [customer.to_dict() for customer in customer_repository.get_all()]


def search_customers(search_term):
    return [customer.to_dict() for customer in customer_repository.search(search_term)]


def get_customer_by_id(customer_id):
    customer = customer_repository.get_by_id(customer_id)
    return customer.to_dict() if customer else None


def create_customer(customer_data):
    customer = Customer.from_dict(customer_data)
    return customer_repository.create(customer)


def update_customer(customer_id, customer_data):
    customer = Customer.from_dict(customer_data)
    return customer_repository.update(customer_id, customer)


def delete_customer(customer_id):
    return customer_repository.delete(customer_id)


def get_customer_stats():
    return customer_repository.get_statistics()


def get_top_customers_by_revenue(limit=10):
    return customer_repository.get_top_by_revenue(limit)