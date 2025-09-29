// Ancient Library Level - Organization Test
class LibraryLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.items = [];
        this.targetArea = { x: 100, y: 100, width: 200, height: 300 };
        this.distractions = [];
        this.draggedItem = null;
        this.missedItems = 0;
        this.dragOrder = [];
        this.startTime = Date.now();
        this.taskAbandoned = false;
        
        this.setupLevel();
    }
    
    setupLevel() {
        // Create school supplies
        this.items = [
            { id: 'book1', name: 'Math Book', x: 300, y: 200, size: 40, color: '#4CAF50', collected: false },
            { id: 'book2', name: 'Language Book', x: 350, y: 250, size: 40, color: '#2196F3', collected: false },
            { id: 'pencil', name: 'Pencil', x: 400, y: 300, size: 30, color: '#FF9800', collected: false },
            { id: 'eraser', name: 'Eraser', x: 450, y: 350, size: 25, color: '#9C27B0', collected: false },
            { id: 'ruler', name: 'Ruler', x: 500, y: 400, size: 35, color: '#607D8B', collected: false }
        ];
        
        // Create distractions
        this.distractions = [
            { id: 'toy1', name: 'Toy Car', x: 600, y: 200, size: 35, color: '#F44336' },
            { id: 'toy2', name: 'Blocks', x: 650, y: 250, size: 30, color: '#E91E63' },
            { id: 'snack1', name: 'Snacks', x: 600, y: 300, size: 30, color: '#FFC107' },
            { id: 'snack2', name: 'Candy', x: 650, y: 350, size: 25, color: '#FF5722' }
        ];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isComplete) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleMouseDown(x, y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.draggedItem && !this.isComplete) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                this.draggedItem.x = x;
                this.draggedItem.y = y;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.draggedItem && !this.isComplete) {
                this.handleMouseUp();
            }
        });
    }
    
    handleMouseDown(x, y) {
        // Check if clicked on school supplies
        const clickedItem = this.items.find(item => {
            const distance = Math.sqrt((x - item.x) ** 2 + (y - item.y) ** 2);
            return distance < item.size && !item.collected;
        });
        
        if (clickedItem) {
            this.draggedItem = clickedItem;
            return;
        }
        
        // Check if clicked on distractions
        const clickedDistraction = this.distractions.find(dist => {
            const distance = Math.sqrt((x - dist.x) ** 2 + (y - dist.y) ** 2);
            return distance < dist.size;
        });
        
        if (clickedDistraction) {
            this.dataCollector.recordOrganizationData('taskAbandonment', 1);
            this.taskAbandoned = true;
        }
    }
    
    handleMouseUp() {
        if (!this.draggedItem) return;
        
        // Check if dragged to target area
        const inTargetArea = this.draggedItem.x >= this.targetArea.x &&
                           this.draggedItem.x <= this.targetArea.x + this.targetArea.width &&
                           this.draggedItem.y >= this.targetArea.y &&
                           this.draggedItem.y <= this.targetArea.y + this.targetArea.height;
        
        if (inTargetArea) {
            this.draggedItem.collected = true;
            this.dragOrder.push(this.draggedItem.id);
            this.dataCollector.recordOrganizationData('dragOrder', this.draggedItem.id);
            
            // Check if all tasks completed
            const allCollected = this.items.every(item => item.collected);
            if (allCollected) {
                this.completeLevel();
            }
        } else {
            // Dragged to wrong position, reset position
            this.resetItemPosition(this.draggedItem);
        }
        
        this.draggedItem = null;
    }
    
    resetItemPosition(item) {
        // Reset item to original position
        const originalPositions = {
            'book1': { x: 300, y: 200 },
            'book2': { x: 350, y: 250 },
            'pencil': { x: 400, y: 300 },
            'eraser': { x: 450, y: 350 },
            'ruler': { x: 500, y: 400 }
        };
        
        if (originalPositions[item.id]) {
            item.x = originalPositions[item.id].x;
            item.y = originalPositions[item.id].y;
        }
    }
    
    update() {
        if (this.isComplete) return;
        
        // Check for missed items
        const uncollectedItems = this.items.filter(item => !item.collected);
        if (uncollectedItems.length > 0 && Date.now() - this.startTime > 30000) {
            this.missedItems = uncollectedItems.length;
            this.dataCollector.recordOrganizationData('missedItem', this.missedItems);
        }
    }
    
    render(ctx) {
        // Draw background
        this.drawBackground(ctx);
        
        // Draw target area
        this.drawTargetArea(ctx);
        
        // Draw items
        this.drawItems(ctx);
        
        // Draw distractions
        this.drawDistractions(ctx);
        
        // Draw UI
        this.drawUI(ctx);
    }
    
    drawBackground(ctx) {
        // Library background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFF8DC');
        gradient.addColorStop(1, '#D2B48C');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bookshelves
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(50, 50, 20, 500);
        ctx.fillRect(700, 50, 20, 500);
        
        // Draw desk
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(80, 450, 640, 20);
    }
    
    drawTargetArea(ctx) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.targetArea.x, this.targetArea.y, this.targetArea.width, this.targetArea.height);
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.fillRect(this.targetArea.x, this.targetArea.y, this.targetArea.width, this.targetArea.height);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Backpack Area', this.targetArea.x + this.targetArea.width/2, this.targetArea.y - 10);
        ctx.textAlign = 'left';
    }
    
    drawItems(ctx) {
        this.items.forEach(item => {
            if (!item.collected) {
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw item name
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.name, item.x, item.y + item.size + 15);
                ctx.textAlign = 'left';
            }
        });
    }
    
    drawDistractions(ctx) {
        this.distractions.forEach(dist => {
            ctx.fillStyle = dist.color;
            ctx.beginPath();
            ctx.arc(dist.x, dist.y, dist.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw distraction name
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(dist.name, dist.x, dist.y + dist.size + 12);
            ctx.textAlign = 'left';
        });
    }
    
    drawUI(ctx) {
        // Draw progress
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 280, 110);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Ancient Library - Organization Test', 20, 30);
        
        const collectedCount = this.items.filter(item => item.collected).length;
        ctx.fillText(`Collected: ${collectedCount}/${this.items.length}`, 20, 50);
        ctx.fillText(`Missed: ${this.missedItems}`, 20, 70);
        
        const timeLeft = Math.max(0, 30 - Math.floor((Date.now() - this.startTime) / 1000));
        ctx.fillText(`Time Left: ${timeLeft}s`, 20, 90);
        
        // Draw hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(300, 10, 240, 40);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Drag school supplies to backpack!', 420, 35);
        ctx.textAlign = 'left';
    }
    
    completeLevel() {
        const totalTime = Date.now() - this.startTime;
        const completionTime = totalTime / 1000;
        
        // Calculate score
        let score = 5;
        if (this.missedItems > 0) score -= this.missedItems;
        if (this.taskAbandoned) score -= 1;
        if (completionTime > 30) score -= 1;
        if (this.dragOrder.length < this.items.length) score -= 1;
        
        score = Math.max(1, score);
        
        // Record data
        this.dataCollector.recordOrganizationData('completionTime', completionTime);
        
        const data = this.dataCollector.getData();
        
        this.complete(score, data);
    }
}
