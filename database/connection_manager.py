# database/connection_manager.py
import sqlite3
import os
import threading
from contextlib import contextmanager
from typing import Optional, Dict, Any, List
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseManager:
    """Centralized database connection and query management"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.db_path = os.getenv('DB_PATH', 'data/ol_service_pos.db')
            self.connection_pool = {}
            self.pool_size = 5
            self.initialized = True

    @contextmanager
    def get_connection(self, row_factory: bool = True):
        """Context manager for database connections"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            if row_factory:
                conn.row_factory = sqlite3.Row

            # Enable foreign key constraints
            conn.execute("PRAGMA foreign_keys = ON")

            yield conn

        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = (), fetch_one: bool = False,
                      fetch_all: bool = False) -> Optional[Any]:
        """Execute a query with proper error handling"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)

                if fetch_one:
                    result = cursor.fetchone()
                    return dict(result) if result else None
                elif fetch_all:
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
                else:
                    conn.commit()
                    return cursor.lastrowid

        except sqlite3.Error as e:
            logger.error(f"Query execution failed: {query}, Error: {e}")
            return None

    def execute_transaction(self, queries: List[tuple]) -> bool:
        """Execute multiple queries in a transaction"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("BEGIN TRANSACTION")

                for query, params in queries:
                    cursor.execute(query, params)

                cursor.execute("COMMIT")
                return True

        except sqlite3.Error as e:
            logger.error(f"Transaction failed: {e}")
            return False


# Global database manager instance
db_manager = DatabaseManager()