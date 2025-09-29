// Magic Forest Level - Attention Test
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
        console.log('Setting up forest level...');
        // Set correct path points
        this.path = [
            { x: 100, y: 250, reached: false },
            { x: 200, y: 200, reached: false },
            { x: 350, y: 180, reached: false },
            { x: 500, y: 200, reached: false },
            { x: 650, y: 250, reached: false },
            { x: 700, y: 300, reached: false }  // Adjust 6th point position to avoid being too close to edge
        ];
        
        // Create distractions
        this.createDistractions();
        
        // Setup canvas click events
        this.setupEventListeners();
        console.log('Forest level setup complete');
    }
    
    createDistractions() {
        // Create butterflies
        for (let i = 0; i < 3; i++) {
            this.distractions.push({
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100,
                type: 'butterfly',
                size: 15,
                animation: 0
            });
        }
        
        // Create small animals
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
        
        // Check if clicked on distractions
        const clickedDistraction = this.distractions.find(dist => {
            const distance = Math.sqrt((x - dist.x) ** 2 + (y - dist.y) ** 2);
            return distance < dist.size;
        });
        
        if (clickedDistraction) {
            this.distractionClicks++;
            this.dataCollector.recordAttentionData('distraction', 1);
            return;
        }
        
        // Check if clicked on correct path point
        if (this.currentTarget < this.path.length) {
            const target = this.path[this.currentTarget];
            const distance = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
            
            // Use unified 30-pixel click detection range
            if (distance < 30) {
                // Clicked on correct target
                target.reached = true;
                this.currentTarget++;
                this.dataCollector.recordAttentionData('reactionTime', reactionTime);
                
                if (this.currentTarget >= this.path.length) {
                    this.completeLevel();
                }
            } else {
                // Clicked on wrong position
                this.wrongPaths++;
                this.dataCollector.recordAttentionData('wrongPath', 1);
            }
        }
    }
    
    update() {
        if (this.isComplete) return;
        
        // Update distraction animations
        this.distractions.forEach(dist => {
            dist.animation += 0.1;
            
            // Butterfly fluttering effect
            if (dist.type === 'butterfly') {
                dist.x += Math.sin(dist.animation) * 2;
                dist.y += Math.cos(dist.animation * 0.7) * 1.5;
            }
            
            // Animal movement effect
            if (dist.type === 'animal') {
                dist.x += Math.cos(dist.animation) * 1;
                dist.y += Math.sin(dist.animation * 0.5) * 0.8;
            }
            
            // Boundary check
            if (dist.x < 50) dist.x = 50;
            if (dist.x > 750) dist.x = 750;
            if (dist.y < 50) dist.y = 50;
            if (dist.y > 550) dist.y = 550;
        });
    }
    
    render(ctx) {
        console.log('Rendering forest level...');
        // Draw background
        this.drawBackground(ctx);
        
        // Draw path
        this.drawPath(ctx);
        
        // Draw target points
        this.drawTargets(ctx);
        
        // Draw character
        this.drawCharacter(ctx);
        
        // Draw distractions
        this.drawDistractions(ctx);
        
        // Draw UI
        this.drawUI(ctx);
        console.log('Forest level rendered');
    }
    
    drawBackground(ctx) {
        // Forest background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trees
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
            if (index <= this.currentTarget) {  // Modified condition: include current target point
                ctx.lineTo(point.x, point.y);
            }
        });
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawTargets(ctx) {
        this.path.forEach((point, index) => {
            // Show unreached target points, or reached but not yet completed level points
            if (index >= this.currentTarget || (index === this.currentTarget - 1 && point.reached)) {
                ctx.fillStyle = point.reached ? '#4CAF50' : '#FF6B6B';
                ctx.beginPath();
                // Restore all points to unified 15-pixel size
                ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw target number
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
        
        // Draw eyes
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
        // Draw progress background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 280, 100);
        
        // Draw text
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Magic Forest - Attention Test', 20, 30);
        ctx.fillText(`Progress: ${this.currentTarget}/${this.path.length}`, 20, 50);
        ctx.fillText(`Errors: ${this.wrongPaths}`, 20, 70);
        
        // Draw hint
        if (this.currentTarget < this.path.length) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(300, 10, 240, 40);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Follow the golden path!', 420, 35);
            ctx.textAlign = 'left';
        }
    }
    
    completeLevel() {
        const totalTime = Date.now() - this.startTime;
        const avgReactionTime = this.reactionTimes.length > 0 ? 
            this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length : 0;
        
        // Calculate score
        let score = 5;
        if (this.wrongPaths > 2) score -= 1;
        if (this.distractionClicks > 3) score -= 1;
        if (avgReactionTime > 2000) score -= 1;
        if (totalTime > 60000) score -= 1;
        
        score = Math.max(1, score);
        
        // Record data
        this.dataCollector.recordAttentionData('focusTime', totalTime);
        this.dataCollector.recordAttentionData('reactionTime', avgReactionTime);
        
        const data = this.dataCollector.getData();
        
        this.complete(score, data);
    }
}
