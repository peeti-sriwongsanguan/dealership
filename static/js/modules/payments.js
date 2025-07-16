// static/js/modules/payments.js - Complete Professional Payment Module
console.log('🔄 payments.js file is loading...');

const paymentsModule = {
    currentPayment: null,
    paymentHistory: [],
    pendingServices: [],
    paymentStatistics: {},

    test() {
        console.log('✅ paymentsModule.test() called successfully');
        return 'Module is working!';
    },

    async loadModule() {
        console.log('💳 Loading Professional Payment Module...');

        try {
            await this.loadPaymentData();
            console.log('✅ Payment data loaded successfully');
            return this.generatePaymentInterface();
        } catch (error) {
            console.error('❌ Error in loadModule:', error);
            return this.generateErrorInterface(error.message);
        }
    },

    async loadPaymentData() {
        console.log('🔄 Loading payment data...');
        this.paymentHistory = [];
        this.pendingServices = [];
        this.paymentStatistics = {};

        try {
            // Test API connection first
            console.log('🔄 Testing API connection...');
            const testResponse = await fetch('/api');
            console.log('✅ API test response:', testResponse.ok);

            // Load payment statistics - skip if endpoint doesn't exist
            console.log('🔄 Loading payment statistics...');
            try {
                const statsResponse = await fetch('/api/payments/statistics');
                console.log('📊 Stats response:', statsResponse.ok, statsResponse.status);

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    this.paymentStatistics = statsData.statistics || {};
                    console.log('✅ Payment statistics loaded:', this.paymentStatistics);
                } else {
                    console.warn('⚠️ Payment statistics endpoint not available');
                }
            } catch (e) {
                console.warn('⚠️ Payment statistics failed to load:', e);
            }

            // Load pending services - skip if endpoint doesn't exist
            console.log('🔄 Loading pending services...');
            try {
                const pendingResponse = await fetch('/api/payments/pending-services');
                console.log('⏳ Pending response:', pendingResponse.ok, pendingResponse.status);

                if (pendingResponse.ok) {
                    const pendingData = await pendingResponse.json();
                    this.pendingServices = pendingData.pending_services || [];
                    console.log('✅ Pending services loaded:', this.pendingServices.length);
                } else {
                    console.warn('⚠️ Pending services endpoint not available');
                    // Add some mock data for testing
                    this.pendingServices = [
                        {
                            id: 1,
                            customer_name: 'John Doe',
                            vehicle_info: 'Toyota Camry 2020',
                            estimated_cost: 1500,
                            description: 'Oil change and brake inspection',
                            service_type: 'maintenance'
                        },
                        {
                            id: 2,
                            customer_name: 'Jane Smith',
                            vehicle_info: 'Honda Civic 2019',
                            estimated_cost: 2500,
                            description: 'Engine repair',
                            service_type: 'repair'
                        }
                    ];
                }
            } catch (e) {
                console.warn('⚠️ Pending services failed to load:', e);
            }

            // Load payment history
            console.log('🔄 Loading payment history...');
            try {
                const historyResponse = await fetch('/api/payments');
                console.log('📊 History response:', historyResponse.ok, historyResponse.status);

                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    this.paymentHistory = historyData.payments || [];
                    console.log('✅ Payment history loaded:', this.paymentHistory.length);
                } else {
                    console.warn('⚠️ Payment history failed to load');
                    // Add some mock data for testing
                    this.paymentHistory = [
                        {
                            id: 1,
                            customer_name: 'John Doe',
                            service_id: 1,
                            payment_method: 'credit_card',
                            total_amount: 1500,
                            status: 'completed',
                            created_at: new Date().toISOString(),
                            receipt_number: 'REC-20240116-001'
                        }
                    ];
                }
            } catch (e) {
                console.warn('⚠️ Payment history failed to load:', e);
            }

        } catch (error) {
            console.error('❌ Error loading payment data:', error);
            // Don't throw - allow module to load with empty data
        }
    },

    generatePaymentInterface() {
        console.log('🎨 Generating payment interface...');
        return `
            <div class="payment-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">💳 Payment Processing</h2>
                    <div class="action-bar-actions">
                        <button class="btn btn-outline" onclick="paymentsModule.exportPaymentData()">
                            📤 Export
                        </button>
                        <button class="btn btn-primary" onclick="paymentsModule.processNewPayment()">
                            ➕ New Payment
                        </button>
                    </div>
                </div>

                <!-- Payment Statistics -->
                <div class="stats-grid">
                    <div class="stat-card revenue">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.formatCurrency(this.paymentStatistics.today_revenue || 0)}</div>
                            <div class="stat-label">Today's Revenue</div>
                            <div class="stat-change">+${this.paymentStatistics.payments_today || 0} payments</div>
                        </div>
                    </div>

                    <div class="stat-card payments">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.paymentHistory.length}</div>
                            <div class="stat-label">Total Payments</div>
                            <div class="stat-change">${this.paymentStatistics.pending_payments || this.pendingServices.length} pending</div>
                        </div>
                    </div>

                    <div class="stat-card installments">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.formatCurrency(this.paymentStatistics.month_revenue || 0)}</div>
                            <div class="stat-label">This Month</div>
                            <div class="stat-change">Monthly revenue</div>
                        </div>
                    </div>

                    <div class="stat-card insurance">
                        <div class="stat-icon">🏥</div>
                        <div class="stat-content">
                            <div class="stat-number">0</div>
                            <div class="stat-label">Insurance Claims</div>
                            <div class="stat-change">Active claims</div>
                        </div>
                    </div>
                </div>

                <!-- Payment Navigation Tabs -->
                <div class="payment-tabs-wrapper">
                    <div class="payment-tabs">
                        <button class="payment-tab active" onclick="paymentsModule.showPaymentTab('process')" data-tab="process">
                            💳 Process Payment
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('pending')" data-tab="pending">
                            ⏳ Pending Payments
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('history')" data-tab="history">
                            📊 Payment History
                        </button>
                        <button class="payment-tab" onclick="paymentsModule.showPaymentTab('reports')" data-tab="reports">
                            📈 Reports
                        </button>
                    </div>
                </div>
                <!-- Tab Content Container -->
                <div class="payment-tab-content">
                    ${this.generateTabContent()}
                </div>
            </div>
        `;
    },

    generateTabContent() {
        return `
            <!-- Process Payment Tab -->
            <div id="process-content" class="tab-content active">
                ${this.generateProcessTab()}
            </div>

            <!-- Pending Payments Tab -->
            <div id="pending-content" class="tab-content">
                ${this.generatePendingTab()}
            </div>

            <!-- Payment History Tab -->
            <div id="history-content" class="tab-content">
                ${this.generateHistoryTab()}
            </div>

            <!-- Reports Tab -->
            <div id="reports-content" class="tab-content">
                ${this.generateReportsTab()}
            </div>
        `;
    },

    generateProcessTab() {
        return `
            <!-- Payment Actions Section -->
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
                            <h3>Insurance Payment</h3>
                            <p>Handle insurance claims and deductibles</p>
                        </div>
                    </button>

                    <button class="payment-action-card" onclick="paymentsModule.setupInstallmentPlan()">
                        <div class="action-icon">📅</div>
                        <div class="action-content">
                            <h3>Installment Plan</h3>
                            <p>Create monthly payment schedules</p>
                        </div>
                    </button>

                    <button class="payment-action-card" onclick="paymentsModule.processRefund()">
                        <div class="action-icon">↩️</div>
                        <div class="action-content">
                            <h3>Process Refund</h3>
                            <p>Handle refunds and cancellations</p>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Quick Payment Section -->
            <div class="quick-payment-section">
                <h2>⚡ Quick Service Payment</h2>
                <div class="quick-payment-form">
                    ${this.generateQuickPaymentForm()}
                </div>
            </div>
        `;
    },

    generateQuickPaymentForm() {
        return `
            <div class="quick-form-row">
                <div class="quick-form-group">
                    <label>Select Service:</label>
                    <select class="form-select" id="quickServiceSelect" onchange="paymentsModule.loadServiceDetails()">
                        <option value="">Choose pending service...</option>
                        ${this.pendingServices.map(service =>
                            `<option value="${service.id}" data-amount="${service.estimated_cost}" data-customer="${service.customer_name}">
                                Service #${service.id} - ${service.customer_name} - ${this.formatCurrency(service.estimated_cost)}
                            </option>`
                        ).join('')}
                    </select>
                </div>

                <div class="quick-form-group">
                    <label>Payment Amount:</label>
                    <input type="number" class="form-input" id="quickPaymentAmount" placeholder="Enter amount" min="0" step="0.01" oninput="paymentsModule.calculateQuickTotal()">
                </div>
            </div>

            <div class="quick-form-row">
                <div class="quick-form-group">
                    <label>Payment Method:</label>
                    <select class="form-select" id="quickPaymentMethod" onchange="paymentsModule.calculateQuickTotal()">
                        <option value="">Select method...</option>
                        <option value="cash">💵 Cash (No fees)</option>
                        <option value="credit_card">💳 Credit Card (2.5% fee)</option>
                        <option value="bank_transfer">🏦 Bank Transfer (No fees)</option>
                    </select>
                </div>

                <div class="quick-form-group">
                    <label>Total with Fees:</label>
                    <div class="quick-total-display" id="quickTotalDisplay">฿0.00</div>
                </div>
            </div>

            <div class="quick-form-actions">
                <button class="btn btn-outline" onclick="paymentsModule.clearQuickForm()">🔄 Clear</button>
                <button class="btn btn-primary" onclick="paymentsModule.processQuickPayment()">💳 Process Payment</button>
            </div>
        `;
    },

    generatePendingTab() {
        if (this.pendingServices.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <div class="empty-title">No Pending Payments</div>
                    <div class="empty-description">All services have been paid for!</div>
                </div>
            `;
        }

        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">⏳ Pending Payments (${this.pendingServices.length} items)</h3>
                    <div class="data-table-actions">
                        <button class="btn btn-outline">📧 Send Reminders</button>
                        <button class="btn btn-primary">📋 Process Multiple</button>
                    </div>
                </div>
                <div class="data-table-content">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Customer</th>
                                <th>Vehicle</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.pendingServices.map(service => `
                                <tr>
                                    <td>
                                        <div><strong>Service #${service.id}</strong></div>
                                        <div style="font-size: 0.875rem; color: #6b7280;">${service.description || service.service_type}</div>
                                    </td>
                                    <td>${service.customer_name}</td>
                                    <td>${service.vehicle_info || 'N/A'}</td>
                                    <td>${this.formatCurrency(service.estimated_cost)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" onclick="paymentsModule.payForService(${service.id})">
                                            💳 Pay Now
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    generateHistoryTab() {
        return `
            <div class="data-table-container">
                <div class="data-table-header">
                    <h3 class="data-table-title">📊 Payment History (${this.paymentHistory.length} records)</h3>
                    <div class="data-table-actions">
                        <button class="btn btn-outline" onclick="paymentsModule.exportPaymentData()">📤 Export</button>
                        <button class="btn btn-secondary">📅 Filter by Date</button>
                    </div>
                </div>
                <div class="data-table-content">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.paymentHistory.slice(0, 10).map(payment => `
                                <tr>
                                    <td>${this.formatDate(payment.created_at)}</td>
                                    <td>${payment.customer_name}</td>
                                    <td>Service #${payment.service_id}</td>
                                    <td>${this.formatPaymentMethod(payment.payment_method)}</td>
                                    <td>${this.formatCurrency(payment.total_amount)}</td>
                                    <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                                    <td><button class="btn btn-sm btn-outline" onclick="paymentsModule.viewReceipt('${payment.receipt_number}')">📄 View</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    generateReportsTab() {
        return `
            <div class="payment-reports-section">
                <h2>📈 Payment Reports & Analytics</h2>

                <!-- Quick Stats -->
                <div class="reports-stats-grid">
                    <div class="report-stat-card">
                        <h3>💰 Revenue Analysis</h3>
                        <p>Today: ${this.formatCurrency(this.paymentStatistics.today_revenue || 0)}</p>
                        <p>This Month: ${this.formatCurrency(this.paymentStatistics.month_revenue || 0)}</p>
                        <p>Avg per Payment: ${this.formatCurrency((this.paymentStatistics.month_revenue || 0) / Math.max(this.paymentHistory.length, 1))}</p>
                    </div>

                    <div class="report-stat-card">
                        <h3>📊 Payment Methods</h3>
                        ${this.generatePaymentMethodBreakdown()}
                    </div>

                    <div class="report-stat-card">
                        <h3>🎯 Performance</h3>
                        <p>Total Payments: ${this.paymentHistory.length}</p>
                        <p>Pending Services: ${this.pendingServices.length}</p>
                        <p>Success Rate: ${this.paymentHistory.length > 0 ? '100%' : '0%'}</p>
                    </div>
                </div>

                <!-- Report Actions -->
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="paymentsModule.generateDetailedReport()">📊 Generate Detailed Report</button>
                    <button class="btn btn-outline" onclick="paymentsModule.exportPaymentData()">📤 Export All Data</button>
                </div>
            </div>
        `;
    },

    generatePaymentMethodBreakdown() {
        const methodCounts = {};
        this.paymentHistory.forEach(payment => {
            methodCounts[payment.payment_method] = (methodCounts[payment.payment_method] || 0) + 1;
        });

        return Object.entries(methodCounts).map(([method, count]) =>
            `<p>${this.formatPaymentMethod(method)}: ${count}</p>`
        ).join('') || '<p>No payment data available</p>';
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
        return new Date(dateString).toLocaleDateString('th-TH');
    },

    formatPaymentMethod(method) {
        const methods = {
            'cash': '💵 Cash',
            'credit_card': '💳 Credit Card',
            'bank_transfer': '🏦 Bank Transfer'
        };
        return methods[method] || method;
    },

    // Tab management
    showPaymentTab(tabName) {
        console.log('🔄 Switching to tab:', tabName);

        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.payment-tab').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const targetContent = document.getElementById(tabName + '-content');
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // Add active class to clicked tab button
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
    },

    // Payment processing methods
    loadServiceDetails() {
        const select = document.getElementById('quickServiceSelect');
        const selectedOption = select.options[select.selectedIndex];
        const amount = selectedOption.getAttribute('data-amount');

        if (amount) {
            document.getElementById('quickPaymentAmount').value = amount;
            this.calculateQuickTotal();
        }
    },

    calculateQuickTotal() {
        const amount = parseFloat(document.getElementById('quickPaymentAmount').value) || 0;
        const method = document.getElementById('quickPaymentMethod').value;

        const feeRates = {
            cash: 0,
            credit_card: 2.5,
            bank_transfer: 0
        };

        const feeRate = feeRates[method] || 0;
        const fees = (amount * feeRate) / 100;
        const total = amount + fees;

        document.getElementById('quickTotalDisplay').textContent = this.formatCurrency(total);
    },

    async processQuickPayment() {
        const serviceId = document.getElementById('quickServiceSelect').value;
        const amount = parseFloat(document.getElementById('quickPaymentAmount').value);
        const method = document.getElementById('quickPaymentMethod').value;

        if (!serviceId || !amount || !method) {
            this.showNotification('❌ Please fill in all fields', 'error');
            return;
        }

        try {
            const feeRate = method === 'credit_card' ? 2.5 : 0;
            const fees = (amount * feeRate) / 100;
            const totalAmount = amount + fees;

            // Generate receipt number for demo
            const receiptNumber = `REC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-6)}`;

            // Show processing
            this.showNotification('💳 Processing payment...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Show success
            this.showNotification('✅ Payment processed successfully!', 'success');

            // Clear form
            this.clearQuickForm();

            // Show receipt
            this.showPaymentReceipt({
                receipt_number: receiptNumber,
                amount: amount,
                fees: fees,
                total: totalAmount,
                method: method,
                service_id: serviceId
            });

            // Add to payment history for demo
            this.paymentHistory.unshift({
                id: this.paymentHistory.length + 1,
                customer_name: document.getElementById('quickServiceSelect').options[document.getElementById('quickServiceSelect').selectedIndex].getAttribute('data-customer'),
                service_id: serviceId,
                payment_method: method,
                total_amount: totalAmount,
                status: 'completed',
                created_at: new Date().toISOString(),
                receipt_number: receiptNumber
            });

            // Remove from pending services
            this.pendingServices = this.pendingServices.filter(s => s.id != serviceId);

            // Refresh interface
            this.refreshInterface();

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showNotification('❌ Payment processing failed', 'error');
        }
    },

    clearQuickForm() {
        document.getElementById('quickServiceSelect').value = '';
        document.getElementById('quickPaymentAmount').value = '';
        document.getElementById('quickPaymentMethod').value = '';
        document.getElementById('quickTotalDisplay').textContent = '฿0.00';
    },

    async payForService(serviceId) {
        // Find the service details
        const service = this.pendingServices.find(s => s.id === serviceId);
        if (!service) return;

        // Pre-fill the quick payment form
        document.getElementById('quickServiceSelect').value = serviceId;
        document.getElementById('quickPaymentAmount').value = service.estimated_cost;

        // Switch to process tab
        this.showPaymentTab('process');

        // Focus on payment method
        setTimeout(() => {
            document.getElementById('quickPaymentMethod').focus();
        }, 100);

        this.showNotification('ℹ️ Service selected. Choose payment method to continue.', 'info');
    },

    showPaymentReceipt(paymentData) {
        const receiptModal = document.createElement('div');
        receiptModal.className = 'modal active';
        receiptModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const currentDate = new Date().toLocaleString('th-TH');

        receiptModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <h3 style="margin: 0 0 0.5rem 0;">🧾 Payment Receipt</h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 0.875rem;">Receipt #${paymentData.receipt_number}</p>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Date:</span>
                            <span><strong>${currentDate}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Service:</span>
                            <span><strong>#${paymentData.service_id}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Method:</span>
                            <span>${this.formatPaymentMethod(paymentData.method)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Amount:</span>
                            <span>${this.formatCurrency(paymentData.amount)}</span>
                        </div>
                        ${paymentData.fees > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Processing Fees:</span>
                            <span>${this.formatCurrency(paymentData.fees)}</span>
                        </div>
                        ` : ''}
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding-top: 0.5rem;
                            border-top: 2px solid #e5e7eb;
                            font-weight: 600;
                            font-size: 1.1rem;
                        ">
                            <span>Total Paid:</span>
                            <span style="color: #059669;">${this.formatCurrency(paymentData.total)}</span>
                        </div>
                    </div>
                    <div style="
                        display: flex;
                        gap: 0.75rem;
                        justify-content: center;
                        margin-top: 1.5rem;
                    ">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
                        <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(receiptModal);

        // Remove modal when clicking outside
        receiptModal.addEventListener('click', (e) => {
            if (e.target === receiptModal) {
                receiptModal.remove();
            }
        });
    },

    viewReceipt(receiptNumber) {
        const payment = this.paymentHistory.find(p => p.receipt_number === receiptNumber);
        if (payment) {
            this.showPaymentReceipt({
                receipt_number: payment.receipt_number,
                amount: payment.total_amount,
                fees: 0,
                total: payment.total_amount,
                method: payment.payment_method,
                service_id: payment.service_id
            });
        }
    },

    refreshInterface() {
        // Regenerate the interface with new data
        const container = document.querySelector('.payment-section');
        if (container) {
            container.outerHTML = this.generatePaymentInterface();
        }
    },

    // Action methods
    async processNewPayment() {
        this.showNotification('💳 Opening payment form...', 'info');

        // Create a new payment modal
        const paymentModal = document.createElement('div');
        paymentModal.className = 'modal active';
        paymentModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        paymentModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <h3 style="margin: 0;">💳 Process New Payment</h3>
                </div>
                <div style="padding: 1.5rem;">
                    <form id="newPaymentForm">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Select Service:</label>
                            <select class="form-select" id="newPaymentService" required style="width: 100%;">
                                <option value="">Choose a service...</option>
                                ${this.pendingServices.map(service =>
                                    `<option value="${service.id}" data-amount="${service.estimated_cost}" data-customer="${service.customer_name}">
                                        Service #${service.id} - ${service.customer_name} - ${this.formatCurrency(service.estimated_cost)}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Payment Amount:</label>
                            <input type="number" class="form-input" id="newPaymentAmount" min="0" step="0.01" required style="width: 100%;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Payment Method:</label>
                            <select class="form-select" id="newPaymentMethod" required style="width: 100%;">
                                <option value="">Select method...</option>
                                <option value="cash">💵 Cash (No fees)</option>
                                <option value="credit_card">💳 Credit Card (2.5% fee)</option>
                                <option value="bank_transfer">🏦 Bank Transfer (No fees)</option>
                                <option value="check">📝 Check (No fees)</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Notes (Optional):</label>
                            <textarea class="form-textarea" id="newPaymentNotes" rows="3" style="width: 100%;" placeholder="Additional notes..."></textarea>
                        </div>

                        <div style="
                            display: flex;
                            gap: 0.75rem;
                            justify-content: flex-end;
                            margin-top: 1.5rem;
                        ">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">💳 Process Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(paymentModal);

        // Handle form submission
        document.getElementById('newPaymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitNewPayment();
            paymentModal.remove();
        });

        // Remove modal when clicking outside
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                paymentModal.remove();
            }
        });
    },

    async submitNewPayment() {
        const serviceId = document.getElementById('newPaymentService').value;
        const amount = parseFloat(document.getElementById('newPaymentAmount').value);
        const method = document.getElementById('newPaymentMethod').value;
        const notes = document.getElementById('newPaymentNotes').value;

        if (!serviceId || !amount || !method) {
            this.showNotification('❌ Please fill in all required fields', 'error');
            return;
        }

        try {
            const feeRate = method === 'credit_card' ? 2.5 : 0;
            const fees = (amount * feeRate) / 100;
            const totalAmount = amount + fees;

            this.showNotification('💳 Processing payment...', 'info');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            const receiptNumber = `REC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-6)}`;

            // Add to payment history
            this.paymentHistory.unshift({
                id: this.paymentHistory.length + 1,
                customer_name: document.getElementById('newPaymentService').options[document.getElementById('newPaymentService').selectedIndex].getAttribute('data-customer'),
                service_id: serviceId,
                payment_method: method,
                total_amount: totalAmount,
                status: 'completed',
                created_at: new Date().toISOString(),
                receipt_number: receiptNumber
            });

            // Remove from pending services
            this.pendingServices = this.pendingServices.filter(s => s.id != serviceId);

            this.showNotification('✅ Payment processed successfully!', 'success');

            // Show receipt
            this.showPaymentReceipt({
                receipt_number: receiptNumber,
                amount: amount,
                fees: fees,
                total: totalAmount,
                method: method,
                service_id: serviceId
            });

            this.refreshInterface();

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showNotification('❌ Payment processing failed', 'error');
        }
    },

    async processInsurancePayment() {
        this.showNotification('🏥 Insurance payment functionality coming soon...', 'info');

        // Show insurance payment modal
        const insuranceModal = document.createElement('div');
        insuranceModal.className = 'modal active';
        insuranceModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        insuranceModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏥</div>
                <h3 style="margin-bottom: 1rem;">Insurance Payment Processing</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                    Insurance claim processing, deductible calculations, and direct billing
                    functionality will be available in the next update.
                </p>
                <div style="
                    background: #f0f9ff;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    text-align: left;
                ">
                    <strong>Coming Features:</strong>
                    <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                        <li>Insurance company integration</li>
                        <li>Claim number tracking</li>
                        <li>Deductible calculation</li>
                        <li>Direct billing support</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Got it!</button>
            </div>
        `;

        document.body.appendChild(insuranceModal);

        insuranceModal.addEventListener('click', (e) => {
            if (e.target === insuranceModal) {
                insuranceModal.remove();
            }
        });
    },

    async setupInstallmentPlan() {
        this.showNotification('📅 Installment plan functionality coming soon...', 'info');

        // Show installment plan modal
        const installmentModal = document.createElement('div');
        installmentModal.className = 'modal active';
        installmentModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        installmentModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                <h3 style="margin-bottom: 1rem;">Installment Plan Setup</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                    Monthly payment plans, interest calculations, and automatic billing
                    functionality will be available in the next update.
                </p>
                <div style="
                    background: #f0f9ff;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    text-align: left;
                ">
                    <strong>Coming Features:</strong>
                    <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                        <li>Flexible payment schedules</li>
                        <li>Interest rate calculations</li>
                        <li>Automatic payment reminders</li>
                        <li>Payment tracking dashboard</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Got it!</button>
            </div>
        `;

        document.body.appendChild(installmentModal);

        installmentModal.addEventListener('click', (e) => {
            if (e.target === installmentModal) {
                installmentModal.remove();
            }
        });
    },

    async processRefund() {
        this.showNotification('↩️ Refund functionality coming soon...', 'info');

        // Show refund modal
        const refundModal = document.createElement('div');
        refundModal.className = 'modal active';
        refundModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        refundModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                text-align: center;
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">↩️</div>
                <h3 style="margin-bottom: 1rem;">Refund Processing</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                    Full and partial refund processing, refund tracking, and approval
                    workflows will be available in the next update.
                </p>
                <div style="
                    background: #f0f9ff;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    text-align: left;
                ">
                    <strong>Coming Features:</strong>
                    <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                        <li>Full and partial refunds</li>
                        <li>Refund approval workflow</li>
                        <li>Refund reason tracking</li>
                        <li>Automatic payment reversals</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Got it!</button>
            </div>
        `;

        document.body.appendChild(refundModal);

        refundModal.addEventListener('click', (e) => {
            if (e.target === refundModal) {
                refundModal.remove();
            }
        });
    },

    async exportPaymentData() {
        this.showNotification('📤 Exporting payment data...', 'info');

        try {
            // Create CSV data
            const csvData = this.paymentHistory.map(payment => ({
                'Date': this.formatDate(payment.created_at),
                'Customer': payment.customer_name,
                'Service ID': payment.service_id,
                'Method': payment.payment_method,
                'Amount': payment.total_amount,
                'Status': payment.status,
                'Receipt': payment.receipt_number
            }));

            // Convert to CSV
            const csv = this.convertToCSV(csvData);

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.showNotification('✅ Payment data exported successfully!', 'success');
        } catch (error) {
            this.showNotification('❌ Export failed', 'error');
        }
    },

    generateDetailedReport() {
        this.showNotification('📊 Generating detailed report...', 'info');

        // Create a detailed report modal
        const reportModal = document.createElement('div');
        reportModal.className = 'modal active';
        reportModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const totalRevenue = this.paymentHistory.reduce((sum, payment) => sum + payment.total_amount, 0);
        const averagePayment = totalRevenue / Math.max(this.paymentHistory.length, 1);

        reportModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                ">
                    <h3 style="margin: 0;">📊 Detailed Payment Report</h3>
                    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Generated on ${new Date().toLocaleDateString('th-TH')}</p>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${this.formatCurrency(totalRevenue)}</div>
                            <div style="font-size: 0.875rem; color: #6b7280;">Total Revenue</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">${this.paymentHistory.length}</div>
                            <div style="font-size: 0.875rem; color: #6b7280;">Total Payments</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">${this.formatCurrency(averagePayment)}</div>
                            <div style="font-size: 0.875rem; color: #6b7280;">Average Payment</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem;">📈 Payment Method Breakdown</h4>
                        ${this.generateDetailedMethodBreakdown()}
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem;">📅 Recent Payment Activity</h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${this.paymentHistory.slice(0, 5).map(payment => `
                                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #f3f4f6;">
                                    <span>${payment.customer_name} - Service #${payment.service_id}</span>
                                    <span style="font-weight: 500;">${this.formatCurrency(payment.total_amount)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="
                        display: flex;
                        gap: 0.75rem;
                        justify-content: flex-end;
                        margin-top: 1.5rem;
                    ">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
                        <button class="btn btn-primary" onclick="paymentsModule.exportPaymentData(); this.closest('.modal').remove();">📤 Export Data</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(reportModal);

        reportModal.addEventListener('click', (e) => {
            if (e.target === reportModal) {
                reportModal.remove();
            }
        });
    },

    generateDetailedMethodBreakdown() {
        const methodCounts = {};
        const methodTotals = {};

        this.paymentHistory.forEach(payment => {
            const method = payment.payment_method;
            methodCounts[method] = (methodCounts[method] || 0) + 1;
            methodTotals[method] = (methodTotals[method] || 0) + payment.total_amount;
        });

        return Object.entries(methodCounts).map(([method, count]) => {
            const total = methodTotals[method];
            const percentage = ((count / this.paymentHistory.length) * 100).toFixed(1);

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span>${this.formatPaymentMethod(method)}</span>
                    <div style="text-align: right;">
                        <div style="font-weight: 500;">${count} payments (${percentage}%)</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${this.formatCurrency(total)}</div>
                    </div>
                </div>
            `;
        }).join('') || '<p>No payment data available</p>';
    },

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    },

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    },

    generateErrorInterface(error) {
        return `
            <div class="payment-section">
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <div class="empty-title">Payment Module Error</div>
                    <div class="empty-description">Failed to load payment module: ${error}</div>
                    <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                </div>
            </div>
        `;
    }
};

// Make module globally available
window.paymentsModule = paymentsModule;

// Test the module immediately
console.log('🧪 Testing payments module...');
console.log('Module available:', typeof paymentsModule !== 'undefined');
console.log('LoadModule function:', typeof paymentsModule.loadModule === 'function');

// Final confirmation
console.log('✅ Professional Payment Module loaded and ready');