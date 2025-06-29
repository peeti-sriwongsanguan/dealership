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
     * Edit customer
     */

    editCustomer(customerId) {
        const c = this.customers.find(c => c.id === customerId);
        if (!c) return;
        const form = `
            <form id="editCustomerForm" onsubmit="window.Customers.handleEditCustomer(event, ${customerId})">
                <div class="form-group">
                    <label>Name</label>
                    <input name="name" class="form-input" value="${c.name}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input name="phone" class="form-input" value="${c.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input name="email" class="form-input" value="${c.email || ''}">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" class="form-textarea">${c.address || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button class="button button-outline" type="button" onclick="closeModal()">Cancel</button>
                    <button class="button button-primary" type="submit">Save</button>
                </div>
            </form>`;
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>✏️ Edit Customer #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                ${form}
            </div>
        `;

        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

    }

    async handleEditCustomer(event, id) {
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        const update = {
            name: data.get('name').trim(),
            phone: data.get('phone').trim(),
            email: data.get('email').trim(),
            address: data.get('address').trim()
        };
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
            });
            if (!res.ok) throw new Error('Update failed');
            showToast('Customer updated', 'success');
            closeModal();
            await this.loadCustomers();
            window.olServiceApp.loadSection('customers');
        } catch (e) {
            console.error('❌ Update error:', e);
            showToast('Failed to update customer', 'error');
        }
    }



     /**
     * Show add vehicle modal
     */
    showAddVehicleModal(customerId) {
        console.log('➕ Adding vehicle for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add Vehicle for ${customer.name}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Customers.handleAddVehicle(event, ${customerId})">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Make</label>
                            <input type="text" name="make" class="form-input"
                                placeholder="e.g. Toyota" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Model</label>
                            <input type="text" name="model" class="form-input"
                                placeholder="e.g. Camry" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Year</label>
                            <input type="number" name="year" class="form-input"
                                placeholder="e.g. 2022" min="1900" max="2030">
                        </div>
                        <div class="form-group">
                            <label class="form-label">License Plate</label>
                            <input type="text" name="license_plate" class="form-input"
                                placeholder="e.g. ABC-1234">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">VIN</label>
                            <input type="text" name="vin" class="form-input"
                                placeholder="Vehicle Identification Number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <input type="text" name="color" class="form-input"
                                placeholder="e.g. Silver">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Vehicle Type</label>
                            <select name="vehicle_type" class="form-input">
                                <option value="car">Car</option>
                                <option value="truck">Truck</option>
                                <option value="suv">SUV</option>
                                <option value="van">Van</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mileage</label>
                            <input type="number" name="mileage" class="form-input"
                                placeholder="e.g. 50000" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-textarea" rows="3"
                            placeholder="Any additional notes about the vehicle"></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Handle add vehicle form submission
     */
    async handleAddVehicle(event, customerId) {
        event.preventDefault();
        console.log('🚗 Adding vehicle for customer:', customerId);

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);
            const vehicleData = {
                customer_id: customerId,
                make: formData.get('make').trim(),
                model: formData.get('model').trim(),
                year: formData.get('year') ? parseInt(formData.get('year')) : null,
                vin: formData.get('vin').trim(),
                license_plate: formData.get('license_plate').trim(),
                color: formData.get('color').trim(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : 0,
                vehicle_type: formData.get('vehicle_type'),
                notes: formData.get('notes').trim()
            };

            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to add vehicle');
            }

            window.showToast('Vehicle added successfully!', 'success');
            window.closeModal();

            // Reload the customers to update vehicle count
            await this.loadCustomers();

            // Show the updated vehicles list
            setTimeout(() => {
                this.viewVehicles(customerId);
            }, 300);

        } catch (error) {
            console.error('❌ Error adding vehicle:', error);
            window.showToast('Failed to add vehicle', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Vehicle';
        }
    }

    /**
     * Delete vehicle
     */
    async deleteVehicle(vehicleId, customerId) {
        if (!confirm('Are you sure you want to delete this vehicle?')) {
            return;
        }

        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete vehicle');
            }

            window.showToast('Vehicle deleted successfully!', 'success');

            // Reload customers to update vehicle count
            await this.loadCustomers();

            // Refresh the vehicles list
            this.viewVehicles(customerId);

        } catch (error) {
            console.error('❌ Error deleting vehicle:', error);
            window.showToast(error.message || 'Failed to delete vehicle', 'error');
        }
    }
    /**
     * View customer vehicles
     */
    viewCustomer(customerId) {
        console.log('👁️ Viewing customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>👤 Customer Details #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="customer-detail-view">
                    <div class="detail-section">
                        <h3>Basic Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${customer.name || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Customer ID:</span>
                            <span class="detail-value">#${customer.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Registered:</span>
                            <span class="detail-value">${customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${customer.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${customer.email || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${customer.address || 'Not provided'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Vehicle Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Total Vehicles:</span>
                            <span class="detail-value">${customer.vehicle_count || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="button button-outline" onclick="window.Customers.editCustomer(${customerId})">
                        ✏️ Edit
                    </button>
                    <button class="button button-primary" onclick="window.Customers.viewVehicles(${customerId})">
                        🚗 View Vehicles
                    </button>
                </div>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }


    /**
     * View customer vehicles
     */
    async viewVehicles(customerId) {
        console.log('🚗 Viewing vehicles for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        try {
            // Fetch vehicles for this customer
            const response = await fetch(`/api/vehicles?customer_id=${customerId}`);
            const data = await response.json();
            const vehicles = data.vehicles || [];

            let vehicleContent = '';

            if (vehicles.length === 0) {
                vehicleContent = `
                    <div class="empty-state" style="padding: 40px 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🚗</div>
                        <h3 style="margin: 0 0 10px 0; color: #333;">No Vehicles Found</h3>
                        <p style="color: #666; margin-bottom: 20px;">This customer has no vehicles registered.</p>
                        <button class="button button-primary" onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add First Vehicle
                        </button>
                    </div>
                `;
            } else {
                const vehicleRows = vehicles.map(vehicle => `
                    <tr>
                        <td>
                            <div class="vehicle-info">
                                <div class="vehicle-icon">🚗</div>
                                <div>
                                    <div style="font-weight: 600; color: #333;">
                                        ${vehicle.year || ''} ${vehicle.make} ${vehicle.model}
                                    </div>
                                    <div style="font-size: 12px; color: #666;">
                                        VIN: ${vehicle.vin || 'Not provided'}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div>${vehicle.license_plate || 'No plate'}</div>
                            <div style="font-size: 12px; color: #666;">${vehicle.color || 'No color'}</div>
                        </td>
                        <td>
                            <div>${vehicle.vehicle_type || 'Car'}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' mi' : 'No mileage'}
                            </div>
                        </td>
                        <td>
                            <button class="button button-small button-outline"
                                onclick="window.Customers.editVehicle(${vehicle.id}, ${customerId})"
                                title="Edit Vehicle">
                                ✏️
                            </button>
                            <button class="button button-small button-outline"
                                onclick="window.Customers.deleteVehicle(${vehicle.id}, ${customerId})"
                                title="Delete Vehicle"
                                style="color: #dc3545; border-color: #dc3545;">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `).join('');

                vehicleContent = `
                    <div class="vehicle-list">
                        <table class="data-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>License/Color</th>
                                    <th>Type/Mileage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vehicleRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            const modalContent = `
                <div class="modal-header">
                    <h2>🚗 Vehicles for ${customer.name}</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #666;">
                            Total vehicles: <strong>${vehicles.length}</strong>
                        </span>
                        <button class="button button-primary button-small"
                            onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add Vehicle
                        </button>
                    </div>
                    ${vehicleContent}
                </div>
            `;

            // Show modal
            const modalOverlay = document.getElementById('modalOverlay');
            const modalContainer = document.getElementById('modalContainer');

            if (modalOverlay && modalContainer) {
                modalContainer.innerHTML = modalContent;
                modalOverlay.classList.add('active');
                modalOverlay.style.display = 'flex';
                modalOverlay.style.opacity = '1';
                modalOverlay.style.visibility = 'visible';
                document.body.style.overflow = 'hidden';
            }

        } catch (error) {
            console.error('❌ Error loading vehicles:', error);
            window.showToast('Failed to load vehicles', 'error');
        }
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