# ui/admin/reports_tab.py
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import sqlite3
import datetime
import os


class ReportsTab:
    def __init__(self, parent):
        self.parent = parent
        self.setup_ui()

    def setup_ui(self):
        """Setup the reports tab"""
        # Reports options frame
        options_frame = tk.LabelFrame(self.parent, text="Report Options",
                                      font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        options_frame.pack(fill=tk.X, padx=20, pady=20)

        # Report type
        type_frame = tk.Frame(options_frame, bg="#f0f0f0")
        type_frame.pack(fill=tk.X, pady=5)

        type_label = tk.Label(type_frame, text="Report Type:",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        type_label.pack(side=tk.LEFT)

        self.report_type_var = tk.StringVar()
        report_types = ["Service Summary", "Revenue Report", "Mechanic Performance", "Customer Activity"]
        self.report_type_var.set(report_types[0])

        type_dropdown = ttk.Combobox(type_frame, textvariable=self.report_type_var,
                                     values=report_types, width=30)
        type_dropdown.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)

        # Date range
        date_frame = tk.Frame(options_frame, bg="#f0f0f0")
        date_frame.pack(fill=tk.X, pady=5)

        from_label = tk.Label(date_frame, text="Date Range:",
                              font=("Arial", 12), bg="#f0f0f0", width=15, anchor="w")
        from_label.pack(side=tk.LEFT)

        self.from_date_var = tk.StringVar()
        self.from_date_var.set("2023-01-01")

        from_entry = tk.Entry(date_frame, font=("Arial", 12), width=12,
                              textvariable=self.from_date_var)
        from_entry.pack(side=tk.LEFT, padx=5)

        to_label = tk.Label(date_frame, text="to",
                            font=("Arial", 12), bg="#f0f0f0")
        to_label.pack(side=tk.LEFT, padx=5)

        self.to_date_var = tk.StringVar()
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        self.to_date_var.set(today)

        to_entry = tk.Entry(date_frame, font=("Arial", 12), width=12,
                            textvariable=self.to_date_var)
        to_entry.pack(side=tk.LEFT, padx=5)

        # Generate button
        button_frame = tk.Frame(options_frame, bg="#f0f0f0")
        button_frame.pack(fill=tk.X, pady=10)

        generate_button = tk.Button(button_frame, text="Generate Report",
                                    font=("Arial", 12, "bold"), bg="#4CAF50", fg="white",
                                    command=self.generate_report)
        generate_button.pack(pady=10)

        # Report output frame
        output_frame = tk.LabelFrame(self.parent, text="Report Output",
                                     font=("Arial", 12, "bold"), bg="#f0f0f0", padx=10, pady=10)
        output_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Report text widget
        self.report_text = tk.Text(output_frame, font=("Courier", 10), wrap=tk.WORD,
                                   height=20, width=80)
        self.report_text.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)

        # Add scrollbar
        report_scrollbar = ttk.Scrollbar(output_frame, orient="vertical",
                                         command=self.report_text.yview)
        report_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.report_text.configure(yscrollcommand=report_scrollbar.set)

        # Export button
        export_button = tk.Button(self.parent, text="Export Report",
                                  font=("Arial", 12),
                                  command=self.export_report)
        export_button.pack(pady=10)

    def generate_report(self):
        """Generate the selected report"""
        report_type = self.report_type_var.get()
        from_date = self.from_date_var.get()
        to_date = self.to_date_var.get()

        # Clear previous report
        self.report_text.delete(1.0, tk.END)

        # Connect to database
        conn = sqlite3.connect('ol_service_pos.db')
        cursor = conn.cursor()

        # Generate report based on type
        if report_type == "Service Summary":
            self.generate_service_summary(cursor, from_date, to_date)
        elif report_type == "Revenue Report":
            self.generate_revenue_report(cursor, from_date, to_date)
        elif report_type == "Mechanic Performance":
            self.generate_mechanic_performance(cursor, from_date, to_date)
        elif report_type == "Customer Activity":
            self.generate_customer_activity(cursor, from_date, to_date)

        conn.close()

    def generate_service_summary(self, cursor, from_date, to_date):
        """Generate service summary report"""
        self.report_text.insert(tk.END, f"SERVICE SUMMARY REPORT\n")
        self.report_text.insert(tk.END, f"Period: {from_date} to {to_date}\n")
        self.report_text.insert(tk.END, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.report_text.insert(tk.END, f"{'-' * 80}\n\n")

        # Service counts by type
        cursor.execute("""
        SELECT service_type, COUNT(*) as count, 
               SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
               SUM(CASE WHEN status = 'Awaiting Parts' THEN 1 ELSE 0 END) as awaiting_parts,
               SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold,
               SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
               AVG(cost) as avg_cost
        FROM services
        WHERE start_date BETWEEN ? AND ?
        GROUP BY service_type
        ORDER BY count DESC
        """, (from_date, to_date))

        service_summary = cursor.fetchall()

        self.report_text.insert(tk.END, f"SERVICE COUNTS BY TYPE\n")
        self.report_text.insert(tk.END,
                                f"{'Type':<15} {'Total':<8} {'Comp.':<8} {'Pend.':<8} {'In Prog.':<8} {'Parts':<8} {'Hold':<8} {'Canc.':<8} {'Avg Cost':<10}\n")
        self.report_text.insert(tk.END, f"{'-' * 80}\n")

        for summary in service_summary:
            service_type, count, completed, pending, in_progress, awaiting_parts, on_hold, cancelled, avg_cost = summary

            if avg_cost is None:
                avg_cost = 0

            self.report_text.insert(tk.END,
                                    f"{service_type:<15} {count:<8} {completed:<8} {pending:<8} {in_progress:<8} {awaiting_parts:<8} {on_hold:<8} {cancelled:<8} ${avg_cost:.2f}\n")

        # Total services
        cursor.execute("""
        SELECT COUNT(*) as total_services,
               SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
               SUM(cost) as total_cost
        FROM services
        WHERE start_date BETWEEN ? AND ?
        """, (from_date, to_date))

        totals = cursor.fetchone()
        total_services, completed, total_cost = totals

        if total_cost is None:
            total_cost = 0

        self.report_text.insert(tk.END, f"{'-' * 80}\n")
        self.report_text.insert(tk.END, f"Total Services: {total_services}\n")
        self.report_text.insert(tk.END, f"Completed Services: {completed}\n")
        self.report_text.insert(tk.END,
                                f"Completion Rate: {(completed / total_services) * 100 if total_services > 0 else 0:.1f}%\n")
        self.report_text.insert(tk.END, f"Total Revenue: ${total_cost:.2f}\n")

    def generate_revenue_report(self, cursor, from_date, to_date):
        """Generate revenue report"""
        self.report_text.insert(tk.END, f"REVENUE REPORT\n")
        self.report_text.insert(tk.END, f"Period: {from_date} to {to_date}\n")
        self.report_text.insert(tk.END, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.report_text.insert(tk.END, f"{'-' * 80}\n\n")

        # Revenue by service type
        cursor.execute("""
        SELECT service_type, COUNT(*) as count, SUM(cost) as total_revenue, AVG(cost) as avg_revenue
        FROM services
        WHERE start_date BETWEEN ? AND ? AND status = 'Completed'
        GROUP BY service_type
        ORDER BY total_revenue DESC
        """, (from_date, to_date))

        revenue_by_type = cursor.fetchall()

        self.report_text.insert(tk.END, f"REVENUE BY SERVICE TYPE\n")
        self.report_text.insert(tk.END, f"{'Type':<20} {'Count':<8} {'Total Revenue':<15} {'Avg Revenue':<15}\n")
        self.report_text.insert(tk.END, f"{'-' * 60}\n")

        for row in revenue_by_type:
            service_type, count, total_revenue, avg_revenue = row

            if total_revenue is None:
                total_revenue = 0

            if avg_revenue is None:
                avg_revenue = 0

            self.report_text.insert(tk.END,
                                    f"{service_type:<20} {count:<8} ${total_revenue:<14.2f} ${avg_revenue:<14.2f}\n")

        # Monthly revenue breakdown
        cursor.execute("""
        SELECT strftime('%Y-%m', start_date) as month, COUNT(*) as count, SUM(cost) as total_revenue
        FROM services
        WHERE start_date BETWEEN ? AND ? AND status = 'Completed'
        GROUP BY month
        ORDER BY month
        """, (from_date, to_date))

        monthly_revenue = cursor.fetchall()

        self.report_text.insert(tk.END, f"\n\nMONTHLY REVENUE BREAKDOWN\n")
        self.report_text.insert(tk.END, f"{'Month':<10} {'Services':<10} {'Revenue':<15}\n")
        self.report_text.insert(tk.END, f"{'-' * 40}\n")

        for row in monthly_revenue:
            month, count, total_revenue = row

            if total_revenue is None:
                total_revenue = 0

            self.report_text.insert(tk.END, f"{month:<10} {count:<10} ${total_revenue:<14.2f}\n")

        # Total revenue
        cursor.execute("""
        SELECT COUNT(*) as total_services, SUM(cost) as total_revenue
        FROM services
        WHERE start_date BETWEEN ? AND ? AND status = 'Completed'
        """, (from_date, to_date))

        totals = cursor.fetchone()
        total_services, total_revenue = totals

        if total_revenue is None:
            total_revenue = 0

        self.report_text.insert(tk.END, f"{'-' * 40}\n")
        self.report_text.insert(tk.END, f"Total Completed Services: {total_services}\n")
        self.report_text.insert(tk.END, f"Total Revenue: ${total_revenue:.2f}\n")

    def generate_mechanic_performance(self, cursor, from_date, to_date):
        """Generate mechanic performance report"""
        self.report_text.insert(tk.END, f"MECHANIC PERFORMANCE REPORT\n")
        self.report_text.insert(tk.END, f"Period: {from_date} to {to_date}\n")
        self.report_text.insert(tk.END, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.report_text.insert(tk.END, f"{'-' * 80}\n\n")

        # Services by mechanic
        cursor.execute("""
        SELECT u.username as mechanic, 
               COUNT(*) as total_services,
               SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed,
               AVG(julianday(s.actual_completion) - julianday(s.start_date)) as avg_days_to_complete,
               SUM(s.cost) as total_revenue
        FROM services s
        JOIN users u ON s.mechanic_id = u.id
        WHERE s.start_date BETWEEN ? AND ?
        GROUP BY s.mechanic_id
        ORDER BY total_services DESC
        """, (from_date, to_date))

        mechanic_performance = cursor.fetchall()

        self.report_text.insert(tk.END, f"MECHANIC PERFORMANCE SUMMARY\n")
        self.report_text.insert(tk.END,
                                f"{'Mechanic':<15} {'Total':<8} {'Completed':<10} {'Completion %':<12} {'Avg Days':<10} {'Revenue':<12}\n")
        self.report_text.insert(tk.END, f"{'-' * 70}\n")

        for row in mechanic_performance:
            mechanic, total, completed, avg_days, revenue = row

            if avg_days is None:
                avg_days = 0

            if revenue is None:
                revenue = 0

            completion_rate = (completed / total) * 100 if total > 0 else 0

            self.report_text.insert(tk.END,
                                    f"{mechanic:<15} {total:<8} {completed:<10} {completion_rate:<12.1f} {avg_days:<10.1f} ${revenue:<11.2f}\n")

        # Service type breakdown by mechanic
        self.report_text.insert(tk.END, f"\n\nSERVICE TYPE BREAKDOWN BY MECHANIC\n")

        cursor.execute("""
        SELECT DISTINCT username FROM users WHERE role = 'mechanic' OR role = 'admin'
        """)

        mechanics = cursor.fetchall()

        for mechanic in mechanics:
            mechanic_name = mechanic[0]

            self.report_text.insert(tk.END, f"\n{mechanic_name.upper()}\n")
            self.report_text.insert(tk.END, f"{'Service Type':<20} {'Count':<8} {'Avg Cost':<12}\n")
            self.report_text.insert(tk.END, f"{'-' * 40}\n")

            cursor.execute("""
            SELECT s.service_type, COUNT(*) as count, AVG(s.cost) as avg_cost
            FROM services s
            JOIN users u ON s.mechanic_id = u.id
            WHERE u.username = ? AND s.start_date BETWEEN ? AND ?
            GROUP BY s.service_type
            ORDER BY count DESC
            """, (mechanic_name, from_date, to_date))

            type_breakdown = cursor.fetchall()

            if not type_breakdown:
                self.report_text.insert(tk.END, f"No services assigned\n")
                continue

            for row in type_breakdown:
                service_type, count, avg_cost = row

                if avg_cost is None:
                    avg_cost = 0

                self.report_text.insert(tk.END, f"{service_type:<20} {count:<8} ${avg_cost:<11.2f}\n")

    def generate_customer_activity(self, cursor, from_date, to_date):
        """Generate customer activity report"""
        self.report_text.insert(tk.END, f"CUSTOMER ACTIVITY REPORT\n")
        self.report_text.insert(tk.END, f"Period: {from_date} to {to_date}\n")
        self.report_text.insert(tk.END, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.report_text.insert(tk.END, f"{'-' * 80}\n\n")

        # Most active customers
        cursor.execute("""
        SELECT c.name as customer, COUNT(s.id) as service_count, 
               COUNT(DISTINCT v.id) as vehicle_count, SUM(s.cost) as total_spent
        FROM customers c
        JOIN vehicles v ON c.id = v.customer_id
        JOIN services s ON v.id = s.vehicle_id
        WHERE s.start_date BETWEEN ? AND ?
        GROUP BY c.id
        ORDER BY service_count DESC
        LIMIT 20
        """, (from_date, to_date))

        active_customers = cursor.fetchall()

        self.report_text.insert(tk.END, f"TOP 20 MOST ACTIVE CUSTOMERS\n")
        self.report_text.insert(tk.END, f"{'Customer':<25} {'Services':<10} {'Vehicles':<10} {'Total Spent':<15}\n")
        self.report_text.insert(tk.END, f"{'-' * 60}\n")

        for row in active_customers:
            customer, service_count, vehicle_count, total_spent = row

            if total_spent is None:
                total_spent = 0

            self.report_text.insert(tk.END,
                                    f"{customer:<25} {service_count:<10} {vehicle_count:<10} ${total_spent:<14.2f}\n")

        # Service type popularity
        cursor.execute("""
        SELECT s.service_type, COUNT(*) as count, COUNT(DISTINCT c.id) as customer_count,
               AVG(s.cost) as avg_cost
        FROM services s
        JOIN vehicles v ON s.vehicle_id = v.id
        JOIN customers c ON v.customer_id = c.id
        WHERE s.start_date BETWEEN ? AND ?
        GROUP BY s.service_type
        ORDER BY count DESC
        """, (from_date, to_date))

        service_popularity = cursor.fetchall()

        self.report_text.insert(tk.END, f"\n\nSERVICE TYPE POPULARITY\n")
        self.report_text.insert(tk.END, f"{'Service Type':<20} {'Count':<8} {'Customers':<10} {'Avg Cost':<12}\n")
        self.report_text.insert(tk.END, f"{'-' * 50}\n")

        for row in service_popularity:
            service_type, count, customer_count, avg_cost = row

            if avg_cost is None:
                avg_cost = 0

            self.report_text.insert(tk.END, f"{service_type:<20} {count:<8} {customer_count:<10} ${avg_cost:<11.2f}\n")

        # New customers in period
        cursor.execute("""
        SELECT COUNT(*) as new_customers
        FROM customers
        WHERE registration_date BETWEEN ? AND ?
        """, (from_date, to_date))

        new_customers = cursor.fetchone()[0]

        self.report_text.insert(tk.END, f"\n\nNEW CUSTOMER SUMMARY\n")
        self.report_text.insert(tk.END, f"New customers registered in period: {new_customers}\n")

    def export_report(self):
        """Export the report to a text file"""
        # Get report content
        report_content = self.report_text.get(1.0, tk.END)

        if not report_content.strip():
            messagebox.showinfo("Info", "No report to export. Please generate a report first.")
            return

        # Get file name
        report_type = self.report_type_var.get().replace(" ", "_").lower()
        today = datetime.datetime.now().strftime("%Y%m%d")
        default_filename = f"{report_type}_{today}.txt"

        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            initialfile=default_filename,
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )

        if not file_path:
            return

        # Write to file
        try:
            with open(file_path, 'w') as f:
                f.write(report_content)

            messagebox.showinfo("Success", f"Report exported to {file_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export report: {str(e)}")