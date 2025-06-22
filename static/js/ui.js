//static/js/ui.js
// UI helper functions for OL Service POS
window.UI = {
    init() {
        console.log('🎨 UI helpers initialized');
    },

    // Show/hide loading states
    showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="loader-spinner"></div>';
        }
    },

    hideLoading(element) {
        if (element) {
            element.innerHTML = '';
        }
    },

    // Create modal backdrop
    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `<div class="modal-container">${content}</div>`;
        document.body.appendChild(modal);
        return modal;
    },

    // Remove modal
    removeModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
};
