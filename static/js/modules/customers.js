// static/js/modules/customers.js
/**
 * Customers Module - Customer Management for OL Service POS
 * Enhanced with Thai ID Card OCR Scanner
 */

class CustomersModule {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.isLoading = false;
        this.elements = {};
        this.ocrWorker = null;
        this.mediaStream = null;
    }

    /**
     * Initialize the customers module
     */
    async init() {
        console.log('📋 Initializing Customers module...');

        try {
            await this.loadCustomers();
            await this.initOCR();
            console.log('✅ Customers module initialized with OCR support');
        } catch (error) {
            console.error('❌ Failed to initialize Customers module:', error);
            throw error;
        }
    }

    /**
     * Initialize OCR capabilities
     */
    async initOCR() {
        try {
            // Pre-load Tesseract worker for better performance
            if (typeof Tesseract !== 'undefined') {
                console.log('🔍 Initializing OCR worker...');
                // We'll create the worker when needed to avoid blocking startup
            }
        } catch (error) {
            console.warn('OCR initialization failed:', error);
        }
    }

    /**
     * Load customers from API
     */
    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();

            this.customers = data.customers || [];
            console.log(`📋 Loaded ${this.customers.length} customers`);

        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
            throw error;
        }
    }

    /**
     * Load module for new app structure - returns HTML content
     */
    async loadModule() {
        console.log('📋 Loading customers module for new app...');

        try {
            await this.loadCustomers();
            return this.getHTML();
        } catch (error) {
            console.error('Failed to load customers module:', error);
            return this.getErrorHTML(error);
        }
    }

    /**
     * Get HTML content for the customers section
     */
    getHTML() {
        return `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">👥 Customer Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="window.Customers.exportCustomers()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="window.Customers.showAddModal()">
                            ➕ Add Customer
                        </button>
                    </div>
                </div>

                <!-- Customer Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.customers.length}</div>
                            <div class="stat-label">Total Customers</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📞</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithPhone()}</div>
                            <div class="stat-label">With Phone</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📧</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithEmail()}</div>
                            <div class="stat-label">With Email</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getRecentCustomers()}</div>
                            <div class="stat-label">This Month</div>
                        </div>
                    </div>
                </div>

                <!-- Customer Table -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Customer Directory</h3>
                        <div class="data-table-actions">
                            <div class="search-container">
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    class="form-input"
                                    style="width: 300px;"
                                    oninput="window.Customers.filterCustomers(this.value)"
                                >
                                <span class="search-icon">🔍</span>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderCustomerTable()}
                    </div>
                </div>

                <!-- OCR Styles -->
                <style>
                    .ocr-scanner {
                        background: #f8f9fa;
                        border: 2px dashed #dee2e6;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        text-align: center;
                        transition: all 0.3s ease;
                    }

                    .ocr-scanner:hover {
                        border-color: #667eea;
                        background: #f0f2ff;
                    }

                    .ocr-buttons {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        flex-wrap: wrap;
                        margin-bottom: 15px;
                    }

                    .ocr-button {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 25px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .ocr-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
                    }

                    .ocr-button.camera {
                        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    }

                    .ocr-button.camera:hover {
                        box-shadow: 0 8px 16px rgba(17, 153, 142, 0.3);
                    }

                    .ocr-preview {
                        margin: 15px 0;
                        max-width: 100%;
                    }

                    .ocr-preview img {
                        max-width: 100%;
                        max-height: 200px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .ocr-video-container {
                        position: relative;
                        margin: 15px 0;
                        display: none;
                    }

                    .ocr-video {
                        width: 100%;
                        max-width: 300px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .ocr-capture-btn {
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        margin-top: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .ocr-capture-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 12px rgba(255, 107, 107, 0.3);
                    }

                    .ocr-status {
                        padding: 12px;
                        border-radius: 6px;
                        margin: 10px 0;
                        font-weight: 500;
                        text-align: center;
                    }

                    .ocr-status.processing {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                    }

                    .ocr-status.success {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                    }

                    .ocr-status.error {
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        color: #721c24;
                    }

                    .ocr-progress-bar {
                        width: 100%;
                        height: 6px;
                        background: #e9ecef;
                        border-radius: 3px;
                        overflow: hidden;
                        margin: 8px 0;
                    }

                    .ocr-progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        width: 0%;
                        transition: width 0.3s ease;
                    }

                    .thai-text {
                        font-family: 'Sarabun', sans-serif;
                    }

                    .file-input-hidden {
                        display: none;
                    }

                    @media (max-width: 768px) {
                        .ocr-buttons {
                            flex-direction: column;
                            align-items: center;
                        }

                        .ocr-button {
                            width: 100%;
                            max-width: 250px;
                            justify-content: center;
                        }
                    }
                </style>
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
                <h2 class="error-title">Failed to Load Customers</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="button button-primary" onclick="window.olServiceApp.loadSection('customers')">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render customer table
     */
    renderCustomerTable() {
        if (this.customers.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Contact</th>
                            <th>Registration</th>
                            <th>Vehicles</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.customers.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render individual customer row
     */
    renderCustomerRow(customer) {
        const registrationDate = customer.registration_date ?
            new Date(customer.registration_date).toLocaleDateString() : 'Unknown';

        return `
            <tr onclick="window.Customers.viewCustomer(${customer.id})" class="table-row-clickable" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <div class="avatar">${this.getCustomerInitials(customer)}</div>
                        <div class="customer-details">
                            <div class="customer-name">${customer.name || 'Unnamed Customer'}</div>
                            <div class="customer-id">#${customer.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${customer.phone ? `<div class="contact-item">📞 ${customer.phone}</div>` : ''}
                        ${customer.email ? `<div class="contact-item">📧 ${customer.email}</div>` : ''}
                        ${!customer.phone && !customer.email ? '<span style="color: #7f8c8d;">No contact info</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="registration-date">${registrationDate}</div>
                </td>
                <td>
                    <span class="badge ${customer.vehicle_count > 0 ? 'badge-primary' : 'badge-secondary'}">
                        ${customer.vehicle_count || 0} vehicles
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.editCustomer(${customer.id})"
                            title="Edit Customer"
                        >
                            ✏️
                        </button>
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.viewVehicles(${customer.id})"
                            title="View Vehicles"
                        >
                            🚗
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">No customers found</h3>
                <p class="empty-state-description">
                    Get started by adding your first customer to the system.
                </p>
                <button class="button button-primary" onclick="window.Customers.showAddModal()">
                    ➕ Add First Customer
                </button>
            </div>
        `;
    }

    /**
     * Show add customer modal with OCR scanner
     */
    showAddModal() {
        console.log('🔧 Opening add customer modal with OCR...');

        // Get modal elements directly
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Set modal content with OCR scanner
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>➕ Add New Customer</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <!-- OCR Scanner Section -->
                <div class="ocr-scanner">
                    <h3 style="margin: 0 0 15px 0; color: #333;">🆔 Scan Thai ID Card / สแกนบัตรประชาชน</h3>
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                        Take a photo or upload an image of the Thai ID card to auto-fill customer information
                    </p>

                    <div class="ocr-buttons">
                        <input type="file" id="ocrFileInput" class="file-input-hidden" accept="image/*">
                        <button type="button" class="ocr-button" onclick="window.Customers.uploadIDImage()">
                            📂 Upload ID Card
                        </button>
                        <button type="button" class="ocr-button camera" onclick="window.Customers.startIDCamera()">
                            📷 Take Photo
                        </button>
                    </div>

                    <div id="ocrVideoContainer" class="ocr-video-container">
                        <video id="ocrVideo" class="ocr-video" autoplay muted></video>
                        <canvas id="ocrCanvas" style="display: none;"></canvas>
                        <div style="margin-top: 10px;">
                            <button type="button" class="ocr-capture-btn" onclick="window.Customers.captureIDPhoto()">
                                📸 Capture / ถ่ายรูป
                            </button>
                            <button type="button" class="ocr-capture-btn" onclick="window.Customers.stopIDCamera()"
                                style="background: #6c757d; margin-left: 10px;">
                                Stop / หยุด
                            </button>
                        </div>
                    </div>

                    <div id="ocrPreview" class="ocr-preview"></div>
                    <div id="ocrStatus"></div>
                    <div id="ocrProgressBar" class="ocr-progress-bar" style="display: none;">
                        <div id="ocrProgressFill" class="ocr-progress-fill"></div>
                    </div>
                </div>

                <!-- Customer Form -->
                <form id="addCustomerForm" onsubmit="window.Customers.handleAddCustomer(event)">
                    <div class="form-group">
                        <label class="form-label required">Customer Name</label>
                        <input
                            type="text"
                            name="name"
                            id="customerName"
                            class="form-input"
                            placeholder="Enter customer name"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            id="customerPhone"
                            class="form-input"
                            placeholder="(555) 123-4567"
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="customerEmail"
                            class="form-input"
                            placeholder="customer@example.com"
                        >
                    </div>

                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea
                            name="address"
                            id="customerAddress"
                            class="form-textarea"
                            placeholder="Enter customer address"
                            rows="3"
                        ></textarea>
                    </div>

                    <!-- Hidden ID-specific fields -->
                    <div class="form-group" style="display: none;">
                        <input type="text" name="id_number" id="customerIdNumber">
                        <input type="text" name="date_of_birth" id="customerDateOfBirth">
                        <input type="text" name="thai_name" id="customerThaiName">
                        <input type="text" name="english_name" id="customerEnglishName">
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Customer
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Add event listener for file input
        setTimeout(() => {
            const fileInput = document.getElementById('ocrFileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        this.processIDImage(e.target.files[0]);
                    }
                });
            }
        }, 100);

        // Show modal by adding active class
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log('✅ Modal displayed with OCR scanner');
    }

    /**
     * Upload ID image
     */
    uploadIDImage() {
        const fileInput = document.getElementById('ocrFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Start camera for ID scanning
     */
    async startIDCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            const video = document.getElementById('ocrVideo');
            const container = document.getElementById('ocrVideoContainer');

            if (video && container) {
                video.srcObject = this.mediaStream;
                container.style.display = 'block';
            }

        } catch (error) {
            console.error('Camera Error:', error);
            const statusDiv = document.getElementById('ocrStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status error">❌ Cannot access camera. Please check permissions. / ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์</div>';
            }
        }
    }

    /**
     * Capture photo from camera
     */
    captureIDPhoto() {
        const video = document.getElementById('ocrVideo');
        const canvas = document.getElementById('ocrCanvas');

        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Display captured image
        const previewDiv = document.getElementById('ocrPreview');
        if (previewDiv) {
            previewDiv.innerHTML = `<img src="${imageData}" alt="Captured ID" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        }

        // Process the captured image
        this.performOCR(imageData);

        // Stop camera
        this.stopIDCamera();
    }

    /**
     * Stop camera
     */
    stopIDCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        const container = document.getElementById('ocrVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Process uploaded ID image
     */
    processIDImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.getElementById('ocrPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `<img src="${e.target.result}" alt="Uploaded ID" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            }

            // Start OCR processing
            this.performOCR(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Perform OCR on Thai ID card
     */
    async performOCR(imageSrc) {
        const statusDiv = document.getElementById('ocrStatus');
        const progressBar = document.getElementById('ocrProgressBar');
        const progressFill = document.getElementById('ocrProgressFill');

        if (statusDiv) {
            statusDiv.innerHTML = '<div class="ocr-status processing">🔄 Processing ID card... / กำลังประมวลผลบัตรประชาชน...</div>';
        }

        if (progressBar) {
            progressBar.style.display = 'block';
        }

        try {
            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined') {
                throw new Error('OCR library not loaded. Please refresh the page.');
            }

            const worker = await Tesseract.createWorker(['eng', 'tha']);

            // Configure OCR for Thai ID cards
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-./: กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะาิีึืุูเแโใไํ่้๊๋์'
            });

            const result = await worker.recognize(imageSrc, {
                logger: m => {
                    if (m.status === 'recognizing text' && progressFill) {
                        const progress = Math.round(m.progress * 100);
                        progressFill.style.width = progress + '%';
                    }
                }
            });

            await worker.terminate();

            if (progressBar) {
                progressBar.style.display = 'none';
            }

            // Parse the OCR result and fill form
            this.parseThaiIDCard(result.data.text);

            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status success">✅ ID card processed successfully! / ประมวลผลบัตรประชาชนสำเร็จ!</div>';
            }

        } catch (error) {
            console.error('OCR Error:', error);
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status error">❌ Error processing ID card. Please try again. / เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่</div>';
            }
            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
    }

    /**
     * Parse Thai ID card OCR results and fill form
     */
    parseThaiIDCard(text) {
        console.log('OCR Result:', text);

        // Enhanced Thai ID card parsing patterns
        const patterns = {
            idNumber: /(\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1})/,
            dateOfBirth: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
            thaiName: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*([ก-๙\s]+)/,
            englishName: /(Mr\.|Mrs\.|Miss|MS\.)\s*([A-Za-z\s]+)/i,
            phone: /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/,
            email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        };

        // Extract and fill ID number
        const idMatch = text.match(patterns.idNumber);
        if (idMatch) {
            const formattedId = idMatch[1].replace(/[-\s]/g, '').replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
            this.setFormValue('customerIdNumber', formattedId);
        }

        // Extract dates (birth date primarily)
        const dateMatches = text.match(patterns.dateOfBirth);
        if (dateMatches && dateMatches.length >= 1) {
            this.setFormValue('customerDateOfBirth', dateMatches[0]);
        }

        // Extract Thai names and set as primary name
        const thaiMatch = text.match(patterns.thaiName);
        if (thaiMatch) {
            const thaiFullName = thaiMatch[1].trim();
            this.setFormValue('customerThaiName', thaiFullName);

            // Use Thai name as the primary customer name
            this.setFormValue('customerName', thaiFullName);

            // Try to parse first/last name
            const thaiNameParts = thaiFullName.split(/\s+/);
            if (thaiNameParts.length >= 2) {
                // For Thai names, typically first name + last name
                const firstName = thaiNameParts[0];
                const lastName = thaiNameParts.slice(1).join(' ');
                // Could add separate first/last name fields if needed
            }
        }

        // Extract English names (fallback if no Thai name)
        const englishMatch = text.match(patterns.englishName);
        if (englishMatch && !thaiMatch) {
            const englishFullName = englishMatch[2].trim();
            this.setFormValue('customerEnglishName', englishFullName);
            this.setFormValue('customerName', englishFullName);
        }

        // Extract phone number if present
        const phoneMatch = text.match(patterns.phone);
        if (phoneMatch) {
            this.setFormValue('customerPhone', phoneMatch[1]);
        }

        // Extract email if present (less common on ID cards)
        const emailMatch = text.match(patterns.email);
        if (emailMatch) {
            this.setFormValue('customerEmail', emailMatch[1]);
        }

        // Try to extract address information
        const addressKeywords = ['ที่อยู่', 'อำเภอ', 'จังหวัด', 'ตำบล', 'Address'];
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (addressKeywords.some(keyword => lines[i].includes(keyword))) {
                // Extract address from nearby lines
                const addressLines = lines.slice(i, i + 3).join(' ')
                    .replace(/ที่อยู่|Address/g, '')
                    .trim();
                if (addressLines && addressLines.length > 10) {
                    this.setFormValue('customerAddress', addressLines);
                    break;
                }
            }
        }

        // Show success notification
        window.showToast('ID card information extracted successfully!', 'success');
    }

    /**
     * Helper method to set form values safely
     */
    setFormValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;

            // Add visual feedback for auto-filled fields
            field.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                field.style.backgroundColor = '';
            }, 2000);
        }
    }

    /**
     * Handle add customer form submission
     */
    async handleAddCustomer(event) {
        event.preventDefault();
        console.log('📋 Submitting customer form...');

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

            // Parse name into first_name and last_name for database compatibility
            const fullName = formData.get('name').trim();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const customerData = {
                // Database schema fields
                first_name: firstName,
                last_name: lastName,
                name: fullName,
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                address: formData.get('address').trim(),
                city: '',  // Can be extended later
                state: '',
                zip_code: '',
                notes: '',

                // OCR extracted Thai ID data
                id_number: formData.get('id_number') ? formData.get('id_number').trim() : '',
                thai_name: formData.get('thai_name') ? formData.get('thai_name').trim() : '',
                english_name: formData.get('english_name') ? formData.get('english_name').trim() : '',
                date_of_birth: formData.get('date_of_birth') ? formData.get('date_of_birth').trim() : '',

                // Additional OCR fields that might be extracted
                issue_date: '',
                expiry_date: '',
                id_card_address: formData.get('address').trim() // Use form address as ID card address
            };

            console.log('Sending customer data:', customerData);

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Customer created:', result);

                // Show success message
                if (typeof window.showToast === 'function') {
                    window.showToast('Customer created successfully!', 'success');
                }

                // Close the modal
                if (typeof window.closeModal === 'function') {
                    window.closeModal();
                } else {
                    // Fallback: directly manipulate DOM
                    const modalOverlay = document.getElementById('modalOverlay');
                    if (modalOverlay) {
                        modalOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }

                // Reload the customers list
                await this.loadCustomers();

                // Refresh the display
                if (window.olServiceApp) {
                    window.olServiceApp.loadSection('customers');
                }
            } else {
                throw new Error(result.error || 'Failed to create customer');
            }

        } catch (error) {
            console.error('❌ Error creating customer:', error);
            window.showToast(error.message || 'Failed to create customer', 'error');
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Customer';
        }
    }

    /**
     * Filter customers based on search term
     */
    filterCustomers(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        const c = this.customers.find(c => c.id === customerId);
        if (!c) return;
        const form = `
            <form id="editCustomerForm" onsubmit="window.Customers.handleEditCustomer(event, ${customerId})">
                <div class="form-group">
                    <label>Name</label>
                    <input name="name" class="form-input" value="${c.name}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input name="phone" class="form-input" value="${c.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input name="email" class="form-input" value="${c.email || ''}">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" class="form-textarea">${c.address || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button class="button button-outline" type="button" onclick="closeModal()">Cancel</button>
                    <button class="button button-primary" type="submit">Save</button>
                </div>
            </form>`;
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>✏️ Edit Customer #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                ${form}
            </div>
        `;

        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
    }

    async handleEditCustomer(event, id) {
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        const update = {
            name: data.get('name').trim(),
            phone: data.get('phone').trim(),
            email: data.get('email').trim(),
            address: data.get('address').trim()
        };
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
            });
            if (!res.ok) throw new Error('Update failed');
            showToast('Customer updated', 'success');
            closeModal();
            await this.loadCustomers();
            window.olServiceApp.loadSection('customers');
        } catch (e) {
            console.error('❌ Update error:', e);
            showToast('Failed to update customer', 'error');
        }
    }

     /**
     * Show add vehicle modal
     */
    showAddVehicleModal(customerId) {
        console.log('➕ Adding vehicle for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add Vehicle for ${customer.name}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Customers.handleAddVehicle(event, ${customerId})">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Make</label>
                            <input type="text" name="make" class="form-input"
                                placeholder="e.g. Toyota" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Model</label>
                            <input type="text" name="model" class="form-input"
                                placeholder="e.g. Camry" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Year</label>
                            <input type="number" name="year" class="form-input"
                                placeholder="e.g. 2022" min="1900" max="2030">
                        </div>
                        <div class="form-group">
                            <label class="form-label">License Plate</label>
                            <input type="text" name="license_plate" class="form-input"
                                placeholder="e.g. ABC-1234">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">VIN</label>
                            <input type="text" name="vin" class="form-input"
                                placeholder="Vehicle Identification Number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <input type="text" name="color" class="form-input"
                                placeholder="e.g. Silver">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Vehicle Type</label>
                            <select name="vehicle_type" class="form-input">
                                <option value="car">Car</option>
                                <option value="truck">Truck</option>
                                <option value="suv">SUV</option>
                                <option value="van">Van</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mileage</label>
                            <input type="number" name="mileage" class="form-input"
                                placeholder="e.g. 50000" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-textarea" rows="3"
                            placeholder="Any additional notes about the vehicle"></textarea>
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
     * Handle add vehicle form submission
     */
    async handleAddVehicle(event, customerId) {
        event.preventDefault();
        console.log('🚗 Adding vehicle for customer:', customerId);

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);
            const vehicleData = {
                customer_id: customerId,
                make: formData.get('make').trim(),
                model: formData.get('model').trim(),
                year: formData.get('year') ? parseInt(formData.get('year')) : null,
                vin: formData.get('vin').trim(),
                license_plate: formData.get('license_plate').trim(),
                color: formData.get('color').trim(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : 0,
                vehicle_type: formData.get('vehicle_type'),
                notes: formData.get('notes').trim()
            };

            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to add vehicle');
            }

            window.showToast('Vehicle added successfully!', 'success');
            window.closeModal();

            // Reload the customers to update vehicle count
            await this.loadCustomers();

            // Show the updated vehicles list
            setTimeout(() => {
                this.viewVehicles(customerId);
            }, 300);

        } catch (error) {
            console.error('❌ Error adding vehicle:', error);
            window.showToast('Failed to add vehicle', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Vehicle';
        }
    }

    /**
     * Delete vehicle
     */
    async deleteVehicle(vehicleId, customerId) {
        if (!confirm('Are you sure you want to delete this vehicle?')) {
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

            window.showToast('Vehicle deleted successfully!', 'success');

            // Reload customers to update vehicle count
            await this.loadCustomers();

            // Refresh the vehicles list
            this.viewVehicles(customerId);

        } catch (error) {
            console.error('❌ Error deleting vehicle:', error);
            window.showToast(error.message || 'Failed to delete vehicle', 'error');
        }
    }

    /**
     * View customer details
     */
    viewCustomer(customerId) {
        console.log('👁️ Viewing customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>👤 Customer Details #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="customer-detail-view">
                    <div class="detail-section">
                        <h3>Basic Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${customer.name || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Customer ID:</span>
                            <span class="detail-value">#${customer.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Registered:</span>
                            <span class="detail-value">${customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${customer.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${customer.email || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${customer.address || 'Not provided'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Vehicle Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Total Vehicles:</span>
                            <span class="detail-value">${customer.vehicle_count || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="button button-outline" onclick="window.Customers.editCustomer(${customerId})">
                        ✏️ Edit
                    </button>
                    <button class="button button-primary" onclick="window.Customers.viewVehicles(${customerId})">
                        🚗 View Vehicles
                    </button>
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
     * View customer vehicles
     */
    async viewVehicles(customerId) {
        console.log('🚗 Viewing vehicles for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        try {
            // Fetch vehicles for this customer
            const response = await fetch(`/api/vehicles?customer_id=${customerId}`);
            const data = await response.json();
            const vehicles = data.vehicles || [];

            let vehicleContent = '';

            if (vehicles.length === 0) {
                vehicleContent = `
                    <div class="empty-state" style="padding: 40px 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🚗</div>
                        <h3 style="margin: 0 0 10px 0; color: #333;">No Vehicles Found</h3>
                        <p style="color: #666; margin-bottom: 20px;">This customer has no vehicles registered.</p>
                        <button class="button button-primary" onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add First Vehicle
                        </button>
                    </div>
                `;
            } else {
                const vehicleRows = vehicles.map(vehicle => `
                    <tr>
                        <td>
                            <div class="vehicle-info-with-photo">
                                ${this.renderCustomerVehicleDisplay(vehicle)}
                            </div>
                        </td>
                        <td>
                            <div>${vehicle.license_plate || 'No plate'}</div>
                            <div style="font-size: 12px; color: #666;">${vehicle.color || 'No color'}</div>
                        </td>
                        <td>
                            <div>${vehicle.vehicle_type || 'Car'}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' mi' : 'No mileage'}
                            </div>
                        </td>
                        <td>
                            <div class="vehicle-action-buttons">
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.editVehicle(${vehicle.id}, ${customerId})"
                                    title="Edit Vehicle">
                                    ✏️
                                </button>
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.viewVehiclePhotos(${vehicle.id})"
                                    title="View Photos">
                                    📷
                                </button>
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.deleteVehicle(${vehicle.id}, ${customerId})"
                                    title="Delete Vehicle"
                                    style="color: #dc3545; border-color: #dc3545;">
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                vehicleContent = `
                    <div class="vehicle-list">
                        <table class="data-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>License/Color</th>
                                    <th>Type/Mileage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vehicleRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            const modalContent = `
                <div class="modal-header">
                    <h2>🚗 Vehicles for ${customer.name}</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #666;">
                            Total vehicles: <strong>${vehicles.length}</strong>
                        </span>
                        <button class="button button-primary button-small"
                            onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add Vehicle
                        </button>
                    </div>
                    ${vehicleContent}
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
            console.error('❌ Error loading vehicles:', error);
            window.showToast('Failed to load vehicles', 'error');
        }
    }

    /**
     * Render vehicle display with photo for customer vehicle list
     */
    renderCustomerVehicleDisplay(vehicle) {
        const vehicleInfo = `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim();

        if (vehicle.photo_url || vehicle.photos) {
            const primaryPhoto = vehicle.photo_url || (vehicle.photos && vehicle.photos[0]?.url);

            return `
                <div class="customer-vehicle-with-photo">
                    <div class="vehicle-photo-thumbnail">
                        <img
                            src="${primaryPhoto}"
                            alt="${vehicleInfo}"
                            class="vehicle-thumbnail-img"
                            onclick="window.Customers.viewVehiclePhotos(${vehicle.id})"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >
                        <div class="vehicle-thumbnail-fallback" style="display: none;">
                            <span class="vehicle-icon">🚗</span>
                        </div>
                        ${vehicle.photos && vehicle.photos.length > 1 ? `
                            <div class="photo-count-badge">+${vehicle.photos.length - 1}</div>
                        ` : ''}
                    </div>
                    <div class="vehicle-text-info">
                        <div class="vehicle-name-primary">${vehicleInfo}</div>
                        <div class="vehicle-details-secondary">
                            VIN: ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="customer-vehicle-no-photo">
                    <div class="vehicle-icon-placeholder">
                        <span class="vehicle-icon">🚗</span>
                        <div class="add-photo-hint" onclick="window.Customers.addVehiclePhoto(${vehicle.id})">
                            📷 Add Photo
                        </div>
                    </div>
                    <div class="vehicle-text-info">
                        <div class="vehicle-name-primary">${vehicleInfo}</div>
                        <div class="vehicle-details-secondary">
                            VIN: ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Export customers
     */
    exportCustomers() {
        if (!this.customers.length) {
            if (typeof showToast === 'function') {
                showToast('No customers to export', 'warning');
            }
            return;
        }

        const headers = ['ID', 'Name', 'Phone', 'Email', 'Address'];
        const rows = this.customers.map(c => [c.id, c.name, c.phone, c.email, c.address]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${v || ''}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        const filename = `customers_export_${timestamp}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Utility methods
     */
    getCustomerInitials(customer) {
        if (!customer.name) return '?';

        const names = customer.name.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return customer.name[0].toUpperCase();
    }

    getCustomersWithPhone() {
        return this.customers.filter(c => c.phone && c.phone.trim()).length;
    }

    getCustomersWithEmail() {
        return this.customers.filter(c => c.email && c.email.trim()).length;
    }

    getRecentCustomers() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        return this.customers.filter(c => {
            if (!c.registration_date) return false;
            const regDate = new Date(c.registration_date);
            return regDate >= oneMonthAgo;
        }).length;
    }

    /**
     * Cleanup method called when module is unloaded
     */
    cleanup() {
        // Stop any active camera streams
        this.stopIDCamera();

        // Cleanup OCR worker if active
        if (this.ocrWorker) {
            this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
    }
}

// Create global instance
window.Customers = new CustomersModule();
window.customersModule = window.Customers;

// Initialize the module
window.Customers.init().catch(err => {
    console.error('Failed to initialize Customers module:', err);
});

console.log('✅ Enhanced Customers module with OCR loaded successfully');