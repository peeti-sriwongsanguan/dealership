# ui/ui_utils.py
"""
UI Utility functions for styling and widget creation.
This module helps apply consistent styling to the application.
"""
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import os

# Get application root directory
APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Path to assets directory
ASSETS_DIR = os.path.join(APP_ROOT, "assets")

# Style constants
COLORS = {
    'primary': '#4CAF50',
    'danger': '#F44336',
    'bg': '#f0f0f0',
    'text': '#333333',
    'border': '#cccccc',
    'light_primary': '#e8f5e9',
}

PADDINGS = {
    'small': 5,
    'medium': 10,
    'large': 20,
}

FONTS = {
    'small': ('Arial', 10),
    'normal': ('Arial', 12),
    'large': ('Arial', 14),
    'normal_bold': ('Arial', 12, 'bold'),
    'large_bold': ('Arial', 14, 'bold'),
}


def setup_styles():
    """Configure ttk styles for the application"""
    style = ttk.Style()

    # Configure the main application style
    style.configure('TFrame', background=COLORS['bg'])
    style.configure('TLabel', background=COLORS['bg'], font=FONTS['normal'])
    style.configure('TButton', font=FONTS['normal_bold'])

    # Create primary button style
    style.configure('Primary.TButton',
                    background=COLORS['primary'],
                    foreground='white')
    style.map('Primary.TButton',
              background=[('active', '#45a049')])

    # Create danger button style
    style.configure('Danger.TButton',
                    background=COLORS['danger'],
                    foreground='white')
    style.map('Danger.TButton',
              background=[('active', '#d32f2f')])

    # Configure combobox and entry styles
    style.configure('TCombobox', font=FONTS['normal'])
    style.configure('TEntry', font=FONTS['normal'])


def create_form_window(parent, title, width=500, height=400):
    """Create a styled form window"""
    window = tk.Toplevel(parent)
    window.title(title)
    window.geometry(f"{width}x{height}")
    window.configure(bg=COLORS['bg'])
    return window


def create_form_frame(parent, padx=PADDINGS['large'], pady=PADDINGS['large']):
    """Create a styled form frame"""
    frame = tk.Frame(parent, bg=COLORS['bg'], padx=padx, pady=pady)
    return frame


def create_label(parent, text, row, column, sticky=tk.W, pady=PADDINGS['small'],
                 font=FONTS['normal'], columnspan=1):
    """Create a styled label"""
    label = tk.Label(parent, text=text, font=font, bg=COLORS['bg'])
    label.grid(row=row, column=column, sticky=sticky, pady=pady, columnspan=columnspan)
    return label


def create_entry(parent, row, column, width=30, pady=PADDINGS['small'], padx=PADDINGS['small'],
                 sticky=tk.W, textvariable=None):
    """Create a styled entry field"""
    entry = tk.Entry(parent, font=FONTS['normal'], width=width)
    if textvariable:
        entry.config(textvariable=textvariable)
    entry.grid(row=row, column=column, pady=pady, padx=padx, sticky=sticky)
    return entry


def create_text_area(parent, row, column, width=30, height=4, pady=PADDINGS['small'],
                     padx=PADDINGS['small'], sticky=tk.W):
    """Create a styled text area"""
    text = tk.Text(parent, font=FONTS['normal'], width=width, height=height)
    text.grid(row=row, column=column, pady=pady, padx=padx, sticky=sticky)
    return text


def create_combobox(parent, row, column, values, width=28, pady=PADDINGS['small'],
                    padx=PADDINGS['small'], sticky=tk.W, textvariable=None):
    """Create a styled combobox"""
    combo = ttk.Combobox(parent, values=values, width=width)
    if textvariable:
        combo.config(textvariable=textvariable)
    combo.grid(row=row, column=column, pady=pady, padx=padx, sticky=sticky)
    return combo


def create_buttons_frame(parent, row, column, columnspan=2, pady=PADDINGS['large']):
    """Create a frame for buttons"""
    frame = tk.Frame(parent, bg=COLORS['bg'])
    frame.grid(row=row, column=column, columnspan=columnspan, pady=pady)
    return frame


def create_button(parent, text, command, row=0, column=0, padx=PADDINGS['medium'],
                  is_primary=True, is_danger=False):
    """Create a styled button"""
    bg_color = COLORS['primary'] if is_primary else COLORS['danger'] if is_danger else COLORS['bg']
    fg_color = 'white' if (is_primary or is_danger) else COLORS['text']

    button = tk.Button(
        parent,
        text=text,
        font=FONTS['normal_bold'],
        bg=bg_color,
        fg=fg_color,
        padx=PADDINGS['medium'],
        command=command
    )
    button.grid(row=row, column=column, padx=padx)
    return button


def create_info_section(parent, text, row, column, columnspan=2, sticky=tk.W, pady=PADDINGS['medium']):
    """Create an info section with styled text and background"""
    frame = tk.Frame(parent, bg=COLORS['light_primary'], padx=PADDINGS['medium'], pady=PADDINGS['medium'])
    frame.grid(row=row, column=column, columnspan=columnspan, sticky=sticky, pady=pady)

    label = tk.Label(frame, text=text, font=FONTS['normal'], bg=COLORS['light_primary'],
                     justify=tk.LEFT, wraplength=450)
    label.pack(anchor=tk.W)

    return frame


def create_logo_header(parent, height=80, with_title=True, app_title="Auto Service Management"):
    """Create a header with the company logo

    Args:
        parent: The parent widget
        height: Height for the header in pixels
        with_title: Whether to include the app title next to the logo
        app_title: Title text to display (if with_title is True)

    Returns:
        The header frame
    """
    # Create header frame
    header_frame = tk.Frame(parent, bg=COLORS['bg'], height=height)
    header_frame.pack(fill=tk.X)

    # Make sure the frame maintains its height
    header_frame.pack_propagate(False)

    # Load and display the logo
    try:
        logo_path = os.path.join(ASSETS_DIR, "logo.png")
        logo_img = Image.open(logo_path)

        # Calculate new height while maintaining aspect ratio
        ratio = height * 0.8 / logo_img.height
        new_width = int(logo_img.width * ratio)
        new_height = int(logo_img.height * ratio)

        # Resize the image
        logo_img = logo_img.resize((new_width, new_height), Image.LANCZOS)

        # Convert to Tkinter-compatible image
        tk_img = ImageTk.PhotoImage(logo_img)

        # Create and place the label
        logo_label = tk.Label(header_frame, image=tk_img, bg=COLORS['bg'])
        logo_label.image = tk_img  # Keep a reference to prevent garbage collection

        if with_title:
            # Position logo on the left with some padding
            logo_label.pack(side=tk.LEFT, padx=(20, 10), pady=10)

            # Add title text
            title_label = tk.Label(
                header_frame,
                text=app_title,
                font=('Arial', 24, 'bold'),
                bg=COLORS['bg'],
                fg=COLORS['primary']
            )
            title_label.pack(side=tk.LEFT, padx=10, pady=10)
        else:
            # Center the logo
            logo_label.pack(pady=10)

    except Exception as e:
        # If logo can't be loaded, display text instead
        backup_label = tk.Label(
            header_frame,
            text=app_title,
            font=('Arial', 24, 'bold'),
            bg=COLORS['bg'],
            fg=COLORS['primary']
        )
        backup_label.pack(pady=10)
        print(f"Error loading logo: {e}")

    return header_frame


def create_logo_window(parent, title, width=500, height=400, with_logo=True):
    """Create a window with the company logo in the header

    Args:
        parent: The parent widget
        title: Window title
        width: Window width
        height: Window height
        with_logo: Whether to include the logo in the header

    Returns:
        Tuple containing (window, content_frame)
    """
    window = tk.Toplevel(parent)
    window.title(title)
    window.geometry(f"{width}x{height}")
    window.configure(bg=COLORS['bg'])

    if with_logo:
        # Add logo header
        create_logo_header(window, height=80, with_title=False)

        # Create content frame below the header
        content_frame = tk.Frame(window, bg=COLORS['bg'])
        content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        return window, content_frame
    else:
        # Return the window and itself as content frame if no logo needed
        return window, window