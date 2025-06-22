// static/js/api.js - API Client for OL Service POS
class APIClient {
    constructor() {
        this.baseURL = window.Config?.API_BASE || '';
    }

    // Add the missing init method
    init() {
        console.log('📡 API Client initialized');
        return Promise.resolve();
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Customer endpoints
    getCustomers() {
        return this.request('/api/customers');
    }

    createCustomer(data) {
        return this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    updateCustomer(id, data) {
        return this.request(`/api/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    deleteCustomer(id) {
        return this.request(`/api/customers/${id}`, {
            method: 'DELETE'
        });
    }

    // Vehicle endpoints
    getVehicles() {
        return this.request('/api/vehicles');
    }

    createVehicle(data) {
        return this.request('/api/vehicles', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    updateVehicle(id, data) {
        return this.request(`/api/vehicles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    deleteVehicle(id) {
        return this.request(`/api/vehicles/${id}`, {
            method: 'DELETE'
        });
    }

    // Service endpoints
    getServices() {
        return this.request('/api/services');
    }

    createService(data) {
        return this.request('/api/services', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    updateService(id, data) {
        return this.request(`/api/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    deleteService(id) {
        return this.request(`/api/services/${id}`, {
            method: 'DELETE'
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/api');
    }
}

// Create global instance
window.API = new APIClient();