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
        this.init();
    }

    async init() {
        console.log('🚀 Initializing OL Service POS...');

        // Hide loading screen
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
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        if (loadingScreen && app) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'block';
            }, 1000);
        }
    }

    async checkApiStatus() {
        try {
            const response = await fetch('/api');
            if (response.ok) {
                this.updateApiStatus('online');
            } else {
                this.updateApiStatus('error');
            }
        } catch (error) {
            console.error('API Status Check Failed:', error);
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
        const navButtons = document.querySelectorAll('.nav-button');

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.dataset.section;
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
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');

        if (fabButton) {
            fabButton.addEventListener('click', () => {
                this.toggleFABMenu();
            });
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
            showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.updateApiStatus('offline');
            showToast('Connection lost', 'warning');
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
        // Update URL without page refresh
        const url = new URL(window.location);
        url.hash = section;
        window.history.pushState({ section }, '', url);

        // Load the section
        this.loadSection(section, true);
    }

    async loadSection(section, addToHistory = true) {
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

        } catch (error) {
            console.error('Error loading section:', error);
            this.showErrorContent(`Failed to load ${section} section`);
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
        if (typeof customersModule !== 'undefined' && customersModule.loadModule) {
            return await customersModule.loadModule();
        }
        return '<div class="error-content">Customers module not available</div>';
    }

    async loadVehiclesSection() {
        if (typeof vehiclesModule !== 'undefined' && vehiclesModule.loadModule) {
            return await vehiclesModule.loadModule();
        }
        return '<div class="error-content">Vehicles module not available</div>';
    }

    async loadServicesSection() {
        if (typeof servicesModule !== 'undefined' && servicesModule.loadModule) {
            return await servicesModule.loadModule();
        }
        return '<div class="error-content">Services module not available</div>';
    }

    async loadDamageSection() {
        if (typeof damageModule !== 'undefined' && damageModule.loadModule) {
            return await damageModule.loadModule();
        }
        return '<div class="error-content">Damage inspection module not available</div>';
    }

    async loadPhotosSection() {
        if (typeof photosModule !== 'undefined' && photosModule.loadModule) {
            return await photosModule.loadModule();
        }
        return '<div class="error-content">Photos module not available</div>';
    }

    async loadReportsSection() {
        if (typeof reportsModule !== 'undefined' && reportsModule.loadModule) {
            return await reportsModule.loadModule();
        }
        return '<div class="error-content">Reports module not available</div>';
    }

    async loadSettingsSection() {
        if (typeof settingsModule !== 'undefined' && settingsModule.loadModule) {
            return await settingsModule.loadModule();
        }
        return '<div class="error-content">Settings module not available</div>';
    }

    // FAB action handlers
    async handleAddCustomer() {
        this.closeFABMenu();

        if (typeof customersModule !== 'undefined' && customersModule.showAddCustomerModal) {
            customersModule.showAddCustomerModal();
        } else {
            showToast('Customer management not available', 'error');
        }
    }

    async handleAddVehicle() {
        this.closeFABMenu();

        if (typeof vehiclesModule !== 'undefined' && vehiclesModule.showAddVehicleModal) {
            vehiclesModule.showAddVehicleModal();
        } else {
            showToast('Vehicle management not available', 'error');
        }
    }

    async handleNewService() {
        this.closeFABMenu();

        if (typeof servicesModule !== 'undefined' && servicesModule.showAddServiceModal) {
            servicesModule.showAddServiceModal();
        } else {
            showToast('Service management not available', 'error');
        }
    }

    async handleQuickCheckIn() {
        this.closeFABMenu();

        if (typeof photosModule !== 'undefined' && photosModule.handleNewCheckIn) {
            await photosModule.handleNewCheckIn();
        } else {
            showToast('Photo documentation not available', 'error');
        }
    }

    async handleQuickCheckOut() {
        this.closeFABMenu();

        if (typeof photosModule !== 'undefined' && photosModule.handleNewCheckOut) {
            await photosModule.handleNewCheckOut();
        } else {
            showToast('Photo documentation not available', 'error');
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
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

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

        if (!modalOverlay || !modalContainer) return;

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
            modalOverlay.classList.remove('show');
            document.body.style.overflow = '';

            setTimeout(() => {
                modalOverlay.style.display = 'none';
            }, 300);
        }
    }

    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    static formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
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
}

// Global utility functions
window.showToast = UIUtils.showToast;
window.showModal = UIUtils.showModal;
window.closeModal = UIUtils.closeModal;
window.formatDate = UIUtils.formatDate;
window.formatCurrency = UIUtils.formatCurrency;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.olServiceApp = new OLServiceApp();
});

// Handle any uncaught errors
window.addEventListener('error', (e) => {
    console.error('Application Error:', e.error);
    showToast('An unexpected error occurred', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    showToast('An unexpected error occurred', 'error');
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

console.log('📱 OL Service POS Application Loaded');
console.log('🔧 Features: Customer Management, Vehicle Tracking, Service Orders');
console.log('📸 Photo Documentation: Check-in/Check-out, Damage Inspection');
console.log('🚀 Ready for use!');