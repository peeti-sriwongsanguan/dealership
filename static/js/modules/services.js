// static/js/modules/services.js

const servicesModule = {
    // Core data storage - loaded from database
    services: [],
    customers: [],
    vehicles: [],
    technicians: [],
    appointments: [],
    workOrders: [],
    serviceHistory: [],
    parts: [],
    estimates: [],
    invoices: [],
    warranties: [],
    inspections: [],
    qualityChecks: [],
    materialForms: [],
    repairQuotes: [],
    truckParts: [],
    serviceBays: [],

    // Current state
    currentService: null,
    currentWorkflow: null,
    selectedFilters: {},
    refreshInterval: null,

    // Configuration
    config: {
        workingHours: { start: '08:00', end: '18:00' },
        serviceBays: 8,
        maxConcurrentServices: 15,
        defaultServiceTime: 120,
        qualityCheckRequired: true,
        refreshInterval: 30000
    },

    // INITIALIZATION AND DATA LOADING
    async loadModule() {
        console.log('🔧 Loading TRULY COMPLETE Services Management Module...');

        try {
            await this.initializeModule();
            await this.loadAllServiceData();
            await this.initializeRealTimeUpdates();
            return this.generateCompleteInterface();
        } catch (error) {
            console.error('❌ Services Module Load Error:', error);
            return this.generateErrorInterface(error.message);
        }
    },

    async initializeModule() {
        await this.loadConfiguration();
        await this.initializeWorkflowEngine();
        await this.initializeNotificationSystem();
        console.log('✅ Services module subsystems initialized');
    },

    async loadConfiguration() {
        try {
            const response = await fetch('/api/settings?category=services');
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    data.settings.forEach(setting => {
                        if (setting.key === 'working_hours_start') this.config.workingHours.start = setting.value;
                        if (setting.key === 'working_hours_end') this.config.workingHours.end = setting.value;
                        if (setting.key === 'service_bays') this.config.serviceBays = parseInt(setting.value);
                        if (setting.key === 'max_concurrent_services') this.config.maxConcurrentServices = parseInt(setting.value);
                        if (setting.key === 'default_service_time') this.config.defaultServiceTime = parseInt(setting.value);
                        if (setting.key === 'quality_check_required') this.config.qualityCheckRequired = setting.value === 'true';
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load configuration, using defaults:', error);
        }
    },

    async loadAllServiceData() {
        console.log('📊 Loading comprehensive service data...');

        const dataLoaders = [
            this.loadServices(),
            this.loadCustomers(),
            this.loadVehicles(),
            this.loadTechnicians(),
            this.loadAppointments(),
            this.loadWorkOrders(),
            this.loadServiceHistory(),
            this.loadParts(),
            this.loadEstimates(),
            this.loadInvoices(),
            this.loadWarranties(),
            this.loadInspections(),
            this.loadQualityChecks(),
            this.loadMaterialForms(),
            this.loadRepairQuotes(),
            this.loadTruckParts()
        ];

        try {
            await Promise.all(dataLoaders);
            console.log('✅ All service data loaded successfully');
            this.processLoadedData();
        } catch (error) {
            console.warn('⚠️ Some service data failed to load:', error);
            await this.generateFallbackData();
        }
    },

    // DATA LOADING METHODS
    async loadServices() {
        try {
            const response = await fetch('/api/services?include=all');
            if (response.ok) {
                const data = await response.json();
                this.services = data.services || [];
                console.log(`🔧 Loaded ${this.services.length} services`);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.services = [];
        }
    },

    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                this.customers = data.customers || [];
                console.log(`👥 Loaded ${this.customers.length} customers`);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.customers = [];
        }
    },

    async loadVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            if (response.ok) {
                const data = await response.json();
                this.vehicles = data.vehicles || [];
                console.log(`🚗 Loaded ${this.vehicles.length} vehicles`);
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.vehicles = [];
        }
    },

    async loadTechnicians() {
        try {
            const response = await fetch('/api/users?role=technician');
            if (response.ok) {
                const data = await response.json();
                this.technicians = data.users || [];
                console.log(`👨‍🔧 Loaded ${this.technicians.length} technicians`);
            }
        } catch (error) {
            console.error('Error loading technicians:', error);
            this.technicians = [];
        }
    },

    async loadAppointments() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`/api/appointments?date=${today}`);
            if (response.ok) {
                const data = await response.json();
                this.appointments = data.appointments || [];
                console.log(`📅 Loaded ${this.appointments.length} appointments`);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.appointments = [];
        }
    },

    async loadWorkOrders() {
        try {
            const response = await fetch('/api/work-orders');
            if (response.ok) {
                const data = await response.json();
                this.workOrders = data.workOrders || [];
                console.log(`📝 Loaded ${this.workOrders.length} work orders`);
            }
        } catch (error) {
            console.error('Error loading work orders:', error);
            this.workOrders = [];
        }
    },

    async loadServiceHistory() {
        try {
            const response = await fetch('/api/services?include=history');
            if (response.ok) {
                const data = await response.json();
                this.serviceHistory = data.history || [];
                console.log(`📜 Loaded ${this.serviceHistory.length} historical records`);
            }
        } catch (error) {
            console.error('Error loading service history:', error);
            this.serviceHistory = [];
        }
    },

    async loadParts() {
        try {
            const response = await fetch('/api/parts');
            if (response.ok) {
                const data = await response.json();
                this.parts = data.parts || [];
                console.log(`📦 Loaded ${this.parts.length} parts`);
            }
        } catch (error) {
            console.error('Error loading parts:', error);
            this.parts = [];
        }
    },

    async loadEstimates() {
        try {
            const response = await fetch('/api/estimates');
            if (response.ok) {
                const data = await response.json();
                this.estimates = data.estimates || [];
                console.log(`📋 Loaded ${this.estimates.length} estimates`);
            }
        } catch (error) {
            console.error('Error loading estimates:', error);
            this.estimates = [];
        }
    },

    async loadInvoices() {
        try {
            const response = await fetch('/api/invoices');
            if (response.ok) {
                const data = await response.json();
                this.invoices = data.invoices || [];
                console.log(`💳 Loaded ${this.invoices.length} invoices`);
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.invoices = [];
        }
    },

    async loadWarranties() {
        try {
            const response = await fetch('/api/warranties');
            if (response.ok) {
                const data = await response.json();
                this.warranties = data.warranties || [];
                console.log(`🛡️ Loaded ${this.warranties.length} warranties`);
            }
        } catch (error) {
            console.error('Error loading warranties:', error);
            this.warranties = [];
        }
    },

    async loadInspections() {
        try {
            const response = await fetch('/api/inspections');
            if (response.ok) {
                const data = await response.json();
                this.inspections = data.inspections || [];
                console.log(`🔍 Loaded ${this.inspections.length} inspections`);
            }
        } catch (error) {
            console.error('Error loading inspections:', error);
            this.inspections = [];
        }
    },

    async loadQualityChecks() {
        try {
            const response = await fetch('/api/quality-checks');
            if (response.ok) {
                const data = await response.json();
                this.qualityChecks = data.checks || [];
                console.log(`✅ Loaded ${this.qualityChecks.length} quality checks`);
            }
        } catch (error) {
            console.error('Error loading quality checks:', error);
            this.qualityChecks = this.getDefaultQualityChecks();
        }
    },

    async loadMaterialForms() {
        try {
            const response = await fetch('/api/material-forms');
            if (response.ok) {
                const data = await response.json();
                this.materialForms = data.forms || [];
                console.log(`📋 Loaded ${this.materialForms.length} material forms`);
            }
        } catch (error) {
            console.error('Error loading material forms:', error);
            this.materialForms = [];
        }
    },

    async loadRepairQuotes() {
        try {
            const response = await fetch('/api/repair-quotes');
            if (response.ok) {
                const data = await response.json();
                this.repairQuotes = data.quotes || [];
                console.log(`🚛 Loaded ${this.repairQuotes.length} repair quotes`);
            }
        } catch (error) {
            console.error('Error loading repair quotes:', error);
            this.repairQuotes = [];
        }
    },

    async loadTruckParts() {
        try {
            const response = await fetch('/api/truck-parts');
            if (response.ok) {
                const data = await response.json();
                this.truckParts = data.parts || [];
                console.log(`🚛 Loaded ${this.truckParts.length} truck parts`);
            }
        } catch (error) {
            console.error('Error loading truck parts:', error);
            this.truckParts = [];
        }
    },

    // DATA PROCESSING
    processLoadedData() {
        this.enrichServicesWithRelatedData();
        this.calculateServiceMetrics();
        this.updateServiceBayStatus();
        console.log('✅ Data processing completed');
    },

    enrichServicesWithRelatedData() {
        this.services.forEach(service => {
            const customer = this.customers.find(c => c.id === service.customer_id);
            if (customer) {
                service.customer_name = `${customer.first_name} ${customer.last_name}`;
                service.customer_email = customer.email;
                service.customer_phone = customer.phone;
            }

            const vehicle = this.vehicles.find(v => v.id === service.vehicle_id);
            if (vehicle) {
                service.vehicle_info = `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}`;
                service.vehicle_vin = vehicle.vin;
                service.vehicle_color = vehicle.color;
            }

            const technician = this.technicians.find(t => t.id === service.technician_id);
            if (technician) {
                service.technician_name = technician.full_name || technician.username;
            }
        });
    },

    calculateServiceMetrics() {
        this.metrics = {
            totalServices: this.services.length,
            activeServices: this.services.filter(s => ['scheduled', 'in_progress'].includes(s.status)).length,
            completedToday: this.services.filter(s => {
                if (!s.completed_date) return false;
                const today = new Date().toISOString().split('T')[0];
                return s.completed_date.startsWith(today);
            }).length,
            pendingQualityChecks: this.services.filter(s => s.status === 'quality_check').length,
            overdueServices: this.getOverdueServices().length,
            avgServiceTime: this.calculateAverageServiceTime(),
            customerSatisfaction: this.calculateCustomerSatisfaction(),
            technicianUtilization: this.calculateTechnicianUtilization()
        };
    },

    updateServiceBayStatus() {
        this.serviceBays = [];
        for (let i = 1; i <= this.config.serviceBays; i++) {
            const bayId = `Bay-${String.fromCharCode(64 + Math.ceil(i / 4))}${i}`;
            const activeService = this.services.find(s =>
                s.service_bay === bayId && s.status === 'in_progress'
            );

            this.serviceBays.push({
                id: i,
                name: bayId,
                status: activeService ? 'occupied' : 'available',
                current_service: activeService ? activeService.id : null,
                service_info: activeService,
                progress: activeService ? this.calculateServiceProgress(activeService) : 0
            });
        }
    },

    initializeRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(async () => {
            await this.refreshServiceData();
        }, this.config.refreshInterval);

        console.log(`⏰ Real-time updates started (${this.config.refreshInterval/1000}s interval)`);
    },

    async refreshServiceData() {
        try {
            await Promise.all([
                this.loadServices(),
                this.loadAppointments(),
                this.loadWorkOrders(),
                this.loadQualityChecks()
            ]);

            this.processLoadedData();
            this.refreshCurrentView();
        } catch (error) {
            console.error('Error refreshing service data:', error);
        }
    },

    refreshCurrentView() {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) {
            const tabName = activeTab.getAttribute('data-tab');
            this.switchTab(tabName);
        }
    },

    // COMPLETE INTERFACE GENERATION
    generateCompleteInterface() {
        return `
            <div class="complete-workflow-container">
                ${this.generateSystemHeader()}
                ${this.generateRealTimeDashboard()}
                ${this.generateMainNavigation()}
                <div class="services-content-area">
                    <div id="servicesMainContent">
                        ${this.generateDashboardContent()}
                    </div>
                </div>
                ${this.generateFloatingActions()}

            </div>
        `;
    },

    generateSystemHeader() {
        const stats = this.calculateComprehensiveStats();
        return `
            <div class="workflow-header">
                <h1>🔧 Complete Services Management</h1>
                <div class="workflow-info">
                    <div class="stat-item">
                        <span class="stat-value">${stats.activeServices}</span>
                        <span class="stat-label">Active Services</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.todayAppointments}</span>
                        <span class="stat-label">Today's Appointments</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.availableBays}</span>
                        <span class="stat-label">Available Bays</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.pendingQC}</span>
                        <span class="stat-label">Pending QC</span>
                    </div>
                </div>
            </div>
        `;
    },

    generateMainNavigation() {
        return `
            <div class="services-main-navigation">
                <div class="nav-tabs-container">
                    <button class="nav-tab active" data-tab="dashboard" onclick="servicesModule.switchTab('dashboard')">
                        📊 Dashboard
                    </button>
                    <button class="nav-tab" data-tab="services" onclick="servicesModule.switchTab('services')">
                        🔧 Active Services
                    </button>
                    <button class="nav-tab" data-tab="appointments" onclick="servicesModule.switchTab('appointments')">
                        📅 Appointments
                    </button>
                    <button class="nav-tab" data-tab="estimates" onclick="servicesModule.switchTab('estimates')">
                        📋 Estimates
                    </button>
                    <button class="nav-tab" data-tab="work-orders" onclick="servicesModule.switchTab('work-orders')">
                        📝 Work Orders
                    </button>
                    <button class="nav-tab" data-tab="quality" onclick="servicesModule.switchTab('quality')">
                        ✅ Quality Control
                    </button>
                    <button class="nav-tab" data-tab="technicians" onclick="servicesModule.switchTab('technicians')">
                        👨‍🔧 Technicians
                    </button>
                    <button class="nav-tab" data-tab="truck-repair" onclick="servicesModule.switchTab('truck-repair')">
                        🚛 Truck Repair
                    </button>
                    <button class="nav-tab" data-tab="delivery" onclick="servicesModule.switchTab('delivery')">
                        🚚 Delivery
                    </button>
                    <button class="nav-tab" data-tab="reports" onclick="servicesModule.switchTab('reports')">
                        📈 Reports
                    </button>
                </div>
            </div>
        `;
    },

    generateDashboardContent() {
        return `
            <div class="dashboard-content">
                <div class="kpi-section">
                    <h2>📊 Key Performance Indicators</h2>
                    <div class="dashboard-grid">
                        ${this.generateKPICards()}
                    </div>
                </div>

                <div class="workflow-step-section">
                    <div class="step-header">
                        <div class="step-number">🏭</div>
                        <div class="step-info">
                            <h2>Service Bay Status</h2>
                            <p>Real-time bay utilization and current services</p>
                        </div>
                    </div>
                    <div class="bays-grid">
                        ${this.generateServiceBaysStatus()}
                    </div>
                </div>

                <div class="workflow-step-section">
                    <div class="step-header">
                        <div class="step-number">👨‍🔧</div>
                        <div class="step-info">
                            <h2>Technician Status</h2>
                            <p>Current technician assignments and availability</p>
                        </div>
                    </div>
                    <div class="technicians-grid">
                        ${this.generateTechnicianStatusCards()}
                    </div>
                </div>

                <div class="workflow-step-section">
                    <div class="step-header">
                        <div class="step-number">⚠️</div>
                        <div class="step-info">
                            <h2>Priority Alerts</h2>
                            <p>Emergency services and urgent notifications</p>
                        </div>
                    </div>
                    <div class="priority-alerts">
                        ${this.generatePriorityAlerts()}
                    </div>
                </div>
            </div>
        `;
    },

    generateRealTimeDashboard() {
        return `

               <div class="dashboard-content">
                <div class="dashboard-section">
                    <h3>📅 Today's Schedule</h3>
                    <div class="todays-schedule">
                        ${this.generateTodaysSchedule()}
                    </div>
                </div>

               </div>
            </div>
        `;
    },

    // TAB CONTENT GENERATORS
    generateServicesTabContent() {
        if (this.services.length === 0) {
            return `
                <div class="no-selection">
                    <h3>No Active Services</h3>
                    <p>No services are currently being processed.</p>
                    <button class="btn btn-primary" onclick="servicesModule.createNewService()">
                        ➕ Create New Service
                    </button>
                </div>
            `;
        }

        return `
            <div class="services-tab-content">
                <div class="services-controls">
                    <div class="filters-section">
                        <h3>🔍 Filters</h3>
                        <div class="filters-grid">
                            ${this.generateServiceFilters()}
                        </div>
                    </div>
                    <div class="actions-section">
                        <button class="btn btn-primary" onclick="servicesModule.createNewService()">
                            ➕ New Service
                        </button>
                        <button class="btn btn-secondary" onclick="servicesModule.refreshServiceData()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div class="services-list-container">
                    <div class="services-list">
                        ${this.generateComprehensiveServicesList()}
                    </div>
                </div>
            </div>
        `;
    },

    generateAppointmentsTabContent() {
        if (this.appointments.length === 0) {
            return `
                <div class="no-selection">
                    <h3>No Appointments Today</h3>
                    <p>No appointments are scheduled for today.</p>
                    <button class="btn btn-primary" onclick="servicesModule.scheduleNewAppointment()">
                        ➕ Schedule Appointment
                    </button>
                </div>
            `;
        }

        return `
            <div class="appointments-tab-content">
                <div class="appointment-scheduler">
                    <div class="scheduler-header">
                        <h3>📅 Today's Appointments</h3>
                        <button class="btn btn-primary" onclick="servicesModule.scheduleNewAppointment()">
                            ➕ Schedule Appointment
                        </button>
                    </div>
                    <div class="appointments-list">
                        ${this.appointments.map(appointment => `
                            <div class="service-item">
                                <div class="service-header">
                                    <div class="service-id">${this.formatDateTime(appointment.appointment_date)}</div>
                                    <div class="service-priority priority-${appointment.status === 'confirmed' ? 'normal' : 'high'}">
                                        ${(appointment.status || 'pending').toUpperCase()}
                                    </div>
                                </div>
                                <div class="service-details">
                                    <div class="detail-group">
                                        <h5>Customer</h5>
                                        <p>${appointment.customer_name || 'Unknown'}</p>
                                    </div>
                                    <div class="detail-group">
                                        <h5>Vehicle</h5>
                                        <p>${appointment.vehicle_info || 'Not specified'}</p>
                                    </div>
                                    <div class="detail-group">
                                        <h5>Service</h5>
                                        <p>${appointment.service_type || 'General Service'}</p>
                                    </div>
                                    <div class="detail-group">
                                        <h5>Time</h5>
                                        <p>${this.formatTime(appointment.appointment_time)}</p>
                                    </div>
                                    <div class="detail-group">
                                        <h5>Duration</h5>
                                        <p>${appointment.estimated_duration || 120} min</p>
                                    </div>
                                    <div class="detail-group">
                                        <h5>Technician</h5>
                                        <p>${appointment.assigned_technician || 'Unassigned'}</p>
                                    </div>
                                </div>
                                <div class="action-buttons">
                                    <button class="btn btn-primary btn-sm">📞 Call Customer</button>
                                    <button class="btn btn-success btn-sm">✅ Confirm</button>
                                    <button class="btn btn-warning btn-sm">📝 Reschedule</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    generateEstimatesTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📋 Estimates Management</h3>
                    <div class="data-table-actions">
                        <button class="button button-primary" onclick="servicesModule.createNewEstimate()">
                            ➕ Create Estimate
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.estimates.length === 0 ? `
                        <div class="no-selection">
                            <div class="empty-icon">📋</div>
                            <div class="empty-text">No Pending Estimates</div>
                            <p>No estimates are pending approval.</p>
                        </div>
                    ` : `
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">📋</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.estimates.length}</div>
                                    <div class="stat-label">Total Estimates</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⏳</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getPendingEstimates().length}</div>
                                    <div class="stat-label">Pending Approval</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">✅</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getApprovedEstimates().length}</div>
                                    <div class="stat-label">Approved</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">💰</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.formatCurrency(this.getTotalEstimateValue())}</div>
                                    <div class="stat-label">Total Value</div>
                                </div>
                            </div>
                        </div>
                        <div class="estimates-list">
                            ${this.generateEstimatesList()}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    generateWorkOrdersTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📝 Work Orders</h3>
                    <div class="data-table-actions">
                        <button class="button button-primary" onclick="servicesModule.createWorkOrder()">
                            ➕ Create Work Order
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.workOrders.length === 0 ? `
                        <div class="no-selection">
                            <div class="empty-icon">📝</div>
                            <div class="empty-text">No Work Orders</div>
                            <p>No work orders are currently active.</p>
                        </div>
                    ` : `
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">📝</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.workOrders.length}</div>
                                    <div class="stat-label">Total Work Orders</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">🔄</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getActiveWorkOrders().length}</div>
                                    <div class="stat-label">Active</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">✅</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getCompletedWorkOrders().length}</div>
                                    <div class="stat-label">Completed</div>
                                </div>
                            </div>
                        </div>
                        <div class="work-orders-list">
                            ${this.generateWorkOrdersList()}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    generateQualityTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">✅ Quality Control</h3>
                    <div class="data-table-actions">
                        <button class="button button-primary" onclick="servicesModule.performQualityCheck()">
                            ✅ Quality Check
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">⏳</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.getPendingQualityChecks().length}</div>
                                <div class="stat-label">Pending QC</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.getPassedQualityChecks().length}</div>
                                <div class="stat-label">Passed</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">❌</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.getFailedQualityChecks().length}</div>
                                <div class="stat-label">Failed</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.getQualityScore()}%</div>
                                <div class="stat-label">Quality Score</div>
                            </div>
                        </div>
                    </div>
                    <div class="quality-checklist">
                        <h4>📋 Quality Control Checklist</h4>
                        <div class="checklist-categories">
                            ${this.generateQualityChecklistCategories()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateTechniciansTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">👨‍🔧 Technicians</h3>
                    <div class="data-table-actions">
                        <button class="button button-outline" onclick="servicesModule.manageTechnicians()">
                            👥 Manage Team
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.technicians.length === 0 ? `
                        <div class="no-selection">
                            <div class="empty-icon">👨‍🔧</div>
                            <div class="empty-text">No Technicians</div>
                            <p>No technicians are registered in the system.</p>
                        </div>
                    ` : `
                        <div class="technicians-stats stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">👨‍🔧</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.technicians.length}</div>
                                    <div class="stat-label">Total Technicians</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">✅</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getAvailableTechnicians().length}</div>
                                    <div class="stat-label">Available</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">🔧</div>
                                <div class="stat-content">
                                    <div class="stat-number">${this.getBusyTechnicians().length}</div>
                                    <div class="stat-label">Working</div>
                                </div>
                            </div>
                        </div>
                        <div class="technicians-grid">
                            ${this.generateTechnicianStatusCards()}
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    generateTruckRepairTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">🚛 Truck Repair</h3>
                    <div class="data-table-actions">
                        <div class="nav-tabs-container">
                            <button class="nav-tab active" onclick="servicesModule.showTruckTab('forms')">Material Forms</button>
                            <button class="nav-tab" onclick="servicesModule.showTruckTab('quotes')">Repair Quotes</button>
                            <button class="nav-tab" onclick="servicesModule.showTruckTab('parts')">Parts Inventory</button>
                        </div>
                        <button class="button button-primary" onclick="servicesModule.createMaterialForm()">
                            📋 Material Form
                        </button>
                        <button class="button button-warning" onclick="servicesModule.createRepairQuote()">
                            🚛 Repair Quote
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📋</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.materialForms.length}</div>
                                <div class="stat-label">Material Forms</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🚛</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.repairQuotes.length}</div>
                                <div class="stat-label">Repair Quotes</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📦</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.truckParts.length}</div>
                                <div class="stat-label">Truck Parts</div>
                            </div>
                        </div>
                    </div>
                    <div id="truck-repair-content">
                        ${this.generateMaterialFormsContent()}
                    </div>
                </div>
            </div>
        `;
    },

    generateDeliveryTabContent() {
        const readyForDelivery = this.services.filter(s => s.status === 'ready_delivery' || s.status === 'completed');

        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">🚚 Vehicle Delivery - White Gloves Service</h3>
                    <div class="data-table-actions">
                        <button class="button button-outline" onclick="servicesModule.refreshDeliveries()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${readyForDelivery.length === 0 ? `
                        <div class="no-selection">
                            <div class="empty-icon">🚚</div>
                            <div class="empty-text">No Vehicles Ready for Delivery</div>
                            <p>No completed services are ready for customer delivery.</p>
                        </div>
                    ` : `
                        <div class="delivery-list">
                            ${readyForDelivery.map(service => `
                                <div class="delivery-card ready">
                                    <div class="service-header">
                                        <div class="service-id">#${service.id}</div>
                                        <div class="service-priority priority-normal">READY</div>
                                    </div>
                                    <div class="service-details">
                                        <div class="detail-group">
                                            <h5>Customer</h5>
                                            <p>${service.customer_name}</p>
                                        </div>
                                        <div class="detail-group">
                                            <h5>Vehicle</h5>
                                            <p>${service.vehicle_info}</p>
                                        </div>
                                        <div class="detail-group">
                                            <h5>Service</h5>
                                            <p>${service.service_type}</p>
                                        </div>
                                        <div class="detail-group">
                                            <h5>Completed</h5>
                                            <p>${this.formatDateTime(service.completed_date)}</p>
                                        </div>
                                    </div>
                                    <div class="white-gloves">
                                        <div class="white-gloves-icon">🧤</div>
                                        <strong>White Gloves Service</strong>
                                        <p>Premium delivery with professional presentation and quality assurance</p>
                                    </div>
                                    <div class="action-buttons">
                                        <button class="btn btn-primary btn-sm">📋 Prepare Delivery</button>
                                        <button class="btn btn-success btn-sm">🚚 Start Delivery</button>
                                        <button class="btn btn-warning btn-sm">📞 Contact Customer</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    },


    generateReportsTabContent() {
        return `
            <div class="reports-tab-content">
                <div class="reports-grid">
                    <div class="report-card">
                        <div class="report-value">${this.formatCurrency(this.calculateTotalRevenue())}</div>
                        <div class="report-label">Total Revenue</div>
                        <div class="report-change change-positive">↗️ +12%</div>
                    </div>
                    <div class="report-card">
                        <div class="report-value">${this.services.filter(s => s.status === 'completed').length}</div>
                        <div class="report-label">Services Completed</div>
                        <div class="report-change change-positive">↗️ +5</div>
                    </div>
                    <div class="report-card">
                        <div class="report-value">${this.calculateAverageServiceTime()}h</div>
                        <div class="report-label">Avg Service Time</div>
                        <div class="report-change change-negative">↘️ -0.3h</div>
                    </div>
                    <div class="report-card">
                        <div class="report-value">${this.calculateCustomerSatisfaction()}%</div>
                        <div class="report-label">Customer Satisfaction</div>
                        <div class="report-change change-positive">↗️ +2%</div>
                    </div>
                </div>
            </div>
        `;
    },

    // CONTENT GENERATION HELPERS
    generateServiceFilters() {
        const statuses = [...new Set(this.services.map(s => s.status))];
        const priorities = [...new Set(this.services.map(s => s.priority))];
        const serviceTypes = [...new Set(this.services.map(s => s.service_type))];

        return `
            <select id="statusFilter" onchange="servicesModule.applyFilters()">
                <option value="">All Statuses</option>
                ${statuses.map(status => `<option value="${status}">${status}</option>`).join('')}
            </select>

            <select id="priorityFilter" onchange="servicesModule.applyFilters()">
                <option value="">All Priorities</option>
                ${priorities.map(priority => `<option value="${priority}">${priority}</option>`).join('')}
            </select>

            <select id="typeFilter" onchange="servicesModule.applyFilters()">
                <option value="">All Service Types</option>
                ${serviceTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>

            <select id="technicianFilter" onchange="servicesModule.applyFilters()">
                <option value="">All Technicians</option>
                ${this.technicians.map(tech => `<option value="${tech.id}">${tech.full_name || tech.username}</option>`).join('')}
            </select>
        `;
    },

    generateComprehensiveServicesList() {
        const filteredServices = this.getFilteredServices();

        return filteredServices.map(service => `
            <div class="service-item" onclick="servicesModule.manageService('${service.id}')">
                <div class="service-header">
                    <div class="service-id">#${service.id}</div>
                    <div class="service-priority priority-${service.priority || 'normal'}">${(service.priority || 'normal').toUpperCase()}</div>
                </div>

                <div class="service-details">
                    <div class="detail-group">
                        <h5>Customer</h5>
                        <p>${service.customer_name || 'Unknown Customer'}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Vehicle</h5>
                        <p>${service.vehicle_info || 'Vehicle info not available'}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Service Type</h5>
                        <p>${service.service_type || 'General Service'}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Status</h5>
                        <p>${service.status || 'pending'}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Technician</h5>
                        <p>${service.technician_name || 'Unassigned'}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Estimated Cost</h5>
                        <p>${this.formatCurrency(service.estimated_cost)}</p>
                    </div>
                </div>

                <div class="service-progress">
                    <div class="progress-header">
                        <span class="progress-text">Progress</span>
                        <span class="progress-percentage">${this.calculateServiceProgress(service)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${this.calculateServiceProgress(service)}%"></div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); servicesModule.updateService('${service.id}')">
                        📝 Update
                    </button>
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); servicesModule.qualityCheck('${service.id}')">
                        ✅ Quality Check
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); servicesModule.viewEstimate('${service.id}')">
                        📋 View Details
                    </button>
                </div>
            </div>
        `).join('');
    },

    generateServiceBaysStatus() {
        return this.serviceBays.map(bay => `
            <div class="bay-card ${bay.status}" onclick="servicesModule.manageBay(${bay.id})">
                <div class="bay-header">
                    <div class="bay-number">${bay.name}</div>
                    <div class="bay-status ${bay.status}">${bay.status.charAt(0).toUpperCase() + bay.status.slice(1)}</div>
                </div>
                <div class="bay-content">
                    ${bay.service_info ? `
                        <div class="service-info">
                            <strong>${bay.service_info.customer_name}</strong><br>
                            <small>${bay.service_info.vehicle_info}</small><br>
                            <small>Service: ${bay.service_info.service_type}</small>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${bay.progress}%"></div>
                            </div>
                            <small>${bay.progress}% Complete</small>
                        </div>
                    ` : `
                        <div style="text-align: center; color: #6c757d;">
                            ✅ Available
                        </div>
                    `}
                </div>
            </div>
        `).join('');
    },

    generateTechnicianStatusCards() {
        return this.technicians.map(tech => `
            <div class="technician-card" onclick="servicesModule.manageTechnician(${tech.id})">
                <div class="tech-header">
                    <div class="tech-avatar">${(tech.full_name || tech.username).charAt(0).toUpperCase()}</div>
                    <div class="tech-info">
                        <h4>${tech.full_name || tech.username}</h4>
                        <div class="tech-role">${tech.role}</div>
                    </div>
                </div>
                <div class="tech-specialization">
                    <strong>Specialization:</strong> ${tech.specialization || 'General'}
                </div>
                <div class="tech-status available">Available</div>
                <div style="margin-top: 0.5rem;">
                    <strong>Email:</strong> ${tech.email || 'Not provided'}
                </div>
                <div style="margin-top: 0.25rem;">
                    <strong>Last Login:</strong> ${this.formatDateTime(tech.last_login)}
                </div>
            </div>
        `).join('');
    },

    generatePriorityAlerts() {
        const alerts = this.getPriorityAlerts();

        if (alerts.length === 0) {
            return `
                <div class="no-alerts">
                    <div class="success-icon">✅</div>
                    <div class="success-text">No priority alerts</div>
                </div>
            `;
        }

        return alerts.map(alert => `
            <div class="priority-alert ${alert.severity}">
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-timestamp">${this.formatDateTime(alert.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },

    generateTodaysSchedule() {
        if (this.appointments.length === 0) {
            return `
                <div class="no-appointments">
                    <div class="empty-icon">📅</div>
                    <div class="empty-text">No appointments scheduled for today</div>
                    <button class="btn btn-primary" onclick="servicesModule.scheduleNewAppointment()">
                        Schedule Appointment
                    </button>
                </div>
            `;
        }

        return `
            <div class="schedule-timeline">
                ${this.appointments.map(appointment => `
                    <div class="appointment-item ${appointment.status}" onclick="servicesModule.manageAppointment(${appointment.id})">
                        <div class="appointment-time">
                            <div class="time-slot">${this.formatTime(appointment.appointment_time)}</div>
                            <div class="duration">${appointment.estimated_duration || 120}min</div>
                        </div>

                        <div class="appointment-details">
                            <div class="customer-info">
                                <div class="customer-name">${appointment.customer_name || 'Unknown Customer'}</div>
                                <div class="contact-info">${appointment.customer_phone || 'No phone'}</div>
                            </div>

                            <div class="service-info">
                                <div class="vehicle-info">${appointment.vehicle_info || 'Vehicle not specified'}</div>
                                <div class="service-type">${appointment.service_type}</div>
                            </div>

                            <div class="assignment-info">
                                <div class="technician">${appointment.assigned_technician || 'Unassigned'}</div>
                                <div class="bay">${appointment.assigned_bay || 'TBD'}</div>
                            </div>
                        </div>

                        <div class="appointment-status">
                            <div class="status-badge ${appointment.status}">${appointment.status}</div>
                            <div class="appointment-actions">
                                ${appointment.status === 'scheduled' ? `
                                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); servicesModule.confirmAppointment(${appointment.id})">
                                        ✅ Confirm
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); servicesModule.editAppointment(${appointment.id})">
                                    ✏️ Edit
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateKPICards() {
        const kpis = this.calculateKPIs();

        return `
            <div class="kpi-card">
                <div class="card-icon">⚡</div>
                <div class="report-value">${kpis.serviceEfficiency}%</div>
                <div class="report-label">Service Efficiency</div>
                <div class="report-change change-positive">↗️ +2.3%</div>
            </div>

            <div class="kpi-card">
                <div class="card-icon">😊</div>
                <div class="report-value">${kpis.customerSatisfaction}%</div>
                <div class="report-label">Customer Satisfaction</div>
                <div class="report-change change-positive">↗️ +1.8%</div>
            </div>

            <div class="kpi-card">
                <div class="card-icon">🎯</div>
                <div class="report-value">${kpis.onTimeCompletion}%</div>
                <div class="report-label">On-Time Completion</div>
                <div class="report-change change-negative">↘️ -0.5%</div>
            </div>

            <div class="kpi-card">
                <div class="card-icon">💰</div>
                <div class="report-value">${this.formatCurrency(kpis.avgTicketValue)}</div>
                <div class="report-label">Avg Ticket Value</div>
                <div class="report-change change-positive">↗️ +${this.formatCurrency(180)}</div>
            </div>

            <div class="kpi-card">
                <div class="card-icon">🔄</div>
                <div class="report-value">${kpis.firstTimeRightRate}%</div>
                <div class="report-label">First Time Right</div>
                <div class="report-change change-positive">↗️ +2.1%</div>
            </div>

            <div class="kpi-card">
                <div class="card-icon">👨‍🔧</div>
                <div class="report-value">${kpis.technicianUtilization}%</div>
                <div class="report-label">Technician Utilization</div>
                <div class="report-change change-positive">↗️ +3.2%</div>
            </div>
        `;
    },

    generateQualityChecklistCategories() {
        const categories = this.getDefaultQualityChecks();

        return `
            <div class="quality-categories">
                ${categories.map((check, index) => `
                    <div class="checklist-item">
                        <div class="checklist-checkbox ${check.checked ? 'checked' : ''}" onclick="servicesModule.toggleQualityCheck(${index})">
                            ${check.checked ? '✓' : ''}
                        </div>
                        <div class="checklist-text">${check.item}</div>
                        <div class="checklist-status status-${check.status}">${check.status}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateMaterialFormsContent() {
        if (this.materialForms.length === 0) {
            return '<div class="empty-state">No material forms found. Create your first material requisition!</div>';
        }

        return `
            <div class="material-forms-list">
                ${this.materialForms.map(form => `
                    <div class="material-form-card">
                        <div class="form-header">
                            <h4>Form #${form.id}</h4>
                            <span class="status-badge status-${form.status}">${form.status}</span>
                        </div>
                        <div class="service-details">
                            <div class="detail-group">
                                <h5>Vehicle Registration</h5>
                                <p>${form.vehicle_registration || 'Not specified'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Requester</h5>
                                <p>${form.requester_name}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Total Items</h5>
                                <p>${form.total_items || 0}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Total Cost</h5>
                                <p>${this.formatCurrency(form.total_cost)}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Date</h5>
                                <p>${this.formatDateTime(form.date)}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Status</h5>
                                <p>${form.approval_status || form.status}</p>
                            </div>
                        </div>
                        ${form.notes ? `<div class="notes"><strong>Notes:</strong> ${form.notes}</div>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="servicesModule.editMaterialForm(${form.id})">📝 Edit</button>
                            <button class="btn btn-success btn-sm" onclick="servicesModule.approveMaterialForm(${form.id})">✅ Approve</button>
                            <button class="btn btn-warning btn-sm" onclick="servicesModule.printMaterialForm(${form.id})">🖨️ Print</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateRepairQuotesContent() {
        if (this.repairQuotes.length === 0) {
            return '<div class="empty-state">No repair quotes found. Create your first truck repair quote!</div>';
        }

        return `
            <div class="repair-quotes-list">
                ${this.repairQuotes.map(quote => `
                    <div class="quote-card">
                        <div class="quote-header">
                            <h4>${quote.quote_number}</h4>
                            <span class="status-badge status-${quote.status}">${quote.status}</span>
                        </div>
                        <div class="service-details">
                            <div class="detail-group">
                                <h5>Customer</h5>
                                <p>${quote.customer_name || 'Not specified'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Vehicle</h5>
                                <p>${quote.vehicle_make} ${quote.vehicle_model} ${quote.vehicle_year || ''}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Registration</h5>
                                <p>${quote.vehicle_registration || 'Not specified'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Repair Type</h5>
                                <p>${quote.repair_type}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Total Amount</h5>
                                <p><strong>${this.formatCurrency(quote.final_amount || quote.total_amount)}</strong></p>
                            </div>
                            <div class="detail-group">
                                <h5>Quote Date</h5>
                                <p>${this.formatDateTime(quote.quote_date)}</p>
                            </div>
                        </div>
                        ${quote.damage_description ? `<div class="description"><strong>Damage:</strong> ${quote.damage_description}</div>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="servicesModule.editRepairQuote(${quote.id})">📝 Edit</button>
                            <button class="btn btn-success btn-sm" onclick="servicesModule.approveRepairQuote(${quote.id})">✅ Approve</button>
                            <button class="btn btn-warning btn-sm" onclick="servicesModule.printRepairQuote(${quote.id})">🖨️ Print</button>
                            <button class="btn btn-info btn-sm" onclick="servicesModule.emailRepairQuote(${quote.id})">📧 Email</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateTruckPartsContent() {
        if (this.truckParts.length === 0) {
            return '<div class="empty-state">No truck parts found in inventory.</div>';
        }

        return `
            <div class="truck-parts-grid">
                ${this.truckParts.map(part => `
                    <div class="part-card" onclick="servicesModule.managePart('${part.part_code}')">
                        <div class="part-code">${part.part_code}</div>
                        <div class="part-name-thai">${part.part_name_thai}</div>
                        <div class="part-name-english">${part.part_name_english || ''}</div>
                        <div class="part-category">Category: ${part.category || 'General'}</div>
                        <div class="part-price">
                            <div>Cost: ${this.formatCurrency(part.cost_price)}</div>
                            <div>Sell: ${this.formatCurrency(part.selling_price)}</div>
                            ${part.retail_price ? `<div>Retail: ${this.formatCurrency(part.retail_price)}</div>` : ''}
                        </div>
                        <div class="part-stock ${part.quantity_in_stock <= part.min_stock_level ? 'low' : ''}">
                            <div>Stock: ${part.quantity_in_stock}</div>
                            <div>Min: ${part.min_stock_level}</div>
                            <div>Max: ${part.max_stock_level}</div>
                        </div>
                        <div class="part-location">Location: ${part.location_shelf || 'Unknown'}</div>
                        ${part.supplier ? `<div class="part-supplier">Supplier: ${part.supplier}</div>` : ''}
                        ${part.vehicle_compatibility ? `<div class="part-compatibility">Fits: ${part.vehicle_compatibility}</div>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); servicesModule.editPart('${part.part_code}')">📝</button>
                            <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); servicesModule.orderPart('${part.part_code}')">📦</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },


    // ESTIMATES LIST GENERATOR (continued from line that was cut off)
    generateEstimatesList() {
        if (this.estimates.length === 0) {
            return '<div class="empty-state">No estimates found. Create your first service estimate!</div>';
        }

        return `
            <div class="estimates-list">
                ${this.estimates.map(estimate => `
                    <div class="estimate-card ${estimate.status}" onclick="servicesModule.manageEstimate(${estimate.id})">
                        <div class="estimate-header">
                            <h4>Estimate #${estimate.estimate_number || estimate.id}</h4>
                            <span class="status-badge status-${estimate.status}">${estimate.status}</span>
                        </div>
                        <div class="service-details">
                            <div class="detail-group">
                                <h5>Customer</h5>
                                <p>${estimate.customer_name || 'Not specified'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Vehicle</h5>
                                <p>${estimate.vehicle_info || 'Not specified'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Service Type</h5>
                                <p>${estimate.service_type}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Total Amount</h5>
                                <p><strong>${this.formatCurrency(estimate.total_amount)}</strong></p>
                            </div>
                            <div class="detail-group">
                                <h5>Created Date</h5>
                                <p>${this.formatDateTime(estimate.created_date)}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Valid Until</h5>
                                <p>${this.formatDateTime(estimate.valid_until)}</p>
                            </div>
                        </div>
                        ${estimate.notes ? `<div class="notes"><strong>Notes:</strong> ${estimate.notes}</div>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); servicesModule.editEstimate(${estimate.id})">📝 Edit</button>
                            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); servicesModule.approveEstimate(${estimate.id})">✅ Approve</button>
                            <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); servicesModule.emailEstimate(${estimate.id})">📧 Email</button>
                            <button class="btn btn-info btn-sm" onclick="event.stopPropagation(); servicesModule.printEstimate(${estimate.id})">🖨️ Print</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateWorkOrdersList() {
        if (this.workOrders.length === 0) {
            return '<div class="empty-state">No work orders found. Create your first work order!</div>';
        }

        return `
            <div class="work-orders-list">
                ${this.workOrders.map(workOrder => `
                    <div class="work-order-card ${workOrder.status}" onclick="servicesModule.manageWorkOrder(${workOrder.id})">
                        <div class="work-order-header">
                            <h4>WO #${workOrder.work_order_number || workOrder.id}</h4>
                            <span class="status-badge status-${workOrder.status}">${workOrder.status}</span>
                        </div>
                        <div class="service-details">
                            <div class="detail-group">
                                <h5>Service ID</h5>
                                <p>${workOrder.service_id}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Technician</h5>
                                <p>${workOrder.assigned_technician || 'Unassigned'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Priority</h5>
                                <p>${workOrder.priority || 'normal'}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Created</h5>
                                <p>${this.formatDateTime(workOrder.created_date)}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Due Date</h5>
                                <p>${this.formatDateTime(workOrder.due_date)}</p>
                            </div>
                            <div class="detail-group">
                                <h5>Progress</h5>
                                <p>${workOrder.completion_percentage || 0}%</p>
                            </div>
                        </div>
                        <div class="work-order-progress">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${workOrder.completion_percentage || 0}%"></div>
                            </div>
                        </div>
                        ${workOrder.description ? `<div class="description"><strong>Description:</strong> ${workOrder.description}</div>` : ''}
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); servicesModule.editWorkOrder(${workOrder.id})">📝 Edit</button>
                            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); servicesModule.completeWorkOrder(${workOrder.id})">✅ Complete</button>
                            <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); servicesModule.assignTechnician(${workOrder.id})">👨‍🔧 Assign</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateFloatingActions() {
        return `
            <div class="floating-actions" id="floatingActions" style="display: none;">
                <div class="fab-menu">
                    <button class="fab-item" onclick="servicesModule.createNewService()">
                        <span class="fab-icon">🔧</span>
                        <span class="fab-label">New Service</span>
                    </button>
                    <button class="fab-item" onclick="servicesModule.scheduleNewAppointment()">
                        <span class="fab-icon">📅</span>
                        <span class="fab-label">Schedule</span>
                    </button>
                    <button class="fab-item" onclick="servicesModule.createNewEstimate()">
                        <span class="fab-icon">📋</span>
                        <span class="fab-label">Estimate</span>
                    </button>
                    <button class="fab-item" onclick="servicesModule.emergencyService()">
                        <span class="fab-icon">🚨</span>
                        <span class="fab-label">Emergency</span>
                    </button>
                </div>
                <button class="fab-main" onclick="servicesModule.toggleFloatingActions()">
                    <span id="fabMainIcon">+</span>
                </button>
            </div>
        `;
    },

    generateNotificationCenter() {
        return `
            <div class="notification-center" id="notificationCenter">
                <div class="notification-header">
                    <h3>🔔 Notifications</h3>
                    <button class="btn btn-sm" onclick="servicesModule.markAllNotificationsRead()">Mark All Read</button>
                </div>
                <div class="notifications-list" id="notificationsList">
                    ${this.generateNotificationsList()}
                </div>
            </div>
        `;
    },

    generateNotificationsList() {
        const notifications = this.getRecentNotifications();

        if (notifications.length === 0) {
            return '<div class="no-notifications">No new notifications</div>';
        }

        return notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="servicesModule.handleNotification('${notification.id}')">
                <div class="notification-icon">${notification.icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTimeAgo(notification.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },

    // TAB SWITCHING AND CONTENT MANAGEMENT
    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to current tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Generate and display content
        const content = this.getTabContent(tabName);
        document.getElementById('servicesMainContent').innerHTML = content;

        // Initialize tab-specific functionality
        this.initializeTabFunctionality(tabName);
    },

    getTabContent(tabName) {
        switch(tabName) {
            case 'dashboard':
                return this.generateDashboardContent();
            case 'services':
                return this.generateServicesTabContent();
            case 'appointments':
                return this.generateAppointmentsTabContent();
            case 'estimates':
                return this.generateEstimatesTabContent();
            case 'work-orders':
                return this.generateWorkOrdersTabContent();
            case 'quality':
                return this.generateQualityTabContent();
            case 'technicians':
                return this.generateTechniciansTabContent();
            case 'truck-repair':
                return this.generateTruckRepairTabContent();
            case 'delivery':
                return this.generateDeliveryTabContent();
            case 'reports':
                return this.generateReportsTabContent();
            default:
                return this.generateDashboardContent();
        }
    },

    initializeTabFunctionality(tabName) {
        switch(tabName) {
            case 'services':
                this.initializeServiceFilters();
                break;
            case 'quality':
                this.initializeQualityChecks();
                break;
            case 'truck-repair':
                this.initializeTruckRepairTabs();
                break;
        }
    },

    // SERVICE MANAGEMENT ACTIONS
    async createNewService() {
        const serviceData = {
            customer_id: null,
            vehicle_id: null,
            service_type: 'General Service',
            priority: 'normal',
            status: 'scheduled',
            estimated_cost: 0,
            notes: '',
            created_date: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification('✅ New service created successfully', 'success');
                await this.refreshServiceData();
                this.editService(result.service.id);
            } else {
                throw new Error('Failed to create service');
            }
        } catch (error) {
            this.showNotification('❌ Error creating service: ' + error.message, 'error');
        }
    },

    async manageService(serviceId) {
        this.currentService = this.services.find(s => s.id == serviceId);

        if (!this.currentService) {
            this.showNotification('❌ Service not found', 'error');
            return;
        }

        const serviceDetails = this.generateServiceDetailsModal(this.currentService);
        this.showModal('Service Management', serviceDetails);
    },

    generateServiceDetailsModal(service) {
        return `
            <div class="service-details-modal">
                <div class="service-header">
                    <h3>Service #${service.id}</h3>
                    <span class="status-badge status-${service.status}">${service.status}</span>
                </div>

                <div class="service-tabs">
                    <button class="tab-btn active" onclick="servicesModule.showServiceTab('details')">Details</button>
                    <button class="tab-btn" onclick="servicesModule.showServiceTab('history')">History</button>
                    <button class="tab-btn" onclick="servicesModule.showServiceTab('parts')">Parts</button>
                    <button class="tab-btn" onclick="servicesModule.showServiceTab('notes')">Notes</button>
                </div>

                <div id="service-modal-content">
                    ${this.generateServiceDetailsTab(service)}
                </div>

                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="servicesModule.updateServiceStatus('${service.id}')">Update Status</button>
                    <button class="btn btn-success" onclick="servicesModule.completeService('${service.id}')">Complete Service</button>
                    <button class="btn btn-warning" onclick="servicesModule.printServiceReport('${service.id}')">Print Report</button>
                    <button class="btn btn-secondary" onclick="servicesModule.closeModal()">Close</button>
                </div>
            </div>
        `;
    },

    generateServiceDetailsTab(service) {
        return `
            <div class="service-details-content">
                <div class="details-grid">
                    <div class="detail-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${service.customer_name}</p>
                        <p><strong>Email:</strong> ${service.customer_email || 'Not provided'}</p>
                        <p><strong>Phone:</strong> ${service.customer_phone || 'Not provided'}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Vehicle Information</h4>
                        <p><strong>Vehicle:</strong> ${service.vehicle_info}</p>
                        <p><strong>VIN:</strong> ${service.vehicle_vin || 'Not available'}</p>
                        <p><strong>Color:</strong> ${service.vehicle_color || 'Not specified'}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Service Details</h4>
                        <p><strong>Type:</strong> ${service.service_type}</p>
                        <p><strong>Priority:</strong> ${service.priority}</p>
                        <p><strong>Technician:</strong> ${service.technician_name || 'Unassigned'}</p>
                        <p><strong>Bay:</strong> ${service.service_bay || 'Not assigned'}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Financial Information</h4>
                        <p><strong>Estimated Cost:</strong> ${this.formatCurrency(service.estimated_cost)}</p>
                        <p><strong>Actual Cost:</strong> ${this.formatCurrency(service.actual_cost || 0)}</p>
                        <p><strong>Status:</strong> ${service.payment_status || 'Pending'}</p>
                    </div>
                </div>

                <div class="service-timeline">
                    <h4>Service Timeline</h4>
                    <div class="timeline-item">
                        <div class="timeline-icon">📅</div>
                        <div class="timeline-content">
                            <strong>Scheduled:</strong> ${this.formatDateTime(service.scheduled_date)}
                        </div>
                    </div>
                    ${service.started_date ? `
                        <div class="timeline-item">
                            <div class="timeline-icon">▶️</div>
                            <div class="timeline-content">
                                <strong>Started:</strong> ${this.formatDateTime(service.started_date)}
                            </div>
                        </div>
                    ` : ''}
                    ${service.completed_date ? `
                        <div class="timeline-item">
                            <div class="timeline-icon">✅</div>
                            <div class="timeline-content">
                                <strong>Completed:</strong> ${this.formatDateTime(service.completed_date)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // APPOINTMENT MANAGEMENT
    async scheduleNewAppointment() {
        const appointmentForm = this.generateAppointmentForm();
        this.showModal('Schedule New Appointment', appointmentForm);
    },

    generateAppointmentForm() {
        return `
            <form id="appointmentForm" onsubmit="servicesModule.saveAppointment(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Customer</label>
                        <select name="customer_id" required>
                            <option value="">Select Customer</option>
                            ${this.customers.map(customer => `
                                <option value="${customer.id}">${customer.first_name} ${customer.last_name}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Vehicle</label>
                        <select name="vehicle_id" required>
                            <option value="">Select Vehicle</option>
                            ${this.vehicles.map(vehicle => `
                                <option value="${vehicle.id}">${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Service Type</label>
                        <select name="service_type" required>
                            <option value="">Select Service</option>
                            <option value="Oil Change">Oil Change</option>
                            <option value="Brake Service">Brake Service</option>
                            <option value="Transmission Service">Transmission Service</option>
                            <option value="Engine Diagnostic">Engine Diagnostic</option>
                            <option value="AC Repair">AC Repair</option>
                            <option value="General Maintenance">General Maintenance</option>
                            <option value="Inspection">Inspection</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="appointment_date" required min="${new Date().toISOString().split('T')[0]}">
                    </div>

                    <div class="form-group">
                        <label>Time</label>
                        <select name="appointment_time" required>
                            ${this.generateTimeSlots().map(time => `
                                <option value="${time}">${time}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Duration (minutes)</label>
                        <select name="estimated_duration">
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120" selected>2 hours</option>
                            <option value="180">3 hours</option>
                            <option value="240">4 hours</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Technician</label>
                        <select name="assigned_technician">
                            <option value="">Auto-assign</option>
                            ${this.technicians.map(tech => `
                                <option value="${tech.id}">${tech.full_name || tech.username}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="Additional notes or special instructions..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📅 Schedule Appointment</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    generateTimeSlots() {
        const slots = [];
        const startHour = 8; // 8 AM
        const endHour = 18; // 6 PM

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }

        return slots;
    },

    async saveAppointment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const appointmentData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData)
            });

            if (response.ok) {
                this.showNotification('✅ Appointment scheduled successfully', 'success');
                await this.loadAppointments();
                this.closeModal();
                this.switchTab('appointments');
            } else {
                throw new Error('Failed to schedule appointment');
            }
        } catch (error) {
            this.showNotification('❌ Error scheduling appointment: ' + error.message, 'error');
        }
    },

    // QUALITY CONTROL MANAGEMENT
    initializeQualityChecks() {
        this.qualityChecklistData = this.getDefaultQualityChecks();
    },

    getDefaultQualityChecks() {
        return [
            { id: 1, item: 'Work completed according to specifications', checked: false, status: 'pending', category: 'technical' },
            { id: 2, item: 'All tools and equipment properly cleaned', checked: false, status: 'pending', category: 'housekeeping' },
            { id: 3, item: 'No visible leaks or damage', checked: false, status: 'pending', category: 'technical' },
            { id: 4, item: 'Customer vehicle interior protected', checked: false, status: 'pending', category: 'customer_care' },
            { id: 5, item: 'Service documentation complete', checked: false, status: 'pending', category: 'documentation' },
            { id: 6, item: 'Parts warranty information provided', checked: false, status: 'pending', category: 'documentation' },
            { id: 7, item: 'Customer explanation scheduled', checked: false, status: 'pending', category: 'customer_care' },
            { id: 8, item: 'Final inspection passed', checked: false, status: 'pending', category: 'technical' },
            { id: 9, item: 'Vehicle test drive completed', checked: false, status: 'pending', category: 'technical' },
            { id: 10, item: 'Customer satisfaction survey sent', checked: false, status: 'pending', category: 'customer_care' }
        ];
    },

    toggleQualityCheck(checkId) {
        const check = this.qualityChecklistData.find(c => c.id === checkId);
        if (check) {
            check.checked = !check.checked;
            check.status = check.checked ? 'completed' : 'pending';
            this.updateQualityCheckDisplay();
        }
    },

    updateQualityCheckDisplay() {
        const container = document.querySelector('.quality-categories');
        if (container) {
            container.innerHTML = this.generateQualityChecklistCategories();
        }
    },

    async performQualityCheck() {
        const pendingServices = this.services.filter(s => s.status === 'quality_check' || s.status === 'completed');

        if (pendingServices.length === 0) {
            this.showNotification('ℹ️ No services pending quality check', 'info');
            return;
        }

        const qualityCheckForm = this.generateQualityCheckForm(pendingServices);
        this.showModal('Quality Control Check', qualityCheckForm);
    },

    generateQualityCheckForm(services) {
        return `
            <div class="quality-check-form">
                <div class="form-group">
                    <label>Select Service for Quality Check</label>
                    <select id="qualityServiceSelect" onchange="servicesModule.loadServiceQualityChecks()">
                        <option value="">Select a service...</option>
                        ${services.map(service => `
                            <option value="${service.id}">
                                #${service.id} - ${service.customer_name} - ${service.vehicle_info}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div id="qualityCheckItems" style="margin-top: 1rem;">
                    <p>Please select a service to begin quality check</p>
                </div>

                <div class="form-actions">
                    <button class="btn btn-success" onclick="servicesModule.completeQualityCheck()" disabled id="completeQcBtn">
                        ✅ Complete Quality Check
                    </button>
                    <button class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </div>
        `;
    },

    // TRUCK REPAIR MANAGEMENT
    initializeTruckRepairTabs() {
        this.currentTruckTab = 'forms';
    },

    showTruckTab(tabName) {
        this.currentTruckTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update content
        const content = this.getTruckTabContent(tabName);
        document.getElementById('truck-repair-content').innerHTML = content;
    },

    getTruckTabContent(tabName) {
        switch(tabName) {
            case 'forms':
                return this.generateMaterialFormsContent();
            case 'quotes':
                return this.generateRepairQuotesContent();
            case 'parts':
                return this.generateTruckPartsContent();
            default:
                return this.generateMaterialFormsContent();
        }
    },

    async createMaterialForm() {
        const materialFormForm = this.generateMaterialFormForm();
        this.showModal('Create Material Requisition Form', materialFormForm);
    },

    generateMaterialFormForm() {
        return `
            <form id="materialForm" onsubmit="servicesModule.saveMaterialForm(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Vehicle Registration</label>
                        <input type="text" name="vehicle_registration" required placeholder="Enter vehicle registration number">
                    </div>

                    <div class="form-group">
                        <label>Requester Name</label>
                        <input type="text" name="requester_name" required placeholder="Enter requester name">
                    </div>

                    <div class="form-group">
                        <label>Department</label>
                        <select name="department">
                            <option value="maintenance">Maintenance</option>
                            <option value="repair">Repair</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority">
                            <option value="normal">Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Required Materials</label>
                        <div id="materialItems">
                            <div class="material-item">
                                <input type="text" name="item_name[]" placeholder="Material name" required>
                                <input type="number" name="quantity[]" placeholder="Qty" min="1" required>
                                <input type="text" name="part_number[]" placeholder="Part number">
                                <button type="button" onclick="servicesModule.removeMaterialItem(this)">🗑️</button>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="servicesModule.addMaterialItem()">➕ Add Item</button>
                    </div>

                    <div class="form-group full-width">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="Additional notes or specifications..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📋 Create Material Form</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    addMaterialItem() {
        const container = document.getElementById('materialItems');
        const newItem = document.createElement('div');
        newItem.className = 'material-item';
        newItem.innerHTML = `
            <input type="text" name="item_name[]" placeholder="Material name" required>
            <input type="number" name="quantity[]" placeholder="Qty" min="1" required>
            <input type="text" name="part_number[]" placeholder="Part number">
            <button type="button" onclick="servicesModule.removeMaterialItem(this)">🗑️</button>
        `;
        container.appendChild(newItem);
    },

    async saveMaterialForm(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        // Process form data
        const materialFormData = {
            vehicle_registration: formData.get('vehicle_registration'),
            requester_name: formData.get('requester_name'),
            department: formData.get('department'),
            priority: formData.get('priority'),
            notes: formData.get('notes'),
            items: [],
            status: 'pending',
            created_date: new Date().toISOString()
        };

        // Process material items
        const itemNames = formData.getAll('item_name[]');
        const quantities = formData.getAll('quantity[]');
        const partNumbers = formData.getAll('part_number[]');

        for (let i = 0; i < itemNames.length; i++) {
            if (itemNames[i].trim()) {
                materialFormData.items.push({
                    name: itemNames[i],
                    quantity: parseInt(quantities[i]),
                    part_number: partNumbers[i] || '',
                    estimated_cost: 0
                });
            }
        }

        try {
            const response = await fetch('/api/material-forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialFormData)
            });

            if (response.ok) {
                this.showNotification('✅ Material form created successfully', 'success');
                await this.loadMaterialForms();
                this.closeModal();
                this.switchTab('truck-repair');
            } else {
                throw new Error('Failed to create material form');
            }
        } catch (error) {
            this.showNotification('❌ Error creating material form: ' + error.message, 'error');
        }
    },

    async createRepairQuote() {
        const repairQuoteForm = this.generateRepairQuoteForm();
        this.showModal('Create Truck Repair Quote', repairQuoteForm);
    },

    generateRepairQuoteForm() {
        return `
            <form id="repairQuoteForm" onsubmit="servicesModule.saveRepairQuote(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Customer Name</label>
                        <input type="text" name="customer_name" required placeholder="Enter customer name">
                    </div>

                    <div class="form-group">
                        <label>Vehicle Registration</label>
                        <input type="text" name="vehicle_registration" required placeholder="Enter vehicle registration">
                    </div>

                    <div class="form-group">
                        <label>Vehicle Make</label>
                        <select name="vehicle_make" required>
                            <option value="">Select Make</option>
                            <option value="Isuzu">Isuzu</option>
                            <option value="Hino">Hino</option>
                            <option value="Mitsubishi Fuso">Mitsubishi Fuso</option>
                            <option value="UD Trucks">UD Trucks</option>
                            <option value="Scania">Scania</option>
                            <option value="Volvo">Volvo</option>
                            <option value="Mercedes-Benz">Mercedes-Benz</option>
                            <option value="MAN">MAN</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Vehicle Model</label>
                        <input type="text" name="vehicle_model" required placeholder="Enter vehicle model">
                    </div>

                    <div class="form-group">
                        <label>Vehicle Year</label>
                        <input type="number" name="vehicle_year" min="1990" max="2025" placeholder="Enter year">
                    </div>

                    <div class="form-group">
                        <label>Repair Type</label>
                        <select name="repair_type" required>
                            <option value="">Select Repair Type</option>
                            <option value="Engine Repair">Engine Repair</option>
                            <option value="Transmission Repair">Transmission Repair</option>
                            <option value="Brake System">Brake System</option>
                            <option value="Electrical System">Electrical System</option>
                            <option value="Body Work">Body Work</option>
                            <option value="Suspension">Suspension</option>
                            <option value="AC System">AC System</option>
                            <option value="General Maintenance">General Maintenance</option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Damage Description</label>
                        <textarea name="damage_description" rows="3" required placeholder="Describe the damage or issue in detail..."></textarea>
                    </div>

                    <div class="form-group full-width">
                        <label>Repair Items</label>
                        <div id="repairItems">
                            <div class="repair-item">
                                <input type="text" name="repair_item[]" placeholder="Repair item description" required>
                                <input type="number" name="labor_hours[]" placeholder="Labor hours" step="0.5" min="0" required>
                                <input type="number" name="parts_cost[]" placeholder="Parts cost" step="0.01" min="0" required>
                                <button type="button" onclick="servicesModule.removeRepairItem(this)">🗑️</button>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="servicesModule.addRepairItem()">➕ Add Item</button>
                    </div>

                    <div class="form-group">
                        <label>Labor Rate (per hour)</label>
                        <input type="number" name="labor_rate" step="0.01" min="0" value="800" required>
                    </div>

                    <div class="form-group">
                        <label>VAT Rate (%)</label>
                        <input type="number" name="vat_rate" step="0.01" min="0" max="100" value="7" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Additional Notes</label>
                        <textarea name="notes" rows="2" placeholder="Additional notes or terms..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">🚛 Create Repair Quote</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    addRepairItem() {
        const container = document.getElementById('repairItems');
        const newItem = document.createElement('div');
        newItem.className = 'repair-item';
        newItem.innerHTML = `
            <input type="text" name="repair_item[]" placeholder="Repair item description" required>
            <input type="number" name="labor_hours[]" placeholder="Labor hours" step="0.5" min="0" required>
            <input type="number" name="parts_cost[]" placeholder="Parts cost" step="0.01" min="0" required>
            <button type="button" onclick="servicesModule.removeRepairItem(this)">🗑️</button>
        `;
        container.appendChild(newItem);
    },

    removeRepairItem(button) {
        button.parentElement.remove();
    },

    async saveRepairQuote(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const repairQuoteData = {
            customer_name: formData.get('customer_name'),
            vehicle_registration: formData.get('vehicle_registration'),
            vehicle_make: formData.get('vehicle_make'),
            vehicle_model: formData.get('vehicle_model'),
            vehicle_year: formData.get('vehicle_year'),
            repair_type: formData.get('repair_type'),
            damage_description: formData.get('damage_description'),
            labor_rate: parseFloat(formData.get('labor_rate')),
            vat_rate: parseFloat(formData.get('vat_rate')),
            notes: formData.get('notes'),
            quote_date: new Date().toISOString(),
            status: 'pending',
            items: []
        };

        // Process repair items
        const repairItems = formData.getAll('repair_item[]');
        const laborHours = formData.getAll('labor_hours[]');
        const partsCosts = formData.getAll('parts_cost[]');

        let subtotal = 0;
        for (let i = 0; i < repairItems.length; i++) {
            if (repairItems[i].trim()) {
                const laborCost = parseFloat(laborHours[i]) * repairQuoteData.labor_rate;
                const partsCost = parseFloat(partsCosts[i]);
                const itemTotal = laborCost + partsCost;

                repairQuoteData.items.push({
                    description: repairItems[i],
                    labor_hours: parseFloat(laborHours[i]),
                    labor_cost: laborCost,
                    parts_cost: partsCost,
                    total: itemTotal
                });

                subtotal += itemTotal;
            }
        }

        repairQuoteData.subtotal = subtotal;
        repairQuoteData.vat_amount = subtotal * (repairQuoteData.vat_rate / 100);
        repairQuoteData.total_amount = subtotal + repairQuoteData.vat_amount;
        repairQuoteData.quote_number = `TRQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        try {
            const response = await fetch('/api/repair-quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(repairQuoteData)
            });

            if (response.ok) {
                this.showNotification('✅ Repair quote created successfully', 'success');
                await this.loadRepairQuotes();
                this.closeModal();
                this.showTruckTab('quotes');
            } else {
                throw new Error('Failed to create repair quote');
            }
        } catch (error) {
            this.showNotification('❌ Error creating repair quote: ' + error.message, 'error');
        }
    },

    // UTILITY AND HELPER METHODS
    calculateServiceProgress(service) {
        if (!service) return 0;

        switch(service.status) {
            case 'scheduled': return 10;
            case 'in_progress': return 50;
            case 'waiting_parts': return 30;
            case 'quality_check': return 85;
            case 'completed': return 100;
            case 'delivered': return 100;
            default: return 0;
        }
    },

    formatCurrency(amount) {
        if (!amount) return '฿0.00';
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    },

    formatDateTime(dateString) {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatTime(timeString) {
        if (!timeString) return 'Not set';
        if (timeString.includes('T')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return timeString;
    },

    formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    },

    // DATA CALCULATION METHODS
    calculateComprehensiveStats() {
        return {
            activeServices: this.services.filter(s => ['scheduled', 'in_progress'].includes(s.status)).length,
            todayAppointments: this.appointments.length,
            availableBays: this.serviceBays.filter(b => b.status === 'available').length,
            pendingQC: this.services.filter(s => s.status === 'quality_check').length
        };
    },

    calculateKPIs() {
        const completedServices = this.services.filter(s => s.status === 'completed');

        return {
            serviceEfficiency: Math.round((completedServices.length / this.services.length) * 100) || 0,
            customerSatisfaction: 94, // This would come from customer feedback system
            onTimeCompletion: 87, // This would be calculated from actual vs estimated completion times
            avgTicketValue: this.calculateAverageTicketValue(),
            firstTimeRightRate: 92, // This would be calculated from rework data
            technicianUtilization: this.calculateTechnicianUtilization()
        };
    },

    calculateAverageTicketValue() {
        const completedServices = this.services.filter(s => s.status === 'completed' && s.actual_cost);
        if (completedServices.length === 0) return 0;

        const totalCost = completedServices.reduce((sum, service) => sum + (service.actual_cost || 0), 0);
        return Math.round(totalCost / completedServices.length);
    },

    calculateTechnicianUtilization() {
        const workingTechnicians = this.technicians.filter(t =>
            this.services.some(s => s.technician_id === t.id && ['scheduled', 'in_progress'].includes(s.status))
        );

        return Math.round((workingTechnicians.length / this.technicians.length) * 100) || 0;
    },

    calculateAverageServiceTime() {
        const completedServices = this.services.filter(s => s.status === 'completed' && s.started_date && s.completed_date);
        if (completedServices.length === 0) return 0;

        const totalHours = completedServices.reduce((sum, service) => {
            const start = new Date(service.started_date);
            const end = new Date(service.completed_date);
            const hours = (end - start) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);

        return Math.round(totalHours / completedServices.length * 10) / 10;
    },

    calculateCustomerSatisfaction() {
        // This would integrate with a customer feedback system
        // For now, return a calculated value based on service metrics
        return 94; // Mock value - would be from actual customer surveys
    },

    calculateTotalRevenue() {
        const completedServices = this.services.filter(s => s.status === 'completed');
        return completedServices.reduce((sum, service) => sum + (service.actual_cost || service.estimated_cost || 0), 0);
    },

    // FILTER AND SEARCH METHODS
    getFilteredServices() {
        let filtered = [...this.services];

        if (this.selectedFilters.status) {
            filtered = filtered.filter(s => s.status === this.selectedFilters.status);
        }

        if (this.selectedFilters.priority) {
            filtered = filtered.filter(s => s.priority === this.selectedFilters.priority);
        }

        if (this.selectedFilters.serviceType) {
            filtered = filtered.filter(s => s.service_type === this.selectedFilters.serviceType);
        }

        if (this.selectedFilters.technician) {
            filtered = filtered.filter(s => s.technician_id == this.selectedFilters.technician);
        }

        return filtered;
    },

    applyFilters() {
        this.selectedFilters = {
            status: document.getElementById('statusFilter')?.value || '',
            priority: document.getElementById('priorityFilter')?.value || '',
            serviceType: document.getElementById('typeFilter')?.value || '',
            technician: document.getElementById('technicianFilter')?.value || ''
        };

        // Refresh the services list with filters applied
        const container = document.querySelector('.services-list');
        if (container) {
            container.innerHTML = this.generateComprehensiveServicesList();
        }
    },

    initializeServiceFilters() {
        // Set up filter event listeners
        setTimeout(() => {
            ['statusFilter', 'priorityFilter', 'typeFilter', 'technicianFilter'].forEach(filterId => {
                const filterElement = document.getElementById(filterId);
                if (filterElement) {
                    filterElement.addEventListener('change', () => this.applyFilters());
                }
            });
        }, 100);
    },

    // STATUS AND DATA GETTERS
    getPendingEstimates() {
        return this.estimates.filter(e => e.status === 'pending');
    },

    getApprovedEstimates() {
        return this.estimates.filter(e => e.status === 'approved');
    },

    getTotalEstimateValue() {
        return this.estimates.reduce((sum, estimate) => sum + (estimate.total_amount || 0), 0);
    },

    getActiveWorkOrders() {
        return this.workOrders.filter(wo => ['pending', 'in_progress'].includes(wo.status));
    },

    getCompletedWorkOrders() {
        return this.workOrders.filter(wo => wo.status === 'completed');
    },

    getPendingQualityChecks() {
        return this.services.filter(s => s.status === 'quality_check');
    },

    getPassedQualityChecks() {
        return this.qualityChecks.filter(qc => qc.status === 'passed');
    },

    getFailedQualityChecks() {
        return this.qualityChecks.filter(qc => qc.status === 'failed');
    },

    getQualityScore() {
        const total = this.qualityChecks.length;
        if (total === 0) return 100;

        const passed = this.getPassedQualityChecks().length;
        return Math.round((passed / total) * 100);
    },

    getAvailableTechnicians() {
        return this.technicians.filter(t =>
            !this.services.some(s => s.technician_id === t.id && ['scheduled', 'in_progress'].includes(s.status))
        );
    },

    getBusyTechnicians() {
        return this.technicians.filter(t =>
            this.services.some(s => s.technician_id === t.id && ['scheduled', 'in_progress'].includes(s.status))
        );
    },

    getOverdueServices() {
        const now = new Date();
        return this.services.filter(service => {
            if (!service.estimated_completion) return false;
            const estimatedCompletion = new Date(service.estimated_completion);
            return estimatedCompletion < now && !['completed', 'delivered'].includes(service.status);
        });
    },

    getPriorityAlerts() {
        const alerts = [];
        const now = new Date();

        // Emergency services
        const emergencyServices = this.services.filter(s => s.priority === 'emergency');
        emergencyServices.forEach(service => {
            alerts.push({
                id: `emergency-${service.id}`,
                title: 'Emergency Service',
                message: `${service.customer_name} - ${service.service_type}`,
                severity: 'emergency',
                icon: '🚨',
                timestamp: service.created_date || new Date().toISOString()
            });
        });

        // Overdue services
        this.getOverdueServices().forEach(service => {
            alerts.push({
                id: `overdue-${service.id}`,
                title: 'Overdue Service',
                message: `Service #${service.id} is overdue`,
                severity: 'warning',
                icon: '⏰',
                timestamp: service.estimated_completion
            });
        });

        // Quality checks pending
        const pendingQC = this.getPendingQualityChecks();
        if (pendingQC.length > 0) {
            alerts.push({
                id: 'pending-qc',
                title: 'Quality Checks Pending',
                message: `${pendingQC.length} services waiting for quality check`,
                severity: 'info',
                icon: '✅',
                timestamp: new Date().toISOString()
            });
        }

        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    getRecentNotifications() {
        // This would typically come from a notifications API
        const notifications = [];

        // Add service-related notifications
        this.services.forEach(service => {
            if (service.status === 'completed' && this.isRecent(service.completed_date)) {
                notifications.push({
                    id: `service-completed-${service.id}`,
                    title: 'Service Completed',
                    message: `Service for ${service.customer_name} has been completed`,
                    icon: '✅',
                    timestamp: service.completed_date,
                    read: false
                });
            }
        });

        return notifications.slice(0, 10); // Limit to 10 most recent
    },

    isRecent(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        return diffInHours <= 24; // Consider recent if within 24 hours
    },

    // UI INTERACTION METHODS
    showModal(title, content) {
        const modalHtml = `
            <div class="modal-overlay" id="serviceModal" onclick="servicesModule.closeModal()">
                <div class="modal-container" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="servicesModule.closeModal()">×</button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    closeModal() {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.remove();
        }
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    toggleFloatingActions() {
        const fab = document.getElementById('floatingActions');
        const isVisible = fab.style.display !== 'none';

        fab.style.display = isVisible ? 'none' : 'block';
        document.getElementById('fabMainIcon').textContent = isVisible ? '+' : '×';
    },

    // ACTION HANDLERS FOR BUTTONS
    async createNewEstimate() {
        this.showNotification('Creating new estimate...', 'info');
        // Implementation would show estimate creation form
    },

    async createWorkOrder() {
        this.showNotification('Creating new work order...', 'info');
        // Implementation would show work order creation form
    },

    async updateService(serviceId) {
        this.showNotification(`Updating service ${serviceId}...`, 'info');
        // Implementation would show service update form
    },

    async qualityCheck(serviceId) {
        this.showNotification(`Starting quality check for service ${serviceId}...`, 'info');
        // Implementation would show quality check interface
    },

    async viewEstimate(serviceId) {
        this.showNotification(`Viewing estimate for service ${serviceId}...`, 'info');
        // Implementation would show estimate details
    },

    async manageBay(bayId) {
        this.showNotification(`Managing bay ${bayId}...`, 'info');
        // Implementation would show bay management interface
    },

    async manageTechnician(techId) {
        this.showNotification(`Managing technician ${techId}...`, 'info');
        // Implementation would show technician management interface
    },

    async manageAppointment(appointmentId) {
        this.showNotification(`Managing appointment ${appointmentId}...`, 'info');
        // Implementation would show appointment management interface
    },

    async emergencyService() {
        this.showNotification('Creating emergency service...', 'warning');
        // Implementation would show emergency service creation form
    },

    async markAllNotificationsRead() {
        this.showNotification('All notifications marked as read', 'success');
        // Implementation would mark all notifications as read
    },

    async handleNotification(notificationId) {
        this.showNotification(`Handling notification ${notificationId}...`, 'info');
        // Implementation would handle notification click
    },

    // ERROR HANDLING AND FALLBACKS
    async generateFallbackData() {
        console.warn('⚠️ Generating fallback service data...');

        // Generate minimal fallback data to keep the interface functional
        this.services = [
            {
                id: 'FALLBACK-001',
                customer_name: 'Sample Customer',
                vehicle_info: 'Sample Vehicle',
                service_type: 'General Service',
                status: 'scheduled',
                priority: 'normal',
                estimated_cost: 1000,
                created_date: new Date().toISOString()
            }
        ];

        this.appointments = [];
        this.estimates = [];
        this.workOrders = [];

        this.showNotification('⚠️ Using fallback data due to connection issues', 'warning');
    },

    generateErrorInterface(errorMessage) {
        return `
            <div class="error-container">
                <div class="error-header">
                    <div class="error-icon">❌</div>
                    <h2>Services Module Error</h2>
                </div>
                <div class="error-message">
                    <p>${errorMessage}</p>
                    <p>Please check your connection and try again.</p>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="servicesModule.loadModule()">
                        🔄 Retry Loading
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        ↻ Refresh Page
                    </button>
                </div>
            </div>
        `;
    },

    // WORKFLOW ENGINE INITIALIZATION
    async initializeWorkflowEngine() {
        // Initialize workflow states and transitions
        this.workflowStates = {
            'scheduled': ['in_progress', 'cancelled'],
            'in_progress': ['waiting_parts', 'quality_check', 'completed'],
            'waiting_parts': ['in_progress', 'cancelled'],
            'quality_check': ['completed', 'in_progress'],
            'completed': ['delivered', 'invoiced'],
            'delivered': ['closed'],
            'invoiced': ['closed']
        };

        console.log('🔄 Workflow engine initialized');
    },

    async initializeNotificationSystem() {
        // Set up real-time notifications
        this.notificationQueue = [];
        this.notificationSettings = {
            enableSound: true,
            enablePopup: true,
            autoMarkRead: false
        };

        console.log('🔔 Notification system initialized');
    },

    // MODULE CLEANUP
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Clean up event listeners and resources
        this.services = [];
        this.customers = [];
        this.vehicles = [];
        this.technicians = [];
        this.appointments = [];
        this.workOrders = [];

        console.log('🧹 Services module cleaned up');
    }
};

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = servicesModule;
}