// static/js/data/payment-config-manager.js
/**
 * Payment Configuration Manager
 * Loads and manages payment types, methods, and workflow configuration
 */

class PaymentConfigManager {
    constructor() {
        this.config = null;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Load payment configuration from JSON file
     * @returns {Promise<Object>} Configuration object
     */
    async loadConfig() {
        if (this.isLoaded && this.config) {
            return this.config;
        }

        // If already loading, return the existing promise
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._fetchConfig();
        return this.loadPromise;
    }

    async _fetchConfig() {
        try {
            const response = await fetch('/static/js/data/payment-config.json');
            if (!response.ok) {
                throw new Error(`Failed to load payment config: ${response.status}`);
            }

            this.config = await response.json();
            this.isLoaded = true;

            console.log('✅ Payment configuration loaded successfully');
            console.log(`💳 Loaded ${Object.keys(this.config.payment_methods).length} payment methods`);
            console.log(`🏥 ${Object.keys(this.config.payment_types).length} payment types`);
            console.log(`📋 ${Object.keys(this.config.workflow_states).length} workflow states`);

            return this.config;
        } catch (error) {
            console.error('❌ Error loading payment configuration:', error);
            return this._getFallbackConfig();
        }
    }

    /**
     * Get all payment types
     * @returns {Object} Payment types configuration
     */
    getPaymentTypes() {
        return this.config?.payment_types || {};
    }

    /**
     * Get payment type by ID
     * @param {string} typeId - Payment type ID
     * @returns {Object|null} Payment type configuration
     */
    getPaymentType(typeId) {
        return this.getPaymentTypes()[typeId] || null;
    }

    /**
     * Get all payment methods
     * @returns {Object} Payment methods configuration
     */
    getPaymentMethods() {
        return this.config?.payment_methods || {};
    }

    /**
     * Get payment method by ID
     * @param {string} methodId - Payment method ID
     * @returns {Object|null} Payment method configuration
     */
    getPaymentMethod(methodId) {
        return this.getPaymentMethods()[methodId] || null;
    }

    /**
     * Get available payment methods for a payment type
     * @param {string} paymentType - Payment type ID
     * @returns {Object} Available payment methods
     */
    getAvailablePaymentMethods(paymentType) {
        const allMethods = this.getPaymentMethods();
        const availableMethods = {};

        Object.entries(allMethods).forEach(([methodId, method]) => {
            if (method.available_for.includes(paymentType)) {
                availableMethods[methodId] = method;
            }
        });

        return availableMethods;
    }

    /**
     * Get all workflow states
     * @returns {Object} Workflow states configuration
     */
    getWorkflowStates() {
        return this.config?.workflow_states || {};
    }

    /**
     * Get workflow state by ID
     * @param {string} stateId - Workflow state ID
     * @returns {Object|null} Workflow state configuration
     */
    getWorkflowState(stateId) {
        return this.getWorkflowStates()[stateId] || null;
    }

    /**
     * Get workflow steps for a payment type
     * @param {string} paymentType - Payment type ID
     * @returns {Array} Array of workflow step IDs
     */
    getWorkflowSteps(paymentType) {
        const type = this.getPaymentType(paymentType);
        return type?.workflow_steps || [];
    }

    /**
     * Get insurance companies
     * @returns {Array} Array of insurance companies
     */
    getInsuranceCompanies() {
        return this.config?.insurance_companies || [];
    }

    /**
     * Get insurance company by ID
     * @param {string} companyId - Insurance company ID
     * @returns {Object|null} Insurance company data
     */
    getInsuranceCompany(companyId) {
        return this.getInsuranceCompanies().find(company => company.id === companyId) || null;
    }

    /**
     * Get priority levels
     * @returns {Object} Priority levels configuration
     */
    getPriorityLevels() {
        return this.config?.priority_levels || {};
    }

    /**
     * Get priority level by ID
     * @param {string} levelId - Priority level ID
     * @returns {Object|null} Priority level configuration
     */
    getPriorityLevel(levelId) {
        return this.getPriorityLevels()[levelId] || null;
    }

    /**
     * Get system settings
     * @returns {Object} System settings
     */
    getSettings() {
        return this.config?.settings || {};
    }

    /**
     * Calculate payment fees
     * @param {number} amount - Base amount
     * @param {string} methodId - Payment method ID
     * @returns {Object} Fee calculation details
     */
    calculatePaymentFees(amount, methodId) {
        const method = this.getPaymentMethod(methodId);
        if (!method) {
            return { amount, fees: 0, total: amount, error: 'Payment method not found' };
        }

        const fees = (amount * method.fees_percentage) / 100;
        const total = amount + fees;

        return {
            amount,
            fees,
            total,
            method: method.label,
            percentage: method.fees_percentage
        };
    }

    /**
     * Calculate installment details
     * @param {number} amount - Total amount
     * @param {string} methodId - Installment method ID
     * @param {number} downPayment - Down payment amount
     * @returns {Object} Installment calculation
     */
    calculateInstallment(amount, methodId, downPayment = 0) {
        const method = this.getPaymentMethod(methodId);
        if (!method || !method.months) {
            return { error: 'Invalid installment method' };
        }

        const remaining = amount - downPayment;
        const interestAmount = (remaining * method.fees_percentage) / 100;
        const totalWithInterest = remaining + interestAmount;
        const monthlyPayment = totalWithInterest / method.months;

        return {
            totalAmount: amount,
            downPayment,
            remainingAmount: remaining,
            interestAmount,
            totalWithInterest,
            monthlyPayment: Math.round(monthlyPayment),
            months: method.months,
            method: method.label
        };
    }

    /**
     * Validate payment method for amount
     * @param {string} methodId - Payment method ID
     * @param {number} amount - Payment amount
     * @returns {Object} Validation result
     */
    validatePaymentMethod(methodId, amount) {
        const method = this.getPaymentMethod(methodId);
        if (!method) {
            return { valid: false, error: 'Payment method not found' };
        }

        if (amount > method.max_amount) {
            return {
                valid: false,
                error: `Amount exceeds maximum limit of ${this.formatCurrency(method.max_amount)} for ${method.label}`
            };
        }

        return { valid: true, method };
    }

    /**
     * Get next workflow step
     * @param {string} currentState - Current workflow state
     * @param {string} paymentType - Payment type
     * @returns {string|null} Next workflow state ID
     */
    getNextWorkflowStep(currentState, paymentType) {
        const steps = this.getWorkflowSteps(paymentType);
        const currentIndex = steps.indexOf(currentState);

        if (currentIndex === -1 || currentIndex === steps.length - 1) {
            return null; // No next step
        }

        return steps[currentIndex + 1];
    }

    /**
     * Format currency based on settings
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        const settings = this.getSettings();
        const currency = settings.default_currency || 'THB';

        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount || 0);
    }

    /**
     * Generate payment method options HTML
     * @param {string} paymentType - Payment type to filter methods
     * @param {number} amount - Payment amount for validation
     * @returns {string} HTML options
     */
    generatePaymentMethodOptions(paymentType, amount = 0) {
        const availableMethods = this.getAvailablePaymentMethods(paymentType);
        let html = '';

        Object.entries(availableMethods).forEach(([methodId, method]) => {
            const validation = this.validatePaymentMethod(methodId, amount);
            const feeCalculation = this.calculatePaymentFees(amount, methodId);

            const disabled = !validation.valid || amount > method.max_amount;
            const disabledClass = disabled ? 'disabled' : '';

            html += `
                <div class="payment-method-option ${disabledClass}" ${disabled ? '' : `onclick="selectPaymentMethod('${methodId}')"`}>
                    <input type="radio" name="payment_method" value="${methodId}" id="method_${methodId}" ${disabled ? 'disabled' : ''}>
                    <label for="method_${methodId}">
                        <div class="method-header">
                            <span class="method-icon" style="color: ${method.color};">${method.icon}</span>
                            <span class="method-title">${method.label}</span>
                        </div>
                        <div class="method-details">
                            <div class="method-fee">Fee: ${method.fees_percentage}% (${this.formatCurrency(feeCalculation.fees)})</div>
                            <div class="method-total">Total: ${this.formatCurrency(feeCalculation.total)}</div>
                            <div class="method-processing">${method.processing_time}</div>
                            ${disabled ? '<div class="method-error">Amount exceeds limit</div>' : ''}
                        </div>
                    </label>
                </div>
            `;
        });

        return html;
    }

    /**
     * Generate insurance company options HTML
     * @returns {string} HTML options
     */
    generateInsuranceCompanyOptions() {
        const companies = this.getInsuranceCompanies();
        let html = '<option value="">เลือกบริษัทประกัน</option>';

        companies.forEach(company => {
            html += `<option value="${company.id}" data-phone="${company.contact_phone}" data-days="${company.typical_approval_days}">${company.name}</option>`;
        });

        return html;
    }

    /**
     * Get business information for receipts
     * @returns {Object} Business information
     */
    getBusinessInfo() {
        const settings = this.getSettings();
        return settings.business_info || {
            name: 'Auto Dealership',
            address: 'Service Location',
            phone: 'N/A',
            email: 'N/A'
        };
    }

    /**
     * Get fallback configuration if loading fails
     * @returns {Object} Minimal fallback configuration
     */
    _getFallbackConfig() {
        console.warn('🔄 Using fallback payment configuration');
        return {
            payment_types: {
                self_pay: { label: 'Self Payment', icon: '💳', color: '#10b981', description: 'Customer pays directly' },
                insurance: { label: 'Insurance Claim', icon: '🏥', color: '#3b82f6', description: 'Insurance pays' }
            },
            payment_methods: {
                cash: { label: 'Cash', icon: '💵', color: '#10b981', fees_percentage: 0, processing_time: 'Immediate', available_for: ['self_pay'], max_amount: 50000 },
                credit_card: { label: 'Credit Card', icon: '💳', color: '#3b82f6', fees_percentage: 2.5, processing_time: 'Immediate', available_for: ['self_pay'], max_amount: 500000 }
            },
            workflow_states: {
                estimate_prepared: { step: 1, label: 'Estimate Prepared', color: '#8b5cf6' },
                payment_received: { step: 2, label: 'Payment Received', color: '#10b981' }
            },
            insurance_companies: [],
            priority_levels: {
                normal: { label: 'Normal', color: '#10b981' },
                high: { label: 'High', color: '#f59e0b' },
                urgent: { label: 'Urgent', color: '#ef4444' }
            },
            settings: {
                default_currency: 'THB',
                business_info: { name: 'Auto Dealership', address: 'Service Location' }
            }
        };
    }
}

// Create global instance
window.paymentConfigManager = new PaymentConfigManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentConfigManager;
}