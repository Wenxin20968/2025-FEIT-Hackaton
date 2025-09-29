// 游戏核心类
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
        this.setupEventListeners();
        this.updateUI();
        this.showMainMenu();
    }
    
    setupEventListeners() {
        // 关卡按钮事件
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                this.startLevel(level);
            });
        });
        
        // 游戏控制按钮
        document.getElementById('start-level').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('pause-game').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('next-level').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('view-report').addEventListener('click', () => {
            this.showFinalReport();
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startLevel(levelName) {
        this.hideAllScreens();
        document.getElementById('game-controls').style.display = 'block';
        
        // 根据关卡名称创建对应的关卡实例
        switch(levelName) {
            case 'forest':
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
            this.currentLevel.init();
            this.isPlaying = true;
            this.gameLoop();
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
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentLevel) {
            this.currentLevel.render(this.ctx);
        }
    }
    
    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-game').textContent = '继续';
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-game').textContent = '暂停';
        this.gameLoop();
    }
    
    completeLevel(levelName, score, data) {
        this.gameData[levelName].completed = true;
        this.gameData[levelName].score = score;
        this.gameData[levelName].data = data;
        
        // 更新玩家统计
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
            <h3>🎉 关卡完成！</h3>
            <p>获得 ${score} 颗星星 ⭐</p>
            <div class="stars-display">
                ${'⭐'.repeat(score)}
            </div>
            ${score >= 3 ? '<p>🏆 获得新徽章！</p>' : ''}
        `;
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('game-ui').style.display = 'block';
        this.isPlaying = false;
        this.currentLevel = null;
        
        // 更新关卡按钮状态
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
        document.getElementById('game-ui').style.display = 'none';
        document.getElementById('game-controls').style.display = 'none';
        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('final-report').style.display = 'none';
    }
    
    updateUI() {
        document.getElementById('stars-count').textContent = this.playerStats.stars;
        document.getElementById('badges-count').textContent = this.playerStats.badges;
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

// 基础关卡类
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
        // 子类实现
    }
    
    update() {
        // 子类实现
    }
    
    render(ctx) {
        // 子类实现
    }
    
    complete(score, data) {
        this.isComplete = true;
        this.game.completeLevel(this.constructor.name.toLowerCase().replace('level', ''), score, data);
    }
    
    getElapsedTime() {
        return Date.now() - this.startTime;
    }
}
