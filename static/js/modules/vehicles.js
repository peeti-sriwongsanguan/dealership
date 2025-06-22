// Vehicles module stub
class VehiclesModule {
    async init() {
        console.log('🚗 Vehicles module initialized');
    }
    
    async load() {
        if (window.app) {
            window.app.setContent(`
                <div class="coming-soon">
                    <div class="empty-state">
                        <div class="empty-state-icon">🚗</div>
                        <h3 class="empty-state-title">Vehicle Management</h3>
                        <p class="empty-state-description">Coming soon!</p>
                        <button class="button button-primary" onclick="app.goHome()">← Back to Home</button>
                    </div>
                </div>
            `);
        }
    }
}
window.Vehicles = new VehiclesModule();
