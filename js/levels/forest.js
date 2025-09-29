// 魔法森林关卡 - 注意力测试
class ForestLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.character = { x: 50, y: 300, size: 20 };
        this.targets = [];
        this.distractions = [];
        this.currentTarget = 0;
        this.path = [];
        this.wrongPaths = 0;
        this.distractionClicks = 0;
        this.startTime = Date.now();
        this.lastClickTime = 0;
        this.reactionTimes = [];
        
        this.setupLevel();
    }
    
    setupLevel() {
        // 设置正确的路径点
        this.path = [
            { x: 100, y: 250, reached: false },
            { x: 200, y: 200, reached: false },
            { x: 350, y: 180, reached: false },
            { x: 500, y: 200, reached: false },
            { x: 650, y: 250, reached: false },
            { x: 750, y: 300, reached: false }
        ];
        
        // 创建干扰物
        this.createDistractions();
        
        // 设置画布点击事件
        this.setupEventListeners();
    }
    
    createDistractions() {
        // 创建蝴蝶
        for (let i = 0; i < 3; i++) {
            this.distractions.push({
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100,
                type: 'butterfly',
                size: 15,
                animation: 0
            });
        }
        
        // 创建小动物
        for (let i = 0; i < 2; i++) {
            this.distractions.push({
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100,
                type: 'animal',
                size: 20,
                animation: 0
            });
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.isComplete) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });
    }
    
    handleClick(x, y) {
        const currentTime = Date.now();
        const reactionTime = currentTime - this.lastClickTime;
        this.reactionTimes.push(reactionTime);
        this.lastClickTime = currentTime;
        
        // 检查是否点击了干扰物
        const clickedDistraction = this.distractions.find(dist => {
            const distance = Math.sqrt((x - dist.x) ** 2 + (y - dist.y) ** 2);
            return distance < dist.size;
        });
        
        if (clickedDistraction) {
            this.distractionClicks++;
            this.dataCollector.recordAttentionData('distraction', 1);
            return;
        }
        
        // 检查是否点击了正确的路径点
        if (this.currentTarget < this.path.length) {
            const target = this.path[this.currentTarget];
            const distance = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
            
            if (distance < 30) {
                // 点击了正确的目标
                target.reached = true;
                this.currentTarget++;
                this.dataCollector.recordAttentionData('reactionTime', reactionTime);
                
                if (this.currentTarget >= this.path.length) {
                    this.completeLevel();
                }
            } else {
                // 点击了错误的位置
                this.wrongPaths++;
                this.dataCollector.recordAttentionData('wrongPath', 1);
            }
        }
    }
    
    update() {
        if (this.isComplete) return;
        
        // 更新干扰物动画
        this.distractions.forEach(dist => {
            dist.animation += 0.1;
            
            // 蝴蝶飞舞效果
            if (dist.type === 'butterfly') {
                dist.x += Math.sin(dist.animation) * 2;
                dist.y += Math.cos(dist.animation * 0.7) * 1.5;
            }
            
            // 动物移动效果
            if (dist.type === 'animal') {
                dist.x += Math.cos(dist.animation) * 1;
                dist.y += Math.sin(dist.animation * 0.5) * 0.8;
            }
            
            // 边界检查
            if (dist.x < 50) dist.x = 50;
            if (dist.x > 750) dist.x = 750;
            if (dist.y < 50) dist.y = 50;
            if (dist.y > 550) dist.y = 550;
        });
    }
    
    render(ctx) {
        // 绘制背景
        this.drawBackground(ctx);
        
        // 绘制路径
        this.drawPath(ctx);
        
        // 绘制目标点
        this.drawTargets(ctx);
        
        // 绘制角色
        this.drawCharacter(ctx);
        
        // 绘制干扰物
        this.drawDistractions(ctx);
        
        // 绘制UI
        this.drawUI(ctx);
    }
    
    drawBackground(ctx) {
        // 森林背景
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制树木
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            ctx.fillRect(x, y, 10, 30);
        }
    }
    
    drawPath(ctx) {
        if (this.path.length === 0) return;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        
        ctx.beginPath();
        ctx.moveTo(this.character.x, this.character.y);
        
        this.path.forEach((point, index) => {
            if (index < this.currentTarget) {
                ctx.lineTo(point.x, point.y);
            }
        });
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawTargets(ctx) {
        this.path.forEach((point, index) => {
            if (index >= this.currentTarget) {
                ctx.fillStyle = point.reached ? '#4CAF50' : '#FF6B6B';
                ctx.beginPath();
                ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制目标编号
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText((index + 1).toString(), point.x, point.y + 4);
            }
        });
    }
    
    drawCharacter(ctx) {
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(this.character.x, this.character.y, this.character.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.character.x - 5, this.character.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.character.x + 5, this.character.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDistractions(ctx) {
        this.distractions.forEach(dist => {
            if (dist.type === 'butterfly') {
                ctx.fillStyle = '#FF6B6B';
                ctx.save();
                ctx.translate(dist.x, dist.y);
                ctx.rotate(dist.animation);
                ctx.beginPath();
                ctx.ellipse(0, 0, dist.size, dist.size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (dist.type === 'animal') {
                ctx.fillStyle = '#8BC34A';
                ctx.beginPath();
                ctx.arc(dist.x, dist.y, dist.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    drawUI(ctx) {
        // 绘制进度
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 80);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('魔法森林 - 注意力测试', 20, 30);
        ctx.fillText(`进度: ${this.currentTarget}/${this.path.length}`, 20, 50);
        ctx.fillText(`错误: ${this.wrongPaths}`, 20, 70);
        
        // 绘制提示
        if (this.currentTarget < this.path.length) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(300, 10, 200, 40);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('跟随金色路径前进！', 400, 35);
            ctx.textAlign = 'left';
        }
    }
    
    completeLevel() {
        const totalTime = Date.now() - this.startTime;
        const avgReactionTime = this.reactionTimes.length > 0 ? 
            this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length : 0;
        
        // 计算分数
        let score = 5;
        if (this.wrongPaths > 2) score -= 1;
        if (this.distractionClicks > 3) score -= 1;
        if (avgReactionTime > 2000) score -= 1;
        if (totalTime > 60000) score -= 1;
        
        score = Math.max(1, score);
        
        // 记录数据
        this.dataCollector.recordAttentionData('focusTime', totalTime);
        this.dataCollector.recordAttentionData('reactionTime', avgReactionTime);
        
        const data = this.dataCollector.getData();
        
        this.complete(score, data);
    }
}
