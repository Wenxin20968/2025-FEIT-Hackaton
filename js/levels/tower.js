// 智慧之塔关卡 - 执行功能测试
class TowerLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.sequence = [];
        this.userSequence = [];
        this.towerLevels = [];
        this.currentLevel = 0;
        this.isShowingSequence = false;
        this.isUserInput = false;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        this.distractionEvents = 0;
        this.startTime = Date.now();
        this.sequenceLength = 3;
        this.maxLevels = 5;
        
        this.setupLevel();
    }
    
    setupLevel() {
        this.generateSequence();
        this.setupTowerLevels();
        this.setupEventListeners();
        this.showSequence();
    }
    
    generateSequence() {
        this.sequence = [];
        for (let i = 0; i < this.sequenceLength; i++) {
            this.sequence.push(Math.floor(Math.random() * 4) + 1);
        }
    }
    
    setupTowerLevels() {
        const levelHeight = 80;
        const startY = 400;
        
        for (let i = 0; i < this.maxLevels; i++) {
            this.towerLevels.push({
                x: 150 + i * 120,
                y: startY - i * levelHeight,
                width: 100,
                height: 60,
                number: i + 1,
                isActive: false,
                isCorrect: false
            });
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.isComplete || !this.isUserInput) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });
    }
    
    handleClick(x, y) {
        // 检查是否点击了塔层
        const clickedLevel = this.towerLevels.find(level => {
            return x >= level.x && x <= level.x + level.width &&
                   y >= level.y && y <= level.y + level.height;
        });
        
        if (clickedLevel) {
            this.handleTowerClick(clickedLevel);
        } else {
            // 点击了空白区域 - 分心事件
            this.distractionEvents++;
            this.dataCollector.recordExecutiveData('distractionEvent', 1);
        }
    }
    
    handleTowerClick(level) {
        this.userSequence.push(level.number);
        this.totalAnswers++;
        
        // 检查是否正确
        const expectedNumber = this.sequence[this.userSequence.length - 1];
        if (level.number === expectedNumber) {
            this.correctAnswers++;
            this.dataCollector.recordExecutiveData('correctAnswer', 1);
            level.isCorrect = true;
            
            // 检查是否完成当前序列
            if (this.userSequence.length === this.sequence.length) {
                this.checkSequenceComplete();
            }
        } else {
            this.dataCollector.recordExecutiveData('wrongAnswer', 1);
            this.showMessage('错误！重新开始', 'red');
            this.resetSequence();
        }
    }
    
    checkSequenceComplete() {
        this.currentLevel++;
        
        if (this.currentLevel >= this.maxLevels) {
            this.completeLevel();
        } else {
            this.showMessage('正确！进入下一层', 'green');
            setTimeout(() => {
                this.nextLevel();
            }, 1500);
        }
    }
    
    nextLevel() {
        this.sequenceLength++;
        this.generateSequence();
        this.userSequence = [];
        this.resetTowerLevels();
        this.showSequence();
    }
    
    resetSequence() {
        this.userSequence = [];
        this.resetTowerLevels();
        this.showSequence();
    }
    
    resetTowerLevels() {
        this.towerLevels.forEach(level => {
            level.isActive = false;
            level.isCorrect = false;
        });
    }
    
    showSequence() {
        this.isShowingSequence = true;
        this.isUserInput = false;
        
        let index = 0;
        const showNext = () => {
            if (index < this.sequence.length) {
                const number = this.sequence[index];
                const level = this.towerLevels[number - 1];
                level.isActive = true;
                
                setTimeout(() => {
                    level.isActive = false;
                    index++;
                    setTimeout(showNext, 500);
                }, 1000);
            } else {
                this.isShowingSequence = false;
                this.isUserInput = true;
                this.showMessage('现在轮到你了！', 'blue');
            }
        };
        
        showNext();
    }
    
    showMessage(text, color) {
        // 创建临时消息元素
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'absolute';
        message.style.top = '20%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = color;
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        message.style.zIndex = '1000';
        message.style.pointerEvents = 'none';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 1500);
    }
    
    update() {
        if (this.isComplete) return;
        
        // 检查超时
        if (this.isUserInput && Date.now() - this.startTime > 120000) { // 2分钟超时
            this.completeLevel();
        }
    }
    
    render(ctx) {
        // 绘制背景
        this.drawBackground(ctx);
        
        // 绘制塔
        this.drawTower(ctx);
        
        // 绘制塔层
        this.drawTowerLevels(ctx);
        
        // 绘制UI
        this.drawUI(ctx);
    }
    
    drawBackground(ctx) {
        // 天空背景
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制云朵
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const x = 100 + i * 200;
            const y = 50 + Math.sin(i) * 20;
            this.drawCloud(ctx, x, y);
        }
    }
    
    drawCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 15, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTower(ctx) {
        // 绘制塔身
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(200, 100, 400, 300);
        
        // 绘制塔顶
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(200, 100);
        ctx.lineTo(400, 50);
        ctx.lineTo(600, 100);
        ctx.closePath();
        ctx.fill();
    }
    
    drawTowerLevels(ctx) {
        this.towerLevels.forEach((level, index) => {
            // 绘制塔层
            if (level.isActive) {
                ctx.fillStyle = '#FFD700';
            } else if (level.isCorrect) {
                ctx.fillStyle = '#4CAF50';
            } else {
                ctx.fillStyle = '#DEB887';
            }
            
            ctx.fillRect(level.x, level.y, level.width, level.height);
            
            // 绘制边框
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(level.x, level.y, level.width, level.height);
            
            // 绘制数字
            ctx.fillStyle = '#333';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(level.number.toString(), level.x + level.width/2, level.y + level.height/2 + 8);
            ctx.textAlign = 'left';
        });
    }
    
    drawUI(ctx) {
        // 绘制进度
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 300, 140);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('智慧之塔 - 执行功能测试', 20, 30);
        ctx.fillText(`当前层数: ${this.currentLevel}/${this.maxLevels}`, 20, 50);
        ctx.fillText(`正确率: ${this.totalAnswers > 0 ? Math.round(this.correctAnswers/this.totalAnswers*100) : 0}%`, 20, 70);
        ctx.fillText(`分心次数: ${this.distractionEvents}`, 20, 90);
        
        const timeLeft = Math.max(0, 120 - Math.floor((Date.now() - this.startTime) / 1000));
        ctx.fillText(`剩余时间: ${timeLeft}秒`, 20, 110);
        
        // 绘制当前序列
        if (this.isUserInput && this.userSequence.length > 0) {
            ctx.fillText(`已输入: ${this.userSequence.join(', ')}`, 20, 130);
        }
        
        // 绘制提示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(350, 10, 200, 40);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        if (this.isShowingSequence) {
            ctx.fillText('观察数字序列！', 450, 35);
        } else if (this.isUserInput) {
            ctx.fillText('按顺序点击数字！', 450, 35);
        }
        ctx.textAlign = 'left';
    }
    
    completeLevel() {
        const totalTime = Date.now() - this.startTime;
        const memoryAccuracy = this.totalAnswers > 0 ? this.correctAnswers / this.totalAnswers : 0;
        
        // 计算分数
        let score = 5;
        if (memoryAccuracy < 0.6) score -= 2;
        else if (memoryAccuracy < 0.8) score -= 1;
        
        if (this.distractionEvents > 5) score -= 1;
        if (this.currentLevel < 3) score -= 1;
        if (totalTime > 120000) score -= 1;
        
        score = Math.max(1, score);
        
        // 记录数据
        this.dataCollector.recordExecutiveData('completionTime', totalTime / 1000);
        this.dataCollector.recordExecutiveData('memoryAccuracy', memoryAccuracy);
        
        const data = this.dataCollector.getData();
        
        this.complete(score, data);
    }
}
