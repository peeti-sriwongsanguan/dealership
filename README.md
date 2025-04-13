# OL Service POS System Installation Guide

This guide will help you install and run the Dealership POS System for OL Service.

## System Requirements

- Python 3.9 or higher
- A computer or tablet with a camera (for customer check-in photo features)
- Windows, macOS, or Linux operating system

## Installation Steps

1. **Clone or download the repository**

   Download all the project files and extract them to a folder on your device.

2. **Create a virtual environment (recommended)**

   ```bash
   # Navigate to the project directory
   cd ol_service_pos

   # Create a virtual environment
   python -m venv venv

   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install the required packages**

   ```bash
   pip install -r requirements.txt
   ```

4. **Create required directories**

   ```bash
   # Create a directory to store vehicle photos
   mkdir vehicle_photos
   ```

5. **Run the application**

   ```bash
   python main.py
   ```

## First-time Login

When you first run the application, the following default users are created:

- **Admin User**
  - Username: admin
  - Password: admin123
  - Role: admin

- **Mechanic User**
  - Username: mechanic
  - Password: mech123
  - Role: mechanic

It is recommended to change these default passwords after your first login through the Admin Panel.

## System Features

- **Customer Management**: Add, edit, and manage customer information
- **Vehicle Management**: Track vehicles for each customer
- **Service Check-In**: Check in vehicles for service with photo documentation
- **Service Tracking**: Monitor service status and update customers
- **Admin Panel**: Manage users and view reports

## Camera Functionality

The system uses your device's camera to capture photos during the vehicle check-in process. Make sure your device has a working webcam and that you've granted the necessary permissions for the application to access it.

## Troubleshooting

- **Camera not working**: Ensure your webcam is properly connected and not being used by another application.
- **Database errors**: If you encounter database issues, try deleting the `car_dealer_pos.db` file and restarting the application to create a fresh database.
- **Package installation issues**: Make sure you have the latest version of pip by running `pip install --upgrade pip` before installing the requirements.

## Support

For additional support, please contact the system administrator or refer to the detailed user manual.