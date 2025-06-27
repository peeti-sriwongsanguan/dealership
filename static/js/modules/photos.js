// static/js/modules/photos.js - Enhanced Version with Working Camera
// This version includes complete camera functionality

class PhotosModule {
    constructor() {
        this.currentVehicle = null;
        this.currentCategory = 'check-in';
        this.currentSession = null;
        this.photos = [];
        this.vehicles = [];
        this.customers = [];
        this.sessions = [];
        this.isLoading = false;
        this.initialized = false;

        // Camera properties
        this.camera = {
            stream: null,
            video: null,
            canvas: null,
            isActive: false,
            facingMode: 'environment', // 'user' or 'environment'
            constraints: {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 }
                }
            }
        };
    }

    async init() {
        if (this.initialized) return;

        console.log('📸 Initializing Photos module...');

        try {
            await this.loadData();
            this.bindEvents();
            this.initialized = true;
            console.log('✅ Photos module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Photos module:', error);
            throw error;
        }
    }

    async loadData() {
        // Load vehicles
        try {
            const vehiclesResponse = await fetch('/api/vehicles');
            if (vehiclesResponse.ok) {
                const vehiclesData = await vehiclesResponse.json();
                this.vehicles = vehiclesData.vehicles || [];
                console.log(`🚗 Loaded ${this.vehicles.length} vehicles`);
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.vehicles = [];
        }

        // Load customers
        try {
            const customersResponse = await fetch('/api/customers');
            if (customersResponse.ok) {
                const customersData = await customersResponse.json();
                this.customers = customersData.customers || [];
                console.log(`👥 Loaded ${this.customers.length} customers`);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.customers = [];
        }

        // Load photos from localStorage as fallback
        try {
            const stored = localStorage.getItem('vehicle_photos');
            this.photos = stored ? JSON.parse(stored) : [];
            console.log(`📸 Loaded ${this.photos.length} photos`);
        } catch (error) {
            this.photos = [];
        }
    }

    bindEvents() {
        // Bind click events using event delegation
        document.addEventListener('click', (e) => {
            // Vehicle selection
            if (e.target.closest('.vehicle-option')) {
                const vehicleOption = e.target.closest('.vehicle-option');
                const vehicleId = vehicleOption.getAttribute('data-vehicle-id');
                if (vehicleId) {
                    this.selectVehicle(parseInt(vehicleId));
                }
            }

            // Category selection
            if (e.target.closest('.photo-category')) {
                const categoryElement = e.target.closest('.photo-category');
                const category = categoryElement.getAttribute('data-category');
                if (category) {
                    this.selectCategory(category);
                }
            }

            // New session button
            if (e.target.matches('.btn-new-session') || e.target.closest('.btn-new-session')) {
                e.preventDefault();
                this.showNewSessionModal();
            }

            // Camera buttons
            if (e.target.matches('.btn-start-camera') || e.target.closest('.btn-start-camera')) {
                e.preventDefault();
                this.startCamera();
            }

            if (e.target.matches('.capture-btn') || e.target.closest('.capture-btn')) {
                e.preventDefault();
                this.capturePhoto();
            }

            if (e.target.matches('.camera-switch-btn') || e.target.closest('.camera-switch-btn')) {
                e.preventDefault();
                this.switchCamera();
            }

            if (e.target.matches('.btn-stop-camera') || e.target.closest('.btn-stop-camera')) {
                e.preventDefault();
                this.stopCamera();
            }

            // Photo view
            if (e.target.closest('.photo-item')) {
                const photoItem = e.target.closest('.photo-item');
                const photoId = photoItem.getAttribute('data-photo-id');
                if (photoId) {
                    this.viewPhoto(photoId);
                }
            }
        });
    }

    async loadModule() {
        try {
            if (!this.initialized) {
                await this.init();
            }
            return this.render();
        } catch (error) {
            console.error('Error loading photos module:', error);
            return this.renderError();
        }
    }

    render() {
        const html = `
            <div class="photos-section">
                <div class="action-bar">
                    <h2 class="action-bar-title">📸 Vehicle Photo Documentation</h2>
                    <div class="action-bar-actions">
                        <button class="button button-primary btn-new-session">
                            📷 New Session
                        </button>
                    </div>
                </div>

                <div class="vehicle-selector">
                    <h3>🚗 Select Vehicle for Photo Documentation</h3>
                    <div class="vehicle-grid">
                        ${this.renderVehicleOptions()}
                    </div>
                </div>

                ${this.currentVehicle ? this.renderPhotoInterface() : ''}
            </div>
        `;

        return html;
    }

    renderVehicleOptions() {
        if (this.vehicles.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d; grid-column: 1 / -1;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🚗</div>
                    <p>No vehicles available for photo documentation.</p>
                    <p>Please add vehicles first in the Vehicles section.</p>
                </div>
            `;
        }

        return this.vehicles.map(vehicle => {
            const isSelected = this.currentVehicle && this.currentVehicle.id === vehicle.id;
            return `
                <div class="vehicle-option ${isSelected ? 'selected' : ''}" data-vehicle-id="${vehicle.id}">
                    <div class="vehicle-icon">🚐</div>
                    <div class="vehicle-name">${vehicle.year || ''} ${vehicle.make} ${vehicle.model}</div>
                    <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                        ${vehicle.license_plate || 'No Plate'} • ${vehicle.customer_name || 'Customer'}
                    </div>
                    <div style="font-size: 0.8rem; color: #667eea; margin-top: 0.25rem;">
                        ${this.getVehiclePhotoCount(vehicle.id)} photos
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPhotoInterface() {
        return `
            <div class="photo-categories">
                ${this.renderPhotoCategories()}
            </div>

            ${this.renderCameraSection()}

            <div class="photo-gallery">
                <div class="gallery-header">
                    <h3 class="gallery-title">📂 Photo Gallery - ${this.getVehiclePhotoCount(this.currentVehicle.id)} Photos</h3>
                </div>
                <div class="photos-grid">
                    ${this.renderPhotoGallery()}
                </div>
            </div>
        `;
    }

    renderCameraSection() {
        return `
            <div class="camera-section">
                <h3>📷 Camera</h3>
                <div class="camera-container" id="cameraContainer">
                    <video id="cameraVideo" class="camera-video" autoplay muted playsinline style="display: none;"></video>
                    <canvas id="cameraCanvas" class="camera-canvas" style="display: none;"></canvas>

                    <div class="camera-placeholder" id="cameraPlaceholder" style="
                        width: 100%;
                        height: 300px;
                        background: #f0f0f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        border-radius: 15px;
                        color: #7f8c8d;
                    ">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📸</div>
                        <p>Click "Start Camera" to begin taking photos</p>
                    </div>

                    <div class="camera-controls" id="cameraControls" style="display: none;">
                        <button class="camera-switch-btn" title="Switch Camera">
                            🔄
                        </button>
                        <button class="capture-btn" title="Take Photo">
                            📸
                        </button>
                    </div>
                </div>

                <div class="camera-actions" style="margin-top: 1rem; text-align: center;">
                    <button class="button button-primary btn-start-camera" id="startCameraBtn">
                        📷 Start Camera
                    </button>
                    <button class="button button-secondary btn-stop-camera" id="stopCameraBtn" style="display: none;">
                        ⏹️ Stop Camera
                    </button>
                </div>

                <div class="camera-status" id="cameraStatus" style="margin-top: 1rem; text-align: center; color: #7f8c8d;"></div>
            </div>
        `;
    }

    renderPhotoCategories() {
        const categories = {
            'check-in': { name: 'Check-In Photos', icon: '📥', color: '#3498db' },
            'damage': { name: 'Damage Documentation', icon: '🔍', color: '#e74c3c' },
            'service': { name: 'Service Photos', icon: '🔧', color: '#27ae60' },
            'check-out': { name: 'Check-Out Photos', icon: '📤', color: '#2c3e50' }
        };

        return Object.entries(categories).map(([key, category]) => {
            const isActive = this.currentCategory === key;
            return `
                <div class="photo-category ${isActive ? 'active' : ''}"
                     data-category="${key}"
                     style="background: ${category.color};">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${this.getCategoryPhotoCount(key)} photos</div>
                </div>
            `;
        }).join('');
    }

    renderPhotoGallery() {
        const vehiclePhotos = this.photos.filter(p => p.vehicle_id === this.currentVehicle.id);

        if (vehiclePhotos.length === 0) {
            return `
                <div class="photos-empty-state">
                    <div class="photos-empty-icon">📸</div>
                    <h3 class="photos-empty-title">No photos yet</h3>
                    <p class="photos-empty-description">
                        Start documenting this vehicle by taking photos with the camera above.
                    </p>
                </div>
            `;
        }

        return vehiclePhotos.map(photo => `
            <div class="photo-item" data-photo-id="${photo.id}">
                <div class="photo-image" style="background-image: url('${photo.url}'); background-size: cover; background-position: center;">
                    ${!photo.url ? '📸' : ''}
                </div>
                <div class="photo-info">
                    <div class="photo-category-badge" style="background: #667eea;">
                        📸 ${photo.category || 'Photo'}
                    </div>
                    <div class="photo-timestamp">${new Date(photo.timestamp).toLocaleString()}</div>
                    <div class="photo-description">${photo.description || 'No description'}</div>
                </div>
            </div>
        `).join('');
    }

    // Camera Methods
    async startCamera() {
        console.log('📷 Starting camera...');

        try {
            this.updateCameraStatus('Requesting camera access...');

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }

            // Request camera access
            this.camera.stream = await navigator.mediaDevices.getUserMedia(this.camera.constraints);

            // Get video element
            this.camera.video = document.getElementById('cameraVideo');
            this.camera.canvas = document.getElementById('cameraCanvas');

            if (!this.camera.video || !this.camera.canvas) {
                throw new Error('Camera elements not found');
            }

            // Set video stream
            this.camera.video.srcObject = this.camera.stream;
            this.camera.isActive = true;

            // Show video and controls, hide placeholder
            document.getElementById('cameraPlaceholder').style.display = 'none';
            this.camera.video.style.display = 'block';
            document.getElementById('cameraControls').style.display = 'flex';
            document.getElementById('startCameraBtn').style.display = 'none';
            document.getElementById('stopCameraBtn').style.display = 'inline-block';

            this.updateCameraStatus('Camera active - Ready to take photos');
            console.log('✅ Camera started successfully');

        } catch (error) {
            console.error('❌ Camera start failed:', error);
            this.updateCameraStatus(`Camera error: ${error.message}`);
            this.showToast(`Camera failed: ${error.message}`, 'error');
        }
    }

    async stopCamera() {
        console.log('⏹️ Stopping camera...');

        try {
            // Stop all video tracks
            if (this.camera.stream) {
                this.camera.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.camera.stream = null;
            }

            // Reset video element
            if (this.camera.video) {
                this.camera.video.srcObject = null;
                this.camera.video.style.display = 'none';
            }

            // Hide controls, show placeholder
            document.getElementById('cameraControls').style.display = 'none';
            document.getElementById('cameraPlaceholder').style.display = 'flex';
            document.getElementById('startCameraBtn').style.display = 'inline-block';
            document.getElementById('stopCameraBtn').style.display = 'none';

            this.camera.isActive = false;
            this.updateCameraStatus('Camera stopped');
            console.log('✅ Camera stopped successfully');

        } catch (error) {
            console.error('❌ Camera stop failed:', error);
            this.updateCameraStatus(`Stop error: ${error.message}`);
        }
    }

    async switchCamera() {
        console.log('🔄 Switching camera...');

        try {
            // Toggle facing mode
            this.camera.facingMode = this.camera.facingMode === 'environment' ? 'user' : 'environment';
            this.camera.constraints.video.facingMode = this.camera.facingMode;

            // Stop current stream
            if (this.camera.stream) {
                this.camera.stream.getTracks().forEach(track => track.stop());
            }

            // Start with new constraints
            this.camera.stream = await navigator.mediaDevices.getUserMedia(this.camera.constraints);
            this.camera.video.srcObject = this.camera.stream;

            this.updateCameraStatus(`Camera switched to ${this.camera.facingMode === 'environment' ? 'back' : 'front'} camera`);
            this.showToast(`Switched to ${this.camera.facingMode === 'environment' ? 'back' : 'front'} camera`, 'success');

        } catch (error) {
            console.error('❌ Camera switch failed:', error);
            this.updateCameraStatus(`Switch error: ${error.message}`);
            this.showToast(`Failed to switch camera: ${error.message}`, 'error');
        }
    }

    async capturePhoto() {
        console.log('📸 Capturing photo...');

        try {
            if (!this.camera.isActive || !this.camera.video || !this.camera.canvas) {
                throw new Error('Camera not active');
            }

            if (!this.currentVehicle) {
                throw new Error('No vehicle selected');
            }

            // Set canvas size to video size
            this.camera.canvas.width = this.camera.video.videoWidth;
            this.camera.canvas.height = this.camera.video.videoHeight;

            // Draw video frame to canvas
            const ctx = this.camera.canvas.getContext('2d');
            ctx.drawImage(this.camera.video, 0, 0);

            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                this.camera.canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });

            if (!blob) {
                throw new Error('Failed to create image');
            }

            // Create photo data
            const photoData = {
                id: this.generateId(),
                vehicle_id: this.currentVehicle.id,
                category: this.currentCategory,
                timestamp: new Date().toISOString(),
                description: `${this.currentCategory} photo`,
                size: blob.size,
                url: URL.createObjectURL(blob) // Create temporary URL for display
            };

            // Add to photos array
            this.photos.push(photoData);

            // Save to localStorage
            this.savePhotos();

            // Show success
            this.showToast('Photo captured successfully!', 'success');

            // Refresh gallery
            this.refreshGallery();

            console.log('✅ Photo captured:', photoData);

        } catch (error) {
            console.error('❌ Photo capture failed:', error);
            this.showToast(`Capture failed: ${error.message}`, 'error');
        }
    }

    updateCameraStatus(message) {
        const statusElement = document.getElementById('cameraStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log(`📷 Camera Status: ${message}`);
    }

    savePhotos() {
        try {
            // Save to localStorage (in real app, would save to server)
            localStorage.setItem('vehicle_photos', JSON.stringify(this.photos));
            console.log('💾 Photos saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save photos:', error);
        }
    }

    refreshGallery() {
        const photosGrid = document.querySelector('.photos-grid');
        if (photosGrid) {
            photosGrid.innerHTML = this.renderPhotoGallery();
        }
    }

    selectVehicle(vehicleId) {
        console.log('Selecting vehicle:', vehicleId);
        this.currentVehicle = this.vehicles.find(v => v.id === vehicleId);
        this.refreshContent();
    }

    selectCategory(category) {
        console.log('Selecting category:', category);
        this.currentCategory = category;
        this.refreshContent();
    }

    refreshContent() {
        const contentContainer = document.getElementById('dynamicContent');
        if (contentContainer) {
            contentContainer.innerHTML = this.render();
        }
    }

    showNewSessionModal() {
        if (!this.currentVehicle) {
            this.showToast('Please select a vehicle first', 'warning');
            return;
        }

        const modal = this.createModal('Start Photo Session', `
            <h3>Vehicle: ${this.currentVehicle.year || ''} ${this.currentVehicle.make} ${this.currentVehicle.model}</h3>
            <p>Select a category and start taking photos using the camera.</p>
            <p><strong>Current Category:</strong> ${this.currentCategory}</p>

            <div style="margin-top: 2rem;">
                <button class="button button-outline" onclick="this.closest('.modal-overlay').style.display='none'">
                    Close
                </button>
                <button class="button button-primary" onclick="this.closest('.modal-overlay').style.display='none'">
                    Start Taking Photos
                </button>
            </div>
        `);

        document.body.appendChild(modal);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-container" style="
                background: white;
                border-radius: 10px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div class="modal-header" style="margin-bottom: 1rem;">
                    <h2>${title}</h2>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    viewPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const modal = this.createModal('Photo View', `
            <div style="text-align: center;">
                <img src="${photo.url}" alt="Photo" style="max-width: 100%; height: auto; border-radius: 8px;">
                <p style="margin-top: 1rem;">${photo.description || 'No description'}</p>
                <p><small>${new Date(photo.timestamp).toLocaleString()}</small></p>
                <p><small>Size: ${this.formatFileSize(photo.size)}</small></p>
                <button class="button button-outline" onclick="this.closest('.modal-overlay').remove()" style="margin-top: 1rem;">
                    Close
                </button>
            </div>
        `);

        document.body.appendChild(modal);
    }

    showToast(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        // Create simple toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 1001;
            max-width: 300px;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getVehiclePhotoCount(vehicleId) {
        return this.photos.filter(p => p.vehicle_id === vehicleId).length;
    }

    getCategoryPhotoCount(category) {
        if (!this.currentVehicle) return 0;
        return this.photos.filter(p =>
            p.vehicle_id === this.currentVehicle.id && p.category === category
        ).length;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateId() {
        return 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderError() {
        return `
            <div class="error-container" style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h2>Failed to Load Photos</h2>
                <p>There was an error loading the photo documentation system.</p>
                <button class="button button-primary" onclick="photosModule.loadModule().then(content => {
                    const container = document.getElementById('dynamicContent');
                    if (container) container.innerHTML = content;
                })">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Create global instance
const photosModule = new PhotosModule();

// Legacy compatibility
window.Photos = {
    load: async function() {
        try {
            const content = await photosModule.loadModule();
            if (window.app && window.app.setContent) {
                window.app.setContent(content);
            } else {
                // Fallback - directly set content
                const container = document.getElementById('dynamicContent');
                if (container) {
                    container.innerHTML = content;
                }
            }
            return content;
        } catch (error) {
            console.error('Error in Photos.load():', error);
            const errorContent = photosModule.renderError();
            if (window.app && window.app.setContent) {
                window.app.setContent(errorContent);
            }
            return errorContent;
        }
    },

    selectVehicle: (vehicleId) => photosModule.selectVehicle(vehicleId),
    selectCategory: (category) => photosModule.selectCategory(category),
    showNewSessionModal: () => photosModule.showNewSessionModal(),
    startCamera: () => photosModule.startCamera(),
    capturePhoto: () => photosModule.capturePhoto(),
    stopCamera: () => photosModule.stopCamera()
};

console.log('✅ Photos module loaded successfully with working camera functionality');