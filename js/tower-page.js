// Wisdom Tower page specific script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    window.game = new Game();
    window.game.currentLevel = new TowerLevel(window.game);
    
    // Setup page-specific UI updates
    setupTowerUI();
    
    // Start game
    window.game.currentLevel.init();
    window.game.isPlaying = true;
    window.game.gameLoop();
});

function setupTowerUI() {
    // Update progress display
    const updateProgress = () => {
        if (window.game && window.game.currentLevel) {
            const level = window.game.currentLevel;
            document.getElementById('level-count').textContent = 
                `${level.currentLevel}/${level.maxLevels}`;
            
            const accuracy = level.totalAnswers > 0 ? 
                Math.round(level.correctAnswers / level.totalAnswers * 100) : 0;
            document.getElementById('accuracy').textContent = `${accuracy}%`;
            document.getElementById('distraction-count').textContent = level.distractionEvents;
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
