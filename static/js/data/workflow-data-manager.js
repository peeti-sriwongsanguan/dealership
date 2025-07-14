// static/js/data/workflow-data-manager.js
/**
 * Workflow Data Manager
 * Handles loading and managing workflow data (work orders, customers, vehicles, etc.)
 * In production, this would connect to a real database/API
 */

class WorkflowDataManager {
    constructor() {
        this.data = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.useLocalStorage = true; // For demo purposes
    }

    /**
     * Load workflow data from JSON file or localStorage
     * @returns {Promise<Object>} Workflow data object
     */
    async loadData() {
        if (this.isLoaded && this.data) {
            return this.data;
        }

        // If already loading, return the existing promise
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._fetchData();
        return this.loadPromise;
    }

    async _fetchData() {
        try {
            // First try to load from localStorage (for demo persistence)
            if (this.useLocalStorage) {
                const stored = localStorage.getItem('workflow_data');
                if (stored) {
                    this.data = JSON.parse(stored);
                    this.isLoaded = true;
                    console.log('✅ Workflow data loaded from localStorage');
                    return this.data;
                }
            }

            // If no localStorage data, load from JSON file
            const response = await fetch('/static/js/data/sample-workflow-data.json');
            if (!response.ok) {
                throw new Error(`Failed to load workflow data: ${response.status}`);
            }

            this.data = await response.json();
            this.isLoaded = true;

            // Save to localStorage for demo persistence
            if (this.useLocalStorage) {
                this.saveToStorage();
            }

            console.log('✅ Workflow data loaded successfully');
            console.log(`📋 Loaded ${this.data.work_orders.length} work orders`);
            console.log(`👥 ${this.data.customers.length} customers`);
            console.log(`🚗 ${this.data.vehicles.length} vehicles`);

            return this.data;
        } catch (error) {
            console.error('❌ Error loading workflow data:', error);
            return this._getFallbackData();
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage() {
        if (this.useLocalStorage && this.data) {
            try {
                localStorage.setItem('workflow_data', JSON.stringify(this.data));
                console.log('💾 Workflow data saved to localStorage');
            } catch (error) {
                console.error('❌ Error saving to localStorage:', error);
            }
        }
    }

    /**
     * Get all work orders
     * @returns {Array} Array of work orders
     */
    getWorkOrders() {
        return this.data?.work_orders || [];
    }

    /**
     * Get work order by ID
     * @param {number} id - Work order ID
     * @returns {Object|null} Work order object or null
     */
    getWorkOrder(id) {
        return this.getWorkOrders().find(order => order.id === id) || null;
    }

    /**
     * Create new work order
     * @param {Object} orderData - Work order data
     * @returns {Object} Created work order with ID
     */
    createWorkOrder(orderData) {
        const newOrder = {
            id: this.getNextId('work_orders'),
            work_order_number: this.generateWorkOrderNumber(),
            date_created: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...orderData
        };

        this.data.work_orders.unshift(newOrder);
        this.saveToStorage();

        console.log(`✅ Work order ${newOrder.work_order_number} created`);
        return newOrder;
    }

    /**
     * Update work order
     * @param {number} id - Work order ID
     * @param {Object} updates - Updates to apply
     * @returns {Object|null} Updated work order
     */
    updateWorkOrder(id, updates) {
        const index = this.data.work_orders.findIndex(order => order.id === id);
        if (index === -1) return null;

        this.data.work_orders[index] = {
            ...this.data.work_orders[index],
            ...updates,
            updated_at: new Date().toISOString()
        };

        this.saveToStorage();
        return this.data.work_orders[index];
    }

    /**
     * Delete work order
     * @param {number} id - Work order ID
     * @returns {boolean} Success status
     */
    deleteWorkOrder(id) {
        const index = this.data.work_orders.findIndex(order => order.id === id);
        if (index === -1) return false;

        this.data.work_orders.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    /**
     * Get all customers
     * @returns {Array} Array of customers
     */
    getCustomers() {
        return this.data?.customers || [];
    }

    /**
     * Get customer by ID
     * @param {number} id - Customer ID
     * @returns {Object|null} Customer object or null
     */
    getCustomer(id) {
        return this.getCustomers().find(customer => customer.id === id) || null;
    }

    /**
     * Create new customer
     * @param {Object} customerData - Customer data
     * @returns {Object} Created customer with ID
     */
    createCustomer(customerData) {
        const newCustomer = {
            id: this.getNextId('customers'),
            ...customerData
        };

        this.data.customers.push(newCustomer);
        this.saveToStorage();

        console.log(`✅ Customer ${newCustomer.name} created`);
        return newCustomer;
    }

    /**
     * Get all vehicles
     * @returns {Array} Array of vehicles
     */
    getVehicles() {
        return this.data?.vehicles || [];
    }

    /**
     * Get vehicle by ID
     * @param {number} id - Vehicle ID
     * @returns {Object|null} Vehicle object or null
     */
    getVehicle(id) {
        return this.getVehicles().find(vehicle => vehicle.id === id) || null;
    }

    /**
     * Get vehicles by customer ID
     * @param {number} customerId - Customer ID
     * @returns {Array} Array of customer vehicles
     */
    getVehiclesByCustomer(customerId) {
        return this.getVehicles().filter(vehicle => vehicle.customer_id === customerId);
    }

    /**
     * Create new vehicle
     * @param {Object} vehicleData - Vehicle data
     * @returns {Object} Created vehicle with ID
     */
    createVehicle(vehicleData) {
        const newVehicle = {
            id: this.getNextId('vehicles'),
            ...vehicleData
        };

        this.data.vehicles.push(newVehicle);
        this.saveToStorage();

        console.log(`✅ Vehicle ${newVehicle.license_plate} created`);
        return newVehicle;
    }

    /**
     * Get all payments
     * @returns {Array} Array of payments
     */
    getPayments() {
        return this.data?.payments || [];
    }

    /**
     * Get payments by work order ID
     * @param {number} workOrderId - Work order ID
     * @returns {Array} Array of payments for the work order
     */
    getPaymentsByWorkOrder(workOrderId) {
        return this.getPayments().filter(payment => payment.work_order_id === workOrderId);
    }

    /**
     * Create new payment
     * @param {Object} paymentData - Payment data
     * @returns {Object} Created payment with ID
     */
    createPayment(paymentData) {
        const newPayment = {
            id: this.getNextId('payments'),
            payment_date: new Date().toISOString(),
            status: 'completed',
            ...paymentData
        };

        this.data.payments.push(newPayment);
        this.saveToStorage();

        console.log(`✅ Payment ${newPayment.reference_number} created`);
        return newPayment;
    }

    /**
     * Get all technicians
     * @returns {Array} Array of technicians
     */
    getTechnicians() {
        return this.data?.technicians || [];
    }

    /**
     * Get service history for a work order
     * @param {number} workOrderId - Work order ID
     * @returns {Array} Array of service history entries
     */
    getServiceHistory(workOrderId) {
        return this.data?.service_history?.filter(entry => entry.work_order_id === workOrderId) || [];
    }

    /**
     * Add service history entry
     * @param {number} workOrderId - Work order ID
     * @param {string} status - New status
     * @param {string} notes - Notes
     * @param {string} user - User making the change
     */
    addServiceHistory(workOrderId, status, notes, user = 'System') {
        if (!this.data.service_history) {
            this.data.service_history = [];
        }

        const entry = {
            id: this.getNextId('service_history'),
            work_order_id: workOrderId,
            timestamp: new Date().toISOString(),
            status,
            notes,
            user
        };

        this.data.service_history.push(entry);
        this.saveToStorage();

        console.log(`📝 Service history added for WO ${workOrderId}: ${status}`);
    }

    /**
     * Search work orders
     * @param {Object} filters - Search filters
     * @returns {Array} Filtered work orders
     */
    searchWorkOrders(filters = {}) {
        let orders = this.getWorkOrders();

        if (filters.customer_name) {
            const search = filters.customer_name.toLowerCase();
            orders = orders.filter(order =>
                order.customer_name.toLowerCase().includes(search)
            );
        }

        if (filters.vehicle_registration) {
            const search = filters.vehicle_registration.toLowerCase();
            orders = orders.filter(order =>
                order.vehicle_registration.toLowerCase().includes(search)
            );
        }

        if (filters.payment_type) {
            orders = orders.filter(order => order.payment_type === filters.payment_type);
        }

        if (filters.status) {
            orders = orders.filter(order => order.status === filters.status);
        }

        if (filters.priority) {
            orders = orders.filter(order => order.priority === filters.priority);
        }

        if (filters.date_from) {
            orders = orders.filter(order =>
                new Date(order.date_created) >= new Date(filters.date_from)
            );
        }

        if (filters.date_to) {
            orders = orders.filter(order =>
                new Date(order.date_created) <= new Date(filters.date_to)
            );
        }

        return orders;
    }

    /**
     * Get dashboard statistics
     * @returns {Object} Dashboard statistics
     */
    getDashboardStats() {
        const orders = this.getWorkOrders();
        const payments = this.getPayments();

        return {
            totalOrders: orders.length,
            insuranceClaims: orders.filter(o => o.payment_type === 'insurance' || o.payment_type === 'mixed').length,
            selfPayOrders: orders.filter(o => o.payment_type === 'self_pay').length,
            warrantyOrders: orders.filter(o => o.payment_type === 'warranty').length,
            pendingPayments: orders.filter(o =>
                o.status.includes('payment_pending') ||
                o.status.includes('deductible_pending') ||
                o.status === 'payment_method_selected'
            ).length,
            totalRevenue: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
            activeOrders: orders.filter(o =>
                !['delivered', 'completed'].includes(o.status)
            ).length,
            urgentOrders: orders.filter(o => o.priority === 'urgent').length,
            highPriorityOrders: orders.filter(o => o.priority === 'high').length
        };
    }

    /**
     * Get monthly revenue data
     * @param {number} months - Number of months to include
     * @returns {Array} Monthly revenue data
     */
    getMonthlyRevenue(months = 12) {
        const payments = this.getPayments();
        const monthlyData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthPayments = payments.filter(payment => {
                const paymentDate = new Date(payment.payment_date);
                return paymentDate >= month && paymentDate < nextMonth;
            });

            const revenue = monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

            monthlyData.push({
                month: month.toISOString().substring(0, 7), // YYYY-MM format
                monthName: month.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }),
                revenue,
                orderCount: monthPayments.length
            });
        }

        return monthlyData;
    }

    /**
     * Get payment method statistics
     * @returns {Object} Payment method breakdown
     */
    getPaymentMethodStats() {
        const payments = this.getPayments();
        const stats = {};

        payments.forEach(payment => {
            const method = payment.payment_method || 'unknown';
            if (!stats[method]) {
                stats[method] = {
                    count: 0,
                    total_amount: 0
                };
            }
            stats[method].count++;
            stats[method].total_amount += payment.amount || 0;
        });

        return stats;
    }

    /**
     * Export data as JSON
     * @param {string} type - Type of data to export (work_orders, customers, vehicles, payments, all)
     * @returns {string} JSON string
     */
    exportData(type = 'all') {
        let exportData = {};

        switch (type) {
            case 'work_orders':
                exportData = { work_orders: this.getWorkOrders() };
                break;
            case 'customers':
                exportData = { customers: this.getCustomers() };
                break;
            case 'vehicles':
                exportData = { vehicles: this.getVehicles() };
                break;
            case 'payments':
                exportData = { payments: this.getPayments() };
                break;
            case 'all':
            default:
                exportData = this.data;
                break;
        }

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Download data as JSON file
     * @param {string} type - Type of data to download
     */
    downloadData(type = 'all') {
        const jsonData = this.exportData(type);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `workflow-${type}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log(`✅ ${type} data exported successfully`);
    }

    /**
     * Import data from JSON
     * @param {Object} importData - Data to import
     * @param {boolean} merge - Whether to merge with existing data or replace
     */
    importData(importData, merge = true) {
        if (merge) {
            // Merge data, avoiding duplicates by ID
            Object.keys(importData).forEach(key => {
                if (this.data[key] && Array.isArray(this.data[key])) {
                    const existingIds = this.data[key].map(item => item.id);
                    const newItems = importData[key].filter(item => !existingIds.includes(item.id));
                    this.data[key].push(...newItems);
                } else {
                    this.data[key] = importData[key];
                }
            });
        } else {
            // Replace data completely
            this.data = importData;
        }

        this.saveToStorage();
        console.log('✅ Data imported successfully');
    }

    /**
     * Clear all data (for testing purposes)
     */
    clearData() {
        if (confirm('Are you sure you want to clear all workflow data? This cannot be undone.')) {
            this.data = {
                work_orders: [],
                customers: [],
                vehicles: [],
                payments: [],
                technicians: [],
                service_history: []
            };
            this.saveToStorage();
            console.log('🗑️ All workflow data cleared');
        }
    }

    /**
     * Reset to sample data
     */
    async resetToSampleData() {
        if (confirm('Reset to sample data? This will overwrite all current data.')) {
            if (this.useLocalStorage) {
                localStorage.removeItem('workflow_data');
            }
            this.data = null;
            this.isLoaded = false;
            this.loadPromise = null;
            await this.loadData();
            console.log('🔄 Data reset to sample data');
        }
    }

    /**
     * Get next available ID for a collection
     * @param {string} collection - Collection name
     * @returns {number} Next available ID
     */
    getNextId(collection) {
        if (!this.data[collection] || !Array.isArray(this.data[collection])) {
            return 1;
        }

        const maxId = this.data[collection].reduce((max, item) =>
            Math.max(max, item.id || 0), 0
        );

        return maxId + 1;
    }

    /**
     * Generate work order number
     * @returns {string} Work order number
     */
    generateWorkOrderNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const orders = this.getWorkOrders();

        // Count orders created this month
        const thisMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.date_created);
            return orderDate.getFullYear() === year && orderDate.getMonth() === now.getMonth();
        });

        const sequence = String(thisMonthOrders.length + 1).padStart(3, '0');
        return `WO-${year}${month}-${sequence}`;
    }

    /**
     * Generate payment reference number
     * @param {string} method - Payment method
     * @returns {string} Payment reference number
     */
    generatePaymentReference(method) {
        const now = new Date();
        const year = now.getFullYear();
        const sequence = String(this.getPayments().length + 1).padStart(3, '0');

        const methodPrefix = {
            'cash': 'CASH',
            'credit_card': 'CC',
            'debit_card': 'DC',
            'bank_transfer': 'BT',
            'check': 'CHK',
            'digital_wallet': 'DW'
        };

        const prefix = methodPrefix[method] || 'PAY';
        return `${prefix}-${sequence}-${year}`;
    }

    /**
     * Get fallback data if loading fails
     * @returns {Object} Minimal fallback data
     */
    _getFallbackData() {
        console.warn('🔄 Using fallback workflow data');
        return {
            work_orders: [],
            customers: [],
            vehicles: [],
            payments: [],
            technicians: [],
            service_history: []
        };
    }

    /**
     * Validate work order data
     * @param {Object} orderData - Work order data to validate
     * @returns {Object} Validation result
     */
    validateWorkOrder(orderData) {
        const errors = [];

        if (!orderData.customer_name) {
            errors.push('Customer name is required');
        }

        if (!orderData.vehicle_registration) {
            errors.push('Vehicle registration is required');
        }

        if (!orderData.payment_type) {
            errors.push('Payment type is required');
        }

        if (!orderData.damage_description) {
            errors.push('Service description is required');
        }

        if (orderData.estimated_cost && isNaN(orderData.estimated_cost)) {
            errors.push('Estimated cost must be a valid number');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get workflow state label
     * @param {string} status - Status code
     * @returns {string} Human readable status
     */
    getStatusLabel(status) {
        const workflowStates = window.paymentConfigManager?.getWorkflowStates() || {};
        return workflowStates[status]?.label || status || 'Unknown';
    }

    /**
     * Get priority label
     * @param {string} priority - Priority code
     * @returns {string} Human readable priority
     */
    getPriorityLabel(priority) {
        const priorityLevels = window.paymentConfigManager?.getPriorityLevels() || {};
        return priorityLevels[priority]?.label || priority || 'Normal';
    }

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return window.paymentConfigManager?.formatCurrency(amount) || `฿${(amount || 0).toLocaleString()}`;
    }

    /**
     * Format date
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH');
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Format datetime
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted datetime
     */
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }
}

// Create global instance
window.workflowDataManager = new WorkflowDataManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkflowDataManager;
}