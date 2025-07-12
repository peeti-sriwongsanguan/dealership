// static/js/data/parts-data-manager.js
/**
 * Automotive Parts Data Manager
 * Handles loading and managing automotive parts data from JSON file
 */

class PartsDataManager {
    constructor() {
        this.partsData = null;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Load automotive parts data from JSON file
     * @returns {Promise<Object>} Parts data object
     */
    async loadData() {
        if (this.isLoaded && this.partsData) {
            return this.partsData;
        }

        // If already loading, return the existing promise
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._fetchPartsData();
        return this.loadPromise;
    }

    async _fetchPartsData() {
        try {
            const response = await fetch('/static/data/automotive-parts.json');
            if (!response.ok) {
                throw new Error(`Failed to load parts data: ${response.status}`);
            }

            this.partsData = await response.json();
            this.isLoaded = true;

            console.log('✅ Automotive parts data loaded successfully');
            console.log(`📦 Loaded ${this.partsData.automotive_parts.length} parts`);
            console.log(`🏷️ ${this.partsData.categories.length} categories`);
            console.log(`🏭 ${this.partsData.suppliers.length} suppliers`);

            return this.partsData;
        } catch (error) {
            console.error('❌ Error loading automotive parts data:', error);

            // Return fallback data if JSON fails to load
            return this._getFallbackData();
        }
    }

    /**
     * Get all automotive parts
     * @returns {Array} Array of parts
     */
    getParts() {
        return this.partsData?.automotive_parts || [];
    }

    /**
     * Get parts by category
     * @param {string} categoryId - Category ID
     * @returns {Array} Filtered parts array
     */
    getPartsByCategory(categoryId) {
        return this.getParts().filter(part => part.category === categoryId);
    }

    /**
     * Get part by code
     * @param {string} partCode - Part code
     * @returns {Object|null} Part object or null
     */
    getPartByCode(partCode) {
        return this.getParts().find(part => part.code === partCode) || null;
    }

    /**
     * Search parts by text (Thai, English, or code)
     * @param {string} searchText - Search term
     * @returns {Array} Matching parts
     */
    searchParts(searchText) {
        if (!searchText || searchText.trim() === '') {
            return this.getParts();
        }

        const search = searchText.toLowerCase().trim();
        return this.getParts().filter(part =>
            part.thai.toLowerCase().includes(search) ||
            part.english.toLowerCase().includes(search) ||
            part.code.toLowerCase().includes(search)
        );
    }

    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    getCategories() {
        return this.partsData?.categories || [];
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category object or null
     */
    getCategoryById(categoryId) {
        return this.getCategories().find(cat => cat.id === categoryId) || null;
    }

    /**
     * Get all suppliers
     * @returns {Array} Array of suppliers
     */
    getSuppliers() {
        return this.partsData?.suppliers || [];
    }

    /**
     * Get supplier by ID
     * @param {string} supplierId - Supplier ID
     * @returns {Object|null} Supplier object or null
     */
    getSupplierById(supplierId) {
        return this.getSuppliers().find(sup => sup.id === supplierId) || null;
    }

    /**
     * Get warehouse locations
     * @returns {Array} Array of warehouse locations
     */
    getWarehouseLocations() {
        return this.partsData?.warehouse_locations || [];
    }

    /**
     * Get parts with low stock
     * @returns {Array} Parts below minimum stock level
     */
    getLowStockParts() {
        return this.getParts().filter(part => part.in_stock <= part.min_stock);
    }

    /**
     * Get parts statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const parts = this.getParts();
        const categories = this.getCategories();

        const stats = {
            totalParts: parts.length,
            totalCategories: categories.length,
            totalSuppliers: this.getSuppliers().length,
            lowStockItems: this.getLowStockParts().length,
            totalValue: parts.reduce((sum, part) => sum + (part.price * part.in_stock), 0),
            categoryBreakdown: {}
        };

        // Calculate category breakdown
        categories.forEach(category => {
            const categoryParts = this.getPartsByCategory(category.id);
            stats.categoryBreakdown[category.id] = {
                name_thai: category.name_thai,
                name_english: category.name_english,
                count: categoryParts.length,
                value: categoryParts.reduce((sum, part) => sum + (part.price * part.in_stock), 0)
            };
        });

        return stats;
    }

    /**
     * Create datalist options for HTML autocomplete
     * @param {string} type - 'parts', 'codes', or 'both'
     * @returns {string} HTML datalist options
     */
    createDatalistOptions(type = 'both') {
        const parts = this.getParts();
        let options = '';

        if (type === 'parts' || type === 'both') {
            parts.forEach(part => {
                options += `<option value="${part.thai}" data-code="${part.code}" data-price="${part.price}"></option>`;
            });
        }

        if (type === 'codes' || type === 'both') {
            parts.forEach(part => {
                options += `<option value="${part.code}" data-thai="${part.thai}" data-price="${part.price}"></option>`;
            });
        }

        return options;
    }

    /**
     * Initialize datalists in the DOM
     */
    initializeDataLists() {
        // Create parts datalist
        let partsDatalist = document.getElementById('parts-list');
        if (!partsDatalist) {
            partsDatalist = document.createElement('datalist');
            partsDatalist.id = 'parts-list';
            document.body.appendChild(partsDatalist);
        }
        partsDatalist.innerHTML = this.createDatalistOptions('parts');

        // Create codes datalist
        let codesDatalist = document.getElementById('parts-codes');
        if (!codesDatalist) {
            codesDatalist = document.createElement('datalist');
            codesDatalist.id = 'parts-codes';
            document.body.appendChild(codesDatalist);
        }
        codesDatalist.innerHTML = this.createDatalistOptions('codes');

        console.log('✅ Datalists initialized successfully');
    }

    /**
     * Get fallback data if JSON loading fails
     * @returns {Object} Minimal fallback data
     */
    _getFallbackData() {
        console.warn('🔄 Using fallback automotive parts data');
        return {
            automotive_parts: [
                { thai: "ขากระจก", english: "Mirror Bracket", code: "MIR1", category: "exterior", price: 850, unit: "ชิ้น", in_stock: 10, min_stock: 2, location: "A1-001" },
                { thai: "ไฟหน้า", english: "Headlight", code: "HEA1", category: "lighting", price: 2500, unit: "ชิ้น", in_stock: 5, min_stock: 1, location: "B2-005" },
                { thai: "ประตู", english: "Door", code: "DOO1", category: "body", price: 15000, unit: "ชิ้น", in_stock: 3, min_stock: 1, location: "C1-010" },
                { thai: "กระจก", english: "Window/Glass", code: "WIN1", category: "glass", price: 3200, unit: "แผ่น", in_stock: 8, min_stock: 2, location: "D1-003" },
                { thai: "ไฟท้าย", english: "Tail Light", code: "TAI1", category: "lighting", price: 1200, unit: "ชิ้น", in_stock: 12, min_stock: 3, location: "B2-008" },
                { thai: "กันชนหน้า", english: "Front Bumper", code: "FRO2", category: "body", price: 8500, unit: "ชิ้น", in_stock: 6, min_stock: 1, location: "C1-020" },
                { thai: "น้ำมันเครื่อง", english: "Engine Oil", code: "OIL1", category: "fluids", price: 350, unit: "ลิตร", in_stock: 100, min_stock: 25, location: "L1-001" },
                { thai: "แบตเตอรี่", english: "Battery", code: "BAT1", category: "electrical", price: 3200, unit: "ก้อน", in_stock: 20, min_stock: 5, location: "K1-005" }
            ],
            categories: [
                { id: "exterior", name_thai: "ชิ้นส่วนภายนอก", name_english: "Exterior Parts", color: "#3498db" },
                { id: "lighting", name_thai: "ระบบไฟ", name_english: "Lighting System", color: "#f39c12" },
                { id: "body", name_thai: "โครงสร้างตัวถัง", name_english: "Body Structure", color: "#e74c3c" },
                { id: "glass", name_thai: "กระจก", name_english: "Glass & Windows", color: "#9b59b6" },
                { id: "electrical", name_thai: "ระบบไฟฟ้า", name_english: "Electrical System", color: "#f1c40f" },
                { id: "fluids", name_thai: "น้ำมันและของเหลว", name_english: "Fluids & Lubricants", color: "#1abc9c" }
            ],
            suppliers: [
                { id: "default", name: "Default Supplier", contact: "02-000-0000", email: "info@default.com", address: "Default Address" }
            ],
            warehouse_locations: [
                { zone: "A", description: "General Storage Zone A", sections: ["A1"] },
                { zone: "B", description: "Lighting Systems Zone", sections: ["B2"] },
                { zone: "C", description: "Body Parts Zone", sections: ["C1"] },
                { zone: "D", description: "Glass & Windows Zone", sections: ["D1"] },
                { zone: "K", description: "Electrical Systems Zone", sections: ["K1"] },
                { zone: "L", description: "Fluids & Lubricants Zone", sections: ["L1"] }
            ]
        };
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Get formatted part display name
     * @param {Object} part - Part object
     * @param {string} language - 'thai' or 'english'
     * @returns {string} Formatted part name
     */
    getPartDisplayName(part, language = 'thai') {
        if (!part) return '';

        if (language === 'english') {
            return `${part.english} (${part.code})`;
        }

        return `${part.thai} (${part.code})`;
    }

    /**
     * Check if part is in low stock
     * @param {Object} part - Part object
     * @returns {boolean} True if low stock
     */
    isLowStock(part) {
        return part.in_stock <= part.min_stock;
    }

    /**
     * Check if part is out of stock
     * @param {Object} part - Part object
     * @returns {boolean} True if out of stock
     */
    isOutOfStock(part) {
        return part.in_stock <= 0;
    }

    /**
     * Get stock status for a part
     * @param {Object} part - Part object
     * @returns {Object} Stock status object
     */
    getStockStatus(part) {
        if (this.isOutOfStock(part)) {
            return {
                status: 'out-of-stock',
                label: 'หมดสต็อก',
                class: 'status-out-of-stock',
                color: '#e74c3c'
            };
        } else if (this.isLowStock(part)) {
            return {
                status: 'low-stock',
                label: 'สต็อกต่ำ',
                class: 'status-low-stock',
                color: '#f39c12'
            };
        } else {
            return {
                status: 'in-stock',
                label: 'มีสต็อก',
                class: 'status-in-stock',
                color: '#27ae60'
            };
        }
    }

    /**
     * Get parts that need reordering
     * @returns {Array} Parts that need to be reordered
     */
    getPartsNeedingReorder() {
        return this.getParts().filter(part => part.in_stock <= (part.min_stock * 1.2));
    }

    /**
     * Calculate total inventory value
     * @returns {number} Total value of all parts in stock
     */
    getTotalInventoryValue() {
        return this.getParts().reduce((total, part) => {
            return total + (part.price * part.in_stock);
        }, 0);
    }

    /**
     * Get most expensive parts
     * @param {number} limit - Number of parts to return
     * @returns {Array} Array of most expensive parts
     */
    getMostExpensiveParts(limit = 10) {
        return this.getParts()
            .sort((a, b) => b.price - a.price)
            .slice(0, limit);
    }

    /**
     * Get parts by supplier
     * @param {string} supplierId - Supplier ID
     * @returns {Array} Parts from specified supplier
     */
    getPartsBySupplier(supplierId) {
        return this.getParts().filter(part => part.supplier === supplierId);
    }

    /**
     * Get parts by location
     * @param {string} location - Warehouse location
     * @returns {Array} Parts in specified location
     */
    getPartsByLocation(location) {
        return this.getParts().filter(part => part.location && part.location.includes(location));
    }

    /**
     * Search parts with advanced filters
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered parts
     */
    searchPartsAdvanced(filters = {}) {
        let parts = this.getParts();

        if (filters.searchText) {
            const search = filters.searchText.toLowerCase();
            parts = parts.filter(part =>
                part.thai.toLowerCase().includes(search) ||
                part.english.toLowerCase().includes(search) ||
                part.code.toLowerCase().includes(search)
            );
        }

        if (filters.category) {
            parts = parts.filter(part => part.category === filters.category);
        }

        if (filters.supplier) {
            parts = parts.filter(part => part.supplier === filters.supplier);
        }

        if (filters.stockStatus) {
            parts = parts.filter(part => {
                const status = this.getStockStatus(part);
                return status.status === filters.stockStatus;
            });
        }

        if (filters.priceRange) {
            const { min, max } = filters.priceRange;
            parts = parts.filter(part =>
                (!min || part.price >= min) && (!max || part.price <= max)
            );
        }

        return parts;
    }

    /**
     * Export parts data as CSV
     * @returns {string} CSV formatted string
     */
    exportToCSV() {
        const parts = this.getParts();
        const headers = ['Code', 'Thai Name', 'English Name', 'Category', 'Price', 'In Stock', 'Min Stock', 'Location', 'Supplier'];

        let csv = headers.join(',') + '\n';

        parts.forEach(part => {
            const row = [
                part.code,
                `"${part.thai}"`,
                `"${part.english}"`,
                part.category,
                part.price,
                part.in_stock,
                part.min_stock,
                part.location || '',
                part.supplier || ''
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Download parts data as CSV file
     */
    downloadCSV() {
        const csv = this.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `automotive-parts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Create global instance
window.partsDataManager = new PartsDataManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PartsDataManager;
}