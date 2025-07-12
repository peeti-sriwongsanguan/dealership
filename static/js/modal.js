// static/js/modal.js - Production Modal System
/**
 * Modal and Toast System for OL Service POS
 */

class ModalSystem {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        try {
            this.ensureModalContainers();
            this.bindGlobalFunctions();
            this.isInitialized = true;
        } catch (error) {
            console.error('Modal System initialization failed:', error);
        }
    }

    ensureModalContainers() {
        let modalOverlay = document.getElementById('modalOverlay');

        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'modalOverlay';
            modalOverlay.className = 'modal-overlay';

            const modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            modalContainer.className = 'modal-container';

            modalOverlay.appendChild(modalContainer);
            document.body.appendChild(modalOverlay);
        }

        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    bindGlobalFunctions() {
        window.showModal = (title, content, size = 'medium') => {
            this.showModal(title, content, size);
        };

        window.closeModal = () => {
            this.closeModal();
        };

        window.showToast = (message, type = 'info', duration = 3000) => {
            this.showToast(message, type, duration);
        };
    }

    showModal(title, content, size = 'medium') {
        try {
            const modalOverlay = document.getElementById('modalOverlay');
            const modalContainer = document.getElementById('modalContainer');

            if (!modalOverlay || !modalContainer) {
                this.fallbackAlert(title, content);
                return;
            }

            modalContainer.className = `modal-container modal-${size}`;

            modalContainer.innerHTML = `
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" onclick="window.closeModal()" type="button">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            `;

            modalOverlay.style.display = 'flex';
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            };

            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

        } catch (error) {
            console.error('Error showing modal:', error);
            this.fallbackAlert(title, content);
        }
    }

    closeModal() {
        try {
            const modalOverlay = document.getElementById('modalOverlay');

            if (modalOverlay) {
                modalOverlay.classList.remove('active');

                setTimeout(() => {
                    modalOverlay.style.display = 'none';
                    document.body.style.overflow = '';
                }, 300);
            }
        } catch (error) {
            console.error('Error closing modal:', error);
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        try {
            const toastContainer = document.getElementById('toastContainer');

            if (!toastContainer) {
                return;
            }

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;

            const icons = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };

            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
                    <span class="toast-message">${message}</span>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            `;

            toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentElement) {
                            toast.remove();
                        }
                    }, 300);
                }
            }, duration);

        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    fallbackAlert(title, content) {
        const textContent = content.replace(/<[^>]*>/g, '');
        alert(`${title}\n\n${textContent}`);
    }
}

// Initialize modal system when DOM is ready
function initializeModalSystem() {
    setTimeout(() => {
        try {
            window.modalSystem = new ModalSystem();
        } catch (error) {
            console.error('Failed to initialize modal system:', error);
        }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalSystem);
} else {
    initializeModalSystem();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalSystem;
}