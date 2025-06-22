//static/js/components.js
// Reusable UI components for OL Service POS
window.Components = {
    init() {
        console.log('🧩 Components initialized');
    },

    // Create a card component
    createCard(title, content, actions = '') {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${title}</h3>
                </div>
                <div class="card-body">${content}</div>
                ${actions ? `<div class="card-footer">${actions}</div>` : ''}
            </div>
        `;
    },

    // Create a stat card
    createStatCard(icon, number, label) {
        return `
            <div class="stat-card">
                <div class="stat-icon">${icon}</div>
                <div class="stat-content">
                    <div class="stat-number">${number}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    },

    // Create a form field
    createFormField(label, type, name, placeholder = '', required = false) {
        return `
            <div class="form-group">
                <label class="form-label ${required ? 'required' : ''}">${label}</label>
                <input 
                    type="${type}" 
                    name="${name}" 
                    class="form-input" 
                    placeholder="${placeholder}"
                    ${required ? 'required' : ''}
                >
            </div>
        `;
    }
};
