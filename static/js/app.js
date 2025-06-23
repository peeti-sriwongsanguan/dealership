// static/js/app.js - Updated with Settings Support
/**
 * OL Service POS - Main Application Controller
 * Professional mobile-first service management system
 */

class OLServiceApp {
    constructor() {
        this.currentSection = null;
        this.isLoading = false;
        this.apiHealthy = false;

        // Application state
        this.state = {
            customers: [],
            vehicles: [],
            services: [],
            currentUser: null,
            settings: {}
        };

        // Event handlers
        this.eventHandlers = new Map();

        // Initialize application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing OL Service POS...');

            // Show loading screen
            this.showLoadingScreen();

            // Initialize components
            await this.initializeComponents();

            // Check API health
            await this.checkAPIHealth();

            // Setup event listeners
            this.setupEventListeners();

            // Setup touch optimizations
            this.setupTouchOptimizations();

            // Initialize modules
            await this.initializeModules();

            // Hide loading screen and show app
            await this.hideLoadingScreen();

            console.log('✅ OL Service POS initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize application', error.message);
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (app) app.style.display = 'none';
    }

    /**
     * Hide loading screen with animation
     */
    async hideLoadingScreen() {
        return new Promise((resolve) => {
            const loadingScreen = document.getElementById('loadingScreen');
            const app = document.getElementById('app');

            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    if (app) {
                        app.style.display = 'flex';
                        app.style.opacity = '0';
                        setTimeout(() => {
                            app.style.opacity = '1';
                            resolve();
                        }, 50);
                    } else {
                        resolve();
                    }
                }, 300);
            } else {
                if (app) app.style.display = 'flex';
                resolve();
            }
        });
    }

    /**
     * Initialize core components
     */
    async initializeComponents() {
        // Initialize UI components
        if (window.UI) {
            window.UI.init();
        }

        // Initialize API client
        if (window.API) {
            window.API.init();
        }

        // Initialize utility functions
        if (window.Utils) {
            window.Utils.init();
        }

        // Initialize Components
        if (window.Components) {
            window.Components.init();
        }
    }

    /**
     * Check API health and update status indicator
     */
    async checkAPIHealth() {
        try {
            const response = await fetch('/api');
            const data = await response.json();

            this.apiHealthy = response.ok;
            this.updateAPIStatus(this.apiHealthy, data);

            console.log('📡 API Health Check:', this.apiHealthy ? 'Healthy' : 'Unhealthy');

        } catch (error) {
            console.error('📡 API Health Check Failed:', error);
            this.apiHealthy = false;
            this.updateAPIStatus(false, { error: error.message });
        }
    }

    /**
     * Update API status indicator
     */
    updateAPIStatus(healthy, data = {}) {
        const statusIndicator = document.getElementById('apiStatus');
        const statusDot = statusIndicator?.querySelector('.status-dot');
        const statusText = statusIndicator?.querySelector('.status-text');

        if (statusDot) {
            statusDot.className = healthy ? 'status-dot' : 'status-dot offline';
        }

        if (statusText) {
            statusText.textContent = healthy ? 'Online' : 'Offline';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation button events
        this.setupNavigationEvents();

        // FAB (Floating Action Button) events
        this.setupFABEvents();

        // Modal events
        this.setupModalEvents();

        // Keyboard events
        this.setupKeyboardEvents();

        // Window events
        this.setupWindowEvents();
    }

    /**
     * Setup navigation events
     */
    setupNavigationEvents() {
        const navButtons = document.querySelectorAll('.nav-button[data-section]');

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    /**
     * Setup FAB events
     */
    setupFABEvents() {
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');

        if (fabButton && fabMenu) {
            fabButton.addEventListener('click', () => {
                this.toggleFABMenu();
            });

            // FAB option events
            const fabOptions = fabMenu.querySelectorAll('.fab-option[data-action]');
            fabOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = option.dataset.action;
                    this.handleFABAction(action);
                    this.closeFABMenu();
                });
            });

            // Close FAB menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!fabButton.contains(e.target) && !fabMenu.contains(e.target)) {
                    this.closeFABMenu();
                }
            });
        }
    }

    /**
     * Setup modal events
     */
    setupModalEvents() {
        const modalOverlay = document.getElementById('modalOverlay');

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
    }

    /**
     * Setup keyboard events
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC key closes modals and menus
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeFABMenu();
            }

            // Ctrl/Cmd + K for quick search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showQuickSearch();
            }
        });
    }

    /**
     * Setup window events
     */
    setupWindowEvents() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.checkAPIHealth();
            this.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.updateAPIStatus(false, { error: 'No internet connection' });
            this.showToast('Connection lost', 'warning');
        });

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAPIHealth();
            }
        });
    }

    /**
     * Setup touch optimizations
     */
    setupTouchOptimizations() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent pinch zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        // Add touch feedback to buttons
        this.addTouchFeedback();
    }

    /**
     * Add haptic feedback to touch interactions
     */
    addTouchFeedback() {
        const buttons = document.querySelectorAll('button, .nav-button, .fab, .fab-option');

        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                // Haptic feedback (if supported)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                // Visual feedback
                button.style.transform = 'scale(0.95)';
            });

            button.addEventListener('touchend', () => {
                // Reset visual feedback
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            });
        });
    }

    /**
     * Initialize modules
     */
    async initializeModules() {
        const modules = ['Settings', 'Customers', 'Vehicles', 'Services', 'Damage', 'Photos', 'Reports'];

        for (const moduleName of modules) {
            if (window[moduleName]) {
                try {
                    await window[moduleName].init();
                    console.log(`✅ ${moduleName} module initialized`);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${moduleName} module:`, error);
                }
            }
        }
    }

    /**
     * Navigate to a specific section
     */
    async navigateToSection(sectionName) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentSection = sectionName;

        try {
            // Hide welcome section
            this.hideWelcomeSection();

            // Show loading state
            this.showContentLoader(`Loading ${sectionName}...`);

            // Load section content based on module
            switch (sectionName) {
                case 'customers':
                    await this.loadCustomersSection();
                    break;
                case 'vehicles':
                    await this.loadVehiclesSection();
                    break;
                case 'services':
                    await this.loadServicesSection();
                    break;
                case 'damage':
                    await this.loadDamageSection();
                    break;
                case 'photos':
                    await this.loadPhotosSection();
                    break;
                case 'reports':
                    await this.loadReportsSection();
                    break;
                case 'settings':
                    await this.loadSettingsSection();
                    break;
                default:
                    throw new Error(`Unknown section: ${sectionName}`);
            }

        } catch (error) {
            console.error(`Failed to load ${sectionName} section:`, error);
            this.showError(`Failed to load ${sectionName}`, error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load customers section
     */
    async loadCustomersSection() {
        if (window.Customers) {
            await window.Customers.load();
        } else {
            throw new Error('Customers module not available');
        }
    }

    /**
     * Load vehicles section
     */
    async loadVehiclesSection() {
        if (window.Vehicles) {
            await window.Vehicles.load();
        } else {
            throw new Error('Vehicles module not available');
        }
    }

    /**
     * Load services section
     */
    async loadServicesSection() {
        if (window.Services) {
            await window.Services.load();
        } else {
            throw new Error('Services module not available');
        }
    }

    /**
     * Load damage inspection section
     */
    async loadDamageSection() {
        if (window.Damage) {
            await window.Damage.load();
        } else {
            throw new Error('Damage module not available');
        }
    }

    /**
     * Load photos section
     */
    async loadPhotosSection() {
        if (window.Photos) {
            await window.Photos.load();
        } else {
            throw new Error('Photos module not available');
        }
    }

    /**
     * Load reports section
     */
    async loadReportsSection() {
        if (window.Reports) {
            await window.Reports.load();
        } else {
            throw new Error('Reports module not available');
        }
    }

    /**
     * Load settings section
     */
    async loadSettingsSection() {
        if (window.Settings) {
            await window.Settings.load();
        } else {
            throw new Error('Settings module not available');
        }
    }

    /**
     * Show/hide sections
     */
    hideWelcomeSection() {
        const welcomeSection = document.getElementById('welcomeSection');
        const dynamicContent = document.getElementById('dynamicContent');

        if (welcomeSection) {
            welcomeSection.classList.remove('active');
        }

        if (dynamicContent) {
            dynamicContent.classList.add('active');
        }
    }

    showWelcomeSection() {
        const welcomeSection = document.getElementById('welcomeSection');
        const dynamicContent = document.getElementById('dynamicContent');

        if (dynamicContent) {
            dynamicContent.classList.remove('active');
        }

        if (welcomeSection) {
            welcomeSection.classList.add('active');
        }

        this.currentSection = null;
    }

    /**
     * Content loader functions
     */
    showContentLoader(message = 'Loading...') {
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <div class="content-loader">
                    <div class="loader-spinner"></div>
                    <p class="loader-text">${message}</p>
                </div>
            `;
        }
    }

    setContent(html) {
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = html;
        }
    }

    /**
     * FAB (Floating Action Button) functions
     */
    toggleFABMenu() {
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');

        if (fabButton && fabMenu) {
            const isActive = fabButton.classList.contains('active');

            if (isActive) {
                this.closeFABMenu();
            } else {
                this.openFABMenu();
            }
        }
    }

    openFABMenu() {
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');

        if (fabButton && fabMenu) {
            fabButton.classList.add('active');
            fabMenu.classList.add('active');
        }
    }

    closeFABMenu() {
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');

        if (fabButton && fabMenu) {
            fabButton.classList.remove('active');
            fabMenu.classList.remove('active');
        }
    }

    /**
     * Handle FAB actions
     */
    handleFABAction(action) {
        switch (action) {
            case 'add-customer':
                this.showAddCustomerModal();
                break;
            case 'add-vehicle':
                this.showAddVehicleModal();
                break;
            case 'new-service':
                this.showNewServiceModal();
                break;
            default:
                console.warn(`Unknown FAB action: ${action}`);
        }
    }

    /**
     * Modal functions
     */
    showModal(content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = content;
            modalOverlay.classList.add('active');
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');

        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    }

    /**
     * Quick action modals
     */
    showAddCustomerModal() {
        if (window.Customers && window.Customers.showAddModal) {
            window.Customers.showAddModal();
        } else {
            this.showToast('Customer module not available', 'error');
        }
    }

    showAddVehicleModal() {
        if (window.Vehicles && window.Vehicles.showAddModal) {
            window.Vehicles.showAddModal();
        } else {
            this.showToast('Vehicle module not available', 'error');
        }
    }

    showNewServiceModal() {
        if (window.Services && window.Services.showAddModal) {
            window.Services.showAddModal();
        } else {
            this.showToast('Service module not available', 'error');
        }
    }

    /**
     * Quick search functionality
     */
    showQuickSearch() {
        // Implementation for quick search
        this.showToast('Quick search coming soon!', 'info');
    }

    /**
     * Toast notification system
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Error handling
     */
    showError(title, message) {
        this.setContent(`
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">${title}</h2>
                <p class="error-message">${message}</p>
                <button class="button button-primary" onclick="app.showWelcomeSection()">
                    ← Back to Home
                </button>
            </div>
        `);
    }

    /**
     * Utility methods
     */
    goHome() {
        this.showWelcomeSection();
    }

    refresh() {
        window.location.reload();
    }

    /**
     * Public API for modules
     */
    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OLServiceApp();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.app) {
        window.app.showToast('An unexpected error occurred', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.app) {
        window.app.showToast('An unexpected error occurred', 'error');
    }
});