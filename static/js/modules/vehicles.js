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

    async loadVehicles() {
        try {
            // For now, we'll use mock data. Replace with actual API call
            this.vehicles = [
                {
                    id: 1,
                    vin: '1HGCM82633A123456',
                    make: 'Toyota',
                    model: 'Camry',
                    year: 2020,
                    color: 'Silver',
                    license_plate: 'ABC123',
                    customer_id: 1,
                    customer_name: 'John Doe',
                    mileage: 45000,
                    type: 'Car',
                    registration_date: '2023-01-15'
                },
                {
                    id: 2,
                    vin: '2T1BURHE5FC123789',
                    make: 'Ford',
                    model: 'F-150',
                    year: 2019,
                    color: 'Blue',
                    license_plate: 'XYZ789',
                    customer_id: 2,
                    customer_name: 'Jane Smith',
                    mileage: 62000,
                    type: 'Truck',
                    registration_date: '2023-02-20'
                }
            ];
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
        const html = `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🚗 Vehicle Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="Vehicles.exportVehicles()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="Vehicles.showAddModal()">
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
                <div class="data-table">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Vehicle Directory</h3>
                        <div class="data-table-actions">
                            <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                                <select class="form-input" style="width: auto; min-width: 120px;" onchange="Vehicles.filterByType(this.value)">
                                    <option value="">All Types</option>
                                    ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                                <select class="form-input" style="width: auto; min-width: 120px;" onchange="Vehicles.filterByMake(this.value)">
                                    <option value="">All Makes</option>
                                    ${this.getUniqueVehicleMakes().map(make => `<option value="${make}">${make}</option>`).join('')}
                                </select>
                                <div class="data-table-search">
                                    <input
                                        type="text"
                                        placeholder="Search vehicles..."
                                        class="form-input"
                                        oninput="Vehicles.filterVehicles(this.value)"
                                    >
                                    <span class="data-table-search-icon">🔍</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderVehicleTable()}
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

    renderVehicleTable() {
        if (this.vehicles.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <table>
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
        `;
    }

    renderVehicleRow(vehicle) {
        const registrationDate = vehicle.registration_date ?
            new Date(vehicle.registration_date).toLocaleDateString() : 'Unknown';

        return `
            <tr onclick="Vehicles.viewVehicle(${vehicle.id})" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <div class="avatar avatar-md" style="background: ${this.getVehicleColor(vehicle.type)}">
                            ${this.getVehicleIcon(vehicle.type)}
                        </div>
                        <div class="customer-details">
                            <div class="customer-name">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                            <div class="customer-id">
                                ${vehicle.license_plate ? `🚗 ${vehicle.license_plate}` : ''}
                                ${vehicle.color ? `• ${vehicle.color}` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <div><strong>${vehicle.customer_name || 'Unknown Owner'}</strong></div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">Customer ID: ${vehicle.customer_id}</div>
                    </div>
                </td>
                <td>
                    <div>
                        <div><strong>Type:</strong> ${vehicle.type}</div>
                        <div><strong>VIN:</strong> ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">Added: ${registrationDate}</div>
                    </div>
                </td>
                <td>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 600;">${vehicle.mileage?.toLocaleString() || 'N/A'}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">miles</div>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); Vehicles.editVehicle(${vehicle.id})"
                        >
                            ✏️ Edit
                        </button>
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); Vehicles.viewHistory(${vehicle.id})"
                        >
                            📋 History
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
                <button class="button button-primary" onclick="Vehicles.showAddModal()">
                    ➕ Add First Vehicle
                </button>
            </div>
        `;
    }

    showAddModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add New Vehicle</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="Vehicles.submitVehicle(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
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
                            <label class="form-label required">Type</label>
                            <select name="type" class="form-input" required>
                                <option value="">Select type</option>
                                ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <input
                                type="text"
                                name="color"
                                class="form-input"
                                placeholder="Silver"
                            >
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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

                        <div class="form-group">
                            <label class="form-label">Mileage</label>
                            <input
                                type="number"
                                name="mileage"
                                class="form-input"
                                placeholder="50000"
                                min="0"
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
                        <small style="color: #7f8c8d; font-size: 0.8rem;">17 characters</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea
                            name="notes"
                            class="form-textarea"
                            placeholder="Additional vehicle information..."
                            rows="3"
                        ></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="app.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (window.app) {
            window.app.showModal(modalContent);
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
            type: formData.get('type').trim(),
            color: formData.get('color').trim(),
            license_plate: formData.get('license_plate').trim().toUpperCase(),
            mileage: parseInt(formData.get('mileage')) || 0,
            customer_id: parseInt(formData.get('customer_id')),
            vin: formData.get('vin').trim().toUpperCase(),
            notes: formData.get('notes').trim()
        };

        // Validation
        if (!vehicleData.make || !vehicleData.model || !vehicleData.year || !vehicleData.type || !vehicleData.customer_id) {
            window.app?.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (vehicleData.vin && vehicleData.vin.length !== 17) {
            window.app?.showToast('VIN must be exactly 17 characters', 'error');
            return;
        }

        try {
            // For now, we'll add to local array. Replace with actual API call
            const newVehicle = {
                ...vehicleData,
                id: Date.now(),
                customer_name: this.customers.find(c => c.id === vehicleData.customer_id)?.name || 'Unknown',
                registration_date: new Date().toISOString()
            };

            this.vehicles.push(newVehicle);

            window.app?.showToast('✅ Vehicle added successfully!', 'success');
            window.app?.closeModal();
            await this.load();

        } catch (error) {
            console.error('Failed to add vehicle:', error);
            window.app?.showToast(`❌ ${error.message}`, 'error');
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
        window.app?.showToast(`View vehicle ${vehicleId} details - Feature coming soon!`, 'info');
    }

    editVehicle(vehicleId) {
        window.app?.showToast(`Edit vehicle ${vehicleId} - Feature coming soon!`, 'info');
    }

    viewHistory(vehicleId) {
        window.app?.showToast(`View service history for vehicle ${vehicleId} - Feature coming soon!`, 'info');
    }

    exportVehicles() {
        window.app?.showToast('Export vehicles - Feature coming soon!', 'info');
    }

    // Utility methods
    getVehicleIcon(type) {
        const icons = {
            'Car': '🚗',
            'Truck': '🚚',
            'Van': '🚐',
            'SUV': '🚙',
            'Motorcycle': '🏍️',
            'Bus': '🚌',
            'Trailer': '🚛',
            'RV': '🚐'
        };
        return icons[type] || '🚗';
    }

    getVehicleColor(type) {
        const colors = {
            'Car': 'linear-gradient(45deg, #4CAF50, #66BB6A)',
            'Truck': 'linear-gradient(45deg, #FF9800, #FFB74D)',
            'Van': 'linear-gradient(45deg, #2196F3, #64B5F6)',
            'SUV': 'linear-gradient(45deg, #9C27B0, #BA68C8)',
            'Motorcycle': 'linear-gradient(45deg, #F44336, #EF5350)',
            'Bus': 'linear-gradient(45deg, #607D8B, #90A4AE)',
            'Trailer': 'linear-gradient(45deg, #795548, #A1887F)',
            'RV': 'linear-gradient(45deg, #3F51B5, #7986CB)'
        };
        return colors[type] || 'linear-gradient(45deg, #667eea, #764ba2)';
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
        const html = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Vehicles</h2>
                <p class="error-message">${error.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="button button-primary" onclick="Vehicles.load()">
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
}

// Create global vehicles instance
window.Vehicles = new VehiclesModule();