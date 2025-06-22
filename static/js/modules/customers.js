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
     * Load and display customers section
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
     * Render the customers interface
     */
    render() {
        const html = `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">👥 Customer Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="Customers.exportCustomers()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="Customers.showAddModal()">
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
                <div class="data-table">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Customer Directory</h3>
                        <div class="data-table-actions">
                            <div class="data-table-search">
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    class="form-input"
                                    oninput="Customers.filterCustomers(this.value)"
                                >
                                <span class="data-table-search-icon">🔍</span>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderCustomerTable()}
                    </div>
                </div>

                <!-- Back Button -->
                <div style="margin-top: 2rem; text-align: center;">
                    <button class="button button-outline" onclick="app.goHome()">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;

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
            <table>
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
        `;
    }

    /**
     * Render individual customer row
     */
    renderCustomerRow(customer) {
        const registrationDate = customer.registration_date ?
            new Date(customer.registration_date).toLocaleDateString() : 'Unknown';

        return `
            <tr onclick="Customers.viewCustomer(${customer.id})" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <div class="avatar avatar-md">${this.getCustomerInitials(customer)}</div>
                        <div class="customer-details">
                            <div class="customer-name">${customer.name || 'Unnamed Customer'}</div>
                            <div class="customer-id">#${customer.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${customer.phone ? `<div>📞 ${customer.phone}</div>` : ''}
                        ${customer.email ? `<div>📧 ${customer.email}</div>` : ''}
                        ${!customer.phone && !customer.email ? '<span class="text-muted">No contact info</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="registration-date">${registrationDate}</div>
                </td>
                <td>
                    <span class="badge badge-primary">${customer.vehicles?.length || 0} vehicles</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); Customers.editCustomer(${customer.id})"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); Customers.viewVehicles(${customer.id})"
                        >
                            🚗 Vehicles
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
                <button class="button button-primary" onclick="Customers.showAddModal()">
                    ➕ Add First Customer
                </button>
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError(error) {
        const html = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Customers</h2>
                <p class="error-message">${error.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="button button-primary" onclick="Customers.load()">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="app.goHome()">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;

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
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addCustomerForm" onsubmit="Customers.submitCustomer(event)">
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
                        <button type="button" class="button button-outline" onclick="app.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Customer
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (window.app) {
            window.app.showModal(modalContent);
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
            window.app?.showToast('Customer name is required', 'error');
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
                window.app?.showToast('✅ Customer added successfully!', 'success');
                window.app?.closeModal();

                // Refresh the customer list
                await this.load();

            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add customer');
            }

        } catch (error) {
            console.error('Failed to add customer:', error);
            window.app?.showToast(`❌ ${error.message}`, 'error');
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
        window.app?.showToast(`View customer ${customerId} - Feature coming soon!`, 'info');
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        window.app?.showToast(`Edit customer ${customerId} - Feature coming soon!`, 'info');
    }

    /**
     * View customer vehicles
     */
    viewVehicles(customerId) {
        window.app?.showToast(`View vehicles for customer ${customerId} - Feature coming soon!`, 'info');
    }

    /**
     * Export customers
     */
    exportCustomers() {
        window.app?.showToast('Export customers - Feature coming soon!', 'info');
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