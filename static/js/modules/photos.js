// static/js/modules/photos.js - Complete Camera Module


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
            facingMode: 'environment',
            hasCamera: false,
            isSecureContext: false,
            platform: this.detectPlatform(),
            constraints: {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920, max: 1920, min: 640 },
                    height: { ideal: 1080, max: 1080, min: 480 }
                }
            }
        };

        this.checkCameraSupport();
    }

    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = {
            isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
            isIOS: /iphone|ipad|ipod/i.test(userAgent),
            isAndroid: /android/i.test(userAgent),
            isSafari: /safari/i.test(userAgent) && !/chrome/i.test(userAgent),
            isChrome: /chrome/i.test(userAgent),
            isFirefox: /firefox/i.test(userAgent),
            hasTouch: 'ontouchstart' in window
        };

        console.log('📱 Platform detected:', platform);
        return platform;
    }

    checkCameraSupport() {
        // Check if we're in a secure context
        this.camera.isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

        // Check for camera API support
        this.camera.hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

        console.log('🔒 Security Context:', {
            isSecureContext: this.camera.isSecureContext,
            protocol: location.protocol,
            hostname: location.hostname,
            hasCamera: this.camera.hasCamera
        });
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

        // Load ALL vehicle photos from API
        try {
            this.photos = [];

            // For each vehicle, get its photos
            for (const vehicle of this.vehicles) {
                try {
                    const photosResponse = await fetch(`/api/vehicles/${vehicle.id}/photos`);
                    if (photosResponse.ok) {
                        const photosData = await photosResponse.json();
                        if (photosData.photos && photosData.photos.length > 0) {
                            // Convert API photos to the format expected by photos module
                            const vehiclePhotos = photosData.photos.map(photo => ({
                                id: `api_${photo.id}`,
                                vehicle_id: vehicle.id,
                                customer_id: vehicle.customer_id,
                                category: photo.category || 'vehicle_photo',
                                timestamp: photo.created_at || photo.timestamp,
                                description: photo.caption || photo.description || 'Vehicle photo',
                                filename: photo.filename,
                                size: photo.file_size,
                                source: 'api',
                                url: photo.url,
                                thumbnail_url: photo.thumbnail_url,
                                is_primary: photo.is_primary
                            }));

                            this.photos.push(...vehiclePhotos);
                        }
                    }
                } catch (error) {
                    console.warn(`Error loading photos for vehicle ${vehicle.id}:`, error);
                }
            }

            console.log(`📸 Loaded ${this.photos.length} photos from API`);

            // Also load any localStorage photos for backward compatibility
            try {
                const stored = localStorage.getItem('vehicle_photos');
                if (stored) {
                    const localPhotos = JSON.parse(stored);
                    const formattedLocalPhotos = localPhotos.map(photo => ({
                        ...photo,
                        id: `local_${photo.id}`,
                        source: 'localStorage'
                    }));
                    this.photos.push(...formattedLocalPhotos);
                    console.log(`📸 Also loaded ${localPhotos.length} photos from localStorage`);
                }
            } catch (error) {
                console.error('Error loading localStorage photos:', error);
            }

        } catch (error) {
            console.error('Error loading photos:', error);
            this.photos = [];
        }
    }
    // File Upload Methods
    triggerFileUpload() {
        const fileInput = document.getElementById('photoFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleFileUpload(files) {
        console.log('📁 Handling file upload...', files.length, 'files');

        if (!this.currentVehicle) {
            this.showToast('Please select a vehicle first', 'warning');
            return;
        }

        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                // Validate file
                if (!file.type.startsWith('image/')) {
                    throw new Error(`${file.name} is not an image file`);
                }

                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    throw new Error(`${file.name} is too large (max 10MB)`);
                }

                // Upload to API
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('vehicle_id', this.currentVehicle.id);
                formData.append('caption', `${this.currentCategory} photo - File upload`);
                formData.append('is_primary', '0');

                const response = await fetch('/api/vehicles/photos', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to upload photo');
                }

                const result = await response.json();
                console.log('✅ File uploaded to API:', result);
                successCount++;

                console.log('✅ File processed:', file.name);

            } catch (error) {
                console.error('❌ File processing failed:', error);
                this.showToast(`Failed to process ${file.name}: ${error.message}`, 'error');
            }
        }

        // Refresh photos for this vehicle after all uploads
        if (successCount > 0) {
            await this.refreshVehiclePhotos(this.currentVehicle.id);
            this.showToast(`${successCount} photo(s) uploaded successfully!`, 'success');
        }

        // Clear file input
        document.getElementById('photoFileInput').value = '';
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
            // Save to localStorage (for backward compatibility)
            const photosToSave = this.photos.filter(p => p.source === 'localStorage').map(photo => ({
                ...photo,
                // Don't save blob URLs to localStorage
                url: photo.url && photo.url.startsWith('blob:') ? null : photo.url
            }));

            localStorage.setItem('vehicle_photos', JSON.stringify(photosToSave));
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

    /**
     * Enhanced selectVehicle method with photo refresh
     */
    async selectVehicle(vehicleId) {
        console.log('Selecting vehicle:', vehicleId);
        this.currentVehicle = this.vehicles.find(v => v.id === vehicleId);

        if (this.currentVehicle) {
            // Refresh photos for this vehicle to ensure we have the latest
            await this.refreshVehiclePhotos(vehicleId);
        }

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

        const cameraAvailable = this.camera.hasCamera && this.camera.isSecureContext;

        const modal = this.createModal('Start Photo Session', `
            <h3>Vehicle: ${this.currentVehicle.year || ''} ${this.currentVehicle.make} ${this.currentVehicle.model}</h3>
            <p>Select a category and start documenting this vehicle.</p>
            <p><strong>Current Category:</strong> ${this.currentCategory}</p>

            <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                <h4>📱 Photo Capture Options:</h4>
                ${cameraAvailable ?
                    '<p>✅ <strong>Camera:</strong> Take photos directly with device camera</p>' :
                    '<p>⚠️ <strong>Camera:</strong> Requires HTTPS connection</p>'
                }
                <p>📁 <strong>File Upload:</strong> Select photos from device gallery</p>
            </div>

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
                <img src="${photo.url || photo.thumbnail_url}" alt="Photo" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 400px;">
                <div style="margin-top: 1rem; text-align: left;">
                    <p><strong>Category:</strong> ${photo.category}</p>
                    <p><strong>Description:</strong> ${photo.description || 'No description'}</p>
                    <p><strong>Date:</strong> ${new Date(photo.timestamp).toLocaleString()}</p>
                    <p><strong>Size:</strong> ${this.formatFileSize(photo.size)}</p>
                    ${photo.width ? `<p><strong>Dimensions:</strong> ${photo.width}x${photo.height}</p>` : ''}
                    <p><strong>Source:</strong> ${photo.source === 'camera' ? '📷 Camera' : photo.source === 'api' ? '🌐 API' : '📁 File Upload'}</p>
                </div>
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 4000);
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




    /**
     * Refresh photos for a specific vehicle from API
     */
    async refreshVehiclePhotos(vehicleId) {
        console.log(`🔄 Refreshing photos for vehicle ${vehicleId}`);

        try {
            const response = await fetch(`/api/vehicles/${vehicleId}/photos`);
            if (response.ok) {
                const data = await response.json();

                // Remove old photos for this vehicle
                this.photos = this.photos.filter(p => p.vehicle_id !== vehicleId);

                // Add updated photos
                if (data.photos && data.photos.length > 0) {
                    const vehiclePhotos = data.photos.map(photo => ({
                        id: `api_${photo.id}`,
                        vehicle_id: vehicleId,
                        customer_id: photo.customer_id,
                        category: photo.category || 'vehicle_photo',
                        timestamp: photo.created_at || photo.timestamp,
                        description: photo.caption || photo.description || 'Vehicle photo',
                        filename: photo.filename,
                        size: photo.file_size,
                        source: 'api',
                        url: photo.url,
                        thumbnail_url: photo.thumbnail_url,
                        is_primary: photo.is_primary
                    }));

                    this.photos.push(...vehiclePhotos);
                }

                // Refresh gallery if this vehicle is currently selected
                if (this.currentVehicle && this.currentVehicle.id === vehicleId) {
                    this.refreshGallery();
                }

                console.log(`✅ Refreshed photos for vehicle ${vehicleId}`);
            }
        } catch (error) {
            console.error(`❌ Error refreshing photos for vehicle ${vehicleId}:`, error);
        }
    }

    /**
     * Test photo integration for debugging
     */
    async testPhotoIntegration(vehicleId) {
        console.log(`🧪 Testing photo integration for vehicle ${vehicleId}`);

        try {
            const response = await fetch(`/api/vehicles/${vehicleId}/photos`);
            const data = await response.json();
            console.log('API Response:', data);

            await this.refreshVehiclePhotos(vehicleId);
            const vehiclePhotos = this.photos.filter(p => p.vehicle_id === vehicleId);
            console.log('Photos in module:', vehiclePhotos);

            return { api: data, module: vehiclePhotos };
        } catch (error) {
            console.error('Test failed:', error);
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

            // File upload fallback
            if (e.target.matches('.btn-upload-photo') || e.target.closest('.btn-upload-photo')) {
                e.preventDefault();
                this.triggerFileUpload();
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

        // Handle file input change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'photoFileInput') {
                this.handleFileUpload(e.target.files);
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

                ${this.renderSecurityWarning()}

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

    renderSecurityWarning() {
        if (!this.camera.isSecureContext && this.camera.platform.isMobile) {
            return `
                <div class="security-warning" style="
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    color: #856404;
                ">
                    <h4>🔒 Camera Access Notice</h4>
                    <p><strong>For camera to work on mobile devices, this app needs to be accessed via HTTPS.</strong></p>
                    <p>Current access: <code>${location.protocol}//${location.host}</code></p>
                    <p>📱 <strong>Mobile users:</strong> Camera requires secure connection (HTTPS) on phones and tablets.</p>
                    <p>💻 <strong>Desktop users:</strong> File upload is available as alternative.</p>
                </div>
            `;
        }
        return '';
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
        const cameraSupported = this.camera.hasCamera && this.camera.isSecureContext;

        return `
            <div class="camera-section">
                <h3>📷 Photo Capture</h3>

                ${this.renderCameraStatus()}

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
                        <p>${cameraSupported ? 'Click "Start Camera" to begin' : 'Camera not available - use file upload'}</p>
                        ${!cameraSupported ? '<p style="font-size: 0.9rem; margin-top: 0.5rem;">💡 Tip: Use HTTPS for camera access on mobile</p>' : ''}
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

                <div class="camera-actions" style="margin-top: 1rem; text-align: center; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    ${cameraSupported ? `
                        <button class="button button-primary btn-start-camera" id="startCameraBtn">
                            📷 Start Camera
                        </button>
                        <button class="button button-secondary btn-stop-camera" id="stopCameraBtn" style="display: none;">
                            ⏹️ Stop Camera
                        </button>
                    ` : ''}

                    <button class="button ${cameraSupported ? 'button-outline' : 'button-primary'} btn-upload-photo">
                        📁 Upload Photo
                    </button>
                </div>

                <input type="file" id="photoFileInput" accept="image/*" capture="environment" style="display: none;" multiple>

                <div class="camera-status" id="cameraStatus" style="margin-top: 1rem; text-align: center; color: #7f8c8d;"></div>
            </div>
        `;
    }

    renderCameraStatus() {
        const status = [];

        if (!this.camera.isSecureContext) {
            status.push('⚠️ Insecure connection (HTTP)');
        }

        if (!this.camera.hasCamera) {
            status.push('❌ Camera API not supported');
        }

        if (this.camera.platform.isMobile) {
            status.push('📱 Mobile device detected');
        }

        if (status.length === 0) {
            status.push('✅ Camera ready');
        }

        return `
            <div class="camera-status-info" style="
                background: ${status.some(s => s.includes('⚠️') || s.includes('❌')) ? '#fff3cd' : '#d1ecf1'};
                border: 1px solid ${status.some(s => s.includes('⚠️') || s.includes('❌')) ? '#ffeaa7' : '#bee5eb'};
                border-radius: 6px;
                padding: 0.75rem;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            ">
                ${status.join(' • ')}
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
                        Start documenting this vehicle by taking photos or uploading images.
                    </p>
                </div>
            `;
        }

        return vehiclePhotos.map(photo => `
            <div class="photo-item" data-photo-id="${photo.id}">
                <div class="photo-image" style="background-image: url('${photo.url || photo.thumbnail_url}'); background-size: cover; background-position: center;">
                    ${!photo.url && !photo.thumbnail_url ? '📸' : ''}
                </div>
                <div class="photo-info">
                    <div class="photo-category-badge" style="background: #667eea;">
                        📸 ${photo.category || 'Photo'}
                    </div>
                    <div class="photo-timestamp">${new Date(photo.timestamp).toLocaleString()}</div>
                    <div class="photo-description">${photo.description || photo.filename || 'No description'}</div>
                </div>
            </div>
        `).join('');
    }

    // Camera Methods
    async startCamera() {
        console.log('📷 Starting camera...');

        try {
            this.updateCameraStatus('Checking camera availability...');

            // Enhanced browser and security checks
            if (!this.camera.isSecureContext) {
                throw new Error(`Camera requires HTTPS. Current: ${location.protocol}//${location.host}`);
            }

            if (!this.camera.hasCamera) {
                throw new Error('Camera API not supported in this browser');
            }

            // Get available devices first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                throw new Error('No camera devices found');
            }

            console.log(`📹 Found ${videoDevices.length} camera(s):`, videoDevices.map(d => d.label || 'Camera'));

            this.updateCameraStatus('Requesting camera access...');

            // Enhanced constraints based on platform
            const constraints = { ...this.camera.constraints };

            // Mobile-specific optimizations
            if (this.camera.platform.isMobile) {
                constraints.video.width = { ideal: 1280, max: 1920 };
                constraints.video.height = { ideal: 720, max: 1080 };
            }

            // Request camera access
            this.camera.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Get video element
            this.camera.video = document.getElementById('cameraVideo');
            this.camera.canvas = document.getElementById('cameraCanvas');

            if (!this.camera.video || !this.camera.canvas) {
                throw new Error('Camera elements not found in DOM');
            }

            // Set video stream
            this.camera.video.srcObject = this.camera.stream;
            this.camera.isActive = true;

            // Wait for video to be ready
            await new Promise((resolve, reject) => {
                this.camera.video.onloadedmetadata = () => {
                    console.log(`📹 Video ready: ${this.camera.video.videoWidth}x${this.camera.video.videoHeight}`);
                    resolve();
                };
                this.camera.video.onerror = reject;
                setTimeout(() => reject(new Error('Video load timeout')), 10000);
            });

            // Show video and controls, hide placeholder
            document.getElementById('cameraPlaceholder').style.display = 'none';
            this.camera.video.style.display = 'block';
            document.getElementById('cameraControls').style.display = 'flex';
            document.getElementById('startCameraBtn').style.display = 'none';
            document.getElementById('stopCameraBtn').style.display = 'inline-block';

            this.updateCameraStatus('✅ Camera active - Ready to take photos');
            this.showToast('Camera started successfully!', 'success');
            console.log('✅ Camera started successfully');

        } catch (error) {
            console.error('❌ Camera start failed:', error);

            let userFriendlyMessage = 'Camera failed to start';

            if (error.name === 'NotAllowedError') {
                userFriendlyMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                userFriendlyMessage = 'No camera found on this device.';
            } else if (error.name === 'NotSupportedError') {
                userFriendlyMessage = 'Camera not supported in this browser.';
            } else if (error.message.includes('HTTPS')) {
                userFriendlyMessage = 'Camera requires secure connection (HTTPS)';
            }

            this.updateCameraStatus(`❌ ${userFriendlyMessage}`);
            this.showToast(userFriendlyMessage, 'error');
        }
    }

    async stopCamera() {
        console.log('⏹️ Stopping camera...');

        try {
            // Stop all video tracks
            if (this.camera.stream) {
                this.camera.stream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`📹 Stopped track: ${track.kind}`);
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

            this.updateCameraStatus('Switching camera...');

            // Stop current stream
            if (this.camera.stream) {
                this.camera.stream.getTracks().forEach(track => track.stop());
            }

            // Start with new constraints
            this.camera.stream = await navigator.mediaDevices.getUserMedia(this.camera.constraints);
            this.camera.video.srcObject = this.camera.stream;

            const cameraName = this.camera.facingMode === 'environment' ? 'back' : 'front';
            this.updateCameraStatus(`✅ Switched to ${cameraName} camera`);
            this.showToast(`Switched to ${cameraName} camera`, 'success');

        } catch (error) {
            console.error('❌ Camera switch failed:', error);
            this.updateCameraStatus(`Switch error: ${error.message}`);
            this.showToast(`Failed to switch camera: ${error.message}`, 'error');
        }
    }
 }
// Create global instance
const photosModule = new PhotosModule();
window.photosModule = photosModule;

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
    stopCamera: () => photosModule.stopCamera(),
    testPhotoIntegration: (vehicleId) => photosModule.testPhotoIntegration(vehicleId),
    refreshVehiclePhotos: (vehicleId) => photosModule.refreshVehiclePhotos(vehicleId)
};

console.log('✅ Complete Photos module loaded with working camera functionality');