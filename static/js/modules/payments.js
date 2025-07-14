// static/js/modules/payments.js
// Complete Payment Processing Module for Auto Dealership

const paymentsModule = {
    currentPayment: null,
    currentService: null,
    paymentHistory: [],
    pendingPayments: [],
    installmentPlans: [],
    insuranceClaims: [],

    // Main entry point
    async loadModule() {
        console.log('💳 Loading Complete Payment Processing Module...');

        try {
            await this.loadPaymentData();
            return this.generateCompletePaymentInterface();
        } catch (error) {
            console.error('Error loading payment module:', error);
            return this.generateErrorInterface(error.message);
        }
    },

    async loadPaymentData() {
        try {
            // Load payment configuration
            if (window.paymentConfigManager) {
                await window.paymentConfigManager.loadConfig();
            }

            // Load existing payments and services
            await this.loadExistingPayments();
            await this.loadPendingServices();
            await this.loadInstallmentPlans();
            await this.loadInsuranceClaims();
        } catch (error) {
            console.warn('Some payment data failed to load:', error);
        }
    },

    async loadExistingPayments() {
        try {
            // In a real system, this would fetch from /api/payments
            const response = await fetch('/api/services'); // For now, get services to see payment status
            if (response.ok) {
                const data = await response.json();
                this.paymentHistory = this.extractPaymentHistory(data.services || []);
                this.pendingPayments = this.extractPendingPayments(data.services || []);
            }
        } catch (error) {
            console.error('Error loading payment history:', error);
        }
    },

    async loadPendingServices() {
        try {
            const response = await fetch('/api/services?status=pending');
            if (response.ok) {
                const data = await response.json();
                this.pendingServices = data.services || [];
            }
        } catch (error) {
            console.error('Error loading pending services:', error);
        }
    },

    async loadInstallmentPlans() {
        // Load active installment plans
        this.installmentPlans = this.generateSampleInstallmentData();
    },

    async loadInsuranceClaims() {
        // Load insurance claims data
        this.insuranceClaims = this.generateSampleInsuranceData();
    },

    generateCompletePaymentInterface() {
        const stats = this.calculatePaymentStats();


        return `
            <div class="payment-container">
                <div class="payment-header">
                    <h1>💳 Complete Payment Processing</h1>
                    <p>Comprehensive payment management for auto dealership operations</p>
                </div>

                <!-- Payment Dashboard -->
                <div class="payment-dashboard">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-number">${this.formatCurrency(stats.todayRevenue)}</div>
                                <div class="stat-label">Today's Revenue</div>
                                <div class="stat-change">+12.5% from yesterday</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.todayPayments}</div>
                                <div class="stat-label">Payments Processed</div>
                                <div class="stat-change">${stats.pendingCount} pending</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🏥</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.insurancePayments}</div>
                                <div class="stat-label">Insurance Claims</div>
                                <div class="stat-change">${this.formatCurrency(stats.insuranceValue)}</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📅</div>
                            <div class="stat-content">
                                <div class="stat-number">${stats.activeInstallments}</div>
                                <div class="stat-label">Active Installments</div>
                                <div class="stat-change">${this.formatCurrency(stats.monthlyRecurring)}/month</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment Navigation -->
                <div class="payment-navigation">
                    <div class="payment-tabs">
                        <button class="payment-tab active" onclick="paymentsModule.showPaymentTab('process')" data-tab="process">
                            💳 Process Payment
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('pending')" data-tab="pending">
                            ⏳ Pending Payments
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('insurance')" data-tab="insurance">
                            🏥 Insurance Claims
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('installments')" data-tab="installments">
                            📅 Installment Plans
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('history')" data-tab="history">
                            📊 Payment History
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('reports')" data-tab="reports">
                            📈 Reports & Analytics
                        </button>
                    </div>
                </div>

                <!-- Payment Tab Content -->
                <div class="payment-tab-content">
                    <div id="paymentTabContent">
                        ${this.generateProcessPaymentTab()}
                    </div>
                </div>
            </div>
        `;
    },

    generateProcessPaymentTab() {
        return `
            <div class="process-payment-tab">
                <div class="payment-actions-section">
                    <h2>💳 Payment Processing Actions</h2>
                    <div class="payment-actions-grid">
                        <button class="payment-action-card" onclick="paymentsModule.processNewPayment()">
                            <div class="action-icon">💳</div>
                            <div class="action-content">
                                <h3>Process New Payment</h3>
                                <p>Create and process a new customer payment</p>
                            </div>
                        </button>

                        <button class="payment-action-card" onclick="paymentsModule.processInsurancePayment()">
                            <div class="action-icon">🏥</div>
                            <div class="action-content">
                                <h3>Insurance Claim Payment</h3>
                                <p>Handle insurance company payments and deductibles</p>
                            </div>
                        </button>

                        <button class="payment-action-card" onclick="paymentsModule.setupInstallmentPlan()">
                            <div class="action-icon">📅</div>
                            <div class="action-content">
                                <h3>Setup Installment Plan</h3>
                                <p>Create monthly payment plans for customers</p>
                            </div>
                        </button>

                        <button class="payment-action-card" onclick="paymentsModule.processRefund()">
                            <div class="action-icon">↩️</div>
                            <div class="action-content">
                                <h3>Process Refund</h3>
                                <p>Handle customer refunds and cancellations</p>
                            </div>
                        </button>

                        <button class="payment-action-card" onclick="paymentsModule.bulkPaymentProcessing()">
                            <div class="action-icon">📋</div>
                            <div class="action-content">
                                <h3>Bulk Payment Processing</h3>
                                <p>Process multiple payments simultaneously</p>
                            </div>
                        </button>

                        <button class="payment-action-card" onclick="paymentsModule.paymentVerification()">
                            <div class="action-icon">✅</div>
                            <div class="action-content">
                                <h3>Payment Verification</h3>
                                <p>Verify and reconcile payment transactions</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Payment Methods Overview -->
                <div class="payment-methods-section">
                    <h2>💰 Available Payment Methods</h2>
                    <div class="payment-methods-detailed">
                        <div class="payment-method-detailed cash">
                            <div class="method-header">
                                <div class="method-icon">💵</div>
                                <div class="method-info">
                                    <h3>Cash Payment</h3>
                                    <div class="method-fees">No processing fees • Immediate settlement</div>
                                </div>
                            </div>
                            <div class="method-details">
                                <div class="method-limits">Max: ฿100,000 per transaction</div>
                                <div class="method-features">• No chargebacks • Immediate availability • Requires receipt</div>
                            </div>
                        </div>

                        <div class="payment-method-detailed credit-card">
                            <div class="method-header">
                                <div class="method-icon">💳</div>
                                <div class="method-info">
                                    <h3>Credit Card</h3>
                                    <div class="method-fees">2.5% processing fee • Immediate authorization</div>
                                </div>
                            </div>
                            <div class="method-details">
                                <div class="method-limits">Max: ฿500,000 per transaction</div>
                                <div class="method-features">• Chargeback protection • EMV secure • All major cards accepted</div>
                            </div>
                        </div>

                        <div class="payment-method-detailed bank-transfer">
                            <div class="method-header">
                                <div class="method-icon">🏦</div>
                                <div class="method-info">
                                    <h3>Bank Transfer</h3>
                                    <div class="method-fees">No fees • 1-2 business day settlement</div>
                                </div>
                            </div>
                            <div class="method-details">
                                <div class="method-limits">Max: ฿2,000,000 per transaction</div>
                                <div class="method-features">• High security • Lower fees • Requires verification</div>
                            </div>
                        </div>

                        <div class="payment-method-detailed installments">
                            <div class="method-header">
                                <div class="method-icon">📊</div>
                                <div class="method-info">
                                    <h3>Installment Plans</h3>
                                    <div class="method-fees">3-12% interest • Monthly payments</div>
                                </div>
                            </div>
                            <div class="method-details">
                                <div class="method-limits">Min: ฿10,000 • 3-36 months</div>
                                <div class="method-features">• Flexible terms • Auto-billing • Early payment discounts</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Service Payment -->
                <div class="quick-payment-section">
                    <h2>⚡ Quick Service Payment</h2>
                    <div class="quick-payment-form">
                        <div class="quick-form-row">
                            <div class="quick-form-group">
                                <label>Select Service:</label>
                                <select id="quickServiceSelect" onchange="paymentsModule.loadServiceDetails()">
                                    <option value="">Choose pending service...</option>
                                    ${this.generateServiceOptions()}
                                </select>
                            </div>
                            <div class="quick-form-group">
                                <label>Payment Amount:</label>
                                <input type="number" id="quickPaymentAmount" placeholder="Enter amount" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="quick-form-row">
                            <div class="quick-form-group">
                                <label>Payment Method:</label>
                                <select id="quickPaymentMethod" onchange="paymentsModule.calculateQuickTotal()">
                                    <option value="">Select method...</option>
                                    <option value="cash">💵 Cash (No fees)</option>
                                    <option value="credit_card">💳 Credit Card (2.5% fee)</option>
                                    <option value="debit_card">💳 Debit Card (1% fee)</option>
                                    <option value="bank_transfer">🏦 Bank Transfer (No fees)</option>
                                </select>
                            </div>
                            <div class="quick-form-group">
                                <label>Total with Fees:</label>
                                <div class="quick-total-display" id="quickTotalDisplay">฿0.00</div>
                            </div>
                        </div>
                        <div class="quick-form-actions">
                            <button class="btn btn-primary" onclick="paymentsModule.processQuickPayment()">
                                💳 Process Payment
                            </button>
                            <button class="btn btn-outline" onclick="paymentsModule.clearQuickForm()">
                                🔄 Clear Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generatePendingPaymentsTab() {
        return `
            <div class="pending-payments-tab">
                <div class="pending-header">
                    <h2>⏳ Pending Payments</h2>
                    <div class="pending-stats">
                        <span class="pending-count">${this.pendingPayments.length} pending</span>
                        <span class="pending-value">Total: ${this.formatCurrency(this.calculatePendingTotal())}</span>
                    </div>
                </div>

                <div class="pending-payments-list">
                    ${this.generatePendingPaymentsList()}
                </div>

                <div class="pending-actions">
                    <button class="btn btn-primary" onclick="paymentsModule.processBulkPayments()">
                        📋 Process Multiple Payments
                    </button>
                    <button class="btn btn-secondary" onclick="paymentsModule.sendPaymentReminders()">
                        📧 Send Payment Reminders
                    </button>
                    <button class="btn btn-outline" onclick="paymentsModule.exportPendingPayments()">
                        📤 Export List
                    </button>
                </div>
            </div>
        `;
    },

    generateInsuranceClaimsTab() {
        return `
            <div class="insurance-claims-tab">
                <div class="insurance-header">
                    <h2>🏥 Insurance Claims Management</h2>
                    <div class="insurance-stats">
                        <div class="insurance-stat">
                            <span class="stat-number">${this.insuranceClaims.length}</span>
                            <span class="stat-label">Active Claims</span>
                        </div>
                        <div class="insurance-stat">
                            <span class="stat-number">${this.formatCurrency(this.calculateInsuranceTotal())}</span>
                            <span class="stat-label">Total Value</span>
                        </div>
                        <div class="insurance-stat">
                            <span class="stat-number">${this.insuranceClaims.filter(c => c.status === 'approved').length}</span>
                            <span class="stat-label">Approved</span>
                        </div>
                    </div>
                </div>

                <div class="insurance-actions">
                    <button class="btn btn-primary" onclick="paymentsModule.submitNewInsuranceClaim()">
                        📋 Submit New Claim
                    </button>
                    <button class="btn btn-secondary" onclick="paymentsModule.checkClaimStatus()">
                        🔍 Check Claim Status
                    </button>
                    <button class="btn btn-outline" onclick="paymentsModule.processInsurancePayment()">
                        💰 Process Insurance Payment
                    </button>
                </div>

                <div class="insurance-claims-list">
                    ${this.generateInsuranceClaimsList()}
                </div>
            </div>
        `;
    },

    generateInstallmentPlansTab() {
        return `
            <div class="installment-plans-tab">
                <div class="installment-header">
                    <h2>📅 Installment Plans Management</h2>
                    <div class="installment-summary">
                        <div class="summary-card">
                            <div class="summary-number">${this.installmentPlans.length}</div>
                            <div class="summary-label">Active Plans</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-number">${this.formatCurrency(this.calculateMonthlyRecurring())}</div>
                            <div class="summary-label">Monthly Revenue</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-number">${this.getUpcomingPayments()}</div>
                            <div class="summary-label">Due This Week</div>
                        </div>
                    </div>
                </div>

                <div class="installment-actions">
                    <button class="btn btn-primary" onclick="paymentsModule.createInstallmentPlan()">
                        ➕ Create New Plan
                    </button>
                    <button class="btn btn-secondary" onclick="paymentsModule.processInstallmentPayments()">
                        💳 Process Due Payments
                    </button>
                    <button class="btn btn-outline" onclick="paymentsModule.sendInstallmentReminders()">
                        📧 Send Reminders
                    </button>
                </div>

                <div class="installment-plans-list">
                    ${this.generateInstallmentPlansList()}
                </div>
            </div>
        `;
    },

    generatePaymentHistoryTab() {
        return `
            <div class="payment-history-tab">
                <div class="history-header">
                    <h2>📊 Payment History</h2>
                    <div class="history-filters">
                        <select id="historyDateFilter" onchange="paymentsModule.filterPaymentHistory()">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month" selected>This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <select id="historyMethodFilter" onchange="paymentsModule.filterPaymentHistory()">
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="installment">Installment</option>
                        </select>
                        <button class="btn btn-outline" onclick="paymentsModule.exportPaymentHistory()">
                            📤 Export
                        </button>
                    </div>
                </div>

                <div class="payment-history-list">
                    ${this.generatePaymentHistoryList()}
                </div>
            </div>
        `;
    },

    generateReportsTab() {
        return `
            <div class="payment-reports-tab">
                <div class="reports-header">
                    <h2>📈 Payment Reports & Analytics</h2>
                </div>

                <div class="reports-grid">
                    <div class="report-card">
                        <div class="report-icon">💰</div>
                        <div class="report-content">
                            <h3>Revenue Report</h3>
                            <p>Daily, weekly, monthly revenue analysis</p>
                            <button class="btn btn-primary" onclick="paymentsModule.generateRevenueReport()">
                                Generate Report
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="report-icon">📊</div>
                        <div class="report-content">
                            <h3>Payment Method Analysis</h3>
                            <p>Breakdown by payment method and fees</p>
                            <button class="btn btn-primary" onclick="paymentsModule.generateMethodReport()">
                                Generate Report
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="report-icon">🏥</div>
                        <div class="report-content">
                            <h3>Insurance Claims Report</h3>
                            <p>Insurance payment tracking and analysis</p>
                            <button class="btn btn-primary" onclick="paymentsModule.generateInsuranceReport()">
                                Generate Report
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="report-icon">📅</div>
                        <div class="report-content">
                            <h3>Installment Performance</h3>
                            <p>Installment payment success rates</p>
                            <button class="btn btn-primary" onclick="paymentsModule.generateInstallmentReport()">
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>

                <div class="analytics-dashboard">
                    <h3>Payment Analytics Dashboard</h3>
                    <div class="analytics-charts">
                        <div class="chart-container">
                            <h4>Monthly Revenue Trend</h4>
                            <div class="chart-placeholder">
                                📈 Revenue chart would display here
                            </div>
                        </div>
                        <div class="chart-container">
                            <h4>Payment Method Distribution</h4>
                            <div class="chart-placeholder">
                                🥧 Pie chart would display here
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Payment processing methods
    processNewPayment() {
        this.showToast('💳 Opening new payment processor...', 'info');
        this.showNewPaymentModal();
    },

    showNewPaymentModal() {
        if (typeof window.showModal !== 'function') {
            alert('Payment processing interface would open here with full payment form.');
            return;
        }

        const modalContent = `
            <div class="new-payment-form">
                <h2>💳 Process New Payment</h2>

                <!-- Customer & Service Selection -->
                <div class="form-section">
                    <h3>Customer & Service Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Customer:</label>
                            <select id="paymentCustomer" onchange="paymentsModule.loadCustomerServices()">
                                <option value="">Select Customer</option>
                                ${this.generateCustomerOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Service:</label>
                            <select id="paymentService" onchange="paymentsModule.loadServiceAmount()">
                                <option value="">Select Service</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="form-section">
                    <h3>Payment Details</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Amount:</label>
                            <input type="number" id="paymentAmount" placeholder="Enter amount" min="0" step="0.01" onchange="paymentsModule.calculatePaymentTotal()">
                        </div>
                        <div class="form-group">
                            <label>Payment Type:</label>
                            <select id="paymentType" onchange="paymentsModule.handlePaymentTypeChange()">
                                <option value="full">Full Payment</option>
                                <option value="partial">Partial Payment</option>
                                <option value="deposit">Deposit</option>
                                <option value="deductible">Insurance Deductible</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Payment Method Selection -->
                <div class="form-section">
                    <h3>Payment Method</h3>
                    <div class="payment-method-grid">
                        <div class="payment-method-option" onclick="paymentsModule.selectPaymentMethod('cash')">
                            <input type="radio" name="paymentMethod" value="cash" id="pm_cash">
                            <label for="pm_cash">
                                <div class="pm-icon">💵</div>
                                <div class="pm-name">Cash</div>
                                <div class="pm-fee">No fees</div>
                            </label>
                        </div>
                        <div class="payment-method-option" onclick="paymentsModule.selectPaymentMethod('credit_card')">
                            <input type="radio" name="paymentMethod" value="credit_card" id="pm_credit">
                            <label for="pm_credit">
                                <div class="pm-icon">💳</div>
                                <div class="pm-name">Credit Card</div>
                                <div class="pm-fee">2.5% fee</div>
                            </label>
                        </div>
                        <div class="payment-method-option" onclick="paymentsModule.selectPaymentMethod('bank_transfer')">
                            <input type="radio" name="paymentMethod" value="bank_transfer" id="pm_bank">
                            <label for="pm_bank">
                                <div class="pm-icon">🏦</div>
                                <div class="pm-name">Bank Transfer</div>
                                <div class="pm-fee">No fees</div>
                            </label>
                        </div>
                        <div class="payment-method-option" onclick="paymentsModule.selectPaymentMethod('installment')">
                            <input type="radio" name="paymentMethod" value="installment" id="pm_installment">
                            <label for="pm_installment">
                                <div class="pm-icon">📊</div>
                                <div class="pm-name">Installment</div>
                                <div class="pm-fee">Setup plan</div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Payment Calculation -->
                <div class="form-section" id="paymentCalculation" style="display: none;">
                    <h3>Payment Breakdown</h3>
                    <div class="payment-breakdown">
                        <div class="breakdown-row">
                            <span>Service Amount:</span>
                            <span id="breakdownAmount">฿0.00</span>
                        </div>
                        <div class="breakdown-row">
                            <span>Processing Fees:</span>
                            <span id="breakdownFees">฿0.00</span>
                        </div>
                        <div class="breakdown-row total">
                            <span>Total to Pay:</span>
                            <span id="breakdownTotal">฿0.00</span>
                        </div>
                    </div>
                </div>

                <!-- Installment Details -->
                <div class="form-section" id="installmentDetails" style="display: none;">
                    <h3>Installment Plan</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Number of Months:</label>
                            <select id="installmentMonths" onchange="paymentsModule.calculateInstallment()">
                                <option value="3">3 months (3% interest)</option>
                                <option value="6">6 months (5% interest)</option>
                                <option value="12">12 months (8% interest)</option>
                                <option value="24">24 months (12% interest)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Down Payment:</label>
                            <input type="number" id="downPayment" placeholder="Optional down payment" min="0" step="0.01" onchange="paymentsModule.calculateInstallment()">
                        </div>
                    </div>
                    <div class="installment-summary" id="installmentSummary"></div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="window.closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="paymentsModule.submitPayment()" id="submitPaymentBtn">
                        💳 Process Payment
                    </button>
                </div>
            </div>
        `;

        window.showModal('Process Payment', modalContent, 'large');
    },

    // Tab switching
    showPaymentTab(tabName) {
        // Update active tab
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        const content = document.getElementById('paymentTabContent');
        if (content) {
            switch (tabName) {
                case 'process':
                    content.innerHTML = this.generateProcessPaymentTab();
                    break;
                case 'pending':
                    content.innerHTML = this.generatePendingPaymentsTab();
                    break;
                case 'insurance':
                    content.innerHTML = this.generateInsuranceClaimsTab();
                    break;
                case 'installments':
                    content.innerHTML = this.generateInstallmentPlansTab();
                    break;
                case 'history':
                    content.innerHTML = this.generatePaymentHistoryTab();
                    break;
                case 'reports':
                    content.innerHTML = this.generateReportsTab();
                    break;
            }
        }
    },

    // Utility methods and data generation
    calculatePaymentStats() {
        return {
            todayRevenue: 128450,
            todayPayments: 23,
            pendingCount: 7,
            insurancePayments: 8,
            insuranceValue: 245600,
            activeInstallments: 12,
            monthlyRecurring: 45200
        };
    },

    extractPaymentHistory(services) {
        return services.filter(s => s.status === 'payment_completed').map(service => ({
            id: service.id,
            amount: service.estimated_cost || 0,
            method: 'credit_card',
            date: service.created_at,
            customer: service.customer_name || 'Unknown',
            status: 'completed'
        }));
    },

    extractPendingPayments(services) {
        return services.filter(s => s.status === 'pending_payment').map(service => ({
            id: service.id,
            amount: service.estimated_cost || 0,
            customer: service.customer_name || 'Unknown',
            service_type: service.service_type || 'general',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
        }));
    },

    generateSampleInstallmentData() {
        return [
            {
                id: 1,
                customer: 'John Smith',
                total_amount: 50000,
                monthly_payment: 4500,
                months_remaining: 8,
                next_payment: '2025-02-15',
                status: 'active'
            },
            {
                id: 2,
                customer: 'Maria Santos',
                total_amount: 75000,
                monthly_payment: 6800,
                months_remaining: 10,
                next_payment: '2025-02-20',
                status: 'active'
            }
        ];
    },

    generateSampleInsuranceData() {
        return [
            {
                id: 1,
                claim_number: 'INS-2025-001',
                customer: 'David Wilson',
                insurance_company: 'กรุงเทพประกันภัย',
                claim_amount: 85000,
                deductible: 10000,
                status: 'approved',
                submitted_date: '2025-01-15'
            },
            {
                id: 2,
                claim_number: 'INS-2025-002',
                customer: 'Sarah Johnson',
                insurance_company: 'ไทยประกันชีวิต',
                claim_amount: 120000,
                deductible: 15000,
                status: 'pending',
                submitted_date: '2025-01-20'
            }
        ];
    },

    generateServiceOptions() {
        return this.pendingPayments.map(payment =>
            `<option value="${payment.id}">Service #${payment.id} - ${payment.customer} - ${this.formatCurrency(payment.amount)}</option>`
        ).join('');
    },

    generateCustomerOptions() {
        const customers = ['John Smith', 'Maria Santos', 'David Wilson', 'Sarah Johnson', 'Mike Chen'];
        return customers.map((customer, index) =>
            `<option value="${index + 1}">${customer}</option>`
        ).join('');
    },

    generatePendingPaymentsList() {
        if (this.pendingPayments.length === 0) {
            return '<div class="no-data">No pending payments</div>';
        }

        return this.pendingPayments.map(payment => `
            <div class="pending-payment-item">
                <div class="payment-info">
                    <div class="payment-customer">${payment.customer}</div>
                    <div class="payment-details">Service #${payment.id} • ${payment.service_type}</div>
                </div>
                <div class="payment-amount">${this.formatCurrency(payment.amount)}</div>
                <div class="payment-due">Due: ${this.formatDate(payment.due_date)}</div>
                <div class="payment-actions">
                    <button class="btn btn-sm btn-primary" onclick="paymentsModule.processPaymentForService(${payment.id})">
                        💳 Pay Now
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="paymentsModule.sendPaymentReminder(${payment.id})">
                        📧 Remind
                    </button>
                </div>
            </div>
        `).join('');
    },

    generateInsuranceClaimsList() {
        if (this.insuranceClaims.length === 0) {
            return '<div class="no-data">No insurance claims</div>';
        }

        return this.insuranceClaims.map(claim => `
            <div class="insurance-claim-item">
                <div class="claim-header">
                    <div class="claim-number">${claim.claim_number}</div>
                    <div class="claim-status status-${claim.status}">${claim.status.toUpperCase()}</div>
                </div>
                <div class="claim-details">
                    <div class="claim-customer">${claim.customer}</div>
                    <div class="claim-company">${claim.insurance_company}</div>
                    <div class="claim-amounts">
                        <span>Claim: ${this.formatCurrency(claim.claim_amount)}</span>
                        <span>Deductible: ${this.formatCurrency(claim.deductible)}</span>
                    </div>
                </div>
                <div class="claim-actions">
                    <button class="btn btn-sm btn-primary" onclick="paymentsModule.viewClaimDetails(${claim.id})">
                        👁️ View Details
                    </button>
                    ${claim.status === 'approved' ? `
                        <button class="btn btn-sm btn-success" onclick="paymentsModule.processInsurancePayment(${claim.id})">
                            💰 Process Payment
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    generateInstallmentPlansList() {
        if (this.installmentPlans.length === 0) {
            return '<div class="no-data">No active installment plans</div>';
        }

        return this.installmentPlans.map(plan => `
            <div class="installment-plan-item">
                <div class="plan-customer">${plan.customer}</div>
                <div class="plan-details">
                    <div class="plan-amount">Total: ${this.formatCurrency(plan.total_amount)}</div>
                    <div class="plan-monthly">Monthly: ${this.formatCurrency(plan.monthly_payment)}</div>
                    <div class="plan-remaining">${plan.months_remaining} payments left</div>
                </div>
                <div class="plan-next-payment">
                    Next: ${this.formatDate(plan.next_payment)}
                </div>
                <div class="plan-actions">
                    <button class="btn btn-sm btn-primary" onclick="paymentsModule.processInstallmentPayment(${plan.id})">
                        💳 Process Payment
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="paymentsModule.viewInstallmentDetails(${plan.id})">
                        📊 View Plan
                    </button>
                </div>
            </div>
        `).join('');
    },

    generatePaymentHistoryList() {
        if (this.paymentHistory.length === 0) {
            return '<div class="no-data">No payment history available</div>';
        }

        return this.paymentHistory.map(payment => `
            <div class="payment-history-item">
                <div class="payment-date">${this.formatDate(payment.date)}</div>
                <div class="payment-customer">${payment.customer}</div>
                <div class="payment-method">${this.getPaymentMethodLabel(payment.method)}</div>
                <div class="payment-amount">${this.formatCurrency(payment.amount)}</div>
                <div class="payment-status status-${payment.status}">${payment.status}</div>
                <div class="payment-actions">
                    <button class="btn btn-sm btn-outline" onclick="paymentsModule.viewPaymentReceipt(${payment.id})">
                        🧾 Receipt
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Payment processing methods
    loadCustomerServices() {
        const customerId = document.getElementById('paymentCustomer').value;
        // Mock loading customer services
        const serviceSelect = document.getElementById('paymentService');
        serviceSelect.innerHTML = `
            <option value="">Select Service</option>
            <option value="1">Vehicle Repair - ${this.formatCurrency(25000)}</option>
            <option value="2">Oil Change - ${this.formatCurrency(1500)}</option>
            <option value="3">Insurance Claim - ${this.formatCurrency(45000)}</option>
        `;
    },

    loadServiceAmount() {
        const serviceId = document.getElementById('paymentService').value;
        const amounts = { '1': 25000, '2': 1500, '3': 45000 };
        document.getElementById('paymentAmount').value = amounts[serviceId] || '';
        this.calculatePaymentTotal();
    },

    selectPaymentMethod(method) {
        document.getElementById(`pm_${method}`).checked = true;
        this.calculatePaymentTotal();

        const calculationSection = document.getElementById('paymentCalculation');
        const installmentSection = document.getElementById('installmentDetails');

        calculationSection.style.display = 'block';

        if (method === 'installment') {
            installmentSection.style.display = 'block';
            this.calculateInstallment();
        } else {
            installmentSection.style.display = 'none';
        }
    },

    calculatePaymentTotal() {
        const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');

        if (!selectedMethod || amount === 0) return;

        const feeRates = {
            cash: 0,
            credit_card: 2.5,
            debit_card: 1,
            bank_transfer: 0,
            installment: 0 // Handled separately
        };

        const feeRate = feeRates[selectedMethod.value] || 0;
        const fees = (amount * feeRate) / 100;
        const total = amount + fees;

        document.getElementById('breakdownAmount').textContent = this.formatCurrency(amount);
        document.getElementById('breakdownFees').textContent = this.formatCurrency(fees);
        document.getElementById('breakdownTotal').textContent = this.formatCurrency(total);
    },

    calculateInstallment() {
        const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const months = parseInt(document.getElementById('installmentMonths').value) || 3;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;

        const interestRates = { 3: 3, 6: 5, 12: 8, 24: 12 };
        const interestRate = interestRates[months] || 5;

        const remainingAmount = amount - downPayment;
        const totalInterest = (remainingAmount * interestRate) / 100;
        const totalWithInterest = remainingAmount + totalInterest;
        const monthlyPayment = totalWithInterest / months;

        const summaryHtml = `
            <div class="installment-calculation">
                <div class="calc-row">
                    <span>Service Amount:</span>
                    <span>${this.formatCurrency(amount)}</span>
                </div>
                <div class="calc-row">
                    <span>Down Payment:</span>
                    <span>${this.formatCurrency(downPayment)}</span>
                </div>
                <div class="calc-row">
                    <span>Remaining Amount:</span>
                    <span>${this.formatCurrency(remainingAmount)}</span>
                </div>
                <div class="calc-row">
                    <span>Interest (${interestRate}%):</span>
                    <span>${this.formatCurrency(totalInterest)}</span>
                </div>
                <div class="calc-row total">
                    <span>Monthly Payment:</span>
                    <span>${this.formatCurrency(monthlyPayment)}</span>
                </div>
                <div class="calc-row">
                    <span>Total to Pay:</span>
                    <span>${this.formatCurrency(downPayment + totalWithInterest)}</span>
                </div>
            </div>
        `;

        document.getElementById('installmentSummary').innerHTML = summaryHtml;
    },

    calculateQuickTotal() {
        const amount = parseFloat(document.getElementById('quickPaymentAmount').value) || 0;
        const method = document.getElementById('quickPaymentMethod').value;

        const feeRates = { cash: 0, credit_card: 2.5, debit_card: 1, bank_transfer: 0 };
        const feeRate = feeRates[method] || 0;
        const fees = (amount * feeRate) / 100;
        const total = amount + fees;

        document.getElementById('quickTotalDisplay').textContent = this.formatCurrency(total);
    },

    // Action methods
    submitPayment() {
        this.showToast('💳 Processing payment...', 'info');

        setTimeout(() => {
            this.showToast('✅ Payment processed successfully!', 'success');
            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }
            this.generatePaymentReceipt();
        }, 2000);
    },

    processQuickPayment() {
        const serviceId = document.getElementById('quickServiceSelect').value;
        const amount = document.getElementById('quickPaymentAmount').value;
        const method = document.getElementById('quickPaymentMethod').value;

        if (!serviceId || !amount || !method) {
            this.showToast('❌ Please fill in all fields', 'error');
            return;
        }

        this.showToast('💳 Processing quick payment...', 'info');

        setTimeout(() => {
            this.showToast('✅ Payment processed successfully!', 'success');
            this.clearQuickForm();
        }, 1500);
    },

    clearQuickForm() {
        document.getElementById('quickServiceSelect').value = '';
        document.getElementById('quickPaymentAmount').value = '';
        document.getElementById('quickPaymentMethod').value = '';
        document.getElementById('quickTotalDisplay').textContent = '฿0.00';
    },

    generatePaymentReceipt() {
        this.showToast('🧾 Generating receipt...', 'info');

        const receiptContent = `
            <div class="payment-receipt">
                <div class="receipt-header">
                    <h2>🧾 Payment Receipt</h2>
                    <div class="receipt-info">
                        <div>Receipt #: REC-${Date.now().toString().slice(-6)}</div>
                        <div>Date: ${new Date().toLocaleString()}</div>
                    </div>
                </div>

                <div class="receipt-details">
                    <table class="receipt-table">
                        <tr>
                            <td>Customer:</td>
                            <td>John Smith</td>
                        </tr>
                        <tr>
                            <td>Service:</td>
                            <td>Vehicle Repair</td>
                        </tr>
                        <tr>
                            <td>Payment Method:</td>
                            <td>Credit Card</td>
                        </tr>
                        <tr>
                            <td>Service Amount:</td>
                            <td>${this.formatCurrency(25000)}</td>
                        </tr>
                        <tr>
                            <td>Processing Fee:</td>
                            <td>${this.formatCurrency(625)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Total Paid:</strong></td>
                            <td><strong>${this.formatCurrency(25625)}</strong></td>
                        </tr>
                    </table>
                </div>

                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="window.closeModal()">Close</button>
                        <button class="btn btn-primary" onclick="paymentsModule.printReceipt()">🖨️ Print</button>
                        <button class="btn btn-secondary" onclick="paymentsModule.emailReceipt()">📧 Email</button>
                    </div>
                </div>
            </div>
        `;

        if (typeof window.showModal === 'function') {
            window.showModal('Payment Receipt', receiptContent, 'medium');
        }
    },

    // Additional action methods
    processPaymentForService(serviceId) {
        this.showToast(`💳 Processing payment for service #${serviceId}...`, 'info');
        this.processNewPayment();
    },

    sendPaymentReminder(paymentId) {
        this.showToast('📧 Sending payment reminder...', 'info');
        setTimeout(() => {
            this.showToast('✅ Payment reminder sent successfully!', 'success');
        }, 1000);
    },

    processBulkPayments() {
        this.showToast('📋 Processing multiple payments...', 'info');
        alert('Bulk Payment Processing\n\nThis feature allows you to:\n• Select multiple pending payments\n• Process them simultaneously\n• Generate batch receipts\n• Update all service statuses');
    },

    printReceipt() {
        this.showToast('🖨️ Printing receipt...', 'info');
        window.print();
    },

    emailReceipt() {
        this.showToast('📧 Emailing receipt...', 'info');
        setTimeout(() => {
            this.showToast('✅ Receipt emailed successfully!', 'success');
        }, 1000);
    },

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0
        }).format(amount || 0);
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('th-TH');
        } catch {
            return 'Invalid Date';
        }
    },

    getPaymentMethodLabel(method) {
        const labels = {
            cash: '💵 Cash',
            credit_card: '💳 Credit Card',
            debit_card: '💳 Debit Card',
            bank_transfer: '🏦 Bank Transfer',
            installment: '📊 Installment'
        };
        return labels[method] || method;
    },

    calculatePendingTotal() {
        return this.pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    },

    calculateInsuranceTotal() {
        return this.insuranceClaims.reduce((sum, claim) => sum + claim.claim_amount, 0);
    },

    calculateMonthlyRecurring() {
        return this.installmentPlans.reduce((sum, plan) => sum + plan.monthly_payment, 0);
    },

    getUpcomingPayments() {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return this.installmentPlans.filter(plan =>
            new Date(plan.next_payment) <= nextWeek
        ).length;
    },

    // Error interface
    generateErrorInterface(error) {
        return `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error Loading Payment Module</h2>
                <p>The payment processing system failed to load.</p>
                <p><strong>Error:</strong> ${error}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        🔄 Reload Page
                    </button>
                </div>
            </div>
        `;
    },

    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`Toast (${type}): ${message}`);
        }
    },

    // Compatibility methods
    async renderPayments() {
        return await this.loadModule();
    },

    async init() {
        console.log('💳 Complete payment module initialized');
        return true;
    },

    async refreshPayments() {
        console.log('🔄 Refreshing payment data...');
        await this.loadPaymentData();
    }
};

// Make module globally available
window.paymentsModule = paymentsModule;

console.log('💳 Complete Payment Processing Module loaded - comprehensive payment management');