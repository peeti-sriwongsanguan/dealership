// static/js/modules/vehicles.js - Vehicle Management Module

class VehiclesModule {
    constructor() {
        this.vehicles = [];
        this.customers = [];
        this.currentVehicle = null;
        this.isLoading = false;
        this.elements = {};

        // Vehicle types and makes
        this.vehicleTypes = ['Car', 'Truck', 'Van', 'SUV', 'Motorcycle', 'Bus', 'Trailer', 'RV'];
        this.vehicleMakes = [
            'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
            'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus',
            'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Ram',
            'Jeep', 'Chrysler', 'Dodge', 'Mitsubishi', 'Volvo', 'Jaguar', 'Land Rover'
        ];
    }

    async init() {
        console.log('🚗 Initializing Vehicles module...');
        try {
            await this.loadVehicles();
            await this.loadCustomers();
            console.log('✅ Vehicles module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Vehicles module:', error);
            throw error;
        }
    }

    /**
     * Load module for new app structure - returns HTML content
     */
    async loadModule() {
        console.log('🚗 Loading vehicles module for new app...');

        try {
            // Load fresh data
            await this.loadVehicles();
            await this.loadCustomers();

            // Return HTML content
            return this.getHTML();

        } catch (error) {
            console.error('Failed to load vehicles module:', error);
            return this.getErrorHTML(error);
        }
    }

    /**
     * Get HTML content for the vehicles section
     */
    getHTML() {
        return `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🚗 Vehicle Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="window.Vehicles.exportVehicles()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="window.Vehicles.showAddModal()">
                            ➕ Add Vehicle
                        </button>
                    </div>
                </div>

                <!-- Vehicle Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🚗</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.vehicles.length}</div>
                            <div class="stat-label">Total Vehicles</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🏭</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getUniqueMakes()}</div>
                            <div class="stat-label">Different Makes</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getAverageYear()}</div>
                            <div class="stat-label">Average Year</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🛣️</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getAverageMileage()}</div>
                            <div class="stat-label">Avg Mileage</div>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Filters -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Vehicle Directory</h3>
                        <div class="data-table-actions">
                            <div class="filters-container">
                                <select class="form-input filter-select" onchange="window.Vehicles.filterByType(this.value)">
                                    <option value="">All Types</option>
                                    ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                                <select class="form-input filter-select" onchange="window.Vehicles.filterByMake(this.value)">
                                    <option value="">All Makes</option>
                                    ${this.getUniqueVehicleMakes().map(make => `<option value="${make}">${make}</option>`).join('')}
                                </select>
                                <div class="search-container">
                                    <input
                                        type="text"
                                        placeholder="Search vehicles..."
                                        class="form-input"
                                        style="width: 300px;"
                                        oninput="window.Vehicles.filterVehicles(this.value)"
                                    >
                                    <span class="search-icon">🔍</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderVehicleTable()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    getErrorHTML(error) {
        return `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Vehicles</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.olServiceApp.loadSection('vehicles')">
                        🔄 Retry
                    </button>
                    <button class="btn btn-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    async loadVehicles() {
        try {
            const response = await fetch('/api/vehicles');
            const data = await response.json();
            this.vehicles = data.vehicles || [];
            console.log(`🚗 Loaded ${this.vehicles.length} vehicles`);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            this.vehicles = [];
            throw error;
        }
    }

    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();
            this.customers = data.customers || [];
            console.log(`👥 Loaded ${this.customers.length} customers for vehicles`);
        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
        }
    }

    async load() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await this.loadVehicles();
            await this.loadCustomers();
            this.render();
        } catch (error) {
            console.error('Failed to load vehicles section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const html = this.getHTML();

        if (window.app) {
            window.app.setContent(html);
        }
    }

    renderVehicleTable() {
        if (this.vehicles.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Owner</th>
                            <th>Details</th>
                            <th>Mileage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.vehicles.map(vehicle => this.renderVehicleRow(vehicle)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ============================================================================
    // FOR VEHICLES MODULE - Enhanced vehicle row rendering with photos
    // ============================================================================

    /**
     * Enhanced renderVehicleRow with photo support
     * Replace the existing renderVehicleRow method in VehiclesModule
     */
    renderVehicleRow(vehicle) {
        return `
            <tr onclick="window.Vehicles.viewVehicle(${vehicle.id})" class="table-row-clickable">
                <td>
                    <div class="vehicle-info">
                        <div class="vehicle-avatar-container">
                            ${this.renderVehicleAvatar(vehicle)}
                        </div>
                        <div class="vehicle-details">
                            <div class="vehicle-name">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                            <div class="vehicle-plate">
                                ${vehicle.license_plate ? `🚗 ${vehicle.license_plate}` : 'No plate'}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="owner-info">
                        <div class="owner-name">${vehicle.customer_name || 'Unknown Owner'}</div>
                        <div class="owner-id">ID: ${vehicle.customer_id}</div>
                    </div>
                </td>
                <td>
                    <div class="vehicle-specs">
                        <div><strong>VIN:</strong> ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}</div>
                        <div><strong>Year:</strong> ${vehicle.year}</div>
                    </div>
                </td>
                <td>
                    <div class="mileage-info">
                        <div class="mileage-number">${vehicle.mileage?.toLocaleString() || 'N/A'}</div>
                        <div class="mileage-label">miles</div>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Vehicles.editVehicle(${vehicle.id})"
                            title="Edit Vehicle"
                        >
                            ✏️
                        </button>
                        <button
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Vehicles.viewHistory(${vehicle.id})"
                            title="Service History"
                        >
                            📋
                        </button>
                        <button
                            class="btn btn-sm btn-outline"
                            onclick="event.stopPropagation(); window.Vehicles.managePhotos(${vehicle.id})"
                            title="Manage Photos"
                        >
                            📷
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render vehicle avatar with photo support
     */
    renderVehicleAvatar(vehicle) {
        if (vehicle.photo_url || vehicle.photos) {
            // If vehicle has photos, show the primary photo
            const primaryPhoto = vehicle.photo_url || (vehicle.photos && vehicle.photos[0]?.url);

            return `
                <div class="vehicle-photo-avatar" style="background: ${this.getVehicleColor(vehicle.make)}">
                    <img
                        src="${primaryPhoto}"
                        alt="${vehicle.year} ${vehicle.make} ${vehicle.model}"
                        class="vehicle-photo-img"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    >
                    <div class="vehicle-icon-fallback" style="display: none;">
                        ${this.getVehicleIcon(vehicle.make)}
                    </div>
                    <div class="photo-indicator">📷</div>
                </div>
            `;
        } else {
            // Default avatar with icon
            return `
                <div class="avatar" style="background: ${this.getVehicleColor(vehicle.make)}">
                    ${this.getVehicleIcon(vehicle.make)}
                    <div class="no-photo-indicator" title="No photo available">📷</div>
                </div>
            `;
        }
    }

    /**
     * NEW METHOD: Manage vehicle photos (main entry point)
     * ADD this new method to VehiclesModule
     */
    async managePhotos(vehicleId) {
        console.log('📷 Managing photos for vehicle:', vehicleId);

        // Find the vehicle
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            if (typeof showToast === 'function') {
                showToast('Vehicle not found', 'error');
            }
            return;
        }

        // Show photo management options
        const modalContent = `
            <div class="modal-header">
                <h2>📷 Photo Management - ${vehicle.year} ${vehicle.make} ${vehicle.model}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="photo-management-options">
                    <div class="management-option" onclick="window.Vehicles.viewVehiclePhotos(${vehicleId})">
                        <div class="option-icon">👁️</div>
                        <div class="option-content">
                            <h3>View Photos</h3>
                            <p>Browse existing vehicle photos</p>
                        </div>
                    </div>

                    <div class="management-option" onclick="window.Vehicles.addVehiclePhoto(${vehicleId})">
                        <div class="option-icon">📷</div>
                        <div class="option-content">
                            <h3>Add Photos</h3>
                            <p>Upload new vehicle photos</p>
                        </div>
                    </div>

                    <div class="management-option" onclick="window.Vehicles.openPhotoSession(${vehicleId})">
                        <div class="option-icon">📸</div>
                        <div class="option-content">
                            <h3>Photo Session</h3>
                            <p>Start professional documentation</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * NEW METHOD: View vehicle photos
     * ADD this new method to VehiclesModule
     */
    async viewVehiclePhotos(vehicleId) {
        console.log('📷 Viewing photos for vehicle:', vehicleId);

        try {
            // Fetch vehicle photos from API
            const response = await fetch(`/api/vehicles/${vehicleId}/photos`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load photos');
            }

            const photos = data.photos || [];
            const vehicle = data.vehicle || { id: vehicleId };

            const modalContent = `
                <div class="modal-header">
                    <h2>📷 Vehicle Photos - ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="photo-gallery-header">
                        <div class="photo-count">
                            Total Photos: <strong>${photos.length}</strong>
                        </div>
                        <button class="button button-primary" onclick="window.Vehicles.addVehiclePhoto(${vehicleId})">
                            📷 Add Photo
                        </button>
                    </div>

                    ${photos.length > 0 ? `
                        <div class="photo-gallery">
                            ${photos.map((photo, index) => `
                                <div class="photo-gallery-item" data-photo-id="${photo.id}">
                                    <img
                                        src="${photo.url}"
                                        alt="Vehicle Photo ${index + 1}"
                                        class="gallery-photo"
                                        onclick="window.Vehicles.viewFullPhoto('${photo.url}', '${photo.caption || ''}')"
                                    >
                                    <div class="photo-overlay">
                                        <div class="photo-actions">
                                            <button class="photo-action-btn" onclick="window.Vehicles.setAsPrimaryPhoto(${photo.id}, ${vehicleId})" title="Set as Primary">
                                                ${photo.is_primary ? '⭐' : '☆'}
                                            </button>
                                            <button class="photo-action-btn" onclick="window.Vehicles.editPhotoCaption(${photo.id})" title="Edit Caption">
                                                ✏️
                                            </button>
                                            <button class="photo-action-btn delete" onclick="window.Vehicles.deletePhoto(${photo.id}, ${vehicleId})" title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    ${photo.caption ? `
                                        <div class="photo-caption">${photo.caption}</div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-photos-state">
                            <div class="no-photos-icon">📷</div>
                            <h3>No Photos Available</h3>
                            <p>This vehicle has no photos yet. Add some photos to help identify and showcase the vehicle.</p>
                            <button class="button button-primary" onclick="window.Vehicles.addVehiclePhoto(${vehicleId})">
                                📷 Add First Photo
                            </button>
                        </div>
                    `}
                </div>
            `;

            // Show modal
            const modalOverlay = document.getElementById('modalOverlay');
            const modalContainer = document.getElementById('modalContainer');

            if (modalOverlay && modalContainer) {
                modalContainer.innerHTML = modalContent;
                modalOverlay.classList.add('active');
                modalOverlay.style.display = 'flex';
                modalOverlay.style.opacity = '1';
                modalOverlay.style.visibility = 'visible';
                document.body.style.overflow = 'hidden';
            }

        } catch (error) {
            console.error('❌ Error loading vehicle photos:', error);
            window.showToast('Failed to load vehicle photos', 'error');
        }
    }

    /**
     * NEW METHOD: Add vehicle photo
     * ADD this new method to VehiclesModule
     */
    addVehiclePhoto(vehicleId) {
        const modalContent = `
            <div class="modal-header">
                <h2>📷 Add Vehicle Photo</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="addPhotoForm" onsubmit="window.Vehicles.handlePhotoUpload(event, ${vehicleId})">
                    <div class="form-group">
                        <label class="form-label required">Select Photo</label>
                        <input
                            type="file"
                            name="photo"
                            class="form-input"
                            accept="image/*"
                            required
                            onchange="window.Vehicles.previewPhoto(this)"
                        >
                        <small class="form-help">Supported formats: JPG, PNG, WebP (Max 5MB)</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Photo Caption</label>
                        <input
                            type="text"
                            name="caption"
                            class="form-input"
                            placeholder="e.g., Front view, Interior, After repair..."
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" name="is_primary" value="1"> Set as primary photo
                        </label>
                    </div>

                    <div id="photoPreview" class="photo-preview" style="display: none;">
                        <img id="previewImage" src="" alt="Preview">
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            📷 Upload Photo
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * NEW METHOD: Open photo session (integrates with your existing photos module)
     * ADD this new method to VehiclesModule
     */
    openPhotoSession(vehicleId) {
        // Close current modal
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }

        // Open the Photos module with this vehicle selected
        setTimeout(() => {
            if (window.olServiceApp && typeof window.olServiceApp.loadSection === 'function') {
                window.olServiceApp.loadSection('photos');

                // After photos module loads, select this vehicle
                setTimeout(() => {
                    if (window.Photos && typeof window.Photos.selectVehicle === 'function') {
                        window.Photos.selectVehicle(vehicleId);
                    }
                }, 500);
            }
        }, 300);
    }

    /**
     * NEW METHOD: Preview photo before upload
     * ADD this new method to VehiclesModule
     */
    previewPhoto(input) {
        const preview = document.getElementById('photoPreview');
        const previewImg = document.getElementById('previewImage');

        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                window.showToast('Photo size must be less than 5MB', 'error');
                input.value = '';
                preview.style.display = 'none';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    }

    /**
     * NEW METHOD: Handle photo upload
     * ADD this new method to VehiclesModule
     */
    async handlePhotoUpload(event, vehicleId) {
        event.preventDefault();

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Uploading...';

            const formData = new FormData(form);
            formData.append('vehicle_id', vehicleId);

            const response = await fetch('/api/vehicles/photos', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload photo');
            }

            window.showToast('✅ Photo uploaded successfully!', 'success');
            window.closeModal();

            // Refresh vehicle data
            await this.loadVehicles();

            // Refresh the vehicles section if currently displayed
            if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                window.olServiceApp.loadSection('vehicles');
            }

        } catch (error) {
            console.error('❌ Error uploading photo:', error);
            window.showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '📷 Upload Photo';
        }
    }
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🚗</div>
                <h3 class="empty-state-title">No vehicles found</h3>
                <p class="empty-state-description">
                    Start by adding vehicles to your fleet management system.
                </p>
                <button class="btn btn-primary" onclick="window.Vehicles.showAddModal()">
                    ➕ Add First Vehicle
                </button>
            </div>
        `;
    }


    /**
     * Show improved add vehicle modal
     */
    showAddModal() {
        console.log('🚗 Opening add vehicle modal...');

        // Check if customers are available
        if (!this.customers || this.customers.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Please add customers first before adding vehicles', 'warning');
            }
            return;
        }

        // Get modal elements directly
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Generate current year for max year validation
        const currentYear = new Date().getFullYear();

        // Set modal content
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>➕ Add New Vehicle</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Vehicles.submitVehicle(event)">
                    <!-- Vehicle Basic Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Information</h3>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Make</label>
                                <select name="make" class="form-input" required onchange="window.Vehicles.onMakeChange(this)">
                                    <option value="">Select make</option>
                                    ${this.vehicleMakes.map(make => `<option value="${make}">${make}</option>`).join('')}
                                    <option value="other">Other (Custom)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label required">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    class="form-input"
                                    placeholder="Enter model"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    class="form-input"
                                    placeholder="e.g. ${currentYear}"
                                    min="1900"
                                    max="${currentYear + 2}"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Vehicle Type</label>
                                <select name="vehicle_type" class="form-input">
                                    ${this.vehicleTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">License Plate</label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    class="form-input"
                                    placeholder="ABC123"
                                    style="text-transform: uppercase;"
                                    maxlength="10"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    class="form-input"
                                    placeholder="e.g. Silver, Blue"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Vehicle Details -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Details</h3>

                        <div class="form-group">
                            <label class="form-label">VIN (Vehicle Identification Number)</label>
                            <input
                                type="text"
                                name="vin"
                                class="form-input"
                                placeholder="1HGCM82633A123456"
                                maxlength="17"
                                style="text-transform: uppercase;"
                                oninput="window.Vehicles.validateVIN(this)"
                            >
                            <small class="form-help">17 characters - Leave blank if unknown</small>
                            <div id="vinError" class="form-error" style="display: none;"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Mileage</label>
                                <input
                                    type="number"
                                    name="mileage"
                                    class="form-input"
                                    placeholder="e.g. 50000"
                                    min="0"
                                    max="999999"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Engine Size</label>
                                <input
                                    type="text"
                                    name="engine_size"
                                    class="form-input"
                                    placeholder="e.g. 2.0L, V6"
                                >
                            </div>

                            <div class="form-section">
                                <h3 class="form-section-title">🛡️ Insurance Information</h3>
                                <div class="form-row">
                                     <div class="form-group">
                                        <label class="form-label">Insurance Company</label>
                                        <input type="text" name="insurance_company" class="form-input" placeholder="e.g. Progressive">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Policy Number</label>
                                        <input type="text" name="insurance_policy_number" class="form-input" placeholder="e.g. ABC123456789">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Insurance Class</label>
                                        <select name="insurance_class" class="form-input">
                                            <option value="">Select Class</option>
                                            <option value="1">Class 1 - Full Coverage</option>
                                            <option value="2">Class 2</option>
                                            <option value="3">Class 3 - Liability Only</option>
                                            <option value="4">Class 4</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Expiration Date</label>
                                        <input type="date" name="insurance_expiration_date" class="form-input">
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- Owner Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Owner Information</h3>

                        <div class="form-group">
                            <label class="form-label required">Vehicle Owner</label>
                            <select name="customer_id" class="form-input" required>
                                <option value="">Select customer</option>
                                ${this.customers
                                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                    .map(customer =>
                                        `<option value="${customer.id}">${customer.name || 'Unnamed Customer'} (ID: ${customer.id})</option>`
                                    ).join('')}
                            </select>
                            <small class="form-help">
                                Don't see the customer?
                                <a href="#" onclick="window.Vehicles.openCustomerModal(); return false;">Add new customer</a>
                            </small>
                        </div>
                    </div>

                    <!-- Additional Notes -->
                    <div class="form-section">
                        <h3 class="form-section-title">Additional Information</h3>

                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea
                                name="notes"
                                class="form-textarea"
                                placeholder="Any additional notes about the vehicle..."
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log('✅ Add vehicle modal displayed');
    }

    /**
     * Handle add vehicle form submission (replaces submitVehicle)
     */
    async submitVehicle(event) {
        event.preventDefault();
        console.log('🚗 Submitting vehicle form...');

        // Prevent double submission
        if (this.isLoading) {
            console.log('Already submitting...');
            return;
        }

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            this.isLoading = true;
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);

            // Build vehicle data object
            const vehicleData = {
                make: formData.get('make').trim(),
                model: formData.get('model').trim(),
                year: parseInt(formData.get('year')),
                vehicle_type: formData.get('vehicle_type') || 'Car',
                license_plate: formData.get('license_plate').trim().toUpperCase(),
                color: formData.get('color').trim(),
                vin: formData.get('vin').trim().toUpperCase(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : null,
                engine_size: formData.get('engine_size').trim(),
                customer_id: parseInt(formData.get('customer_id')),
                insurance_company: formData.get('insurance_company'),
                insurance_policy_number: formData.get('insurance_policy_number'),
                insurance_class: formData.get('insurance_class'),
                insurance_expiration_date: formData.get('insurance_expiration_date'),
                notes: formData.get('notes').trim()
            };

            // Client-side validation
            const validationResult = this.validateVehicleData(vehicleData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            console.log('Sending vehicle data:', vehicleData);

            // Submit to API
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Vehicle created:', result);

                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('✅ Vehicle added successfully!', 'success');
                }

                // Close the modal
                if (typeof window.closeModal === 'function') {
                    window.closeModal();
                }

                // Refresh the vehicle list
                await this.loadVehicles();

                // Refresh the display if we're in the vehicles section
                if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                    window.olServiceApp.loadSection('vehicles');
                }

            } else {
                throw new Error(result.error || 'Failed to add vehicle');
            }

        } catch (error) {
            console.error('❌ Error adding vehicle:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`❌ ${error.message}`, 'error');
            }
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Vehicle';
        }
    }

    /**
     * Validate vehicle data
     */
    validateVehicleData(data) {
        // Required fields validation
        if (!data.make || !data.model || !data.year || !data.customer_id) {
            return {
                isValid: false,
                message: 'Please fill in all required fields (Make, Model, Year, Owner)'
            };
        }

        // Year validation
        const currentYear = new Date().getFullYear();
        if (data.year < 1900 || data.year > currentYear + 2) {
            return {
                isValid: false,
                message: `Year must be between 1900 and ${currentYear + 2}`
            };
        }

        // VIN validation (if provided)
        if (data.vin && data.vin.length > 0 && data.vin.length !== 17) {
            return {
                isValid: false,
                message: 'VIN must be exactly 17 characters if provided'
            };
        }

        // Mileage validation
        if (data.mileage && (data.mileage < 0 || data.mileage > 999999)) {
            return {
                isValid: false,
                message: 'Mileage must be between 0 and 999,999'
            };
        }

        return { isValid: true };
    }

    /**
     * Handle make selection change
     */
    onMakeChange(selectElement) {
        const customMakeGroup = document.getElementById('customMakeGroup');

        if (selectElement.value === 'other') {
            // If "Other" is selected, show custom input
            if (!customMakeGroup) {
                const customInput = document.createElement('div');
                customInput.id = 'customMakeGroup';
                customInput.className = 'form-group';
                customInput.innerHTML = `
                    <label class="form-label required">Custom Make</label>
                    <input
                        type="text"
                        name="custom_make"
                        class="form-input"
                        placeholder="Enter custom make"
                        required
                    >
                `;
                selectElement.closest('.form-group').insertAdjacentElement('afterend', customInput);
            }
        } else {
            // Remove custom input if it exists
            if (customMakeGroup) {
                customMakeGroup.remove();
            }
        }
    }

    /**
     * Validate VIN as user types
     */
    validateVIN(input) {
        const vin = input.value.toUpperCase();
        const errorDiv = document.getElementById('vinError');

        if (vin.length === 0) {
            errorDiv.style.display = 'none';
            input.style.borderColor = '';
            return;
        }

        if (vin.length !== 17) {
            errorDiv.textContent = `VIN must be 17 characters (currently ${vin.length})`;
            errorDiv.style.display = 'block';
            input.style.borderColor = '#dc3545';
        } else {
            // Check for invalid characters (I, O, Q are not allowed in VINs)
            const invalidChars = vin.match(/[IOQ]/g);
            if (invalidChars) {
                errorDiv.textContent = 'VIN cannot contain the letters I, O, or Q';
                errorDiv.style.display = 'block';
                input.style.borderColor = '#dc3545';
            } else {
                errorDiv.style.display = 'none';
                input.style.borderColor = '#28a745';
            }
        }
    }

    /**
     * Open customer modal from vehicle form
     */
    openCustomerModal() {
        // Close current modal first
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }

        // Open customer add modal
        setTimeout(() => {
            if (window.Customers && typeof window.Customers.showAddModal === 'function') {
                window.Customers.showAddModal();
            }
        }, 300);
    }

    filterVehicles(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }

    filterByType(type) {
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            if (!type) {
                row.style.display = '';
            } else {
                const vehicleType = row.textContent.includes(`Type: ${type}`);
                row.style.display = vehicleType ? '' : 'none';
            }
        });
    }

    filterByMake(make) {
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            if (!make) {
                row.style.display = '';
            } else {
                const vehicleMake = row.textContent.includes(make);
                row.style.display = vehicleMake ? '' : 'none';
            }
        });
    }



    /**
     * View detailed vehicle information
     */
    async viewVehicle(vehicleId) {
        console.log('👁️ Viewing vehicle details:', vehicleId);

        // Find the vehicle in our current data
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            if (typeof showToast === 'function') {
                showToast('Vehicle not found', 'error');
            }
            return;
        }

        // Get modal elements
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Show loading modal first
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>🚗 Vehicle Details - Loading...</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="loading-state" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h3>Loading Vehicle Details...</h3>
                    <p>Please wait while we fetch the complete vehicle information.</p>
                </div>
            </div>
        `;

        // Show modal
        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

        try {
            // Fetch detailed vehicle information
            const response = await fetch(`/api/vehicles/${vehicleId}/details`);
            let detailedVehicle;

            if (response.ok) {
                const data = await response.json();
                detailedVehicle = data.vehicle || vehicle;
            } else {
                // Fallback to cached data if API call fails
                detailedVehicle = vehicle;
                console.warn('Failed to fetch detailed vehicle info, using cached data');
            }

            // Fetch recent service history (last 5 records)
            let recentServices = [];
            try {
                const serviceResponse = await fetch(`/api/vehicles/${vehicleId}/service-history?limit=5`);
                if (serviceResponse.ok) {
                    const serviceData = await serviceResponse.json();
                    recentServices = serviceData.service_records || [];
                }
            } catch (error) {
                console.warn('Failed to fetch recent services:', error);
            }

            // Update modal with vehicle details
            modalContainer.innerHTML = this.generateVehicleDetailsModal(detailedVehicle, recentServices);

        } catch (error) {
            console.error('❌ Error loading vehicle details:', error);

            // Show error state in modal
            modalContainer.innerHTML = `
                <div class="modal-header">
                    <h2>🚗 Vehicle Details - Error</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="error-state" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                        <h3>Error Loading Vehicle Details</h3>
                        <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                        <div class="error-actions">
                            <button class="button button-primary" onclick="window.Vehicles.viewVehicle(${vehicleId})">
                                🔄 Retry
                            </button>
                            <button class="button button-outline" onclick="window.closeModal()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Generate vehicle details modal content
     */
    generateVehicleDetailsModal(vehicle, recentServices = []) {
        const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const registrationDate = vehicle.created_at ?
            new Date(vehicle.created_at).toLocaleDateString() : 'Unknown';
        const lastService = recentServices.length > 0 ?
            new Date(recentServices[0].service_date).toLocaleDateString() : 'No service records';

        return `
            <div class="modal-header">
                <h2>🚗 Vehicle Details - ${vehicleInfo}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body" style="max-height: 85vh; overflow-y: auto;">
                <!-- Vehicle Header -->
                <div class="vehicle-detail-header">
                    <div class="vehicle-avatar-large">
                        <div class="vehicle-icon-large" style="background: ${this.getVehicleColor(vehicle.make)}">
                            ${this.getVehicleIcon(vehicle.make)}
                        </div>
                    </div>
                    <div class="vehicle-title-section">
                        <h1 class="vehicle-title">${vehicleInfo}</h1>
                        <div class="vehicle-subtitle">
                            ${vehicle.license_plate ? `🔢 ${vehicle.license_plate}` : 'No license plate'} •
                            🆔 Vehicle ID: ${vehicle.id}
                        </div>
                        <div class="vehicle-actions-header">
                            <button class="button button-outline button-small" onclick="window.Vehicles.editVehicle(${vehicle.id})">
                                ✏️ Edit
                            </button>
                            <button class="button button-outline button-small" onclick="window.Vehicles.viewHistory(${vehicle.id})">
                                📋 Service History
                            </button>
                            <button class="button button-primary button-small" onclick="window.Vehicles.exportVehicleProfile(${vehicle.id})">
                                📤 Export Profile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Information Grid -->
                <div class="vehicle-details-grid">
                    <!-- Basic Information -->
                    <div class="detail-section">
                        <h3 class="section-title">🚗 Basic Information</h3>
                        <div class="detail-rows">
                            <div class="detail-row">
                                <span class="detail-label">Make:</span>
                                <span class="detail-value">${vehicle.make || 'Not specified'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Model:</span>
                                <span class="detail-value">${vehicle.model || 'Not specified'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Year:</span>
                                <span class="detail-value">${vehicle.year || 'Not specified'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Vehicle Type:</span>
                                <span class="detail-value">${vehicle.vehicle_type || 'Car'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Color:</span>
                                <span class="detail-value">${vehicle.color || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Identification -->
                    <div class="detail-section">
                        <h3 class="section-title">🔍 Identification</h3>
                        <div class="detail-rows">
                            <div class="detail-row">
                                <span class="detail-label">VIN:</span>
                                <span class="detail-value">
                                    ${vehicle.vin ? `
                                        <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">
                                            ${vehicle.vin}
                                        </code>
                                    ` : 'Not provided'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">License Plate:</span>
                                <span class="detail-value">
                                    ${vehicle.license_plate ? `
                                        <span class="license-plate" style="background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                                            ${vehicle.license_plate}
                                        </span>
                                    ` : 'Not provided'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Registration Date:</span>
                                <span class="detail-value">${registrationDate}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Technical Specs -->
                    <div class="detail-section">
                        <h3 class="section-title">⚙️ Technical Specifications</h3>
                        <div class="detail-rows">
                            <div class="detail-row">
                                <span class="detail-label">Current Mileage:</span>
                                <span class="detail-value">
                                    ${vehicle.mileage ? `
                                        <strong>${vehicle.mileage.toLocaleString()}</strong> miles
                                    ` : 'Not recorded'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Engine Size:</span>
                                <span class="detail-value">${vehicle.engine_size || 'Not specified'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Transmission:</span>
                                <span class="detail-value">${vehicle.transmission || 'Not specified'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Fuel Type:</span>
                                <span class="detail-value">${vehicle.fuel_type || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Owner Information -->
                    <div class="detail-section">
                        <h3 class="section-title">👤 Owner Information</h3>
                        <div class="detail-rows">
                            <div class="detail-row">
                                <span class="detail-label">Owner:</span>
                                <span class="detail-value">
                                    <strong>${vehicle.customer_name || 'Unknown Owner'}</strong>
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Customer ID:</span>
                                <span class="detail-value">${vehicle.customer_id || 'Not assigned'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">
                                    ${vehicle.customer_phone ? `
                                        <a href="tel:${vehicle.customer_phone}" style="color: #007bff; text-decoration: none;">
                                            📞 ${vehicle.customer_phone}
                                        </a>
                                    ` : 'Not provided'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">
                                    ${vehicle.customer_email ? `
                                        <a href="mailto:${vehicle.customer_email}" style="color: #007bff; text-decoration: none;">
                                            📧 ${vehicle.customer_email}
                                        </a>
                                    ` : 'Not provided'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Service History -->
                ${recentServices.length > 0 ? `
                    <div class="detail-section full-width">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 class="section-title">🔧 Recent Service History</h3>
                            <button class="button button-outline button-small" onclick="window.Vehicles.viewHistory(${vehicle.id})">
                                View All Services
                            </button>
                        </div>
                        <div class="recent-services">
                            ${recentServices.map(service => `
                                <div class="service-summary-item">
                                    <div class="service-summary-header">
                                        <strong>${service.description || 'Service'}</strong>
                                        <span class="service-date">${new Date(service.service_date).toLocaleDateString()}</span>
                                    </div>
                                    <div class="service-summary-details">
                                        <span>💰 $${service.total_cost || 0}</span>
                                        <span>🛣️ ${service.mileage ? service.mileage.toLocaleString() + ' mi' : 'N/A'}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="detail-section full-width">
                        <h3 class="section-title">🔧 Service History</h3>
                        <div class="no-services" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                            <p style="margin: 0; color: #666;">No service records found for this vehicle.</p>
                            <button class="button button-primary button-small" style="margin-top: 10px;"
                                onclick="window.Vehicles.addServiceRecord(${vehicle.id})">
                                ➕ Add First Service Record
                            </button>
                        </div>
                    </div>
                `}

                <!-- Notes Section -->
                ${vehicle.notes ? `
                    <div class="detail-section full-width">
                        <h3 class="section-title">📝 Notes</h3>
                        <div class="notes-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                            <p style="margin: 0; white-space: pre-wrap;">${vehicle.notes}</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="modal-actions" style="margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 20px;">
                    <button class="button button-outline" onclick="window.Vehicles.editVehicle(${vehicle.id})">
                        ✏️ Edit Vehicle
                    </button>
                    <button class="button button-outline" onclick="window.Vehicles.viewHistory(${vehicle.id})">
                        📋 Service History
                    </button>
                    <button class="button button-primary" onclick="window.Vehicles.exportVehicleProfile(${vehicle.id})">
                        📤 Export Profile
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Export vehicle profile
     */
    async exportVehicleProfile(vehicleId) {
        console.log('📤 Exporting vehicle profile:', vehicleId);

        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            if (typeof showToast === 'function') {
                showToast('Vehicle not found', 'error');
            }
            return;
        }

        try {
            // Show loading toast
            if (typeof showToast === 'function') {
                showToast('📤 Preparing vehicle profile export...', 'info');
            }

            // Fetch detailed vehicle data and service history
            let detailedVehicle = vehicle;
            let serviceHistory = [];

            try {
                // Try to get detailed vehicle info
                const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}/details`);
                if (vehicleResponse.ok) {
                    const vehicleData = await vehicleResponse.json();
                    detailedVehicle = vehicleData.vehicle || vehicle;
                }

                // Try to get service history
                const serviceResponse = await fetch(`/api/vehicles/${vehicleId}/service-history`);
                if (serviceResponse.ok) {
                    const serviceData = await serviceResponse.json();
                    serviceHistory = serviceData.service_records || [];
                }
            } catch (error) {
                console.warn('Failed to fetch complete data, using available info:', error);
            }

            // Generate comprehensive vehicle report
            const vehicleReport = this.generateVehicleReport(detailedVehicle, serviceHistory);

            // Create and download the file
            const blob = new Blob([vehicleReport], { type: 'text/plain;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Generate filename
            const vehicleName = `${detailedVehicle.year}_${detailedVehicle.make}_${detailedVehicle.model}`.replace(/\s+/g, '_');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Vehicle_Profile_${vehicleName}_${timestamp}.txt`;

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up
            URL.revokeObjectURL(url);

            // Show success message
            if (typeof showToast === 'function') {
                showToast(`✅ Vehicle profile exported to ${filename}`, 'success');
            }

        } catch (error) {
            console.error('❌ Error exporting vehicle profile:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Failed to export vehicle profile', 'error');
            }
        }
    }

    /**
     * Generate vehicle report text
     */
    generateVehicleReport(vehicle, serviceHistory = []) {
        const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const exportDate = new Date().toLocaleString();

        let report = `
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                              VEHICLE PROFILE REPORT                          ║
    ╚══════════════════════════════════════════════════════════════════════════════╝

    Export Date: ${exportDate}
    Generated by: OL Service POS System

    ═══════════════════════════════════════════════════════════════════════════════
    VEHICLE INFORMATION
    ═══════════════════════════════════════════════════════════════════════════════

    Vehicle: ${vehicleInfo}
    Vehicle ID: ${vehicle.id}
    License Plate: ${vehicle.license_plate || 'Not provided'}
    VIN: ${vehicle.vin || 'Not provided'}
    Color: ${vehicle.color || 'Not specified'}
    Vehicle Type: ${vehicle.vehicle_type || 'Car'}

    ═══════════════════════════════════════════════════════════════════════════════
    TECHNICAL SPECIFICATIONS
    ═══════════════════════════════════════════════════════════════════════════════

    Current Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' miles' : 'Not recorded'}
    Engine Size: ${vehicle.engine_size || 'Not specified'}
    Transmission: ${vehicle.transmission || 'Not specified'}
    Fuel Type: ${vehicle.fuel_type || 'Not specified'}

    ═══════════════════════════════════════════════════════════════════════════════
    OWNER INFORMATION
    ═══════════════════════════════════════════════════════════════════════════════

    Owner Name: ${vehicle.customer_name || 'Unknown Owner'}
    Customer ID: ${vehicle.customer_id || 'Not assigned'}
    Phone: ${vehicle.customer_phone || 'Not provided'}
    Email: ${vehicle.customer_email || 'Not provided'}
    Registration Date: ${vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'Unknown'}

    `;

        // Add service history if available
        if (serviceHistory.length > 0) {
            report += `
    ═══════════════════════════════════════════════════════════════════════════════
    SERVICE HISTORY (${serviceHistory.length} records)
    ═══════════════════════════════════════════════════════════════════════════════

    `;

            const totalCost = serviceHistory.reduce((sum, record) => sum + (record.total_cost || 0), 0);
            report += `Total Service Cost: $${totalCost.toLocaleString()}\n`;
            report += `Last Service: ${new Date(serviceHistory[0].service_date).toLocaleDateString()}\n\n`;

            serviceHistory.forEach((record, index) => {
                report += `${index + 1}. ${record.description || 'Service'}\n`;
                report += `   Date: ${new Date(record.service_date).toLocaleDateString()}\n`;
                report += `   Mileage: ${record.mileage ? record.mileage.toLocaleString() + ' miles' : 'Not recorded'}\n`;
                report += `   Cost: $${record.total_cost || 0}\n`;
                if (record.technician) {
                    report += `   Technician: ${record.technician}\n`;
                }
                if (record.notes) {
                    report += `   Notes: ${record.notes}\n`;
                }
                report += '\n';
            });
        } else {
            report += `
    ═══════════════════════════════════════════════════════════════════════════════
    SERVICE HISTORY
    ═══════════════════════════════════════════════════════════════════════════════

    No service records found for this vehicle.

    `;
        }

        // Add notes if available
        if (vehicle.notes) {
            report += `
    ═══════════════════════════════════════════════════════════════════════════════
    NOTES
    ═══════════════════════════════════════════════════════════════════════════════

    ${vehicle.notes}

    `;
        }

        report += `
    ═══════════════════════════════════════════════════════════════════════════════
    END OF REPORT
    ═══════════════════════════════════════════════════════════════════════════════

    This report was generated by OL Service POS System.
    For questions or support, please contact your system administrator.
    `;

        return report;
    }


    /**
     * Edit vehicle - show edit modal with pre-filled data
     */
    async editVehicle(vehicleId) {
        console.log('✏️ Editing vehicle:', vehicleId);

        // Find the vehicle in our current data
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            if (typeof showToast === 'function') {
                showToast('Vehicle not found', 'error');
            }
            return;
        }

        // Check if customers are available
        if (!this.customers || this.customers.length === 0) {
            if (typeof showToast === 'function') {
                showToast('⚠️ No customers available. Please add customers first.', 'warning');
            }
            return;
        }

        // Get modal elements
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Generate current year for validation
        const currentYear = new Date().getFullYear();

        // Create edit form with pre-filled data
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>✏️ Edit Vehicle #${vehicleId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <form id="editVehicleForm" onsubmit="window.Vehicles.handleEditVehicle(event, ${vehicleId})">
                    <!-- Vehicle Basic Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Information</h3>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Make</label>
                                <select name="make" class="form-input" required onchange="window.Vehicles.onEditMakeChange(this, '${vehicle.make || ''}')">
                                    <option value="">Select make</option>
                                    ${this.vehicleMakes.map(make =>
                                        `<option value="${make}" ${make === vehicle.make ? 'selected' : ''}>${make}</option>`
                                    ).join('')}
                                    <option value="other" ${!this.vehicleMakes.includes(vehicle.make) && vehicle.make ? 'selected' : ''}>Other (Custom)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label required">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    class="form-input"
                                    placeholder="Enter model"
                                    value="${vehicle.model || ''}"
                                    required
                                >
                            </div>
                        </div>

                        ${!this.vehicleMakes.includes(vehicle.make) && vehicle.make ? `
                        <div id="customMakeGroup" class="form-group">
                            <label class="form-label required">Custom Make</label>
                            <input
                                type="text"
                                name="custom_make"
                                class="form-input"
                                placeholder="Enter custom make"
                                value="${vehicle.make}"
                                required
                            >
                        </div>
                        ` : ''}

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label required">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    class="form-input"
                                    placeholder="e.g. ${currentYear}"
                                    min="1900"
                                    max="${currentYear + 2}"
                                    value="${vehicle.year || ''}"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Vehicle Type</label>
                                <select name="vehicle_type" class="form-input">
                                    ${this.vehicleTypes.map(type =>
                                        `<option value="${type}" ${type === (vehicle.vehicle_type || 'Car') ? 'selected' : ''}>${type}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">License Plate</label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    class="form-input"
                                    placeholder="ABC123"
                                    style="text-transform: uppercase;"
                                    maxlength="10"
                                    value="${vehicle.license_plate || ''}"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    class="form-input"
                                    placeholder="e.g. Silver, Blue"
                                    value="${vehicle.color || ''}"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Vehicle Details -->
                    <div class="form-section">
                        <h3 class="form-section-title">Vehicle Details</h3>

                        <div class="form-group">
                            <label class="form-label">VIN (Vehicle Identification Number)</label>
                            <input
                                type="text"
                                name="vin"
                                class="form-input"
                                placeholder="1HGCM82633A123456"
                                maxlength="17"
                                style="text-transform: uppercase;"
                                value="${vehicle.vin || ''}"
                                oninput="window.Vehicles.validateVIN(this)"
                            >
                            <small class="form-help">17 characters - Leave blank if unknown</small>
                            <div id="vinError" class="form-error" style="display: none;"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Mileage</label>
                                <input
                                    type="number"
                                    name="mileage"
                                    class="form-input"
                                    placeholder="e.g. 50000"
                                    min="0"
                                    max="999999"
                                    value="${vehicle.mileage || ''}"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Engine Size</label>
                                <input
                                    type="text"
                                    name="engine_size"
                                    class="form-input"
                                    placeholder="e.g. 2.0L, V6"
                                    value="${vehicle.engine_size || ''}"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Owner Information -->
                    <div class="form-section">
                        <h3 class="form-section-title">Owner Information</h3>

                        <div class="form-group">
                            <label class="form-label required">Vehicle Owner</label>
                            <select name="customer_id" class="form-input" required>
                                <option value="">Select customer</option>
                                ${this.customers
                                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                    .map(customer =>
                                        `<option value="${customer.id}" ${customer.id === vehicle.customer_id ? 'selected' : ''}>
                                            ${customer.name || 'Unnamed Customer'} (ID: ${customer.id})
                                        </option>`
                                    ).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Additional Notes -->
                    <div class="form-section">
                        <h3 class="form-section-title">Additional Information</h3>

                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea
                                name="notes"
                                class="form-textarea"
                                placeholder="Any additional notes about the vehicle..."
                                rows="3"
                            >${vehicle.notes || ''}</textarea>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="button" class="button button-outline" onclick="window.Vehicles.deleteVehicle(${vehicleId})"
                            style="color: #dc3545; border-color: #dc3545;">
                            🗑️ Delete
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Update Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal
        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

        console.log('✅ Edit vehicle modal displayed for vehicle:', vehicleId);
    }

    /**
     * Handle edit vehicle form submission
     */
    async handleEditVehicle(event, vehicleId) {
        event.preventDefault();
        console.log('📝 Updating vehicle:', vehicleId);

        // Prevent double submission
        if (this.isLoading) {
            console.log('Already submitting...');
            return;
        }

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            this.isLoading = true;
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Updating...';

            const formData = new FormData(form);

            // Build update data object
            let make = formData.get('make').trim();
            if (make === 'other') {
                make = formData.get('custom_make').trim();
            }

            const updateData = {
                make: make,
                model: formData.get('model').trim(),
                year: parseInt(formData.get('year')),
                vehicle_type: formData.get('vehicle_type') || 'Car',
                license_plate: formData.get('license_plate').trim().toUpperCase(),
                color: formData.get('color').trim(),
                vin: formData.get('vin').trim().toUpperCase(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : null,
                engine_size: formData.get('engine_size').trim(),
                customer_id: parseInt(formData.get('customer_id')),
                notes: formData.get('notes').trim()
            };

            // Client-side validation
            const validationResult = this.validateVehicleData(updateData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            console.log('Sending update data:', updateData);

            // Submit to API
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Vehicle updated:', result);

                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('✅ Vehicle updated successfully!', 'success');
                }

                // Close the modal
                if (typeof window.closeModal === 'function') {
                    window.closeModal();
                }

                // Refresh the vehicle list
                await this.loadVehicles();

                // Refresh the display if we're in the vehicles section
                if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                    window.olServiceApp.loadSection('vehicles');
                }

            } else {
                throw new Error(result.error || 'Failed to update vehicle');
            }

        } catch (error) {
            console.error('❌ Error updating vehicle:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`❌ ${error.message}`, 'error');
            }
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Update Vehicle';
        }
    }

    /**
     * Handle make selection change in edit form
     */
    onEditMakeChange(selectElement, originalMake) {
        const customMakeGroup = document.getElementById('customMakeGroup');

        if (selectElement.value === 'other') {
            // If "Other" is selected, show custom input
            if (!customMakeGroup) {
                const customInput = document.createElement('div');
                customInput.id = 'customMakeGroup';
                customInput.className = 'form-group';
                customInput.innerHTML = `
                    <label class="form-label required">Custom Make</label>
                    <input
                        type="text"
                        name="custom_make"
                        class="form-input"
                        placeholder="Enter custom make"
                        value="${originalMake}"
                        required
                    >
                `;
                selectElement.closest('.form-group').insertAdjacentElement('afterend', customInput);
            }
        } else {
            // Remove custom input if it exists
            if (customMakeGroup) {
                customMakeGroup.remove();
            }
        }
    }

    /**
     * Delete vehicle with confirmation
     */
    async deleteVehicle(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Vehicle #${vehicleId}`;

        if (!confirm(`Are you sure you want to delete "${vehicleName}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete vehicle');
            }

            // Show success message
            if (typeof window.showToast === 'function') {
                window.showToast('✅ Vehicle deleted successfully!', 'success');
            }

            // Close the modal
            if (typeof window.closeModal === 'function') {
                window.closeModal();
            }

            // Refresh the vehicle list
            await this.loadVehicles();

            // Refresh the display if we're in the vehicles section
            if (window.olServiceApp && window.olServiceApp.currentSection === 'vehicles') {
                window.olServiceApp.loadSection('vehicles');
            }

        } catch (error) {
            console.error('❌ Error deleting vehicle:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(`❌ ${error.message}`, 'error');
            }
        }
    }


    /**
     * View service history for a vehicle
     */
    async viewHistory(vehicleId) {
        console.log('📋 Viewing service history for vehicle:', vehicleId);

        // Find the vehicle in our current data
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            if (typeof showToast === 'function') {
                showToast('Vehicle not found', 'error');
            }
            return;
        }

        // Get modal elements
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Show loading modal first
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>📋 Service History - ${vehicle.year} ${vehicle.make} ${vehicle.model}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="loading-state" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h3>Loading Service History...</h3>
                    <p>Please wait while we fetch the service records.</p>
                </div>
            </div>
        `;

        // Show modal
        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

        try {
            // Fetch service history from API
            const response = await fetch(`/api/vehicles/${vehicleId}/service-history`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load service history');
            }

            const serviceRecords = data.service_records || [];

            // Update modal with service history content
            modalContainer.innerHTML = this.generateServiceHistoryModal(vehicle, serviceRecords);

        } catch (error) {
            console.error('❌ Error loading service history:', error);

            // Show error state in modal
            modalContainer.innerHTML = `
                <div class="modal-header">
                    <h2>📋 Service History - ${vehicle.year} ${vehicle.make} ${vehicle.model}</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="error-state" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                        <h3>Error Loading Service History</h3>
                        <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                        <div class="error-actions">
                            <button class="button button-primary" onclick="window.Vehicles.viewHistory(${vehicleId})">
                                🔄 Retry
                            </button>
                            <button class="button button-outline" onclick="window.closeModal()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Generate service history modal content
     */
    generateServiceHistoryModal(vehicle, serviceRecords) {
        const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        const totalServices = serviceRecords.length;
        const totalCost = serviceRecords.reduce((sum, record) => sum + (record.total_cost || 0), 0);
        const lastService = serviceRecords.length > 0 ?
            new Date(serviceRecords[0].service_date).toLocaleDateString() : 'Never';

        return `
            <div class="modal-header">
                <h2>📋 Service History - ${vehicleInfo}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
                <!-- Vehicle Summary -->
                <div class="service-summary">
                    <div class="vehicle-header">
                        <div class="vehicle-info-card">
                            <div class="vehicle-avatar">${this.getVehicleIcon(vehicle.make)}</div>
                            <div class="vehicle-details">
                                <h3>${vehicleInfo}</h3>
                                <div class="vehicle-meta">
                                    <span>📋 ID: ${vehicle.id}</span>
                                    <span>🔢 License: ${vehicle.license_plate || 'N/A'}</span>
                                    <span>👤 Owner: ${vehicle.customer_name || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Service Statistics -->
                    <div class="service-stats">
                        <div class="stat-item">
                            <div class="stat-icon">🔧</div>
                            <div class="stat-content">
                                <div class="stat-number">${totalServices}</div>
                                <div class="stat-label">Total Services</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-number">$${totalCost.toLocaleString()}</div>
                                <div class="stat-label">Total Cost</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">📅</div>
                            <div class="stat-content">
                                <div class="stat-number">${lastService}</div>
                                <div class="stat-label">Last Service</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🛣️</div>
                            <div class="stat-content">
                                <div class="stat-number">${vehicle.mileage?.toLocaleString() || 'N/A'}</div>
                                <div class="stat-label">Current Mileage</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="service-actions" style="margin: 20px 0; display: flex; gap: 10px; align-items: center;">
                    <button class="button button-primary" onclick="window.Vehicles.addServiceRecord(${vehicle.id})">
                        ➕ Add Service Record
                    </button>
                    <button class="button button-outline" onclick="window.Vehicles.exportServiceHistory(${vehicle.id})">
                        📤 Export History
                    </button>
                    <div style="margin-left: auto;">
                        <input type="text" placeholder="Search services..." class="form-input" style="width: 200px;"
                            oninput="window.Vehicles.filterServiceHistory(this.value)">
                    </div>
                </div>

                <!-- Service Records -->
                <div class="service-records">
                    ${serviceRecords.length > 0 ? this.renderServiceRecords(serviceRecords) : this.renderNoServiceRecords(vehicle.id)}
                </div>
            </div>
        `;
    }

    /**
     * Render service records list
     */
    renderServiceRecords(serviceRecords) {
        // Sort by date (newest first)
        const sortedRecords = serviceRecords.sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

        return `
            <div class="service-timeline">
                ${sortedRecords.map(record => this.renderServiceRecord(record)).join('')}
            </div>
        `;
    }

    /**
     * Render individual service record
     */
    renderServiceRecord(record) {
        const serviceDate = new Date(record.service_date).toLocaleDateString();
        const serviceCost = record.total_cost ? `$${record.total_cost.toLocaleString()}` : 'N/A';
        const serviceType = record.service_type || 'General Service';
        const mileage = record.mileage ? record.mileage.toLocaleString() : 'N/A';

        return `
            <div class="service-record-item" data-record-id="${record.id}">
                <div class="service-record-header">
                    <div class="service-info">
                        <h4 class="service-title">${record.description || serviceType}</h4>
                        <div class="service-meta">
                            <span class="service-date">📅 ${serviceDate}</span>
                            <span class="service-mileage">🛣️ ${mileage} miles</span>
                            <span class="service-cost">💰 ${serviceCost}</span>
                        </div>
                    </div>
                    <div class="service-actions">
                        <button class="button button-small button-outline"
                            onclick="window.Vehicles.editServiceRecord(${record.id})"
                            title="Edit Service Record">
                            ✏️
                        </button>
                        <button class="button button-small button-outline"
                            onclick="window.Vehicles.deleteServiceRecord(${record.id})"
                            style="color: #dc3545; border-color: #dc3545;"
                            title="Delete Service Record">
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="service-details">
                    ${record.service_items && record.service_items.length > 0 ? `
                        <div class="service-items">
                            <h5>Services Performed:</h5>
                            <ul>
                                ${record.service_items.map(item => `
                                    <li>
                                        <strong>${item.name}</strong> - $${item.price || 0}
                                        ${item.description ? `<br><small>${item.description}</small>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${record.parts_used && record.parts_used.length > 0 ? `
                        <div class="parts-used">
                            <h5>Parts Used:</h5>
                            <ul>
                                ${record.parts_used.map(part => `
                                    <li>
                                        <strong>${part.name}</strong> (Qty: ${part.quantity || 1}) - $${part.price || 0}
                                        ${part.part_number ? `<br><small>Part #: ${part.part_number}</small>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${record.notes ? `
                        <div class="service-notes">
                            <h5>Notes:</h5>
                            <p>${record.notes}</p>
                        </div>
                    ` : ''}

                    ${record.technician ? `
                        <div class="service-technician">
                            <small><strong>Technician:</strong> ${record.technician}</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render no service records state
     */
    renderNoServiceRecords(vehicleId) {
        return `
            <div class="empty-state" style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <h3>No Service Records Found</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    This vehicle has no service history recorded yet.
                </p>
                <button class="button button-primary" onclick="window.Vehicles.addServiceRecord(${vehicleId})">
                    ➕ Add First Service Record
                </button>
            </div>
        `;
    }

    /**
     * Filter service history
     */
    filterServiceHistory(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const records = document.querySelectorAll('.service-record-item');

        records.forEach(record => {
            const text = record.textContent.toLowerCase();
            const matches = text.includes(term);
            record.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Add service record placeholder
     */
    addServiceRecord(vehicleId) {
        if (typeof showToast === 'function') {
            showToast(`Add service record for vehicle ${vehicleId} - Feature coming soon!`, 'info');
        }
        console.log('Add service record for vehicle:', vehicleId);
        // TODO: Implement add service record modal
    }

    /**
     * Edit service record placeholder
     */
    editServiceRecord(recordId) {
        if (typeof showToast === 'function') {
            showToast(`Edit service record ${recordId} - Feature coming soon!`, 'info');
        }
        console.log('Edit service record:', recordId);
        // TODO: Implement edit service record modal
    }

    /**
     * Delete service record
     */
    async deleteServiceRecord(recordId) {
        if (!confirm('Are you sure you want to delete this service record?\n\nThis action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/service-records/${recordId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete service record');
            }

            // Show success message
            if (typeof showToast === 'function') {
                showToast('✅ Service record deleted successfully!', 'success');
            }

            // Remove the record from the display
            const recordElement = document.querySelector(`[data-record-id="${recordId}"]`);
            if (recordElement) {
                recordElement.remove();
            }

            // Update statistics
            // TODO: Refresh the modal or update stats dynamically

        } catch (error) {
            console.error('❌ Error deleting service record:', error);
            if (typeof showToast === 'function') {
                showToast(`❌ ${error.message}`, 'error');
            }
        }
    }

    /**
     * Export service history
     */
    exportServiceHistory(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        const vehicleName = vehicle ? `${vehicle.year}_${vehicle.make}_${vehicle.model}` : `Vehicle_${vehicleId}`;

        if (typeof showToast === 'function') {
            showToast(`Export service history for ${vehicleName} - Feature coming soon!`, 'info');
        }
        console.log('Export service history for vehicle:', vehicleId);
        // TODO: Implement service history export
    }

    /**
     * Export vehicles function - replaces the placeholder in vehicles.js
     * Add this method to the VehiclesModule class
     */

    exportVehicles() {
        if (!this.vehicles.length) {
            if (typeof showToast === 'function') {
                showToast('No vehicles to export', 'warning');
            }
            return;
        }

        // Define CSV headers
        const headers = [
            'Vehicle ID',
            'Make',
            'Model',
            'Year',
            'License Plate',
            'VIN',
            'Vehicle Type',
            'Mileage',
            'Customer ID',
            'Customer Name',
            'Customer Phone',
            'Customer Email',
            'Registration Date'
        ];

        // Map vehicle data to CSV rows
        const rows = this.vehicles.map(vehicle => [
            vehicle.id || '',
            vehicle.make || '',
            vehicle.model || '',
            vehicle.year || '',
            vehicle.license_plate || '',
            vehicle.vin || '',
            vehicle.vehicle_type || 'Car',
            vehicle.mileage || '',
            vehicle.customer_id || '',
            vehicle.customer_name || 'Unknown Owner',
            vehicle.customer_phone || '',
            vehicle.customer_email || '',
            vehicle.registration_date ? new Date(vehicle.registration_date).toLocaleDateString() : ''
        ]);

        // Create CSV content
        const csv = [headers, ...rows]
            .map(row => row.map(value => `"${value}"`).join(','))
            .join('\n');

        // Create and download the file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Generate timestamp for filename
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        const filename = `vehicles_export_${timestamp}.csv`;

        // Create download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up the URL object
        URL.revokeObjectURL(url);

        // Show success message
        if (typeof showToast === 'function') {
            showToast(`Exported ${this.vehicles.length} vehicles to ${filename}`, 'success');
        }

        console.log(`📤 Exported ${this.vehicles.length} vehicles to ${filename}`);
    }

    // Utility methods
    getVehicleIcon(make) {
        const icons = {
            'Toyota': '🚗', 'Honda': '🚗', 'Ford': '🚚', 'Chevrolet': '🚗',
            'BMW': '🏎️', 'Mercedes-Benz': '🏎️', 'Audi': '🏎️', 'Volkswagen': '🚗',
            'Jeep': '🚙', 'Ram': '🚚', 'GMC': '🚚'
        };
        return icons[make] || '🚗';
    }

    getVehicleColor(make) {
        const colors = {
            'Toyota': 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
            'Honda': 'linear-gradient(45deg, #74b9ff, #0984e3)',
            'Ford': 'linear-gradient(45deg, #a29bfe, #6c5ce7)',
            'Chevrolet': 'linear-gradient(45deg, #fd79a8, #e84393)',
            'BMW': 'linear-gradient(45deg, #2d3436, #636e72)',
            'Mercedes-Benz': 'linear-gradient(45deg, #b2bec3, #ddd)',
            'Default': 'linear-gradient(45deg, #667eea, #764ba2)'
        };
        return colors[make] || colors['Default'];
    }

    getUniqueMakes() {
        const makes = [...new Set(this.vehicles.map(v => v.make))];
        return makes.length;
    }

    getUniqueVehicleMakes() {
        return [...new Set(this.vehicles.map(v => v.make))].sort();
    }

    getAverageYear() {
        if (this.vehicles.length === 0) return 'N/A';
        const average = this.vehicles.reduce((sum, v) => sum + v.year, 0) / this.vehicles.length;
        return Math.round(average);
    }

    getAverageMileage() {
        if (this.vehicles.length === 0) return 'N/A';
        const vehicles = this.vehicles.filter(v => v.mileage);
        if (vehicles.length === 0) return 'N/A';

        const average = vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length;
        return Math.round(average).toLocaleString();
    }

    renderError(error) {
        const html = this.getErrorHTML(error);

        if (window.app) {
            window.app.setContent(html);
        }
    }
}

// Create global vehicles instance
window.Vehicles = new VehiclesModule();

// Also create the expected module reference
window.vehiclesModule = window.Vehicles;

console.log('✅ Vehicles module loaded successfully');
