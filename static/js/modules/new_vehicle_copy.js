// static/js/modules/vehicles.js - Vehicle Management Module

class VehiclesModule {
    constructor() {
        this.vehicles = [];
        this.customers = [];
        this.isLoading = false;
    }

    async loadModule() {
        try {
            await this.loadVehicles();
            await this.loadCustomers();
            return this.getHTML();
        } catch (error) {
            console.error('Failed to load vehicles module:', error);
            return `<div class="error-container">Error: ${error.message}</div>`;
        }
    }

    getHTML() {
        return `
            <div class="customers-section">
                <div class="action-bar">
                    <h2 class="action-bar-title">🚗 Vehicle Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-primary" onclick="window.vehiclesModule.showAddModal()">➕ Add Vehicle</button>
                    </div>
                </div>
                <div class="data-table-container">
                    <div class="data-table-content" id="vehicle-table-content">
                        ${this.renderVehicleTable()}
                    </div>
                </div>
            </div>
        `;
    }

    async loadVehicles() {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        this.vehicles = data.vehicles || [];
    }

    async loadCustomers() {
        const response = await fetch('/api/customers');
        const data = await response.json();
        this.customers = data.customers || [];
    }
    
    refreshUI() {
        const content = document.getElementById('vehicle-table-content');
        if (content) {
            content.innerHTML = this.renderVehicleTable();
        }
    }

    renderVehicleTable() {
        if (this.vehicles.length === 0) {
            return `<div class="empty-state"><p>No vehicles found. Add one to get started!</p></div>`;
        }
        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Vehicle</th>
                        <th>Owner</th>
                        <th>License Plate</th>
                        <th>VIN</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.vehicles.map(v => this.renderVehicleRow(v)).join('')}
                </tbody>
            </table>
        `;
    }

    renderVehicleRow(vehicle) {
        return `
            <tr>
                <td>${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}</td>
                <td>${vehicle.customer_name || 'N/A'}</td>
                <td>${vehicle.license_plate || 'N/A'}</td>
                <td>${vehicle.vin || 'N/A'}</td>
                <td>
                    <button class="btn-icon" onclick="window.vehiclesModule.viewVehicle(${vehicle.id})">👁️</button>
                    <button class="btn-icon" onclick="window.vehiclesModule.showEditModal(${vehicle.id})">✏️</button>
                </td>
            </tr>
        `;
    }

    showAddModal() {
        if (!this.customers || this.customers.length === 0) {
            return window.showToast('Please add customers before adding vehicles.', 'warning');
        }
        const modalContent = this.generateFormHTML();
        window.showModal('➕ Add New Vehicle', modalContent, 'large');
    }

    async showEditModal(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            return window.showToast('Vehicle not found.', 'error');
        }
        const modalContent = this.generateFormHTML(vehicle);
        window.showModal(`✏️ Edit Vehicle #${vehicle.id}`, modalContent, 'large');
    }

    generateFormHTML(vehicle = {}) {
        const isEdit = !!vehicle.id;
        const currentYear = new Date().getFullYear();
        const customerOptions = this.customers.map(c => `<option value="${c.id}" ${vehicle.customer_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');

        return `
            <form id="vehicleForm" onsubmit="window.vehiclesModule.handleFormSubmit(event, ${isEdit ? vehicle.id : 'null'})">
                <div class="form-section">
                    <h3 class="form-section-title">Vehicle Information</h3>
                    <div class="form-grid-2col">
                        <div class="form-group"><label>Make</label><input name="make" class="form-input" value="${vehicle.make || ''}" required></div>
                        <div class="form-group"><label>Model</label><input name="model" class="form-input" value="${vehicle.model || ''}" required></div>
                        <div class="form-group"><label>Year</label><input type="number" name="year" class="form-input" value="${vehicle.year || ''}" min="1900" max="${currentYear + 2}" required></div>
                        <div class="form-group"><label>License Plate</label><input name="license_plate" class="form-input" value="${vehicle.license_plate || ''}"></div>
                        <div class="form-group full-width"><label>VIN</label><input name="vin" class="form-input" value="${vehicle.vin || ''}" maxlength="17"></div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">🛡️ Insurance Information</h3>
                    <div class="form-grid-2col">
                        <div class="form-group"><label>Insurance Company</label><input name="insurance_company" class="form-input" value="${vehicle.insurance_company || ''}"></div>
                        <div class="form-group"><label>Policy Number</label><input name="insurance_policy_number" class="form-input" value="${vehicle.insurance_policy_number || ''}"></div>
                        <div class="form-group">
                            <label>Insurance Class</label>
                            <select name="insurance_class" class="form-input">
                                <option value="">Select Class</option>
                                <option value="1" ${vehicle.insurance_class == 1 ? 'selected' : ''}>Class 1 - Full Coverage</option>
                                <option value="2" ${vehicle.insurance_class == 2 ? 'selected' : ''}>Class 2</option>
                                <option value="3" ${vehicle.insurance_class == 3 ? 'selected' : ''}>Class 3 - Liability Only</option>
                                <option value="4" ${vehicle.insurance_class == 4 ? 'selected' : ''}>Class 4</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Expiration Date</label><input type="date" name="insurance_expiration_date" class="form-input" value="${vehicle.insurance_expiration_date || ''}"></div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Owner Information</h3>
                    <div class="form-group">
                        <label>Vehicle Owner</label>
                        <select name="customer_id" class="form-input" required>${customerOptions}</select>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="button button-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="button button-primary">💾 Save Vehicle</button>
                </div>
            </form>
        `;
    }

    async handleFormSubmit(event, vehicleId) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '⏳ Saving...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const isEdit = vehicleId !== null;
        const url = isEdit ? `/api/vehicles/${vehicleId}` : '/api/vehicles';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} vehicle`);
            }
            
            await this.loadVehicles();
            this.refreshUI();
            window.closeModal();
            window.showToast(`✅ Vehicle ${isEdit ? 'updated' : 'added'} successfully!`, 'success');

        } catch (error) {
            window.showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    viewVehicle(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        const modalContent = `
            <div class="service-details">
                <div class="detail-section">
                    <h3>Vehicle Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item"><label>Vehicle:</label><span>${vehicle.year} ${vehicle.make} ${vehicle.model}</span></div>
                        <div class="detail-item"><label>Owner:</label><span>${vehicle.customer_name || 'N/A'}</span></div>
                        <div class="detail-item"><label>VIN:</label><span>${vehicle.vin || 'N/A'}</span></div>
                        <div class="detail-item"><label>License:</label><span>${vehicle.license_plate || 'N/A'}</span></div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>🛡️ Insurance Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item"><label>Company:</label><span>${vehicle.insurance_company || 'N/A'}</span></div>
                        <div class="detail-item"><label>Policy #:</label><span>${vehicle.insurance_policy_number || 'N/A'}</span></div>
                        <div class="detail-item"><label>Class:</label><span>${vehicle.insurance_class ? `Class ${vehicle.insurance_class}` : 'N/A'}</span></div>
                        <div class="detail-item"><label>Expires:</label><span>${vehicle.insurance_expiration_date || 'N/A'}</span></div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="button button-outline" onclick="window.closeModal()">Close</button>
                </div>
            </div>`;
        window.showModal('Vehicle Details', modalContent, 'large');
    }
}

// Initialize the module
window.vehiclesModule = new VehiclesModule();
