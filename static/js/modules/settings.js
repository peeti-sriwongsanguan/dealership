// static/js/modules/settings.js - Settings and Customization Module
// SIMPLIFIED to work with your existing app structure

class SettingsModule {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.currentLogo = this.loadLogo();
        this.isLoading = false;
        this.presetThemes = [
            {
                name: 'Ocean Blue',
                primary: '#667eea',
                secondary: '#764ba2',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            {
                name: 'Sunset Orange',
                primary: '#ff6b6b',
                secondary: '#ffa726',
                gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)'
            },
            {
                name: 'Forest Green',
                primary: '#4caf50',
                secondary: '#81c784',
                gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
            },
            {
                name: 'Purple Dream',
                primary: '#9c27b0',
                secondary: '#ba68c8',
                gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)'
            },
            {
                name: 'Corporate Blue',
                primary: '#2196f3',
                secondary: '#64b5f6',
                gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)'
            },
            {
                name: 'Elegant Gray',
                primary: '#607d8b',
                secondary: '#90a4ae',
                gradient: 'linear-gradient(135deg, #607d8b 0%, #90a4ae 100%)'
            }
        ];
    }

    async init() {
        console.log('⚙️ Initializing Settings module...');
        this.applyTheme(this.currentTheme);
        this.applyLogo(this.currentLogo);
        console.log('✅ Settings module initialized');
    }

    // Method that your app.js expects
    async loadModule() {
        console.log('📄 Settings loadModule called');
        return this.getSettingsHTML();
    }

    // Your original load method
    async load() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            this.render();
        } catch (error) {
            console.error('Failed to load settings section:', error);
            this.renderError(error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        const html = this.getSettingsHTML();

        if (window.app && window.app.setContent) {
            window.app.setContent(html);
        }

        // Initialize after DOM update
        setTimeout(() => {
            this.initializeColorPickers();
        }, 100);
    }

    getSettingsHTML() {
        return `
            <div class="settings-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">⚙️ Settings & Customization</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="Settings.previewChanges()">
                            👁️ Preview
                        </button>
                        <button class="button button-primary" onclick="Settings.resetToDefaults()">
                            🔄 Reset
                        </button>
                    </div>
                </div>

                <!-- Settings Tabs -->
                <div class="settings-tabs">
                    <button class="settings-tab active" onclick="Settings.switchTab('theme')">
                        🎨 Theme
                    </button>
                    <button class="settings-tab" onclick="Settings.switchTab('branding')">
                        🏢 Branding
                    </button>
                    <button class="settings-tab" onclick="Settings.switchTab('advanced')">
                        ⚡ Advanced
                    </button>
                </div>

                <!-- Theme Settings -->
                <div class="settings-content active" id="themeSettings">
                    ${this.renderThemeSettings()}
                </div>

                <!-- Branding Settings -->
                <div class="settings-content" id="brandingSettings">
                    ${this.renderBrandingSettings()}
                </div>

                <!-- Advanced Settings -->
                <div class="settings-content" id="advancedSettings">
                    ${this.renderAdvancedSettings()}
                </div>

                <!-- Settings Actions -->
                <div class="settings-actions">
                    <button class="button button-outline" onclick="history.back()">
                        ← Back to Home
                    </button>
                    <button class="button button-primary" onclick="Settings.saveSettings()">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        `;
    }

    renderThemeSettings() {
        return `
            <div class="theme-section">
                <h3>🎨 Color Scheme</h3>
                <div class="color-picker-group">
                    <div class="color-picker-item">
                        <label class="color-picker-label">Primary Color</label>
                        <input type="color" class="color-picker" id="primaryColor" value="${this.currentTheme.primary}">
                        <div class="color-preview" id="primaryPreview" style="background: ${this.currentTheme.primary}">
                            Primary
                        </div>
                    </div>
                    <div class="color-picker-item">
                        <label class="color-picker-label">Secondary Color</label>
                        <input type="color" class="color-picker" id="secondaryColor" value="${this.currentTheme.secondary}">
                        <div class="color-preview" id="secondaryPreview" style="background: ${this.currentTheme.secondary}">
                            Secondary
                        </div>
                    </div>
                </div>
            </div>

            <div class="theme-section">
                <h3>🎭 Preset Themes</h3>
                <div class="preset-themes">
                    ${this.presetThemes.map(theme => `
                        <div class="preset-theme" onclick="Settings.applyPresetTheme('${theme.name}')">
                            <div class="preset-theme-preview" style="background: ${theme.gradient}"></div>
                            <div class="preset-theme-name">${theme.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderBrandingSettings() {
        return `
            <div class="theme-section">
                <h3>🏢 Company Logo</h3>
                <div class="logo-upload-section" ondrop="Settings.handleLogoDrop(event)" ondragover="Settings.handleLogoDragOver(event)" ondragleave="Settings.handleLogoDragLeave(event)">
                    <div class="logo-current" id="logoPreview">
                        ${this.currentLogo ? `<img src="${this.currentLogo}" alt="Current Logo">` : '🚐'}
                    </div>
                    <div>
                        <input type="file" id="logoInput" class="logo-upload-input" accept="image/*" onchange="Settings.handleLogoUpload(event)">
                        <button class="logo-upload-btn" onclick="document.getElementById('logoInput').click()">
                            📁 Choose Logo
                        </button>
                        <button class="logo-upload-btn" onclick="Settings.removeLogo()">
                            🗑️ Remove
                        </button>
                    </div>
                    <div class="logo-upload-text">
                        Drag & drop an image or click to browse<br>
                        <small>Recommended: 512x512px, PNG or SVG</small>
                    </div>
                </div>
            </div>

            <div class="theme-section">
                <h3>📝 Company Information</h3>
                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" id="companyName" value="OL Service POS" placeholder="Enter company name">
                </div>
                <div class="form-group">
                    <label class="form-label">App Title</label>
                    <input type="text" class="form-input" id="appTitle" value="Professional Vehicle Service Management" placeholder="Enter app subtitle">
                </div>
            </div>
        `;
    }

    renderAdvancedSettings() {
        return `
            <div class="theme-section">
                <h3>⚡ Performance & Features</h3>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" style="margin-right: 0.5rem;" checked>
                        Enable animations and transitions
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" style="margin-right: 0.5rem;" checked>
                        Show loading animations
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" style="margin-right: 0.5rem;">
                        Enable dark mode support
                    </label>
                </div>
            </div>

            <div class="theme-section">
                <h3>💾 Data Management</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="button button-outline" onclick="Settings.exportSettings()">
                        📤 Export Settings
                    </button>
                    <button class="button button-outline" onclick="Settings.importSettings()">
                        📥 Import Settings
                    </button>
                    <button class="button button-outline" onclick="Settings.clearCache()">
                        🗑️ Clear Cache
                    </button>
                </div>
            </div>

            <div class="theme-section">
                <h3>ℹ️ System Information</h3>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem;">
                    Version: 1.0.0<br>
                    Browser: ${navigator.userAgent.split(' ')[0]}<br>
                    Screen: ${screen.width}x${screen.height}<br>
                    API Status: <span style="color: #27ae60;">Connected</span>
                </div>
            </div>
        `;
    }

    initializeColorPickers() {
        const primaryPicker = document.getElementById('primaryColor');
        const secondaryPicker = document.getElementById('secondaryColor');

        if (primaryPicker) {
            primaryPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const preview = document.getElementById('primaryPreview');
                if (preview) {
                    preview.style.background = color;
                }
                this.updateThemePreview();
            });
        }

        if (secondaryPicker) {
            secondaryPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                const preview = document.getElementById('secondaryPreview');
                if (preview) {
                    preview.style.background = color;
                }
                this.updateThemePreview();
            });
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.settings-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        event.target.classList.add('active');
        document.getElementById(tabName + 'Settings').classList.add('active');
    }

    applyPresetTheme(themeName) {
        const theme = this.presetThemes.find(t => t.name === themeName);
        if (theme) {
            const primaryPicker = document.getElementById('primaryColor');
            const secondaryPicker = document.getElementById('secondaryColor');
            const primaryPreview = document.getElementById('primaryPreview');
            const secondaryPreview = document.getElementById('secondaryPreview');

            if (primaryPicker) primaryPicker.value = theme.primary;
            if (secondaryPicker) secondaryPicker.value = theme.secondary;
            if (primaryPreview) primaryPreview.style.background = theme.primary;
            if (secondaryPreview) secondaryPreview.style.background = theme.secondary;

            // Update active preset
            document.querySelectorAll('.preset-theme').forEach(pt => pt.classList.remove('active'));
            event.target.classList.add('active');

            this.updateThemePreview();

            // Simple alert instead of toast
            alert(`Applied ${themeName} theme`);
        }
    }

    updateThemePreview() {
        const primaryPicker = document.getElementById('primaryColor');
        const secondaryPicker = document.getElementById('secondaryColor');

        if (primaryPicker && secondaryPicker) {
            const primary = primaryPicker.value;
            const secondary = secondaryPicker.value;

            // Preview the theme changes in real-time
            const root = document.documentElement;
            root.style.setProperty('--primary-color', primary);
            root.style.setProperty('--secondary-color', secondary);
            root.style.setProperty('--gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
            root.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
        }
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) {
                    logoPreview.innerHTML = `<img src="${logoData}" alt="New Logo">`;
                }
                this.currentLogo = logoData;
                this.updateLogoPreview();
                alert('Logo uploaded successfully');
            };
            reader.readAsDataURL(file);
        }
    }

    handleLogoDrop(event) {
        event.preventDefault();
        event.target.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const fakeEvent = { target: { files: [file] } };
                this.handleLogoUpload(fakeEvent);
            }
        }
    }

    handleLogoDragOver(event) {
        event.preventDefault();
        event.target.classList.add('dragover');
    }

    handleLogoDragLeave(event) {
        event.target.classList.remove('dragover');
    }

    removeLogo() {
        this.currentLogo = null;
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.innerHTML = '🚐';
        }
        this.updateLogoPreview();
        alert('Logo removed');
    }

    updateLogoPreview() {
        // Update all logo instances
        const logos = document.querySelectorAll('.header-logo, .loading-logo');
        logos.forEach(logo => {
            if (this.currentLogo) {
                logo.innerHTML = `<img src="${this.currentLogo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                logo.innerHTML = '🚐';
            }
        });
    }

    previewChanges() {
        alert('Preview mode - Changes are applied in real-time!');
    }

    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            const defaultTheme = { primary: '#667eea', secondary: '#764ba2' };
            this.currentTheme = defaultTheme;
            this.currentLogo = null;

            this.applyTheme(defaultTheme);
            this.applyLogo(null);

            // Update form values
            const primaryColor = document.getElementById('primaryColor');
            const secondaryColor = document.getElementById('secondaryColor');
            const primaryPreview = document.getElementById('primaryPreview');
            const secondaryPreview = document.getElementById('secondaryPreview');

            if (primaryColor) primaryColor.value = defaultTheme.primary;
            if (secondaryColor) secondaryColor.value = defaultTheme.secondary;
            if (primaryPreview) primaryPreview.style.background = defaultTheme.primary;
            if (secondaryPreview) secondaryPreview.style.background = defaultTheme.secondary;

            alert('Settings reset to defaults');
        }
    }

    saveSettings() {
        try {
            const primaryColor = document.getElementById('primaryColor');
            const secondaryColor = document.getElementById('secondaryColor');

            const primary = primaryColor ? primaryColor.value : this.currentTheme.primary;
            const secondary = secondaryColor ? secondaryColor.value : this.currentTheme.secondary;

            const newTheme = { primary, secondary };
            this.currentTheme = newTheme;

            this.saveTheme(newTheme);
            this.saveLogo(this.currentLogo);
            this.applyTheme(newTheme);
            this.applyLogo(this.currentLogo);

            // Save company info
            const companyName = document.getElementById('companyName');
            const appTitle = document.getElementById('appTitle');

            if (companyName) {
                localStorage.setItem('ol_service_company_name', companyName.value);
            }
            if (appTitle) {
                localStorage.setItem('ol_service_app_title', appTitle.value);
            }

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`);
        root.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`);
    }

    applyLogo(logoData) {
        this.updateLogoPreview();
    }

    saveTheme(theme) {
        try {
            localStorage.setItem('ol_service_theme', JSON.stringify(theme));
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }

    loadTheme() {
        try {
            const saved = localStorage.getItem('ol_service_theme');
            return saved ? JSON.parse(saved) : { primary: '#667eea', secondary: '#764ba2' };
        } catch (error) {
            return { primary: '#667eea', secondary: '#764ba2' };
        }
    }

    saveLogo(logoData) {
        try {
            if (logoData) {
                localStorage.setItem('ol_service_logo', logoData);
            } else {
                localStorage.removeItem('ol_service_logo');
            }
        } catch (error) {
            console.error('Failed to save logo:', error);
        }
    }

    loadLogo() {
        try {
            return localStorage.getItem('ol_service_logo');
        } catch (error) {
            return null;
        }
    }

    exportSettings() {
        try {
            const settings = {
                theme: this.currentTheme,
                logo: this.currentLogo,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ol_service_settings.json';
            a.click();
            URL.revokeObjectURL(url);

            alert('Settings exported successfully');
        } catch (error) {
            alert('Failed to export settings');
        }
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const settings = JSON.parse(event.target.result);
                        if (settings.theme) {
                            this.currentTheme = settings.theme;
                            this.applyTheme(settings.theme);
                            this.saveTheme(settings.theme);
                        }
                        if (settings.logo) {
                            this.currentLogo = settings.logo;
                            this.applyLogo(settings.logo);
                            this.saveLogo(settings.logo);
                        }
                        alert('Settings imported successfully');
                        this.load(); // Refresh the settings page
                    } catch (error) {
                        alert('Failed to import settings');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearCache() {
        if (confirm('This will clear all cached data. Continue?')) {
            localStorage.clear();
            alert('Cache cleared successfully');
        }
    }

    renderError(error) {
        const html = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Settings</h2>
                <p class="error-message">${error.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="button button-primary" onclick="Settings.load()">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="history.back()">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;

        if (window.app && window.app.setContent) {
            window.app.setContent(html);
        }
    }
}

// Create both instances to work with any naming pattern
const settingsModule = new SettingsModule();
window.Settings = settingsModule;
window.settingsModule = settingsModule;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        settingsModule.init();
    });
} else {
    settingsModule.init();
}

console.log('✅ Settings module loaded and ready');