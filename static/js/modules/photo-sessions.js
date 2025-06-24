// static/js/modules/photo-sessions.js
/**
 * Photo Session Helper Functions
 * Works with the main Photos module to provide session-specific functionality
 */

class PhotoSessionHelper {
    constructor() {
        this.apiBase = '/api/photo-sessions';
    }

    // Session API helpers
    async createSession(sessionData) {
        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData)
            });

            if (!response.ok) {
                throw new Error('Failed to create photo session');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    async getSession(sessionId) {
        try {
            const response = await fetch(`${this.apiBase}/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load session');
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    }

    async getSessions(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${this.apiBase}?${params}`);

            if (!response.ok) {
                throw new Error('Failed to load sessions');
            }

            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            console.error('Error loading sessions:', error);
            throw error;
        }
    }

    async closeSession(sessionId) {
        try {
            const response = await fetch(`${this.apiBase}/${sessionId}/close`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to close session');
            }

            return await response.json();
        } catch (error) {
            console.error('Error closing session:', error);
            throw error;
        }
    }

    // Session validation helpers
    validateSessionProgress(session, photos, requiredAngles) {
        if (!session || !photos || !requiredAngles) return 0;

        const sessionPhotos = photos.filter(p =>
            p.vehicle_id === session.vehicle_id &&
            p.category === session.session_type
        );

        const capturedAngles = sessionPhotos.map(p => p.angle);
        const capturedRequired = requiredAngles.filter(angle => capturedAngles.includes(angle));

        return (capturedRequired.length / requiredAngles.length) * 100;
    }

    isSessionComplete(session, photos, requiredAngles) {
        const progress = this.validateSessionProgress(session, photos, requiredAngles);
        return progress >= 100;
    }

    getMissingAngles(session, photos, requiredAngles) {
        if (!session || !photos || !requiredAngles) return requiredAngles;

        const sessionPhotos = photos.filter(p =>
            p.vehicle_id === session.vehicle_id &&
            p.category === session.session_type
        );

        const capturedAngles = sessionPhotos.map(p => p.angle);
        return requiredAngles.filter(angle => !capturedAngles.includes(angle));
    }

    // Photo upload helper for sessions
    async uploadPhotoToSession(sessionId, photoBlob, photoData) {
        try {
            const formData = new FormData();
            formData.append('file', photoBlob, `${photoData.angle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`);
            formData.append('session_id', sessionId);
            formData.append('vehicle_id', photoData.vehicle_id);
            formData.append('customer_id', photoData.customer_id);
            formData.append('category', photoData.category);
            formData.append('angle', photoData.angle);
            formData.append('description', photoData.description || '');
            formData.append('created_by', photoData.created_by || 'user');

            const response = await fetch('/api/photos', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading photo to session:', error);
            throw error;
        }
    }

    // Session reporting helpers
    generateSessionReport(session, photos, vehicle, customer) {
        const sessionPhotos = photos.filter(p =>
            p.vehicle_id === session.vehicle_id &&
            p.category === session.session_type
        );

        return {
            session: {
                id: session.id,
                name: session.session_name,
                type: session.session_type,
                status: session.status,
                start_time: session.start_time,
                end_time: session.end_time,
                total_photos: session.total_photos
            },
            vehicle: {
                make: vehicle?.make,
                model: vehicle?.model,
                year: vehicle?.year,
                license_plate: vehicle?.license_plate,
                vin: vehicle?.vin
            },
            customer: {
                name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
                email: customer?.email,
                phone: customer?.phone
            },
            photos: sessionPhotos.map(photo => ({
                id: photo.id,
                angle: photo.angle,
                description: photo.description,
                timestamp: photo.timestamp,
                category: photo.category
            })),
            generated_at: new Date().toISOString()
        };
    }

    // Camera helpers for sessions
    async initializeCamera(constraints = {}) {
        try {
            const defaultConstraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const finalConstraints = { ...defaultConstraints, ...constraints };
            return await navigator.mediaDevices.getUserMedia(finalConstraints);
        } catch (error) {
            console.error('Failed to initialize camera:', error);
            throw new Error('Camera not available');
        }
    }

    capturePhotoFromVideo(videoElement, canvasElement) {
        if (!videoElement || !canvasElement) {
            throw new Error('Video or canvas element not available');
        }

        const ctx = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        ctx.drawImage(videoElement, 0, 0);

        return new Promise((resolve) => {
            canvasElement.toBlob(resolve, 'image/jpeg', 0.8);
        });
    }

    // Utility helpers
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatSessionDuration(startTime, endTime) {
        if (!startTime) return 'Unknown';

        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const duration = end - start;

        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    getSessionTypeIcon(sessionType) {
        const icons = {
            'check-in': '📥',
            'check-out': '📤',
            'damage': '🔍',
            'before-service': '⚙️',
            'during-service': '🔧',
            'after-service': '✅'
        };
        return icons[sessionType] || '📸';
    }

    getSessionTypeColor(sessionType) {
        const colors = {
            'check-in': '#3498db',
            'check-out': '#2c3e50',
            'damage': '#e74c3c',
            'before-service': '#f39c12',
            'during-service': '#9b59b6',
            'after-service': '#27ae60'
        };
        return colors[sessionType] || '#667eea';
    }

    // Event handlers for session-specific UI elements
    bindSessionEvents() {
        document.addEventListener('click', (e) => {
            // Handle session-specific button clicks
            if (e.target.matches('[data-session-action]')) {
                const action = e.target.dataset.sessionAction;
                const sessionId = e.target.dataset.sessionId;

                switch (action) {
                    case 'view':
                        this.handleViewSession(sessionId);
                        break;
                    case 'continue':
                        this.handleContinueSession(sessionId);
                        break;
                    case 'close':
                        this.handleCloseSession(sessionId);
                        break;
                    case 'download-report':
                        this.handleDownloadReport(sessionId);
                        break;
                }
            }
        });
    }

    async handleViewSession(sessionId) {
        try {
            if (window.Photos && typeof window.Photos.viewSession === 'function') {
                await window.Photos.viewSession(sessionId);
            } else {
                console.warn('Photos module not available for viewing session');
            }
        } catch (error) {
            console.error('Error handling view session:', error);
        }
    }

    async handleContinueSession(sessionId) {
        try {
            if (window.Photos && typeof window.Photos.continueSession === 'function') {
                await window.Photos.continueSession(sessionId);
            } else {
                console.warn('Photos module not available for continuing session');
            }
        } catch (error) {
            console.error('Error handling continue session:', error);
        }
    }

    async handleCloseSession(sessionId) {
        try {
            if (confirm('Are you sure you want to close this photo session?')) {
                await this.closeSession(sessionId);

                if (window.Photos && typeof window.Photos.loadPhotoSessions === 'function') {
                    await window.Photos.loadPhotoSessions();
                    window.Photos.render();
                }

                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('Photo session closed successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error handling close session:', error);
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('Failed to close session', 'error');
            }
        }
    }

    async handleDownloadReport(sessionId) {
        try {
            if (window.Photos && typeof window.Photos.downloadSessionReport === 'function') {
                await window.Photos.downloadSessionReport(sessionId);
            } else {
                console.warn('Photos module not available for downloading report');
            }
        } catch (error) {
            console.error('Error handling download report:', error);
        }
    }
}

// Create global instance
window.photoSessionHelper = new PhotoSessionHelper();

// Auto-bind events when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.photoSessionHelper.bindSessionEvents();
    });
} else {
    window.photoSessionHelper.bindSessionEvents();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoSessionHelper;
}

console.log('✅ Photo Session Helper loaded successfully');