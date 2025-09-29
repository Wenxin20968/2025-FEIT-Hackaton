// Ancient Library page specific script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    window.game = new Game();
    window.game.currentLevel = new LibraryLevel(window.game);
    
    // Setup page-specific UI updates
    setupLibraryUI();
    
    // Start game
    window.game.currentLevel.init();
    window.game.isPlaying = true;
    window.game.gameLoop();
});

function setupLibraryUI() {
    // Update progress display
    const updateProgress = () => {
        if (window.game && window.game.currentLevel) {
            const level = window.game.currentLevel;
            const collectedCount = level.items.filter(item => item.collected).length;
            document.getElementById('collected-count').textContent = 
                `${collectedCount}/${level.items.length}`;
            
            const timeLeft = Math.max(0, 30 - Math.floor((Date.now() - level.startTime) / 1000));
            document.getElementById('time-left').textContent = timeLeft;
            document.getElementById('missed-count').textContent = level.missedItems;
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
