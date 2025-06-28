// static/js/modules/services.js - Updated with Truck Repair Integration
/**
 * Services Module with Truck Repair Management Integration
 * Enhanced OL Service POS
 */

const servicesModule = {
    currentServices: [],
    currentPage: 1,
    itemsPerPage: 10,

    async loadModule() {
        console.log('📄 Loading services module...');
        try {
            const [services, customers, vehicles] = await Promise.all([
                this.fetchServices(),
                this.fetchCustomers(),
                this.fetchVehicles()
            ]);

            this.currentServices = services;

            return this.generateServicesHTML(services, customers, vehicles);
        } catch (error) {
            console.error('❌ Error loading services module:', error);
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
            console.error('❌ Error fetching services:', error);
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
            console.error('❌ Error fetching customers:', error);
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
            console.error('❌ Error fetching vehicles:', error);
            return [];
        }
    },

    generateServicesHTML(services, customers, vehicles) {
        const paginatedServices = this.paginate(services);
        const totalPages = Math.ceil(services.length / this.itemsPerPage);

        return `
            <div class="section-content">
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
                    <button class="btn btn-primary" onclick="servicesModule.showAddServiceModal()">
                        <span class="btn-icon">➕</span>
                        Add New Service
                    </button>
                    <button class="btn btn-secondary" onclick="servicesModule.showTruckRepairModal()">
                        <span class="btn-icon">🚛</span>
                        Truck Repair System
                    </button>
                    <button class="btn btn-secondary" onclick="servicesModule.refreshServices()">
                        <span class="btn-icon">🔄</span>
                        Refresh
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
                            <button class="btn btn-primary" onclick="servicesModule.showAddServiceModal()">
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
                            <span class="customer-name">${customer ? customer.name : 'Unknown Customer'}</span>
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
                        <span class="date-text">${formatDate(service.created_at)}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="servicesModule.viewService(${service.id})" title="View Details">
                                👁️
                            </button>
                            <button class="btn-icon" onclick="servicesModule.editService(${service.id})" title="Edit Service">
                                ✏️
                            </button>
                            ${service.service_type === 'truck_repair' ? `
                                <button class="btn-icon" onclick="servicesModule.openTruckRepair(${service.id})" title="Truck Repair">
                                    🚛
                                </button>
                            ` : ''}
                            <button class="btn-icon danger" onclick="servicesModule.deleteService(${service.id})" title="Delete Service">
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
                        onclick="servicesModule.goToPage(${this.currentPage - 1})">
                    Previous
                </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            pagination += `
                <button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'}"
                        onclick="servicesModule.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        pagination += `
                <button class="btn btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''}
                        onclick="servicesModule.goToPage(${this.currentPage + 1})">
                    Next
                </button>
            </div>
        `;

        return pagination;
    },

    paginate(services) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return services.slice(start, end);
    },

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

    async goToPage(page) {
        this.currentPage = page;
        await this.refreshServices();
    },

    async refreshServices() {
        try {
            const services = await this.fetchServices();
            this.currentServices = services;

            // Re-render the content
            const dynamicContent = document.getElementById('dynamicContent');
            if (dynamicContent) {
                const [customers, vehicles] = await Promise.all([
                    this.fetchCustomers(),
                    this.fetchVehicles()
                ]);
                dynamicContent.innerHTML = this.generateServicesHTML(services, customers, vehicles);
            }

            if (typeof showToast !== 'undefined') {
                showToast('Services refreshed successfully', 'success');
            }
        } catch (error) {
            console.error('❌ Error refreshing services:', error);
            if (typeof showToast !== 'undefined') {
                showToast('Failed to refresh services', 'error');
            }
        }
    },

    showAddServiceModal() {
        const modalContent = `
            <form id="addServiceForm" class="form-grid">
                <div class="form-group">
                    <label for="serviceCustomerId">Customer:</label>
                    <select id="serviceCustomerId" name="customer_id" required>
                        <option value="">Select Customer</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="serviceVehicleId">Vehicle:</label>
                    <select id="serviceVehicleId" name="vehicle_id" required>
                        <option value="">Select Vehicle</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="serviceType">Service Type:</label>
                    <select id="serviceType" name="service_type" required>
                        <option value="general">General Service</option>
                        <option value="truck_repair">Truck Repair</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="oil_change">Oil Change</option>
                        <option value="inspection">Inspection</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="serviceDescription">Description:</label>
                    <textarea id="serviceDescription" name="description" rows="3" placeholder="Service description..."></textarea>
                </div>

                <div class="form-group">
                    <label for="serviceStatus">Status:</label>
                    <select id="serviceStatus" name="status">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Service</button>
                </div>
            </form>
        `;

        if (typeof showModal !== 'undefined') {
            showModal('Add New Service', modalContent);
            this.populateCustomerSelect();
            this.bindAddServiceForm();
        }
    },

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
                    option.textContent = customer.name;
                    customerSelect.appendChild(option);
                });

                // Bind customer change event
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

            if (typeof closeModal !== 'undefined') {
                closeModal();
            }

            if (typeof showToast !== 'undefined') {
                showToast('Service created successfully', 'success');
            }

            // Refresh the services list
            await this.refreshServices();

            // If it's a truck repair service, offer to open truck repair system
            if (serviceData.service_type === 'truck_repair') {
                setTimeout(() => {
                    if (confirm('Would you like to open the Truck Repair Management System for this service?')) {
                        this.openTruckRepair(result.service.id);
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error creating service:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`Failed to create service: ${error.message}`, 'error');
            }
        }
    },

    showTruckRepairModal() {
        console.log('🚛 Opening Truck Repair Management System...');

        // Check if TruckRepairManager is available
        if (typeof TruckRepairManager !== 'undefined') {
            TruckRepairManager.showTruckRepairModal();
        } else {
            // Fallback - load truck repair module directly
            this.loadTruckRepairModule();
        }
    },

    async loadTruckRepairModule() {
        try {
            // Try to load the truck repair module
            const response = await fetch('/static/js/modules/truck-repair.js');
            if (response.ok) {
                const moduleScript = await response.text();
                eval(moduleScript);

                // Now try to use it
                if (typeof TruckRepairManager !== 'undefined') {
                    TruckRepairManager.showTruckRepairModal();
                } else {
                    throw new Error('TruckRepairManager not loaded');
                }
            } else {
                throw new Error('Failed to load truck repair module');
            }
        } catch (error) {
            console.error('Error loading truck repair module:', error);

            // Show simple modal with truck repair content
            const truckRepairContent = `
                <div class="truck-repair-placeholder">
                    <h3>🚛 Truck Repair Management System</h3>
                    <p>The truck repair management system will be loaded here.</p>
                    <p><strong>Features:</strong></p>
                    <ul>
                        <li>📋 Material Requisition Forms</li>
                        <li>💰 Repair Quote Generation</li>
                        <li>🔧 Parts Management</li>
                        <li>📊 Repair Cost Tracking</li>
                    </ul>
                    <div class="placeholder-actions">
                        <button class="btn btn-primary" onclick="servicesModule.retryTruckRepair()">
                            🔄 Retry Loading
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal()">
                            Close
                        </button>
                    </div>
                </div>
            `;

            if (typeof showModal !== 'undefined') {
                showModal('Truck Repair Management', truckRepairContent, 'large');
            }
        }
    },

    async retryTruckRepair() {
        if (typeof closeModal !== 'undefined') {
            closeModal();
        }

        setTimeout(() => {
            this.showTruckRepairModal();
        }, 500);
    },

    openTruckRepair(serviceId) {
        console.log(`🚛 Opening truck repair for service ID: ${serviceId}`);

        // Store the service ID for context
        this.currentTruckRepairServiceId = serviceId;

        // Open the truck repair modal
        this.showTruckRepairModal();

        if (typeof showToast !== 'undefined') {
            showToast(`Opening truck repair system for service #${serviceId}`, 'info');
        }
    },

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
                                <span>${formatDate(service.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Customer Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Name:</label>
                                <span>${customer ? customer.name : 'Unknown Customer'}</span>
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

                    <div class="detail-actions">
                        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                        <button class="btn btn-primary" onclick="servicesModule.editService(${serviceId}); closeModal();">Edit Service</button>
                        ${service.service_type === 'truck_repair' ? `
                            <button class="btn btn-primary" onclick="servicesModule.openTruckRepair(${serviceId}); closeModal();">
                                🚛 Open Truck Repair
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            if (typeof showModal !== 'undefined') {
                showModal('Service Details', modalContent, 'large');
            }

        } catch (error) {
            console.error('Error viewing service:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`Failed to load service details: ${error.message}`, 'error');
            }
        }
    },

    async editService(serviceId) {
        try {
            const service = this.currentServices.find(s => s.id === serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            const modalContent = `
                <form id="editServiceForm" class="form-grid">
                    <div class="form-group">
                        <label for="editServiceCustomerId">Customer:</label>
                        <select id="editServiceCustomerId" name="customer_id" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editServiceVehicleId">Vehicle:</label>
                        <select id="editServiceVehicleId" name="vehicle_id" required>
                            <option value="">Select Vehicle</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editServiceType">Service Type:</label>
                        <select id="editServiceType" name="service_type" required>
                            <option value="general" ${service.service_type === 'general' ? 'selected' : ''}>General Service</option>
                            <option value="truck_repair" ${service.service_type === 'truck_repair' ? 'selected' : ''}>Truck Repair</option>
                            <option value="maintenance" ${service.service_type === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                            <option value="oil_change" ${service.service_type === 'oil_change' ? 'selected' : ''}>Oil Change</option>
                            <option value="inspection" ${service.service_type === 'inspection' ? 'selected' : ''}>Inspection</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editServiceDescription">Description:</label>
                        <textarea id="editServiceDescription" name="description" rows="3" placeholder="Service description...">${service.description || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="editServiceStatus">Status:</label>
                        <select id="editServiceStatus" name="status">
                            <option value="pending" ${service.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in_progress" ${service.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${service.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${service.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Service</button>
                    </div>
                </form>
            `;

            if (typeof showModal !== 'undefined') {
                showModal('Edit Service', modalContent);
                await this.populateEditServiceForm(service);
            }

        } catch (error) {
            console.error('Error editing service:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`Failed to load service for editing: ${error.message}`, 'error');
            }
        }
    },

    async populateEditServiceForm(service) {
        try {
            const [customers, vehicles] = await Promise.all([
                this.fetchCustomers(),
                this.fetchVehicles()
            ]);

            const customerSelect = document.getElementById('editServiceCustomerId');
            const vehicleSelect = document.getElementById('editServiceVehicleId');

            if (customerSelect) {
                customerSelect.innerHTML = '<option value="">Select Customer</option>';
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    option.textContent = customer.name;
                    option.selected = customer.id === service.customer_id;
                    customerSelect.appendChild(option);
                });

                // Populate vehicles for selected customer
                if (service.customer_id && vehicleSelect) {
                    const customerVehicles = vehicles.filter(v => v.customer_id == service.customer_id);
                    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                    customerVehicles.forEach(vehicle => {
                        const option = document.createElement('option');
                        option.value = vehicle.id;
                        option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'}) - ${vehicle.license_plate || 'No License'}`;
                        option.selected = vehicle.id === service.vehicle_id;
                        vehicleSelect.appendChild(option);
                    });
                }

                // Bind customer change event
                customerSelect.addEventListener('change', async (e) => {
                    const customerId = e.target.value;
                    if (customerId && vehicleSelect) {
                        const customerVehicles = vehicles.filter(v => v.customer_id == customerId);
                        vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                        customerVehicles.forEach(vehicle => {
                            const option = document.createElement('option');
                            option.value = vehicle.id;
                            option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'}) - ${vehicle.license_plate || 'No License'}`;
                            vehicleSelect.appendChild(option);
                        });
                    } else if (vehicleSelect) {
                        vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                    }
                });
            }

            // Bind form submission
            const form = document.getElementById('editServiceForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleUpdateService(service.id, new FormData(form));
                });
            }

        } catch (error) {
            console.error('Error populating edit form:', error);
        }
    },

    async handleUpdateService(serviceId, formData) {
        try {
            const serviceData = {
                customer_id: parseInt(formData.get('customer_id')),
                vehicle_id: parseInt(formData.get('vehicle_id')),
                service_type: formData.get('service_type'),
                description: formData.get('description'),
                status: formData.get('status')
            };

            const response = await fetch(`/api/services/${serviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serviceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update service');
            }

            if (typeof closeModal !== 'undefined') {
                closeModal();
            }

            if (typeof showToast !== 'undefined') {
                showToast('Service updated successfully', 'success');
            }

            // Refresh the services list
            await this.refreshServices();

        } catch (error) {
            console.error('Error updating service:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`Failed to update service: ${error.message}`, 'error');
            }
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

            if (typeof showToast !== 'undefined') {
                showToast('Service deleted successfully', 'success');
            }

            // Refresh the services list
            await this.refreshServices();

        } catch (error) {
            console.error('Error deleting service:', error);
            if (typeof showToast !== 'undefined') {
                showToast(`Failed to delete service: ${error.message}`, 'error');
            }
        }
    }
};

// Make servicesModule globally available
window.servicesModule = servicesModule;