// Patience River Level - Impulse Control Test
class RiverLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.character = { x: 100, y: 300, size: 20 };
        this.bridge = { x: 200, y: 250, width: 400, height: 100 };
        this.trafficLight = { x: 400, y: 200, state: 'red', timer: 0 };
        this.target = { x: 700, y: 300, size: 30 };
        this.isMoving = false;
        this.prematureClicks = 0;
        this.clickCount = 0;
        this.successfulCrossings = 0;
        this.totalAttempts = 0;
        this.waitingTimes = [];
        this.startTime = Date.now();
        this.lastClickTime = 0;
        this.lightCycle = 3000; // 3 second cycle
        this.redDuration = 2000; // Red light 2 seconds
        this.greenDuration = 1000; // Green light 1 second
        
        this.setupLevel();
    }
    
    setupLevel() {
        this.setupEventListeners();
        this.startTrafficLight();
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
    
    startTrafficLight() {
        this.trafficLight.timer = Date.now();
        this.trafficLight.state = 'red';
    }
    
    updateTrafficLight() {
        const elapsed = Date.now() - this.trafficLight.timer;
        const cycleTime = elapsed % this.lightCycle;
        
        if (cycleTime < this.redDuration) {
            this.trafficLight.state = 'red';
        } else {
            this.trafficLight.state = 'green';
        }
    }
    
    handleClick(x, y) {
        this.clickCount++;
        this.dataCollector.recordImpulseData('clickFrequency', 1);
        
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - this.lastClickTime;
        this.lastClickTime = currentTime;
        
        // Check if clicked on character area
        const distance = Math.sqrt((x - this.character.x) ** 2 + (y - this.character.y) ** 2);
        if (distance < this.character.size + 10) {
            this.handleCharacterClick();
        }
    }
    
    handleCharacterClick() {
        if (this.isMoving) return;
        
        this.totalAttempts++;
        
        if (this.trafficLight.state === 'red') {
            // Clicked during red light - impulsive behavior
            this.prematureClicks++;
            this.dataCollector.recordImpulseData('prematureClick', 1);
            this.showMessage('Red light! Please wait for green!', 'red');
            this.character.y += 20; // Fall down a bit
            setTimeout(() => {
                this.character.y = 300; // Reset position
            }, 500);
        } else if (this.trafficLight.state === 'green') {
            // Clicked during green light - correct behavior
            this.crossBridge();
        }
    }
    
    crossBridge() {
        this.isMoving = true;
        this.successfulCrossings++;
        
        // Record waiting time
        const waitingTime = Date.now() - this.trafficLight.timer;
        this.waitingTimes.push(waitingTime);
        this.dataCollector.recordImpulseData('waitingTime', waitingTime);
        
        this.showMessage('Great! Safe crossing!', 'green');
        
        // Move character
        this.animateCharacter();
    }
    
    animateCharacter() {
        const startX = this.character.x;
        const targetX = this.target.x;
        const duration = 2000; // 2 second animation
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.character.x = startX + (targetX - startX) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isMoving = false;
                this.checkCompletion();
            }
        };
        
        animate();
    }
    
    checkCompletion() {
        if (this.successfulCrossings >= 3) {
            this.completeLevel();
        } else {
            // Reset position for next attempt
            this.character.x = 100;
            this.startTrafficLight();
        }
    }
    
    showMessage(text, color) {
        // Create temporary message element
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'absolute';
        message.style.top = '50%';
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
        
        this.updateTrafficLight();
    }
    
    render(ctx) {
        // Draw background
        this.drawBackground(ctx);
        
        // Draw river
        this.drawRiver(ctx);
        
        // Draw bridge
        this.drawBridge(ctx);
        
        // Draw traffic light
        this.drawTrafficLight(ctx);
        
        // Draw character
        this.drawCharacter(ctx);
        
        // Draw target
        this.drawTarget(ctx);
        
        // Draw UI
        this.drawUI(ctx);
    }
    
    drawBackground(ctx) {
        // Sky background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawRiver(ctx) {
        // Draw river
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(0, 400, this.canvas.width, 200);
        
        // Draw waves
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 3;
        for (let i = 0; i < this.canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 400 + Math.sin(i * 0.1) * 10);
            ctx.lineTo(i + 20, 400 + Math.sin((i + 20) * 0.1) * 10);
            ctx.stroke();
        }
    }
    
    drawBridge(ctx) {
        // Draw bridge
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.bridge.x, this.bridge.y, this.bridge.width, this.bridge.height);
        
        // Draw bridge railings
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.bridge.x, this.bridge.y, this.bridge.width, 10);
        ctx.fillRect(this.bridge.x, this.bridge.y + this.bridge.height - 10, this.bridge.width, 10);
    }
    
    drawTrafficLight(ctx) {
        const light = this.trafficLight;
        
        // Draw traffic light housing
        ctx.fillStyle = '#333';
        ctx.fillRect(light.x - 15, light.y - 30, 30, 60);
        
        // Draw red light
        ctx.fillStyle = light.state === 'red' ? '#FF0000' : '#666';
        ctx.beginPath();
        ctx.arc(light.x, light.y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw green light
        ctx.fillStyle = light.state === 'green' ? '#00FF00' : '#666';
        ctx.beginPath();
        ctx.arc(light.x, light.y + 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw status text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(light.state === 'red' ? 'WAIT' : 'GO', light.x, light.y + 40);
        ctx.textAlign = 'left';
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
    
    drawTarget(ctx) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, this.target.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, this.target.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawUI(ctx) {
        // Draw progress
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 300, 130);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Patience River - Impulse Control Test', 20, 30);
        ctx.fillText(`Successful Crossings: ${this.successfulCrossings}/3`, 20, 50);
        ctx.fillText(`Premature Clicks: ${this.prematureClicks}`, 20, 70);
        ctx.fillText(`Total Clicks: ${this.clickCount}`, 20, 90);
        
        const timeLeft = Math.max(0, 60 - Math.floor((Date.now() - this.startTime) / 1000));
        ctx.fillText(`Time Left: ${timeLeft}s`, 20, 110);
        
        // Draw hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(320, 10, 240, 40);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Red light wait, green light go!', 440, 35);
        ctx.textAlign = 'left';
    }
    
    completeLevel() {
        const totalTime = Date.now() - this.startTime;
        const successRate = this.totalAttempts > 0 ? this.successfulCrossings / this.totalAttempts : 0;
        
        // Calculate score
        let score = 5;
        if (this.prematureClicks > 2) score -= 1;
        if (this.clickCount > 20) score -= 1;
        if (successRate < 0.7) score -= 1;
        if (totalTime > 60000) score -= 1;
        
        score = Math.max(1, score);
        
        // Record data
        this.dataCollector.recordImpulseData('successRate', successRate);
        
        const data = this.dataCollector.getData();
        
        this.complete(score, data);
    }
}
