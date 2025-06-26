//static/js/modules/customers.js
/**
 * Customers Module - Customer Management for OL Service POS
 */

class CustomersModule {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.isLoading = false;

        // DOM elements will be cached here
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
            // Refresh customer data
            await this.loadCustomers();

            // Return HTML content instead of rendering directly
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
                        <button class="btn btn-outline" onclick="window.Customers.exportCustomers()">
                            📤 Export
                        </button>
                        <button class="btn btn-primary" onclick="window.Customers.showAddModal()">
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
                                    class="search-input"
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
                    <button class="btn btn-primary" onclick="window.olServiceApp.loadSection('customers')">
                        🔄 Retry
                    </button>
                    <button class="btn btn-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Load and display customers section (legacy method)
     */
    async load() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            // Refresh customer data
            await this.loadCustomers();

            // Render the customers interface
            this.render();

        } catch (error) {
            console.error('Failed to load customers section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render the customers interface (legacy method)
     */
    render() {
        const html = this.getHTML();

        if (window.app) {
            window.app.setContent(html);
        }
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
            <tr onclick="window.Customers.viewCustomer(${customer.id})" class="table-row-clickable">
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
                        ${!customer.phone && !customer.email ? '<span class="text-muted">No contact info</span>' : ''}
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
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Customers.editCustomer(${customer.id})"
                            title="Edit Customer"
                        >
                            ✏️
                        </button>
                        <button
                            class="btn btn-sm btn-outline"
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
                <button class="btn btn-primary" onclick="window.Customers.showAddModal()">
                    ➕ Add First Customer
                </button>
            </div>
        `;
    }

    /**
     * Render error state (legacy method)
     */
    renderError(error) {
        const html = this.getErrorHTML(error);

        if (window.app) {
            window.app.setContent(html);
        }
    }

    /**
     * Show add customer modal
     */
    showAddModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add New Customer</h2>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addCustomerForm" onsubmit="window.Customers.submitCustomer(event)">
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
                        <button type="button" class="btn btn-outline" onclick="closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            💾 Save Customer
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (typeof showModal !== 'undefined') {
            showModal('Add Customer', modalContent);
        } else if (window.app) {
            window.app.showModal(modalContent);
        } else {
            console.log('Modal system not available');
        }
    }

    /**
     * Submit customer form
     */
    async submitCustomer(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const customerData = {
            name: formData.get('name').trim(),
            phone: formData.get('phone').trim(),
            email: formData.get('email').trim(),
            address: formData.get('address').trim()
        };

        // Validate required fields
        if (!customerData.name) {
            if (typeof showToast !== 'undefined') {
                showToast('Customer name is required', 'error');
            }
            return;
        }

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            if (response.ok) {
                const result = await response.json();

                if (typeof showToast !== 'undefined') {
                    showToast('✅ Customer added successfully!', 'success');
                }

                if (typeof closeModal !== 'undefined') {
                    closeModal();
                }

                // Refresh the customer list
                await this.loadCustomers();

                // If we're currently in the customers section, reload it
                if (window.olServiceApp && window.olServiceApp.currentSection === 'customers') {
                    window.olServiceApp.loadSection('customers');
                }

            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add customer');
            }

        } catch (error) {
            console.error('Failed to add customer:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`❌ ${error.message}`, 'error');
            }
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
        if (typeof showToast !== 'undefined') {
            showToast(`View customer ${customerId} - Feature coming soon!`, 'info');
        }
        console.log('View customer:', customerId);
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        if (typeof showToast !== 'undefined') {
            showToast(`Edit customer ${customerId} - Feature coming soon!`, 'info');
        }
        console.log('Edit customer:', customerId);
    }

    /**
     * View customer vehicles
     */
    viewVehicles(customerId) {
        if (typeof showToast !== 'undefined') {
            showToast(`View vehicles for customer ${customerId} - Feature coming soon!`, 'info');
        }
        console.log('View vehicles for customer:', customerId);
    }

    /**
     * Export customers
     */
    exportCustomers() {
        if (typeof showToast !== 'undefined') {
            showToast('Export customers - Feature coming soon!', 'info');
        }
        console.log('Export customers');
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

// Also create the expected module reference
window.customersModule = window.Customers;

console.log('✅ Customers module loaded successfully');