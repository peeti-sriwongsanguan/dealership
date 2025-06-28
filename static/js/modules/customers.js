// static/js/modules/customers.js
/**
 * Customers Module - Customer Management for OL Service POS
 * Fixed version with proper button classes and modal integration
 */

class CustomersModule {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.isLoading = false;
        this.elements = {};
    }

    /**
     * Initialize the customers module
     */
    async init() {
        console.log('📋 Initializing Customers module...');

        try {
            await this.loadCustomers();
            console.log('✅ Customers module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Customers module:', error);
            throw error;
        }
    }

    /**
     * Load customers from API
     */
    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();

            this.customers = data.customers || [];
            console.log(`📋 Loaded ${this.customers.length} customers`);

        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
            throw error;
        }
    }

    /**
     * Load module for new app structure - returns HTML content
     */
    async loadModule() {
        console.log('📋 Loading customers module for new app...');

        try {
            await this.loadCustomers();
            return this.getHTML();
        } catch (error) {
            console.error('Failed to load customers module:', error);
            return this.getErrorHTML(error);
        }
    }

    /**
     * Get HTML content for the customers section
     */
    getHTML() {
        return `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">👥 Customer Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="window.Customers.exportCustomers()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="window.Customers.showAddModal()">
                            ➕ Add Customer
                        </button>
                    </div>
                </div>

                <!-- Customer Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.customers.length}</div>
                            <div class="stat-label">Total Customers</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📞</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithPhone()}</div>
                            <div class="stat-label">With Phone</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📧</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithEmail()}</div>
                            <div class="stat-label">With Email</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getRecentCustomers()}</div>
                            <div class="stat-label">This Month</div>
                        </div>
                    </div>
                </div>

                <!-- Customer Table -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Customer Directory</h3>
                        <div class="data-table-actions">
                            <div class="search-container">
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    class="form-input"
                                    style="width: 300px;"
                                    oninput="window.Customers.filterCustomers(this.value)"
                                >
                                <span class="search-icon">🔍</span>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderCustomerTable()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    getErrorHTML(error) {
        return `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Customers</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="button button-primary" onclick="window.olServiceApp.loadSection('customers')">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render customer table
     */
    renderCustomerTable() {
        if (this.customers.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Contact</th>
                            <th>Registration</th>
                            <th>Vehicles</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.customers.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render individual customer row
     */
    renderCustomerRow(customer) {
        const registrationDate = customer.registration_date ?
            new Date(customer.registration_date).toLocaleDateString() : 'Unknown';

        return `
            <tr onclick="window.Customers.viewCustomer(${customer.id})" class="table-row-clickable" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <div class="avatar">${this.getCustomerInitials(customer)}</div>
                        <div class="customer-details">
                            <div class="customer-name">${customer.name || 'Unnamed Customer'}</div>
                            <div class="customer-id">#${customer.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${customer.phone ? `<div class="contact-item">📞 ${customer.phone}</div>` : ''}
                        ${customer.email ? `<div class="contact-item">📧 ${customer.email}</div>` : ''}
                        ${!customer.phone && !customer.email ? '<span style="color: #7f8c8d;">No contact info</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="registration-date">${registrationDate}</div>
                </td>
                <td>
                    <span class="badge ${customer.vehicle_count > 0 ? 'badge-primary' : 'badge-secondary'}">
                        ${customer.vehicle_count || 0} vehicles
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.editCustomer(${customer.id})"
                            title="Edit Customer"
                        >
                            ✏️
                        </button>
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.viewVehicles(${customer.id})"
                            title="View Vehicles"
                        >
                            🚗
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">No customers found</h3>
                <p class="empty-state-description">
                    Get started by adding your first customer to the system.
                </p>
                <button class="button button-primary" onclick="window.Customers.showAddModal()">
                    ➕ Add First Customer
                </button>
            </div>
        `;
    }

    /**
     * Show add customer modal
     */
    showAddModal() {
        console.log('🔧 Opening add customer modal...');

        // Get modal elements directly
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Set modal content directly without wrapping
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>➕ Add New Customer</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addCustomerForm" onsubmit="window.Customers.handleAddCustomer(event)">
                    <div class="form-group">
                        <label class="form-label required">Customer Name</label>
                        <input
                            type="text"
                            name="name"
                            class="form-input"
                            placeholder="Enter customer name"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            class="form-input"
                            placeholder="(555) 123-4567"
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            class="form-input"
                            placeholder="customer@example.com"
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea
                            name="address"
                            class="form-textarea"
                            placeholder="Enter customer address"
                            rows="3"
                        ></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Customer
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal by adding active class
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log('✅ Modal displayed with active class');
    }

    /**
     * Handle add customer form submission
     */
    async handleAddCustomer(event) {
        event.preventDefault();
        console.log('📋 Submitting customer form...');

        // Prevent double submission
        if (this.isLoading) {
            console.log('Already submitting...');
            return;
        }

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            this.isLoading = true;
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);
            const customerData = {
                name: formData.get('name').trim(),
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                address: formData.get('address').trim()
            };

            console.log('Sending customer data:', customerData);

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Customer created:', result);

                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('Customer created successfully!', 'success');
                }

                // Close the modal
                if (typeof window.closeModal === 'function') {
                    window.closeModal();
                } else {
                    // Fallback: directly manipulate DOM
                    const modalOverlay = document.getElementById('modalOverlay');
                    if (modalOverlay) {
                        modalOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }

                // Reload the customers list
                await this.loadCustomers();

                // Refresh the display
                if (window.olServiceApp) {
                    window.olServiceApp.loadSection('customers');
                }
            } else {
                throw new Error(result.error || 'Failed to create customer');
            }

        } catch (error) {
            console.error('❌ Error creating customer:', error);
            window.showToast(error.message || 'Failed to create customer', 'error');
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Customer';
        }
    }

    /**
     * Filter customers based on search term
     */
    filterCustomers(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }

    /**
     * View customer details
     */
    viewCustomer(customerId) {
        window.showToast(`View customer ${customerId} - Feature coming soon!`, 'info');
        console.log('View customer:', customerId);
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        window.showToast(`Edit customer ${customerId} - Feature coming soon!`, 'info');
        console.log('Edit customer:', customerId);
    }

    /**
     * View customer vehicles
     */
    viewVehicles(customerId) {
        window.showToast(`View vehicles for customer ${customerId} - Feature coming soon!`, 'info');
        console.log('View vehicles for customer:', customerId);
    }

    /**
     * Export customers
     */
    exportCustomers() {
        if (!this.customers.length) {
            if (typeof showToast === 'function') {
                showToast('No customers to export', 'warning');
            }
            return;
        }

        const headers = ['ID', 'Name', 'Phone', 'Email', 'Address'];
        const rows = this.customers.map(c => [c.id, c.name, c.phone, c.email, c.address]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${v || ''}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        const filename = `customers_export_${timestamp}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }



    /**
     * Utility methods
     */
    getCustomerInitials(customer) {
        if (!customer.name) return '?';

        const names = customer.name.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return customer.name[0].toUpperCase();
    }

    getCustomersWithPhone() {
        return this.customers.filter(c => c.phone && c.phone.trim()).length;
    }

    getCustomersWithEmail() {
        return this.customers.filter(c => c.email && c.email.trim()).length;
    }

    getRecentCustomers() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        return this.customers.filter(c => {
            if (!c.registration_date) return false;
            const regDate = new Date(c.registration_date);
            return regDate >= oneMonthAgo;
        }).length;
    }
}

// Create global instance
window.Customers = new CustomersModule();
window.customersModule = window.Customers;

// Initialize the module
window.Customers.init().catch(err => {
    console.error('Failed to initialize Customers module:', err);
});

console.log('✅ Customers module loaded successfully');