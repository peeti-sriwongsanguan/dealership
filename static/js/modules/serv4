// in service module, // static/js/modules/services.js
/**
 * Services Module for OL Service POS
 * Handles service management with integrated truck repair system
 */

const servicesModule = {
    currentServices: [],
    currentPage: 1,
    itemsPerPage: 10,
    automotiveParts: [], // Cache for automotive parts

    async loadModule() {
        try {
            const [services, customers, vehicles] = await Promise.all([
                this.fetchServices(),
                this.fetchCustomers(),
                this.fetchVehicles()
            ]);

            this.currentServices = services;
            // Pre-load parts data for smoother quote generation
            this.fetchAutomotiveParts();
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
    
    // Fetches and caches automotive parts from the data manager
    async fetchAutomotiveParts() {
        try {
            // Return cached data if available
            if (this.automotiveParts.length > 0) {
                return this.automotiveParts;
            }
            // Ensure the global data manager is available
            if (window.partsDataManager) {
                const partsData = await window.partsDataManager.loadData();
                this.automotiveParts = partsData.automotive_parts || [];
                console.log('Automotive parts loaded for services module.');
                return this.automotiveParts;
            }
            return [];
        } catch (error) {
            console.error('Error fetching automotive parts in services module:', error);
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

                                <div class="section-actions">
                    <button class="button button-primary" onclick="servicesModule.showAddServiceModal()" type="button">
                        ➕ Add New Service
                    </button>
                    <button class="button button-secondary" onclick="servicesModule.openTruckRepairSystem()" type="button">
                        🚛 Truck Repair System
                    </button>
                    <button class="button button-secondary" onclick="servicesModule.refreshServices()" type="button">
                        🔄 Refresh
                    </button>
                </div>

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
          _plate || 'No License' : ''}</span>
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
                                <button class="btn-icon" onclick="servicesModule.openTruckRepairForService(${service.id})" title="Truck Repair" type="button">
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

    // SERVICE MANAGEMENT METHODS
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

            this.showToast('Service created successfully', 'success');
            await this.refreshServices();

            // If truck repair, offer to open truck repair system
            if (serviceData.service_type === 'truck_repair') {
                setTimeout(() => {
                    if (confirm('Would you like to open the Truck Repair Management System for this service?')) {
                        this.openTruckRepairForService(result.service?.id || 'new');
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error creating service:', error);
            this.showToast(`Failed to create service: ${error.message}`, 'error');
        }
    },

    // TRUCK REPAIR INTEGRATION
    openTruckRepairSystem() {
        if (typeof window.truckRepairModule !== 'undefined') {
            const dynamicContent = document.getElementById('dynamicContent');
            if (dynamicContent) {
                window.truckRepairModule.loadModule().then(html => {
                    dynamicContent.innerHTML = html;
                }).catch(error => {
                    console.error('Error loading truck repair module:', error);
                    this.showToast('Failed to load truck repair system', 'error');
                });
            }
        } else {
            this.showSimpleTruckRepairModal();
        }
    },

    openTruckRepairForService(serviceId) {
        if (typeof window.truckRepairModule !== 'undefined') {
            window.truckRepairModule.currentServiceId = serviceId;
            this.openTruckRepairSystem();
        } else {
            this.showToast(`Opening truck repair for service #${serviceId}`, 'info');
            this.showSimpleTruckRepairModal();
        }
    },

    showSimpleTruckRepairModal() {
        if (typeof window.showModal !== 'function') {
            alert('Advanced features require the full truck repair module.');
            return;
        }
        const truckRepairContent = `
            <div class="truck-repair-container">
                <div class="truck-header" style="margin-bottom: 1.5rem;">
                    <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🚛 Truck Repair Management</h1>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <button class="button button-primary" onclick="servicesModule.showBasicMaterialForm()" type="button">📋 Material Request</button>
                    <button class="button button-primary" onclick="servicesModule.showBasicQuoteForm()" type="button">💰 Generate Quote</button>
                    <button class="button button-secondary" onclick="servicesModule.loadFullTruckSystem()" type="button">🔧 Load Full System</button>
                </div>
                <div class="modal-actions" style="margin-top: 2rem;">
                    <button class="button button-outline" onclick="window.closeModal()" type="button">Close</button>
                </div>
            </div>`;
        window.showModal('Truck Repair Management', truckRepairContent, 'large');
    },

    // BASIC TRUCK REPAIR FEATURES
    showBasicMaterialForm() {
        const description = prompt('Material description:');
        const quantity = prompt('Quantity needed:');

        if (description && quantity) {
            this.showToast(`Material request created: ${quantity}x ${description}`, 'success');
            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }
        }
    },

    // UPDATED: Generate a detailed quote form with parts dropdown
    async showBasicQuoteForm() {
        await this.fetchAutomotiveParts(); // Ensure parts data is loaded

        if (this.automotiveParts.length === 0) {
            this.showToast('Could not load automotive parts. Please check the data file and console.', 'error');
            return;
        }

        const quoteNumber = `Q${Date.now().toString().slice(-6)}`;
        const quoteModalContent = `
            <form id="newQuoteForm" class="form-grid">
                <div class="table-container" style="grid-column: 1 / -1;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50%;">Part / Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="quoteItemsTable"></tbody>
                    </table>
                </div>
                <div style="grid-column: 1 / -1; text-align: left;">
                    <button type="button" class="button button-secondary" onclick="servicesModule.addQuoteItemRow()">➕ Add Item</button>
                </div>
                <div class="quote-totals" style="grid-column: 1 / -1; text-align: right; margin-top: 1rem;">
                    <h3>Total: <span id="quoteTotal">฿0.00</span></h3>
                </div>
                <div class="modal-actions" style="grid-column: 1 / -1;">
                    <button type="button" class="button button-outline" onclick="window.closeModal()">Cancel</button>
                    <button type="submit" class="button button-primary">Create Quote</button>
                </div>
            </form>
        `;

        window.showModal(`New Quote: ${quoteNumber}`, quoteModalContent, 'large');
        
        setTimeout(() => {
            this.addQuoteItemRow(); // Add the first row automatically
            const form = document.getElementById('newQuoteForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuoteSubmission(new FormData(form));
            });
            const table = document.getElementById('quoteItemsTable');
            // Use event delegation for dynamically added rows
            table.addEventListener('change', (e) => {
                if (e.target.classList.contains('quote-item-select') || e.target.classList.contains('quote-item-qty')) {
                    this.updateQuoteTotals();
                }
            });
            table.addEventListener('input', (e) => {
                 if (e.target.classList.contains('quote-item-qty')) {
                    this.updateQuoteTotals();
                }
            });
        }, 100);
    },

    addQuoteItemRow() {
        const tableBody = document.getElementById('quoteItemsTable');
        if (!tableBody) return;

        const row = document.createElement('tr');
        const partsOptions = this.automotiveParts.map(part => 
            `<option value="${part.code}" data-price="${part.price}">
                ${part.thai} / ${part.english} (${part.code})
            </option>`
        ).join('');

        row.innerHTML = `
            <td>
                <select class="form-input quote-item-select">
                    <option value="" data-price="0">Select a part...</option>
                    ${partsOptions}
                </select>
            </td>
            <td><input type="number" class="form-input quote-item-qty" value="1" min="1" style="width: 80px;"></td>
            <td class="quote-item-price">฿0.00</td>
            <td class="quote-item-total">฿0.00</td>
            <td><button type="button" class="btn-icon danger" onclick="this.closest('tr').remove(); servicesModule.updateQuoteTotals();">🗑️</button></td>
        `;
        tableBody.appendChild(row);
        this.updateQuoteTotals();
    },

    updateQuoteTotals() {
        let total = 0;
        document.querySelectorAll('#quoteItemsTable tr').forEach(row => {
            const select = row.querySelector('.quote-item-select');
            const qtyInput = row.querySelector('.quote-item-qty');
            const priceCell = row.querySelector('.quote-item-price');
            const totalCell = row.querySelector('.quote-item-total');

            const selectedOption = select.options[select.selectedIndex];
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const quantity = parseInt(qtyInput.value) || 0;
            const lineTotal = price * quantity;

            priceCell.textContent = `฿${price.toFixed(2)}`;
            totalCell.textContent = `฿${lineTotal.toFixed(2)}`;
            total += lineTotal;
        });
        document.getElementById('quoteTotal').textContent = `฿${total.toFixed(2)}`;
    },

    handleQuoteSubmission(formData) {
        this.showToast('Quote created successfully!', 'success');
        if (typeof window.closeModal === 'function') window.closeModal();
    },

    showTruckSettings() {
        this.showToast('Basic truck repair settings - Use full system for advanced configuration', 'info');
    },

    loadFullTruckSystem() {
        this.showToast('Loading full truck repair system...', 'info');
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }
        this.openTruckRepairSystem();
    },

    // SERVICE ACTIONS
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
                  _at)}</span>
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
      .vin || 'N/A' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    ${service.description ? `
                        <div class="detail-section">
                            <h3>Description</h3>
                            <p class="service-description">${service.description}</p>
                        </div>
              _description">${service.description}</p>
                        </div>
                    ` : ''}

                    <div class="modal-actions">
                        <button class="button button-outline" onclick="window.closeModal()" type="button">Close</button>
                        <button class="button button-primary" onclick="servicesModule.editService(${serviceId}); window.closeModal();" type="button">Edit Service</button>
                        ${service.service_type === 'truck_repair' ? `
                            <button class="button button-primary" onclick="servicesModule.openTruckRepairForService(${serviceId}); window.closeModal();" type="button">
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
            this.showToast(`Failed to load service details: ${error.message}`, 'error');
        }
    },

    async editService(serviceId) {
        this.showToast('Edit Service - Feature coming soon!', 'info');
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

            this.showToast('Service deleted successfully', 'success');
            await this.refreshServices();

        } catch (error) {
            console.error('Error deleting service:', error);
            this.showToast(`Failed to delete service: ${error.message}`, 'error');
        }
    },

    // NAVIGATION AND UTILITY METHODS
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

            this.showToast('Services refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing services:', error);
            this.showToast('Failed to refresh services', 'error');
        }
    },

    paginate(services) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return services.slice(start, end);
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

    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback toast implementation
            let toast = document.getElementById('toast-notification');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast-notification';
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 24px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    transition: all 0.3s ease;
                    transform: translateX(100%);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(toast);
            }

            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };

            toast.style.backgroundColor = colors[type] || colors.info;
            toast.textContent = message;
            toast.style.transform = 'translateX(0)';

            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
            }, 3000);
        }
    },

    // FALLBACK FUNCTIONS
    fallbackAddService() {
        const customerName = prompt('Customer name:');
        const vehicleInfo = prompt('Vehicle info (Make Model Year):');
        const serviceType = prompt('Service type (general/truck_repair/maintenance/oil_change/inspection):') || 'general';
        const description = prompt('Description (optional):') || '';

        if (customerName && vehicleInfo) {
            this.showToast(`Service created!\n\nCustomer: ${customerName}\nVehicle: ${vehicleInfo}\nType: ${serviceType}\nDescription: ${description}`, 'success');

            if (serviceType === 'truck_repair') {
                setTimeout(() => {
                    if (confirm('Would you like to open the Truck Repair Management System?')) {
                        this.openTruckRepairSystem();
                    }
                }, 500);
            }
        }
    }
};

// Make servicesModule globally available
window.servicesModule = servicesModule;
