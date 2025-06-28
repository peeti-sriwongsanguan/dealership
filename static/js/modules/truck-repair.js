// static/js/modules/truck-repair.js
/**
 * Truck Repair Management Module
 * Integrated with OL Service POS
 */

class TruckRepairModule {
    constructor() {
        this.currentTab = 'materials';
        this.automotiveParts = [
            { thai: "ขากระจก", english: "Mirror Bracket", code: "MIR1" },
            { thai: "ไฟหน้า", english: "Headlight", code: "HEA1" },
            { thai: "ประตู", english: "Door", code: "DOO1" },
            { thai: "กระจก", english: "Window/Glass", code: "WIN1" },
            { thai: "ไฟท้าย", english: "Tail Light", code: "TAI1" },
            { thai: "กระจังหน้า", english: "Front Grille", code: "FRO1" },
            { thai: "กันชนหน้า", english: "Front Bumper", code: "FRO2" },
            { thai: "ไฟเลี้ยว", english: "Turn Signal", code: "TUR1" },
            { thai: "เบ้ามือโด", english: "Door Handle Housing", code: "DOO2" },
            { thai: "ที่ปัดน้ำฝน", english: "Windshield Wiper", code: "WIN2" },
            { thai: "แก้มไฟหรือหน้า", english: "Light Panel or Front Cover", code: "LIG1" },
            { thai: "พลาสติกบังฝุ่นหลัง", english: "Rear Dust Cover (Plastic)", code: "REA1" },
            { thai: "พลาสติกมุมกันชน", english: "Bumper Corner Plastic", code: "BUM1" },
            { thai: "พลาสติกปิดมุมกันชน", english: "Bumper Corner Cover", code: "BUM2" },
            { thai: "ไฟในกันชน", english: "Bumper Light", code: "BUM3" },
            { thai: "พลาสติกปิดกันชน", english: "Bumper Cover", code: "BUM4" },
            { thai: "กระป๋องดีดน้ำ", english: "Washer Fluid Container", code: "WAS1" },
            { thai: "แป้นจ่ายเบรคตรัซ", english: "Brake/Clutch Pedal", code: "BRA1" },
            { thai: "มือจับแยงหน้า", english: "Front Handle", code: "FRO3" },
            { thai: "กันสาดประตู", english: "Door Visor/Rain Guard", code: "DOO3" },
            { thai: "ซองไฟหน้า", english: "Headlight Housing", code: "HEA2" },
            { thai: "พลาสติกบนไฟเลี้ยว", english: "Plastic Above Turn Signal", code: "PLA1" },
            { thai: "เพ้องยกกระจกประตู", english: "Window Lifter Cover", code: "WIN3" },
            { thai: "สักหลาดกระจกประตู", english: "Door Window Felt/Seal", code: "DOO4" },
            { thai: "ขากันชน", english: "Bumper Bracket", code: "BUM5" },
            { thai: "ยางกระจกหน้า", english: "Front Windshield Rubber", code: "FRO4" },
            { thai: "แผงหน้ากระจัง", english: "Front Grille Panel", code: "FRO5" },
            { thai: "แผ่นรองแผงหน้า", english: "Front Panel Support Plate", code: "FRO6" },
            { thai: "โล่ไก่", english: "Radiator Shield", code: "RAD1" },
            { thai: "ไฟเลี้ยวข้างประตู", english: "Door Side Turn Signal", code: "DOO5" },
            { thai: "ไฟหลังคา", english: "Roof Light", code: "ROO1" },
            { thai: "มือเปิดประตู", english: "Door Handle", code: "DOO6" },
            { thai: "บังโคลนหน้า", english: "Front Fender", code: "FRO7" },
            { thai: "ไฟป้ายทะเบียน", english: "License Plate Light", code: "LIC1" },
            { thai: "ยางรอบกระจก", english: "Window Rubber Seal", code: "WIN4" }
        ];
    }

    // Get the template HTML for the truck repair system
    getTemplate() {
        return `
            <div class="truck-repair-container">
                <div class="truck-header">
                    <h1>🚛 ระบบจัดการซ่อมรถบรรทุก</h1>
                    <p>Truck Repair Management System</p>
                </div>

                <div class="truck-nav-container">
                    <div class="truck-nav-tabs">
                        <button class="truck-tab-button active" data-tab="materials">
                            📋 ใบเบิกวัสดุ
                        </button>
                        <button class="truck-tab-button" data-tab="quotes">
                            💰 ใบเสนอราคา
                        </button>
                    </div>
                </div>

                <div class="truck-container">
                    <!-- Materials Form -->
                    <div id="materials-form" class="truck-form-container active">
                        <div class="truck-form-content">
                            <div class="truck-form-title">
                                <h2>📋 ใบเบิกวัสดุ</h2>
                                <p>สำหรับการเบิกอะไหล่และวัสดุในการซ่อมรถบรรทุก</p>
                            </div>

                            <form id="materialForm">
                                <div class="truck-form-header">
                                    <div class="truck-form-group">
                                        <label for="vehicleReg">ทะเบียนรถ:</label>
                                        <input type="text" id="vehicleReg" name="vehicleReg" placeholder="เช่น กข-1234">
                                    </div>

                                    <div class="truck-form-group">
                                        <label for="date">วันที่:</label>
                                        <input type="date" id="date" name="date" required>
                                    </div>

                                    <div class="truck-form-group">
                                        <label for="requesterName">ชื่อผู้เบิก:</label>
                                        <input type="text" id="requesterName" name="requesterName" required placeholder="ระบุชื่อผู้เบิกวัสดุ">
                                    </div>

                                    <div class="truck-form-group">
                                        <label for="recipientName">ชื่อผู้จ่าย:</label>
                                        <input type="text" id="recipientName" name="recipientName" placeholder="ระบุชื่อผู้จ่ายวัสดุ">
                                    </div>
                                </div>

                                <table id="materialsTable" class="truck-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 50px;">ลำดับ</th>
                                            <th>รายการเบิกวัสดุ</th>
                                            <th style="width: 120px;">รหัสวัสดุ</th>
                                            <th style="width: 80px;">จำนวน</th>
                                            <th style="width: 80px;">หน่วย</th>
                                            <th style="width: 70px;">ลบ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            <td><input type="text" name="materialDesc" list="parts-list" autocomplete="off" placeholder="ระบุรายการวัสดุ"></td>
                                            <td><input type="text" name="materialCode" placeholder="รหัส"></td>
                                            <td><input type="number" name="quantity" min="0" step="1" placeholder="0"></td>
                                            <td><input type="text" name="unit" placeholder="หน่วย"></td>
                                            <td><button type="button" class="truck-remove-row">ลบ</button></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <button type="button" class="truck-add-row" id="addRowMaterials">+ เพิ่มรายการ</button>

                                <button type="submit" class="truck-submit-btn">💾 บันทึกรายการ</button>
                            </form>

                            <div id="materialMessage" class="truck-message"></div>
                        </div>
                    </div>

                    <!-- Quotes Form -->
                    <div id="quotes-form" class="truck-form-container">
                        <div class="truck-form-content">
                            <div class="truck-form-title">
                                <h2>💰 ใบเสนอราคาการซ่อมเสียหาย</h2>
                                <p>สำหรับการประเมินและเสนอราคาค่าซ่อมรถบรรทุก</p>
                            </div>

                            <form id="quoteForm">
                                <div class="truck-quote-header">
                                    <div class="truck-quote-number">
                                        <label for="quoteNumber">เลขที่:</label>
                                        <input type="text" id="quoteNumber" name="quoteNumber" readonly>
                                        <button type="button" id="generateQuoteNumber" class="truck-btn">🔄 สร้างเลขที่</button>
                                    </div>

                                    <div class="truck-dates">
                                        <div class="truck-form-group">
                                            <label for="damageDate">วันที่เกิดเหตุ:</label>
                                            <input type="date" id="damageDate" name="damageDate">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="quoteDate">วันที่เสนอราคา:</label>
                                            <input type="date" id="quoteDate" name="quoteDate" required>
                                        </div>
                                    </div>
                                </div>

                                <div class="truck-vehicle-info">
                                    <h3 style="margin-bottom: 1rem; color: var(--primary-color);">🚛 ข้อมูลรถ</h3>

                                    <div class="truck-form-row">
                                        <div class="truck-form-group">
                                            <label for="vehicleRegQuote">ทะเบียนรถ:</label>
                                            <input type="text" id="vehicleRegQuote" name="vehicleReg" placeholder="เช่น กข-1234">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="chassisNumber">เลขที่ตัวถัง:</label>
                                            <input type="text" id="chassisNumber" name="chassisNumber">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="engineNumber">เลขที่เครื่อง:</label>
                                            <input type="text" id="engineNumber" name="engineNumber">
                                        </div>
                                    </div>

                                    <div class="truck-form-row">
                                        <div class="truck-form-group">
                                            <label for="vehicleMake">ยี่ห้อ:</label>
                                            <input type="text" id="vehicleMake" name="vehicleMake" placeholder="เช่น Isuzu, Hino">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="vehicleModel">รุ่น:</label>
                                            <input type="text" id="vehicleModel" name="vehicleModel">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="vehicleYear">ปี:</label>
                                            <input type="number" id="vehicleYear" name="vehicleYear" min="1990" max="2030">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="vehicleColor">สี:</label>
                                            <input type="text" id="vehicleColor" name="vehicleColor">
                                        </div>
                                    </div>

                                    <div class="truck-form-row">
                                        <div class="truck-form-group">
                                            <label for="customerName">ชื่อลูกค้า:</label>
                                            <input type="text" id="customerName" name="customerName" placeholder="ระบุชื่อลูกค้า">
                                        </div>

                                        <div class="truck-form-group">
                                            <label for="repairType">ประเภทซ่อม:</label>
                                            <select id="repairType" name="repairType">
                                                <option value="collision">ซ่อมชน</option>
                                                <option value="maintenance">ซ่อมบำรุง</option>
                                                <option value="paint">ทำสี</option>
                                                <option value="other">อื่นๆ</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <h3 style="margin: 2rem 0 1rem 0; color: var(--primary-color); font-size: 1.25rem;">🔧 รายการความเสียหาย</h3>

                                <table id="quoteItemsTable" class="truck-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 50px;">ลำดับ</th>
                                            <th style="width: 100px;">รหัสอะไหล่</th>
                                            <th>รายการซ่อมที่เสียหาย</th>
                                            <th style="width: 80px;">สี</th>
                                            <th style="width: 80px;">ซ้าย/ขวา</th>
                                            <th style="width: 80px;">ชิ้น</th>
                                            <th style="width: 100px;">ราคาต่อหน่วย</th>
                                            <th style="width: 100px;">รวม</th>
                                            <th style="width: 60px;">ลบ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            <td><input type="text" name="partCode" list="parts-codes" placeholder="รหัส"></td>
                                            <td><input type="text" name="description" list="parts-list" autocomplete="off" placeholder="ระบุรายการที่เสียหาย"></td>
                                            <td>
                                                <select name="color">
                                                    <option value=""></option>
                                                    <option value="C3">C3</option>
                                                    <option value="B2">B2</option>
                                                    <option value="CO3">CO3</option>
                                                    <option value="B3">B3</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select name="side">
                                                    <option value=""></option>
                                                    <option value="ซ้าย">ซ้าย</option>
                                                    <option value="ขวา">ขวา</option>
                                                </select>
                                            </td>
                                            <td><input type="number" name="quantity" min="1" value="1" placeholder="1"></td>
                                            <td><input type="number" name="unitPrice" min="0" step="0.01" placeholder="0.00"></td>
                                            <td><input type="number" name="totalPrice" min="0" step="0.01" readonly class="truck-total-field"></td>
                                            <td><button type="button" class="truck-remove-row">ลบ</button></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div class="truck-quote-actions">
                                    <button type="button" class="truck-add-row" id="addRowQuotes">+ เพิ่มรายการ</button>

                                    <div class="truck-quote-totals">
                                        <div class="truck-total-row">
                                            <label for="totalAmount">💰 ยอดรวมทั้งสิ้น:</label>
                                            <input type="number" id="totalAmount" name="totalAmount" readonly>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" class="truck-submit-btn">💾 บันทึกใบเสนอราคา</button>
                            </form>

                            <div id="quoteMessage" class="truck-message"></div>
                        </div>
                    </div>
                </div>

                <!-- Hidden datalists for autocomplete -->
                <datalist id="parts-list"></datalist>
                <datalist id="parts-codes"></datalist>
            </div>
        `;
    }

    // Initialize the module
    init() {
        console.log('🚛 Initializing Truck Repair Module...');
        this.initializePartsSuggestions();
        this.bindEvents();
        this.setDefaultDates();
        this.generateQuoteNumber();
        console.log('✅ Truck Repair Module initialized');
    }

    // Initialize parts suggestions for autocomplete
    initializePartsSuggestions() {
        const partsDatalist = document.getElementById('parts-list');
        const codesDatalist = document.getElementById('parts-codes');

        if (partsDatalist) {
            partsDatalist.innerHTML = '';
            this.automotiveParts.forEach(part => {
                const option = document.createElement('option');
                option.value = part.thai;
                option.dataset.english = part.english;
                option.dataset.code = part.code;
                partsDatalist.appendChild(option);
            });
        }

        if (codesDatalist) {
            codesDatalist.innerHTML = '';
            this.automotiveParts.forEach(part => {
                const option = document.createElement('option');
                option.value = part.code;
                option.dataset.thai = part.thai;
                option.dataset.english = part.english;
                codesDatalist.appendChild(option);
            });
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('.truck-tab-button')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Add row buttons
        const addRowMaterials = document.getElementById('addRowMaterials');
        const addRowQuotes = document.getElementById('addRowQuotes');

        if (addRowMaterials) {
            addRowMaterials.addEventListener('click', () => this.addMaterialRow());
        }

        if (addRowQuotes) {
            addRowQuotes.addEventListener('click', () => this.addQuoteRow());
        }

        // Remove row buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.truck-remove-row')) {
                this.removeRow(e.target);
            }
        });

        // Form submissions
        const materialForm = document.getElementById('materialForm');
        const quoteForm = document.getElementById('quoteForm');

        if (materialForm) {
            materialForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitMaterialForm();
            });
        }

        if (quoteForm) {
            quoteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitQuoteForm();
            });
        }

        // Generate quote number
        const generateBtn = document.getElementById('generateQuoteNumber');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateQuoteNumber());
        }

        // Quote calculation
        document.addEventListener('input', (e) => {
            if (e.target.matches('#quoteItemsTable input[name="quantity"], #quoteItemsTable input[name="unitPrice"]')) {
                this.calculateRowTotal(e.target);
            }
        });

        // Auto-complete for parts
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[name="materialDesc"]')) {
                this.handleMaterialDescriptionChange(e.target);
            }
            if (e.target.matches('input[name="description"]')) {
                this.handlePartDescriptionChange(e.target);
            }
            if (e.target.matches('input[name="partCode"]')) {
                this.handlePartCodeChange(e.target);
            }
        });
    }

    // Set default dates
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('date');
        const quoteDateInput = document.getElementById('quoteDate');

        if (dateInput && !dateInput.value) {
            dateInput.value = today;
        }
        if (quoteDateInput && !quoteDateInput.value) {
            quoteDateInput.value = today;
        }
    }

    // Switch between tabs
    switchTab(tabName) {
        // Hide all forms
        document.querySelectorAll('.truck-form-container').forEach(container => {
            container.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.truck-tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected form
        const targetForm = document.getElementById(tabName + '-form');
        if (targetForm) {
            targetForm.classList.add('active');
        }

        // Activate clicked button
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.currentTab = tabName;
    }

    // Add material row
    addMaterialRow() {
        const tbody = document.querySelector('#materialsTable tbody');
        if (!tbody) return;

        const rowCount = tbody.rows.length;
        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td><input type="text" name="materialDesc" list="parts-list" autocomplete="off" placeholder="ระบุรายการวัสดุ"></td>
            <td><input type="text" name="materialCode" placeholder="รหัส"></td>
            <td><input type="number" name="quantity" min="0" step="1" placeholder="0"></td>
            <td><input type="text" name="unit" placeholder="หน่วย"></td>
            <td><button type="button" class="truck-remove-row">ลบ</button></td>
        `;
    }

    // Add quote row
    addQuoteRow() {
        const tbody = document.querySelector('#quoteItemsTable tbody');
        if (!tbody) return;

        const rowCount = tbody.rows.length;
        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>${rowCount + 1}</td>
            <td><input type="text" name="partCode" list="parts-codes" placeholder="รหัส"></td>
            <td><input type="text" name="description" list="parts-list" autocomplete="off" placeholder="ระบุรายการที่เสียหาย"></td>
            <td>
                <select name="color">
                    <option value=""></option>
                    <option value="C3">C3</option>
                    <option value="B2">B2</option>
                    <option value="CO3">CO3</option>
                    <option value="B3">B3</option>
                </select>
            </td>
            <td>
                <select name="side">
                    <option value=""></option>
                    <option value="ซ้าย">ซ้าย</option>
                    <option value="ขวา">ขวา</option>
                </select>
            </td>
            <td><input type="number" name="quantity" min="1" value="1" placeholder="1"></td>
            <td><input type="number" name="unitPrice" min="0" step="0.01" placeholder="0.00"></td>
            <td><input type="number" name="totalPrice" min="0" step="0.01" readonly class="truck-total-field"></td>
            <td><button type="button" class="truck-remove-row">ลบ</button></td>
        `;
    }

    // Remove row
    removeRow(button) {
        const row = button.closest('tr');
        const table = button.closest('table');
        const tbody = table.querySelector('tbody');

        if (tbody.rows.length > 1) {
            row.remove();
            this.updateRowNumbers(table);
            if (table.id === 'quoteItemsTable') {
                this.calculateTotal();
            }
        } else {
            // Clear the row instead of removing it
            row.querySelectorAll('input').forEach(input => {
                input.value = input.name === 'quantity' ? '1' : '';
            });
            row.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            if (table.id === 'quoteItemsTable') {
                this.calculateTotal();
            }
        }
    }

    // Update row numbers after deletion
    updateRowNumbers(table) {
        const tbody = table.querySelector('tbody');
        const rows = tbody.rows;
        for (let i = 0; i < rows.length; i++) {
            rows[i].cells[0].textContent = i + 1;
        }
    }

    // Handle material description change
    handleMaterialDescriptionChange(input) {
        const row = input.closest('tr');
        const codeInput = row.querySelector('input[name="materialCode"]');
        const selectedPart = this.automotiveParts.find(part => part.thai === input.value);
        if (selectedPart && codeInput) {
            codeInput.value = selectedPart.code;
        }
    }

    // Handle part description change
    handlePartDescriptionChange(input) {
        const row = input.closest('tr');
        const codeInput = row.querySelector('input[name="partCode"]');
        const selectedPart = this.automotiveParts.find(part => part.thai === input.value);
        if (selectedPart && codeInput) {
            codeInput.value = selectedPart.code;
        }
    }

    // Handle part code change
    handlePartCodeChange(input) {
        const row = input.closest('tr');
        const descInput = row.querySelector('input[name="description"]');
        const selectedPart = this.automotiveParts.find(part => part.code === input.value);
        if (selectedPart && descInput && !descInput.value) {
            descInput.value = selectedPart.thai;
        }
    }

    // Calculate row total for quotes
    calculateRowTotal(input) {
        const row = input.closest('tr');
        const quantityInput = row.querySelector('input[name="quantity"]');
        const unitPriceInput = row.querySelector('input[name="unitPrice"]');
        const totalPriceInput = row.querySelector('input[name="totalPrice"]');

        const quantity = parseInt(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;

        totalPriceInput.value = (quantity * unitPrice).toFixed(2);
        this.calculateTotal();
    }

    // Calculate total amount for quotes
    calculateTotal() {
        const tbody = document.querySelector('#quoteItemsTable tbody');
        const totalAmountInput = document.getElementById('totalAmount');

        if (!tbody || !totalAmountInput) return;

        const rows = tbody.rows;
        let total = 0;

        for (let i = 0; i < rows.length; i++) {
            const totalPriceInput = rows[i].querySelector('input[name="totalPrice"]');
            total += parseFloat(totalPriceInput.value || 0);
        }

        totalAmountInput.value = total.toFixed(2);
    }

    // Generate quote number
    async generateQuoteNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        try {
            // Try to get from API first
            const response = await fetch(`/api/quotes/generate-number?year=${year}&month=${month}`);
            if (response.ok) {
                const data = await response.json();
                const quoteNumberInput = document.getElementById('quoteNumber');
                if (quoteNumberInput) {
                    quoteNumberInput.value = data.quote_number;
                }
            } else {
                throw new Error('API call failed');
            }
        } catch (error) {
            console.error('Error generating quote number:', error);
            // Fallback quote number generation
            const quoteNumberInput = document.getElementById('quoteNumber');
            if (quoteNumberInput) {
                quoteNumberInput.value = `Q${year.toString().substring(2)}${month}0001`;
            }
        }
    }

    // Submit material form
    async submitMaterialForm() {
        const requesterName = document.getElementById('requesterName').value.trim();
        if (!requesterName) {
            this.showMessage('materialMessage', 'กรุณาระบุชื่อผู้เบิก', 'error');
            return;
        }

        const tbody = document.querySelector('#materialsTable tbody');
        let hasItems = false;
        const rows = tbody.rows;

        for (let i = 0; i < rows.length; i++) {
            const desc = rows[i].querySelector('input[name="materialDesc"]').value.trim();
            if (desc) {
                hasItems = true;
                break;
            }
        }

        if (!hasItems) {
            this.showMessage('materialMessage', 'กรุณาระบุรายการวัสดุอย่างน้อย 1 รายการ', 'error');
            return;
        }

        const formData = {
            vehicle_registration: document.getElementById('vehicleReg').value,
            date: document.getElementById('date').value,
            requester_name: requesterName,
            recipient_name: document.getElementById('recipientName').value,
            items: []
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const materialDesc = row.querySelector('input[name="materialDesc"]').value.trim();
            if (!materialDesc) continue;

            formData.items.push({
                item_number: i + 1,
                material_description: materialDesc,
                material_code: row.querySelector('input[name="materialCode"]').value,
                quantity: parseInt(row.querySelector('input[name="quantity"]').value) || 0,
                unit: row.querySelector('input[name="unit"]').value
            });
        }

        this.showMessage('materialMessage', 'กำลังบันทึกข้อมูล...', 'info');

        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }

            const data = await response.json();
            this.showMessage('materialMessage', `บันทึกรายการสำเร็จ (เลขที่: ${data.id})`, 'success');

            // Reset form after 2 seconds
            setTimeout(() => {
                this.resetMaterialForm();
            }, 2000);

        } catch (error) {
            this.showMessage('materialMessage', 'เกิดข้อผิดพลาด: ' + error.message, 'error');
        }
    }

    // Submit quote form
    async submitQuoteForm() {
        const quoteNumber = document.getElementById('quoteNumber').value.trim();
        if (!quoteNumber) {
            this.showMessage('quoteMessage', 'กรุณาสร้างเลขที่ใบเสนอราคา', 'error');
            return;
        }

        const tbody = document.querySelector('#quoteItemsTable tbody');
        let hasItems = false;
        const rows = tbody.rows;

        for (let i = 0; i < rows.length; i++) {
            const desc = rows[i].querySelector('input[name="description"]').value.trim();
            if (desc) {
                hasItems = true;
                break;
            }
        }

        if (!hasItems) {
            this.showMessage('quoteMessage', 'กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ', 'error');
            return;
        }

        const formData = {
            quote_number: quoteNumber,
            vehicle_registration: document.getElementById('vehicleRegQuote').value,
            chassis_number: document.getElementById('chassisNumber').value,
            engine_number: document.getElementById('engineNumber').value,
            damage_date: document.getElementById('damageDate').value,
            quote_date: document.getElementById('quoteDate').value,
            customer_name: document.getElementById('customerName').value,
            vehicle_make: document.getElementById('vehicleMake').value,
            vehicle_model: document.getElementById('vehicleModel').value,
            vehicle_year: document.getElementById('vehicleYear').value || null,
            vehicle_color: document.getElementById('vehicleColor').value,
            repair_type: document.getElementById('repairType').value,
            total_amount: document.getElementById('totalAmount').value || 0,
            status: 'new',
            items: []
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const description = row.querySelector('input[name="description"]').value.trim();
            if (!description) continue;

            const unitPrice = parseFloat(row.querySelector('input[name="unitPrice"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="quantity"]').value) || 1;

            formData.items.push({
                item_number: i + 1,
                part_code: row.querySelector('input[name="partCode"]').value,
                description: description,
                color: row.querySelector('select[name="color"]').value,
                side: row.querySelector('select[name="side"]').value,
                quantity: quantity,
                unit_price: unitPrice,
                total_price: unitPrice * quantity
            });
        }

        this.showMessage('quoteMessage', 'กำลังบันทึกข้อมูล...', 'info');

        try {
            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }

            const data = await response.json();
            this.showMessage('quoteMessage', `บันทึกใบเสนอราคาสำเร็จ (เลขที่: ${quoteNumber})`, 'success');

            // Reset form after 2 seconds
            setTimeout(() => {
                this.resetQuoteForm();
            }, 2000);

        } catch (error) {
            this.showMessage('quoteMessage', 'เกิดข้อผิดพลาด: ' + error.message, 'error');
        }
    }

    // Reset material form
    resetMaterialForm() {
        const form = document.getElementById('materialForm');
        if (form) {
            form.reset();
            this.setDefaultDates();

            const tbody = document.querySelector('#materialsTable tbody');
            if (tbody) {
                while (tbody.rows.length > 1) {
                    tbody.deleteRow(1);
                }
                tbody.rows[0].querySelectorAll('input').forEach(input => input.value = '');
            }
        }
    }

    // Reset quote form
    resetQuoteForm() {
        const form = document.getElementById('quoteForm');
        if (form) {
            form.reset();
            this.setDefaultDates();

            const tbody = document.querySelector('#quoteItemsTable tbody');
            if (tbody) {
                while (tbody.rows.length > 1) {
                    tbody.deleteRow(1);
                }
                const firstRow = tbody.rows[0];
                firstRow.querySelectorAll('input').forEach(input => {
                    input.value = input.name === 'quantity' ? '1' : '';
                });
                firstRow.querySelectorAll('select').forEach(select => {
                    select.selectedIndex = 0;
                });
            }

            this.generateQuoteNumber();
            const totalAmount = document.getElementById('totalAmount');
            if (totalAmount) {
                totalAmount.value = '';
            }
        }
    }

    // Show message
    showMessage(elementId, text, type) {
        const messageDiv = document.getElementById(elementId);
        if (!messageDiv) return;

        messageDiv.textContent = text;
        messageDiv.className = `truck-message ${type}`;
        messageDiv.style.display = 'block';

        if (type !== 'error') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Get API URL
    getApiUrl() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        return `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
}

// Initialize the truck repair module when DOM is ready
let truckRepairModule = null;

// Export for use in services module
const TruckRepairManager = {
    async loadModule() {
        try {
            if (!truckRepairModule) {
                truckRepairModule = new TruckRepairModule();
            }

            const template = truckRepairModule.getTemplate();

            // Return the template, initialization will happen after it's inserted
            setTimeout(() => {
                truckRepairModule.init();
            }, 100);

            return template;
        } catch (error) {
            console.error('❌ Error loading truck repair module:', error);
            return `
                <div class="error-content">
                    <div class="error-icon">❌</div>
                    <h3>Error Loading Truck Repair Module</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Reload Page
                    </button>
                </div>
            `;
        }
    },

    showTruckRepairModal() {
        if (typeof showModal !== 'undefined') {
            showModal('Truck Repair Management', this.loadModule(), 'large');
        } else {
            console.error('showModal function not available');
        }
    },

    getInstance() {
        return truckRepairModule;
    }
};

// Make available globally
window.TruckRepairManager = TruckRepairManager;