# ui/components/base_components.py
"""
Base UI Components for OL Service POS System
Provides reusable UI components and utilities
"""

import tkinter as tk
from tkinter import ttk
from typing import Optional, Callable, Any, Dict
from abc import ABC, abstractmethod


class BaseComponent(ABC):
    """Abstract base class for UI components"""

    def __init__(self, parent: tk.Widget, **kwargs):
        self.parent = parent
        self.kwargs = kwargs
        self.widget: Optional[tk.Widget] = None
        self._create_widget()

    @abstractmethod
    def _create_widget(self):
        """Create the actual widget - must be implemented by subclasses"""
        pass

    def pack(self, **kwargs):
        """Pack the widget"""
        if self.widget:
            self.widget.pack(**kwargs)

    def grid(self, **kwargs):
        """Grid the widget"""
        if self.widget:
            self.widget.grid(**kwargs)

    def place(self, **kwargs):
        """Place the widget"""
        if self.widget:
            self.widget.place(**kwargs)

    def destroy(self):
        """Destroy the widget"""
        if self.widget:
            self.widget.destroy()


class TouchButton(BaseComponent):
    """Touch-friendly button component"""

    def __init__(self, parent: tk.Widget, text: str, command: Optional[Callable] = None, **kwargs):
        self.text = text
        self.command = command
        super().__init__(parent, **kwargs)

    def _create_widget(self):
        """Create the button widget"""
        style_kwargs = {
            'font': ('Arial', 12, 'bold'),
            'relief': 'raised',
            'bd': 2,
            'padx': 20,
            'pady': 10
        }
        style_kwargs.update(self.kwargs)

        self.widget = tk.Button(
            self.parent,
            text=self.text,
            command=self.command,
            **style_kwargs
        )


class TouchEntry(BaseComponent):
    """Touch-friendly entry component"""

    def __init__(self, parent: tk.Widget, placeholder: str = "", **kwargs):
        self.placeholder = placeholder
        self.placeholder_color = 'grey'
        self.default_color = 'black'
        super().__init__(parent, **kwargs)

    def _create_widget(self):
        """Create the entry widget"""
        style_kwargs = {
            'font': ('Arial', 12),
            'relief': 'solid',
            'bd': 1,
            'padx': 10,
            'pady': 5
        }
        style_kwargs.update(self.kwargs)

        self.widget = tk.Entry(self.parent, **style_kwargs)

        if self.placeholder:
            self._setup_placeholder()

    def _setup_placeholder(self):
        """Setup placeholder text functionality"""
        self.widget.insert(0, self.placeholder)
        self.widget.config(fg=self.placeholder_color)

        def on_focus_in(event):
            if self.widget.get() == self.placeholder:
                self.widget.delete(0, tk.END)
                self.widget.config(fg=self.default_color)

        def on_focus_out(event):
            if not self.widget.get():
                self.widget.insert(0, self.placeholder)
                self.widget.config(fg=self.placeholder_color)

        self.widget.bind('<FocusIn>', on_focus_in)
        self.widget.bind('<FocusOut>', on_focus_out)

    def get(self) -> str:
        """Get the entry value, excluding placeholder"""
        value = self.widget.get()
        return "" if value == self.placeholder else value

    def set(self, value: str):
        """Set the entry value"""
        self.widget.delete(0, tk.END)
        self.widget.insert(0, value)
        self.widget.config(fg=self.default_color)


class ScrollableFrame(BaseComponent):
    """Scrollable frame component"""

    def __init__(self, parent: tk.Widget, **kwargs):
        super().__init__(parent, **kwargs)

    def _create_widget(self):
        """Create the scrollable frame"""
        # Create main frame
        self.widget = tk.Frame(self.parent)

        # Create canvas and scrollbars
        self.canvas = tk.Canvas(self.widget, **self.kwargs)
        self.v_scrollbar = ttk.Scrollbar(self.widget, orient="vertical", command=self.canvas.yview)
        self.h_scrollbar = ttk.Scrollbar(self.widget, orient="horizontal", command=self.canvas.xview)

        # Create the scrollable frame
        self.scrollable_frame = tk.Frame(self.canvas)

        # Configure scrolling
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.v_scrollbar.set, xscrollcommand=self.h_scrollbar.set)

        # Pack components
        self.canvas.pack(side="left", fill="both", expand=True)
        self.v_scrollbar.pack(side="right", fill="y")
        self.h_scrollbar.pack(side="bottom", fill="x")

        # Bind mousewheel
        self._bind_mousewheel()

    def _bind_mousewheel(self):
        """Bind mousewheel scrolling"""

        def on_mousewheel(event):
            self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        def bind_to_mousewheel(event):
            self.canvas.bind_all("<MouseWheel>", on_mousewheel)

        def unbind_from_mousewheel(event):
            self.canvas.unbind_all("<MouseWheel>")

        self.canvas.bind('<Enter>', bind_to_mousewheel)
        self.canvas.bind('<Leave>', unbind_from_mousewheel)


class StatusBar(BaseComponent):
    """Status bar component"""

    def __init__(self, parent: tk.Widget, **kwargs):
        self.status_text = tk.StringVar()
        self.status_text.set("Ready")
        super().__init__(parent, **kwargs)

    def _create_widget(self):
        """Create the status bar"""
        style_kwargs = {
            'relief': 'sunken',
            'bd': 1,
            'anchor': 'w',
            'padx': 5
        }
        style_kwargs.update(self.kwargs)

        self.widget = tk.Label(
            self.parent,
            textvariable=self.status_text,
            **style_kwargs
        )

    def set_status(self, message: str):
        """Set the status message"""
        self.status_text.set(message)

    def clear_status(self):
        """Clear the status message"""
        self.status_text.set("Ready")


class ProgressDialog:
    """Progress dialog for long operations"""

    def __init__(self, parent: tk.Widget, title: str = "Please Wait", message: str = "Processing..."):
        self.parent = parent
        self.title = title
        self.message = message
        self.dialog: Optional[tk.Toplevel] = None
        self.progress_var = tk.DoubleVar()
        self.message_var = tk.StringVar()
        self.message_var.set(message)

    def show(self):
        """Show the progress dialog"""
        self.dialog = tk.Toplevel(self.parent)
        self.dialog.title(self.title)
        self.dialog.geometry("300x120")
        self.dialog.resizable(False, False)
        self.dialog.transient(self.parent)
        self.dialog.grab_set()

        # Center the dialog
        self.dialog.geometry("+%d+%d" % (
            self.parent.winfo_rootx() + 50,
            self.parent.winfo_rooty() + 50
        ))

        # Create widgets
        message_label = tk.Label(self.dialog, textvariable=self.message_var, wraplength=280)
        message_label.pack(pady=10)

        self.progress_bar = ttk.Progressbar(
            self.dialog,
            variable=self.progress_var,
            maximum=100,
            length=250
        )
        self.progress_bar.pack(pady=10)

        # Update display
        self.dialog.update()

    def update_progress(self, percentage: float, message: str = None):
        """Update progress percentage and optional message"""
        if self.dialog:
            self.progress_var.set(percentage)
            if message:
                self.message_var.set(message)
            self.dialog.update()

    def close(self):
        """Close the progress dialog"""
        if self.dialog:
            self.dialog.destroy()
            self.dialog = None


class ConfirmDialog:
    """Confirmation dialog component"""

    def __init__(self, parent: tk.Widget, title: str, message: str, ok_text: str = "OK", cancel_text: str = "Cancel"):
        self.parent = parent
        self.title = title
        self.message = message
        self.ok_text = ok_text
        self.cancel_text = cancel_text
        self.result = False

    def show(self) -> bool:
        """Show the confirmation dialog and return result"""
        dialog = tk.Toplevel(self.parent)
        dialog.title(self.title)
        dialog.geometry("300x120")
        dialog.resizable(False, False)
        dialog.transient(self.parent)
        dialog.grab_set()

        # Center the dialog
        dialog.geometry("+%d+%d" % (
            self.parent.winfo_rootx() + 50,
            self.parent.winfo_rooty() + 50
        ))

        # Create widgets
        message_label = tk.Label(dialog, text=self.message, wraplength=280)
        message_label.pack(pady=15)

        button_frame = tk.Frame(dialog)
        button_frame.pack(pady=10)

        def on_ok():
            self.result = True
            dialog.destroy()

        def on_cancel():
            self.result = False
            dialog.destroy()

        ok_button = tk.Button(button_frame, text=self.ok_text, command=on_ok, width=10)
        ok_button.pack(side=tk.LEFT, padx=5)

        cancel_button = tk.Button(button_frame, text=self.cancel_text, command=on_cancel, width=10)
        cancel_button.pack(side=tk.LEFT, padx=5)

        # Wait for dialog to close
        dialog.wait_window()

        return self.result


class LoadingSpinner(BaseComponent):
    """Simple loading spinner component"""

    def __init__(self, parent: tk.Widget, **kwargs):
        self.spinning = False
        self.spin_chars = ['|', '/', '-', '\\']
        self.spin_index = 0
        super().__init__(parent, **kwargs)

    def _create_widget(self):
        """Create the spinner label"""
        self.spin_var = tk.StringVar()
        self.widget = tk.Label(self.parent, textvariable=self.spin_var, **self.kwargs)

    def start(self):
        """Start the spinning animation"""
        self.spinning = True
        self._spin()

    def stop(self):
        """Stop the spinning animation"""
        self.spinning = False
        self.spin_var.set("")

    def _spin(self):
        """Internal spinning animation method"""
        if self.spinning:
            self.spin_var.set(self.spin_chars[self.spin_index])
            self.spin_index = (self.spin_index + 1) % len(self.spin_chars)
            self.widget.after(100, self._spin)


# Utility functions for common UI operations
def center_window(window: tk.Toplevel, width: int, height: int):
    """Center a window on the screen"""
    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()

    x = (screen_width - width) // 2
    y = (screen_height - height) // 2

    window.geometry(f"{width}x{height}+{x}+{y}")


def show_error(parent: tk.Widget, title: str, message: str):
    """Show an error dialog"""
    from tkinter import messagebox
    messagebox.showerror(title, message, parent=parent)


def show_info(parent: tk.Widget, title: str, message: str):
    """Show an info dialog"""
    from tkinter import messagebox
    messagebox.showinfo(title, message, parent=parent)


def show_warning(parent: tk.Widget, title: str, message: str):
    """Show a warning dialog"""
    from tkinter import messagebox
    messagebox.showwarning(title, message, parent=parent)


def ask_yes_no(parent: tk.Widget, title: str, message: str) -> bool:
    """Ask a yes/no question"""
    from tkinter import messagebox
    return messagebox.askyesno(title, message, parent=parent)