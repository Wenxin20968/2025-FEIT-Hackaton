// Patience River page specific script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    window.game = new Game();
    window.game.currentLevel = new RiverLevel(window.game);
    
    // Setup page-specific UI updates
    setupRiverUI();
    
    // Start game
    window.game.currentLevel.init();
    window.game.isPlaying = true;
    window.game.gameLoop();
});

function setupRiverUI() {
    // Update progress display
    const updateProgress = () => {
        if (window.game && window.game.currentLevel) {
            const level = window.game.currentLevel;
            document.getElementById('success-count').textContent = 
                `${level.successfulCrossings}/3`;
            document.getElementById('premature-count').textContent = level.prematureClicks;
            document.getElementById('total-clicks').textContent = level.clickCount;
        }
    };
    
    // Regular UI updates
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
