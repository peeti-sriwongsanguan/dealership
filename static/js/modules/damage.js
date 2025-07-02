// static/js/modules/damage.js - Minimal Working Damage Inspection Module
console.log('🔍 Loading Damage module...');

class DamageInspectionModule {
    constructor() {
        this.vehicles = [];
        this.currentVehicle = null;
        this.currentTool = 'freehand';
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
        this.drawingHistory = []; // Store drawing history for undo

        // Simplified drawing tools - only working ones
        this.drawingTools = {
            freehand: {
                name: 'Freehand',
                color: '#f39c12',
                icon: '✏️',
                description: 'Draw freehand marks'
            },
            marker: {
                name: 'Marker',
                color: '#27ae60',
                icon: '📍',
                description: 'Place point markers'
            }
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

    async loadModule() {
        console.log('🔍 Loading damage inspection module for new app...');
        try {
            await this.loadVehicles();
            return this.getHTML();
        } catch (error) {
            console.error('Failed to load damage inspection module:', error);
            return this.getErrorHTML(error);
        }
    }

    getHTML() {
        return `
            <div class="damage-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">🔍 Vehicle Damage Inspection</h2>
                    <div class="action-bar-actions">
                        <!-- Main action buttons can go here if needed -->
                    </div>
                </div>

                <!-- Vehicle Selection -->
                <div class="vehicle-selector">
                    <h3>🚗 Vehicle Information</h3>
                    <div class="vehicle-grid">
                        ${this.renderVehicleOptions()}
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
                    <div class="instructions-box">
                        <strong>💡 How to use:</strong>
                        Select a drawing tool above, then draw directly on the vehicle diagram below.
                        Use freehand drawing for detailed marking or place markers at specific damage points.
                    </div>

                    <!-- Vehicle Canvas -->
                    <div class="canvas-container" id="canvasContainer">
                        ${this.renderVehicleCanvas()}

                        <!-- Zoom Controls -->
                        <div class="zoom-controls">
                            <button class="zoom-btn" onclick="window.Damage.zoomIn()" title="Zoom In">
                                +
                            </button>
                            <div class="zoom-level" id="zoomLevel">
                                ${Math.round(this.zoomLevel * 100)}%
                            </div>
                            <button class="zoom-btn" onclick="window.Damage.zoomOut()" title="Zoom Out">
                                −
                            </button>
                            <button class="zoom-btn" onclick="window.Damage.resetZoom()" title="Reset Zoom">
                                🔄
                            </button>
                        </div>
                    </div>

                    <!-- Drawing Action Controls -->
                    <div class="drawing-actions" style="margin-top: 1rem; text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <button class="button button-outline" onclick="window.Damage.undo()" title="Undo Last Drawing">
                            ↶ Undo
                        </button>
                        <button class="button button-outline" onclick="window.Damage.clearAll()" title="Clear All Drawings">
                            🗑️ Clear All
                        </button>
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
                    <div class="notes-input-section">
                        <textarea
                            id="damageNotes"
                            class="form-textarea"
                            placeholder="Add general notes about the vehicle condition, damage observations, or special instructions..."
                            rows="4"
                        ></textarea>
                        <button class="button button-outline notes-add-btn" onclick="window.Damage.addNote()">
                            ➕ Add Note
                        </button>
                    </div>
                    <div class="damage-items" id="damageItems">
                        ${this.renderNotesList()}
                    </div>

                    <!-- Save and Export Controls -->
                    <div class="save-export-actions" style="margin-top: 1.5rem; text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <button class="button button-outline" onclick="window.Damage.exportReport()" title="Export Damage Report">
                            📤 Export Report
                        </button>
                        <button class="button button-primary" onclick="window.Damage.saveInspection()" title="Save Inspection">
                            💾 Save Inspection
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getErrorHTML(error) {
        return `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Damage Inspection</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.olServiceApp.loadSection('damage')">
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
            if (response.ok) {
                const data = await response.json();
                this.vehicles = data.vehicles || [];
            } else {
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
        const html = this.getHTML();
        if (window.app) {
            window.app.setContent(html);
        }
        setTimeout(() => this.setupCanvas(), 100);
    }

    renderVehicleOptions() {
        if (this.vehicles.length === 0) {
            return `
                <div class="vehicle-option selected">
                    <div class="vehicle-icon">🚐</div>
                    <div class="vehicle-name">Default Vehicle Inspection</div>
                    <div class="vehicle-subtitle">
                        Use for any vehicle inspection
                    </div>
                </div>
            `;
        }

        return this.vehicles.map(vehicle => `
            <div class="vehicle-option ${this.currentVehicle?.id === vehicle.id ? 'selected' : ''}"
                 onclick="window.Damage.selectVehicle(${vehicle.id})">
                <div class="vehicle-icon">🚐</div>
                <div class="vehicle-name">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                <div class="vehicle-subtitle">
                    ${vehicle.license_plate} • ${vehicle.customer_name}
                </div>
            </div>
        `).join('');
    }

    renderDrawingTools() {
        return Object.entries(this.drawingTools).map(([tool, config]) => `
            <button class="tool-button ${this.currentTool === tool ? 'active' : ''}"
                    onclick="window.Damage.selectTool('${tool}')">
                <span>${config.icon}</span>
                ${config.name}
            </button>
        `).join('');
    }

    renderVehicleCanvas() {
        return `
            <div class="vehicle-canvas" id="vehicleCanvas" style="transform: scale(${this.zoomLevel});">
                <img src="/static/images/van_sketch.png"
                     alt="Van Sketch Diagram"
                     class="vehicle-image"
                     id="vehicleImage"
                     style="width: 600px; height: auto; max-width: 100%;"
                     crossorigin="anonymous"
                     onload="window.Damage.onImageLoad()"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIzMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj7wn5qQIFZhbiBEaWFncmFtPC90ZXh0Pjx0ZXh0IHg9IjMwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYmJiIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkNsaWNrIHRvIGFkZCB5b3VyIHZhbiBza2V0Y2g8L3RleHQ+PHRleHQgeD0iMzAwIiB5PSIyNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNiYmIiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+L3N0YXRpYy9pbWFnZXMvdmFuX3NrZXRjaC5wbmc8L3RleHQ+PC9zdmc+';">
                <canvas class="damage-canvas"
                        id="drawingCanvas"
                        onmousedown="window.Damage.startDrawing(event)"
                        onmousemove="window.Damage.draw(event)"
                        onmouseup="window.Damage.stopDrawing(event)"
                        ontouchstart="window.Damage.startDrawing(event)"
                        ontouchmove="window.Damage.draw(event)"
                        ontouchend="window.Damage.stopDrawing(event)"></canvas>
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
                    <div class="legend-description">${config.description}</div>
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
                    <div class="damage-type-indicator">
                        📝
                    </div>
                    <div class="damage-details">
                        <div class="damage-type">Note ${index + 1}</div>
                        <div class="damage-description">${note.text}</div>
                        <div class="damage-timestamp">
                            Added: ${new Date(note.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div class="damage-actions">
                    <button class="damage-item-btn" onclick="window.Damage.removeNote(${index})" title="Remove">
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

        if (image.complete) {
            this.initializeCanvas();
        } else {
            image.onload = () => this.initializeCanvas();
        }
    }

    initializeCanvas() {
        const image = document.getElementById('vehicleImage');
        const canvas = document.getElementById('drawingCanvas');

        if (!image || !canvas) return;

        canvas.width = image.offsetWidth;
        canvas.height = image.offsetHeight;

        this.drawingCanvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        console.log('✅ Canvas initialized:', canvas.width, 'x', canvas.height);
        this.redrawAll();
    }

    onImageLoad() {
        this.initializeCanvas();
    }

    selectTool(toolType) {
        this.currentTool = toolType;

        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[onclick*="selectTool('${toolType}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        const canvas = document.getElementById('drawingCanvas');
        if (canvas) {
            canvas.style.cursor = 'crosshair';
        }
    }

    selectVehicle(vehicleId) {
        this.currentVehicle = this.vehicles.find(v => v.id === vehicleId);

        if (window.olServiceApp && window.olServiceApp.currentSection === 'damage') {
            window.olServiceApp.loadSection('damage');
        } else {
            this.render();
        }
    }

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

        if (vehicleCanvas) {
            vehicleCanvas.style.transform = `scale(${this.zoomLevel})`;
        }

        if (zoomLevelDisplay) {
            zoomLevelDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }

        // Update canvas coordinates after zoom change
        setTimeout(() => this.setupCanvas(), 50);
    }

    saveDrawingState() {
        // Save current drawings state for undo functionality
        this.drawingHistory.push(JSON.parse(JSON.stringify(this.drawings)));

        // Limit history to last 20 actions to prevent memory issues
        if (this.drawingHistory.length > 20) {
            this.drawingHistory.shift();
        }
    }

    undo() {
        if (this.drawingHistory.length === 0) {
            if (typeof showToast !== 'undefined') {
                showToast('Nothing to undo', 'info');
            }
            return;
        }

        // Remove the last saved state (current state)
        this.drawingHistory.pop();

        // Restore to previous state
        if (this.drawingHistory.length > 0) {
            this.drawings = JSON.parse(JSON.stringify(this.drawingHistory[this.drawingHistory.length - 1]));
        } else {
            this.drawings = [];
        }

        // Redraw canvas with restored state
        this.redrawAll();

        if (typeof showToast !== 'undefined') {
            showToast('Last drawing undone', 'success');
        }
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

        if (this.currentTool === 'freehand') {
            this.drawings.push(this.currentDrawing);
            this.saveDrawingState(); // Save state for undo
        }

        this.currentDrawing = null;
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
        this.saveDrawingState(); // Save state for undo
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
            }
        });
    }

    addNote() {
        const textarea = document.getElementById('damageNotes');
        const noteText = textarea.value.trim();

        if (!noteText) {
            if (typeof showToast !== 'undefined') {
                showToast('Please enter a note before adding', 'warning');
            }
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

        if (typeof showToast !== 'undefined') {
            showToast('Note added successfully', 'success');
        }
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

            if (typeof showToast !== 'undefined') {
                showToast('Note removed', 'info');
            }
        }
    }

    clearAll() {
        if (this.drawings.length === 0 && this.damageMarkers.length === 0) {
            if (typeof showToast !== 'undefined') {
                showToast('Nothing to clear', 'info');
            }
            return;
        }

        if (confirm('Are you sure you want to clear all drawings and notes?')) {
            this.drawings = [];
            this.damageMarkers = [];
            this.drawingHistory = []; // Clear undo history too

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

            if (typeof showToast !== 'undefined') {
                showToast('All content cleared', 'info');
            }
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

        try {
            const inspections = JSON.parse(localStorage.getItem('damage_inspections') || '[]');
            inspections.push(inspection);
            localStorage.setItem('damage_inspections', JSON.stringify(inspections));

            if (typeof showToast !== 'undefined') {
                showToast('✅ Damage inspection saved successfully!', 'success');
            }
        } catch (error) {
            console.error('Failed to save inspection:', error);
            if (typeof showToast !== 'undefined') {
                showToast('❌ Failed to save inspection', 'error');
            }
        }
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
                coordinates: drawing.type === 'marker' ? { x: drawing.x, y: drawing.y } : { points: drawing.points }
            })),
            notes: this.damageMarkers.map((note, index) => ({
                id: index + 1,
                text: note.text,
                timestamp: note.timestamp
            })),
            canvas_image: this.drawingCanvas ? this.drawingCanvas.toDataURL() : null
        };

        try {
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

            if (typeof showToast !== 'undefined') {
                showToast('📤 Damage report exported successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to export report:', error);
            if (typeof showToast !== 'undefined') {
                showToast('❌ Failed to export report', 'error');
            }
        }
    }

    renderError(error) {
        const html = this.getErrorHTML(error);
        if (window.app) {
            window.app.setContent(html);
        }
    }
}

// Create global damage inspection instance
window.Damage = new DamageInspectionModule();

// Also create the expected module reference
window.damageModule = window.Damage;

console.log('✅ Damage module loaded successfully');