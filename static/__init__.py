# static/__init__.py

"""
Static assets for the application.
This module provides access to CSS styles and other static resources.
"""

import os

# Define the static directory path
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

def get_static_path():
    """Return the path to the static directory"""
    return STATIC_DIR