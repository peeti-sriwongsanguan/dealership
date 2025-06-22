// Photos module stub
class PhotosModule {
    async init() {
        console.log('📸 Photos module initialized');
    }
    
    async load() {
        if (window.app) {
            window.app.setContent(`
                <div class="coming-soon">
                    <div class="empty-state">
                        <div class="empty-state-icon">📸</div>
                        <h3 class="empty-state-title">Photo Management</h3>
                        <p class="empty-state-description">Photo upload and gallery coming soon!</p>
                        <button class="button button-primary" onclick="app.goHome()">← Back to Home</button>
                    </div>
                </div>
            `);
        }
    }
}
window.Photos = new PhotosModule();
