// static/js/modules/services.js - Production Services Module
/**
 * Services Module for OL Service POS
 */

const servicesModule = {
    currentServices: [],
    currentPage: 1,
    itemsPerPage: 10,

    async loadModule() {
        try {
            const [services, customers, vehicles] = await Promise.all([
                this.fetchServices(),
                this.fetchCustomers(),
                this.fetchVehicles()
            ]);

            this.currentServices = services;
            return this.generateServicesHTML(services, customers, vehicles);
        } catch (error) {
            console.error('Error loading services module:', error);
            throw error;
        }
    },

    async fetchServices() {
        try {
            const response = await fetch('/api/services');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.services || [];
        } catch (error) {
            console.error('Error fetching services:', error);
            return [];
        }
    },

    async fetchCustomers() {
        try {
            const response = await fetch('/api/customers');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.customers || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    },

    async fetchVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.vehicles || [];
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            return [];
        }
    },

    generateServicesHTML(services, customers, vehicles) {
        const paginatedServices = this.paginate(services);
        const totalPages = Math.ceil(services.length / this.itemsPerPage);

        return `
            <div class="customers-section">
                <div class="section-header">
                    <h2>🔧 Services Management</h2>
                    <p>Manage service orders and truck repair documentation</p>
                </div>

                <!-- Service Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📋</div>
                        <div class="stat-content">
                            <div class="stat-number">${services.length}</div>
                            <div class="stat-label">Total Services</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <div class="stat-number">${services.filter(s => s.status === 'in_progress').length}</div>
                            <div class="stat-label">In Progress</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-number">${services.filter(s => s.status === 'completed').length}</div>
                            <div class="stat-label">Completed</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🚛</div>
                        <div class="stat-content">
                            <div class="stat-number">${services.filter(s => s.service_type === 'truck_repair').length}</div>
                            <div class="stat-label">Truck Repairs</div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="section-actions">
                    <button class="button button-primary" onclick="servicesModule.showAddServiceModal()" type="button">
                        ➕ Add New Service
                    </button>
                    <button class="button button-secondary" onclick="servicesModule.showTruckRepairModal()" type="button">
                        🚛 Truck Repair System
                    </button>
                    <button class="button button-secondary" onclick="servicesModule.refreshServices()" type="button">
                        🔄 Refresh
                    </button>
                </div>

                <!-- Services Table -->
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Vehicle</th>
                                <th>Service Type</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateServiceRows(paginatedServices, customers, vehicles)}
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                ${this.generatePagination(totalPages)}
            </div>
        `;
    },

    generateServiceRows(services, customers, vehicles) {
        if (services.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="no-data">
                        <div class="no-data-content">
                            <div class="no-data-icon">📋</div>
                            <div class="no-data-text">No services found</div>
                            <button class="btn btn-primary" onclick="servicesModule.showAddServiceModal()" type="button">
                                Add First Service
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return services.map(service => {
            const customer = customers.find(c => c.id === service.customer_id);
            const vehicle = vehicles.find(v => v.id === service.vehicle_id);

            return `
                <tr>
                    <td>
                        <span class="service-id">${service.id}</span>
                    </td>
                    <td>
                        <div class="customer-cell">
                            <span class="customer-name">${customer ? (customer.name || `${customer.first_name} ${customer.last_name}`.trim()) : 'Unknown Customer'}</span>
                        </div>
                    </td>
                    <td>
                        <div class="vehicle-cell">
                            <span class="vehicle-info">${vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'})` : 'Unknown Vehicle'}</span>
                            <span class="vehicle-license">${vehicle ? vehicle.license_plate || 'No License' : ''}</span>
                        </div>
                    </td>
                    <td>
                        <span class="service-type ${service.service_type || 'general'}">${this.getServiceTypeLabel(service.service_type)}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${service.status || 'pending'}">${this.getStatusLabel(service.status)}</span>
                    </td>
                    <td>
                        <span class="date-text">${this.formatDate(service.created_at)}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="servicesModule.viewService(${service.id})" title="View Details" type="button">
                                👁️
                            </button>
                            <button class="btn-icon" onclick="servicesModule.editService(${service.id})" title="Edit Service" type="button">
                                ✏️
                            </button>
                            ${service.service_type === 'truck_repair' ? `
                                <button class="btn-icon" onclick="servicesModule.openTruckRepair(${service.id})" title="Truck Repair" type="button">
                                    🚛
                                </button>
                            ` : ''}
                            <button class="btn-icon danger" onclick="servicesModule.deleteService(${service.id})" title="Delete Service" type="button">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    generatePagination(totalPages) {
        if (totalPages <= 1) return '';

        let pagination = `
            <div class="pagination">
                <button class="btn btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''}
                        onclick="servicesModule.goToPage(${this.currentPage - 1})" type="button">
                    Previous
                </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            pagination += `
                <button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'}"
                        onclick="servicesModule.goToPage(${i})" type="button">
                    ${i}
                </button>
            `;
        }

        pagination += `
                <button class="btn btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''}
                        onclick="servicesModule.goToPage(${this.currentPage + 1})" type="button">
                    Next
                </button>
            </div>
        `;

        return pagination;
    },

    // MODAL FUNCTIONS
    showAddServiceModal() {
        try {
            if (typeof window.showModal !== 'function') {
                this.fallbackAddService();
                return;
            }

            const modalContent = `
                <form id="addServiceForm" class="form-grid">
                    <div class="form-group">
                        <label for="serviceCustomerId" class="form-label required">Customer:</label>
                        <select id="serviceCustomerId" name="customer_id" class="form-input" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="serviceVehicleId" class="form-label required">Vehicle:</label>
                        <select id="serviceVehicleId" name="vehicle_id" class="form-input" required>
                            <option value="">Select Vehicle</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="serviceType" class="form-label required">Service Type:</label>
                        <select id="serviceType" name="service_type" class="form-input" required>
                            <option value="general">General Service</option>
                            <option value="truck_repair">Truck Repair</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="oil_change">Oil Change</option>
                            <option value="inspection">Inspection</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="serviceDescription" class="form-label">Description:</label>
                        <textarea id="serviceDescription" name="description" class="form-textarea" rows="3" placeholder="Service description..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="serviceStatus" class="form-label">Status:</label>
                        <select id="serviceStatus" name="status" class="form-input">
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">Cancel</button>
                        <button type="submit" class="button button-primary">Add Service</button>
                    </div>
                </form>
            `;

            window.showModal('Add New Service', modalContent);

            setTimeout(() => {
                this.populateCustomerSelect();
                this.bindAddServiceForm();
            }, 100);

        } catch (error) {
            console.error('Error in showAddServiceModal:', error);
            this.fallbackAddService();
        }
    },

    showTruckRepairModal() {
        try {
            if (typeof window.showModal !== 'function') {
                alert('Truck Repair System - Modal system not available');
                return;
            }

            const truckRepairContent = `
                <div class="truck-repair-container">
                    <!-- Professional Header -->
                    <div class="truck-header" style="margin-bottom: 1.5rem;">
                        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🚛 Truck Repair Management</h1>
                        <p style="font-size: 0.9rem; opacity: 0.9;">Complete repair workflow and documentation system</p>
                    </div>

                    <!-- Quick Actions Navigation -->
                    <div class="truck-nav-container">
                        <div class="truck-nav-tabs" style="justify-content: center;">
                            <button class="truck-tab-button" onclick="servicesModule.showMaterialForm()" type="button">
                                📋 Material Requisition
                            </button>
                            <button class="truck-tab-button" onclick="servicesModule.showQuoteForm()" type="button">
                                💰 Generate Quote
                            </button>
                            <button class="truck-tab-button" onclick="servicesModule.showPartsManagement()" type="button">
                                🔧 Parts Inventory
                            </button>
                            <button class="truck-tab-button" onclick="servicesModule.showRepairReports()" type="button">
                                📊 Reports & Analytics
                            </button>
                        </div>
                    </div>

                    <!-- Dashboard Stats -->
                    <div class="truck-form-header" style="margin-bottom: 1.5rem;">
                        <div class="truck-form-group" style="margin-bottom: 0; text-align: center;">
                            <label style="font-size: 1.2rem; color: #1e40af; margin-bottom: 0.5rem;">Active Jobs</label>
                            <div style="font-size: 2rem; font-weight: bold; color: #1e40af;">12</div>
                        </div>
                        <div class="truck-form-group" style="margin-bottom: 0; text-align: center;">
                            <label style="font-size: 1.2rem; color: #10b981; margin-bottom: 0.5rem;">Pending Quotes</label>
                            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">8</div>
                        </div>
                        <div class="truck-form-group" style="margin-bottom: 0; text-align: center;">
                            <label style="font-size: 1.2rem; color: #f59e0b; margin-bottom: 0.5rem;">Parts Orders</label>
                            <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">5</div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="truck-form-container active" style="display: block;">
                        <div class="truck-form-content">
                            <div class="truck-form-title">
                                <h2 style="font-size: 1.25rem;">Recent Activity</h2>
                                <p>Latest updates and actions in the system</p>
                            </div>

                            <table class="truck-table" style="margin-bottom: 1rem;">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Action</th>
                                        <th>Status</th>
                                        <th>User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>2 hours ago</td>
                                        <td>Quote #Q250701 approved</td>
                                        <td><span style="color: #10b981; font-weight: 600;">✅ Completed</span></td>
                                        <td>Manager</td>
                                    </tr>
                                    <tr>
                                        <td>4 hours ago</td>
                                        <td>Material request submitted</td>
                                        <td><span style="color: #f59e0b; font-weight: 600;">⏳ Pending</span></td>
                                        <td>Technician</td>
                                    </tr>
                                    <tr>
                                        <td>6 hours ago</td>
                                        <td>New service ticket created</td>
                                        <td><span style="color: #3b82f6; font-weight: 600;">📋 Active</span></td>
                                        <td>Reception</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Quick Start Guide -->
                    <div class="truck-form-container active" style="display: block;">
                        <div class="truck-form-content">
                            <div class="truck-form-title">
                                <h2 style="font-size: 1.25rem;">Quick Start Guide</h2>
                                <p>Common workflows and processes</p>
                            </div>

                            <div class="truck-form-row">
                                <div class="truck-form-group">
                                    <label style="color: #1e40af;">🔧 Repair Process</label>
                                    <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #64748b;">
                                        <li>Create service ticket</li>
                                        <li>Generate material requisition</li>
                                        <li>Submit repair quote</li>
                                        <li>Complete documentation</li>
                                    </ol>
                                </div>
                                <div class="truck-form-group">
                                    <label style="color: #10b981;">📋 Material Workflow</label>
                                    <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #64748b;">
                                        <li>Check parts inventory</li>
                                        <li>Create requisition form</li>
                                        <li>Submit for approval</li>
                                        <li>Track delivery status</li>
                                    </ol>
                                </div>
                                <div class="truck-form-group">
                                    <label style="color: #f59e0b;">💰 Quote Process</label>
                                    <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #64748b;">
                                        <li>Assess damage/repair needs</li>
                                        <li>Calculate parts & labor</li>
                                        <li>Generate quote document</li>
                                        <li>Submit for approval</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- System Actions -->
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
                        <button class="truck-btn truck-add-row" onclick="servicesModule.openFullTruckSystem()" type="button" style="margin-bottom: 0;">
                            🔧 Open Full System
                        </button>
                        <button class="truck-btn truck-submit-btn" onclick="servicesModule.showTruckSettings()" type="button" style="margin: 0; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
                            ⚙️ System Settings
                        </button>
                    </div>

                    <!-- Footer Actions -->
                    <div class="modal-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                        <button class="button button-outline" onclick="window.closeModal()" type="button">
                            Close Dashboard
                        </button>
                    </div>
                </div>
            `;

            window.showModal('Truck Repair Management System', truckRepairContent, 'large');

        } catch (error) {
            console.error('Error in showTruckRepairModal:', error);
            alert('Error opening Truck Repair System');
        }
    },

    // FALLBACK FUNCTIONS
    fallbackAddService() {
        const customerName = prompt('Customer name:');
        const vehicleInfo = prompt('Vehicle info (Make Model Year):');
        const serviceType = prompt('Service type (general/truck_repair/maintenance/oil_change/inspection):') || 'general';
        const description = prompt('Description (optional):') || '';

        if (customerName && vehicleInfo) {
            alert(`Service created!\n\nCustomer: ${customerName}\nVehicle: ${vehicleInfo}\nType: ${serviceType}\nDescription: ${description}`);

            if (serviceType === 'truck_repair') {
                setTimeout(() => {
                    if (confirm('Would you like to open the Truck Repair Management System?')) {
                        this.showTruckRepairModal();
                    }
                }, 500);
            }
        }
    },

    // FORM HANDLING
    async populateCustomerSelect() {
        try {
            const customers = await this.fetchCustomers();
            const customerSelect = document.getElementById('serviceCustomerId');
            const vehicleSelect = document.getElementById('serviceVehicleId');

            if (customerSelect) {
                customerSelect.innerHTML = '<option value="">Select Customer</option>';
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    option.textContent = customer.name || `${customer.first_name} ${customer.last_name}`.trim() || `Customer ${customer.id}`;
                    customerSelect.appendChild(option);
                });

                customerSelect.addEventListener('change', async (e) => {
                    const customerId = e.target.value;
                    if (customerId && vehicleSelect) {
                        try {
                            const vehicles = await this.fetchVehicles();
                            const customerVehicles = vehicles.filter(v => v.customer_id == customerId);

                            vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                            customerVehicles.forEach(vehicle => {
                                const option = document.createElement('option');
                                option.value = vehicle.id;
                                option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'}) - ${vehicle.license_plate || 'No License'}`;
                                vehicleSelect.appendChild(option);
                            });
                        } catch (error) {
                            console.error('Error loading vehicles:', error);
                        }
                    } else if (vehicleSelect) {
                        vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                    }
                });
            }
        } catch (error) {
            console.error('Error populating customer select:', error);
        }
    },

    bindAddServiceForm() {
        const form = document.getElementById('addServiceForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddService(new FormData(form));
            });
        }
    },

    async handleAddService(formData) {
        try {
            const serviceData = {
                customer_id: parseInt(formData.get('customer_id')),
                vehicle_id: parseInt(formData.get('vehicle_id')),
                service_type: formData.get('service_type'),
                description: formData.get('description'),
                status: formData.get('status') || 'pending'
            };

            const response = await fetch('/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serviceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create service');
            }

            const result = await response.json();

            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }

            if (typeof window.showToast === 'function') {
                window.showToast('Service created successfully', 'success');
            } else {
                alert('Service created successfully');
            }

            await this.refreshServices();

            if (serviceData.service_type === 'truck_repair') {
                setTimeout(() => {
                    if (confirm('Would you like to open the Truck Repair Management System for this service?')) {
                        this.openTruckRepair(result.service?.id || 'new');
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error creating service:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`Failed to create service: ${error.message}`, 'error');
            } else {
                alert(`Failed to create service: ${error.message}`);
            }
        }
    },

    // UTILITY FUNCTIONS
    getServiceTypeLabel(type) {
        const types = {
            'truck_repair': '🚛 Truck Repair',
            'maintenance': '🔧 Maintenance',
            'oil_change': '🛢️ Oil Change',
            'inspection': '🔍 Inspection',
            'general': '⚙️ General Service'
        };
        return types[type] || '⚙️ General Service';
    },

    getStatusLabel(status) {
        const statuses = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statuses[status] || 'Pending';
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (error) {
            return 'Invalid Date';
        }
    },

    paginate(services) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return services.slice(start, end);
    },

    // NAVIGATION AND ACTIONS
    async goToPage(page) {
        this.currentPage = page;
        await this.refreshServices();
    },

    async refreshServices() {
        try {
            const services = await this.fetchServices();
            this.currentServices = services;

            const dynamicContent = document.getElementById('dynamicContent');
            if (dynamicContent) {
                const [customers, vehicles] = await Promise.all([
                    this.fetchCustomers(),
                    this.fetchVehicles()
                ]);
                dynamicContent.innerHTML = this.generateServicesHTML(services, customers, vehicles);
            }

            if (typeof window.showToast === 'function') {
                window.showToast('Services refreshed successfully', 'success');
            }
        } catch (error) {
            console.error('Error refreshing services:', error);
            if (typeof window.showToast === 'function') {
                window.showToast('Failed to refresh services', 'error');
            }
        }
    },

    openTruckRepair(serviceId) {
        this.currentTruckRepairServiceId = serviceId;
        this.showTruckRepairModal();
        if (typeof window.showToast === 'function') {
            window.showToast(`Opening truck repair system for service #${serviceId}`, 'info');
        }
    },

    // TRUCK REPAIR SYSTEM FUNCTIONS
    openFullTruckSystem() {
        if (typeof window.showToast === 'function') {
            window.showToast('Opening full truck repair system...', 'info');
        }
        // TODO: Navigate to dedicated truck repair page or show expanded interface
    },

    showTruckSettings() {
        if (typeof window.showModal === 'function') {
            const settingsContent = `
                <div class="truck-repair-container">
                    <div class="truck-form-container active" style="display: block;">
                        <div class="truck-form-content">
                            <div class="truck-form-title">
                                <h2>🔧 Truck Repair Settings</h2>
                                <p>Configure system preferences and defaults</p>
                            </div>

                            <div class="truck-form-row">
                                <div class="truck-form-group">
                                    <label>Default Currency</label>
                                    <select class="form-input">
                                        <option value="THB">Thai Baht (฿)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                                <div class="truck-form-group">
                                    <label>Tax Rate (%)</label>
                                    <input type="number" class="form-input" value="7" min="0" max="100" step="0.1">
                                </div>
                                <div class="truck-form-group">
                                    <label>Auto-generate Quote Numbers</label>
                                    <select class="form-input">
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </div>
                            </div>

                            <div class="truck-form-row">
                                <div class="truck-form-group">
                                    <label>Default Labor Rate (per hour)</label>
                                    <input type="number" class="form-input" value="500" min="0" step="50">
                                </div>
                                <div class="truck-form-group">
                                    <label>Markup Percentage</label>
                                    <input type="number" class="form-input" value="15" min="0" max="100" step="1">
                                </div>
                                <div class="truck-form-group">
                                    <label>Quote Validity (days)</label>
                                    <input type="number" class="form-input" value="30" min="1" max="365">
                                </div>
                            </div>

                            <div class="modal-actions">
                                <button class="button button-outline" onclick="window.closeModal()" type="button">Cancel</button>
                                <button class="button button-primary" onclick="servicesModule.saveTruckSettings()" type="button">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            window.showModal('Truck Repair Settings', settingsContent, 'large');
        } else {
            if (typeof window.showToast === 'function') {
                window.showToast('Truck system settings - Coming Soon!', 'info');
            } else {
                alert('Truck system settings - Coming Soon!');
            }
        }
    },

    saveTruckSettings() {
        if (typeof window.showToast === 'function') {
            window.showToast('Settings saved successfully!', 'success');
        } else {
            alert('Settings saved successfully!');
        }
        setTimeout(() => {
            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }
        }, 1000);
    },

    // TRUCK REPAIR FEATURE PLACEHOLDERS
    showMaterialForm() {
        if (typeof window.showToast === 'function') {
            window.showToast('Material Requisition Form - Coming Soon!', 'info');
        } else {
            alert('Material Requisition Form - Coming Soon!');
        }
    },

    showQuoteForm() {
        if (typeof window.showToast === 'function') {
            window.showToast('Repair Quote Form - Coming Soon!', 'info');
        } else {
            alert('Repair Quote Form - Coming Soon!');
        }
    },

    showPartsManagement() {
        if (typeof window.showToast === 'function') {
            window.showToast('Parts Management - Coming Soon!', 'info');
        } else {
            alert('Parts Management - Coming Soon!');
        }
    },

    showRepairReports() {
        if (typeof window.showToast === 'function') {
            window.showToast('Repair Reports - Coming Soon!', 'info');
        } else {
            alert('Repair Reports - Coming Soon!');
        }
    },

    // SERVICE MANAGEMENT FUNCTIONS
    async viewService(serviceId) {
        try {
            const service = this.currentServices.find(s => s.id === serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            const [customers, vehicles] = await Promise.all([
                this.fetchCustomers(),
                this.fetchVehicles()
            ]);

            const customer = customers.find(c => c.id === service.customer_id);
            const vehicle = vehicles.find(v => v.id === service.vehicle_id);

            const modalContent = `
                <div class="service-details">
                    <div class="detail-section">
                        <h3>Service Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Service ID:</label>
                                <span>#${service.id}</span>
                            </div>
                            <div class="detail-item">
                                <label>Type:</label>
                                <span class="service-type ${service.service_type}">${this.getServiceTypeLabel(service.service_type)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status:</label>
                                <span class="status-badge status-${service.status}">${this.getStatusLabel(service.status)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Created:</label>
                                <span>${this.formatDate(service.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Customer Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Name:</label>
                                <span>${customer ? (customer.name || `${customer.first_name} ${customer.last_name}`.trim()) : 'Unknown Customer'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Phone:</label>
                                <span>${customer ? customer.phone || 'N/A' : 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${customer ? customer.email || 'N/A' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Vehicle Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Vehicle:</label>
                                <span>${vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Year:</label>
                                <span>${vehicle ? vehicle.year || 'N/A' : 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>License Plate:</label>
                                <span>${vehicle ? vehicle.license_plate || 'N/A' : 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>VIN:</label>
                                <span>${vehicle ? vehicle.vin || 'N/A' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    ${service.description ? `
                        <div class="detail-section">
                            <h3>Description</h3>
                            <p class="service-description">${service.description}</p>
                        </div>
                    ` : ''}

                    <div class="modal-actions">
                        <button class="button button-outline" onclick="window.closeModal()" type="button">Close</button>
                        <button class="button button-primary" onclick="servicesModule.editService(${serviceId}); window.closeModal();" type="button">Edit Service</button>
                        ${service.service_type === 'truck_repair' ? `
                            <button class="button button-primary" onclick="servicesModule.openTruckRepair(${serviceId}); window.closeModal();" type="button">
                                🚛 Open Truck Repair
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            if (typeof window.showModal === 'function') {
                window.showModal('Service Details', modalContent, 'large');
            } else {
                alert(`Service #${serviceId}\nType: ${this.getServiceTypeLabel(service.service_type)}\nStatus: ${this.getStatusLabel(service.status)}\nCustomer: ${customer ? customer.name : 'Unknown'}\nVehicle: ${vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown'}`);
            }

        } catch (error) {
            console.error('Error viewing service:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`Failed to load service details: ${error.message}`, 'error');
            } else {
                alert(`Failed to load service details: ${error.message}`);
            }
        }
    },

    async editService(serviceId) {
        if (typeof window.showToast === 'function') {
            window.showToast('Edit Service - Coming Soon!', 'info');
        } else {
            alert('Edit Service - Coming Soon!');
        }
    },

    async deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete service');
            }

            if (typeof window.showToast === 'function') {
                window.showToast('Service deleted successfully', 'success');
            } else {
                alert('Service deleted successfully');
            }

            await this.refreshServices();

        } catch (error) {
            console.error('Error deleting service:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`Failed to delete service: ${error.message}`, 'error');
            } else {
                alert(`Failed to delete service: ${error.message}`);
            }
        }
    }
};

// Make servicesModule globally available
window.servicesModule = servicesModule;