// Magic Forest page specific script - using new architecture
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing forest game with new architecture...');
    
    // Wait for all scripts to load
    setTimeout(() => {
        try {
            // Initialize forest level using new universal architecture
            initLevelPage('forest');
        } catch (error) {
            console.error('Error initializing forest game:', error);
        }
    }, 100);
});

function setupForestUI() {
    // Update progress display
    const updateProgress = () => {
        if (window.game && window.game.currentLevel) {
            const level = window.game.currentLevel;
            document.getElementById('progress-text').textContent = 
                `${level.currentTarget}/${level.path.length}`;
            document.getElementById('error-count').textContent = level.wrongPaths;
        }
    };
    
    // Update UI regularly
    setInterval(updateProgress, 100);
    
    // Pause button
    document.getElementById('pause-game').addEventListener('click', () => {
        if (window.game.isPaused) {
            window.game.resumeGame();
            document.getElementById('pause-game').textContent = '⏸️ Pause';
        } else {
            window.game.pauseGame();
            document.getElementById('pause-game').textContent = '▶️ Resume';
        }
    });
}
