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
            <div class="vehicles-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🚗 Vehicle Management</h2>
                    <div class="action-bar-actions">
                        <button class="btn btn-outline" onclick="window.Vehicles.exportVehicles()">
                            📤 Export
                        </button>
                        <button class="btn btn-primary" onclick="window.Vehicles.showAddModal()">
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
                                        class="search-input"
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

    showAddModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add New Vehicle</h2>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Vehicles.submitVehicle(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Make</label>
                            <select name="make" class="form-input" required>
                                <option value="">Select make</option>
                                ${this.vehicleMakes.map(make => `<option value="${make}">${make}</option>`).join('')}
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
                                placeholder="2023"
                                min="1900"
                                max="${new Date().getFullYear() + 1}"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">License Plate</label>
                            <input
                                type="text"
                                name="license_plate"
                                class="form-input"
                                placeholder="ABC123"
                                style="text-transform: uppercase;"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Vehicle Owner</label>
                        <select name="customer_id" class="form-input" required>
                            <option value="">Select customer</option>
                            ${this.customers.map(customer =>
                                `<option value="${customer.id}">${customer.name} (ID: ${customer.id})</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">VIN (Vehicle Identification Number)</label>
                        <input
                            type="text"
                            name="vin"
                            class="form-input"
                            placeholder="1HGCM82633A123456"
                            maxlength="17"
                            style="text-transform: uppercase;"
                        >
                        <small class="form-help">17 characters</small>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            💾 Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (typeof showModal !== 'undefined') {
            showModal('Add Vehicle', modalContent);
        } else if (window.app) {
            window.app.showModal(modalContent);
        } else {
            console.log('Modal system not available');
        }
    }

    async submitVehicle(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const vehicleData = {
            make: formData.get('make').trim(),
            model: formData.get('model').trim(),
            year: parseInt(formData.get('year')),
            license_plate: formData.get('license_plate').trim().toUpperCase(),
            customer_id: parseInt(formData.get('customer_id')),
            vin: formData.get('vin').trim().toUpperCase()
        };

        // Validation
        if (!vehicleData.make || !vehicleData.model || !vehicleData.year || !vehicleData.customer_id) {
            if (typeof showToast !== 'undefined') {
                showToast('Please fill in all required fields', 'error');
            }
            return;
        }

        if (vehicleData.vin && vehicleData.vin.length !== 17) {
            if (typeof showToast !== 'undefined') {
                showToast('VIN must be exactly 17 characters', 'error');
            }
            return;
        }

        try {
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            if (response.ok) {
                const result = await response.json();

                if (typeof showToast !== 'undefined') {
                    showToast('✅ Vehicle added successfully!', 'success');
                }

                if (typeof closeModal !== 'undefined') {
                    closeModal();
                }

                // Refresh the vehicle list
                await this.loadVehicles();

                // If we're currently in the vehicles section, reload it
                if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                    window.olServiceApp.loadSection('vehicles');
                }

            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add vehicle');
            }

        } catch (error) {
            console.error('Failed to add vehicle:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`❌ ${error.message}`, 'error');
            }
        }
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

    exportVehicles() {
        if (typeof showToast !== 'undefined') {
            showToast('Export vehicles - Feature coming soon!', 'info');
        }
        console.log('Export vehicles');
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