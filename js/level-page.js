// Universal Level Page Script - Native Architecture Optimization
class LevelPage {
    constructor(levelName, levelClass, gameConfig) {
        this.levelName = levelName;
        this.levelClass = levelClass;
        this.gameConfig = gameConfig;
        this.gameManager = new GameManager();
        this.currentLevel = null;
    }
    
    // Initialize page
    init() {
        console.log(`Initializing ${this.levelName} level page...`);
        
        try {
            // Initialize game manager
            this.gameManager.init();
            
            // Create level instance
            this.currentLevel = new this.levelClass(this.gameManager);
            
            // Setup page-specific UI updates
            this.setupUI();
            
            // Start game
            this.gameManager.startLevel(this.currentLevel);
            
            console.log(`${this.levelName} level started successfully`);
            
        } catch (error) {
            console.error(`Error initializing ${this.levelName} level:`, error);
        }
    }
    
    // Setup UI updates
    setupUI() {
        // Update progress display
        const updateProgress = () => {
            if (this.currentLevel && this.currentLevel.getProgress) {
                const progress = this.currentLevel.getProgress();
                GameUIComponents.updateProgress(progress);
            }
        };
        
        // Regular UI updates
        setInterval(updateProgress, 100);
        
        // Pause button handling
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.gameManager.isPaused) {
                    this.gameManager.resume();
                } else {
                    this.gameManager.pause();
                }
            });
        }
    }
}

// Level configurations
const LEVEL_CONFIGS = {
    forest: {
        title: '🌲 Magic Forest - Attention Test',
        description: 'Follow the golden path and click the correct target points! ⚠️ Attention: Don\'t be distracted by butterflies and small animals!',
        stats: {
            'Stars': 0,
            'Errors': 0
        },
        progressInfo: {
            'Progress': '0/6',
            'Error Count': '0'
        },
        canvasSize: { width: 800, height: 600 }
    },
    library: {
        title: '📚 Ancient Library - Organization Test',
        description: 'Drag school supplies to the backpack! Avoid being distracted by toys and snacks!',
        stats: {
            'Collected': 0,
            'Missed': 0
        },
        progressInfo: {
            'Collected': '0/5',
            'Missed': '0'
        },
        canvasSize: { width: 800, height: 600 }
    },
    river: {
        title: '🌉 Patience River - Impulse Control Test',
        description: 'Red light wait, green light go! Learn to control impulses and develop patience!',
        stats: {
            'Successful Crossings': 0,
            'Premature Clicks': 0
        },
        progressInfo: {
            'Successful Crossings': '0/3',
            'Premature Clicks': '0'
        },
        canvasSize: { width: 800, height: 600 }
    },
    tower: {
        title: '🏰 Wisdom Tower - Executive Function Test',
        description: 'Remember number sequences and light up tower levels in order! Train memory and executive function!',
        stats: {
            'Current Level': 0,
            'Accuracy': '0%'
        },
        progressInfo: {
            'Current Level': '0/5',
            'Accuracy': '0%'
        },
        canvasSize: { width: 800, height: 600 }
    }
};

// Auto initialization function
function initLevelPage(levelName) {
    const config = LEVEL_CONFIGS[levelName];
    if (!config) {
        console.error(`Unknown level: ${levelName}`);
        return;
    }
    
    // Get corresponding level class based on level name
    let levelClass;
    switch(levelName) {
        case 'forest':
            levelClass = ForestLevel;
            break;
        case 'library':
            levelClass = LibraryLevel;
            break;
        case 'river':
            levelClass = RiverLevel;
            break;
        case 'tower':
            levelClass = TowerLevel;
            break;
        default:
            console.error(`No level class found for: ${levelName}`);
            return;
    }
    
    // Create and initialize page
    const levelPage = new LevelPage(levelName, levelClass, config);
    levelPage.init();
}
