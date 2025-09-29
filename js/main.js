// Main entry file
document.addEventListener('DOMContentLoaded', function() {
    // Add some extra styles and features
    addCustomStyles();
    setupKeyboardControls();
    
    // Only initialize game on main page
    if (document.getElementById('main-menu')) {
        // Main page does not need to initialize game
        console.log('Main page loaded');
    }
});

// Add custom styles
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .stars-display {
            font-size: 2em;
            margin: 10px 0;
            text-align: center;
        }
        
        .metric-item {
            margin: 15px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 8px;
        }
        
        .metric-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .metric-score {
            text-align: right;
            font-weight: bold;
            color: #666;
        }
        
        .overall-stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .stat-item {
            text-align: center;
            padding: 10px;
        }
        
        .stat-label {
            display: block;
            font-size: 0.9em;
            color: #666;
        }
        
        .stat-value {
            display: block;
            font-size: 1.5em;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .recommendations-list {
            list-style: none;
            padding: 0;
        }
        
        .recommendations-list li {
            padding: 10px;
            margin: 5px 0;
            background: #E8F5E8;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
        }
        
        .note {
            margin-top: 20px;
            padding: 15px;
            background: #FFF3E0;
            border-left: 4px solid #FF9800;
            border-radius: 4px;
        }
        
        .risk-assessment {
            text-align: center;
            margin: 20px 0;
        }
        
        .risk-description {
            margin-top: 10px;
            font-style: italic;
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
    // Space key pause/resume game
    if (e.code === 'Space' && window.game && window.game.isPlaying) {
        e.preventDefault();
        if (window.game.isPaused) {
            window.game.resumeGame();
        } else {
            window.game.pauseGame();
        }
    }
    
    // ESC key return to main menu
    if (e.code === 'Escape' && window.game) {
        window.game.showMainMenu();
    }
    
    // Number keys quick level selection
    if (e.code >= 'Digit1' && e.code <= 'Digit4' && window.game && !window.game.isPlaying) {
        const levelMap = {
            'Digit1': 'forest',
            'Digit2': 'library', 
            'Digit3': 'river',
            'Digit4': 'tower'
        };
        const level = levelMap[e.code];
        if (level) {
            window.game.startLevel(level);
        }
    }
});
}

// Add game sound effects (optional)
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }
    
    loadSound(name, url) {
        if (this.enabled) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            this.sounds[name] = audio;
        }
    }
    
    play(name) {
        if (this.enabled && this.sounds[name]) {
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => {
                console.log('Sound play failed:', e);
            });
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create global sound manager
window.soundManager = new SoundManager();

// Add game statistics
class GameStats {
    constructor() {
        this.stats = {
            totalPlayTime: 0,
            levelsCompleted: 0,
            totalStars: 0,
            bestScores: {},
            playSessions: 0
        };
        this.loadStats();
    }
    
    loadStats() {
        const saved = localStorage.getItem('littleExplorerStats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
        }
    }
    
    saveStats() {
        localStorage.setItem('littleExplorerStats', JSON.stringify(this.stats));
    }
    
    updateStats(level, score, playTime) {
        this.stats.levelsCompleted++;
        this.stats.totalStars += score;
        this.stats.totalPlayTime += playTime;
        
        if (!this.stats.bestScores[level] || score > this.stats.bestScores[level]) {
            this.stats.bestScores[level] = score;
        }
        
        this.saveStats();
    }
    
    getStats() {
        return this.stats;
    }
}

// Create global statistics manager
window.gameStats = new GameStats();

// Add help tips
function showHelp() {
    const helpText = `
    🎮 Game Controls:
    
    🖱️ Mouse Click - Interact with game elements
    ⌨️ Spacebar - Pause/Resume game
    ⌨️ ESC Key - Return to main menu
    ⌨️ Number Keys 1-4 - Quickly select levels
    
    🎯 Game Objective:
    Complete challenges in four levels, earn stars and badges!
    
    📊 Assessment Description:
    The game automatically assesses attention, organization, impulse control, and executive function.
    `;
    
    alert(helpText);
}

// Add help button
document.addEventListener('DOMContentLoaded', function() {
    const helpButton = document.createElement('button');
    helpButton.textContent = '❓ Help';
    helpButton.style.position = 'fixed';
    helpButton.style.top = '10px';
    helpButton.style.right = '10px';
    helpButton.style.zIndex = '1000';
    helpButton.style.padding = '10px 15px';
    helpButton.style.border = 'none';
    helpButton.style.borderRadius = '20px';
    helpButton.style.background = '#2196F3';
    helpButton.style.color = 'white';
    helpButton.style.cursor = 'pointer';
    helpButton.onclick = showHelp;
    
    document.body.appendChild(helpButton);
});
