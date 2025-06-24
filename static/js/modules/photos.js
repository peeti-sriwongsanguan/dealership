// static/js/modules/photos.js - Enhanced Vehicle Photo Documentation Module

class PhotosModule {
    constructor() {
        this.customers = [];
        this.vehicles = [];
        this.photos = [];
        this.photoSessions = [];
        this.currentCustomer = null;
        this.currentVehicle = null;
        this.currentCategory = 'check-in';
        this.currentSession = null;
        this.isLoading = false;
        this.cameraActive = false;
        this.currentStream = null;
        this.currentFilter = 'all';
        this.viewMode = 'gallery'; // 'gallery' or 'sessions'

        // Enhanced photo categories with required angles
        this.photoCategories = {
            'check-in': {
                name: 'Check-In Photos',
                icon: '📥',
                description: 'Vehicle condition when received',
                color: '#3498db',
                required: ['Front View', 'Rear View', 'Driver Side', 'Passenger Side']
            },
            'damage': {
                name: 'Damage Documentation',
                icon: '🔍',
                description: 'Existing damage and issues',
                color: '#e74c3c',
                required: ['Damage Area', 'Close-up Detail']
            },
            'before-service': {
                name: 'Before Service',
                icon: '⚙️',
                description: 'Condition before work begins',
                color: '#f39c12',
                required: ['Front View', 'Rear View']
            },
            'during-service': {
                name: 'During Service',
                icon: '🔧',
                description: 'Work in progress photos',
                color: '#9b59b6',
                required: ['Work Area']
            },
            'after-service': {
                name: 'After Service',
                icon: '✅',
                description: 'Completed work documentation',
                color: '#27ae60',
                required: ['Front View', 'Rear View']
            },
            'check-out': {
                name: 'Check-Out Photos',
                icon: '📤',
                description: 'Vehicle condition when returned',
                color: '#2c3e50',
                required: ['Front View', 'Rear View', 'Driver Side', 'Passenger Side']
            }
        };

        // Standard photo angles for comprehensive documentation
        this.photoAngles = [
            'Front View', 'Rear View', 'Driver Side', 'Passenger Side',
            'Front Left Corner', 'Front Right Corner', 'Rear Left Corner', 'Rear Right Corner',
            'Dashboard', 'Interior Front', 'Interior Rear', 'Engine Bay', 'Trunk/Cargo Area',
            'Damage Area', 'Close-up Detail', 'Context View', 'Work Area'
        ];
    }

    async init() {
        console.log('📸 Initializing Photos module...');
        try {
            await this.loadCustomers();
            await this.loadVehicles();
            await this.loadPhotos();
            await this.loadPhotoSessions();
            console.log('✅ Photos module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Photos module:', error);
            throw error;
        }
    }

    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                this.customers = data.customers || [];
            } else {
                this.customers = [];
            }
            console.log(`👥 Loaded ${this.customers.length} customers for photos`);
        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
        }
    }

    async loadVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            if (response.ok) {
                const data = await response.json();
                this.vehicles = data.vehicles || [];
            } else {
                this.vehicles = [];
            }
            console.log(`🚗 Loaded ${this.vehicles.length} vehicles for photos`);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            this.vehicles = [];
        }
    }

    async loadPhotos() {
        try {
            const response = await fetch('/api/photos');
            if (response.ok) {
                const data = await response.json();
                this.photos = data.photos || [];
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem('vehicle_photos');
                this.photos = stored ? JSON.parse(stored) : [];
            }
            console.log(`📸 Loaded ${this.photos.length} photos`);
        } catch (error) {
            console.error('Failed to load photos:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('vehicle_photos');
            this.photos = stored ? JSON.parse(stored) : [];
        }
    }

    async loadPhotoSessions() {
        try {
            const response = await fetch('/api/photo-sessions');
            if (response.ok) {
                const data = await response.json();
                this.photoSessions = data.sessions || [];
            } else {
                this.photoSessions = [];
            }
            console.log(`📋 Loaded ${this.photoSessions.length} photo sessions`);
        } catch (error) {
            console.error('Failed to load photo sessions:', error);
            this.photoSessions = [];
        }
    }

    async load() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await this.init();
            this.render();
        } catch (error) {
            console.error('Failed to load photos section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const html = `
            <div class="photos-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">📸 Vehicle Photo Documentation</h2>
                    <div class="action-bar-actions">
                        <div class="view-toggle">
                            <button class="button ${this.viewMode === 'gallery' ? 'button-primary' : 'button-outline'}" onclick="Photos.setViewMode('gallery')">
                                🖼️ Gallery
                            </button>
                            <button class="button ${this.viewMode === 'sessions' ? 'button-primary' : 'button-outline'}" onclick="Photos.setViewMode('sessions')">
                                📋 Sessions
                            </button>
                        </div>
                        <button class="button button-outline" onclick="Photos.exportPhotos()" title="Export Photos">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="Photos.startPhotoSession()" title="Start Photo Session">
                            📷 New Session
                        </button>
                    </div>
                </div>

                <!-- Vehicle Selection -->
                <div class="vehicle-selector">
                    <h3>🚗 Select Vehicle for Photo Documentation</h3>
                    <div class="vehicle-grid">
                        ${this.renderVehicleOptions()}
                    </div>
                </div>

                <!-- Content based on view mode -->
                ${this.renderMainContent()}

                <!-- Back Button -->
                <div style="margin-top: 2rem; text-align: center;">
                    <button class="button button-outline" onclick="app.goHome()">
                        ← Back to Home
                    </button>
                </div>
            </div>

            <!-- Photo Modal -->
            <div class="photo-modal" id="photoModal">
                <div class="photo-modal-content">
                    <button class="photo-modal-close" onclick="Photos.closePhotoModal()">×</button>
                    <img class="photo-modal-image" id="modalImage" src="" alt="Photo">
                    <div class="photo-modal-info" id="modalInfo"></div>
                </div>
            </div>
        `;

        if (window.app) {
            window.app.setContent(html);
        }
    }

    renderMainContent() {
        if (!this.currentVehicle) {
            return '<div style="text-align: center; padding: 2rem; color: #7f8c8d;">Please select a vehicle to view photos or sessions.</div>';
        }

        if (this.viewMode === 'sessions') {
            return this.renderSessionsView();
        } else {
            return this.renderGalleryView();
        }
    }

    renderGalleryView() {
        return `
            <!-- Photo Categories -->
            <div class="photo-categories">
                ${this.renderPhotoCategories()}
            </div>

            <!-- Photo Guidelines -->
            <div class="photo-guidelines">
                <h3>📋 Photo Documentation Guidelines</h3>
                <div class="guidelines-grid">
                    ${this.renderPhotoGuidelines()}
                </div>
            </div>

            <!-- Camera Section -->
            <div class="camera-section" id="cameraSection" style="display: ${this.cameraActive ? 'block' : 'none'};">
                <h3>📷 Camera - ${this.photoCategories[this.currentCategory]?.name || 'Photo Capture'}</h3>
                <div class="camera-container">
                    <video id="cameraVideo" class="camera-video" autoplay playsinline></video>
                    <canvas id="cameraCanvas" class="camera-canvas"></canvas>
                    <div class="camera-controls">
                        <button class="camera-switch-btn" onclick="Photos.switchCamera()" title="Switch Camera">
                            🔄
                        </button>
                        <button class="capture-btn" onclick="Photos.capturePhoto()" title="Capture Photo">
                            📷
                        </button>
                        <button class="camera-switch-btn" onclick="Photos.stopCamera()" title="Stop Camera">
                            ❌
                        </button>
                    </div>
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <select id="photoAngleSelect" class="form-input" style="width: auto; margin-right: 1rem;">
                        <option value="">Select photo angle...</option>
                        ${this.getAvailableAngles().map(angle => `<option value="${angle}">${angle}</option>`).join('')}
                    </select>
                    <input type="text" id="photoDescription" class="form-input" placeholder="Add description (optional)" style="width: 300px; max-width: 100%;">
                </div>
            </div>

            <!-- Photo Gallery -->
            <div class="photo-gallery">
                <div class="gallery-header">
                    <h3 class="gallery-title">📂 Photo Gallery - ${this.getPhotoCount()} Photos</h3>
                    <div class="gallery-filters">
                        <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" onclick="Photos.setFilter('all')">
                            All Photos
                        </button>
                        ${Object.entries(this.photoCategories).map(([key, category]) => `
                            <button class="filter-btn ${this.currentFilter === key ? 'active' : ''}" onclick="Photos.setFilter('${key}')">
                                ${category.icon} ${category.name.split(' ')[0]}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="photos-grid" id="photosGrid">
                    ${this.renderPhotoGallery()}
                </div>
            </div>
        `;
    }

    renderSessionsView() {
        const vehicleSessions = this.photoSessions.filter(s => s.vehicle_id === this.currentVehicle.id);

        if (vehicleSessions.length === 0) {
            return `
                <div class="photos-empty-state">
                    <div class="photos-empty-icon">📋</div>
                    <h3 class="photos-empty-title">No photo sessions yet</h3>
                    <p class="photos-empty-description">
                        Start documenting this vehicle by creating a photo session.
                    </p>
                    <button class="button button-primary" onclick="Photos.startPhotoSession()">
                        📷 Start First Session
                    </button>
                </div>
            `;
        }

        return `
            <div class="sessions-container">
                <h3>📋 Photo Sessions for ${this.currentVehicle.make} ${this.currentVehicle.model}</h3>
                <div class="sessions-grid">
                    ${vehicleSessions.map(session => this.renderSessionCard(session)).join('')}
                </div>
            </div>
        `;
    }

    renderSessionCard(session) {
        const category = this.photoCategories[session.session_type];
        const progress = this.calculateSessionProgress(session);

        return `
            <div class="session-card">
                <div class="session-card-header" style="background: ${category?.color || '#667eea'}">
                    <div class="session-type">
                        <span class="type-icon">${category?.icon || '📸'}</span>
                        <span class="type-text">${category?.name || session.session_type}</span>
                    </div>
                    <div class="session-status ${session.status}">
                        ${session.status === 'completed' ? '✅' : '⏳'} ${session.status}
                    </div>
                </div>

                <div class="session-card-content">
                    <h4 class="session-name">${session.session_name}</h4>

                    <div class="session-details">
                        <div class="detail-item">
                            <span class="detail-label">Started:</span>
                            <span class="detail-value">${new Date(session.start_time).toLocaleString()}</span>
                        </div>
                        ${session.end_time ? `
                            <div class="detail-item">
                                <span class="detail-label">Completed:</span>
                                <span class="detail-value">${new Date(session.end_time).toLocaleString()}</span>
                            </div>
                        ` : ''}
                        <div class="detail-item">
                            <span class="detail-label">Photos:</span>
                            <span class="detail-value">${session.total_photos || 0}</span>
                        </div>
                    </div>

                    <div class="session-progress">
                        <div class="progress-info">
                            <span>Progress: ${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>

                <div class="session-card-actions">
                    <button class="button button-outline button-sm" onclick="Photos.viewSession(${session.id})">
                        👁️ View
                    </button>

                    ${session.status === 'active' ? `
                        <button class="button button-primary button-sm" onclick="Photos.continueSession(${session.id})">
                            📷 Continue
                        </button>
                    ` : ''}

                    <button class="button button-outline button-sm" onclick="Photos.downloadSessionReport(${session.id})">
                        📄 Report
                    </button>
                </div>
            </div>
        `;
    }

    // Session Management Methods
    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    }

    calculateSessionProgress(session) {
        const category = this.photoCategories[session.session_type];
        const requiredPhotos = category?.required?.length || 4;
        const actualPhotos = session.total_photos || 0;
        return Math.min(100, (actualPhotos / requiredPhotos) * 100);
    }

    async startPhotoSession() {
        if (!this.currentVehicle) {
            window.app?.showToast('Please select a vehicle first', 'warning');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>📷 Start Photo Session</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <h3 style="margin-bottom: 1rem;">Vehicle: ${this.currentVehicle.year || ''} ${this.currentVehicle.make} ${this.currentVehicle.model}</h3>
                <p style="margin-bottom: 1.5rem; color: #7f8c8d;">
                    Select the type of photo session to begin comprehensive vehicle documentation.
                </p>

                <div style="display: grid; gap: 1rem;">
                    ${Object.entries(this.photoCategories).map(([key, category]) => `
                        <button class="button button-outline" style="padding: 1rem; text-align: left; display: flex; align-items: center; gap: 1rem;" onclick="Photos.createPhotoSession('${key}')">
                            <span style="font-size: 1.5rem; color: ${category.color};">${category.icon}</span>
                            <div>
                                <div style="font-weight: 600;">${category.name}</div>
                                <div style="font-size: 0.9rem; color: #7f8c8d;">${category.description}</div>
                                <div style="font-size: 0.8rem; color: ${category.color};">Required: ${category.required?.join(', ') || 'None specified'}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <div class="modal-actions">
                    <button class="button button-outline" onclick="app.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        window.app?.showModal(modalContent);
    }

    async createPhotoSession(sessionType) {
        try {
            const sessionData = {
                vehicle_id: this.currentVehicle.id,
                customer_id: this.currentVehicle.customer_id,
                session_type: sessionType,
                session_name: `${this.photoCategories[sessionType].name} - ${this.currentVehicle.license_plate || 'Vehicle'}`,
                created_by: 'user', // TODO: Get actual user
                notes: `${this.photoCategories[sessionType].description}`
            };

            const response = await fetch('/api/photo-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData)
            });

            if (!response.ok) {
                throw new Error('Failed to create photo session');
            }

            const result = await response.json();
            this.currentSession = result.session;
            this.currentCategory = sessionType;

            window.app?.closeModal();

            // Start camera for immediate photo taking
            await this.startCamera();

            window.app?.showToast('Photo session started! Begin taking photos.', 'success');

            // Refresh sessions data
            await this.loadPhotoSessions();

        } catch (error) {
            console.error('Error creating photo session:', error);
            window.app?.showToast('Failed to create photo session', 'error');
        }
    }

    async continueSession(sessionId) {
        try {
            const response = await fetch(`/api/photo-sessions/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load session');
            }

            const session = await response.json();
            this.currentSession = session;
            this.currentCategory = session.session_type;

            // Switch to gallery view and start camera
            this.setViewMode('gallery');
            await this.startCamera();

            window.app?.showToast('Continuing photo session...', 'success');

        } catch (error) {
            console.error('Error continuing session:', error);
            window.app?.showToast('Failed to continue session', 'error');
        }
    }

    async viewSession(sessionId) {
        try {
            const response = await fetch(`/api/photo-sessions/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load session details');
            }

            const session = await response.json();

            const modalContent = `
                <div class="modal-header">
                    <h2>📋 ${session.session_name}</h2>
                    <button class="modal-close" onclick="app.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="session-info-grid">
                        <div><strong>Type:</strong> ${this.photoCategories[session.session_type]?.name}</div>
                        <div><strong>Status:</strong> ${session.status}</div>
                        <div><strong>Started:</strong> ${new Date(session.start_time).toLocaleString()}</div>
                        ${session.end_time ? `<div><strong>Completed:</strong> ${new Date(session.end_time).toLocaleString()}</div>` : ''}
                        <div><strong>Total Photos:</strong> ${session.total_photos || 0}</div>
                    </div>

                    ${session.photos && session.photos.length > 0 ? `
                        <h4 style="margin-top: 1.5rem;">Photos (${session.photos.length})</h4>
                        <div class="session-photos-grid">
                            ${session.photos.map(photo => `
                                <div class="session-photo-item" onclick="Photos.viewSessionPhoto('${photo.id}', '${photo.angle}')">
                                    <img src="/api/photos/${photo.id}/thumbnail" alt="${photo.angle}" loading="lazy">
                                    <div class="photo-caption">${photo.angle}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="margin-top: 1.5rem; color: #7f8c8d;">No photos in this session yet.</p>'}

                    <div class="modal-actions">
                        <button class="button button-outline" onclick="app.closeModal()">
                            Close
                        </button>
                        ${session.status === 'active' ? `
                            <button class="button button-primary" onclick="Photos.continueSession(${session.id}); app.closeModal();">
                                📷 Continue Session
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            window.app?.showModal(modalContent);

        } catch (error) {
            console.error('Error viewing session:', error);
            window.app?.showToast('Failed to load session details', 'error');
        }
    }

    async viewSessionPhoto(photoId, angle) {
        const modalContent = `
            <div class="modal-header">
                <h2>📸 ${angle}</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="/api/photos/${photoId}" alt="${angle}" style="max-width: 100%; height: auto; border-radius: 8px;">
                <div class="modal-actions">
                    <button class="button button-outline" onclick="app.closeModal()">
                        Close
                    </button>
                    <a href="/api/photos/${photoId}" download class="button button-primary">
                        💾 Download
                    </a>
                </div>
            </div>
        `;

        window.app?.showModal(modalContent);
    }

    // Existing Methods (updated for session integration)
    renderVehicleOptions() {
        if (this.vehicles.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d; grid-column: 1 / -1;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🚗</div>
                    <p>No vehicles available for photo documentation.</p>
                    <button class="button button-primary" style="margin-top: 1rem;" onclick="app.navigateToSection('vehicles')">
                        ➕ Add Vehicles
                    </button>
                </div>
            `;
        }

        return this.vehicles.map(vehicle => `
            <div class="vehicle-option ${this.currentVehicle?.id === vehicle.id ? 'selected' : ''}"
                 onclick="Photos.selectVehicle(${vehicle.id})">
                <div class="vehicle-icon">🚐</div>
                <div class="vehicle-name">${vehicle.year || ''} ${vehicle.make} ${vehicle.model}</div>
                <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                    ${vehicle.license_plate || 'No Plate'} • ${vehicle.customer_name || 'Unknown Customer'}
                </div>
                <div style="font-size: 0.8rem; color: #667eea; margin-top: 0.25rem;">
                    ${this.getVehiclePhotoCount(vehicle.id)} photos
                </div>
            </div>
        `).join('');
    }

    renderPhotoCategories() {
        return Object.entries(this.photoCategories).map(([key, category]) => `
            <div class="photo-category ${this.currentCategory === key ? 'active' : ''}"
                 onclick="Photos.selectCategory('${key}')" style="border-color: ${category.color}">
                <div class="category-icon">${category.icon}</div>
                <div class="category-name">${category.name}</div>
                <div class="category-description">${category.description}</div>
                <div class="category-count">${this.getCategoryPhotoCount(key)} photos</div>
                <div class="category-requirements">Required: ${category.required?.join(', ') || 'None'}</div>
            </div>
        `).join('');
    }

    renderPhotoGuidelines() {
        const guidelines = [
            {
                icon: '📐',
                title: 'Required Angles',
                description: 'Each session type has specific required photo angles for complete documentation.'
            },
            {
                icon: '💡',
                title: 'Proper Lighting',
                description: 'Use good lighting conditions. Avoid shadows and ensure details are clearly visible.'
            },
            {
                icon: '🔍',
                title: 'Focus on Details',
                description: 'Take close-up shots of any existing damage, scratches, or areas of concern.'
            },
            {
                icon: '📏',
                title: 'Consistent Distance',
                description: 'Maintain consistent distance for comparison photos (before/after service).'
            },
            {
                icon: '📝',
                title: 'Session Tracking',
                description: 'Photos are organized into sessions for better organization and legal protection.'
            },
            {
                icon: '🔒',
                title: 'Legal Protection',
                description: 'Complete photo documentation protects both service provider and customer.'
            }
        ];

        return guidelines.map(guideline => `
            <div class="guideline-item">
                <div class="guideline-icon">${guideline.icon}</div>
                <div class="guideline-text">
                    <div class="guideline-title">${guideline.title}</div>
                    <div class="guideline-description">${guideline.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderPhotoGallery() {
        const filteredPhotos = this.getFilteredPhotos();

        if (filteredPhotos.length === 0) {
            return `
                <div class="photos-empty-state">
                    <div class="photos-empty-icon">📸</div>
                    <h3 class="photos-empty-title">No photos yet</h3>
                    <p class="photos-empty-description">
                        Start documenting this vehicle by taking photos or creating a photo session.
                    </p>
                    <button class="button button-primary" onclick="Photos.startPhotoSession()">
                        📷 Start Photo Session
                    </button>
                </div>
            `;
        }

        return filteredPhotos.map(photo => `
            <div class="photo-item" onclick="Photos.viewPhoto('${photo.id}')">
                <div class="photo-image" style="background-image: url('${photo.thumbnail_url || photo.url}'); background-size: cover; background-position: center;">
                    ${!photo.url && !photo.thumbnail_url ? '📸' : ''}
                </div>
                <div class="photo-info">
                    <div class="photo-category-badge" style="background: ${this.photoCategories[photo.category]?.color || '#667eea'}">
                        ${this.photoCategories[photo.category]?.icon || '📸'} ${this.photoCategories[photo.category]?.name || photo.category}
                    </div>
                    <div class="photo-timestamp">${new Date(photo.timestamp).toLocaleString()}</div>
                    <div class="photo-description">${photo.description || photo.angle || 'No description'}</div>
                    <div class="photo-actions">
                        <button class="photo-action-btn" onclick="event.stopPropagation(); Photos.editPhoto('${photo.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="photo-action-btn" onclick="event.stopPropagation(); Photos.downloadPhoto('${photo.id}')" title="Download">
                            💾
                        </button>
                        <button class="photo-action-btn" onclick="event.stopPropagation(); Photos.deletePhoto('${photo.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getAvailableAngles() {
        const category = this.photoCategories[this.currentCategory];
        if (category && category.required) {
            return category.required.concat(this.photoAngles.filter(angle => !category.required.includes(angle)));
        }
        return this.photoAngles;
    }

    selectVehicle(vehicleId) {
        this.currentVehicle = this.vehicles.find(v => v.id === vehicleId);
        this.currentCustomer = this.customers.find(c => c.id === this.currentVehicle?.customer_id);
        this.render();
    }

    selectCategory(category) {
        this.currentCategory = category;
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.updatePhotoGallery();
    }

    // Camera Methods
    async startCamera() {
        if (!this.currentVehicle) {
            window.app?.showToast('Please select a vehicle first', 'warning');
            return;
        }

        this.cameraActive = true;
        this.render();

        try {
            const video = document.getElementById('cameraVideo');

            // Request camera permission
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            video.srcObject = this.currentStream;
            video.play();

            console.log('📷 Camera started successfully');
            window.app?.showToast('Camera started! Select angle and capture photos', 'success');

        } catch (error) {
            console.error('Failed to start camera:', error);
            window.app?.showToast('Failed to access camera. Please check permissions.', 'error');
            this.cameraActive = false;
            this.render();
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        this.cameraActive = false;
        this.render();

        window.app?.showToast('Camera stopped', 'info');
    }

    async switchCamera() {
        if (!this.currentStream) return;

        try {
            // Stop current stream
            this.currentStream.getTracks().forEach(track => track.stop());

            // Try to switch between front and back camera
            const video = document.getElementById('cameraVideo');
            const constraints = {
                video: {
                    facingMode: this.currentStream.getVideoTracks()[0].getSettings().facingMode === 'user' ? 'environment' : 'user',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = this.currentStream;

            window.app?.showToast('Camera switched', 'success');

        } catch (error) {
            console.error('Failed to switch camera:', error);
            window.app?.showToast('Failed to switch camera', 'error');
        }
    }

    async capturePhoto() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const angleSelect = document.getElementById('photoAngleSelect');
        const descriptionInput = document.getElementById('photoDescription');

        if (!video || !canvas) {
            window.app?.showToast('Camera not ready', 'error');
            return;
        }

        if (!angleSelect.value) {
            window.app?.showToast('Please select a photo angle', 'warning');
            return;
        }

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert canvas to blob and upload
        canvas.toBlob(async (blob) => {
            await this.uploadPhoto(blob, angleSelect.value, descriptionInput.value);
        }, 'image/jpeg', 0.8);
    }

    async uploadPhoto(blob, angle, description = '') {
        try {
            const formData = new FormData();
            formData.append('file', blob, `${angle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`);
            formData.append('vehicle_id', this.currentVehicle.id);
            formData.append('customer_id', this.currentVehicle.customer_id);
            formData.append('category', this.currentCategory);
            formData.append('angle', angle);
            formData.append('description', description || `${angle} - ${this.currentCategory} documentation`);
            formData.append('created_by', 'user');

            if (this.currentSession) {
                formData.append('session_id', this.currentSession.id);
            }

            const response = await fetch('/api/photos', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }

            const result = await response.json();

            // Add to photos array for immediate UI update
            this.photos.push(result.photo);

            // Clear inputs
            document.getElementById('photoAngleSelect').value = '';
            document.getElementById('photoDescription').value = '';

            // Update gallery if visible
            this.updatePhotoGallery();

            // Check if session is complete
            if (this.currentSession) {
                await this.checkSessionComplete();
            }

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            window.app?.showToast(`📸 Photo captured: ${angle}`, 'success');

        } catch (error) {
            console.error('Error uploading photo:', error);

            // Fallback to local storage
            const photo = {
                id: Date.now().toString(),
                vehicle_id: this.currentVehicle.id,
                customer_id: this.currentVehicle.customer_id,
                category: this.currentCategory,
                angle: angle,
                description: description || `${angle} - ${this.currentCategory} documentation`,
                timestamp: new Date().toISOString(),
                url: URL.createObjectURL(blob),
                size: blob.size
            };

            this.photos.push(photo);
            this.savePhotos();
            this.updatePhotoGallery();

            window.app?.showToast('📸 Photo captured and saved locally', 'success');
        }
    }

    async checkSessionComplete() {
        if (!this.currentSession) return;

        const category = this.photoCategories[this.currentSession.session_type];
        const requiredAngles = category?.required || [];

        const sessionPhotos = this.photos.filter(p =>
            p.vehicle_id === this.currentVehicle.id &&
            p.category === this.currentSession.session_type
        );

        const capturedAngles = sessionPhotos.map(p => p.angle);
        const isComplete = requiredAngles.every(angle => capturedAngles.includes(angle));

        if (isComplete) {
            const shouldComplete = confirm('All required photos captured! Would you like to complete this session?');
            if (shouldComplete) {
                await this.completeCurrentSession();
            }
        }
    }

    async completeCurrentSession() {
        if (!this.currentSession) return;

        try {
            const response = await fetch(`/api/photo-sessions/${this.currentSession.id}/close`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to complete session');
            }

            window.app?.showToast('Photo session completed successfully!', 'success');

            this.currentSession = null;
            this.stopCamera();

            // Refresh data
            await this.loadPhotoSessions();

            // Switch to sessions view to show completed session
            this.setViewMode('sessions');

        } catch (error) {
            console.error('Error completing session:', error);
            window.app?.showToast('Failed to complete session', 'error');
        }
    }

    // Photo Management Methods
    viewPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        const modalInfo = document.getElementById('modalInfo');

        modalImage.src = photo.url || photo.photo_url || '';
        modalInfo.innerHTML = `
            <div style="font-weight: 600;">${this.photoCategories[photo.category]?.name || photo.category}</div>
            <div>${photo.angle ? `${photo.angle} • ` : ''}${new Date(photo.timestamp).toLocaleString()}</div>
            ${photo.description ? `<div style="margin-top: 0.5rem;">${photo.description}</div>` : ''}
        `;

        modal.classList.add('active');
    }

    closePhotoModal() {
        const modal = document.getElementById('photoModal');
        modal.classList.remove('active');
    }

    editPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const modalContent = `
            <div class="modal-header">
                <h2>✏️ Edit Photo</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <img src="${photo.thumbnail_url || photo.url}" alt="Photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="editCategory" class="form-input">
                        ${Object.entries(this.photoCategories).map(([key, category]) => `
                            <option value="${key}" ${key === photo.category ? 'selected' : ''}>
                                ${category.icon} ${category.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Angle/View</label>
                    <select id="editAngle" class="form-input">
                        <option value="">Select angle...</option>
                        ${this.photoAngles.map(angle => `
                            <option value="${angle}" ${angle === photo.angle ? 'selected' : ''}>${angle}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea id="editDescription" class="form-textarea" rows="3">${photo.description || ''}</textarea>
                </div>

                <div class="modal-actions">
                    <button class="button button-outline" onclick="app.closeModal()">
                        Cancel
                    </button>
                    <button class="button button-primary" onclick="Photos.savePhotoEdit('${photoId}')">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        `;

        window.app?.showModal(modalContent);
    }

    savePhotoEdit(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        photo.category = document.getElementById('editCategory').value;
        photo.angle = document.getElementById('editAngle').value;
        photo.description = document.getElementById('editDescription').value.trim();
        photo.edited = new Date().toISOString();

        // TODO: Save to server via API
        this.savePhotos();
        window.app?.closeModal();
        this.updatePhotoGallery();

        window.app?.showToast('Photo updated successfully', 'success');
    }

    downloadPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const link = document.createElement('a');
        link.href = photo.url || photo.photo_url || '';
        link.download = `${this.currentVehicle.license_plate || 'vehicle'}_${photo.category}_${photo.id}.jpg`;
        link.click();

        window.app?.showToast('Photo downloaded', 'success');
    }

    deletePhoto(photoId) {
        if (confirm('Are you sure you want to delete this photo?')) {
            this.photos = this.photos.filter(p => p.id !== photoId);
            this.savePhotos();
            this.updatePhotoGallery();
            window.app?.showToast('Photo deleted', 'info');
        }
    }

    async downloadSessionReport(sessionId) {
        try {
            // Generate a simple text report for now
            const session = this.photoSessions.find(s => s.id === sessionId);
            if (!session) return;

            const sessionPhotos = this.photos.filter(p =>
                p.vehicle_id === session.vehicle_id && p.category === session.session_type
            );

            const reportData = {
                session: session,
                vehicle: this.currentVehicle,
                customer: this.currentCustomer,
                photos: sessionPhotos.map(p => ({
                    angle: p.angle,
                    description: p.description,
                    timestamp: p.timestamp
                })),
                generated: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `session_report_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            window.app?.showToast('Session report downloaded', 'success');

        } catch (error) {
            console.error('Error downloading session report:', error);
            window.app?.showToast('Failed to download session report', 'error');
        }
    }

    exportPhotos() {
        if (!this.currentVehicle) {
            window.app?.showToast('Please select a vehicle first', 'warning');
            return;
        }

        const vehiclePhotos = this.photos.filter(p => p.vehicle_id === this.currentVehicle.id);

        if (vehiclePhotos.length === 0) {
            window.app?.showToast('No photos to export for this vehicle', 'info');
            return;
        }

        const exportData = {
            vehicle: this.currentVehicle,
            customer: this.currentCustomer,
            export_date: new Date().toISOString(),
            total_photos: vehiclePhotos.length,
            photos: vehiclePhotos.map(photo => ({
                id: photo.id,
                category: photo.category,
                angle: photo.angle,
                description: photo.description,
                timestamp: photo.timestamp,
                filename: `${this.currentVehicle.license_plate || 'vehicle'}_${photo.category}_${photo.id}.jpg`
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicle_photos_${this.currentVehicle.license_plate || 'vehicle'}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        window.app?.showToast('Photo metadata exported successfully', 'success');
    }

    // Utility methods
    getFilteredPhotos() {
        if (!this.currentVehicle) return [];

        let filtered = this.photos.filter(p => p.vehicle_id === this.currentVehicle.id);

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilter);
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getPhotoCount() {
        if (!this.currentVehicle) return 0;
        return this.photos.filter(p => p.vehicle_id === this.currentVehicle.id).length;
    }

    getVehiclePhotoCount(vehicleId) {
        return this.photos.filter(p => p.vehicle_id === vehicleId).length;
    }

    getCategoryPhotoCount(category) {
        if (!this.currentVehicle) return 0;
        return this.photos.filter(p => p.vehicle_id === this.currentVehicle.id && p.category === category).length;
    }

    updatePhotoGallery() {
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid) {
            photosGrid.innerHTML = this.renderPhotoGallery();
        }

        // Update category counts
        const categories = document.querySelectorAll('.photo-category');
        categories.forEach(category => {
            const key = category.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (key) {
                const countElement = category.querySelector('.category-count');
                if (countElement) {
                    countElement.textContent = `${this.getCategoryPhotoCount(key)} photos`;
                }
            }
        });
    }

    savePhotos() {
        try {
            localStorage.setItem('vehicle_photos', JSON.stringify(this.photos));
        } catch (error) {
            console.error('Failed to save photos:', error);
            window.app?.showToast('Failed to save photos locally', 'error');
        }
    }

    renderError(error) {
        const html = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Photo Documentation</h2>
                <p class="error-message">${error.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="button button-primary" onclick="Photos.load()">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="app.goHome()">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;

        if (window.app) {
            window.app.setContent(html);
        }
    }
}

// Create global photos instance
window.Photos = new PhotosModule();

console.log('✅ Enhanced Photos module with session management loaded successfully');