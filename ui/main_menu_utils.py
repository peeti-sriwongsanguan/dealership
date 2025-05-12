# ui/main_menu_utils.py
"""
Utilities for creating consistent main menu screens.
"""
import tkinter as tk
from tkinter import ttk
from ui.ui_utils import COLORS, FONTS, PADDINGS, create_logo_header


def create_main_window(title="Auto Service Management", width=1024, height=768):
    """Create a main window with the logo and title

    Args:
        title: Window title
        width: Window width
        height: Window height

    Returns:
        Tuple of (root_window, content_frame)
    """
    # Create main window
    root = tk.Tk()
    root.title(title)
    root.geometry(f"{width}x{height}")
    root.configure(bg=COLORS['bg'])

    # Create the logo header
    create_logo_header(root, height=80, with_title=True, app_title=title)

    # Create content frame
    content_frame = tk.Frame(root, bg=COLORS['bg'])
    content_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

    return root, content_frame


def create_main_menu_button(parent, text, icon_path=None, command=None,
                            row=0, column=0, padx=10, pady=10):
    """Create a styled main menu button

    Args:
        parent: The parent widget
        text: Button text
        icon_path: Path to icon image (optional)
        command: Function to call when button is clicked
        row, column: Grid position
        padx, pady: Padding

    Returns:
        The button widget
    """
    # Create a frame for the button to control its appearance
    button_frame = tk.Frame(
        parent,
        bg=COLORS['bg'],
        highlightbackground=COLORS['primary'],
        highlightthickness=2,
        padx=15,
        pady=15
    )
    button_frame.grid(row=row, column=column, padx=padx, pady=pady)

    # Create the actual button
    button = tk.Button(
        button_frame,
        text=text,
        font=FONTS['large_bold'],
        bg=COLORS['bg'],
        fg=COLORS['primary'],
        relief=tk.FLAT,
        padx=20,
        pady=20,
        width=15,
        height=5,
        command=command
    )
    button.pack()

    # Add hover effect
    def on_enter(e):
        button.config(bg=COLORS['light_primary'])

    def on_leave(e):
        button.config(bg=COLORS['bg'])

    button.bind("<Enter>", on_enter)
    button.bind("<Leave>", on_leave)

    return button


def create_tabbed_interface(parent):
    """Create a styled tabbed interface

    Args:
        parent: The parent widget

    Returns:
        The notebook widget
    """
    # Create notebook
    style = ttk.Style()
    style.configure('TNotebook', background=COLORS['bg'])
    style.configure('TNotebook.Tab', font=FONTS['normal_bold'], padding=[10, 5])
    style.map('TNotebook.Tab',
              background=[('selected', COLORS['primary']), ('!selected', COLORS['bg'])],
              foreground=[('selected', 'white'), ('!selected', COLORS['text'])])

    notebook = ttk.Notebook(parent)
    notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

    return notebook


def create_status_bar(parent, text="Ready"):
    """Create a status bar at the bottom of the window

    Args:
        parent: The parent widget
        text: Initial status text

    Returns:
        The status bar label
    """
    status_frame = tk.Frame(parent, bg=COLORS['border'])
    status_frame.pack(side=tk.BOTTOM, fill=tk.X)

    status_label = tk.Label(
        status_frame,
        text=text,
        font=FONTS['small'],
        bg=COLORS['border'],
        fg=COLORS['text'],
        anchor=tk.W,
        padx=10,
        pady=3
    )
    status_label.pack(side=tk.LEFT, fill=tk.X)

    return status_label