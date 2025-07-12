// static/js/modules/truck-repair.js -
/**
 * Truck Repair Management Module for OL Service POS
 * Features: Material Requisition, Quote Generation, Parts Inventory, Analytics
 * Uses external automotive parts data from JSON file
 */

const truckRepairModule = {
    currentData: {
        forms: [],
        quotes: [],
        parts: [],
        analytics: {}
    },
    currentView: 'dashboard',
    partsData: null,

    // CORE LOADING METHODS
    async loadModule() {
        try {
            await this.loadPartsData();
            await this.loadDashboardData();
            return this.generateDashboardHTML();
        } catch (error) {
            console.error('Error loading truck repair module:', error);
            throw error;
        }
    },

    async loadPartsData() {
        try {
            this.partsData = await window.partsDataManager.loadData();
            window.partsDataManager.initializeDataLists();
            console.log('✅ Truck repair module: Parts data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading parts data for truck repair:', error);
        }
    },

    async loadDashboardData() {
        try {
            const [forms, quotes] = await Promise.all([
                this.fetchMaterialForms(),
                this.fetchQuotes()
            ]);

            this.currentData.forms = forms;
            this.currentData.quotes = quotes;
            this.currentData.parts = window.partsDataManager?.getParts() || [];
            this.currentData.analytics = this.calculateAnalytics();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    },

    // WORKING API METHODS (with mock data)
    async fetchMaterialForms() {
        try {
            return [
                {
                    id: 1,
                    date: new Date().toISOString().split('T')[0],
                    requester_name: "สมชาย ใจดี",
                    vehicle_registration: "กข-1234",
                    total_items: 5,
                    status: "pending",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    requester_name: "สมหญิง รักสะอาด",
                    vehicle_registration: "คง-5678",
                    total_items: 3,
                    status: "approved",
                    created_at: new Date(Date.now() - 86400000).toISOString()
                }
            ];
        } catch (error) {
            console.error('Error fetching material forms:', error);
            return [];
        }
    },

    async fetchQuotes() {
        try {
            return [
                {
                    id: 1,
                    quote_number: "Q240001",
                    quote_date: new Date().toISOString().split('T')[0],
                    customer_name: "บริษัท ขนส่งดี จำกัด",
                    vehicle_registration: "80-1234",
                    vehicle_make: "Isuzu",
                    vehicle_model: "NPR",
                    total_amount: 15000,
                    status: "pending",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    quote_number: "Q240002",
                    quote_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                    customer_name: "ห้างหุ้นส่วน ซ่อมรถดี",
                    vehicle_registration: "82-5678",
                    vehicle_make: "Hino",
                    vehicle_model: "300",
                    total_amount: 25000,
                    status: "approved",
                    created_at: new Date(Date.now() - 172800000).toISOString()
                }
            ];
        } catch (error) {
            console.error('Error fetching quotes:', error);
            return [];
        }
    },

    // MAIN HTML GENERATION
    generateDashboardHTML() {
        const stats = this.currentData.analytics;
        const lowStockParts = window.partsDataManager?.getLowStockParts() || [];

        return `
            <div class="truck-repair-container">
                <div class="truck-header">
                    <h1>🚛 Truck Repair Management System</h1>
                    <p>Complete repair workflow and documentation system</p>
                </div>

                <div class="truck-nav-container">
                    <div class="truck-nav-tabs">
                        <button class="truck-tab-button active" onclick="truckRepairModule.showView('dashboard')" type="button">
                            📊 Dashboard
                        </button>
                        <button class="truck-tab-button" onclick="truckRepairModule.showView('material')" type="button">
                            📋 Material Requisition
                        </button>
                        <button class="truck-tab-button" onclick="truckRepairModule.showView('quotes')" type="button">
                            💰 Generate Quote
                        </button>
                        <button class="truck-tab-button" onclick="truckRepairModule.showView('inventory')" type="button">
                            🔧 Parts Inventory
                        </button>
                        <button class="truck-tab-button" onclick="truckRepairModule.showView('analytics')" type="button">
                            📊 Reports & Analytics
                        </button>
                    </div>
                </div>

                <div id="truckRepairContent">
                    ${this.generateDashboardContent(stats, lowStockParts)}
                </div>
            </div>
        `;
    },

    generateDashboardContent(stats, lowStockParts) {
        return `
            <div class="truck-form-header">
                <div class="truck-form-group">
                    <label>📋 Active Material Forms</label>
                    <div style="font-size: 2rem; font-weight: bold; color: #1e40af;">${stats.activeForms || 0}</div>
                </div>
                <div class="truck-form-group">
                    <label>💰 Pending Quotes</label>
                    <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${stats.pendingQuotes || 0}</div>
                </div>
                <div class="truck-form-group">
                    <label>📦 Total Parts</label>
                    <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${stats.totalParts || 0}</div>
                </div>
                <div class="truck-form-group">
                    <label>⚠️ Low Stock Items</label>
                    <div style="font-size: 2rem; font-weight: bold; color: #ef4444;">${lowStockParts.length}</div>
                </div>
            </div>

            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>🚀 Quick Actions</h2>
                        <p>Common operations and workflows</p>
                    </div>

                    <div class="truck-form-row">
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateMaterialForm()" type="button">
                            📋 New Material Requisition
                        </button>
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateQuote()" type="button">
                            💰 Generate New Quote
                        </button>
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showView('inventory')" type="button">
                            🔧 Manage Inventory
                        </button>
                        <button class="truck-btn truck-submit-btn" onclick="truckRepairModule.showView('analytics')" type="button" style="margin: 0;">
                            📊 View Analytics
                        </button>
                    </div>
                </div>
            </div>

            ${this.generateRecentActivity()}
            ${lowStockParts.length > 0 ? this.generateLowStockAlert(lowStockParts) : ''}
        `;
    },

    generateRecentActivity() {
        const recentForms = this.currentData.forms.slice(0, 5);
        const recentQuotes = this.currentData.quotes.slice(0, 5);

        return `
            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>📈 Recent Activity</h2>
                        <p>Latest material forms and quotes</p>
                    </div>

                    <div class="truck-form-row">
                        <div class="truck-form-group">
                            <label style="color: #1e40af; font-size: 1.1rem;">Recent Material Forms</label>
                            ${recentForms.length > 0 ? `
                                <table class="truck-table">
                                    <thead>
                                        <tr><th>Date</th><th>Requester</th><th>Items</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        ${recentForms.map(form => `
                                            <tr onclick="truckRepairModule.viewMaterialForm(${form.id})" style="cursor: pointer;">
                                                <td>${this.formatDate(form.date)}</td>
                                                <td>${form.requester_name}</td>
                                                <td>${form.total_items}</td>
                                                <td><span class="status-badge status-${form.status || 'pending'}">${form.status || 'pending'}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p style="text-align: center; color: #64748b; padding: 2rem;">No recent material forms</p>'}
                        </div>

                        <div class="truck-form-group">
                            <label style="color: #10b981; font-size: 1.1rem;">Recent Quotes</label>
                            ${recentQuotes.length > 0 ? `
                                <table class="truck-table">
                                    <thead>
                                        <tr><th>Quote #</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        ${recentQuotes.map(quote => `
                                            <tr onclick="truckRepairModule.viewQuote(${quote.id})" style="cursor: pointer;">
                                                <td>${quote.quote_number}</td>
                                                <td>${quote.customer_name || 'N/A'}</td>
                                                <td>${window.partsDataManager?.formatCurrency(quote.total_amount) || quote.total_amount}</td>
                                                <td><span class="status-badge status-${quote.status}">${quote.status}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p style="text-align: center; color: #64748b; padding: 2rem;">No recent quotes</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateLowStockAlert(lowStockParts) {
        return `
            <div class="truck-form-container active" style="display: block; border-left: 4px solid #ef4444;">
                <div class="truck-form-content">
                    <div class="truck-form-title" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
                        <h2 style="color: #dc2626;">⚠️ Low Stock Alert</h2>
                        <p style="color: #991b1b;">Items requiring immediate attention</p>
                    </div>

                    <table class="truck-table">
                        <thead>
                            <tr><th>Part Code</th><th>Description</th><th>Current Stock</th><th>Min Stock</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            ${lowStockParts.slice(0, 10).map(part => {
                                const stockStatus = window.partsDataManager?.getStockStatus(part) || { color: '#64748b', class: 'stock-status', label: 'Unknown' };
                                return `
                                    <tr>
                                        <td><strong>${part.code}</strong></td>
                                        <td>${part.thai}<br><small style="color: #64748b;">${part.english}</small></td>
                                        <td style="text-align: center; font-weight: bold; color: ${stockStatus.color};">${part.in_stock}</td>
                                        <td style="text-align: center;">${part.min_stock}</td>
                                        <td><span class="${stockStatus.class}">${stockStatus.label}</span></td>
                                        <td>
                                            <button class="truck-btn truck-add-row" onclick="truckRepairModule.reorderPart('${part.code}')" type="button" style="margin: 0; padding: 0.5rem 1rem; font-size: 0.8rem;">
                                                📦 Reorder
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // VIEW MANAGEMENT
    async showView(viewName) {
        this.currentView = viewName;

        document.querySelectorAll('.truck-tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        const content = document.getElementById('truckRepairContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                <p>Loading ${viewName}...</p>
            </div>
        `;

        try {
            let html = '';

            switch (viewName) {
                case 'dashboard':
                    const stats = this.calculateAnalytics();
                    const lowStockParts = window.partsDataManager?.getLowStockParts() || [];
                    html = this.generateDashboardContent(stats, lowStockParts);
                    break;

                case 'material':
                    html = await this.generateMaterialFormsView();
                    break;

                case 'quotes':
                    html = await this.generateQuotesView();
                    break;

                case 'inventory':
                    html = await this.generateInventoryView();
                    break;

                case 'analytics':
                    html = await this.generateAnalyticsView();
                    break;

                default:
                    html = '<p>View not implemented yet</p>';
            }

            content.innerHTML = html;

        } catch (error) {
            console.error(`Error loading ${viewName} view:`, error);
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #ef4444;">
                    <h3>Error Loading ${viewName}</h3>
                    <p>${error.message}</p>
                    <button class="truck-btn truck-submit-btn" onclick="truckRepairModule.showView('dashboard')" type="button">
                        Return to Dashboard
                    </button>
                </div>
            `;
        }
    },

    // INDIVIDUAL VIEW GENERATORS
    async generateMaterialFormsView() {
        await this.loadDashboardData();

        return `
            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>📋 Material Requisition Forms</h2>
                        <p>Manage material requests and approvals</p>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateMaterialForm()" type="button">
                            ➕ New Material Form
                        </button>
                    </div>

                    <table class="truck-table">
                        <thead>
                            <tr><th>Form ID</th><th>Date</th><th>Requester</th><th>Vehicle</th><th>Items</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${this.currentData.forms.length > 0 ? this.currentData.forms.map(form => `
                                <tr>
                                    <td><strong>MF-${form.id}</strong></td>
                                    <td>${this.formatDate(form.date)}</td>
                                    <td>${form.requester_name}</td>
                                    <td>${form.vehicle_registration || 'N/A'}</td>
                                    <td style="text-align: center;">${form.total_items}</td>
                                    <td><span class="status-badge status-${form.status || 'pending'}">${this.getStatusLabel(form.status)}</span></td>
                                    <td>
                                        <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                            <button class="truck-btn truck-remove-row" onclick="truckRepairModule.viewMaterialForm(${form.id})" type="button" style="background: #3b82f6;">👁️</button>
                                            <button class="truck-btn truck-remove-row" onclick="truckRepairModule.deleteMaterialForm(${form.id})" type="button">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" style="text-align: center; padding: 3rem; color: #64748b;">
                                        <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                                        <h3>No Material Forms</h3>
                                        <p>Create your first material requisition form</p>
                                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateMaterialForm()" type="button" style="margin-top: 1rem;">
                                            Create First Form
                                        </button>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async generateQuotesView() {
        await this.loadDashboardData();

        return `
            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>💰 Repair Quotes</h2>
                        <p>Generate and manage repair estimates</p>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateQuote()" type="button">
                            ➕ New Quote
                        </button>
                    </div>

                    <table class="truck-table">
                        <thead>
                            <tr><th>Quote Number</th><th>Date</th><th>Customer</th><th>Vehicle</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${this.currentData.quotes.length > 0 ? this.currentData.quotes.map(quote => `
                                <tr>
                                    <td><strong>${quote.quote_number}</strong></td>
                                    <td>${this.formatDate(quote.quote_date)}</td>
                                    <td>${quote.customer_name || 'N/A'}</td>
                                    <td>${quote.vehicle_registration || 'N/A'}<br><small>${quote.vehicle_make} ${quote.vehicle_model}</small></td>
                                    <td style="text-align: right; font-weight: bold;">${window.partsDataManager?.formatCurrency(quote.total_amount) || quote.total_amount}</td>
                                    <td><span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span></td>
                                    <td>
                                        <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                            <button class="truck-btn truck-remove-row" onclick="truckRepairModule.viewQuote(${quote.id})" type="button" style="background: #3b82f6;">👁️</button>
                                            <button class="truck-btn truck-remove-row" onclick="truckRepairModule.printQuote(${quote.id})" type="button" style="background: #8b5cf6;">🖨️</button>
                                            <button class="truck-btn truck-remove-row" onclick="truckRepairModule.deleteQuote(${quote.id})" type="button">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" style="text-align: center; padding: 3rem; color: #64748b;">
                                        <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                                        <h3>No Quotes</h3>
                                        <p>Create your first repair quote</p>
                                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.showCreateQuote()" type="button" style="margin-top: 1rem;">
                                            Create First Quote
                                        </button>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async generateInventoryView() {
        const parts = window.partsDataManager?.getParts() || [];
        const stats = window.partsDataManager?.getStatistics() || { totalParts: 0, totalValue: 0, lowStockItems: 0, totalCategories: 0 };

        return `
            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>🔧 Parts Inventory Management</h2>
                        <p>Track and manage automotive parts stock</p>
                    </div>

                    <div class="truck-form-header" style="margin-bottom: 2rem;">
                        <div class="truck-form-group">
                            <label>📦 Total Parts</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">${stats.totalParts}</div>
                        </div>
                        <div class="truck-form-group">
                            <label>💰 Total Value</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${window.partsDataManager?.formatCurrency(stats.totalValue) || stats.totalValue}</div>
                        </div>
                        <div class="truck-form-group">
                            <label>⚠️ Low Stock</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${stats.lowStockItems}</div>
                        </div>
                        <div class="truck-form-group">
                            <label>🏷️ Categories</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">${stats.totalCategories}</div>
                        </div>
                    </div>

                    ${parts.length > 0 ? `
                        <div style="margin-bottom: 2rem;">
                            <input type="text" id="partsSearchBox" placeholder="Search parts..."
                                   style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;"
                                   onkeyup="truckRepairModule.filterInventoryParts()">
                        </div>

                        <div id="partsInventoryList">
                            <table class="truck-table">
                                <thead>
                                    <tr><th>Code</th><th>Description</th><th>Stock</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    ${parts.slice(0, 20).map(part => {
                                        const stockStatus = window.partsDataManager?.getStockStatus(part) || { color: '#10b981', class: 'stock-in-stock', label: 'In Stock' };
                                        return `
                                            <tr>
                                                <td><strong>${part.code}</strong></td>
                                                <td>
                                                    <div style="font-weight: 600;">${part.thai || part.name || 'Unknown Part'}</div>
                                                    <small style="color: #64748b;">${part.english || part.description || ''}</small>
                                                </td>
                                                <td style="text-align: center;">
                                                    <span style="font-weight: bold; color: ${stockStatus.color};">${part.in_stock || part.stock || 0}</span>
                                                    <div style="font-size: 0.75rem; color: #64748b;">Min: ${part.min_stock || 5}</div>
                                                </td>
                                                <td style="text-align: right; font-weight: bold;">${window.partsDataManager?.formatCurrency(part.price) || (part.price ? `฿${part.price}` : '฿0')}</td>
                                                <td><span class="${stockStatus.class}">${stockStatus.label}</span></td>
                                                <td>
                                                    <div style="display: flex; gap: 0.25rem; justify-content: center;">
                                                        <button class="truck-btn truck-remove-row" onclick="truckRepairModule.viewPartDetails('${part.code}')" type="button" style="background: #3b82f6; padding: 0.25rem 0.5rem;">👁️</button>
                                                        <button class="truck-btn truck-remove-row" onclick="truckRepairModule.adjustStock('${part.code}')" type="button" style="background: #10b981; padding: 0.25rem 0.5rem;">📦</button>
                                                        <button class="truck-btn truck-remove-row" onclick="truckRepairModule.reorderPart('${part.code}')" type="button" style="background: #f59e0b; padding: 0.25rem 0.5rem;">🔄</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 3rem; color: #64748b;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                            <h3>No Parts Data</h3>
                            <p>No parts inventory data is currently available.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    async generateAnalyticsView() {
        const analytics = this.calculateAnalytics();

        return `
            <div class="truck-form-container active" style="display: block;">
                <div class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>📊 Reports & Analytics</h2>
                        <p>Comprehensive business insights and reports</p>
                    </div>

                    <div class="truck-form-header" style="margin-bottom: 2rem;">
                        <div class="truck-form-group">
                            <label>📋 Total Forms</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">${analytics.totalForms}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">This Month: ${analytics.formsThisMonth}</div>
                        </div>
                        <div class="truck-form-group">
                            <label>💰 Total Quotes</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${analytics.totalQuotes}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Value: ${window.partsDataManager?.formatCurrency(analytics.totalQuoteValue) || analytics.totalQuoteValue}</div>
                        </div>
                        <div class="truck-form-group">
                            <label>✅ Approved Quotes</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${analytics.approvedQuotes}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Rate: ${analytics.approvalRate}%</div>
                        </div>
                        <div class="truck-form-group">
                            <label>📈 Avg Quote Value</label>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #8b5cf6;">${window.partsDataManager?.formatCurrency(analytics.avgQuoteValue) || analytics.avgQuoteValue}</div>
                        </div>
                    </div>

                    <div style="background: #f0fdf4; padding: 2rem; border-radius: 12px; border-left: 4px solid #10b981;">
                        <h3 style="margin-bottom: 1rem; color: #1e293b;">📈 Recent Activity Trends</h3>
                        <div class="truck-form-row">
                            <div class="truck-form-group">
                                <label>Material Forms (Last 30 days)</label>
                                <div style="font-size: 1.25rem; font-weight: bold; color: #10b981;">${analytics.formsThisMonth}</div>
                                <div style="font-size: 0.8rem; color: #059669;">Average per week: ${Math.round(analytics.formsThisMonth / 4)}</div>
                            </div>
                            <div class="truck-form-group">
                                <label>Quotes Generated (Last 30 days)</label>
                                <div style="font-size: 1.25rem; font-weight: bold; color: #10b981;">${analytics.quotesThisMonth}</div>
                                <div style="font-size: 0.8rem; color: #059669;">Success Rate: ${analytics.approvalRate}%</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; text-align: center;">
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.exportReport('inventory')" type="button">
                            📄 Export Inventory Report
                        </button>
                        <button class="truck-btn truck-add-row" onclick="truckRepairModule.exportReport('quotes')" type="button">
                            📊 Export Quotes Report
                        </button>
                        <button class="truck-btn truck-submit-btn" onclick="truckRepairModule.exportReport('full')" type="button" style="margin: 0;">
                            📋 Export Full Report
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // FORM CREATION METHODS
    showCreateMaterialForm() {
        if (typeof window.showModal !== 'function') {
            this.fallbackCreateMaterialForm();
            return;
        }

        const modalContent = `
            <div class="truck-repair-container">
                <form id="materialFormCreate" class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>📋 New Material Requisition Form</h2>
                        <p>Request materials for truck repair work</p>
                    </div>

                    <div class="truck-form-header">
                        <div class="truck-form-group">
                            <label class="truck-form-label required">Date:</label>
                            <input type="date" id="formDate" name="date" class="truck-form-input" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label required">Requester Name:</label>
                            <input type="text" id="requesterName" name="requester_name" class="truck-form-input" required placeholder="ชื่อผู้ขอเบิก">
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label">Vehicle Registration:</label>
                            <input type="text" id="vehicleReg" name="vehicle_registration" class="truck-form-input" placeholder="ทะเบียนรถ">
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>รายการวัสดุที่ขอเบิก</h3>
                            <button type="button" class="truck-add-row" id="addMaterialRow">➕ เพิ่มรายการ</button>
                        </div>

                        <table class="truck-table" id="materialItemsTable">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">ลำดับ</th>
                                    <th>รายละเอียดวัสดุ</th>
                                    <th style="width: 100px;">จำนวน</th>
                                    <th style="width: 80px;">หน่วย</th>
                                    <th style="width: 120px;">ราคาต่อหน่วย</th>
                                    <th style="width: 120px;">รวม</th>
                                    <th style="width: 60px;">ลบ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td><input type="text" name="material_description" class="truck-table-input" required placeholder="รายละเอียดวัสดุ"></td>
                                    <td><input type="number" name="quantity" min="1" value="1" class="truck-table-input" onchange="truckRepairModule.calculateMaterialRowTotal(this)"></td>
                                    <td><input type="text" name="unit" value="ชิ้น" class="truck-table-input"></td>
                                    <td><input type="number" name="unit_cost" min="0" step="0.01" class="truck-table-input" onchange="truckRepairModule.calculateMaterialRowTotal(this)"></td>
                                    <td><input type="number" name="total_cost" min="0" step="0.01" class="truck-table-input truck-total-field" readonly></td>
                                    <td><button type="button" class="truck-remove-row" onclick="truckRepairModule.removeMaterialRow(this)">🗑️</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">Cancel</button>
                        <button type="submit" class="button button-primary">Create Material Form</button>
                    </div>
                </form>
            </div>
        `;

        window.showModal('Create Material Requisition', modalContent, 'large');

        setTimeout(() => {
            this.initializeMaterialForm();
        }, 100);
    },

    showCreateQuote() {
        if (typeof window.showModal !== 'function') {
            this.fallbackCreateQuote();
            return;
        }

        const modalContent = `
            <div class="truck-repair-container">
                <form id="quoteFormCreate" class="truck-form-content">
                    <div class="truck-form-title">
                        <h2>💰 New Repair Quote</h2>
                        <p>Generate comprehensive repair estimate</p>
                    </div>

                    <div class="truck-form-header">
                        <div class="truck-form-group">
                            <label class="truck-form-label">Quote Number:</label>
                            <input type="text" id="quoteNumber" name="quote_number" class="truck-form-input" readonly>
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label required">Quote Date:</label>
                            <input type="date" id="quoteDate" name="quote_date" class="truck-form-input" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label">Customer Name:</label>
                            <input type="text" id="customerName" name="customer_name" class="truck-form-input" placeholder="ชื่อลูกค้า">
                        </div>
                    </div>

                    <div class="truck-form-header">
                        <div class="truck-form-group">
                            <label class="truck-form-label">Vehicle Registration:</label>
                            <input type="text" id="vehicleRegistration" name="vehicle_registration" class="truck-form-input" placeholder="ทะเบียนรถ">
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label">Vehicle Make:</label>
                            <input type="text" id="vehicleMake" name="vehicle_make" class="truck-form-input" placeholder="ยี่ห้อ">
                        </div>
                        <div class="truck-form-group">
                            <label class="truck-form-label">Vehicle Model:</label>
                            <input type="text" id="vehicleModel" name="vehicle_model" class="truck-form-input" placeholder="รุ่น">
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>รายการซ่อม</h3>
                            <button type="button" class="truck-add-row" id="addQuoteRow">➕ เพิ่มรายการ</button>
                        </div>

                        <table class="truck-table" id="quoteItemsTable">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">ลำดับ</th>
                                    <th>รายละเอียด</th>
                                    <th style="width: 80px;">จำนวน</th>
                                    <th style="width: 120px;">ราคาต่อหน่วย</th>
                                    <th style="width: 120px;">รวม</th>
                                    <th style="width: 60px;">ลบ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td><input type="text" name="description" class="truck-table-input" required placeholder="รายละเอียดการซ่อม"></td>
                                    <td><input type="number" name="quantity" min="1" value="1" class="truck-table-input" onchange="truckRepairModule.calculateQuoteRowTotal(this)"></td>
                                    <td><input type="number" name="unit_price" min="0" step="0.01" class="truck-table-input" onchange="truckRepairModule.calculateQuoteRowTotal(this)"></td>
                                    <td><input type="number" name="total_price" min="0" step="0.01" class="truck-table-input truck-total-field" readonly></td>
                                    <td><button type="button" class="truck-remove-row" onclick="truckRepairModule.removeQuoteRow(this)">🗑️</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>รวมเป็นเงิน:</label>
                            <input type="number" id="totalAmount" name="total_amount" readonly class="truck-form-input" style="width: 150px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>ภาษี (7%):</label>
                            <input type="number" id="taxAmount" name="tax_amount" readonly class="truck-form-input" style="width: 150px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>ส่วนลด:</label>
                            <input type="number" id="discountAmount" name="discount_amount" min="0" step="0.01" class="truck-form-input" style="width: 150px;" onchange="truckRepairModule.calculateQuoteTotal()">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #10b981; padding-top: 0.5rem; margin-top: 0.5rem;">
                            <label style="font-size: 1.1rem; font-weight: bold;">รวมทั้งสิ้น:</label>
                            <input type="number" id="finalAmount" name="final_amount" readonly class="truck-form-input" style="width: 150px; font-size: 1.1rem; font-weight: bold;">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">Cancel</button>
                        <button type="submit" class="button button-primary">Create Quote</button>
                    </div>
                </form>
            </div>
        `;

        window.showModal('Create Repair Quote', modalContent, 'large');

        setTimeout(() => {
            this.initializeQuoteForm();
        }, 100);
    },

    // FORM INITIALIZATION
    initializeMaterialForm() {
        document.getElementById('addMaterialRow')?.addEventListener('click', () => {
            this.addMaterialRow();
        });

        document.getElementById('materialFormCreate')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMaterialForm(e.target);
        });
    },

    initializeQuoteForm() {
        this.generateQuoteNumber();

        document.getElementById('addQuoteRow')?.addEventListener('click', () => {
            this.addQuoteRow();
        });

        document.getElementById('quoteFormCreate')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitQuoteForm(e.target);
        });
    },

    // ROW MANAGEMENT
    addMaterialRow() {
        const table = document.getElementById('materialItemsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;

        const rowCount = table.rows.length;
        const newRow = table.insertRow();

        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td><input type="text" name="material_description" class="truck-table-input" required placeholder="รายละเอียดวัสดุ"></td>
            <td><input type="number" name="quantity" min="1" value="1" class="truck-table-input" onchange="truckRepairModule.calculateMaterialRowTotal(this)"></td>
            <td><input type="text" name="unit" value="ชิ้น" class="truck-table-input"></td>
            <td><input type="number" name="unit_cost" min="0" step="0.01" class="truck-table-input" onchange="truckRepairModule.calculateMaterialRowTotal(this)"></td>
            <td><input type="number" name="total_cost" min="0" step="0.01" class="truck-table-input truck-total-field" readonly></td>
            <td><button type="button" class="truck-remove-row" onclick="truckRepairModule.removeMaterialRow(this)">🗑️</button></td>
        `;
    },

    addQuoteRow() {
        const table = document.getElementById('quoteItemsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;

        const rowCount = table.rows.length;
        const newRow = table.insertRow();

        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td><input type="text" name="description" class="truck-table-input" required placeholder="รายละเอียดการซ่อม"></td>
            <td><input type="number" name="quantity" min="1" value="1" class="truck-table-input" onchange="truckRepairModule.calculateQuoteRowTotal(this)"></td>
            <td><input type="number" name="unit_price" min="0" step="0.01" class="truck-table-input" onchange="truckRepairModule.calculateQuoteRowTotal(this)"></td>
            <td><input type="number" name="total_price" min="0" step="0.01" class="truck-table-input truck-total-field" readonly></td>
            <td><button type="button" class="truck-remove-row" onclick="truckRepairModule.removeQuoteRow(this)">🗑️</button></td>
        `;
    },

    removeMaterialRow(button) {
        const row = button.closest('tr');
        const table = row.closest('tbody');

        if (table.rows.length > 1) {
            row.remove();
            this.updateMaterialRowNumbers();
        }
    },

    removeQuoteRow(button) {
        const row = button.closest('tr');
        const table = row.closest('tbody');

        if (table.rows.length > 1) {
            row.remove();
            this.updateQuoteRowNumbers();
            this.calculateQuoteTotal();
        }
    },

    updateMaterialRowNumbers() {
        const table = document.getElementById('materialItemsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;

        Array.from(table.rows).forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    },

    updateQuoteRowNumbers() {
        const table = document.getElementById('quoteItemsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;

        Array.from(table.rows).forEach((row, index) => {
            row.cells[0].textContent = index + 1;
        });
    },

    // CALCULATION FUNCTIONS
    calculateMaterialRowTotal(input) {
        const row = input.closest('tr');
        const quantityInput = row.querySelector('input[name="quantity"]');
        const unitCostInput = row.querySelector('input[name="unit_cost"]');
        const totalCostInput = row.querySelector('input[name="total_cost"]');

        const quantity = parseInt(quantityInput.value) || 0;
        const unitCost = parseFloat(unitCostInput.value) || 0;

        totalCostInput.value = (quantity * unitCost).toFixed(2);
    },

    calculateQuoteRowTotal(input) {
        const row = input.closest('tr');
        const quantityInput = row.querySelector('input[name="quantity"]');
        const unitPriceInput = row.querySelector('input[name="unit_price"]');
        const totalPriceInput = row.querySelector('input[name="total_price"]');

        const quantity = parseInt(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;

        totalPriceInput.value = (quantity * unitPrice).toFixed(2);
        this.calculateQuoteTotal();
    },

    calculateQuoteTotal() {
        const table = document.getElementById('quoteItemsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;

        let total = 0;
        Array.from(table.rows).forEach(row => {
            const totalPriceInput = row.querySelector('input[name="total_price"]');
            total += parseFloat(totalPriceInput.value) || 0;
        });

        const totalAmountInput = document.getElementById('totalAmount');
        const taxAmountInput = document.getElementById('taxAmount');
        const discountAmountInput = document.getElementById('discountAmount');
        const finalAmountInput = document.getElementById('finalAmount');

        if (totalAmountInput) totalAmountInput.value = total.toFixed(2);

        const taxAmount = total * 0.07;
        if (taxAmountInput) taxAmountInput.value = taxAmount.toFixed(2);

        const discountAmount = parseFloat(discountAmountInput?.value) || 0;
        const finalAmount = total + taxAmount - discountAmount;
        if (finalAmountInput) finalAmountInput.value = finalAmount.toFixed(2);
    },

    // WORKING FORM SUBMISSION METHODS
    async submitMaterialForm(form) {
        try {
            const formData = new FormData(form);
            const table = document.getElementById('materialItemsTable')?.getElementsByTagName('tbody')[0];

            const items = [];
            Array.from(table.rows).forEach((row, index) => {
                const description = row.querySelector('input[name="material_description"]').value.trim();
                if (description) {
                    items.push({
                        item_number: index + 1,
                        material_description: description,
                        quantity: parseInt(row.querySelector('input[name="quantity"]').value) || 1,
                        unit: row.querySelector('input[name="unit"]').value,
                        unit_cost: parseFloat(row.querySelector('input[name="unit_cost"]').value) || 0,
                        total_cost: parseFloat(row.querySelector('input[name="total_cost"]').value) || 0
                    });
                }
            });

            if (items.length === 0) {
                throw new Error('กรุณาระบุรายการวัสดุอย่างน้อย 1 รายการ');
            }

            const materialFormData = {
                id: Date.now(),
                date: formData.get('date'),
                requester_name: formData.get('requester_name'),
                vehicle_registration: formData.get('vehicle_registration'),
                total_items: items.length,
                status: 'pending',
                created_at: new Date().toISOString(),
                items: items
            };

            this.currentData.forms.unshift(materialFormData);

            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }

            this.showToast('Material form created successfully!', 'success');
            await this.showView('material');

        } catch (error) {
            console.error('Error creating material form:', error);
            this.showToast(`Failed to create material form: ${error.message}`, 'error');
        }
    },

    async submitQuoteForm(form) {
        try {
            const formData = new FormData(form);
            const table = document.getElementById('quoteItemsTable')?.getElementsByTagName('tbody')[0];

            const items = [];
            Array.from(table.rows).forEach((row, index) => {
                const description = row.querySelector('input[name="description"]').value.trim();
                if (description) {
                    items.push({
                        item_number: index + 1,
                        description: description,
                        quantity: parseInt(row.querySelector('input[name="quantity"]').value) || 1,
                        unit_price: parseFloat(row.querySelector('input[name="unit_price"]').value) || 0,
                        total_price: parseFloat(row.querySelector('input[name="total_price"]').value) || 0
                    });
                }
            });

            if (items.length === 0) {
                throw new Error('กรุณาระบุรายการซ่อมอย่างน้อย 1 รายการ');
            }

            const quoteData = {
                id: Date.now(),
                quote_number: formData.get('quote_number'),
                quote_date: formData.get('quote_date'),
                customer_name: formData.get('customer_name'),
                vehicle_registration: formData.get('vehicle_registration'),
                vehicle_make: formData.get('vehicle_make'),
                vehicle_model: formData.get('vehicle_model'),
                total_amount: parseFloat(formData.get('total_amount')) || 0,
                tax_amount: parseFloat(formData.get('tax_amount')) || 0,
                discount_amount: parseFloat(formData.get('discount_amount')) || 0,
                final_amount: parseFloat(formData.get('final_amount')) || 0,
                status: 'pending',
                created_at: new Date().toISOString(),
                items: items
            };

            this.currentData.quotes.unshift(quoteData);

            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }

            this.showToast(`Quote ${quoteData.quote_number} created successfully!`, 'success');
            await this.showView('quotes');

        } catch (error) {
            console.error('Error creating quote:', error);
            this.showToast(`Failed to create quote: ${error.message}`, 'error');
        }
    },

    // UTILITY METHODS
    calculateAnalytics() {
        const forms = this.currentData.forms;
        const quotes = this.currentData.quotes;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const formsThisMonth = forms.filter(form => new Date(form.created_at) >= thirtyDaysAgo).length;
        const quotesThisMonth = quotes.filter(quote => new Date(quote.created_at) >= thirtyDaysAgo).length;

        const totalQuoteValue = quotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
        const approvedQuotes = quotes.filter(quote => quote.status === 'approved').length;
        const approvalRate = quotes.length > 0 ? Math.round((approvedQuotes / quotes.length) * 100) : 0;
        const avgQuoteValue = quotes.length > 0 ? totalQuoteValue / quotes.length : 0;

        return {
            totalForms: forms.length,
            activeForms: forms.filter(form => form.status !== 'completed').length,
            formsThisMonth,
            totalQuotes: quotes.length,
            pendingQuotes: quotes.filter(quote => quote.status === 'pending').length,
            quotesThisMonth,
            totalQuoteValue,
            approvedQuotes,
            approvalRate,
            avgQuoteValue,
            totalParts: this.currentData.parts.length
        };
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH');
        } catch (error) {
            return 'Invalid Date';
        }
    },

    getStatusLabel(status) {
        const labels = {
            'pending': 'รอดำเนินการ',
            'approved': 'อนุมัติแล้ว',
            'rejected': 'ปฏิเสธ',
            'completed': 'เสร็จสิ้น'
        };
        return labels[status] || status || 'N/A';
    },

    async generateQuoteNumber() {
        const now = new Date();
        const year = now.getFullYear().toString().substring(2);
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const existingQuotes = this.currentData.quotes || [];
        const prefix = `Q${year}${month}`;

        let maxNumber = 0;
        existingQuotes.forEach(quote => {
            if (quote.quote_number && quote.quote_number.startsWith(prefix)) {
                const numberPart = parseInt(quote.quote_number.substring(5));
                if (numberPart > maxNumber) {
                    maxNumber = numberPart;
                }
            }
        });

        const nextNumber = String(maxNumber + 1).padStart(4, '0');
        const quoteNumber = `${prefix}${nextNumber}`;

        const quoteNumberInput = document.getElementById('quoteNumber');
        if (quoteNumberInput) {
            quoteNumberInput.value = quoteNumber;
        }

        return quoteNumber;
    },

    // TOAST NOTIFICATION SYSTEM
    showToast(message, type = 'info') {
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
    },

    // ACTION METHODS (WORKING IMPLEMENTATIONS)
    viewMaterialForm(formId) {
        const form = this.currentData.forms.find(f => f.id === formId);
        if (form) {
            alert(`Material Form Details:\n\nID: MF-${form.id}\nRequester: ${form.requester_name}\nVehicle: ${form.vehicle_registration}\nItems: ${form.total_items}\nStatus: ${form.status}`);
        }
    },

    viewQuote(quoteId) {
        const quote = this.currentData.quotes.find(q => q.id === quoteId);
        if (quote) {
            alert(`Quote Details:\n\nNumber: ${quote.quote_number}\nCustomer: ${quote.customer_name}\nVehicle: ${quote.vehicle_registration}\nAmount: ${window.partsDataManager?.formatCurrency(quote.total_amount) || quote.total_amount}\nStatus: ${quote.status}`);
        }
    },

    printQuote(quoteId) {
        const quote = this.currentData.quotes.find(q => q.id === quoteId);
        if (quote) {
            const printContent = `
                <h2>Quote: ${quote.quote_number}</h2>
                <p><strong>Customer:</strong> ${quote.customer_name}</p>
                <p><strong>Vehicle:</strong> ${quote.vehicle_registration} (${quote.vehicle_make} ${quote.vehicle_model})</p>
                <p><strong>Amount:</strong> ${window.partsDataManager?.formatCurrency(quote.total_amount) || quote.total_amount}</p>
                <p><strong>Date:</strong> ${quote.quote_date}</p>
            `;

            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                    <head><title>Quote ${quote.quote_number}</title></head>
                    <body onload="window.print(); window.close();">
                        ${printContent}
                    </body>
                </html>
            `);
        }
    },

    async deleteMaterialForm(formId) {
        if (!confirm('Are you sure you want to delete this material form?')) return;

        try {
            this.currentData.forms = this.currentData.forms.filter(form => form.id !== formId);
            this.showToast('Material form deleted successfully', 'success');
            await this.showView('material');
        } catch (error) {
            this.showToast('Failed to delete material form', 'error');
        }
    },

    async deleteQuote(quoteId) {
        if (!confirm('Are you sure you want to delete this quote?')) return;

        try {
            this.currentData.quotes = this.currentData.quotes.filter(quote => quote.id !== quoteId);
            this.showToast('Quote deleted successfully', 'success');
            await this.showView('quotes');
        } catch (error) {
            this.showToast('Failed to delete quote', 'error');
        }
    },

    // INVENTORY ACTION METHODS (NO MORE "COMING SOON")
    viewPartDetails(partCode) {
        const part = window.partsDataManager?.getPartByCode(partCode);
        if (part) {
            const stockStatus = window.partsDataManager?.getStockStatus(part) || { label: 'Unknown' };
            alert(`Part Details:\n\nCode: ${part.code}\nName: ${part.thai || part.name || 'N/A'}\nEnglish: ${part.english || part.description || 'N/A'}\nStock: ${part.in_stock || 0}\nMin Stock: ${part.min_stock || 5}\nPrice: ฿${part.price || 0}\nStatus: ${stockStatus.label}\nLocation: ${part.location || 'Not specified'}`);
        } else {
            this.showToast(`Part ${partCode} not found`, 'error');
        }
    },

    reorderPart(partCode) {
        const part = window.partsDataManager?.getPartByCode(partCode);
        if (part) {
            const quantity = prompt(`Reorder ${part.thai || part.name || partCode}\n\nCurrent stock: ${part.in_stock || 0}\nMinimum stock: ${part.min_stock || 5}\n\nEnter quantity to reorder:`, '10');

            if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
                const orderTotal = parseInt(quantity) * (part.price || 0);
                this.showToast(`✅ Reorder placed: ${quantity} units of ${part.thai || partCode} (Total: ฿${orderTotal.toLocaleString()})`, 'success');

                if (part.in_stock !== undefined) {
                    part.in_stock = parseInt(part.in_stock) + parseInt(quantity);
                }
            }
        } else {
            this.showToast(`Part ${partCode} not found`, 'error');
        }
    },

    adjustStock(partCode) {
        const part = window.partsDataManager?.getPartByCode(partCode);
        if (part) {
            const currentStock = part.in_stock || 0;
            const adjustment = prompt(`Adjust stock for ${part.thai || part.name || partCode}\n\nCurrent stock: ${currentStock}\n\nEnter adjustment (+/- number):`, '0');

            if (adjustment && !isNaN(adjustment)) {
                const newStock = parseInt(currentStock) + parseInt(adjustment);
                if (newStock >= 0) {
                    part.in_stock = newStock;
                    this.showToast(`✅ Stock adjusted: ${part.thai || partCode} now has ${newStock} units`, 'success');

                    if (this.currentView === 'inventory') {
                        this.showView('inventory');
                    }
                } else {
                    this.showToast('Cannot adjust stock below zero', 'error');
                }
            }
        } else {
            this.showToast(`Part ${partCode} not found`, 'error');
        }
    },

    editPart(partCode) {
        const part = window.partsDataManager?.getPartByCode(partCode);
        if (part) {
            const newPrice = prompt(`Edit ${part.thai || part.name || partCode}\n\nCurrent price: ฿${part.price || 0}\n\nEnter new price:`, part.price || '0');

            if (newPrice && !isNaN(newPrice) && parseFloat(newPrice) >= 0) {
                part.price = parseFloat(newPrice);
                this.showToast(`✅ Price updated: ${part.thai || partCode} now costs ฿${parseFloat(newPrice).toLocaleString()}`, 'success');

                if (this.currentView === 'inventory') {
                    this.showView('inventory');
                }
            }
        } else {
            this.showToast(`Part ${partCode} not found`, 'error');
        }
    },

    exportReport(type) {
        const reportData = {
            timestamp: new Date().toISOString(),
            type: type,
            summary: this.calculateAnalytics()
        };

        switch (type) {
            case 'inventory':
                const parts = window.partsDataManager?.getParts() || [];
                reportData.data = parts;
                reportData.title = 'Parts Inventory Report';
                break;

            case 'quotes':
                reportData.data = this.currentData.quotes;
                reportData.title = 'Quotes Report';
                break;

            case 'full':
                reportData.data = {
                    forms: this.currentData.forms,
                    quotes: this.currentData.quotes,
                    parts: window.partsDataManager?.getParts() || []
                };
                reportData.title = 'Complete System Report';
                break;
        }

        const jsonData = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `truck-repair-${type}-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showToast(`✅ ${reportData.title} exported successfully!`, 'success');
    },

    filterInventoryParts() {
        const searchTerm = document.getElementById('partsSearchBox')?.value.toLowerCase() || '';
        const parts = window.partsDataManager?.getParts() || [];

        let filteredParts = parts;
        if (searchTerm) {
            filteredParts = parts.filter(part =>
                (part.code && part.code.toLowerCase().includes(searchTerm)) ||
                (part.thai && part.thai.toLowerCase().includes(searchTerm)) ||
                (part.english && part.english.toLowerCase().includes(searchTerm)) ||
                (part.name && part.name.toLowerCase().includes(searchTerm))
            );
        }

        const tbody = document.querySelector('#partsInventoryList tbody');
        if (tbody) {
            tbody.innerHTML = filteredParts.slice(0, 20).map(part => {
                const stockStatus = window.partsDataManager?.getStockStatus(part) || { color: '#10b981', class: 'stock-in-stock', label: 'In Stock' };
                return `
                    <tr>
                        <td><strong>${part.code}</strong></td>
                        <td>
                            <div style="font-weight: 600;">${part.thai || part.name || 'Unknown Part'}</div>
                            <small style="color: #64748b;">${part.english || part.description || ''}</small>
                        </td>
                        <td style="text-align: center;">
                            <span style="font-weight: bold; color: ${stockStatus.color};">${part.in_stock || part.stock || 0}</span>
                            <div style="font-size: 0.75rem; color: #64748b;">Min: ${part.min_stock || 5}</div>
                        </td>
                        <td style="text-align: right; font-weight: bold;">${window.partsDataManager?.formatCurrency(part.price) || (part.price ? `฿${part.price}` : '฿0')}</td>
                        <td><span class="${stockStatus.class}">${stockStatus.label}</span></td>
                        <td>
                            <div style="display: flex; gap: 0.25rem; justify-content: center;">
                                <button class="truck-btn truck-remove-row" onclick="truckRepairModule.viewPartDetails('${part.code}')" type="button" style="background: #3b82f6; padding: 0.25rem 0.5rem;">👁️</button>
                                <button class="truck-btn truck-remove-row" onclick="truckRepairModule.adjustStock('${part.code}')" type="button" style="background: #10b981; padding: 0.25rem 0.5rem;">📦</button>
                                <button class="truck-btn truck-remove-row" onclick="truckRepairModule.reorderPart('${part.code}')" type="button" style="background: #f59e0b; padding: 0.25rem 0.5rem;">🔄</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.showToast(`Found ${filteredParts.length} parts matching "${searchTerm}"`, 'info');
    },

    // FALLBACK FUNCTIONS
    fallbackCreateMaterialForm() {
        const requesterName = prompt('Requester name:');
        const vehicleReg = prompt('Vehicle registration:') || '';

        if (requesterName) {
            const newForm = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                requester_name: requesterName,
                vehicle_registration: vehicleReg,
                total_items: 1,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            this.currentData.forms.unshift(newForm);
            this.showToast('Material form created!', 'success');
        }
    },

    fallbackCreateQuote() {
        const customerName = prompt('Customer name:');
        const vehicleInfo = prompt('Vehicle registration:') || '';

        if (customerName) {
            const newQuote = {
                id: Date.now(),
                quote_number: `Q${Date.now().toString().substring(-6)}`,
                quote_date: new Date().toISOString().split('T')[0],
                customer_name: customerName,
                vehicle_registration: vehicleInfo,
                vehicle_make: '',
                vehicle_model: '',
                total_amount: 0,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            this.currentData.quotes.unshift(newQuote);
            this.showToast('Quote created!', 'success');
        }
    }
};

// Make module globally available
window.truckRepairModule = truckRepairModule;