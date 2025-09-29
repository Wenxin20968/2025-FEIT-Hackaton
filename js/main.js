// 主入口文件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化游戏
    window.game = new Game();
    
    // 添加一些额外的样式和功能
    addCustomStyles();
    setupKeyboardControls();
});

// 添加自定义样式
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

// 设置键盘控制
function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
    // 空格键暂停/继续游戏
    if (e.code === 'Space' && window.game && window.game.isPlaying) {
        e.preventDefault();
        if (window.game.isPaused) {
            window.game.resumeGame();
        } else {
            window.game.pauseGame();
        }
    }
    
    // ESC键返回主菜单
    if (e.code === 'Escape' && window.game) {
        window.game.showMainMenu();
    }
    
    // 数字键快速选择关卡
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

// 添加游戏音效（可选）
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

// 创建全局音效管理器
window.soundManager = new SoundManager();

// 添加游戏统计
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

// 创建全局统计管理器
window.gameStats = new GameStats();

// 添加帮助提示
function showHelp() {
    const helpText = `
    🎮 游戏控制说明：
    
    🖱️ 鼠标点击 - 与游戏元素交互
    ⌨️ 空格键 - 暂停/继续游戏
    ⌨️ ESC键 - 返回主菜单
    ⌨️ 数字键1-4 - 快速选择关卡
    
    🎯 游戏目标：
    完成四个关卡的挑战，获得星星和徽章！
    
    📊 评估说明：
    游戏会自动评估注意力、组织能力、冲动控制和执行功能。
    `;
    
    alert(helpText);
}

// 添加帮助按钮
document.addEventListener('DOMContentLoaded', function() {
    const helpButton = document.createElement('button');
    helpButton.textContent = '❓ 帮助';
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
