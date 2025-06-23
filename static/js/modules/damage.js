// static/js/modules/damage.js - Interactive Damage Inspection Module
console.log('🔍 Loading Damage module...');

class DamageInspectionModule {
    constructor() {
        this.vehicles = [];
        this.currentVehicle = null;
        this.currentTool = 'circle';
        this.damageMarkers = [];
        this.drawings = [];
        this.isLoading = false;
        this.drawingCanvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentDrawing = null;
        this.zoomLevel = 1;
        this.canvasSize = 'large'; // small, medium, large, xlarge

        // Drawing tools configuration
        this.drawingTools = {
            circle: {
                name: 'Circle',
                color: '#e74c3c',
                icon: '⭕',
                description: 'Draw circles around damage areas'
            },
            freehand: {
                name: 'Freehand',
                color: '#f39c12',
                icon: '✏️',
                description: 'Draw freehand marks'
            },
            arrow: {
                name: 'Arrow',
                color: '#3498db',
                icon: '↗️',
                description: 'Draw arrows pointing to damage'
            },
            rectangle: {
                name: 'Rectangle',
                color: '#9b59b6',
                icon: '▭',
                description: 'Draw rectangles around areas'
            },
            marker: {
                name: 'Marker',
                color: '#27ae60',
                icon: '📍',
                description: 'Place point markers'
            }
        };

        // Canvas size presets
        this.canvasSizes = {
            small: { width: 600, name: 'Small' },
            medium: { width: 800, name: 'Medium' },
            large: { width: 1000, name: 'Large' },
            xlarge: { width: 1400, name: 'X-Large' }
        };
    }

    async init() {
        console.log('🔍 Initializing Damage Inspection module...');
        try {
            await this.loadVehicles();
            console.log('✅ Damage Inspection module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Damage Inspection module:', error);
            throw error;
        }
    }

    async loadVehicles() {
        try {
            // Try to load from API, fallback to mock data
            try {
                const response = await fetch('/api/vehicles');
                if (response.ok) {
                    const data = await response.json();
                    this.vehicles = data.vehicles || [];
                } else {
                    throw new Error('API not available');
                }
            } catch (apiError) {
                // Fallback to mock data
                this.vehicles = [
                    {
                        id: 1,
                        make: 'Ford',
                        model: 'Transit Van',
                        year: 2020,
                        license_plate: 'ABC123',
                        customer_name: 'John Doe'
                    },
                    {
                        id: 2,
                        make: 'Mercedes',
                        model: 'Sprinter',
                        year: 2019,
                        license_plate: 'XYZ789',
                        customer_name: 'Jane Smith'
                    }
                ];
            }
            console.log(`🚗 Loaded ${this.vehicles.length} vehicles for damage inspection`);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
            this.vehicles = [];
        }
    }

    async load() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            await this.loadVehicles();
            this.render();
        } catch (error) {
            console.error('Failed to load damage inspection section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const html = `
            <div class="damage-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🔍 Vehicle Damage Inspection</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="Damage.loadPreviousInspection()" title="Load Previous">
                            📂 Load Previous
                        </button>
                        <button class="button button-outline" onclick="Damage.clearAll()" title="Clear All">
                            🗑️ Clear All
                        </button>
                        <button class="button button-outline" onclick="Damage.exportReport()">
                            📤 Export Report
                        </button>
                        <button class="button button-primary" onclick="Damage.saveInspection()">
                            💾 Save Inspection
                        </button>
                    </div>
                </div>

                <!-- Vehicle Selection (Optional) -->
                <div class="vehicle-selector">
                    <h3>🚗 Vehicle Information</h3>
                    <div class="vehicle-grid">
                        ${this.renderVehicleOptions()}
                        <div class="vehicle-option" onclick="Damage.addCustomVehicle()">
                            <div class="vehicle-icon">➕</div>
                            <div class="vehicle-name">Add Custom Vehicle</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                                Enter vehicle details manually
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Drawing Tools -->
                <div class="damage-inspection-area">
                    <div class="inspection-header">
                        <h3 class="inspection-title">🎨 Drawing Tools</h3>
                        <div class="inspection-controls">
                            ${this.renderDrawingTools()}
                        </div>
                    </div>

                    <!-- Instructions -->
                    <div style="background: #e3f2fd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #2196f3;">
                        <strong>💡 How to use:</strong>
                        Select a drawing tool above, then draw directly on the van diagram below.
                        Use circles to mark damage areas, arrows to point to specific spots, or freehand drawing for detailed marking.
                    </div>

                    <!-- Canvas Size Controls -->
                    <div class="canvas-size-controls">
                        <span style="font-weight: 600; color: #2c3e50; margin-right: 0.5rem;">Canvas Size:</span>
                        ${Object.entries(this.canvasSizes).map(([size, config]) => `
                            <button class="size-btn ${this.canvasSize === size ? 'active' : ''}"
                                    onclick="Damage.setCanvasSize('${size}')">
                                ${config.name}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Van Sketch Canvas -->
                    <div class="canvas-container" id="canvasContainer">
                        ${this.renderVanCanvas()}

                        <!-- Zoom Controls -->
                        <div class="zoom-controls">
                            <button class="zoom-btn" onclick="Damage.zoomIn()" title="Zoom In">
                                +
                            </button>
                            <div class="zoom-level" id="zoomLevel">
                                ${Math.round(this.zoomLevel * 100)}%
                            </div>
                            <button class="zoom-btn" onclick="Damage.zoomOut()" title="Zoom Out">
                                −
                            </button>
                            <button class="zoom-btn" onclick="Damage.resetZoom()" title="Reset Zoom">
                                🔄
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Drawing Tools Legend -->
                <div class="damage-legend">
                    <h3>🎨 Drawing Tools Legend</h3>
                    <div class="legend-grid">
                        ${this.renderDrawingLegend()}
                    </div>
                </div>

                <!-- Damage Notes -->
                <div class="damage-list">
                    <h3>
                        📝 Damage Notes & Observations
                        <span class="damage-count">${this.damageMarkers.length}</span>
                    </h3>
                    <div style="margin-bottom: 1rem;">
                        <textarea
                            id="damageNotes"
                            class="form-textarea"
                            placeholder="Add general notes about the vehicle condition, damage observations, or special instructions..."
                            rows="4"
                        ></textarea>
                        <button class="button button-outline" style="margin-top: 0.5rem;" onclick="Damage.addNote()">
                            ➕ Add Note
                        </button>
                    </div>
                    <div class="damage-items" id="damageItems">
                        ${this.renderNotesList()}
                    </div>
                </div>

                <!-- Back Button -->
                <div style="margin-top: 2rem; text-align: center;">
                    <button class="button button-outline" onclick="app.goHome()">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;

        if (window.app) {
            window.app.setContent(html);
        }

        // Setup canvas after rendering
        setTimeout(() => this.setupCanvas(), 100);
    }

    renderVehicleOptions() {
        if (this.vehicles.length === 0) {
            return `
                <div class="vehicle-option selected">
                    <div class="vehicle-icon">🚐</div>
                    <div class="vehicle-name">Default Van Inspection</div>
                    <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                        Use for any vehicle inspection
                    </div>
                </div>
            `;
        }

        return this.vehicles.map(vehicle => `
            <div class="vehicle-option ${this.currentVehicle?.id === vehicle.id ? 'selected' : ''}"
                 onclick="Damage.selectVehicle(${vehicle.id})">
                <div class="vehicle-icon">🚐</div>
                <div class="vehicle-name">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                    ${vehicle.license_plate} • ${vehicle.customer_name}
                </div>
            </div>
        `).join('');
    }

    renderDrawingTools() {
        return Object.entries(this.drawingTools).map(([tool, config]) => `
            <button class="tool-button ${this.currentTool === tool ? 'active' : ''}"
                    onclick="Damage.selectTool('${tool}')">
                <span>${config.icon}</span>
                ${config.name}
            </button>
        `).join('');
    }

    renderVanCanvas() {
        const currentSize = this.canvasSizes[this.canvasSize];
        return `
            <div class="vehicle-canvas" id="vehicleCanvas" style="transform: scale(${this.zoomLevel});">
                <img src="/assets/van_sketch.png"
                     alt="Van Diagram"
                     class="vehicle-image"
                     id="vehicleImage"
                     style="width: ${currentSize.width}px; height: auto;"
                     crossorigin="anonymous"
                     onload="Damage.onImageLoad()"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIzMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj7wn5qQIFZhbiBEaWFncmFtPC90ZXh0Pjx0ZXh0IHg9IjMwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYmJiIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkNsaWNrIHRvIGFkZCB5b3VyIHZhbiBza2V0Y2g8L3RleHQ+PHRleHQgeD0iMzAwIiB5PSIyNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNiYmIiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+YXNzZXRzL3Zhbl9za2V0Y2gucG5nPC90ZXh0Pjwvc3ZnPg=='; this.style.width='${currentSize.width}px'; this.style.height='auto';">
                <canvas class="damage-canvas"
                        id="drawingCanvas"
                        onmousedown="Damage.startDrawing(event)"
                        onmousemove="Damage.draw(event)"
                        onmouseup="Damage.stopDrawing(event)"
                        ontouchstart="Damage.startDrawing(event)"
                        ontouchmove="Damage.draw(event)"
                        ontouchend="Damage.stopDrawing(event)"></canvas>
            </div>
        `;
    }

    renderDrawingLegend() {
        return Object.entries(this.drawingTools).map(([tool, config]) => `
            <div class="legend-item">
                <div class="legend-color" style="border-color: ${config.color}; color: ${config.color};">
                    ${config.icon}
                </div>
                <div>
                    <div class="legend-label">${config.name}</div>
                    <div style="font-size: 0.8rem; color: #7f8c8d;">${config.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderNotesList() {
        if (this.damageMarkers.length === 0) {
            return `
                <div class="empty-damage-state">
                    <div class="empty-damage-icon">📝</div>
                    <h4>No notes added yet</h4>
                    <p>Add notes about the vehicle condition or damage observations above.</p>
                </div>
            `;
        }

        return this.damageMarkers.map((note, index) => `
            <div class="damage-item">
                <div class="damage-info">
                    <div class="damage-type-indicator" style="border-color: #667eea; color: #667eea; background: rgba(102, 126, 234, 0.1);">
                        📝
                    </div>
                    <div class="damage-details">
                        <div class="damage-type">Note ${index + 1}</div>
                        <div class="damage-description">${note.text}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d; margin-top: 0.25rem;">
                            Added: ${new Date(note.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div class="damage-actions">
                    <button class="damage-item-btn" onclick="Damage.editNote(${index})" title="Edit">
                        ✏️
                    </button>
                    <button class="damage-item-btn" onclick="Damage.removeNote(${index})" title="Remove">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupCanvas() {
        const image = document.getElementById('vehicleImage');
        const canvas = document.getElementById('drawingCanvas');

        if (!image || !canvas) return;

        // Wait for image to load
        if (image.complete) {
            this.initializeCanvas();
        } else {
            image.onload = () => this.initializeCanvas();
        }

        // Add keyboard shortcuts for zoom
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        // Remove existing listener if any
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        this.keyboardHandler = (event) => {
            // Only handle shortcuts when damage inspection is active
            if (!document.getElementById('vehicleCanvas')) return;

            // Prevent shortcuts when typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

            switch (event.key) {
                case '+':
                case '=':
                    event.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    event.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    event.preventDefault();
                    this.resetZoom();
                    break;
                case '1':
                    event.preventDefault();
                    this.setCanvasSize('small');
                    break;
                case '2':
                    event.preventDefault();
                    this.setCanvasSize('medium');
                    break;
                case '3':
                    event.preventDefault();
                    this.setCanvasSize('large');
                    break;
                case '4':
                    event.preventDefault();
                    this.setCanvasSize('xlarge');
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    initializeCanvas() {
        const image = document.getElementById('vehicleImage');
        const canvas = document.getElementById('drawingCanvas');

        if (!image || !canvas) return;

        // Set canvas size to match image
        canvas.width = image.offsetWidth;
        canvas.height = image.offsetHeight;

        this.drawingCanvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set drawing properties
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        console.log('✅ Canvas initialized:', canvas.width, 'x', canvas.height);

        // Redraw existing drawings
        this.redrawAll();
    }

    onImageLoad() {
        this.initializeCanvas();
    }

    selectTool(toolType) {
        this.currentTool = toolType;

        // Update tool buttons
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tool-button').classList.add('active');

        // Update cursor
        const canvas = document.getElementById('drawingCanvas');
        if (canvas) {
            canvas.style.cursor = 'crosshair';
        }
    }

    selectVehicle(vehicleId) {
        this.currentVehicle = this.vehicles.find(v => v.id === vehicleId);
        this.render();
    }

    addCustomVehicle() {
        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add Vehicle Information</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="customVehicleForm" onsubmit="Damage.saveCustomVehicle(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Make</label>
                            <input type="text" name="make" class="form-input" placeholder="Ford, Mercedes, etc.">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Model</label>
                            <input type="text" name="model" class="form-input" placeholder="Transit, Sprinter, etc.">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Year</label>
                            <input type="number" name="year" class="form-input" placeholder="2023" min="1990" max="${new Date().getFullYear() + 1}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">License Plate</label>
                            <input type="text" name="license" class="form-input" placeholder="ABC123">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Owner/Customer Name</label>
                        <input type="text" name="customer" class="form-input" placeholder="John Doe">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="app.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Vehicle Info
                        </button>
                    </div>
                </form>
            </div>
        `;

        window.app?.showModal(modalContent);
    }

    saveCustomVehicle(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const vehicle = {
            id: Date.now(),
            make: formData.get('make') || 'Unknown',
            model: formData.get('model') || 'Unknown',
            year: formData.get('year') || new Date().getFullYear(),
            license_plate: formData.get('license') || 'N/A',
            customer_name: formData.get('customer') || 'Unknown'
        };

        this.vehicles.push(vehicle);
        this.currentVehicle = vehicle;

        window.app?.closeModal();
        window.app?.showToast('Vehicle information saved', 'success');
        this.render();
    }

    // Zoom and canvas size controls
    setCanvasSize(size) {
        this.canvasSize = size;

        // Update size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Re-render canvas with new size
        const canvasContainer = document.getElementById('canvasContainer');
        if (canvasContainer) {
            canvasContainer.innerHTML = this.renderVanCanvas() + `
                <div class="zoom-controls">
                    <button class="zoom-btn" onclick="Damage.zoomIn()" title="Zoom In">+</button>
                    <div class="zoom-level" id="zoomLevel">${Math.round(this.zoomLevel * 100)}%</div>
                    <button class="zoom-btn" onclick="Damage.zoomOut()" title="Zoom Out">−</button>
                    <button class="zoom-btn" onclick="Damage.resetZoom()" title="Reset Zoom">🔄</button>
                </div>
            `;
        }

        // Reinitialize canvas
        setTimeout(() => this.setupCanvas(), 100);

        window.app?.showToast(`Canvas size changed to ${this.canvasSizes[size].name}`, 'success');
    }

    zoomIn() {
        if (this.zoomLevel < 3) {
            this.zoomLevel += 0.25;
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 0.5) {
            this.zoomLevel -= 0.25;
            this.updateZoom();
        }
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }

    updateZoom() {
        const vehicleCanvas = document.getElementById('vehicleCanvas');
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        const canvasContainer = document.getElementById('canvasContainer');

        if (vehicleCanvas) {
            vehicleCanvas.style.transform = `scale(${this.zoomLevel})`;

            // Ensure the container has enough space for the zoomed content
            const wrapper = vehicleCanvas.parentElement;
            if (wrapper) {
                const currentSize = this.canvasSizes[this.canvasSize];
                const zoomedWidth = currentSize.width * this.zoomLevel;
                const zoomedHeight = (currentSize.width * 0.6) * this.zoomLevel; // Approximate aspect ratio

                wrapper.style.minWidth = `${zoomedWidth + 100}px`;
                wrapper.style.minHeight = `${zoomedHeight + 100}px`;
            }
        }

        if (zoomLevelDisplay) {
            zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }

        // Scroll to center if zoomed in
        if (canvasContainer && this.zoomLevel > 1) {
            const scrollX = (canvasContainer.scrollWidth - canvasContainer.clientWidth) / 2;
            const scrollY = (canvasContainer.scrollHeight - canvasContainer.clientHeight) / 2;
            canvasContainer.scrollTo(scrollX, scrollY);
        }

        // Update canvas coordinates scaling
        setTimeout(() => this.setupCanvas(), 50);
    }
    // Canvas drawing methods
    getMousePos(event) {
        const canvas = this.drawingCanvas;
        const rect = canvas.getBoundingClientRect();

        // Account for zoom level in calculations
        const scaleX = (canvas.width / rect.width) / this.zoomLevel;
        const scaleY = (canvas.height / rect.height) / this.zoomLevel;

        let clientX, clientY;

        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    startDrawing(event) {
        event.preventDefault();

        if (!this.ctx) return;

        const pos = this.getMousePos(event);
        this.startX = pos.x;
        this.startY = pos.y;
        this.isDrawing = true;

        const tool = this.drawingTools[this.currentTool];
        this.ctx.strokeStyle = tool.color;
        this.ctx.fillStyle = tool.color;

        if (this.currentTool === 'marker') {
            this.placeMarker(pos.x, pos.y);
            this.isDrawing = false;
        } else if (this.currentTool === 'freehand') {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.currentDrawing = {
                type: 'freehand',
                color: tool.color,
                points: [pos]
            };
        } else {
            this.currentDrawing = {
                type: this.currentTool,
                color: tool.color,
                startX: pos.x,
                startY: pos.y
            };
        }
    }

    draw(event) {
        if (!this.isDrawing || !this.ctx) return;

        event.preventDefault();

        const pos = this.getMousePos(event);

        if (this.currentTool === 'freehand') {
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.currentDrawing.points.push(pos);
        }
    }

    stopDrawing(event) {
        if (!this.isDrawing) return;

        event.preventDefault();
        this.isDrawing = false;

        if (!this.ctx || this.currentTool === 'marker') return;

        const pos = this.getMousePos(event);

        if (this.currentTool === 'freehand') {
            this.drawings.push(this.currentDrawing);
        } else {
            this.currentDrawing.endX = pos.x;
            this.currentDrawing.endY = pos.y;
            this.drawShape(this.currentDrawing);
            this.drawings.push(this.currentDrawing);
        }

        this.currentDrawing = null;
    }

    drawShape(drawing) {
        if (!this.ctx) return;

        this.ctx.strokeStyle = drawing.color;
        this.ctx.fillStyle = drawing.color;
        this.ctx.lineWidth = 3;

        const width = drawing.endX - drawing.startX;
        const height = drawing.endY - drawing.startY;

        switch (drawing.type) {
            case 'circle':
                const radius = Math.sqrt(width * width + height * height) / 2;
                const centerX = drawing.startX + width / 2;
                const centerY = drawing.startY + height / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;

            case 'rectangle':
                this.ctx.beginPath();
                this.ctx.rect(drawing.startX, drawing.startY, width, height);
                this.ctx.stroke();
                break;

            case 'arrow':
                this.drawArrow(drawing.startX, drawing.startY, drawing.endX, drawing.endY);
                break;
        }
    }

    drawArrow(startX, startY, endX, endY) {
        const headlen = 15;
        const angle = Math.atan2(endY - startY, endX - startX);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    placeMarker(x, y) {
        const drawing = {
            type: 'marker',
            color: this.drawingTools.marker.color,
            x: x,
            y: y
        };

        this.ctx.fillStyle = drawing.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.drawings.push(drawing);
    }

    redrawAll() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

        this.drawings.forEach(drawing => {
            this.ctx.strokeStyle = drawing.color;
            this.ctx.fillStyle = drawing.color;
            this.ctx.lineWidth = 3;

            if (drawing.type === 'freehand') {
                if (drawing.points && drawing.points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
                    for (let i = 1; i < drawing.points.length; i++) {
                        this.ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
                    }
                    this.ctx.stroke();
                }
            } else if (drawing.type === 'marker') {
                this.ctx.fillStyle = drawing.color;
                this.ctx.beginPath();
                this.ctx.arc(drawing.x, drawing.y, 8, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                this.drawShape(drawing);
            }
        });
    }

    // Notes management
    addNote() {
        const textarea = document.getElementById('damageNotes');
        const noteText = textarea.value.trim();

        if (!noteText) {
            window.app?.showToast('Please enter a note before adding', 'warning');
            return;
        }

        const note = {
            id: Date.now(),
            text: noteText,
            timestamp: new Date().toISOString()
        };

        this.damageMarkers.push(note);
        textarea.value = '';

        const notesContainer = document.getElementById('damageItems');
        if (notesContainer) {
            notesContainer.innerHTML = this.renderNotesList();
        }

        const countElement = document.querySelector('.damage-count');
        if (countElement) {
            countElement.textContent = this.damageMarkers.length;
        }

        window.app?.showToast('Note added successfully', 'success');
    }

    editNote(index) {
        const note = this.damageMarkers[index];
        if (!note) return;

        const modalContent = `
            <div class="modal-header">
                <h2>✏️ Edit Note</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Note Text</label>
                    <textarea
                        id="editNoteText"
                        class="form-textarea"
                        rows="4"
                    >${note.text}</textarea>
                </div>
                <div class="modal-actions">
                    <button class="button button-outline" onclick="app.closeModal()">
                        Cancel
                    </button>
                    <button class="button button-primary" onclick="Damage.saveEditedNote(${index})">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        `;

        window.app?.showModal(modalContent);
    }

    saveEditedNote(index) {
        const newText = document.getElementById('editNoteText').value.trim();

        if (!newText) {
            window.app?.showToast('Note cannot be empty', 'warning');
            return;
        }

        this.damageMarkers[index].text = newText;
        this.damageMarkers[index].edited = new Date().toISOString();

        const notesContainer = document.getElementById('damageItems');
        if (notesContainer) {
            notesContainer.innerHTML = this.renderNotesList();
        }

        window.app?.closeModal();
        window.app?.showToast('Note updated successfully', 'success');
    }

    removeNote(index) {
        if (confirm('Are you sure you want to remove this note?')) {
            this.damageMarkers.splice(index, 1);

            const notesContainer = document.getElementById('damageItems');
            if (notesContainer) {
                notesContainer.innerHTML = this.renderNotesList();
            }

            const countElement = document.querySelector('.damage-count');
            if (countElement) {
                countElement.textContent = this.damageMarkers.length;
            }

            window.app?.showToast('Note removed', 'info');
        }
    }

    clearAll() {
        if (this.drawings.length === 0 && this.damageMarkers.length === 0) {
            window.app?.showToast('Nothing to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all drawings and notes?')) {
            this.drawings = [];
            this.damageMarkers = [];

            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            }

            const textarea = document.getElementById('damageNotes');
            if (textarea) {
                textarea.value = '';
            }

            const notesContainer = document.getElementById('damageItems');
            if (notesContainer) {
                notesContainer.innerHTML = this.renderNotesList();
            }

            const countElement = document.querySelector('.damage-count');
            if (countElement) {
                countElement.textContent = '0';
            }

            window.app?.showToast('All content cleared', 'info');
        }
    }

    saveInspection() {
        if (this.drawings.length === 0 && this.damageMarkers.length === 0) {
            if (!confirm('No damage markings or notes found. Save empty inspection?')) {
                return;
            }
        }

        const inspection = {
            vehicle: this.currentVehicle || { make: 'Unknown', model: 'Vehicle', year: new Date().getFullYear() },
            timestamp: new Date().toISOString(),
            drawings: this.drawings,
            notes: this.damageMarkers,
            inspector: 'Current User',
            canvas_data: this.drawingCanvas ? this.drawingCanvas.toDataURL() : null
        };

        const inspections = JSON.parse(localStorage.getItem('damage_inspections') || '[]');
        inspections.push(inspection);
        localStorage.setItem('damage_inspections', JSON.stringify(inspections));

        window.app?.showToast('✅ Damage inspection saved successfully!', 'success');
    }

    loadPreviousInspection() {
        const inspections = JSON.parse(localStorage.getItem('damage_inspections') || '[]');

        if (inspections.length === 0) {
            window.app?.showToast('No previous inspections found', 'info');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>📂 Load Previous Inspection</h2>
                <button class="modal-close" onclick="app.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div style="max-height: 400px; overflow-y: auto;">
                    ${inspections.reverse().map((inspection, index) => `
                        <div class="inspection-item" style="border: 1px solid #e1e8ed; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; cursor: pointer;" onclick="Damage.loadInspection(${inspections.length - 1 - index})">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600; color: #2c3e50;">
                                        ${inspection.vehicle?.year || ''} ${inspection.vehicle?.make || 'Unknown'} ${inspection.vehicle?.model || 'Vehicle'}
                                    </div>
                                    <div style="font-size: 0.9rem; color: #7f8c8d;">
                                        ${new Date(inspection.timestamp).toLocaleString()}
                                    </div>
                                    <div style="font-size: 0.8rem; color: #7f8c8d;">
                                        ${inspection.drawings?.length || 0} drawings, ${inspection.notes?.length || 0} notes
                                    </div>
                                </div>
                                <div style="color: #667eea;">→</div>
                            </div>
                        </div>
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

    loadInspection(index) {
        const inspections = JSON.parse(localStorage.getItem('damage_inspections') || '[]');
        const inspection = inspections[index];

        if (!inspection) {
            window.app?.showToast('Inspection not found', 'error');
            return;
        }

        this.drawings = inspection.drawings || [];
        this.damageMarkers = inspection.notes || [];
        this.currentVehicle = inspection.vehicle;

        window.app?.closeModal();
        this.render();

        window.app?.showToast(`Loaded inspection from ${new Date(inspection.timestamp).toLocaleDateString()}`, 'success');
    }

    exportReport() {
        const report = {
            vehicle: this.currentVehicle || { make: 'Unknown', model: 'Vehicle', year: new Date().getFullYear() },
            inspection_date: new Date().toISOString(),
            inspector: 'Current User',
            total_drawings: this.drawings.length,
            total_notes: this.damageMarkers.length,
            drawings: this.drawings.map((drawing, index) => ({
                id: index + 1,
                type: drawing.type,
                color: drawing.color,
                coordinates: this.getDrawingCoordinates(drawing)
            })),
            notes: this.damageMarkers.map((note, index) => ({
                id: index + 1,
                text: note.text,
                timestamp: note.timestamp,
                edited: note.edited || null
            })),
            canvas_image: this.drawingCanvas ? this.drawingCanvas.toDataURL() : null
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const vehicleName = this.currentVehicle ?
            `${this.currentVehicle.make}_${this.currentVehicle.model}_${this.currentVehicle.license_plate}` :
            'vehicle_inspection';

        a.download = `damage_report_${vehicleName}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        window.app?.showToast('📤 Damage report exported successfully', 'success');
    }

    getDrawingCoordinates(drawing) {
        switch (drawing.type) {
            case 'circle':
            case 'rectangle':
            case 'arrow':
                return {
                    start: { x: drawing.startX, y: drawing.startY },
                    end: { x: drawing.endX, y: drawing.endY }
                };
            case 'marker':
                return { x: drawing.x, y: drawing.y };
            case 'freehand':
                return { points: drawing.points };
            default:
                return {};
        }
    }

    renderError(error) {
        const html = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Damage Inspection</h2>
                <p class="error-message">${error.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="button button-primary" onclick="Damage.load()">
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

// Create global damage inspection instance
window.Damage = new DamageInspectionModule();

console.log('✅ Damage module loaded successfully');