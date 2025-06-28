// static/js/modal.js - Enhanced Modal System with Debugging
/**
 * Modal Management System with enhanced debugging and error handling
 */

console.log('📂 Loading modal.js...');

// Global modal functions
function showModal(title, content) {
    console.log('🔧 showModal called with:', { title, contentLength: content?.length });

    const modalOverlay = document.getElementById('modalOverlay');
    const modalContainer = document.getElementById('modalContainer');

    console.log('📍 Modal elements found:', {
        overlay: !!modalOverlay,
        container: !!modalContainer
    });

    if (!modalOverlay || !modalContainer) {
        console.error('❌ Modal elements not found in DOM');
        console.log('Available elements with "modal" in ID:',
            Array.from(document.querySelectorAll('[id*="modal"]')).map(el => el.id)
        );
        return false;
    }

    // Set modal content
    modalContainer.innerHTML = content;

    // Show modal
    modalOverlay.classList.add('active');
    console.log('✅ Modal shown successfully');

    // Add escape key listener
    document.addEventListener('keydown', handleModalEscape);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return true;
}

function closeModal() {
    console.log('🔒 closeModal called');

    const modalOverlay = document.getElementById('modalOverlay');

    if (modalOverlay) {
        modalOverlay.classList.remove('active');

        // Remove escape key listener
        document.removeEventListener('keydown', handleModalEscape);

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('✅ Modal closed successfully');
        return true;
    } else {
        console.error('❌ Modal overlay not found when trying to close');
        return false;
    }
}

function handleModalEscape(event) {
    if (event.key === 'Escape') {
        console.log('⌨️ Escape key pressed, closing modal');
        closeModal();
    }
}

// Initialize modal system when DOM is ready
function initializeModalSystem() {
    console.log('🔧 Initializing modal system...');

    const modalOverlay = document.getElementById('modalOverlay');

    if (modalOverlay) {
        // Close modal when clicking overlay (but not modal content)
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                console.log('🖱️ Clicked on overlay, closing modal');
                closeModal();
            }
        });

        console.log('✅ Modal click handler attached');
    } else {
        console.error('❌ modalOverlay not found during initialization');
        console.log('📋 Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    console.log('🍞 showToast called:', { message, type });

    const toastContainer = document.getElementById('toastContainer');

    if (!toastContainer) {
        console.warn('⚠️ Toast container not found, falling back to console');
        console.log(`Toast (${type}):`, message);

        // Fallback: Show alert if no toast container
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else if (type === 'success') {
            alert(`Success: ${message}`);
        }
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    toastContainer.appendChild(toast);
    console.log('✅ Toast added to container');

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
            console.log('🗑️ Toast auto-removed');
        }
    }, 5000);
}

// Test modal system function
function testModalSystem() {
    console.log('🧪 Testing modal system...');

    const testContent = `
        <div class="modal-header">
            <h2>🧪 Test Modal</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <p>This is a test modal to verify the system is working!</p>
            <button class="button button-primary" onclick="closeModal()">Close Test</button>
        </div>
    `;

    const success = showModal('Test Modal', testContent);
    if (success) {
        showToast('Modal system test successful!', 'success');
    } else {
        showToast('Modal system test failed!', 'error');
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalSystem);
} else {
    // DOM already loaded
    initializeModalSystem();
}

// Make functions globally available
window.showModal = showModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.testModalSystem = testModalSystem;

console.log('✅ Modal system loaded and ready');

// Debug: Test if elements exist after a short delay
setTimeout(() => {
    console.log('🔍 Modal elements check after 1 second:');
    console.log('  modalOverlay:', !!document.getElementById('modalOverlay'));
    console.log('  modalContainer:', !!document.getElementById('modalContainer'));
    console.log('  toastContainer:', !!document.getElementById('toastContainer'));

    // List all elements with modal or toast in their ID
    const modalElements = Array.from(document.querySelectorAll('[id*="modal"], [id*="Modal"], [id*="toast"], [id*="Toast"]'));
    console.log('  Elements with modal/toast in ID:', modalElements.map(el => el.id));
}, 1000);