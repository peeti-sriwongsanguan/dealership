// static/js/app.js - Enhanced with Photo Session Integration
/**
 * Main Application Controller
 * Enhanced with comprehensive photo documentation system
 */

class OLServiceApp {
    constructor() {
        this.currentSection = 'welcome';
        this.apiStatus = 'unknown';
        this.fabMenuOpen = false;
        console.log('🏗️ OLServiceApp constructor called');
        this.init().catch(error => {
            console.error('❌ App initialization failed:', error);
            this.forceShowApp();
        });
    }

    async init() {
        console.log('🚀 Initializing OL Service POS...');

        try {
            // Force show app after 2 seconds as fallback
            setTimeout(() => {
                this.forceShowApp();
            }, 2000);

            // Hide loading screen immediately
            this.hideLoadingScreen();

            // Initialize API status checking
            await this.checkApiStatus();

            // Bind navigation events
            this.bindNavigation();

            // Bind FAB events
            this.bindFABEvents();

            // Bind global events
            this.bindGlobalEvents();

            // Handle initial route
            this.handleInitialRoute();

            console.log('✅ Application initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.forceShowApp();
            throw error;
        }
    }

    forceShowApp() {
        console.log('🔧 Force showing app...');
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('✅ Loading screen hidden (forced)');
        }

        if (app) {
            app.style.display = 'block';
            console.log('✅ App shown (forced)');
        }
    }

    hideLoadingScreen() {
        console.log('⏰ Setting loading screen timer...');
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        if (loadingScreen && app) {
            // Quick timer - show app almost immediately
            setTimeout(() => {
                console.log('⏰ Quick timer expired, hiding loading screen...');
                loadingScreen.style.display = 'none';
                app.style.display = 'block';
                app.style.opacity = '1';
                console.log('✅ Loading screen hidden, app shown');
            }, 100);

            // Backup timer in case something interferes
            setTimeout(() => {
                if (loadingScreen.style.display !== 'none') {
                    loadingScreen.style.display = 'none';
                    app.style.display = 'block';
                    console.log('🔧 Backup timer activated');
                }
            }, 1500);
        } else {
            console.error('❌ Missing elements:', {
                loadingScreen: !!loadingScreen,
                app: !!app
            });
        }
    }

    async checkApiStatus() {
        console.log('🔍 Checking API status...');
        try {
            const response = await fetch('/api');
            if (response.ok) {
                console.log('✅ API is online');
                this.updateApiStatus('online');
            } else {
                console.log('⚠️ API returned error status:', response.status);
                this.updateApiStatus('error');
            }
        } catch (error) {
            console.error('❌ API Status Check Failed:', error);
            this.updateApiStatus('offline');
        }
    }

    updateApiStatus(status) {
        this.apiStatus = status;
        const statusElement = document.getElementById('apiStatus');
        const statusDot = statusElement?.querySelector('.status-dot');
        const statusText = statusElement?.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot';

            switch (status) {
                case 'online':
                    statusDot.classList.add('online');
                    statusText.textContent = 'Online';
                    break;
                case 'offline':
                    statusDot.classList.add('offline');
                    statusText.textContent = 'Offline';
                    break;
                case 'error':
                    statusDot.classList.add('error');
                    statusText.textContent = 'Error';
                    break;
                default:
                    statusText.textContent = 'Unknown';
            }
        }
    }

    bindNavigation() {
        console.log('🧭 Binding navigation...');
        const navButtons = document.querySelectorAll('.nav-button');
        console.log(`Found ${navButtons.length} navigation buttons`);

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.dataset.section;
                console.log(`🧭 Navigating to section: ${section}`);
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.loadSection(e.state.section, false);
            }
        });
    }

    bindFABEvents() {
        console.log('🎯 Binding FAB events...');
        const fabButton = document.getElementById('fabButton');

        if (fabButton) {
            fabButton.addEventListener('click', () => {
                this.toggleFABMenu();
            });
            console.log('✅ FAB button bound');
        } else {
            console.log('⚠️ FAB button not found');
        }

        // FAB option handlers
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="add-customer"]')) {
                this.handleAddCustomer();
            }
            if (e.target.matches('[data-action="add-vehicle"]')) {
                this.handleAddVehicle();
            }
            if (e.target.matches('[data-action="new-service"]')) {
                this.handleNewService();
            }

            // Photo session quick actions
            if (e.target.matches('[data-action="quick-checkin"]')) {
                this.handleQuickCheckIn();
            }
            if (e.target.matches('[data-action="quick-checkout"]')) {
                this.handleQuickCheckOut();
            }

            // Close FAB menu when clicking outside
            if (!e.target.closest('.fab-container')) {
                this.closeFABMenu();
            }
        });
    }

    bindGlobalEvents() {
        console.log('🌐 Binding global events...');

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }

            // Ctrl/Cmd + number keys for quick navigation
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const sections = ['customers', 'vehicles', 'services', 'damage', 'photos', 'reports', 'settings'];
                const index = parseInt(e.key) - 1;
                if (sections[index]) {
                    this.navigateToSection(sections[index]);
                }
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.checkApiStatus();
            if (typeof showToast !== 'undefined') {
                showToast('Connection restored', 'success');
            }
        });

        window.addEventListener('offline', () => {
            this.updateApiStatus('offline');
            if (typeof showToast !== 'undefined') {
                showToast('Connection lost', 'warning');
            }
        });

        // Auto-refresh API status every 30 seconds
        setInterval(() => {
            this.checkApiStatus();
        }, 30000);
    }

    toggleFABMenu() {
        this.fabMenuOpen = !this.fabMenuOpen;
        const fabMenu = document.getElementById('fabMenu');
        const fabButton = document.getElementById('fabButton');

        if (fabMenu && fabButton) {
            if (this.fabMenuOpen) {
                fabMenu.classList.add('active');
                fabButton.classList.add('active');
            } else {
                fabMenu.classList.remove('active');
                fabButton.classList.remove('active');
            }
        }
    }

    closeFABMenu() {
        this.fabMenuOpen = false;
        const fabMenu = document.getElementById('fabMenu');
        const fabButton = document.getElementById('fabButton');

        if (fabMenu && fabButton) {
            fabMenu.classList.remove('active');
            fabButton.classList.remove('active');
        }
    }

    navigateToSection(section) {
        console.log(`🧭 Navigating to: ${section}`);
        // Update URL without page refresh
        const url = new URL(window.location);
        url.hash = section;
        window.history.pushState({ section }, '', url);

        // Load the section
        this.loadSection(section, true);
    }

    async loadSection(section, addToHistory = true) {
        console.log(`📄 Loading section: ${section}`);
        try {
            // Update current section
            this.currentSection = section;

            // Update navigation state
            this.updateNavigationState(section);

            // Show loading state
            this.showContentLoading();

            // Load section content
            let content = '';

            switch (section) {
                case 'customers':
                    content = await this.loadCustomersSection();
                    break;
                case 'vehicles':
                    content = await this.loadVehiclesSection();
                    break;
                case 'services':
                    content = await this.loadServicesSection();
                    break;
                case 'damage':
                    content = await this.loadDamageSection();
                    break;
                case 'photos':
                    content = await this.loadPhotosSection();
                    break;
                case 'reports':
                    content = await this.loadReportsSection();
                    break;
                case 'settings':
                    content = await this.loadSettingsSection();
                    break;
                default:
                    content = this.getWelcomeContent();
                    section = 'welcome';
            }

            // Update content
            this.updateMainContent(content);

            // Update FAB options based on current section
            this.updateFABOptions(section);

            // Close FAB menu
            this.closeFABMenu();

            console.log(`✅ Section loaded: ${section}`);

        } catch (error) {
            console.error('❌ Error loading section:', error);
            this.showErrorContent(`Failed to load ${section} section: ${error.message}`);
        }
    }

    updateNavigationState(section) {
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current section
        const activeButton = document.querySelector(`[data-section="${section}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    showContentLoading() {
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <div class="content-loader">
                    <div class="loader-spinner"></div>
                    <p class="loader-text">Loading...</p>
                </div>
            `;
            dynamicContent.style.display = 'block';
        }

        // Hide welcome section
        const welcomeSection = document.getElementById('welcomeSection');
        if (welcomeSection) {
            welcomeSection.classList.remove('active');
        }
    }

    updateMainContent(content) {
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = content;
            dynamicContent.style.display = 'block';
        }

        // Hide welcome section
        const welcomeSection = document.getElementById('welcomeSection');
        if (welcomeSection) {
            welcomeSection.classList.remove('active');
        }
    }

    showErrorContent(message) {
        this.updateMainContent(`
            <div class="error-content">
                <div class="error-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Reload Page
                </button>
            </div>
        `);
    }

    getWelcomeContent() {
        // Show welcome section instead of dynamic content
        const welcomeSection = document.getElementById('welcomeSection');
        const dynamicContent = document.getElementById('dynamicContent');

        if (welcomeSection && dynamicContent) {
            welcomeSection.classList.add('active');
            dynamicContent.style.display = 'none';
        }

        return '';
    }

    updateFABOptions(section) {
        const fabMenu = document.getElementById('fabMenu');
        if (!fabMenu) return;

        let fabOptions = '';

        switch (section) {
            case 'customers':
                fabOptions = `
                    <button class="fab-option" data-action="add-customer">
                        <span class="fab-option-icon">👤</span>
                        <span class="fab-option-text">Add Customer</span>
                    </button>
                `;
                break;

            case 'vehicles':
                fabOptions = `
                    <button class="fab-option" data-action="add-vehicle">
                        <span class="fab-option-icon">🚗</span>
                        <span class="fab-option-text">Add Vehicle</span>
                    </button>
                    <button class="fab-option" data-action="quick-checkin">
                        <span class="fab-option-icon">✅</span>
                        <span class="fab-option-text">Quick Check-In</span>
                    </button>
                `;
                break;

            case 'services':
                fabOptions = `
                    <button class="fab-option" data-action="new-service">
                        <span class="fab-option-icon">🔧</span>
                        <span class="fab-option-text">New Service</span>
                    </button>
                    <button class="fab-option" data-action="quick-checkout">
                        <span class="fab-option-icon">📋</span>
                        <span class="fab-option-text">Quick Check-Out</span>
                    </button>
                `;
                break;

            case 'photos':
                fabOptions = `
                    <button class="fab-option" data-action="quick-checkin">
                        <span class="fab-option-icon">✅</span>
                        <span class="fab-option-text">Start Check-In</span>
                    </button>
                    <button class="fab-option" data-action="quick-checkout">
                        <span class="fab-option-icon">📋</span>
                        <span class="fab-option-text">Start Check-Out</span>
                    </button>
                    <button class="fab-option" data-action="damage-photos">
                        <span class="fab-option-icon">🔍</span>
                        <span class="fab-option-text">Damage Photos</span>
                    </button>
                `;
                break;

            case 'damage':
                fabOptions = `
                    <button class="fab-option" data-action="new-damage-report">
                        <span class="fab-option-icon">🔍</span>
                        <span class="fab-option-text">New Inspection</span>
                    </button>
                    <button class="fab-option" data-action="damage-photos">
                        <span class="fab-option-icon">📸</span>
                        <span class="fab-option-text">Photo Documentation</span>
                    </button>
                `;
                break;

            default:
                fabOptions = `
                    <button class="fab-option" data-action="add-customer">
                        <span class="fab-option-icon">👤</span>
                        <span class="fab-option-text">Add Customer</span>
                    </button>
                    <button class="fab-option" data-action="add-vehicle">
                        <span class="fab-option-icon">🚗</span>
                        <span class="fab-option-text">Add Vehicle</span>
                    </button>
                    <button class="fab-option" data-action="new-service">
                        <span class="fab-option-icon">🔧</span>
                        <span class="fab-option-text">New Service</span>
                    </button>
                `;
        }

        fabMenu.innerHTML = fabOptions;
    }

    // Section loading methods
    async loadCustomersSection() {
        console.log('📄 Loading customers section...');
        try {
            if (typeof customersModule !== 'undefined' && customersModule.loadModule) {
                console.log('✅ Using customersModule');
                return await customersModule.loadModule();
            } else {
                console.log('⚠️ customersModule not available, using simple content');
                return this.getSimpleCustomersContent();
            }
        } catch (error) {
            console.error('❌ Error loading customers module:', error);
            return this.getSimpleCustomersContent();
        }
    }

    async loadVehiclesSection() {
        console.log('📄 Loading vehicles section...');
        try {
            if (typeof vehiclesModule !== 'undefined' && vehiclesModule.loadModule) {
                console.log('✅ Using vehiclesModule');
                return await vehiclesModule.loadModule();
            } else {
                console.log('⚠️ vehiclesModule not available, using simple content');
                return this.getSimpleVehiclesContent();
            }
        } catch (error) {
            console.error('❌ Error loading vehicles module:', error);
            return this.getSimpleVehiclesContent();
        }
    }

    async loadServicesSection() {
        console.log('📄 Loading services section...');
        try {
            if (typeof servicesModule !== 'undefined' && servicesModule.loadModule) {
                console.log('✅ Using servicesModule');
                return await servicesModule.loadModule();
            } else {
                console.log('⚠️ servicesModule not available, using simple content');
                return this.getSimpleServicesContent();
            }
        } catch (error) {
            console.error('❌ Error loading services module:', error);
            return this.getSimpleServicesContent();
        }
    }

    async loadDamageSection() {
        console.log('📄 Loading damage section...');
        try {
            if (typeof damageModule !== 'undefined' && damageModule.loadModule) {
                console.log('✅ Using damageModule');
                return await damageModule.loadModule();
            } else {
                console.log('⚠️ damageModule not available, using simple content');
                return this.getSimpleDamageContent();
            }
        } catch (error) {
            console.error('❌ Error loading damage module:', error);
            return this.getSimpleDamageContent();
        }
    }

    async loadPhotosSection() {
        console.log('📄 Loading photos section...');
        try {
            if (typeof photosModule !== 'undefined' && photosModule.loadModule) {
                console.log('✅ Using photosModule');
                return await photosModule.loadModule();
            } else {
                console.log('⚠️ photosModule not available, using simple content');
                return this.getSimplePhotosContent();
            }
        } catch (error) {
            console.error('❌ Error loading photos module:', error);
            return this.getSimplePhotosContent();
        }
    }

    async loadReportsSection() {
        console.log('📄 Loading reports section...');
        try {
            if (typeof reportsModule !== 'undefined' && reportsModule.loadModule) {
                console.log('✅ Using reportsModule');
                return await reportsModule.loadModule();
            } else {
                console.log('⚠️ reportsModule not available, using simple content');
                return this.getSimpleReportsContent();
            }
        } catch (error) {
            console.error('❌ Error loading reports module:', error);
            return this.getSimpleReportsContent();
        }
    }

    async loadSettingsSection() {
        console.log('📄 Loading settings section...');
        try {
            if (typeof settingsModule !== 'undefined' && settingsModule.loadModule) {
                console.log('✅ Using settingsModule');
                return await settingsModule.loadModule();
            } else {
                console.log('⚠️ settingsModule not available, using simple content');
                return this.getSimpleSettingsContent();
            }
        } catch (error) {
            console.error('❌ Error loading settings module:', error);
            return this.getSimpleSettingsContent();
        }
    }

    // Simple content fallbacks
    getSimpleCustomersContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>👥 Customers</h2>
                    <p>Customer management module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full customers module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="window.olServiceApp.testAPI('customers')">
                                Test API
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimpleVehiclesContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>🚗 Vehicles</h2>
                    <p>Vehicle management module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full vehicles module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="window.olServiceApp.testAPI('vehicles')">
                                Test API
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimpleServicesContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>🔧 Services</h2>
                    <p>Service management module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full services module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="window.olServiceApp.testAPI('services')">
                                Test API
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimpleDamageContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>🔍 Damage Inspection</h2>
                    <p>Damage inspection module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full damage inspection module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="console.log('Damage module test')">
                                Test Module
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimplePhotosContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>📸 Photos</h2>
                    <p>Photo documentation module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full photo documentation module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="window.olServiceApp.testAPI('photos')">
                                Test Photos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimpleReportsContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>📊 Reports</h2>
                    <p>Reports and analytics module</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full reports module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="console.log('Reports module test')">
                                Test Module
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSimpleSettingsContent() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h2>⚙️ Settings</h2>
                    <p>Application settings and configuration</p>
                </div>
                <div class="simple-content">
                    <div class="info-card">
                        <h3>✅ Section Working</h3>
                        <p>This is a fallback view. The full settings module will be loaded here.</p>
                        <p><strong>API Status:</strong> ${this.apiStatus}</p>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="console.log('Settings module test')">
                                Test Module
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility method to test API endpoints
    async testAPI(endpoint) {
        console.log(`🧪 Testing ${endpoint} API...`);
        try {
            const response = await fetch(`/api/${endpoint}`);
            const data = await response.json();
            console.log(`✅ ${endpoint} API test successful:`, data);
            showToast(`${endpoint} API working! Found ${data[endpoint]?.length || 0} records`, 'success');
        } catch (error) {
            console.error(`❌ ${endpoint} API test failed:`, error);
            showToast(`${endpoint} API test failed: ${error.message}`, 'error');
        }
    }

    // FAB action handlers
    async handleAddCustomer() {
        console.log('🆕 Add customer clicked');
        this.closeFABMenu();

        if (typeof customersModule !== 'undefined' && customersModule.showAddCustomerModal) {
            customersModule.showAddCustomerModal();
        } else {
            showToast('Customer management not fully loaded', 'warning');
            console.log('Customer module not available');
        }
    }

    async handleAddVehicle() {
        console.log('🆕 Add vehicle clicked');
        this.closeFABMenu();

        if (typeof vehiclesModule !== 'undefined' && vehiclesModule.showAddVehicleModal) {
            vehiclesModule.showAddVehicleModal();
        } else {
            showToast('Vehicle management not fully loaded', 'warning');
            console.log('Vehicle module not available');
        }
    }

    async handleNewService() {
        console.log('🆕 New service clicked');
        this.closeFABMenu();

        if (typeof servicesModule !== 'undefined' && servicesModule.showAddServiceModal) {
            servicesModule.showAddServiceModal();
        } else {
            showToast('Service management not fully loaded', 'warning');
            console.log('Service module not available');
        }
    }

    async handleQuickCheckIn() {
        console.log('✅ Quick check-in clicked');
        this.closeFABMenu();

        if (typeof photosModule !== 'undefined' && photosModule.handleNewCheckIn) {
            await photosModule.handleNewCheckIn();
        } else {
            showToast('Photo documentation not fully loaded', 'warning');
            console.log('Photos module not available');
        }
    }

    async handleQuickCheckOut() {
        console.log('📋 Quick check-out clicked');
        this.closeFABMenu();

        if (typeof photosModule !== 'undefined' && photosModule.handleNewCheckOut) {
            await photosModule.handleNewCheckOut();
        } else {
            showToast('Photo documentation not fully loaded', 'warning');
            console.log('Photos module not available');
        }
    }

    closeActiveModal() {
        // Close any open modals
        if (typeof closeModal !== 'undefined') {
            closeModal();
        }

        // Close FAB menu
        this.closeFABMenu();
    }

    handleInitialRoute() {
        // Check URL hash for initial route
        const hash = window.location.hash.substring(1);
        if (hash && hash !== 'welcome') {
            this.loadSection(hash, false);
        } else {
            // Show welcome content
            this.currentSection = 'welcome';
            this.updateFABOptions('welcome');
        }
    }
}

// Utility functions for the application
class UIUtils {
    static showToast(message, type = 'info', duration = 3000) {
        console.log(`📢 Toast: ${message} (${type})`);

        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.log('⚠️ Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icon[type] || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        // Add entrance animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
    }

    static showModal(title, content, size = 'medium') {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.log('⚠️ Modal elements not found');
            return;
        }

        modalContainer.className = `modal-container modal-${size}`;
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        `;

        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add entrance animation
        setTimeout(() => {
            modalOverlay.classList.add('show');
        }, 10);
    }

    static closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';

            setTimeout(() => {
                modalOverlay.style.display = 'none';
            }, 300);
        }
    }

    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (error) {
            return 'Invalid Date';
        }
    }

    static formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0.00';
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        } catch (error) {
            return `${amount}`;
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
}

// Global utility functions
window.showToast = UIUtils.showToast;
window.showModal = UIUtils.showModal;

window.formatDate = UIUtils.formatDate;
window.formatCurrency = UIUtils.formatCurrency;

//await window.customersModule.loadCustomers();
//return await window.customersModule.loadModule();


// Debug helpers
window.debugApp = {
    showApp: () => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        console.log('🔧 App manually shown');
    },
    hideApp: () => {
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        console.log('🔧 App manually hidden');
    },
    testAPI: async (endpoint) => {
        if (window.olServiceApp) {
            await window.olServiceApp.testAPI(endpoint);
        } else {
            console.log('❌ App not initialized');
        }
    },
    checkModules: () => {
        const modules = {
            'customersModule': typeof customersModule !== 'undefined',
            'vehiclesModule': typeof vehiclesModule !== 'undefined',
            'servicesModule': typeof servicesModule !== 'undefined',
            'photosModule': typeof photosModule !== 'undefined',
            'damageModule': typeof damageModule !== 'undefined',
            'reportsModule': typeof reportsModule !== 'undefined',
            'settingsModule': typeof settingsModule !== 'undefined'
        };
        console.log('📦 Module Status:', modules);
        return modules;
    },
    navigate: (section) => {
        if (window.olServiceApp) {
            window.olServiceApp.navigateToSection(section);
        } else {
            console.log('❌ App not initialized');
        }
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing app...');
    try {
        window.olServiceApp = new OLServiceApp();
        console.log('✅ App object created and stored in window.olServiceApp');

        // Make app accessible for debugging
        window.app = window.olServiceApp;

    } catch (error) {
        console.error('❌ Failed to create app:', error);

        // Fallback - show app anyway
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            const app = document.getElementById('app');
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (app) app.style.display = 'block';
            console.log('🔧 Fallback app display activated');
        }, 1000);
    }
});

// Handle any uncaught errors
window.addEventListener('error', (e) => {
    console.error('Application Error:', e.error);
    if (typeof showToast !== 'undefined') {
        showToast('An unexpected error occurred', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    if (typeof showToast !== 'undefined') {
        showToast('An unexpected error occurred', 'error');
    }
});

// PWA Service Worker Registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Additional debugging and development helpers
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('192.168')) {
    console.log('🔧 Development mode detected - adding debug helpers');

    // Add debug panel toggle (Ctrl+Shift+D)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('🔧 Debug info:');
            console.log('- App object:', window.olServiceApp);
            console.log('- Current section:', window.olServiceApp?.currentSection);
            console.log('- API status:', window.olServiceApp?.apiStatus);
            console.log('- Available modules:', window.debugApp.checkModules());

            showToast('Debug info logged to console', 'info');
        }
    });

    // Add performance monitoring
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadTime = performance.now();
            console.log(`⚡ Page load completed in ${loadTime.toFixed(2)}ms`);
        }, 100);
    });
}

// Export for testing and debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OLServiceApp, UIUtils };
}

console.log('📱 OL Service POS Application Loaded');
console.log('🔧 Features: Customer Management, Vehicle Tracking, Service Orders');
console.log('📸 Photo Documentation: Check-in/Check-out, Damage Inspection');
console.log('🚀 Ready for use!');
console.log('💡 Debug helpers available at window.debugApp');
console.log('💡 Press Ctrl+Shift+D for debug info');