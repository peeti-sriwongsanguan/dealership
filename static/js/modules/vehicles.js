// static/js/modules/vehicles.js - Vehicle Management Module

class VehiclesModule {
    constructor() {
        this.vehicles = [];
        this.customers = [];
        this.currentVehicle = null;
        this.isLoading = false;
        this.elements = {};

        // Vehicle types and makes
        this.vehicleTypes = ['Car', 'Truck', 'Van', 'SUV', 'Motorcycle', 'Bus', 'Trailer', 'RV'];
        this.vehicleMakes = [
            'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
            'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus',
            'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Ram',
            'Jeep', 'Chrysler', 'Dodge', 'Mitsubishi', 'Volvo', 'Jaguar', 'Land Rover'
        ];
    }

    async init() {
        console.log('🚗 Initializing Vehicles module...');
        try {
            await this.loadVehicles();
            await this.loadCustomers();
            console.log('✅ Vehicles module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Vehicles module:', error);
            throw error;
        }
    }

    /**
     * Load module for new app structure - returns HTML content
     */
    async loadModule() {
        console.log('🚗 Loading vehicles module for new app...');

        try {
            // Load fresh data
            await this.loadVehicles();
            await this.loadCustomers();

            // Return HTML content
            return this.getHTML();

        } catch (error) {
            console.error('Failed to load vehicles module:', error);
            return this.getErrorHTML(error);
        }
    }

    /**
     * Get HTML content for the vehicles section
     */
    getHTML() {
        return `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🚗 Vehicle Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="window.Vehicles.exportVehicles()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="window.Vehicles.showAddModal()">
                            ➕ Add Vehicle
                        </button>
                    </div>
                </div>

                <!-- Vehicle Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🚗</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.vehicles.length}</div>
                            <div class="stat-label">Total Vehicles</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🏭</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getUniqueMakes()}</div>
                            <div class="stat-label">Different Makes</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getAverageYear()}</div>
                            <div class="stat-label">Average Year</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🛣️</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getAverageMileage()}</div>
                            <div class="stat-label">Avg Mileage</div>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Filters -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Vehicle Directory</h3>
                        <div class="data-table-actions">
                            <div class="filters-container">
                                <select class="form-input filter-select" onchange="window.Vehicles.filterByType(this.value)">
                                    <option value="">All Types</option>
                                    ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                                <select class="form-input filter-select" onchange="window.Vehicles.filterByMake(this.value)">
                                    <option value="">All Makes</option>
                                    ${this.getUniqueVehicleMakes().map(make => `<option value="${make}">${make}</option>`).join('')}
                                </select>
                                <div class="search-container">
                                    <input
                                        type="text"
                                        placeholder="Search vehicles..."
                                        class="form-input"
                                        style="width: 300px;"
                                        oninput="window.Vehicles.filterVehicles(this.value)"
                                    >
                                    <span class="search-icon">🔍</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderVehicleTable()}
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
                <h2 class="error-title">Failed to Load Vehicles</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.olServiceApp.loadSection('vehicles')">
                        🔄 Retry
                    </button>
                    <button class="btn btn-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    async loadVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            const data = await response.json();
            this.vehicles = data.vehicles || [];
            console.log(`🚗 Loaded ${this.vehicles.length} vehicles`);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            this.vehicles = [];
            throw error;
        }
    }

    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();
            this.customers = data.customers || [];
            console.log(`👥 Loaded ${this.customers.length} customers for vehicles`);
        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
        }
    }

    async load() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await this.loadVehicles();
            await this.loadCustomers();
            this.render();
        } catch (error) {
            console.error('Failed to load vehicles section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const html = this.getHTML();

        if (window.app) {
            window.app.setContent(html);
        }
    }

    renderVehicleTable() {
        if (this.vehicles.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Owner</th>
                            <th>Details</th>
                            <th>Mileage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.vehicles.map(vehicle => this.renderVehicleRow(vehicle)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderVehicleRow(vehicle) {
        return `
            <tr onclick="window.Vehicles.viewVehicle(${vehicle.id})" class="table-row-clickable">
                <td>
                    <div class="vehicle-info">
                        <div class="avatar" style="background: ${this.getVehicleColor(vehicle.make)}">
                            ${this.getVehicleIcon(vehicle.make)}
                        </div>
                        <div class="vehicle-details">
                            <div class="vehicle-name">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                            <div class="vehicle-plate">
                                ${vehicle.license_plate ? `🚗 ${vehicle.license_plate}` : 'No plate'}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="owner-info">
                        <div class="owner-name">${vehicle.customer_name || 'Unknown Owner'}</div>
                        <div class="owner-id">ID: ${vehicle.customer_id}</div>
                    </div>
                </td>
                <td>
                    <div class="vehicle-specs">
                        <div><strong>VIN:</strong> ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}</div>
                        <div><strong>Year:</strong> ${vehicle.year}</div>
                    </div>
                </td>
                <td>
                    <div class="mileage-info">
                        <div class="mileage-number">${vehicle.mileage?.toLocaleString() || 'N/A'}</div>
                        <div class="mileage-label">miles</div>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Vehicles.editVehicle(${vehicle.id})"
                            title="Edit Vehicle"
                        >
                            ✏️
                        </button>
                        <button
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Vehicles.viewHistory(${vehicle.id})"
                            title="Service History"
                        >
                            📋
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🚗</div>
                <h3 class="empty-state-title">No vehicles found</h3>
                <p class="empty-state-description">
                    Start by adding vehicles to your fleet management system.
                </p>
                <button class="btn btn-primary" onclick="window.Vehicles.showAddModal()">
                    ➕ Add First Vehicle
                </button>
            </div>
        `;
    }


    /**
     * Show improved add vehicle modal
     */
    showAddModal() {
        console.log('🚗 Opening add vehicle modal...');

        // Check if customers are available
        if (!this.customers || this.customers.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Please add customers first before adding vehicles', 'warning');
            }
            return;
        }

        // Get modal elements directly
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Generate current year for max year validation
        const currentYear = new Date().getFullYear();

        // Set modal content
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>➕ Add New Vehicle</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Vehicles.submitVehicle(event)">
                    <!-- Vehicle Basic Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Information</h3>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Make</label>
                                <select name="make" class="form-input" required onchange="window.Vehicles.onMakeChange(this)">
                                    <option value="">Select make</option>
                                    ${this.vehicleMakes.map(make => `<option value="${make}">${make}</option>`).join('')}
                                    <option value="other">Other (Custom)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label required">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    class="form-input"
                                    placeholder="Enter model"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    class="form-input"
                                    placeholder="e.g. ${currentYear}"
                                    min="1900"
                                    max="${currentYear + 2}"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Vehicle Type</label>
                                <select name="vehicle_type" class="form-input">
                                    ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">License Plate</label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    class="form-input"
                                    placeholder="ABC123"
                                    style="text-transform: uppercase;"
                                    maxlength="10"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    class="form-input"
                                    placeholder="e.g. Silver, Blue"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Vehicle Details -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Details</h3>

                        <div class="form-group">
                            <label class="form-label">VIN (Vehicle Identification Number)</label>
                            <input
                                type="text"
                                name="vin"
                                class="form-input"
                                placeholder="1HGCM82633A123456"
                                maxlength="17"
                                style="text-transform: uppercase;"
                                oninput="window.Vehicles.validateVIN(this)"
                            >
                            <small class="form-help">17 characters - Leave blank if unknown</small>
                            <div id="vinError" class="form-error" style="display: none;"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Mileage</label>
                                <input
                                    type="number"
                                    name="mileage"
                                    class="form-input"
                                    placeholder="e.g. 50000"
                                    min="0"
                                    max="999999"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Engine Size</label>
                                <input
                                    type="text"
                                    name="engine_size"
                                    class="form-input"
                                    placeholder="e.g. 2.0L, V6"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Owner Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Owner Information</h3>

                        <div class="form-group">
                            <label class="form-label required">Vehicle Owner</label>
                            <select name="customer_id" class="form-input" required>
                                <option value="">Select customer</option>
                                ${this.customers
                                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                    .map(customer =>
                                        `<option value="${customer.id}">${customer.name || 'Unnamed Customer'} (ID: ${customer.id})</option>`
                                    ).join('')}
                            </select>
                            <small class="form-help">
                                Don't see the customer?
                                <a href="#" onclick="window.Vehicles.openCustomerModal(); return false;">Add new customer</a>
                            </small>
                        </div>
                    </div>

                    <!-- Additional Notes -->
                    <div class="form-section">
                        <h3 class="form-section-title">Additional Information</h3>

                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea
                                name="notes"
                                class="form-textarea"
                                placeholder="Any additional notes about the vehicle..."
                                rows="3"
                            ></textarea>
                        </div>
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
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log('✅ Add vehicle modal displayed');
    }

    /**
     * Handle add vehicle form submission (replaces submitVehicle)
     */
    async submitVehicle(event) {
        event.preventDefault();
        console.log('🚗 Submitting vehicle form...');

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

            // Build vehicle data object
            const vehicleData = {
                make: formData.get('make').trim(),
                model: formData.get('model').trim(),
                year: parseInt(formData.get('year')),
                vehicle_type: formData.get('vehicle_type') || 'Car',
                license_plate: formData.get('license_plate').trim().toUpperCase(),
                color: formData.get('color').trim(),
                vin: formData.get('vin').trim().toUpperCase(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : null,
                engine_size: formData.get('engine_size').trim(),
                customer_id: parseInt(formData.get('customer_id')),
                notes: formData.get('notes').trim()
            };

            // Client-side validation
            const validationResult = this.validateVehicleData(vehicleData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            console.log('Sending vehicle data:', vehicleData);

            // Submit to API
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Vehicle created:', result);

                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('✅ Vehicle added successfully!', 'success');
                }

                // Close the modal
                if (typeof window.closeModal === 'function') {
                    window.closeModal();
                }

                // Refresh the vehicle list
                await this.loadVehicles();

                // Refresh the display if we're in the vehicles section
                if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                    window.olServiceApp.loadSection('vehicles');
                }

            } else {
                throw new Error(result.error || 'Failed to add vehicle');
            }

        } catch (error) {
            console.error('❌ Error adding vehicle:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`❌ ${error.message}`, 'error');
            }
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Vehicle';
        }
    }

    /**
     * Validate vehicle data
     */
    validateVehicleData(data) {
        // Required fields validation
        if (!data.make || !data.model || !data.year || !data.customer_id) {
            return {
                isValid: false,
                message: 'Please fill in all required fields (Make, Model, Year, Owner)'
            };
        }

        // Year validation
        const currentYear = new Date().getFullYear();
        if (data.year < 1900 || data.year > currentYear + 2) {
            return {
                isValid: false,
                message: `Year must be between 1900 and ${currentYear + 2}`
            };
        }

        // VIN validation (if provided)
        if (data.vin && data.vin.length > 0 && data.vin.length !== 17) {
            return {
                isValid: false,
                message: 'VIN must be exactly 17 characters if provided'
            };
        }

        // Mileage validation
        if (data.mileage && (data.mileage < 0 || data.mileage > 999999)) {
            return {
                isValid: false,
                message: 'Mileage must be between 0 and 999,999'
            };
        }

        return { isValid: true };
    }

    /**
     * Handle make selection change
     */
    onMakeChange(selectElement) {
        const customMakeGroup = document.getElementById('customMakeGroup');

        if (selectElement.value === 'other') {
            // If "Other" is selected, show custom input
            if (!customMakeGroup) {
                const customInput = document.createElement('div');
                customInput.id = 'customMakeGroup';
                customInput.className = 'form-group';
                customInput.innerHTML = `
                    <label class="form-label required">Custom Make</label>
                    <input
                        type="text"
                        name="custom_make"
                        class="form-input"
                        placeholder="Enter custom make"
                        required
                    >
                `;
                selectElement.closest('.form-group').insertAdjacentElement('afterend', customInput);
            }
        } else {
            // Remove custom input if it exists
            if (customMakeGroup) {
                customMakeGroup.remove();
            }
        }
    }

    /**
     * Validate VIN as user types
     */
    validateVIN(input) {
        const vin = input.value.toUpperCase();
        const errorDiv = document.getElementById('vinError');

        if (vin.length === 0) {
            errorDiv.style.display = 'none';
            input.style.borderColor = '';
            return;
        }

        if (vin.length !== 17) {
            errorDiv.textContent = `VIN must be 17 characters (currently ${vin.length})`;
            errorDiv.style.display = 'block';
            input.style.borderColor = '#dc3545';
        } else {
            // Check for invalid characters (I, O, Q are not allowed in VINs)
            const invalidChars = vin.match(/[IOQ]/g);
            if (invalidChars) {
                errorDiv.textContent = 'VIN cannot contain the letters I, O, or Q';
                errorDiv.style.display = 'block';
                input.style.borderColor = '#dc3545';
            } else {
                errorDiv.style.display = 'none';
                input.style.borderColor = '#28a745';
            }
        }
    }

    /**
     * Open customer modal from vehicle form
     */
    openCustomerModal() {
        // Close current modal first
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }

        // Open customer add modal
        setTimeout(() => {
            if (window.Customers && typeof window.Customers.showAddModal === 'function') {
                window.Customers.showAddModal();
            }
        }, 300);
    }

    filterVehicles(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }

    filterByType(type) {
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            if (!type) {
                row.style.display = '';
            } else {
                const vehicleType = row.textContent.includes(`Type: ${type}`);
                row.style.display = vehicleType ? '' : 'none';
            }
        });
    }

    filterByMake(make) {
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            if (!make) {
                row.style.display = '';
            } else {
                const vehicleMake = row.textContent.includes(make);
                row.style.display = vehicleMake ? '' : 'none';
            }
        });
    }

    viewVehicle(vehicleId) {
        if (typeof showToast !== 'undefined') {
            showToast(`View vehicle ${vehicleId} details - Feature coming soon!`, 'info');
        }
        console.log('View vehicle:', vehicleId);
    }

    editVehicle(vehicleId) {
        if (typeof showToast !== 'undefined') {
            showToast(`Edit vehicle ${vehicleId} - Feature coming soon!`, 'info');
        }
        console.log('Edit vehicle:', vehicleId);
    }

    viewHistory(vehicleId) {
        if (typeof showToast !== 'undefined') {
            showToast(`View service history for vehicle ${vehicleId} - Feature coming soon!`, 'info');
        }
        console.log('View history for vehicle:', vehicleId);
    }

    /**
     * Export vehicles function - replaces the placeholder in vehicles.js
     * Add this method to the VehiclesModule class
     */

    exportVehicles() {
        if (!this.vehicles.length) {
            if (typeof showToast === 'function') {
                showToast('No vehicles to export', 'warning');
            }
            return;
        }

        // Define CSV headers
        const headers = [
            'Vehicle ID',
            'Make',
            'Model',
            'Year',
            'License Plate',
            'VIN',
            'Vehicle Type',
            'Mileage',
            'Customer ID',
            'Customer Name',
            'Customer Phone',
            'Customer Email',
            'Registration Date'
        ];

        // Map vehicle data to CSV rows
        const rows = this.vehicles.map(vehicle => [
            vehicle.id || '',
            vehicle.make || '',
            vehicle.model || '',
            vehicle.year || '',
            vehicle.license_plate || '',
            vehicle.vin || '',
            vehicle.vehicle_type || 'Car',
            vehicle.mileage || '',
            vehicle.customer_id || '',
            vehicle.customer_name || 'Unknown Owner',
            vehicle.customer_phone || '',
            vehicle.customer_email || '',
            vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : ''
        ]);

        // Create CSV content
        const csv = [headers, ...rows]
            .map(row => row.map(value => `"${value}"`).join(','))
            .join('\n');

        // Create and download the file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Generate timestamp for filename
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        const filename = `vehicles_export_${timestamp}.csv`;

        // Create download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up the URL object
        URL.revokeObjectURL(url);

        // Show success message
        if (typeof showToast === 'function') {
            showToast(`Exported ${this.vehicles.length} vehicles to ${filename}`, 'success');
        }

        console.log(`📤 Exported ${this.vehicles.length} vehicles to ${filename}`);
    }

    // Utility methods
    getVehicleIcon(make) {
        const icons = {
            'Toyota': '🚗', 'Honda': '🚗', 'Ford': '🚚', 'Chevrolet': '🚗',
            'BMW': '🏎️', 'Mercedes-Benz': '🏎️', 'Audi': '🏎️', 'Volkswagen': '🚗',
            'Jeep': '🚙', 'Ram': '🚚', 'GMC': '🚚'
        };
        return icons[make] || '🚗';
    }

    getVehicleColor(make) {
        const colors = {
            'Toyota': 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
            'Honda': 'linear-gradient(45deg, #74b9ff, #0984e3)',
            'Ford': 'linear-gradient(45deg, #a29bfe, #6c5ce7)',
            'Chevrolet': 'linear-gradient(45deg, #fd79a8, #e84393)',
            'BMW': 'linear-gradient(45deg, #2d3436, #636e72)',
            'Mercedes-Benz': 'linear-gradient(45deg, #b2bec3, #ddd)',
            'Default': 'linear-gradient(45deg, #667eea, #764ba2)'
        };
        return colors[make] || colors['Default'];
    }

    getUniqueMakes() {
        const makes = [...new Set(this.vehicles.map(v => v.make))];
        return makes.length;
    }

    getUniqueVehicleMakes() {
        return [...new Set(this.vehicles.map(v => v.make))].sort();
    }

    getAverageYear() {
        if (this.vehicles.length === 0) return 'N/A';
        const average = this.vehicles.reduce((sum, v) => sum + v.year, 0) / this.vehicles.length;
        return Math.round(average);
    }

    getAverageMileage() {
        if (this.vehicles.length === 0) return 'N/A';
        const vehicles = this.vehicles.filter(v => v.mileage);
        if (vehicles.length === 0) return 'N/A';

        const average = vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length;
        return Math.round(average).toLocaleString();
    }

    renderError(error) {
        const html = this.getErrorHTML(error);

        if (window.app) {
            window.app.setContent(html);
        }
    }
}

// Create global vehicles instance
window.Vehicles = new VehiclesModule();

// Also create the expected module reference
window.vehiclesModule = window.Vehicles;

console.log('✅ Vehicles module loaded successfully');