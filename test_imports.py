# test_imports.py
import sys
print(f"Python path: {sys.path}")
try:
    from ui.customer import CustomerManagement
    print("Successfully imported CustomerManagement")
except ImportError as e:
    print(f"Import error: {e}")