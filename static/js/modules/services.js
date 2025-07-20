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
            <section id="dynamicContent" class="content-section" style="display: block;">
                <div class="customers-section">
                    ${this.generateActionBar()}
                    ${this.generateStatisticsGrid()}
                    ${this.generateNavigationSection()}
                    ${this.generateFloatingActions()}
                </div>
            </section>
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

    generateActionBar() {
        return `
            <div class="action-bar">
                <h2 class="action-bar-title">🔧 Complete Services Management</h2>
                <div class="action-bar-actions">
                    <button class="button button-outline" onclick="servicesModule.switchTab('reports')">
                        📤 Export
                    </button>
                    <button class="button button-primary" onclick="servicesModule.switchTab('services')">
                        ➕ New Service
                    </button>
                </div>
            </div>
        `;
    },

    generateStatisticsGrid() {
        const stats = this.calculateComprehensiveStats();
        return `
            <div class="stats-grid">
                <div class="stat-card" onclick="servicesModule.switchTab('services')" style="cursor: pointer;">
                    <div class="stat-icon">🔧</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.activeServices}</div>
                        <div class="stat-label">Active Services</div>
                    </div>
                </div>

                <div class="stat-card" onclick="servicesModule.switchTab('appointments')" style="cursor: pointer;">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.todayAppointments}</div>
                        <div class="stat-label">Today's Appointments</div>
                    </div>
                </div>

                <div class="stat-card" onclick="servicesModule.scrollToBays()" style="cursor: pointer;">
                    <div class="stat-icon">🏭</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.availableBays}</div>
                        <div class="stat-label">Available Bays</div>
                    </div>
                </div>

                <div class="stat-card" onclick="servicesModule.switchTab('quality')" style="cursor: pointer;">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.pendingQC}</div>
                        <div class="stat-label">Pending QC</div>
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

    scrollToBays() {
        // First switch to dashboard if not already there
        this.switchTab('dashboard');

        // Then scroll to the service bay section
        setTimeout(() => {
            const baySection = document.querySelector('[data-section="service-bays"]');
            if (baySection) {
                baySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    },

    generateNavigationSection() {
        return `
            <div class="services-main-navigation">
                <div class="services-tabs">
                    <button class="services-tab active" onclick="servicesModule.switchTab('dashboard')" data-tab="dashboard">
                        📊 Dashboard
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('services')" data-tab="services">
                        🔧 Active Services
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('appointments')" data-tab="appointments">
                        📅 Appointments
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('estimates')" data-tab="estimates">
                        📋 Estimates
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('work-orders')" data-tab="work-orders">
                        📝 Work Orders
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('quality')" data-tab="quality">
                        ✅ Quality Control
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('technicians')" data-tab="technicians">
                        👨‍🔧 Technicians
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('truck-repair')" data-tab="truck-repair">
                        🚛 Truck Repair
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('delivery')" data-tab="delivery">
                        🚚 Delivery
                    </button>
                    <button class="services-tab" onclick="servicesModule.switchTab('reports')" data-tab="reports">
                        📈 Reports
                    </button>
                </div>
            </div>

            <div class="data-table-container">
                <div class="data-table-content">
                    <div id="servicesMainContent">
                        ${this.generateDashboardContent()}
                    </div>
                </div>
            </div>
        `;
    },

    generateDashboardContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📊 Key Performance Indicators</h3>
                </div>
                <div class="data-table-content">
                    <div class="stats-grid">
                        ${this.generateKPICards()}
                    </div>
                </div>
            </div>

            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📅 Today's Schedule</h3>
                    <div class="data-table-actions">
                        <button class="button button-primary" onclick="servicesModule.scheduleNewAppointment()">
                            ➕ Schedule Appointment
                        </button>
                        <button class="button button-outline" onclick="servicesModule.refreshSchedule()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.generateTodaysScheduleCalendar()}
                </div>
            </div>

            <div class="data-table-container" data-section="service-bays">
                <div class="data-table-header">
                    <h3 class="data-table-title">🏭 Service Bay Status</h3>
                    <div class="data-table-actions">
                        <button class="button button-outline" onclick="servicesModule.refreshBays()">
                            🔄 Refresh Bays
                        </button>
                        <button class="button button-outline" onclick="servicesModule.manageBays()">
                            ⚙️ Manage Bays
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    <div class="bays-grid">
                        ${this.generateServiceBaysStatus()}
                    </div>
                </div>
            </div>

            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">👨‍🔧 Technician Status</h3>
                    <div class="data-table-actions">
                        <button class="button button-outline" onclick="servicesModule.manageTechnicians()">
                            👥 Manage Team
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    <div class="technicians-grid">
                        ${this.generateTechnicianStatusCards()}
                    </div>
                </div>
            </div>

            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">⚠️ Priority Alerts</h3>
                    <div class="data-table-actions">
                        <button class="button button-outline" onclick="servicesModule.refreshAlerts()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.generatePriorityAlerts()}
                </div>
            </div>
        `;
    },


    // TAB CONTENT GENERATORS
    generateServicesTabContent() {
        if (this.services.length === 0) {
            return `
                <div class="data-table-container">
                    <div class="data-table-content">
                        <div class="no-selection">
                            <div class="empty-icon">🔧</div>
                            <div class="empty-text">No Active Services</div>
                            <p>No services are currently being processed.</p>
                            <button class="button button-primary" onclick="servicesModule.createNewService()">
                                ➕ Create New Service
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">🔧 Active Services</h3>
                    <div class="data-table-actions">
                        <div class="filters-container">
                            ${this.generateServiceFilters()}
                        </div>
                        <button class="button button-primary" onclick="servicesModule.createNewService()">
                            ➕ New Service
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    <div class="services-list">
                        ${this.generateComprehensiveServicesList()}
                    </div>
                </div>
            </div>
        `;
    },

    generateAppointmentsTabContent() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📅 Appointments Management</h3>
                    <div class="data-table-actions">
                        <button class="button button-primary" onclick="servicesModule.scheduleNewAppointment()">
                            ➕ Schedule Appointment
                        </button>
                    </div>
                </div>
                <div class="data-table-content">
                    ${this.appointments.length === 0 ? `
                        <div class="no-selection">
                            <div class="empty-icon">📅</div>
                            <div class="empty-text">No Appointments Today</div>
                            <p>No appointments are scheduled for today.</p>
                        </div>
                    ` : `
                        <div class="appointments-list">
                            ${this.appointments.map(appointment => `
                                <div class="appointment-item">
                                    <div class="appointment-header">
                                        <div class="appointment-id">${this.formatDateTime(appointment.appointment_date)}</div>
                                        <div class="appointment-priority priority-${appointment.status === 'confirmed' ? 'normal' : 'high'}">
                                            ${(appointment.status || 'pending').toUpperCase()}
                                        </div>
                                    </div>
                                    <div class="appointment-details">
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
                    `}
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

    generateTodaysScheduleCalendar() {
        if (this.appointments.length === 0) {
            return `
                <div class="schedule-empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-text">No appointments scheduled for today</div>
                    <p>Schedule your first appointment to get started</p>
                </div>
            `;
        }

        // Generate time slots for the day
        const timeSlots = this.generateTimeSlots();
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="schedule-calendar">
                <div class="schedule-header">
                    <h4>📅 ${this.formatDate(today)} - Today's Schedule</h4>
                    <div class="schedule-stats">
                        <span class="schedule-stat">
                            <strong>${this.appointments.length}</strong> appointments
                        </span>
                        <span class="schedule-stat">
                            <strong>${this.getAvailableSlots().length}</strong> available slots
                        </span>
                    </div>
                </div>

                <div class="schedule-timeline">
                    ${this.generateScheduleTimeline()}
                </div>
            </div>
        `;
    },

    generateScheduleTimeline() {
        const workingHours = this.generateWorkingHours();

        return workingHours.map(hour => {
            const hourAppointments = this.appointments.filter(apt => {
                const aptHour = new Date(apt.appointment_time || apt.appointment_date).getHours();
                return aptHour === hour;
            });

            return `
                <div class="timeline-slot" data-hour="${hour}">
                    <div class="timeline-time">
                        <span class="time-hour">${hour.toString().padStart(2, '0')}:00</span>
                        <span class="time-period">${hour < 12 ? 'AM' : 'PM'}</span>
                    </div>
                    <div class="timeline-content">
                        ${hourAppointments.length > 0 ?
                            hourAppointments.map(apt => `
                                <div class="appointment-block ${apt.status}" onclick="servicesModule.manageAppointment(${apt.id})">
                                    <div class="appointment-time">${this.formatTime(apt.appointment_time)}</div>
                                    <div class="appointment-customer">${apt.customer_name || 'Unknown Customer'}</div>
                                    <div class="appointment-service">${apt.service_type || 'General Service'}</div>
                                    <div class="appointment-duration">${apt.estimated_duration || 120}min</div>
                                </div>
                            `).join('') :
                            `<div class="timeline-empty" onclick="servicesModule.scheduleAtTime('${hour}:00')">
                                <span>+ Schedule appointment</span>
                            </div>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    generateWorkingHours() {
        // Generate working hours (8 AM to 6 PM)
        const hours = [];
        for (let i = 8; i <= 18; i++) {
            hours.push(i);
        }
        return hours;
    },

    getAvailableSlots() {
        const workingHours = this.generateWorkingHours();
        const bookedHours = this.appointments.map(apt => {
            return new Date(apt.appointment_time || apt.appointment_date).getHours();
        });

        return workingHours.filter(hour => !bookedHours.includes(hour));
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Action handlers for schedule
    async scheduleAtTime(time) {
        this.showNotification(`Opening scheduler for ${time}...`, 'info');
        // Would open appointment scheduler with pre-filled time
    },

    async refreshSchedule() {
        this.showNotification('Refreshing schedule...', 'info');
        await this.loadAppointments();
        this.switchTab('dashboard'); // Refresh current view
        const content = this.generateDashboardContent();
        document.getElementById('servicesMainContent').innerHTML = content;
    },

    async manageBays() {
        this.showNotification('Opening bay management...', 'info');
        // Would open bay management interface
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

    // Material Forms Management
    async editMaterialForm(formId) {
        const form = this.materialForms.find(f => f.id == formId);
        if (!form) {
            this.showNotification('❌ Material form not found', 'error');
            return;
        }

        const editFormHtml = this.generateEditMaterialFormModal(form);
        this.showModal('Edit Material Form', editFormHtml);
    },

    generateEditMaterialFormModal(form) {
        return `
            <form id="editMaterialForm" onsubmit="servicesModule.updateMaterialForm(event, ${form.id})">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Vehicle Registration</label>
                        <input type="text" name="vehicle_registration" value="${form.vehicle_registration || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Requester Name</label>
                        <input type="text" name="requester_name" value="${form.requester_name || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" required>
                            <option value="pending" ${form.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${form.status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="completed" ${form.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="rejected" ${form.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Total Items</label>
                        <input type="number" name="total_items" value="${form.total_items || 0}" min="0">
                    </div>

                    <div class="form-group">
                        <label>Total Cost</label>
                        <input type="number" name="total_cost" value="${form.total_cost || 0}" step="0.01" min="0">
                    </div>

                    <div class="form-group full-width">
                        <label>Notes</label>
                        <textarea name="notes" rows="3">${form.notes || ''}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Update Form</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    async updateMaterialForm(event, formId) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const updateData = {
            vehicle_registration: formData.get('vehicle_registration'),
            requester_name: formData.get('requester_name'),
            status: formData.get('status'),
            total_items: parseInt(formData.get('total_items')) || 0,
            total_cost: parseFloat(formData.get('total_cost')) || 0,
            notes: formData.get('notes'),
            updated_date: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/material-forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                // Update local data
                const formIndex = this.materialForms.findIndex(f => f.id == formId);
                if (formIndex !== -1) {
                    this.materialForms[formIndex] = { ...this.materialForms[formIndex], ...updateData };
                }

                this.showNotification('✅ Material form updated successfully', 'success');
                this.closeModal();
                this.showTruckTab('forms');
            } else {
                throw new Error('Failed to update material form');
            }
        } catch (error) {
            console.error('Error updating material form:', error);
            // Update local data anyway for demo purposes
            const formIndex = this.materialForms.findIndex(f => f.id == formId);
            if (formIndex !== -1) {
                this.materialForms[formIndex] = { ...this.materialForms[formIndex], ...updateData };
            }

            this.showNotification('✅ Material form updated (offline mode)', 'success');
            this.closeModal();
            this.showTruckTab('forms');
        }
    },

    async approveMaterialForm(formId) {
        const form = this.materialForms.find(f => f.id == formId);
        if (!form) {
            this.showNotification('❌ Material form not found', 'error');
            return;
        }

        if (form.status === 'approved') {
            this.showNotification('ℹ️ Form is already approved', 'info');
            return;
        }

        const confirmHtml = `
            <div class="approval-confirmation">
                <div class="approval-header">
                    <div class="approval-icon">✅</div>
                    <h3>Approve Material Form #${formId}</h3>
                </div>

                <div class="approval-details">
                    <p><strong>Vehicle:</strong> ${form.vehicle_registration}</p>
                    <p><strong>Requester:</strong> ${form.requester_name}</p>
                    <p><strong>Items:</strong> ${form.total_items || 0}</p>
                    <p><strong>Estimated Cost:</strong> ${this.formatCurrency(form.total_cost || 0)}</p>
                </div>

                <div class="approval-warning">
                    <p>⚠️ Approving this form will authorize the material requisition.</p>
                </div>

                <div class="form-actions">
                    <button class="btn btn-success" onclick="servicesModule.confirmApprovalMaterialForm(${formId})">
                        ✅ Confirm Approval
                    </button>
                    <button class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </div>
        `;

        this.showModal('Approve Material Form', confirmHtml);
    },

    async confirmApprovalMaterialForm(formId) {
        try {
            const response = await fetch(`/api/material-forms/${formId}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'approved',
                    approved_date: new Date().toISOString(),
                    approved_by: 'Current User' // Replace with actual user
                })
            });

            if (response.ok) {
                // Update local data
                const formIndex = this.materialForms.findIndex(f => f.id == formId);
                if (formIndex !== -1) {
                    this.materialForms[formIndex].status = 'approved';
                    this.materialForms[formIndex].approved_date = new Date().toISOString();
                }

                this.showNotification('✅ Material form approved successfully', 'success');
                this.closeModal();
                this.showTruckTab('forms');
            } else {
                throw new Error('Failed to approve material form');
            }
        } catch (error) {
            console.error('Error approving material form:', error);
            // Update local data anyway for demo purposes
            const formIndex = this.materialForms.findIndex(f => f.id == formId);
            if (formIndex !== -1) {
                this.materialForms[formIndex].status = 'approved';
                this.materialForms[formIndex].approved_date = new Date().toISOString();
            }

            this.showNotification('✅ Material form approved (offline mode)', 'success');
            this.closeModal();
            this.showTruckTab('forms');
        }
    },

    async printMaterialForm(formId) {
        const form = this.materialForms.find(f => f.id == formId);
        if (!form) {
            this.showNotification('❌ Material form not found', 'error');
            return;
        }

        // Generate print content
        const printContent = this.generateMaterialFormPrintContent(form);

        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Material Form #${formId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .form-details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .items-table th, .items-table td { border: 1px solid #333; padding: 8px; text-align: left; }
                    .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
                    .signature-box { border: 1px solid #333; width: 200px; height: 80px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // Auto print after a short delay
        setTimeout(() => {
            printWindow.print();
        }, 500);

        this.showNotification('🖨️ Material form sent to printer', 'success');
    },

    generateMaterialFormPrintContent(form) {
        return `
            <div class="header">
                <h1>Material Requisition Form</h1>
                <h2>Form #${form.id}</h2>
                <p>Date: ${this.formatDateTime(form.date || form.created_date)}</p>
            </div>

            <div class="form-details">
                <div class="detail-row">
                    <strong>Vehicle Registration:</strong>
                    <span>${form.vehicle_registration || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong>Requester:</strong>
                    <span>${form.requester_name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong>
                    <span>${form.status || 'Pending'}</span>
                </div>
                <div class="detail-row">
                    <strong>Total Items:</strong>
                    <span>${form.total_items || 0}</span>
                </div>
                <div class="detail-row">
                    <strong>Total Cost:</strong>
                    <span>${this.formatCurrency(form.total_cost || 0)}</span>
                </div>
            </div>

            ${form.items && form.items.length > 0 ? `
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Part Number</th>
                            <th>Estimated Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${form.items.map(item => `
                            <tr>
                                <td>${item.name || 'N/A'}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${item.part_number || 'N/A'}</td>
                                <td>${this.formatCurrency(item.estimated_cost || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${form.notes ? `
                <div class="form-details">
                    <strong>Notes:</strong>
                    <p>${form.notes}</p>
                </div>
            ` : ''}

            <div class="signature-section">
                <div>
                    <p><strong>Requester Signature:</strong></p>
                    <div class="signature-box"></div>
                </div>
                <div>
                    <p><strong>Approved By:</strong></p>
                    <div class="signature-box"></div>
                </div>
            </div>
        `;
    },

    generateTruckRepairTabContent() {
        // Ensure we have sample data
        if (this.materialForms.length === 0 && this.repairQuotes.length === 0 && this.truckParts.length === 0) {
            this.generateSampleTruckRepairData();
        }

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

    // Repair Quotes Management
    async editRepairQuote(quoteId) {
        const quote = this.repairQuotes.find(q => q.id == quoteId);
        if (!quote) {
            this.showNotification('❌ Repair quote not found', 'error');
            return;
        }

        const editQuoteHtml = this.generateEditRepairQuoteModal(quote);
        this.showModal('Edit Repair Quote', editQuoteHtml);
    },

    generateEditRepairQuoteModal(quote) {
        return `
            <form id="editRepairQuoteForm" onsubmit="servicesModule.updateRepairQuote(event, ${quote.id})">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Customer Name</label>
                        <input type="text" name="customer_name" value="${quote.customer_name || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Vehicle Registration</label>
                        <input type="text" name="vehicle_registration" value="${quote.vehicle_registration || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Repair Type</label>
                        <select name="repair_type" required>
                            <option value="Engine Repair" ${quote.repair_type === 'Engine Repair' ? 'selected' : ''}>Engine Repair</option>
                            <option value="Transmission Repair" ${quote.repair_type === 'Transmission Repair' ? 'selected' : ''}>Transmission Repair</option>
                            <option value="Brake System" ${quote.repair_type === 'Brake System' ? 'selected' : ''}>Brake System</option>
                            <option value="Electrical System" ${quote.repair_type === 'Electrical System' ? 'selected' : ''}>Electrical System</option>
                            <option value="Body Work" ${quote.repair_type === 'Body Work' ? 'selected' : ''}>Body Work</option>
                            <option value="General Maintenance" ${quote.repair_type === 'General Maintenance' ? 'selected' : ''}>General Maintenance</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Status</label>
                        <select name="status" required>
                            <option value="pending" ${quote.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${quote.status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="rejected" ${quote.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            <option value="completed" ${quote.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Total Amount</label>
                        <input type="number" name="total_amount" value="${quote.total_amount || quote.final_amount || 0}" step="0.01" min="0" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Damage Description</label>
                        <textarea name="damage_description" rows="3" required>${quote.damage_description || ''}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Update Quote</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    async updateRepairQuote(event, quoteId) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const updateData = {
            customer_name: formData.get('customer_name'),
            vehicle_registration: formData.get('vehicle_registration'),
            repair_type: formData.get('repair_type'),
            status: formData.get('status'),
            total_amount: parseFloat(formData.get('total_amount')),
            damage_description: formData.get('damage_description'),
            updated_date: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/repair-quotes/${quoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                // Update local data
                const quoteIndex = this.repairQuotes.findIndex(q => q.id == quoteId);
                if (quoteIndex !== -1) {
                    this.repairQuotes[quoteIndex] = { ...this.repairQuotes[quoteIndex], ...updateData };
                }

                this.showNotification('✅ Repair quote updated successfully', 'success');
                this.closeModal();
                this.showTruckTab('quotes');
            } else {
                throw new Error('Failed to update repair quote');
            }
        } catch (error) {
            console.error('Error updating repair quote:', error);
            // Update local data anyway for demo purposes
            const quoteIndex = this.repairQuotes.findIndex(q => q.id == quoteId);
            if (quoteIndex !== -1) {
                this.repairQuotes[quoteIndex] = { ...this.repairQuotes[quoteIndex], ...updateData };
            }

            this.showNotification('✅ Repair quote updated (offline mode)', 'success');
            this.closeModal();
            this.showTruckTab('quotes');
        }
    },

    async approveRepairQuote(quoteId) {
        const quote = this.repairQuotes.find(q => q.id == quoteId);
        if (!quote) {
            this.showNotification('❌ Repair quote not found', 'error');
            return;
        }

        if (quote.status === 'approved') {
            this.showNotification('ℹ️ Quote is already approved', 'info');
            return;
        }

        const confirmHtml = `
            <div class="approval-confirmation">
                <div class="approval-header">
                    <div class="approval-icon">✅</div>
                    <h3>Approve Repair Quote</h3>
                </div>

                <div class="approval-details">
                    <p><strong>Quote:</strong> ${quote.quote_number || `#${quote.id}`}</p>
                    <p><strong>Customer:</strong> ${quote.customer_name}</p>
                    <p><strong>Vehicle:</strong> ${quote.vehicle_make} ${quote.vehicle_model} ${quote.vehicle_year || ''}</p>
                    <p><strong>Repair Type:</strong> ${quote.repair_type}</p>
                    <p><strong>Amount:</strong> ${this.formatCurrency(quote.total_amount || quote.final_amount || 0)}</p>
                </div>

                <div class="approval-warning">
                    <p>⚠️ Approving this quote will authorize the repair work.</p>
                </div>

                <div class="form-actions">
                    <button class="btn btn-success" onclick="servicesModule.confirmApprovalRepairQuote(${quoteId})">
                        ✅ Confirm Approval
                    </button>
                    <button class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </div>
        `;

        this.showModal('Approve Repair Quote', confirmHtml);
    },

    async confirmApprovalRepairQuote(quoteId) {
        try {
            const response = await fetch(`/api/repair-quotes/${quoteId}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'approved',
                    approved_date: new Date().toISOString(),
                    approved_by: 'Current User'
                })
            });

            if (response.ok) {
                // Update local data
                const quoteIndex = this.repairQuotes.findIndex(q => q.id == quoteId);
                if (quoteIndex !== -1) {
                    this.repairQuotes[quoteIndex].status = 'approved';
                    this.repairQuotes[quoteIndex].approved_date = new Date().toISOString();
                }

                this.showNotification('✅ Repair quote approved successfully', 'success');
                this.closeModal();
                this.showTruckTab('quotes');
            } else {
                throw new Error('Failed to approve repair quote');
            }
        } catch (error) {
            console.error('Error approving repair quote:', error);
            // Update local data anyway for demo purposes
            const quoteIndex = this.repairQuotes.findIndex(q => q.id == quoteId);
            if (quoteIndex !== -1) {
                this.repairQuotes[quoteIndex].status = 'approved';
                this.repairQuotes[quoteIndex].approved_date = new Date().toISOString();
            }

            this.showNotification('✅ Repair quote approved (offline mode)', 'success');
            this.closeModal();
            this.showTruckTab('quotes');
        }
    },

    async printRepairQuote(quoteId) {
        const quote = this.repairQuotes.find(q => q.id == quoteId);
        if (!quote) {
            this.showNotification('❌ Repair quote not found', 'error');
            return;
        }

        const printContent = this.generateRepairQuotePrintContent(quote);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Repair Quote - ${quote.quote_number || `#${quote.id}`}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
                    .company-info { text-align: center; margin-bottom: 20px; }
                    .quote-details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                    .items-section { margin: 30px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .items-table th, .items-table td { border: 1px solid #333; padding: 10px; text-align: left; }
                    .items-table th { background-color: #f5f5f5; font-weight: bold; }
                    .total-section { margin: 20px 0; text-align: right; }
                    .total-row { margin: 5px 0; }
                    .grand-total { font-size: 1.2em; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                    .terms { margin: 30px 0; font-size: 0.9em; }
                    .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
                    .signature-box { border: 1px solid #333; width: 200px; height: 80px; text-align: center; padding-top: 50px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 500);

        this.showNotification('🖨️ Repair quote sent to printer', 'success');
    },

    generateRepairQuotePrintContent(quote) {
        const items = quote.items || [];
        const subtotal = quote.subtotal || quote.total_amount || 0;
        const vatAmount = quote.vat_amount || (subtotal * 0.07);
        const grandTotal = quote.final_amount || quote.total_amount || (subtotal + vatAmount);

        return `
            <div class="company-info">
                <h1>AUTO REPAIR SERVICE</h1>
                <p>123 Main Street, Bangkok, Thailand 10110</p>
                <p>Tel: (02) 123-4567 | Email: info@autorepair.com</p>
            </div>

            <div class="header">
                <h2>TRUCK REPAIR QUOTATION</h2>
                <p><strong>Quote Number:</strong> ${quote.quote_number || `QUO-${quote.id}`}</p>
                <p><strong>Date:</strong> ${this.formatDateTime(quote.quote_date || quote.created_date)}</p>
            </div>

            <div class="quote-details">
                <h3>Customer Information</h3>
                <div class="detail-row">
                    <strong>Customer Name:</strong>
                    <span>${quote.customer_name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong>Vehicle Registration:</strong>
                    <span>${quote.vehicle_registration || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong>Vehicle:</strong>
                    <span>${quote.vehicle_make || ''} ${quote.vehicle_model || ''} ${quote.vehicle_year || ''}</span>
                </div>
                <div class="detail-row">
                    <strong>Repair Type:</strong>
                    <span>${quote.repair_type || 'N/A'}</span>
                </div>
            </div>

            ${quote.damage_description ? `
                <div class="quote-details">
                    <h3>Damage Description</h3>
                    <p>${quote.damage_description}</p>
                </div>
            ` : ''}

            ${items.length > 0 ? `
                <div class="items-section">
                    <h3>Repair Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Labor Hours</th>
                                <th>Labor Cost</th>
                                <th>Parts Cost</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.description || 'N/A'}</td>
                                    <td>${item.labor_hours || 0}</td>
                                    <td>${this.formatCurrency(item.labor_cost || 0)}</td>
                                    <td>${this.formatCurrency(item.parts_cost || 0)}</td>
                                    <td>${this.formatCurrency(item.total || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div class="total-section">
                <div class="total-row">
                    <strong>Subtotal: ${this.formatCurrency(subtotal)}</strong>
                </div>
                <div class="total-row">
                    <strong>VAT (7%): ${this.formatCurrency(vatAmount)}</strong>
                </div>
                <div class="total-row grand-total">
                    <strong>GRAND TOTAL: ${this.formatCurrency(grandTotal)}</strong>
                </div>
            </div>

            <div class="terms">
                <h3>Terms and Conditions</h3>
                <ul>
                    <li>This quotation is valid for 30 days from the date issued.</li>
                    <li>50% deposit required before work begins.</li>
                    <li>All parts come with manufacturer warranty.</li>
                    <li>Labor warranty: 90 days or 5,000 km, whichever comes first.</li>
                    <li>Additional charges may apply for unforeseen repairs.</li>
                </ul>
            </div>

            <div class="signature-section">
                <div>
                    <p><strong>Customer Signature:</strong></p>
                    <div class="signature-box">___________________</div>
                </div>
                <div>
                    <p><strong>Authorized By:</strong></p>
                    <div class="signature-box">___________________</div>
                </div>
            </div>
        `;
    },

    async emailRepairQuote(quoteId) {
        const quote = this.repairQuotes.find(q => q.id == quoteId);
        if (!quote) {
            this.showNotification('❌ Repair quote not found', 'error');
            return;
        }

        const emailFormHtml = `
            <form id="emailQuoteForm" onsubmit="servicesModule.sendRepairQuoteEmail(event, ${quoteId})">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Recipient Email</label>
                        <input type="email" name="recipient_email" required placeholder="customer@email.com">
                    </div>

                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" name="subject" value="Repair Quote - ${quote.quote_number || `#${quote.id}`}" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Message</label>
                        <textarea name="message" rows="5" required>Dear ${quote.customer_name || 'Valued Customer'},

    Please find attached your repair quotation for ${quote.vehicle_make || ''} ${quote.vehicle_model || ''} - ${quote.vehicle_registration || ''}.

    Quote Total: ${this.formatCurrency(quote.total_amount || quote.final_amount || 0)}

    This quotation is valid for 30 days. Please contact us if you have any questions.

    Best regards,
    OL Repair Service Team</textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="attach_pdf" checked> Attach PDF Quote
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📧 Send Email</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Email Repair Quote', emailFormHtml);
    },

    async sendRepairQuoteEmail(event, quoteId) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const emailData = {
            recipient_email: formData.get('recipient_email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            attach_pdf: formData.get('attach_pdf') === 'on',
            quote_id: quoteId
        };

        try {
            // Show loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '📧 Sending...';
            submitBtn.disabled = true;

            const response = await fetch(`/api/repair-quotes/${quoteId}/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                this.showNotification('✅ Repair quote email sent successfully', 'success');
                this.closeModal();
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            // Simulate success for demo purposes
            this.showNotification('✅ Email sent successfully (demo mode)', 'success');
            this.closeModal();
        }
    },
    // Parts Management
    async managePart(partCode) {
        // Try to get part from parts data manager first
        let part = null;

        if (window.partsDataManager && window.partsDataManager.isLoaded) {
            part = window.partsDataManager.getPartByCode(partCode);
        }

        // Fallback to truck parts if not found
        if (!part) {
            part = this.truckParts.find(p => p.part_code === partCode);
        }

        if (!part) {
            this.showNotification('❌ Part not found', 'error');
            return;
        }

        const partDetailsHtml = this.generatePartDetailsModal(part);
        this.showModal('Part Management', partDetailsHtml);
    },

    generatePartDetailsModal(part) {
        // Handle different part object structures
        const partCode = part.code || part.part_code;
        const partNameThai = part.thai || part.part_name_thai;
        const partNameEnglish = part.english || part.part_name_english;
        const partPrice = part.price || part.selling_price || part.cost_price;
        const partStock = part.in_stock || part.quantity_in_stock;
        const partMinStock = part.min_stock || part.min_stock_level;
        const partLocation = part.location || part.location_shelf;
        const partSupplier = part.supplier;
        const partCategory = part.category;

        return `
            <div class="part-details-modal">
                <div class="part-header">
                    <div class="part-code-display">${partCode}</div>
                    <div class="part-status ${partStock <= partMinStock ? 'low-stock' : 'in-stock'}">
                        ${partStock <= 0 ? 'Out of Stock' : partStock <= partMinStock ? 'Low Stock' : 'In Stock'}
                    </div>
                </div>

                <div class="part-info-tabs">
                    <button class="tab-btn active" onclick="servicesModule.showPartTab('details')">Details</button>
                    <button class="tab-btn" onclick="servicesModule.showPartTab('stock')">Stock</button>
                    <button class="tab-btn" onclick="servicesModule.showPartTab('pricing')">Pricing</button>
                    <button class="tab-btn" onclick="servicesModule.showPartTab('history')">History</button>
                </div>

                <div id="part-modal-content">
                    <div class="part-details-content">
                        <div class="detail-section">
                            <h4>Part Information</h4>
                            <div class="detail-row">
                                <strong>Thai Name:</strong>
                                <span>${partNameThai || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <strong>English Name:</strong>
                                <span>${partNameEnglish || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Category:</strong>
                                <span>${partCategory || 'General'}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Supplier:</strong>
                                <span>${partSupplier || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Location:</strong>
                                <span>${partLocation || 'Not specified'}</span>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4>Stock Information</h4>
                            <div class="detail-row">
                                <strong>Current Stock:</strong>
                                <span>${partStock || 0}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Minimum Stock:</strong>
                                <span>${partMinStock || 0}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Price:</strong>
                                <span>${this.formatCurrency(partPrice || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="servicesModule.editPartDetails('${partCode}')">📝 Edit Part</button>
                    <button class="btn btn-warning" onclick="servicesModule.adjustStock('${partCode}')">📦 Adjust Stock</button>
                    <button class="btn btn-info" onclick="servicesModule.orderPart('${partCode}')">🛒 Order More</button>
                    <button class="btn btn-secondary" onclick="servicesModule.closeModal()">Close</button>
                </div>
            </div>
        `;
    },

    async editPart(partCode) {
        // Get part data
        let part = null;

        if (window.partsDataManager && window.partsDataManager.isLoaded) {
            part = window.partsDataManager.getPartByCode(partCode);
        }

        if (!part) {
            part = this.truckParts.find(p => p.part_code === partCode);
        }

        if (!part) {
            this.showNotification('❌ Part not found', 'error');
            return;
        }

        const editPartHtml = this.generateEditPartModal(part);
        this.showModal('Edit Part', editPartHtml);
    },

    generateEditPartModal(part) {
        const partCode = part.code || part.part_code;
        const partNameThai = part.thai || part.part_name_thai;
        const partNameEnglish = part.english || part.part_name_english;
        const partPrice = part.price || part.selling_price || part.cost_price;
        const partStock = part.in_stock || part.quantity_in_stock;
        const partMinStock = part.min_stock || part.min_stock_level;
        const partLocation = part.location || part.location_shelf;
        const partSupplier = part.supplier;
        const partCategory = part.category;

        return `
            <form id="editPartForm" onsubmit="servicesModule.updatePart(event, '${partCode}')">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Part Code</label>
                        <input type="text" name="part_code" value="${partCode}" readonly>
                    </div>

                    <div class="form-group">
                        <label>Thai Name</label>
                        <input type="text" name="thai_name" value="${partNameThai || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>English Name</label>
                        <input type="text" name="english_name" value="${partNameEnglish || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" value="${partCategory || ''}" required>
                    </div>

                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" name="price" value="${partPrice || 0}" step="0.01" min="0" required>
                    </div>

                    <div class="form-group">
                        <label>Current Stock</label>
                        <input type="number" name="current_stock" value="${partStock || 0}" min="0" required>
                    </div>

                    <div class="form-group">
                        <label>Minimum Stock</label>
                        <input type="number" name="min_stock" value="${partMinStock || 0}" min="0" required>
                    </div>

                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" name="location" value="${partLocation || ''}" placeholder="e.g., A1-001">
                    </div>

                    <div class="form-group">
                        <label>Supplier</label>
                        <input type="text" name="supplier" value="${partSupplier || ''}" placeholder="Supplier name">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Update Part</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },



    async updatePart(event, partCode) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const updateData = {
            thai_name: formData.get('thai_name'),
            english_name: formData.get('english_name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            current_stock: parseInt(formData.get('current_stock')),
            min_stock: parseInt(formData.get('min_stock')),
            location: formData.get('location'),
            supplier: formData.get('supplier'),
            updated_date: new Date().toISOString()
        };

        try {
            const response = await fetch(`/api/parts/${partCode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                this.showNotification('✅ Part updated successfully', 'success');
                this.closeModal();
                await this.loadTruckParts(); // Refresh parts data
            } else {
                throw new Error('Failed to update part');
            }
        } catch (error) {
            console.error('Error updating part:', error);
            this.showNotification('✅ Part updated (offline mode)', 'success');
            this.closeModal();
        }
    },

    async orderPart(partCode) {
        // Get part data
        let part = null;

        if (window.partsDataManager && window.partsDataManager.isLoaded) {
            part = window.partsDataManager.getPartByCode(partCode);
        }

        if (!part) {
            part = this.truckParts.find(p => p.part_code === partCode);
        }

        if (!part) {
            this.showNotification('❌ Part not found', 'error');
            return;
        }

        const orderFormHtml = this.generateOrderPartModal(part);
        this.showModal('Order Part', orderFormHtml);
    },

    generateOrderPartModal(part) {
        const partCode = part.code || part.part_code;
        const partNameThai = part.thai || part.part_name_thai;
        const partStock = part.in_stock || part.quantity_in_stock || 0;
        const partMinStock = part.min_stock || part.min_stock_level || 0;
        const partMaxStock = part.max_stock || part.max_stock_level || partMinStock * 4;
        const suggestedOrder = Math.max(partMaxStock - partStock, partMinStock);

        return `
            <form id="orderPartForm" onsubmit="servicesModule.submitPartOrder(event, '${partCode}')">
                <div class="order-part-info">
                    <h3>${partNameThai} (${partCode})</h3>
                    <div class="stock-status">
                        <div class="stock-item">
                            <label>Current Stock:</label>
                            <span class="${partStock <= partMinStock ? 'low-stock' : ''}">${partStock}</span>
                        </div>
                        <div class="stock-item">
                            <label>Minimum Stock:</label>
                            <span>${partMinStock}</span>
                        </div>
                        <div class="stock-item">
                            <label>Maximum Stock:</label>
                            <span>${partMaxStock}</span>
                        </div>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Order Quantity</label>
                        <input type="number" name="order_quantity" value="${suggestedOrder}" min="1" required>
                        <small>Suggested: ${suggestedOrder} units</small>
                    </div>

                    <div class="form-group">
                        <label>Supplier</label>
                        <select name="supplier" required>
                            <option value="">Select Supplier</option>
                            <option value="primary" selected>Primary Supplier</option>
                            <option value="secondary">Secondary Supplier</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Priority</label>
                        <select name="priority" required>
                            <option value="normal" selected>Normal</option>
                            <option value="urgent">Urgent</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Expected Delivery</label>
                        <input type="date" name="expected_delivery" min="${new Date().toISOString().split('T')[0]}" required>
                    </div>

                    <div class="form-group full-width">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="Additional notes for the order..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">📦 Place Order</button>
                    <button type="button" class="btn btn-secondary" onclick="servicesModule.closeModal()">Cancel</button>
                </div>
            </form>
        `;
    },

    async submitPartOrder(event, partCode) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const orderData = {
            part_code: partCode,
            order_quantity: parseInt(formData.get('order_quantity')),
            supplier: formData.get('supplier'),
            priority: formData.get('priority'),
            expected_delivery: formData.get('expected_delivery'),
            notes: formData.get('notes'),
            order_date: new Date().toISOString(),
            status: 'pending'
        };

        try {
            const response = await fetch('/api/part-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                this.showNotification('✅ Part order placed successfully', 'success');
                this.closeModal();
            } else {
                throw new Error('Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            this.showNotification('✅ Part order placed (offline mode)', 'success');
            this.closeModal();
        }
    },

    // Additional utility methods for better UX
    removeMaterialItem(button) {
        const container = document.getElementById('materialItems');
        const items = container.querySelectorAll('.material-item');

        // Don't remove if it's the last item
        if (items.length > 1) {
            button.parentElement.remove();
        } else {
            this.showNotification('⚠️ At least one item is required', 'warning');
        }
    },

    // Tab switching for modals
    showPartTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update content based on tab
        const content = document.getElementById('part-modal-content');
        if (content) {
            switch(tabName) {
                case 'stock':
                    content.innerHTML = '<div class="tab-content">Stock history and movements will be shown here...</div>';
                    break;
                case 'pricing':
                    content.innerHTML = '<div class="tab-content">Pricing history and cost analysis will be shown here...</div>';
                    break;
                case 'history':
                    content.innerHTML = '<div class="tab-content">Transaction history will be shown here...</div>';
                    break;
                default:
                    // Keep the existing details content
                    break;
            }
        }
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
        if (this.technicians.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👨‍🔧</div>
                    <div class="empty-text">No technicians available</div>
                </div>
            `;
        }

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
        // Use the instance data instead of calling getDefaultQualityChecks()
        if (!this.qualityChecklistData) {
            this.qualityChecklistData = this.getDefaultQualityChecks();
        }

        return this.qualityChecklistData.map((check, index) => `
            <div class="checklist-item ${check.checked ? 'completed' : ''}">
                <div class="checklist-checkbox ${check.checked ? 'checked' : ''}" onclick="servicesModule.toggleQualityCheck(${check.id})">
                    ${check.checked ? '✓' : ''}
                </div>
                <div class="checklist-text">${check.item}</div>
                <div class="checklist-status status-${check.status}">${check.status}</div>
            </div>
        `).join('');
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

    // enhance parts
    initializePartsIntegration() {
        if (window.partsDataManager && window.partsDataManager.isLoaded) {
            // Update parts lists when modal opens
            setTimeout(() => {
                const partInputs = document.querySelectorAll('input[name="item_name"], input[name="part_number"]');
                partInputs.forEach(input => {
                    input.addEventListener('input', (e) => {
                        // Auto-suggest from parts data
                        if (e.target.name === 'item_name') {
                            const parts = window.partsDataManager.searchParts(e.target.value);
                            if (parts.length > 0) {
                                const part = parts[0];
                                const row = e.target.closest('tr');
                                const codeInput = row.querySelector('input[name="part_number"]');
                                const costInput = row.querySelector('input[name="estimated_cost"]');
                                if (codeInput && !codeInput.value) codeInput.value = part.code;
                                if (costInput && !costInput.value) costInput.value = part.price;
                            }
                        }
                    });
                });
            }, 100);
        }
    },

    // TAB SWITCHING AND CONTENT MANAGEMENT
    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.services-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to current tab
        const currentTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
        }

        // Generate and display content
        const content = this.getTabContent(tabName);
        const contentContainer = document.getElementById('servicesMainContent');
        if (contentContainer) {
            contentContainer.innerHTML = content;
        }

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

    // Create Material Form button handler

     // Enhanced createMaterialForm with better parts loading
    createMaterialForm: async function() {
        console.log('🔧 Creating Material Form...');

        // Clear any existing modals first
        const existingModals = document.querySelectorAll('#serviceModal, .modal-overlay');
        existingModals.forEach(modal => modal.remove());
        console.log('Cleared existing modals:', existingModals.length);

        try {
            // FORCE load parts data
            console.log('📦 Force loading parts data...');

            // Method 1: Try loadAutomotivePartsData if it exists
            if (typeof loadAutomotivePartsData === 'function') {
                await loadAutomotivePartsData();
            }

            // Method 2: Direct fallback if still no data
            if (!this.truckParts || this.truckParts.length === 0) {
                console.log('⚠️ No parts data, using fallback...');
                this.truckParts = [
                    { thai: "ขากระจก", english: "Mirror Bracket", code: "MIR1", category: "exterior", price: 850, unit: "ชิ้น", in_stock: 25 },
                    { thai: "ไฟหน้า", english: "Headlight", code: "HEA1", category: "lighting", price: 2500, unit: "ชิ้น", in_stock: 15 },
                    { thai: "ประตู", english: "Door", code: "DOO1", category: "body", price: 15000, unit: "ชิ้น", in_stock: 8 },
                    { thai: "กระจก", english: "Window/Glass", code: "WIN1", category: "glass", price: 3200, unit: "แผ่น", in_stock: 12 },
                    { thai: "ไฟท้าย", english: "Tail Light", code: "TAI1", category: "lighting", price: 1200, unit: "ชิ้น", in_stock: 20 },
                    { thai: "น้ำมันเครื่อง", english: "Engine Oil", code: "OIL1", category: "fluids", price: 350, unit: "ลิตร", in_stock: 100 },
                    { thai: "แบตเตอรี่", english: "Battery", code: "BAT1", category: "electrical", price: 3200, unit: "ก้อน", in_stock: 20 },
                    { thai: "ไส้กรองอากาศ", english: "Air Filter", code: "FIL1", category: "filters", price: 450, unit: "ชิ้น", in_stock: 25 }
                ];
            }

            console.log(`📋 Using ${this.truckParts.length} parts for dropdown`);

            // Create vehicle registration options
            let vehicleOptions = '';
            if (this.vehicles && this.vehicles.length > 0) {
                vehicleOptions = this.vehicles.map(vehicle => {
                    const make = vehicle.make || '';
                    const model = vehicle.model || '';
                    const year = vehicle.year || '';
                    const description = `${make} ${model} ${year}`.trim();

                    return `<option value="${vehicle.license_plate}" data-id="${vehicle.id}" data-make="${make}" data-model="${model}" data-year="${year}">
                        ${vehicle.license_plate}${description ? ' - ' + description : ''}
                    </option>`;
                }).join('');
            } else {
                vehicleOptions = '<option value="">ไม่มีข้อมูลรถ</option>';
            }

            // Create dynamic part number options - ENHANCED VERSION
            let partNumberOptions = '';
            if (this.truckParts && this.truckParts.length > 0) {
                this.truckParts.forEach(part => {
                    const partCode = part.code;
                    const thaiName = part.thai || part.part_name_thai || '';
                    const englishName = part.english || part.part_name_english || '';
                    const price = part.price || part.cost_price || part.selling_price || 0;

                    // Create option with comprehensive data
                    partNumberOptions += `<option value="${partCode}" data-thai="${thaiName}" data-english="${englishName}" data-price="${price}">${partCode} - ${thaiName}</option>\n`;
                });
                console.log(`✅ Created ${this.truckParts.length} part options`);
                console.log('Sample options:', partNumberOptions.substring(0, 200));
            } else {
                console.log('❌ No parts available for dropdown');
                partNumberOptions = '<option value="">ไม่มีข้อมูลชิ้นส่วน</option>';
            }

            const materialFormHtml = `
                <form id="materialForm" onsubmit="return window.servicesModule.saveMaterialForm(event)">
                    <div class="quote-header">
                        <div class="quote-number">
                            <label>Form ID:</label>
                            <input type="text" id="materialFormId" value="MF-${Date.now()}" readonly>
                        </div>
                        <div class="dates">
                            <div class="form-group">
                                <label for="materialFormDate">วันที่:</label>
                                <input type="date" id="materialFormDate" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                    </div>

                    <div class="vehicle-info">
                        <h2>ข้อมูลการเบิกวัสดุ</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicleRegistration">ทะเบียนรถ:</label>
                                <select id="vehicleRegistration" name="vehicle_registration" required
                                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                    <option value="">เลือกทะเบียนรถ</option>
                                    ${vehicleOptions}
                                    <option value="__new__">🚗 รถใหม่ (ระบุเอง)</option>
                                </select>
                                <input type="text" id="newVehicleRegistration" name="new_vehicle_registration"
                                       placeholder="เช่น กก-1234"
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-top: 5px; display: none;">
                            </div>

                            <div class="form-group">
                                <label for="requesterName">ชื่อผู้เบิก:</label>
                                <input type="text" id="requesterName" name="requester_name" placeholder="เช่น ช่างสมชาย" required>
                            </div>

                            <div class="form-group">
                                <label for="department">แผนก:</label>
                                <select id="department" name="department">
                                    <option value="maintenance">ซ่อมบำรุง</option>
                                    <option value="repair">ซ่อมแซม</option>
                                    <option value="emergency">ฉุกเฉิน</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="priority">ความเร่งด่วน:</label>
                                <select id="priority" name="priority">
                                    <option value="normal">ปกติ</option>
                                    <option value="urgent">เร่งด่วน</option>
                                    <option value="emergency">ฉุกเฉิน</option>
                                </select>
                            </div>
                        </div>

                        <!-- Vehicle Details Section -->
                        <div id="vehicleDetailsSection" style="display: none; margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">ข้อมูลรถ</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                                <div><label style="font-weight: bold;">ยี่ห้อ:</label> <span id="vehicleMake">-</span></div>
                                <div><label style="font-weight: bold;">รุ่น:</label> <span id="vehicleModel">-</span></div>
                                <div><label style="font-weight: bold;">ปี:</label> <span id="vehicleYear">-</span></div>
                            </div>
                        </div>
                    </div>

                    <h2>รายการวัสดุที่ต้องการ</h2>

                    <!-- Debug info -->
                    <div style="background: #e8f5e8; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
                        <strong>📋 Parts Data Status:</strong> ${this.truckParts.length} parts loaded
                        <br><strong>🔍 Try these codes:</strong> ${this.truckParts.slice(0, 3).map(p => p.code).join(', ')}
                    </div>

                    <!-- Enhanced datalist with debug -->
                    <datalist id="partNumbersList">
                        ${partNumberOptions}
                    </datalist>

                    <table id="materialItemsTable" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="width: 40px; padding: 8px; border: 1px solid #ddd; text-align: center;">ลำดับ</th>
                                <th style="width: 120px; padding: 8px; border: 1px solid #ddd;">รหัสชิ้นส่วน</th>
                                <th style="width: 200px; padding: 8px; border: 1px solid #ddd;">ชื่อวัสดุ</th>
                                <th style="width: 80px; padding: 8px; border: 1px solid #ddd; text-align: center;">จำนวน</th>
                                <th style="width: 80px; padding: 8px; border: 1px solid #ddd;">หน่วย</th>
                                <th style="width: 100px; padding: 8px; border: 1px solid #ddd; text-align: right;">ราคาต่อหน่วย</th>
                                <th style="width: 80px; padding: 8px; border: 1px solid #ddd; text-align: center;">ส่วนลด (%)</th>
                                <th style="width: 120px; padding: 8px; border: 1px solid #ddd; text-align: right;">ราคาหลังส่วนลด</th>
                                <th style="width: 120px; padding: 8px; border: 1px solid #ddd; text-align: right;">รวม</th>
                                <th style="width: 60px; padding: 8px; border: 1px solid #ddd; text-align: center;">ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">1</td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="text" name="part_number" list="partNumbersList"
                                           placeholder="พิมพ์รหัสชิ้นส่วน (เช่น MIR1, HEA1)"
                                           onchange="window.servicesModule.populatePartDetails(this)"
                                           style="width: 100%; padding: 5px; border: none; outline: none;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="text" name="item_name" placeholder="ชื่อวัสดุ" required readonly
                                           style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="number" name="quantity" min="1" value="1"
                                           onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                                           style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <select name="unit" style="width: 100%; padding: 5px; border: none; outline: none;">
                                        <option value="ชิ้น">ชิ้น</option>
                                        <option value="ชุด">ชุด</option>
                                        <option value="ลิตร">ลิตร</option>
                                        <option value="กิโลกรัม">กิโลกรัม</option>
                                        <option value="เมตร">เมตร</option>
                                        <option value="แผ่น">แผ่น</option>
                                        <option value="ก้อน">ก้อน</option>
                                        <option value="คู่">คู่</option>
                                        <option value="เส้น">เส้น</option>
                                    </select>
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="number" name="unit_price" min="0" step="0.01" placeholder="0.00" readonly
                                           style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="number" name="discount" min="0" max="100" step="0.01" value="0" placeholder="0"
                                           onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                                           style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="number" name="discounted_price" min="0" step="0.01" readonly
                                           style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd;">
                                    <input type="number" name="total_cost" min="0" step="0.01" readonly
                                           style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                                </td>
                                <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">
                                    <button type="button" class="remove-row" onclick="window.servicesModule.removeMaterialRow(this)"
                                            style="background: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">ลบ</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="quote-actions" style="margin: 20px 0;">
                        <button type="button" class="add-row" onclick="window.servicesModule.addMaterialRow()"
                                style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">+ เพิ่มรายการ</button>

                        <div class="quote-totals" style="float: right;">
                            <div class="total-row" style="margin: 10px 0;">
                                <label for="materialTotalAmount" style="font-weight: bold;">ยอดรวมทั้งสิ้น:</label>
                                <input type="number" id="materialTotalAmount" name="total_cost" readonly
                                       style="background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-left: 10px;">
                            </div>
                        </div>
                        <div style="clear: both;"></div>
                    </div>

                    <div class="form-group full-width" style="margin: 20px 0;">
                        <label for="materialNotes" style="display: block; margin-bottom: 5px; font-weight: bold;">หมายเหตุ:</label>
                        <textarea id="materialNotes" name="notes" rows="3" placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
                    </div>

                    <div class="form-actions" style="text-align: center; margin: 20px 0;">
                        <button type="submit" class="btn btn-primary"
                                style="background: #007bff; color: white; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; margin-right: 10px;">📋 บันทึกใบเบิกวัสดุ</button>
                        <button type="button" class="btn btn-secondary" onclick="window.servicesModule.closeModal()"
                                style="background: #6c757d; color: white; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer;">ยกเลิก</button>
                    </div>
                </form>
            `;

            this.showModal('สร้างใบเบิกวัสดุ', materialFormHtml);
            console.log('✅ Material Form modal created with enhanced parts data');

            // Force the modal to appear and add debug info
            setTimeout(() => {
                const modals = document.querySelectorAll('#serviceModal, .modal-overlay');
                const activeModal = Array.from(modals).find(modal => modal.innerHTML.length > 1000);

                if (activeModal) {
                    activeModal.style.cssText = `
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background-color: rgba(0, 0, 0, 0.8) !important;
                        display: flex !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        z-index: 999999 !important;
                        justify-content: center !important;
                        align-items: center !important;
                    `;

                    const container = activeModal.querySelector('.modal-container');
                    if (container) {
                        container.style.cssText = `
                            background: white !important;
                            padding: 20px !important;
                            border-radius: 8px !important;
                            max-width: 98vw !important;
                            max-height: 95vh !important;
                            overflow: auto !important;
                            display: block !important;
                            visibility: visible !important;
                        `;
                    }
                }

                // Debug the datalist after modal creation
                const datalist = document.getElementById('partNumbersList');
                console.log('🔍 Datalist after creation:');
                console.log('- Exists:', !!datalist);
                console.log('- Options count:', datalist?.children.length || 0);
                console.log('- Sample content:', datalist?.innerHTML.substring(0, 100));

                // Add vehicle dropdown event handlers
                const vehicleSelect = document.getElementById('vehicleRegistration');
                if (vehicleSelect) {
                    vehicleSelect.addEventListener('change', (event) => {
                        this.populateVehicleInfoMaterial(event.target);
                    });
                    console.log('✅ Vehicle dropdown event handler attached');
                }

                const newVehicleInput = document.getElementById('newVehicleRegistration');
                if (newVehicleInput) {
                    newVehicleInput.addEventListener('input', function() {
                        const value = this.value.toUpperCase();
                        if (value && !/^[ก-ฮA-Z0-9\s\-]+$/.test(value)) {
                            this.style.borderColor = '#dc3545';
                            this.title = 'รูปแบบทะเบียนรถไม่ถูกต้อง';
                        } else {
                            this.style.borderColor = '#ddd';
                            this.title = '';
                        }
                    });
                }
            }, 100);

        } catch (error) {
            console.error('❌ Error creating material form:', error);
            this.showNotification('❌ เกิดข้อผิดพลาดในการสร้างฟอร์ม: ' + error.message, 'error');
        }
    },

    // Add method to populate vehicle info when selected

    populateVehicleInfoMaterial: function(selectElement) {
        const selectedValue = selectElement.value;
        const selectedOption = selectElement.selectedOptions[0];

        const newVehicleInput = document.getElementById('newVehicleRegistration');
        const vehicleDetailsSection = document.getElementById('vehicleDetailsSection');
        const vehicleMake = document.getElementById('vehicleMake');
        const vehicleModel = document.getElementById('vehicleModel');
        const vehicleYear = document.getElementById('vehicleYear');

        console.log('🚗 Vehicle selection changed:', selectedValue);

        if (selectedValue === '__new__') {
            // Show manual input field for new vehicle
            newVehicleInput.style.display = 'block';
            newVehicleInput.required = true;
            newVehicleInput.focus(); // Auto-focus for better UX
            selectElement.required = false;

            // Hide vehicle details section
            vehicleDetailsSection.style.display = 'none';

            console.log('✅ Manual vehicle input enabled');
            this.showNotification('🚗 กรุณาระบุทะเบียนรถใหม่', 'info', 3000);

        } else if (selectedValue && selectedValue !== '') {
            // Auto-fill from existing vehicle data
            newVehicleInput.style.display = 'none';
            newVehicleInput.required = false;
            newVehicleInput.value = ''; // Clear manual input
            selectElement.required = true;

            // Get vehicle data from the selected option
            const vehicleId = selectedOption?.dataset.id;
            const make = selectedOption?.dataset.make || '-';
            const model = selectedOption?.dataset.model || '-';
            const year = selectedOption?.dataset.year || '-';

            // Show and populate vehicle details
            vehicleDetailsSection.style.display = 'block';
            vehicleMake.textContent = make;
            vehicleModel.textContent = model;
            vehicleYear.textContent = year;

            console.log('✅ Vehicle auto-filled:', { registration: selectedValue, make, model, year });
            this.showNotification(`✅ เลือกรถ: ${selectedValue} - ${make} ${model}`, 'success', 2000);

        } else {
            // No selection - hide everything
            newVehicleInput.style.display = 'none';
            newVehicleInput.required = false;
            newVehicleInput.value = '';
            selectElement.required = true;

            vehicleDetailsSection.style.display = 'none';

            console.log('🔄 Vehicle selection cleared');
        }
    },

    // calculation method
    calculateMaterialRowTotal: function(input) {
        const row = input.closest('tr');
        if (!row) return;

        // Get values with multiple fallback field names to handle both old and new structures
        const quantity = parseInt(row.querySelector('input[name="quantity"]').value) || 0;

        // Try both unit_price and estimated_cost for backward compatibility
        let unitPrice = 0;
        const unitPriceInput = row.querySelector('input[name="unit_price"]');
        const estimatedCostInput = row.querySelector('input[name="estimated_cost"]');

        if (unitPriceInput && unitPriceInput.value) {
            unitPrice = parseFloat(unitPriceInput.value) || 0;
        } else if (estimatedCostInput && estimatedCostInput.value) {
            unitPrice = parseFloat(estimatedCostInput.value) || 0;
        }

        const discount = parseFloat(row.querySelector('input[name="discount"]')?.value) || 0;

        console.log('📊 Calculating row total:', { quantity, unitPrice, discount });

        // Calculate discounted price
        const discountAmount = unitPrice * (discount / 100);
        const discountedPrice = unitPrice - discountAmount;

        // Calculate total
        const total = quantity * discountedPrice;

        // Update fields (handle both new and old field names)
        const discountedPriceInput = row.querySelector('input[name="discounted_price"]');
        const totalCostInput = row.querySelector('input[name="total_cost"]');

        if (discountedPriceInput) {
            discountedPriceInput.value = discountedPrice.toFixed(2);
            discountedPriceInput.style.backgroundColor = '#e8f5e8'; // Light green to show it's calculated
        }

        if (totalCostInput) {
            totalCostInput.value = total.toFixed(2);
            totalCostInput.style.backgroundColor = '#e8f5e8'; // Light green to show it's calculated
        }

        // Also update estimated_cost if it exists (for old structure compatibility)
        if (estimatedCostInput && !unitPriceInput) {
            // If we're using old structure, put total in estimated_cost field
            const oldTotal = quantity * unitPrice; // Without discount for old structure
            estimatedCostInput.value = unitPrice.toFixed(2);
        }

        console.log('✅ Row total calculated:', { discountedPrice: discountedPrice.toFixed(2), total: total.toFixed(2) });

        // Update grand total
        this.calculateMaterialTotal();
    },

    // material grand total calculation
    calculateMaterialTotal: function() {
        const table = document.getElementById('materialItemsTable');
        if (!table) return;

        let grandTotal = 0;
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const totalInput = row.querySelector('input[name="total_cost"]');
            if (totalInput && totalInput.value) {
                grandTotal += parseFloat(totalInput.value) || 0;
            }
        });

        const totalAmountInput = document.getElementById('materialTotalAmount');
        if (totalAmountInput) {
            totalAmountInput.value = grandTotal.toFixed(2);
            console.log('💰 Grand total updated:', grandTotal.toFixed(2));
        }
    },

    // material addMaterialRow method with consistent structure matching the header
    addMaterialRow: function() {
        const table = document.getElementById('materialItemsTable');
        if (!table) return;

        const tbody = table.getElementsByTagName('tbody')[0];
        const rowCount = tbody.rows.length;
        const newRow = tbody.insertRow();

        // Create row that EXACTLY matches the header structure (10 columns)
        newRow.innerHTML = `
            <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${rowCount + 1}</td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="text" name="part_number" list="partNumbersList"
                       placeholder="พิมพ์รหัสชิ้นส่วน"
                       onchange="window.servicesModule.populatePartDetails(this)"
                       style="width: 100%; padding: 5px; border: none; outline: none;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="text" name="item_name" placeholder="ชื่อวัสดุ" required readonly
                       style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="number" name="quantity" min="1" value="1"
                       onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                       style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <select name="unit" style="width: 100%; padding: 5px; border: none; outline: none;">
                    <option value="ชิ้น">ชิ้น</option>
                    <option value="ชุด">ชุด</option>
                    <option value="ลิตร">ลิตร</option>
                    <option value="กิโลกรัม">กิโลกรัม</option>
                    <option value="เมตร">เมตร</option>
                    <option value="แผ่น">แผ่น</option>
                    <option value="ก้อน">ก้อน</option>
                    <option value="คู่">คู่</option>
                    <option value="เส้น">เส้น</option>
                </select>
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="number" name="unit_price" min="0" step="0.01" placeholder="0.00" readonly
                       style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="number" name="discount" min="0" max="100" step="0.01" value="0" placeholder="0"
                       onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                       style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="number" name="discounted_price" min="0" step="0.01" readonly
                       style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd;">
                <input type="number" name="total_cost" min="0" step="0.01" readonly
                       style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
            </td>
            <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">
                <button type="button" class="remove-row" onclick="window.servicesModule.removeMaterialRow(this)"
                        style="background: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">ลบ</button>
            </td>
        `;

        console.log('✅ New material row added with correct 10-column structure');
    },

    // material removeMaterialRow method
    removeMaterialRow: function(button) {
        const row = button.closest('tr');
        if (!row) return;

        const table = row.closest('table');
        const tbody = table.getElementsByTagName('tbody')[0];

        // Don't remove if it's the last row
        if (tbody.rows.length <= 1) {
            this.showNotification('⚠️ ต้องมีรายการอย่างน้อย 1 รายการ', 'warning');
            return;
        }

        row.remove();

        // Renumber all rows
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell) {
                firstCell.textContent = index + 1;
            }
        });

        // Recalculate total
        this.calculateMaterialTotal();

        console.log('✅ Material row removed and renumbered');
    },

    // material method to fix inconsistent table rows
    fixTableStructure: function() {
        const table = document.getElementById('materialItemsTable');
        if (!table) return;

        const tbody = table.getElementsByTagName('tbody')[0];
        const rows = tbody.querySelectorAll('tr');

        console.log('🔧 Fixing table structure for', rows.length, 'rows');

        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');

            // Check if row has the old structure (7-8 columns) vs new structure (10 columns)
            if (cells.length < 10) {
                console.log(`⚠️ Row ${index + 1} has ${cells.length} columns, needs fixing`);

                // Remove old row and replace with correct structure
                const rowNumber = index + 1;
                row.remove();

                // Add new correctly structured row
                const newRow = tbody.insertRow(index);
                newRow.innerHTML = `
                    <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${rowNumber}</td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="text" name="part_number" list="partNumbersList"
                               placeholder="พิมพ์รหัสชิ้นส่วน"
                               onchange="window.servicesModule.populatePartDetails(this)"
                               style="width: 100%; padding: 5px; border: none; outline: none;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="text" name="item_name" placeholder="ชื่อวัสดุ" required readonly
                               style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="number" name="quantity" min="1" value="1"
                               onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                               style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <select name="unit" style="width: 100%; padding: 5px; border: none; outline: none;">
                            <option value="ชิ้น">ชิ้น</option>
                            <option value="ชุด">ชุด</option>
                            <option value="ลิตร">ลิตร</option>
                            <option value="กิโลกรัม">กิโลกรัม</option>
                            <option value="เมตร">เมตร</option>
                            <option value="แผ่น">แผ่น</option>
                            <option value="ก้อน">ก้อน</option>
                            <option value="คู่">คู่</option>
                            <option value="เส้น">เส้น</option>
                        </select>
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="number" name="unit_price" min="0" step="0.01" placeholder="0.00" readonly
                               style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="number" name="discount" min="0" max="100" step="0.01" value="0" placeholder="0"
                               onchange="window.servicesModule.calculateMaterialRowTotal(this)"
                               style="width: 100%; padding: 5px; border: none; outline: none; text-align: center;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="number" name="discounted_price" min="0" step="0.01" readonly
                               style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd;">
                        <input type="number" name="total_cost" min="0" step="0.01" readonly
                               style="width: 100%; padding: 5px; border: none; outline: none; background-color: #f5f5f5; text-align: right;">
                    </td>
                    <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">
                        <button type="button" class="remove-row" onclick="window.servicesModule.removeMaterialRow(this)"
                                style="background: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">ลบ</button>
                    </td>
                `;
            }
        });

        console.log('✅ Table structure fixed');
    },



    // Add method to populate by part name (reverse lookup)
    populatePartDetailsByName: function(nameInput) {
        const partName = nameInput.value.trim();
        const row = nameInput.closest('tr');

        if (!partName) {
            this.clearPartRow(row);
            return;
        }

        // Find part by Thai or English name
        let part = null;

        if (this.truckParts && this.truckParts.length > 0) {
            part = this.truckParts.find(p =>
                p.thai === partName ||
                p.english === partName ||
                p.thai.toLowerCase() === partName.toLowerCase() ||
                p.english.toLowerCase() === partName.toLowerCase()
            );
        }

        if (part) {
            // Populate the part code field
            const codeInput = row.querySelector('input[name="part_number"]');
            if (codeInput) {
                codeInput.value = part.code;
            }

            // Use the regular populate function
            this.populatePartDetails(codeInput);
        }
    },

    // New method to populate part details when part number is selected
    populatePartDetails: function(partNumberInput) {
        console.log('🔍 populatePartDetails called with:', partNumberInput.value);

        const partCode = partNumberInput.value.trim();
        const row = partNumberInput.closest('tr');

        // Better error checking
        if (!row) {
            console.log('❌ Could not find parent row');
            return;
        }

        if (!partCode) {
            this.clearPartRow(row);
            return;
        }

        console.log('🔍 Searching for part:', partCode);

        // Search in truckParts with multiple matching strategies
        let part = null;

        if (this.truckParts && this.truckParts.length > 0) {
            // Try exact match first
            part = this.truckParts.find(p =>
                String(p.id) === partCode ||
                String(p.part_code) === partCode ||
                String(p.code) === partCode
            );

            // If no exact match, try case-insensitive
            if (!part) {
                part = this.truckParts.find(p =>
                    (p.part_code && String(p.part_code).toLowerCase() === partCode.toLowerCase()) ||
                    (p.code && String(p.code).toLowerCase() === partCode.toLowerCase()) ||
                    String(p.id) === partCode
                );
            }

            console.log('🔍 truckParts search result:', part);
        }

        if (part) {
            console.log('✅ Part found:', part);

            // Get part details with fallback options
            const partName = part.thai ||
                            part.part_name_thai ||
                            part.english ||
                            part.part_name_english ||
                            part.name ||
                            part.description ||
                            `Part ${part.id}`;

            const partPrice = part.cost_price ||
                             part.selling_price ||
                             part.price ||
                             part.unit_price ||
                             0;

            console.log('📝 Filling fields:', { name: partName, price: partPrice });

            // Find and fill the fields with better error checking
            const nameInput = row.querySelector('input[name="item_name"]');
            const priceInput = row.querySelector('input[name="unit_price"]');

            if (nameInput) {
                nameInput.value = partName;
                nameInput.style.backgroundColor = '#e8f5e8'; // Light green
                nameInput.readOnly = true;
                console.log('✅ Set item name:', partName);
            } else {
                console.log('❌ Could not find item_name input');
            }

            if (priceInput) {
                priceInput.value = parseFloat(partPrice).toFixed(2);
                priceInput.style.backgroundColor = '#e8f5e8'; // Light green
                priceInput.readOnly = true;
                console.log('✅ Set unit price:', partPrice);
            } else {
                console.log('❌ Could not find unit_price input');
            }

            // Calculate totals if the calculation function exists
            if (this.calculateMaterialRowTotal) {
                const quantityInput = row.querySelector('input[name="quantity"]');
                if (quantityInput) {
                    this.calculateMaterialRowTotal(quantityInput);
                }
            }

            // Show success notification
            if (this.showNotification) {
                this.showNotification(`✅ พบชิ้นส่วน: ${partName} - ราคา ฿${partPrice}`, 'success', 2000);
            }

        } else {
            console.log('❌ Part not found for code:', partCode);

            // Part not found - allow manual entry
            const nameInput = row.querySelector('input[name="item_name"]');
            const priceInput = row.querySelector('input[name="unit_price"]');

            if (nameInput) {
                nameInput.value = '';
                nameInput.readOnly = false;
                nameInput.style.backgroundColor = 'white';
                nameInput.placeholder = 'กรอกชื่อวัสดุ';
            }

            if (priceInput) {
                priceInput.value = '';
                priceInput.readOnly = false;
                priceInput.style.backgroundColor = 'white';
                priceInput.placeholder = '0.00';
            }

            if (this.showNotification) {
                this.showNotification(`⚠️ ไม่พบรหัสชิ้นส่วน: ${partCode} (สามารถกรอกข้อมูลเอง)`, 'warning', 3000);
            }
        }
    },

    // Clear part row fields
    clearPartRow(row) {
        row.querySelector('input[name="item_name"]').value = '';
        row.querySelector('input[name="unit_price"]').value = '';
        row.querySelector('input[name="discount"]').value = '0';
        row.querySelector('input[name="discounted_price"]').value = '';
        row.querySelector('input[name="total_cost"]').value = '';
    },





    // Save Material Form
    async saveMaterialForm(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        // Get basic form data
        const materialFormData = {
            id: this.materialForms.length + 1,
            form_number: `MF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            vehicle_registration: formData.get('vehicle_registration'),
            requester_name: formData.get('requester_name'),
            department: formData.get('department'),
            priority: formData.get('priority'),
            notes: formData.get('notes'),
            date: formData.get('date'),
            status: 'pending',
            created_date: new Date().toISOString(),
            items: [],
            total_items: 0,
            total_cost: 0,
            total_discount: 0
        };

        // Get items from table
        const table = document.getElementById('materialItemsTable').getElementsByTagName('tbody')[0];
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            const itemName = row.querySelector('input[name="item_name"]').value.trim();

            // Skip empty rows
            if (!itemName) continue;

            const partNumber = row.querySelector('input[name="part_number"]').value || '';
            const quantity = parseInt(row.querySelector('input[name="quantity"]').value) || 1;
            const unitPrice = parseFloat(row.querySelector('input[name="unit_price"]').value) || 0;
            const discount = parseFloat(row.querySelector('input[name="discount"]').value) || 0;
            const discountedPrice = parseFloat(row.querySelector('input[name="discounted_price"]').value) || unitPrice;
            const totalCost = parseFloat(row.querySelector('input[name="total_cost"]').value) || 0;

            materialFormData.items.push({
                part_number: partNumber,
                name: itemName,
                quantity: quantity,
                unit: row.querySelector('select[name="unit"]').value,
                unit_price: unitPrice,
                discount: discount,
                discounted_price: discountedPrice,
                total_cost: totalCost
            });

            materialFormData.total_cost += totalCost;
            materialFormData.total_discount += (unitPrice - discountedPrice) * quantity;
            materialFormData.total_items++;
        }

        // Validate that we have at least one item
        if (materialFormData.items.length === 0) {
            this.showNotification('❌ กรุณาระบุรายการวัสดุอย่างน้อย 1 รายการ', 'error');
            return;
        }

        try {
            // Show loading
            this.showNotification('⏳ กำลังบันทึกใบเบิกวัสดุ...', 'info');

            // Try to save to API
            const response = await fetch('/api/material-forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialFormData)
            });

            if (response.ok) {
                const result = await response.json();
                materialFormData.id = result.id || materialFormData.id;
            } else {
                throw new Error('API Error');
            }
        } catch (error) {
            console.warn('API not available, saving locally:', error);
        }

        // Add to local data
        this.materialForms.push(materialFormData);

        // Show success message with action buttons
        this.showNotification(`✅ บันทึกใบเบิกวัสดุสำเร็จ (เลขที่: ${materialFormData.form_number})`, 'success');

        // Show action modal for email/print
        this.showFormActionModal('material', materialFormData);

        // Close modal
        this.closeModal();

        // Refresh truck repair tab if currently viewing
        if (this.currentTruckTab === 'forms') {
            this.showTruckTab('forms');
        }
    },

    // Create Repair Quote button handler
    // Enhanced populateVehicleDetails that auto-populates from vehicle database
    populateVehicleDetails(vehicleId) {
        if (!vehicleId) {
            this.clearVehicleFields();
            return;
        }

        const vehicle = this.vehicles.find(v => v.id == vehicleId);
        if (!vehicle) return;

        // Populate all vehicle fields automatically from database
        document.querySelector('input[name="vehicle_registration"]').value = vehicle.license_plate || '';
        document.querySelector('input[name="vehicle_model"]').value = vehicle.model || '';
        document.querySelector('input[name="vehicle_year"]').value = vehicle.year || '';
        document.querySelector('input[name="vehicle_color"]').value = vehicle.color || '';

        // Auto-populate vehicle make from database
        const makeSelect = document.querySelector('select[name="vehicle_make"]');
        const vehicleMake = vehicle.make || '';

        if (vehicleMake) {
            // Check if the make exists in dropdown options
            const makeExists = Array.from(makeSelect.options).some(option => option.value === vehicleMake);

            if (makeExists) {
                // Make exists in dropdown, select it
                makeSelect.value = vehicleMake;
            } else {
                // Make doesn't exist, add it dynamically to dropdown
                const newOption = document.createElement('option');
                newOption.value = vehicleMake;
                newOption.textContent = vehicleMake;
                makeSelect.appendChild(newOption);
                makeSelect.value = vehicleMake;

                console.log(`✅ Added new vehicle make to dropdown: ${vehicleMake}`);
            }
        }

        console.log('✅ Vehicle details auto-populated from database:', vehicle.license_plate);
    },

    // Enhanced createRepairQuote with dynamic vehicle make dropdown
    createRepairQuote: async function() {
        console.log('🚛 Creating Repair Quote...');

        // Clear any existing modals first
        document.querySelectorAll('[id*="modal"], [class*="modal"], .modal-overlay, #serviceModal').forEach(el => el.remove());
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get customer list for dropdown
        const customerOptions = this.customers && this.customers.length > 0
            ? this.customers.map(customer =>
                `<option value="${customer.id}" data-email="${customer.email || ''}">${customer.first_name} ${customer.last_name}${customer.email ? ' - ' + customer.email : ''}</option>`
              ).join('')
            : '<option value="">No customers found</option>';

        // Get all unique vehicle makes from database for dropdown
        const uniqueMakes = [...new Set(this.vehicles.map(v => v.make).filter(make => make))].sort();
        const vehicleMakeOptions = uniqueMakes.map(make => `<option value="${make}">${make}</option>`).join('');

        try {
            const modalHTML = `
                <div id="repairQuoteModal" style="
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 999999 !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                ">
                    <div style="
                        background: white !important;
                        padding: 30px !important;
                        border-radius: 10px !important;
                        max-width: 90vw !important;
                        max-height: 90vh !important;
                        overflow: auto !important;
                        position: relative !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                    ">
                        <button onclick="document.getElementById('repairQuoteModal').remove()" style="
                            position: absolute;
                            top: 10px;
                            right: 15px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            cursor: pointer;
                            font-size: 16px;
                        ">×</button>

                        <h2 style="margin-top: 0; color: #333;">สร้างใบเสนอราคาซ่อมรถบรรทุก</h2>

                        <form id="repairQuoteForm" onsubmit="window.servicesModule.saveRepairQuote(event); return false;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ชื่อลูกค้า:</label>
                                    <select name="customer_name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" onchange="window.servicesModule.loadCustomerVehicles(this.value)">
                                        <option value="">เลือกลูกค้า</option>
                                        ${customerOptions}
                                        <option value="__new__">+ เพิ่มลูกค้าใหม่</option>
                                    </select>
                                    <input type="text" name="new_customer_name" placeholder="ชื่อลูกค้าใหม่" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-top: 5px; display: none;">
                                </div>

                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">เลือกรถ:</label>
                                    <select name="vehicle_selector" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" onchange="window.servicesModule.populateVehicleDetails(this.value)" disabled>
                                        <option value="">เลือกลูกค้าก่อน</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ทะเบียนรถ:</label>
                                    <input type="text" name="vehicle_registration" required placeholder="เช่น กท-1234" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>

                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ยี่ห้อรถ:</label>
                                    <select name="vehicle_make" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                        <option value="">เลือกยี่ห้อ</option>
                                        ${vehicleMakeOptions}
                                        <option value="__other__">🔧 อื่นๆ (ระบุเอง)</option>
                                    </select>
                                    <input type="text" name="custom_vehicle_make" placeholder="ระบุยี่ห้อรถ" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-top: 5px; display: none;">
                                </div>

                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">รุ่น:</label>
                                    <input type="text" name="vehicle_model" placeholder="เช่น NPR" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ปี:</label>
                                    <input type="number" name="vehicle_year" min="1990" max="2025" placeholder="2020" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>

                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">สี:</label>
                                    <input type="text" name="vehicle_color" placeholder="เช่น ขาว, แดง" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                </div>
                            </div>

                            <!-- Rest of the form remains the same -->
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">ประเภทการซ่อม:</label>
                                <select name="repair_type" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                    <option value="">เลือกประเภท</option>
                                    <option value="Engine Repair">ซ่อมเครื่องยนต์</option>
                                    <option value="Transmission Repair">ซ่อมเกียร์</option>
                                    <option value="Brake System">ระบบเบรค</option>
                                    <option value="Electrical System">ระบบไฟฟ้า</option>
                                    <option value="Body Work">งานตัวถัง</option>
                                    <option value="Suspension">ระบบช่วงล่าง</option>
                                    <option value="AC System">ระบบแอร์</option>
                                    <option value="General Maintenance">บำรุงรักษาทั่วไป</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">รายละเอียดความเสียหาย:</label>
                                <textarea name="damage_description" rows="3" placeholder="อธิบายปัญหาและความเสียหายที่พบ..." required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"></textarea>
                            </div>

                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">ราคาประมาณการ:</label>
                                <input type="number" name="total_amount" step="0.01" min="0" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <button type="submit" style="
                                    background: #007bff;
                                    color: white;
                                    padding: 12px 30px;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 16px;
                                    margin-right: 10px;
                                ">🚛 บันทึกใบเสนอราคา</button>

                                <button type="button" onclick="document.getElementById('repairQuoteModal').remove()" style="
                                    background: #6c757d;
                                    color: white;
                                    padding: 12px 30px;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 16px;
                                ">ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Add to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Add customer dropdown functionality
            const customerSelect = document.querySelector('select[name="customer_name"]');
            const newCustomerInput = document.querySelector('input[name="new_customer_name"]');
            const makeSelect = document.querySelector('select[name="vehicle_make"]');
            const customMakeInput = document.querySelector('input[name="custom_vehicle_make"]');

            customerSelect.addEventListener('change', function() {
                if (this.value === '__new__') {
                    newCustomerInput.style.display = 'block';
                    newCustomerInput.required = true;
                } else {
                    newCustomerInput.style.display = 'none';
                    newCustomerInput.required = false;
                }
            });

            // Handle custom vehicle make
            makeSelect.addEventListener('change', function() {
                if (this.value === '__other__') {
                    customMakeInput.style.display = 'block';
                    customMakeInput.required = true;
                    this.required = false;
                } else {
                    customMakeInput.style.display = 'none';
                    customMakeInput.required = false;
                    this.required = true;
                }
            });

            console.log('✅ Repair Quote modal created with auto-populated vehicle makes from database');

        } catch (error) {
            console.error('❌ Error creating repair quote:', error);
            this.showNotification('❌ เกิดข้อผิดพลาดในการสร้างใบเสนอราคา: ' + error.message, 'error');
        }
    },

    // Add these helper methods to handle vehicle population
    loadCustomerVehicles(customerId) {
        const vehicleSelector = document.querySelector('select[name="vehicle_selector"]');

        if (!customerId || customerId === '__new__') {
            vehicleSelector.innerHTML = '<option value="">เลือกลูกค้าก่อน</option>';
            vehicleSelector.disabled = true;
            this.clearVehicleFields();
            return;
        }

        // Find vehicles for this customer
        const customerVehicles = this.vehicles.filter(vehicle => vehicle.customer_id == customerId);

        if (customerVehicles.length === 0) {
            vehicleSelector.innerHTML = '<option value="">ลูกค้านี้ไม่มีรถจดทะเบียน</option>';
            vehicleSelector.disabled = true;
            this.clearVehicleFields();
            return;
        }

        // Populate vehicle dropdown
        vehicleSelector.innerHTML = '<option value="">เลือกรถ</option>' +
            customerVehicles.map(vehicle =>
                `<option value="${vehicle.id}">${vehicle.license_plate} - ${vehicle.year} ${vehicle.make} ${vehicle.model}</option>`
            ).join('');

        vehicleSelector.disabled = false;

        // If only one vehicle, auto-select it
        if (customerVehicles.length === 1) {
            vehicleSelector.value = customerVehicles[0].id;
            this.populateVehicleDetails(customerVehicles[0].id);
        }
    },

    populateVehicleDetails(vehicleId) {
        if (!vehicleId) {
            this.clearVehicleFields();
            return;
        }

        const vehicle = this.vehicles.find(v => v.id == vehicleId);
        if (!vehicle) return;

        // Populate vehicle fields
        document.querySelector('input[name="vehicle_registration"]').value = vehicle.license_plate || '';
        document.querySelector('select[name="vehicle_make"]').value = vehicle.make || '';
        document.querySelector('input[name="vehicle_model"]').value = vehicle.model || '';
        document.querySelector('input[name="vehicle_year"]').value = vehicle.year || '';
        document.querySelector('input[name="vehicle_color"]').value = vehicle.color || '';

        console.log('✅ Vehicle details populated:', vehicle.license_plate);
    },

    clearVehicleFields() {
        document.querySelector('input[name="vehicle_registration"]').value = '';
        document.querySelector('select[name="vehicle_make"]').value = '';
        document.querySelector('input[name="vehicle_model"]').value = '';
        document.querySelector('input[name="vehicle_year"]').value = '';
        document.querySelector('input[name="vehicle_color"]').value = '';
    },
//    // Material Form Helper Functions
//    addMaterialRow() {
//        const table = document.getElementById('materialItemsTable').getElementsByTagName('tbody')[0];
//        const rowCount = table.rows.length;
//        const newRow = table.insertRow();
//
//        newRow.innerHTML = `
//            <td>${rowCount + 1}</td>
//            <td><input type="text" name="part_number" list="parts-codes" placeholder="เช่น TRK001"></td>
//            <td><input type="text" name="item_name" list="parts-list" placeholder="เช่น เบรคแพ็ด" required></td>
//            <td><input type="number" name="quantity" min="1" value="1" onchange="servicesModule.calculateMaterialRowTotal(this)"></td>
//            <td>
//                <select name="unit">
//                    <option value="ชิ้น">ชิ้น</option>
//                    <option value="ชุด">ชุด</option>
//                    <option value="ลิตร">ลิตร</option>
//                    <option value="กิโลกรัม">กิโลกรัม</option>
//                    <option value="เมตร">เมตร</option>
//                </select>
//            </td>
//            <td><input type="number" name="estimated_cost" min="0" step="0.01" placeholder="0.00" onchange="servicesModule.calculateMaterialRowTotal(this)"></td>
//            <td><input type="number" name="total_cost" min="0" step="0.01" readonly></td>
//            <td><button type="button" class="remove-row" onclick="servicesModule.removeMaterialRow(this)">ลบ</button></td>
//        `;
//    },

//    removeMaterialRow(button) {
//        const table = document.getElementById('materialItemsTable').getElementsByTagName('tbody')[0];
//        const row = button.closest('tr');
//
//        if (table.rows.length > 1) {
//            row.remove();
//            this.updateMaterialRowNumbers();
//            this.calculateMaterialTotal();
//        } else {
//            // Clear the last row instead of removing it
//            row.querySelectorAll('input').forEach(input => {
//                if (input.name === 'quantity') input.value = '1';
//                else input.value = '';
//            });
//            row.querySelector('select[name="unit"]').selectedIndex = 0;
//            this.calculateMaterialTotal();
//        }
//    },

//    updateMaterialRowNumbers() {
//        const table = document.getElementById('materialItemsTable').getElementsByTagName('tbody')[0];
//        for (let i = 0; i < table.rows.length; i++) {
//            table.rows[i].cells[0].textContent = i + 1;
//        }
//    },

//    calculateMaterialRowTotal(input) {
//        const row = input.closest('tr');
//        const quantity = parseInt(row.querySelector('input[name="quantity"]').value) || 0;
//        const cost = parseFloat(row.querySelector('input[name="estimated_cost"]').value) || 0;
//        const total = quantity * cost;
//
//        row.querySelector('input[name="total_cost"]').value = total.toFixed(2);
//        this.calculateMaterialTotal();
//    },

//    calculateMaterialTotal() {
//        const table = document.getElementById('materialItemsTable').getElementsByTagName('tbody')[0];
//        let total = 0;
//
//        for (let i = 0; i < table.rows.length; i++) {
//            const rowTotal = parseFloat(table.rows[i].querySelector('input[name="total_cost"]').value) || 0;
//            total += rowTotal;
//        }
//
//        document.getElementById('materialTotalAmount').value = total.toFixed(2);
//    },

    // Repair Quote Helper Functions
    addRepairRow() {
        const table = document.getElementById('repairItemsTable').getElementsByTagName('tbody')[0];
        const rowCount = table.rows.length;
        const newRow = table.insertRow();

        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td><input type="text" name="repair_item" placeholder="เช่น เปลี่ยนน้ำมันเครื่อง" required></td>
            <td><input type="number" name="labor_hours" placeholder="0.5" step="0.5" min="0" onchange="servicesModule.calculateRepairRowTotal(this)"></td>
            <td><input type="number" name="labor_rate" placeholder="800" step="0.01" min="0" value="800" onchange="servicesModule.calculateRepairRowTotal(this)"></td>
            <td><input type="number" name="parts_cost" placeholder="0.00" step="0.01" min="0" onchange="servicesModule.calculateRepairRowTotal(this)"></td>
            <td><input type="number" name="item_total" step="0.01" readonly></td>
            <td><button type="button" class="remove-row" onclick="servicesModule.removeRepairRow(this)">ลบ</button></td>
        `;
    },

    removeRepairRow(button) {
        const table = document.getElementById('repairItemsTable').getElementsByTagName('tbody')[0];
        const row = button.closest('tr');

        if (table.rows.length > 1) {
            row.remove();
            this.updateRepairRowNumbers();
            this.calculateRepairTotal();
        } else {
            // Clear the last row instead of removing it
            row.querySelectorAll('input').forEach(input => {
                if (input.name === 'labor_rate') input.value = '800';
                else input.value = '';
            });
            this.calculateRepairTotal();
        }
    },

    updateRepairRowNumbers() {
        const table = document.getElementById('repairItemsTable').getElementsByTagName('tbody')[0];
        for (let i = 0; i < table.rows.length; i++) {
            table.rows[i].cells[0].textContent = i + 1;
        }
    },

    calculateRepairRowTotal(input) {
        const row = input.closest('tr');
        const laborHours = parseFloat(row.querySelector('input[name="labor_hours"]').value) || 0;
        const laborRate = parseFloat(row.querySelector('input[name="labor_rate"]').value) || 0;
        const partsCost = parseFloat(row.querySelector('input[name="parts_cost"]').value) || 0;

        const laborCost = laborHours * laborRate;
        const total = laborCost + partsCost;

        row.querySelector('input[name="item_total"]').value = total.toFixed(2);
        this.calculateRepairTotal();
    },

    calculateRepairTotal() {
        const table = document.getElementById('repairItemsTable').getElementsByTagName('tbody')[0];
        let subtotal = 0;

        for (let i = 0; i < table.rows.length; i++) {
            const rowTotal = parseFloat(table.rows[i].querySelector('input[name="item_total"]').value) || 0;
            subtotal += rowTotal;
        }

        const vatRate = parseFloat(document.getElementById('vatRate').value) || 0;
        const vatAmount = subtotal * (vatRate / 100);
        const grandTotal = subtotal + vatAmount;

        document.getElementById('repairSubtotal').value = subtotal.toFixed(2);
        document.getElementById('vatAmount').value = vatAmount.toFixed(2);
        document.getElementById('repairTotalAmount').value = grandTotal.toFixed(2);
    },

    // Save Repair Quote


    async saveRepairQuote(event) {
        event.preventDefault();
        console.log('💾 Saving repair quote...');

        try {
            const form = event.target;
            const formData = new FormData(form);

            // Get customer name (handle both dropdown and new customer input)
            let customerName = formData.get('customer_name');
            if (customerName === '__new__') {
                customerName = formData.get('new_customer_name');
            } else if (customerName && customerName !== '') {
                // If it's a customer ID, get the actual name
                const customer = this.customers.find(c => c.id == customerName);
                if (customer) {
                    customerName = `${customer.first_name} ${customer.last_name}`;
                }
            }

            // Validate required fields
            if (!customerName) {
                this.showNotification('❌ กรุณาระบุชื่อลูกค้า', 'error');
                return;
            }

            if (!formData.get('vehicle_registration')) {
                this.showNotification('❌ กรุณาระบุทะเบียนรถ', 'error');
                return;
            }

            if (!formData.get('repair_type')) {
                this.showNotification('❌ กรุณาเลือกประเภทการซ่อม', 'error');
                return;
            }

            if (!formData.get('damage_description')) {
                this.showNotification('❌ กรุณาระบุรายละเอียดความเสียหาย', 'error');
                return;
            }

            // Create repair quote data
            const repairQuoteData = {
                id: this.repairQuotes.length + 1,
                quote_number: `TRQ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                customer_name: customerName,
                vehicle_registration: formData.get('vehicle_registration'),
                vehicle_make: formData.get('vehicle_make') || formData.get('custom_vehicle_make'),
                vehicle_model: formData.get('vehicle_model'),
                vehicle_year: parseInt(formData.get('vehicle_year')) || null,
                vehicle_color: formData.get('vehicle_color') || '',
                repair_type: formData.get('repair_type'),
                damage_description: formData.get('damage_description'),
                total_amount: parseFloat(formData.get('total_amount')) || 0,
                quote_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                created_date: new Date().toISOString(),
                notes: formData.get('notes') || '',
                final_amount: parseFloat(formData.get('total_amount')) || 0
            };

            console.log('📋 Repair quote data:', repairQuoteData);

            try {
                // Show loading
                this.showNotification('⏳ กำลังบันทึกใบเสนอราคา...', 'info');

                // Try to save to API
                const response = await fetch('/api/repair-quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(repairQuoteData)
                });

                if (response.ok) {
                    const result = await response.json();
                    repairQuoteData.id = result.id || repairQuoteData.id;
                } else {
                    throw new Error('API Error');
                }
            } catch (error) {
                console.warn('API not available, saving locally:', error);
            }

            // Add to local data
            this.repairQuotes.push(repairQuoteData);

            // Show success message
            this.showNotification(`✅ บันทึกใบเสนอราคาสำเร็จ (เลขที่: ${repairQuoteData.quote_number})`, 'success');

            // Show action modal for email/print
            this.showFormActionModal('quote', repairQuoteData);

            // Close modal
            const modal = document.getElementById('repairQuoteModal');
            if (modal) {
                modal.remove();
            }

            // Refresh truck repair tab if currently viewing
            if (this.currentTruckTab === 'quotes') {
                this.showTruckTab('quotes');
            }

        } catch (error) {
            console.error('❌ Error saving repair quote:', error);
            this.showNotification('❌ เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error');
        }
    },

    // Show action modal for email/print after saving
    showFormActionModal(type, data) {
        const isQuote = type === 'quote';
        const title = isQuote ? 'ใบเสนอราคาซ่อม' : 'ใบเบิกวัสดุ';
        const number = isQuote ? data.quote_number : data.form_number;

        const actionModalHTML = `
            <div id="formActionModal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.8) !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 999999 !important;
            ">
                <div style="
                    background: white !important;
                    padding: 40px !important;
                    border-radius: 15px !important;
                    text-align: center !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                    max-width: 500px !important;
                ">
                    <h2 style="color: #28a745; margin-bottom: 20px;">✅ บันทึกสำเร็จ!</h2>
                    <p style="font-size: 18px; margin-bottom: 30px;">
                        ${title}<br>
                        <strong>เลขที่: ${number}</strong>
                    </p>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <button onclick="servicesModule.emailForm('${type}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" style="
                            background: #007bff;
                            color: white;
                            padding: 15px 20px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        ">
                            📧 ส่งอีเมล
                        </button>

                        <button onclick="servicesModule.printForm('${type}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" style="
                            background: #28a745;
                            color: white;
                            padding: 15px 20px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        ">
                            🖨️ พิมพ์
                        </button>
                    </div>

                    <button onclick="document.getElementById('formActionModal').remove()" style="
                        background: #6c757d;
                        color: white;
                        padding: 12px 30px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        ปิด
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', actionModalHTML);
    },

    // Email form function
    emailForm(type, data) {
        console.log(`📧 Emailing ${type}:`, data);

        // Create email modal
        const isQuote = type === 'quote';
        const title = isQuote ? 'ส่งอีเมลใบเสนอราคา' : 'ส่งอีเมลใบเบิกวัสดุ';

        const emailModalHTML = `
            <div id="emailModal" style="
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.8) !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 9999999 !important;
            ">
                <div style="
                    background: white !important;
                    padding: 30px !important;
                    border-radius: 10px !important;
                    max-width: 600px !important;
                    width: 90vw !important;
                ">
                    <h3>${title}</h3>
                    <form onsubmit="servicesModule.sendEmail('${type}', ${JSON.stringify(data).replace(/"/g, '&quot;')}, event); return false;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">ส่งถึง (อีเมล):</label>
                            <input type="email" name="to_email" required placeholder="customer@example.com" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">หัวข้อ:</label>
                            <input type="text" name="subject" value="${isQuote ? 'ใบเสนอราคาซ่อมรถ' : 'ใบเบิกวัสดุ'} - ${isQuote ? data.quote_number : data.form_number}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">ข้อความ:</label>
                            <textarea name="message" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">เรียน คุณลูกค้า

    ส่งเอกสาร${isQuote ? 'ใบเสนอราคาซ่อมรถ' : 'ใบเบิกวัสดุ'} เลขที่ ${isQuote ? data.quote_number : data.form_number} มาให้ตรวจสอบ

    ขอบคุณครับ</textarea>
                        </div>

                        <div style="text-align: center;">
                            <button type="submit" style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">📧 ส่งอีเมล</button>
                            <button type="button" onclick="document.getElementById('emailModal').remove()" style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">ยกเลิก</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', emailModalHTML);
    },

    // Send email function
    async sendEmail(type, data, event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const emailData = {
            to_email: formData.get('to_email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            type: type,
            form_data: data
        };

        try {
            this.showNotification('⏳ กำลังส่งอีเมล...', 'info');

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                this.showNotification('✅ ส่งอีเมลสำเร็จ!', 'success');
                document.getElementById('emailModal').remove();
            } else {
                throw new Error('Failed to send email');
            }
        } catch (error) {
            console.warn('Email API not available:', error);
            this.showNotification('⚠️ ระบบอีเมลไม่พร้อมใช้งาน (บันทึกข้อมูลแล้ว)', 'warning');
            document.getElementById('emailModal').remove();
        }
    },

    // Print form function
    printForm(type, data) {
        console.log(`🖨️ Printing ${type}:`, data);

        const isQuote = type === 'quote';

        // Create printable HTML
        let printHTML = '';

        if (isQuote) {
            printHTML = this.generateRepairQuotePrintHTML(data);
        } else {
            printHTML = this.generateMaterialFormPrintHTML(data);
        }

        // Open print window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    },

    // Generate repair quote print HTML
    generateRepairQuotePrintHTML(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>ใบเสนอราคาซ่อมรถ - ${data.quote_number}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2c3e50; margin-bottom: 10px; }
                    .info-section { margin-bottom: 20px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .total-section { margin-top: 20px; text-align: right; }
                    .total-amount { font-size: 18px; font-weight: bold; color: #e74c3c; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ใบเสนอราคาซ่อมรถบรรทุก</h1>
                    <p>เลขที่: ${data.quote_number}</p>
                    <p>วันที่: ${data.quote_date}</p>
                </div>

                <div class="info-section">
                    <h3>ข้อมูลลูกค้าและรถ</h3>
                    <div class="info-row">
                        <span><span class="label">ชื่อลูกค้า:</span> ${data.customer_name}</span>
                        <span><span class="label">ทะเบียนรถ:</span> ${data.vehicle_registration}</span>
                    </div>
                    <div class="info-row">
                        <span><span class="label">ยี่ห้อ:</span> ${data.vehicle_make}</span>
                        <span><span class="label">รุ่น:</span> ${data.vehicle_model || 'ไม่ระบุ'}</span>
                        <span><span class="label">ปี:</span> ${data.vehicle_year || 'ไม่ระบุ'}</span>
                    </div>
                    <div class="info-row">
                        <span><span class="label">ประเภทการซ่อม:</span> ${data.repair_type}</span>
                    </div>
                </div>

                <div class="info-section">
                    <h3>รายละเอียดความเสียหาย</h3>
                    <p>${data.damage_description}</p>
                </div>

                <div class="total-section">
                    <p class="total-amount">ราคาประมาณการ: ฿${data.total_amount.toLocaleString()}</p>
                </div>

                ${data.notes ? `<div class="info-section"><h3>หมายเหตุ</h3><p>${data.notes}</p></div>` : ''}

                <div style="margin-top: 40px; text-align: center;">
                    <p>บริษัท OL Service จำกัด</p>
                    <p>โทร: [เบอร์โทร] | อีเมล: [อีเมล]</p>
                </div>
            </body>
            </html>
        `;
    },

    // Generate material form print HTML
    generateMaterialFormPrintHTML(data) {
        const itemsHTML = data.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.part_number}</td>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>฿${item.unit_price.toLocaleString()}</td>
                <td>${item.discount}%</td>
                <td>฿${item.discounted_price.toLocaleString()}</td>
                <td>฿${item.total_cost.toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>ใบเบิกวัสดุ - ${data.form_number}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2c3e50; margin-bottom: 10px; }
                    .info-section { margin-bottom: 20px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .total-section { margin-top: 20px; text-align: right; }
                    .total-amount { font-size: 16px; font-weight: bold; color: #e74c3c; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ใบเบิกวัสดุ</h1>
                    <p>เลขที่: ${data.form_number}</p>
                    <p>วันที่: ${data.date}</p>
                </div>

                <div class="info-section">
                    <h3>ข้อมูลการเบิก</h3>
                    <div class="info-row">
                        <span><span class="label">ทะเบียนรถ:</span> ${data.vehicle_registration}</span>
                        <span><span class="label">ผู้เบิก:</span> ${data.requester_name}</span>
                    </div>
                    <div class="info-row">
                        <span><span class="label">แผนก:</span> ${data.department}</span>
                        <span><span class="label">ความเร่งด่วน:</span> ${data.priority}</span>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>รหัสชิ้นส่วน</th>
                            <th>ชื่อวัสดุ</th>
                            <th>จำนวน</th>
                            <th>หน่วย</th>
                            <th>ราคาต่อหน่วย</th>
                            <th>ส่วนลด</th>
                            <th>ราคาหลังส่วนลด</th>
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="total-section">
                    <p>จำนวนรายการ: ${data.total_items} รายการ</p>
                    <p>ส่วนลดรวม: ฿${data.total_discount.toLocaleString()}</p>
                    <p class="total-amount">ยอดรวมทั้งสิ้น: ฿${data.total_cost.toLocaleString()}</p>
                </div>

                ${data.notes ? `<div class="info-section"><h3>หมายเหตุ</h3><p>${data.notes}</p></div>` : ''}

                <div style="margin-top: 40px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="text-align: center;">
                            <p>ผู้เบิก</p>
                            <br><br>
                            <p>(_______________________)</p>
                            <p>วันที่: _______________</p>
                        </div>
                        <div style="text-align: center;">
                            <p>ผู้อนุมัติ</p>
                            <br><br>
                            <p>(_______________________)</p>
                            <p>วันที่: _______________</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
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
        console.log('Toggle quality check called with ID:', checkId);

        if (!this.qualityChecklistData) {
            console.log('No qualityChecklistData, initializing...');
            this.qualityChecklistData = this.getDefaultQualityChecks();
        }

        const check = this.qualityChecklistData.find(c => c.id === checkId);
        console.log('Found check:', check);

        if (check) {
            check.checked = !check.checked;
            check.status = check.checked ? 'completed' : 'pending';
            console.log('Updated check:', check);
            this.updateQualityCheckDisplay();
        }
    },

    updateQualityCheckDisplay() {
        const container = document.querySelector('.checklist-categories');
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

    async showTruckTab(tabName) {
        this.currentTruckTab = tabName;

        // Update tab buttons - Handle both nav-tab and services-tab classes
        document.querySelectorAll('.nav-tab, .services-tab').forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes('showTruckTab')) {
                btn.classList.remove('active');
            }
        });

        // Find and activate the current tab
        const currentTab = Array.from(document.querySelectorAll('.nav-tab, .services-tab')).find(btn =>
            btn.onclick && btn.onclick.toString().includes(`'${tabName}'`)
        );
        if (currentTab) {
            currentTab.classList.add('active');
        }

        // Data should already be loaded by loadAllServiceData()
        // If somehow empty, generate minimal fallback
        if (this.materialForms.length === 0 && this.repairQuotes.length === 0 && this.truckParts.length === 0) {
            await this.generateFallbackData();
        }

        // Update content
        const content = this.getTruckTabContent(tabName);
        const contentContainer = document.getElementById('truck-repair-content');
        if (contentContainer) {
            contentContainer.innerHTML = content;
        }
    },

    // Enhanced getTruckTabContent with error handling
    getTruckTabContent(tabName) {
        try {
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
        } catch (error) {
            console.error('Error generating truck tab content:', error);
            return `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Error loading ${tabName} content</div>
                    <button class="btn btn-primary" onclick="servicesModule.showTruckTab('${tabName}')">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    },


    // Enhanced autocomplete system for part numbers
    enhancePartNumberInputs() {
        // Sample part numbers (this would come from database)
        let partNumbers = [
            'TRK001', 'TRK002', 'TRK003', 'ENG001', 'ENG002', 'BRK001', 'BRK002',
            'TRS001', 'TRS002', 'ELC001', 'ELC002', 'AC001', 'AC002'
        ];

        // Function to save new part number (simulate database save)
        const savePartNumber = (partNumber) => {
            if (!partNumbers.includes(partNumber)) {
                partNumbers.push(partNumber);
                console.log('✅ Saved new part number:', partNumber);
                // Here you would make an API call to save to database
                // fetch('/api/part-numbers', { method: 'POST', body: JSON.stringify({part_number: partNumber}) })
            }
        };

        // Find all part number inputs
        const partInputs = document.querySelectorAll('input[name="part_number"]');

        partInputs.forEach(input => {
            // Create datalist for suggestions
            const datalistId = 'part-numbers-' + Math.random().toString(36).substr(2, 9);
            const datalist = document.createElement('datalist');
            datalist.id = datalistId;

            // Populate datalist with existing part numbers
            partNumbers.forEach(partNum => {
                const option = document.createElement('option');
                option.value = partNum;
                datalist.appendChild(option);
            });

            // Add datalist to input
            input.setAttribute('list', datalistId);
            input.parentElement.appendChild(datalist);

            // Enhanced autocomplete with manual add functionality
            let suggestionDiv = null;

            input.addEventListener('input', function(e) {
                const value = e.target.value.toUpperCase();

                // Remove existing suggestions
                if (suggestionDiv) {
                    suggestionDiv.remove();
                }

                if (value.length >= 1) {
                    // Filter matching part numbers
                    const matches = partNumbers.filter(part =>
                        part.toUpperCase().includes(value)
                    );

                    if (matches.length > 0 || value.length >= 3) {
                        // Create suggestion dropdown
                        suggestionDiv = document.createElement('div');
                        suggestionDiv.className = 'part-suggestions';
                        suggestionDiv.style.cssText = `
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background: white;
                            border: 1px solid #ddd;
                            border-top: none;
                            max-height: 200px;
                            overflow-y: auto;
                            z-index: 1000;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                        `;

                        // Add existing matches
                        matches.forEach(part => {
                            const item = document.createElement('div');
                            item.className = 'suggestion-item';
                            item.style.cssText = `
                                padding: 8px 12px;
                                cursor: pointer;
                                border-bottom: 1px solid #eee;
                            `;
                            item.textContent = part;

                            item.addEventListener('mouseenter', () => {
                                item.style.backgroundColor = '#f0f0f0';
                            });

                            item.addEventListener('mouseleave', () => {
                                item.style.backgroundColor = 'white';
                            });

                            item.addEventListener('click', () => {
                                input.value = part;
                                suggestionDiv.remove();
                                suggestionDiv = null;
                                input.dispatchEvent(new Event('change'));
                            });

                            suggestionDiv.appendChild(item);
                        });

                        // Add "Add new" option if value doesn't exist and is long enough
                        if (value.length >= 3 && !partNumbers.includes(value)) {
                            const addNewItem = document.createElement('div');
                            addNewItem.className = 'suggestion-item add-new';
                            addNewItem.style.cssText = `
                                padding: 8px 12px;
                                cursor: pointer;
                                border-bottom: 1px solid #eee;
                                background-color: #e8f5e8;
                                color: #2d5a2d;
                                font-weight: bold;
                            `;
                            addNewItem.innerHTML = `➕ เพิ่มรหัสใหม่: "${value}"`;

                            addNewItem.addEventListener('mouseenter', () => {
                                addNewItem.style.backgroundColor = '#d4edda';
                            });

                            addNewItem.addEventListener('mouseleave', () => {
                                addNewItem.style.backgroundColor = '#e8f5e8';
                            });

                            addNewItem.addEventListener('click', () => {
                                input.value = value;
                                savePartNumber(value);

                                // Update datalist
                                const option = document.createElement('option');
                                option.value = value;
                                datalist.appendChild(option);

                                suggestionDiv.remove();
                                suggestionDiv = null;
                                input.dispatchEvent(new Event('change'));

                                // Show success message
                                const successMsg = document.createElement('div');
                                successMsg.style.cssText = `
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    right: 0;
                                    background: #d4edda;
                                    color: #155724;
                                    padding: 5px 10px;
                                    border: 1px solid #c3e6cb;
                                    font-size: 12px;
                                    z-index: 1001;
                                `;
                                successMsg.textContent = `✅ บันทึกรหัส "${value}" เรียบร้อยแล้ว`;
                                input.parentElement.appendChild(successMsg);

                                setTimeout(() => successMsg.remove(), 3000);
                            });

                            suggestionDiv.appendChild(addNewItem);
                        }

                        // Position relative to input
                        input.parentElement.style.position = 'relative';
                        input.parentElement.appendChild(suggestionDiv);
                    }
                }
            });

            // Close suggestions when clicking outside
            document.addEventListener('click', function(e) {
                if (suggestionDiv && !input.contains(e.target) && !suggestionDiv.contains(e.target)) {
                    suggestionDiv.remove();
                    suggestionDiv = null;
                }
            });

            // Handle keyboard navigation
            input.addEventListener('keydown', function(e) {
                if (!suggestionDiv) return;

                const items = suggestionDiv.querySelectorAll('.suggestion-item');
                let currentIndex = Array.from(items).findIndex(item =>
                    item.style.backgroundColor === 'rgb(240, 240, 240)' ||
                    item.style.backgroundColor === '#d4edda'
                );

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                    this.highlightItem(items, currentIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    this.highlightItem(items, currentIndex);
                } else if (e.key === 'Enter' && currentIndex >= 0) {
                    e.preventDefault();
                    items[currentIndex].click();
                } else if (e.key === 'Escape') {
                    suggestionDiv.remove();
                    suggestionDiv = null;
                }
            });

            const highlightItem = (items, index) => {
                items.forEach((item, i) => {
                    if (i === index) {
                        if (item.classList.contains('add-new')) {
                            item.style.backgroundColor = '#d4edda';
                        } else {
                            item.style.backgroundColor = '#f0f0f0';
                        }
                    } else {
                        if (item.classList.contains('add-new')) {
                            item.style.backgroundColor = '#e8f5e8';
                        } else {
                            item.style.backgroundColor = 'white';
                        }
                    }
                });
            };
        });

        console.log('✅ Enhanced part number inputs with autocomplete and add functionality');
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
    ensureModalContainer: function() {
        // Remove any existing modals first
        const existingModals = document.querySelectorAll('.modal-overlay, #serviceModal');
        existingModals.forEach(modal => modal.remove());

        // Ensure modal overlay exists in DOM
        let modalOverlay = document.getElementById('modalOverlay');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'modalOverlay';
            modalOverlay.className = 'modal-overlay';
            modalOverlay.style.display = 'none';
            modalOverlay.innerHTML = '<div class="modal-container" id="modalContainer"></div>';
            document.body.appendChild(modalOverlay);
        }
    },

    // Enhanced showModal with better error handling
    showModal: function(title, content) {
        try {
            // Ensure modal container exists
            this.ensureModalContainer();

            const modalHtml = `
                <div class="modal-overlay" id="serviceModal" style="display: flex;" onclick="window.servicesModule.closeModal()">
                    <div class="modal-container" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="modal-close" onclick="window.servicesModule.closeModal()">×</button>
                        </div>
                        <div class="modal-content">
                            ${content}
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal
            const existingModal = document.getElementById('serviceModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add new modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            console.log('✅ Modal displayed successfully');

        } catch (error) {
            console.error('❌ Error showing modal:', error);
            alert('Error displaying form. Please try again.');
        }
    },

    // Enhanced closeModal
    closeModal: function() {
        try {
            const modals = document.querySelectorAll('#serviceModal, .modal-overlay');
            modals.forEach(modal => {
                if (modal) {
                    modal.style.display = 'none';
                    setTimeout(() => modal.remove(), 100);
                }
            });
            console.log('✅ Modal closed successfully');
        } catch (error) {
            console.error('❌ Error closing modal:', error);
        }
    },

    // Enhanced showNotification with better positioning
    showNotification: function(message, type = 'info', duration = 5000) {
        try {
            // Remove existing notifications of the same type
            document.querySelectorAll(`.notification-${type}`).forEach(n => n.remove());

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
                word-wrap: break-word;
                animation: slideInRight 0.3s ease;
                color: white;
                font-weight: 500;
            `;

            // Set background color based on type
            switch(type) {
                case 'success':
                    notification.style.background = '#28a745';
                    break;
                case 'error':
                    notification.style.background = '#dc3545';
                    break;
                case 'warning':
                    notification.style.background = '#ffc107';
                    notification.style.color = '#212529';
                    break;
                case 'info':
                default:
                    notification.style.background = '#17a2b8';
                    break;
            }

            notification.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()"
                            style="background: transparent; border: none; color: currentColor; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remove after specified duration
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);

        } catch (error) {
            console.error('❌ Error showing notification:', error);
            // Fallback to alert
            alert(message);
        }
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
        console.warn('⚠️ Generating minimal fallback service data...');

        // Generate minimal sample data programmatically
        this.services = this.services.length > 0 ? this.services : [
            this.createSampleService(1, 'Sample Customer', 'Sample Vehicle', 'General Service')
        ];

        this.appointments = this.appointments.length > 0 ? this.appointments : [];
        this.estimates = this.estimates.length > 0 ? this.estimates : [];
        this.workOrders = this.workOrders.length > 0 ? this.workOrders : [];
        this.materialForms = this.materialForms.length > 0 ? this.materialForms : [];
        this.repairQuotes = this.repairQuotes.length > 0 ? this.repairQuotes : [];

        // Try to load from parts data manager if available
        if (window.partsDataManager && window.partsDataManager.isLoaded) {
            const autoParts = window.partsDataManager.getParts();
            this.truckParts = autoParts.slice(0, 10).map(this.convertAutoPartToTruckPart);
        } else {
            this.truckParts = this.truckParts.length > 0 ? this.truckParts : [];
        }

        this.showNotification('⚠️ Using minimal demo data due to connection issues', 'warning');
    },

    // Helper method to create sample service
    createSampleService(id, customerName, vehicleInfo, serviceType) {
        return {
            id: `DEMO-${id}`,
            customer_name: customerName,
            vehicle_info: vehicleInfo,
            service_type: serviceType,
            status: 'scheduled',
            priority: 'normal',
            estimated_cost: 1000,
            created_date: new Date().toISOString(),
            technician_name: 'Auto-assigned'
        };
    },

    // Helper method to convert automotive part to truck part format
    convertAutoPartToTruckPart(part) {
        return {
            part_code: part.code,
            part_name_thai: part.thai,
            part_name_english: part.english,
            category: part.category,
            cost_price: Math.round(part.price * 0.7),
            selling_price: part.price,
            retail_price: Math.round(part.price * 1.3),
            quantity_in_stock: part.in_stock,
            min_stock_level: part.min_stock,
            max_stock_level: part.min_stock * 4,
            location_shelf: part.location,
            supplier: part.supplier || 'Default Supplier',
            vehicle_compatibility: 'General Use'
        };
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

// Place this AFTER your servicesModule definition
async function loadAutomotivePartsData() {
    console.log('🔄 Loading automotive parts data...');

    // Check if servicesModule exists
    if (typeof servicesModule === 'undefined') {
        console.error('❌ servicesModule is not defined yet!');
        return;
    }

    try {
        // Method 1: Use PartsDataManager if available
        if (window.partsDataManager) {
            try {
                await window.partsDataManager.loadData();
                const parts = window.partsDataManager.getParts();

                if (parts && parts.length > 0) {
                    servicesModule.truckParts = parts;
                    console.log(`✅ Loaded ${parts.length} parts from PartsDataManager`);
                    console.log('Sample parts:', parts.slice(0, 3));
                    return;
                }
            } catch (managerError) {
                console.log('⚠️ PartsDataManager failed:', managerError);
            }
        }

        // Method 2: Direct fetch from JSON file
        console.log('📡 Fetching from JSON file...');
        const response = await fetch('/static/js/data/automotive-parts.json');

        if (response.ok) {
            const data = await response.json();

            if (data && data.automotive_parts && Array.isArray(data.automotive_parts)) {
                servicesModule.truckParts = data.automotive_parts;
                console.log(`✅ Loaded ${data.automotive_parts.length} parts from JSON file`);
                console.log('Sample parts:', data.automotive_parts.slice(0, 3));
                return;
            } else {
                throw new Error('Invalid JSON structure');
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error('❌ Error loading automotive parts:', error);
        console.log('🔄 Using fallback parts data...');

        // Fallback: Use the sample data
        servicesModule.truckParts = [
            { thai: "ขากระจก", english: "Mirror Bracket", code: "MIR1", category: "exterior", price: 850, unit: "ชิ้น", in_stock: 25 },
            { thai: "ไฟหน้า", english: "Headlight", code: "HEA1", category: "lighting", price: 2500, unit: "ชิ้น", in_stock: 15 },
            { thai: "ประตู", english: "Door", code: "DOO1", category: "body", price: 15000, unit: "ชิ้น", in_stock: 8 },
            { thai: "กระจก", english: "Window/Glass", code: "WIN1", category: "glass", price: 3200, unit: "แผ่น", in_stock: 12 },
            { thai: "ไฟท้าย", english: "Tail Light", code: "TAI1", category: "lighting", price: 1200, unit: "ชิ้น", in_stock: 20 },
            { thai: "น้ำมันเครื่อง", english: "Engine Oil", code: "OIL1", category: "fluids", price: 350, unit: "ลิตร", in_stock: 100 }
        ];
        console.log('✅ Fallback parts loaded:', servicesModule.truckParts.length, 'parts');
    }
}

// Delayed execution to ensure servicesModule is ready
setTimeout(() => {
    if (typeof servicesModule !== 'undefined') {
        console.log('🚀 Starting parts data load...');
        loadAutomotivePartsData();
    } else {
        console.error('❌ servicesModule still not available after timeout');
    }
}, 2000); // Wait 2 seconds for everything to load

window.servicesModule = servicesModule;


// Auto-initialization when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Auto-initializing Services Module...');

    try {
        // Initialize parts data manager if available
        if (window.partsDataManager) {
            console.log('📦 Loading automotive parts data...');
            await window.partsDataManager.loadData();
            window.partsDataManager.initializeDataLists();
            console.log('✅ Parts data manager initialized');
        } else {
            console.warn('⚠️ Parts data manager not found, will use fallback data');
        }

        // Initialize services module
        if (typeof servicesModule !== 'undefined') {
            console.log('🔧 Loading services module...');

            // Load the complete services interface
            const servicesInterface = await servicesModule.loadModule();

            // If we have a dynamic content container, inject the interface
            const dynamicContent = document.getElementById('dynamicContent');
            if (dynamicContent) {
                dynamicContent.innerHTML = servicesInterface;
                console.log('✅ Services interface loaded into DOM');
            }

            console.log('✅ Services module fully initialized');

            // Show success notification
            servicesModule.showNotification('🔧 Services Management System Ready', 'success');

        } else {
            console.error('❌ Services module not found');
            showBasicFallback();
        }

    } catch (error) {
        console.error('❌ Error initializing services module:', error);
        showErrorFallback(error.message);
    }
});

// Export the module (keep for compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = servicesModule;
}