// Universal UI Components Class - Native Architecture Optimization
class GameUIComponents {
    
    // Create game header
    static createGameHeader(title, stats = {}) {
        return `
            <div class="game-header">
                <h1>${title}</h1>
                <div class="game-stats">
                    ${Object.entries(stats).map(([key, value]) => 
                        `<div class="game-stat">
                            <span class="game-stat-label">${key}:</span>
                            <span id="${key.replace(/\s+/g, '-').toLowerCase()}-count">${value}</span>
                        </div>`
                    ).join('')}
                </div>
                <div class="game-actions">
                    <a href="index.html" class="btn btn-back">🏠 Back to Home</a>
                    <button id="pause-game" class="btn btn-pause">⏸️ Pause</button>
                </div>
            </div>
        `;
    }
    
    // Create game canvas
    static createGameCanvas(width = 800, height = 600) {
        return `
            <div class="game-screen">
                <canvas id="game-canvas" width="${width}" height="${height}" class="game-canvas"></canvas>
            </div>
        `;
    }
    
    // Create game instructions
    static createGameInstructions(title, description, progressInfo = {}) {
        return `
            <div class="game-instructions">
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="progress-info">
                    ${Object.entries(progressInfo).map(([key, value]) => 
                        `<p>${key}: <span id="${key.replace(/\s+/g, '-').toLowerCase()}-text">${value}</span></p>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Create results screen
    static createResultsScreen() {
        return `
            <div id="results-screen" style="display: none;" class="results-screen">
                <h2>🎉 Level Complete!</h2>
                <div id="level-results" class="level-results"></div>
                <div class="result-actions">
                    <a href="library.html" class="btn btn-primary">Next Level: Ancient Library</a>
                    <a href="index.html" class="btn btn-secondary">Back to Home</a>
                    <a href="report.html" class="btn btn-info">View Report</a>
                </div>
            </div>
        `;
    }
    
    // Create complete game page structure
    static createGamePage(title, description, stats = {}, progressInfo = {}, canvasSize = {width: 800, height: 600}) {
        return `
            <div id="game-container" class="game-layout">
                ${this.createGameHeader(title, stats)}
                ${this.createGameCanvas(canvasSize.width, canvasSize.height)}
                ${this.createGameInstructions('🎯 Game Instructions', description, progressInfo)}
                ${this.createResultsScreen()}
            </div>
        `;
    }
    
    // Update statistics
    static updateStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(`${key.replace(/\s+/g, '-').toLowerCase()}-count`);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // Update progress information
    static updateProgress(progressInfo) {
        Object.entries(progressInfo).forEach(([key, value]) => {
            const element = document.getElementById(`${key.replace(/\s+/g, '-').toLowerCase()}-text`);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // Show results screen
    static showResults(score, levelName) {
        const resultsScreen = document.getElementById('results-screen');
        const levelResults = document.getElementById('level-results');
        
        if (resultsScreen && levelResults) {
            levelResults.innerHTML = `
                <h3>🎉 Level Complete!</h3>
                <p>Earned ${score} stars ⭐</p>
                <div class="stars-display">
                    ${'⭐'.repeat(score)}
                </div>
                ${score >= 3 ? '<p>🏆 New Badge Earned!</p>' : ''}
            `;
            
            resultsScreen.style.display = 'block';
        }
    }
    
    // Hide results screen
    static hideResults() {
        const resultsScreen = document.getElementById('results-screen');
        if (resultsScreen) {
            resultsScreen.style.display = 'none';
        }
    }
}

// Universal Game Manager
class GameManager {
    constructor() {
        this.currentLevel = null;
        this.isPlaying = false;
        this.isPaused = false;
    }
    
    // Initialize game
    init(canvasId = 'game-canvas') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupEventListeners();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Pause button
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.isPaused) {
                    this.resume();
                } else {
                    this.pause();
                }
            });
        }
    }
    
    // Pause game
    pause() {
        this.isPaused = true;
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.textContent = '▶️ Resume';
        }
    }
    
    // Resume game
    resume() {
        this.isPaused = false;
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸️ Pause';
        }
        this.gameLoop();
    }
    
    // Game loop
    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Update game state
    update() {
        if (this.currentLevel && this.currentLevel.update) {
            this.currentLevel.update();
        }
    }
    
    // Render game
    render() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.currentLevel && this.currentLevel.render) {
                this.currentLevel.render(this.ctx);
            }
        }
    }
    
    // Start level
    startLevel(levelInstance) {
        this.currentLevel = levelInstance;
        this.isPlaying = true;
        this.isPaused = false;
        this.gameLoop();
    }
    
    // Complete level
    completeLevel(score, levelName) {
        this.isPlaying = false;
        GameUIComponents.showResults(score, levelName);
    }
}
