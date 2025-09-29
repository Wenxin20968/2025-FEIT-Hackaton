// Game core class
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = null;
        this.playerStats = {
            stars: 0,
            badges: 0,
            completedLevels: []
        };
        this.gameData = {
            forest: { completed: false, score: 0, data: {} },
            library: { completed: false, score: 0, data: {} },
            river: { completed: false, score: 0, data: {} },
            tower: { completed: false, score: 0, data: {} }
        };
        this.isPlaying = false;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        console.log('Game init called');
        this.setupEventListeners();
        this.updateUI();
        console.log('Game initialized successfully');
    }
    
    setupEventListeners() {
        // Level button events
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                this.startLevel(level);
            });
        });
        
        // Game control buttons - check if elements exist
        const startLevelBtn = document.getElementById('start-level');
        if (startLevelBtn) {
            startLevelBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        
        const pauseGameBtn = document.getElementById('pause-game');
        if (pauseGameBtn) {
            pauseGameBtn.addEventListener('click', () => {
                this.pauseGame();
            });
        }
        
        const backToMenuBtn = document.getElementById('back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                this.showMainMenu();
            });
        }
        
        const nextLevelBtn = document.getElementById('next-level');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                this.showMainMenu();
            });
        }
        
        const viewReportBtn = document.getElementById('view-report');
        if (viewReportBtn) {
            viewReportBtn.addEventListener('click', () => {
                this.showFinalReport();
            });
        }
        
        const restartGameBtn = document.getElementById('restart-game');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
    }
    
    startLevel(levelName) {
        console.log('Starting level:', levelName);
        this.hideAllScreens();
        
        // Show game canvas
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'block';
            console.log('Game screen displayed');
        }
        
        // Create corresponding level instance based on level name
        switch(levelName) {
            case 'forest':
                console.log('Creating ForestLevel...');
                this.currentLevel = new ForestLevel(this);
                break;
            case 'library':
                this.currentLevel = new LibraryLevel(this);
                break;
            case 'river':
                this.currentLevel = new RiverLevel(this);
                break;
            case 'tower':
                this.currentLevel = new TowerLevel(this);
                break;
        }
        
        if (this.currentLevel) {
            console.log('Level created, initializing...');
            this.currentLevel.init();
            this.isPlaying = true;
            console.log('Starting game loop...');
            this.gameLoop();
        } else {
            console.error('Failed to create level:', levelName);
        }
    }
    
    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.currentLevel) {
            this.currentLevel.update();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentLevel) {
            this.currentLevel.render(this.ctx);
        }
    }
    
    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-game').textContent = 'Resume';
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-game').textContent = 'Pause';
        this.gameLoop();
    }
    
    completeLevel(levelName, score, data) {
        this.gameData[levelName].completed = true;
        this.gameData[levelName].score = score;
        this.gameData[levelName].data = data;
        
        // Update player stats
        this.playerStats.stars += score;
        if (score >= 3) {
            this.playerStats.badges++;
        }
        this.playerStats.completedLevels.push(levelName);
        
        this.updateUI();
        this.showLevelResults(levelName, score);
    }
    
    showLevelResults(levelName, score) {
        this.hideAllScreens();
        document.getElementById('results-screen').style.display = 'block';
        
        const resultsDiv = document.getElementById('level-results');
        resultsDiv.innerHTML = `
            <h3>🎉 Level Complete!</h3>
            <p>Earned ${score} stars ⭐</p>
            <div class="stars-display">
                ${'⭐'.repeat(score)}
            </div>
            ${score >= 3 ? '<p>🏆 New Badge Earned!</p>' : ''}
        `;
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('game-ui').style.display = 'block';
        this.isPlaying = false;
        this.currentLevel = null;
        
        // Update level button status
        document.querySelectorAll('.level-btn').forEach(btn => {
            const level = btn.dataset.level;
            if (this.gameData[level].completed) {
                btn.classList.add('completed');
            } else {
                btn.classList.remove('completed');
            }
        });
    }
    
    showFinalReport() {
        this.hideAllScreens();
        document.getElementById('final-report').style.display = 'block';
        
        const reportContent = document.getElementById('report-content');
        reportContent.innerHTML = this.generateReport();
    }
    
    generateReport() {
        const report = new ReportGenerator(this.gameData);
        return report.generateHTML();
    }
    
    hideAllScreens() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) gameUI.style.display = 'none';
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) gameControls.style.display = 'none';
        
        const resultsScreen = document.getElementById('results-screen');
        if (resultsScreen) resultsScreen.style.display = 'none';
        
        const finalReport = document.getElementById('final-report');
        if (finalReport) finalReport.style.display = 'none';
    }
    
    updateUI() {
        const starsCount = document.getElementById('stars-count');
        if (starsCount) starsCount.textContent = this.playerStats.stars;
        
        const badgesCount = document.getElementById('badges-count');
        if (badgesCount) badgesCount.textContent = this.playerStats.badges;
    }
    
    restartGame() {
        this.playerStats = { stars: 0, badges: 0, completedLevels: [] };
        this.gameData = {
            forest: { completed: false, score: 0, data: {} },
            library: { completed: false, score: 0, data: {} },
            river: { completed: false, score: 0, data: {} },
            tower: { completed: false, score: 0, data: {} }
        };
        this.updateUI();
        this.showMainMenu();
    }
}

// Base level class
class BaseLevel {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.isComplete = false;
        this.startTime = Date.now();
        this.dataCollector = new DataCollector();
    }
    
    init() {
        // To be implemented by subclasses
    }
    
    update() {
        // To be implemented by subclasses
    }
    
    render(ctx) {
        // To be implemented by subclasses
    }
    
    complete(score, data) {
        this.isComplete = true;
        this.game.completeLevel(this.constructor.name.toLowerCase().replace('level', ''), score, data);
    }
    
    getElapsedTime() {
        return Date.now() - this.startTime;
    }
}
