enum AlienState {
    OffScreen,
    Entering,
    Formation,
    Attacking
}

interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

interface Alien extends GameObject {
    direction: number;
    verticalSpeed: number;
    moveTimer: number;
    moveInterval: number;
    lastBombTime: number;
    bombInterval: number;
    nextBombDelay: number;
    canDropBombs: boolean;
    targetX: number;
    targetY: number;
    state: AlienState;
    swoopPhase: number;
    swoopAmplitude: number;
    swoopSpeed: number;
    attackStartTime: number;
    originalX: number;
    originalY: number;
    entryDelay: number;
    type: number;
    bombSequence: number;
    lastBombSequence: number;
    isLeader: boolean;
    followingLeader: Alien | null;
    attackPath: { x: number, y: number }[];
    attackPathIndex: number;
}

interface Bomb extends GameObject {
    active: boolean;
    horizontalSpeed: number;
    alienType: number;
}

interface Bullet extends GameObject {
    isPlayerBullet: boolean;
}

interface Explosion {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    speed: number;
    active: boolean;
}

interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    color: string;
}

class SoundManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private enabled: boolean = true;

    constructor() {
    }

    private initializeAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
    }

    public resumeAudio() {
        if (!this.audioContext) {
            this.initializeAudio();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    public playShoot() {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    public playBombDrop() {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    public playExplosion() {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;

        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain!);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }

    public playGameOver() {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;

        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseBuffer.length; i++) {
            const decay = 1 - (i / noiseBuffer.length);
            noiseData[i] = (Math.random() * 2 - 1) * decay;
        }
        
        noise.buffer = noiseBuffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 2);
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 2);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain!);
        
        oscillator.connect(oscGain);
        oscGain.connect(this.masterGain!);
        
        noise.start();
        oscillator.start();
        noise.stop(this.audioContext.currentTime + 2);
        oscillator.stop(this.audioContext.currentTime + 2);
    }

    public playAlienTurn() {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime); // E4
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.2); // A4

        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    public playAlienHover(type: number) {
        if (!this.enabled || !this.audioContext || this.audioContext.state !== 'running') return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        switch (type) {
            case 1: // Yellow alien - high-pitched buzz
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(1760, this.audioContext.currentTime + 0.05); // A6
                gainNode.gain.setValueAtTime(0.015, this.audioContext.currentTime);
                break;
            case 2: // Red alien - medium buzz
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime); // E5
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.05); // A5
                gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
                break;
            case 3: // Purple alien - low buzz
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
                oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.05); // E5
                gainNode.gain.setValueAtTime(0.018, this.audioContext.currentTime);
                break;
        }

        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    public toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.resumeAudio();
        }
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setGameOver(isGameOver: boolean) {
        this.enabled = !isGameOver; // Enable sound when game is over
    }
}

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: GameObject;
    private bullets: Bullet[];
    private aliens: Alien[];
    private bombs: Bomb[];
    private explosions: Explosion[];
    private stars: Star[];
    private keys: { [key: string]: boolean };
    private lastBulletTime: number;
    private readonly BULLET_COOLDOWN = 100;
    private readonly MAX_PLAYER_BULLETS = 5;
    private gameOver: boolean;
    private gameStartTime: number;
    private gameOverTime: number;
    private readonly MIN_GAME_OVER_DURATION = 3000;
    private soundManager: SoundManager;
    private score: number;
    private highScore: number;
    private level: number;
    private levelStartTime: number;
    private readonly LEVEL_START_DELAY = 2000;
    private gameStarted: boolean;
    private starPulseTime: number;
    private scale: number = 1;
    private isPaused: boolean = false;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Set initial size and handle resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Initialize player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 30 * this.scale,
            height: 30 * this.scale,
            speed: 5 * this.scale
        };

        // Initialize game state
        this.bullets = [];
        this.aliens = [];
        this.bombs = [];
        this.explosions = [];
        this.stars = [];
        this.keys = {};
        this.lastBulletTime = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.gameStartTime = Date.now();
        this.gameOverTime = 0;
        this.starPulseTime = 0;
        this.soundManager = new SoundManager();
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('galagaHighScore') || '0');
        this.level = 1;
        this.levelStartTime = Date.now();

        // Initialize stars
        this.initStars();

        // Make canvas fullscreen on mobile
        if (this.isMobile()) {
            this.canvas.style.touchAction = 'none';
            
            document.addEventListener('touchstart', () => {
                if (this.soundManager) {
                    this.soundManager.resumeAudio();
                }
                
                document.documentElement.requestFullscreen().catch(() => {});
            }, { once: true });
        }

        // Event listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (this.soundManager) {
                this.soundManager.resumeAudio();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'm') {
                this.soundManager.toggle();
            }
        });

        // Add touch event listeners
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (this.soundManager) {
                this.soundManager.resumeAudio();
            }
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Check if touch is in the sound toggle text area
            const textX = 10;
            const textY = this.canvas.height - 10;
            const textWidth = 150;
            const textHeight = 20;
            
            if (touchX >= textX && 
                touchX <= textX + textWidth && 
                touchY >= textY - textHeight && 
                touchY <= textY) {
                this.soundManager.toggle();
                return;
            }
            
            this.handleTouch(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouch(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys[' '] = false;
        });

        // Add click handler for sound toggle
        this.canvas.addEventListener('click', (e) => {
            if (this.soundManager) {
                this.soundManager.resumeAudio();
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if click is in the sound toggle text area
            const textX = 10;
            const textY = this.canvas.height - 10;
            const textWidth = 150;
            const textHeight = 20;
            
            if (clickX >= textX && 
                clickX <= textX + textWidth && 
                clickY >= textY - textHeight && 
                clickY <= textY) {
                this.soundManager.toggle();
                return;
            }

            if (!this.gameStarted) {
                this.gameStarted = true;
                this.initAliens();
            } else if (this.gameOver) {
                const gameOverDuration = Date.now() - this.gameOverTime;
                if (gameOverDuration >= this.MIN_GAME_OVER_DURATION) {
                    this.reset();
                }
            }
        });

        this.gameLoop();
    }

    private isMobile(): boolean {
        // Check for touch capability and mobile user agent
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return hasTouch || isMobileUA;
    }

    private handleResize() {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        
        const targetAspectRatio = 9/16;
        
        if (this.isMobile()) {
            this.canvas.width = maxWidth;
            this.canvas.height = this.canvas.width / targetAspectRatio;
            
            if (this.canvas.height > maxHeight) {
                this.canvas.height = maxHeight;
                this.canvas.width = this.canvas.height * targetAspectRatio;
            }
        } else {
            const baseWidth = 540;
            const baseHeight = 960;
            
            const scaleX = maxWidth / baseWidth;
            const scaleY = maxHeight / baseHeight;
            this.scale = Math.min(scaleX, scaleY) * 0.9;
            
            this.canvas.width = baseWidth * this.scale;
            this.canvas.height = baseHeight * this.scale;
        }

        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(maxWidth - this.canvas.width) / 2}px`;
        this.canvas.style.top = `${(maxHeight - this.canvas.height) / 2}px`;

        if (this.player) {
            this.player.width = 30 * this.scale;
            this.player.height = 30 * this.scale;
            this.player.speed = 5 * this.scale;
            this.player.x = Math.min(this.player.x, this.canvas.width - this.player.width);
            this.player.y = this.canvas.height - 100 * this.scale;
        }

        this.ctx.font = `${24 * this.scale}px Arial`;
    }

    private handleTouch(e: TouchEvent) {
        e.preventDefault(); // Prevent default touch behavior
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchX = (touch.clientX - rect.left) / this.scale;
        
        // Calculate direction to touch point (horizontal only)
        const dx = touchX - (this.player.x + this.player.width / 2);
        
        if (Math.abs(dx) > 0) {
            // Move player horizontally towards touch point
            this.player.x += (dx / Math.abs(dx)) * this.player.speed;
            
            // Keep player within bounds with smaller margin
            const margin = 20 * this.scale; // Add margin from edges
            this.player.x = Math.max(margin, Math.min(this.canvas.width - this.player.width - margin, this.player.x));
        }

        // Simulate space key for shooting
        this.keys[' '] = true;
    }

    private createExplosion(x: number, y: number) {
        this.explosions.push({
            x,
            y,
            radius: 0,
            maxRadius: 50,
            speed: 2,
            active: true
        });
        this.soundManager.playExplosion();
    }

    private initAliens() {
        // Calculate number of aliens based on level
        const baseAliens = 10;
        const aliensPerLevel = 5;
        const totalAliens = baseAliens + (this.level - 1) * aliensPerLevel;
        
        // Calculate grid dimensions to maintain a roughly square formation
        const cols = Math.ceil(Math.sqrt(totalAliens));
        const rows = Math.ceil(totalAliens / cols);
        
        const spacing = 60 * this.scale;
        const formationStartX = (this.canvas.width - (cols * spacing)) / 2;
        const formationStartY = 50 * this.scale;
        const entryDelay = 500;

        const baseSpeed = 2 * this.scale;
        const speedIncrease = 0.2 * this.scale;
        const currentSpeed = baseSpeed + (this.level - 1) * speedIncrease;

        let alienCount = 0;

        for (let row = 0; row < rows && alienCount < totalAliens; row++) {
            for (let col = 0; col < cols && alienCount < totalAliens; col++) {
                const targetX = formationStartX + col * spacing;
                const targetY = formationStartY + row * spacing;
                
                // Determine entry position (left, right, or top)
                let entryX, entryY;
                const entryType = Math.random();
                
                if (entryType < 0.4) {
                    // Enter from left (40% chance)
                    entryX = -100 * this.scale;
                    entryY = this.canvas.height * 0.8 + (Math.random() * 50 * this.scale); // Enter from lower left
                } else if (entryType < 0.8) {
                    // Enter from right (40% chance)
                    entryX = this.canvas.width + 100 * this.scale;
                    entryY = this.canvas.height * 0.8 + (Math.random() * 50 * this.scale); // Enter from lower right
                } else {
                    // Enter from top (20% chance)
                    entryX = targetX + (Math.random() - 0.5) * 100 * this.scale; // Add some random offset
                    entryY = -100 * this.scale;
                }

                // Determine alien type with new distribution
                const rand = Math.random();
                let alienType;
                
                if (rand < 0.1) { // 10% chance for purple alien
                    alienType = 3;
                } else if (rand < 0.4) { // 30% chance for red alien
                    alienType = 2;
                } else { // 60% chance for yellow alien
                    alienType = 1;
                }

                // Adjust speed based on alien type
                let typeSpeed = currentSpeed;
                if (alienType === 2) {
                    // Red-winged alien: faster horizontal movement
                    typeSpeed = currentSpeed * 1.5;
                } else if (alienType === 3) {
                    // Purple alien: slower movement but rapid fire
                    typeSpeed = currentSpeed * 0.7;
                }

                this.aliens.push({
                    x: entryX,
                    y: entryY,
                    width: 30 * this.scale,
                    height: 30 * this.scale,
                    speed: typeSpeed + Math.random(),
                    direction: 1,
                    verticalSpeed: 0,
                    moveTimer: Date.now(),
                    moveInterval: Math.max(500, 1000 - (this.level - 1) * 50),
                    lastBombTime: 0,
                    bombInterval: Math.max(500, 1000 - (this.level - 1) * 50),
                    nextBombDelay: 1000 + Math.random() * 1500,
                    canDropBombs: false,
                    targetX: targetX,
                    targetY: targetY,
                    state: AlienState.OffScreen,
                    swoopPhase: Math.random() * Math.PI * 2,
                    swoopAmplitude: 30 * this.scale + Math.random() * 20 * this.scale,
                    swoopSpeed: alienType === 3 ? 0.04 + Math.random() * 0.02 : 0.02 + Math.random() * 0.02,
                    attackStartTime: 0,
                    originalX: targetX,
                    originalY: targetY,
                    entryDelay: alienCount * entryDelay,
                    type: alienType,
                    bombSequence: 0,
                    lastBombSequence: 0,
                    isLeader: false,
                    followingLeader: null,
                    attackPath: [],
                    attackPathIndex: 0
                });
                alienCount++;
            }
        }
    }

    private initStars() {
        // Create 100 stars with random positions and properties
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1, // Size between 1-3 pixels
                speed: Math.random() * 1.2 + 0.5, // Increased speed range from 0.2-0.7 to 0.5-1.7 pixels per frame
                color: this.getRandomDullColor()
            });
        }
    }

    private getRandomDullColor(): string {
        // Array of space-themed colors
        const colors = [
            '#8a8a8a', // Brighter gray
            '#8a4a4a', // Warm red
            '#4a8a4a', // Forest green
            '#4a4a8a', // Deep blue
            '#8a8a4a', // Golden yellow
            '#8a4a8a', // Purple
            '#4a8a8a', // Teal
            '#6a6a8a', // Lavender
            '#8a6a4a'  // Amber
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private updateStars() {
        const now = Date.now();
        this.starPulseTime = (now - this.gameStartTime) / 1000; // Convert to seconds

        this.stars.forEach(star => {
            if (this.gameStarted) {
                // Normal downward movement when game is started
                star.y += star.speed;
                if (star.y > this.canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * this.canvas.width;
                }
            } else {
                // Pulsing effect for title screen
                const pulse = Math.sin(this.starPulseTime * 2 + star.x * 0.01) * 0.5 + 0.5;
                star.size = (Math.random() * 2 + 1) * (0.5 + pulse * 0.5);
            }
        });
    }

    private drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    private handleInput() {
        if (!this.gameStarted) {
            if (this.keys[' '] || this.keys['touch']) {
                this.gameStarted = true;
                this.initAliens();
            }
            return;
        }

        // Handle pause toggle
        if (this.keys['Escape'] || this.keys['p'] || this.keys['P']) {
            this.isPaused = !this.isPaused;
            this.keys['Escape'] = false; // Reset the key state
            this.keys['p'] = false;
            this.keys['P'] = false;
            return;
        }

        // Don't process other inputs if paused
        if (this.isPaused) {
            return;
        }

        if (this.gameOver) {
            const gameOverDuration = Date.now() - this.gameOverTime;
            if ((this.keys[' '] || this.keys['touch']) && gameOverDuration >= this.MIN_GAME_OVER_DURATION) {
                this.reset();
            }
            return;
        }
        
        if (this.keys['ArrowLeft']) {
            const margin = 20 * this.scale; // Add margin from edges
            this.player.x = Math.max(margin, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight']) {
            const margin = 20 * this.scale; // Add margin from edges
            this.player.x = Math.min(this.canvas.width - this.player.width - margin, this.player.x + this.player.speed);
        }
        if (this.keys[' '] && Date.now() - this.lastBulletTime > this.BULLET_COOLDOWN) {
            // Count current player bullets
            const currentPlayerBullets = this.bullets.filter(b => b.isPlayerBullet).length;
            
            // Only fire if we haven't reached the maximum
            if (currentPlayerBullets < this.MAX_PLAYER_BULLETS) {
                this.bullets.push({
                    x: this.player.x + this.player.width / 2 - 2,
                    y: this.player.y,
                    width: 4,
                    height: 10,
                    speed: 7,
                    isPlayerBullet: true
                });
                this.lastBulletTime = Date.now();
                this.soundManager.playShoot();
            }
        }
    }

    private reset() {
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;

        // Clear all game objects
        this.bullets = [];
        this.bombs = [];
        this.explosions = [];
        this.aliens = [];
        this.stars = [];

        // Reset game state
        this.gameOver = false;
        this.gameStarted = false;  // Reset to title screen
        this.gameOverTime = 0;
        this.lastBulletTime = 0;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.level = 1;
        this.levelStartTime = Date.now();

        // Reinitialize stars
        this.initStars();
        this.soundManager.setGameOver(false);
        this.isPaused = false; // Reset pause state
    }

    private handlePlayerDeath() {
        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.gameOver = true;
        this.gameOverTime = Date.now();
        this.soundManager.setGameOver(true);
        this.soundManager.playGameOver();
    }

    private startNextLevel() {
        // Add level completion bonus
        this.score += 1000;
        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('galagaHighScore', this.highScore.toString());
        }
        
        this.level++;
        this.levelStartTime = Date.now();
        this.initAliens();
    }

    private update() {
        // Don't update game state if paused
        if (this.isPaused) {
            return;
        }

        const now = Date.now();
        const gameTime = now - this.gameStartTime;

        // Update stars
        this.updateStars();

        // Check if all aliens are defeated and start next level
        if (this.aliens.length === 0 && now - this.levelStartTime > this.LEVEL_START_DELAY) {
            this.startNextLevel();
        }

        // Update explosions
        this.explosions = this.explosions.filter(explosion => {
            explosion.radius += explosion.speed;
            return explosion.radius < explosion.maxRadius;
        });

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.isPlayerBullet) {
                bullet.y -= bullet.speed;
            } else {
                bullet.y += bullet.speed;
            }
            
            // Only check for alien bullets hitting player if not game over
            if (!this.gameOver && !bullet.isPlayerBullet &&
                bullet.x < this.player.x + this.player.width &&
                bullet.x + bullet.width > this.player.x &&
                bullet.y < this.player.y + this.player.height &&
                bullet.y + bullet.height > this.player.y) {
                this.handlePlayerDeath();
                return false;
            }
            
            return bullet.y > 0 && bullet.y < this.canvas.height;
        });

        // Update aliens and handle bomb dropping
        this.aliens.forEach(alien => {
            // Check if it's time for this alien to start entering
            if (alien.state === AlienState.OffScreen && gameTime >= alien.entryDelay) {
                alien.state = AlienState.Entering;
            }

            // Skip movement if alien is off screen
            if (alien.state === AlienState.OffScreen) {
                return;
            }

            // Check if alien hits player if not game over
            if (!this.gameOver && 
                alien.x < this.player.x + this.player.width &&
                alien.x + alien.width > this.player.x &&
                alien.y < this.player.y + this.player.height &&
                alien.y + alien.height > this.player.y) {
                this.handlePlayerDeath();
                return;
            }

            switch (alien.state) {
                case AlienState.Entering:
                    // Move towards target position
                    const dx = alien.targetX - alien.x;
                    const dy = alien.targetY - alien.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 5) {
                        // Reached target position
                        alien.x = alien.targetX;
                        alien.y = alien.targetY;
                        alien.state = alien.type === 4 ? AlienState.Attacking : AlienState.Formation;
                        alien.speed = 2; // Fixed speed for formation
                        alien.originalX = alien.x;
                        alien.originalY = alien.y;
                        alien.moveTimer = now;
                    } else {
                        // Move towards target
                        alien.x += (dx / distance) * alien.speed;
                        alien.y += (dy / distance) * alien.speed;
                    }
                    break;

                case AlienState.Formation:
                    // Formation movement
                    if (now - alien.moveTimer > alien.moveInterval) {
                        // Change direction for all aliens at once
                        this.aliens.forEach(a => {
                            if (a.state === AlienState.Formation) {
                                a.direction *= -1;
                                a.moveTimer = now;
                                // Play hover sound when turning
                                this.soundManager.playAlienHover(a.type);
                            }
                        });
                    }

                    // Move in formation
                    alien.x += alien.speed * alien.direction;
                    
                    // Keep within bounds
                    if (alien.x < 0) {
                        alien.x = 0;
                        alien.direction *= -1;
                        this.soundManager.playAlienHover(alien.type);
                    } else if (alien.x + alien.width > this.canvas.width) {
                        alien.x = this.canvas.width - alien.width;
                        alien.direction *= -1;
                        this.soundManager.playAlienHover(alien.type);
                    }

                    // Update original position
                    alien.originalX = alien.x;

                    // Handle attack phase transitions
                    if (Math.random() < 0.001) {
                        alien.state = AlienState.Attacking;
                        alien.attackStartTime = now;
                        alien.swoopPhase = 0;
                        alien.isLeader = true;
                        alien.attackPath = [];
                        alien.attackPathIndex = 0;

                        // Find followers (aliens that will follow this leader)
                        const potentialFollowers = this.aliens.filter(a => 
                            a !== alien && 
                            a.state === AlienState.Formation &&
                            Math.abs(a.x - alien.x) < 100 && // Only nearby aliens
                            Math.abs(a.y - alien.y) < 100
                        );

                        // Select 1-2 random followers
                        const numFollowers = Math.min(2, potentialFollowers.length);
                        for (let i = 0; i < numFollowers; i++) {
                            const follower = potentialFollowers[i];
                            follower.state = AlienState.Attacking;
                            follower.attackStartTime = now + 500; // Start following after 500ms
                            follower.isLeader = false;
                            follower.followingLeader = alien;
                            follower.attackPath = [];
                            follower.attackPathIndex = 0;
                        }
                    }

                    // Enable bomb dropping after initial delay when in formation
                    if (!alien.canDropBombs) {
                        if (now - alien.entryDelay > alien.nextBombDelay) {
                            alien.canDropBombs = true;
                            alien.lastBombTime = now; // Reset bomb timer when enabling
                        }
                    }
                    break;

                case AlienState.Attacking:
                    if (alien.type === 4) {
                        // Continuous swooping for green aliens
                        const time = now * 0.001; // Convert to seconds for smoother movement
                        const swoopX = alien.originalX + Math.sin(time * alien.swoopSpeed) * alien.swoopAmplitude;
                        const swoopY = alien.originalY + Math.sin(time * alien.swoopSpeed * 2) * (alien.swoopAmplitude * 0.7); // Increased vertical swoop
                        
                        // Move towards swoop position with faster response
                        const dx = swoopX - alien.x;
                        const dy = swoopY - alien.y;
                        alien.x += dx * 0.4; // Increased from 0.3 to 0.4 for even faster movement
                        alien.y += dy * 0.4;

                        // Play money sound more frequently during swoop
                        if (Math.random() < 0.04) { // Increased from 0.03 to 0.04
                            this.soundManager.playAlienHover(4);
                        }

                        // Keep aliens within screen bounds
                        if (alien.x < 0) alien.x = 0;
                        if (alien.x + alien.width > this.canvas.width) alien.x = this.canvas.width - alien.width;
                        if (alien.y < 0) alien.y = 0;
                        if (alien.y + alien.height > this.canvas.height) alien.y = this.canvas.height - alien.height;
                    } else {
                        const attackDuration = 3000;
                        const attackProgress = (now - alien.attackStartTime) / attackDuration;
                        
                        if (attackProgress >= 1) {
                            // Return to formation
                            alien.state = AlienState.Formation;
                            alien.x = alien.originalX;
                            alien.y = alien.originalY;
                            alien.isLeader = false;
                            alien.followingLeader = null;
                            alien.attackPath = [];
                            alien.attackPathIndex = 0;
                            this.soundManager.playAlienHover(alien.type);
                        } else {
                            if (alien.isLeader) {
                                // Leader creates the path with deeper swoop
                                const swoopX = alien.originalX + Math.sin(attackProgress * Math.PI * 2) * 100;
                                const swoopY = alien.originalY + Math.sin(attackProgress * Math.PI) * 300;
                                
                                // Record the path
                                alien.attackPath.push({ x: swoopX, y: swoopY });
                                
                                // Move leader
                                const dx = swoopX - alien.x;
                                const dy = swoopY - alien.y;
                                alien.x += dx * 0.1;
                                alien.y += dy * 0.1;
                            } else if (alien.followingLeader && alien.followingLeader.attackPath.length > 0) {
                                // Follower follows the leader's path
                                if (alien.attackPath.length === 0) {
                                    // Copy leader's path
                                    alien.attackPath = [...alien.followingLeader.attackPath];
                                }
                                
                                // Ensure we have a valid path point to follow
                                if (alien.attackPathIndex < alien.attackPath.length) {
                                    const targetPoint = alien.attackPath[alien.attackPathIndex];
                                    if (targetPoint) {
                                        const dx = targetPoint.x - alien.x;
                                        const dy = targetPoint.y - alien.y;
                                        const distance = Math.sqrt(dx * dx + dy * dy);
                                        
                                        if (distance < 5) {
                                            alien.attackPathIndex++;
                                        } else {
                                            alien.x += dx * 0.1;
                                            alien.y += dy * 0.1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
            }

            // Handle bomb dropping
            if (alien.canDropBombs && now - alien.lastBombTime > (alien.state === AlienState.Attacking ? alien.bombInterval * 0.3 : alien.bombInterval)) {
                // Only drop bombs if the alien is on screen
                if (alien.y > 0 && alien.y < this.canvas.height) {
                    if (alien.type === 3) { // Purple alien rapid fire sequence
                        if (alien.bombSequence === 0) {
                            // Start new sequence
                            alien.bombSequence = 1;
                            alien.lastBombSequence = now;
                        }

                        if (alien.bombSequence <= 8 && now - alien.lastBombSequence < 2000) {
                            // Drop 2 bombs in opposite directions
                            this.bombs.push({
                                x: alien.x + alien.width / 2 - 2,
                                y: alien.y + alien.height,
                                width: 4,
                                height: 10,
                                speed: 3,
                                horizontalSpeed: -1,
                                active: true,
                                alienType: alien.type
                            });
                            this.bombs.push({
                                x: alien.x + alien.width / 2 - 2,
                                y: alien.y + alien.height,
                                width: 4,
                                height: 10,
                                speed: 3,
                                horizontalSpeed: 1,
                                active: true,
                                alienType: alien.type
                            });
                            
                            alien.bombSequence++;
                            alien.lastBombTime = now + 50;
                            this.soundManager.playBombDrop();
                        } else {
                            // Reset sequence and add random delay before next sequence
                            alien.bombSequence = 0;
                            alien.lastBombTime = now + 500 + Math.random() * 1000;
                        }
                    } else {
                        // Normal single bomb for other aliens with random timing
                        this.bombs.push({
                            x: alien.x + alien.width / 2 - 2,
                            y: alien.y + alien.height,
                            width: 4,
                            height: 10,
                            speed: 3,
                            horizontalSpeed: alien.direction * 0.5,
                            active: true,
                            alienType: alien.type
                        });
                        // Add random delay between 0.2-1 seconds
                        alien.lastBombTime = now + 200 + Math.random() * 800;
                        this.soundManager.playBombDrop();
                    }
                }
            }
        });

        // Update bombs
        this.bombs = this.bombs.filter(bomb => {
            bomb.y += bomb.speed;
            bomb.x += bomb.horizontalSpeed;
            
            // Check if bomb hits player if not game over
            if (!this.gameOver && bomb.active &&
                bomb.x < this.player.x + this.player.width &&
                bomb.x + bomb.width > this.player.x &&
                bomb.y < this.player.y + this.player.height &&
                bomb.y + bomb.height > this.player.y) {
                this.handlePlayerDeath();
                return false;
            }
            
            // Remove bombs that go off screen horizontally
            if (bomb.x < -bomb.width || bomb.x > this.canvas.width) {
                return false;
            }
            
            return bomb.y < this.canvas.height && bomb.active;
        });

        // Check bullet collisions with aliens
        this.bullets = this.bullets.filter(bullet => {
            // Only player bullets can hit aliens
            if (!bullet.isPlayerBullet) return true;

            const hitAlien = this.aliens.find(alien => 
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y
            );

            if (hitAlien) {
                this.createExplosion(hitAlien.x + hitAlien.width / 2, hitAlien.y + hitAlien.height / 2);
                this.aliens = this.aliens.filter(a => a !== hitAlien);
                // Add score for hitting an alien
                this.score += 100;
                // Update high score if needed
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('galagaHighScore', this.highScore.toString());
                }
                return false;
            }
            return true;
        });
    }

    private draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars first (behind everything else)
        this.drawStars();

        if (!this.gameStarted) {
            // Draw title screen
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${36 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GALAGA', this.canvas.width / 2, this.canvas.height / 2 - 50 * this.scale);
            
            this.ctx.font = `${18 * this.scale}px Arial`;
            this.ctx.fillText('100% vibe coded', this.canvas.width / 2, this.canvas.height / 2 - 10 * this.scale);
            this.ctx.fillText('Press SPACE or touch screen to start', this.canvas.width / 2, this.canvas.height / 2 + 50 * this.scale);
            
            // Draw high score
            this.ctx.fillStyle = '#f00';
            this.ctx.font = `${16 * this.scale}px Arial`;
            this.ctx.fillText('HIGH SCORE', this.canvas.width / 2, 30 * this.scale);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(this.highScore.toString(), this.canvas.width / 2, 50 * this.scale);
            return;
        }

        // Draw score
        this.ctx.font = `${20 * this.scale}px Arial`;
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SCORE', 10 * this.scale, 30 * this.scale);
        this.ctx.fillText(this.score.toString(), 10 * this.scale, 55 * this.scale);

        // Draw high score
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#f00';
        this.ctx.font = `${16 * this.scale}px Arial`;
        this.ctx.fillText('HIGH SCORE', this.canvas.width / 2, 30 * this.scale);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(this.highScore.toString(), this.canvas.width / 2, 55 * this.scale);

        // Draw level
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('LEVEL', this.canvas.width - 10 * this.scale, 30 * this.scale);
        this.ctx.fillText(this.level.toString(), this.canvas.width - 10 * this.scale, 55 * this.scale);

        // Draw explosions
        this.explosions.forEach(explosion => {
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        if (!this.gameOver) {
            // Draw player spaceship
            this.ctx.save();
            this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height);
            
            // Draw main body (triangle)
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.player.height); // Top point
            this.ctx.lineTo(-this.player.width / 2, 0); // Bottom left
            this.ctx.lineTo(this.player.width / 2, 0); // Bottom right
            this.ctx.closePath();
            this.ctx.fill();

            // Draw red accent on the left side
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.player.height);
            this.ctx.lineTo(-this.player.width / 2, 0);
            this.ctx.lineTo(-this.player.width / 4, -this.player.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw blue accent on the right side
            this.ctx.fillStyle = '#00f';
            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.player.height);
            this.ctx.lineTo(this.player.width / 2, 0);
            this.ctx.lineTo(this.player.width / 4, -this.player.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw red cockpit
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.ellipse(0, -this.player.height / 2, this.player.width / 6, this.player.height / 4, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw wings
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.moveTo(-this.player.width / 2, 0);
            this.ctx.lineTo(-this.player.width / 2 - 10, -this.player.height / 3);
            this.ctx.lineTo(-this.player.width / 2, -this.player.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(this.player.width / 2, 0);
            this.ctx.lineTo(this.player.width / 2 + 10, -this.player.height / 3);
            this.ctx.lineTo(this.player.width / 2, -this.player.height / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw guns on wings
            // Left wing guns
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.rect(-this.player.width / 2 - 2, -this.player.height / 3, 4, 8);
            this.ctx.fill();
            this.ctx.fillStyle = '#00f';
            this.ctx.beginPath();
            this.ctx.rect(-this.player.width / 2 - 2, -this.player.height / 2, 4, 8);
            this.ctx.fill();

            // Right wing guns
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.rect(this.player.width / 2 - 2, -this.player.height / 3, 4, 8);
            this.ctx.fill();
            this.ctx.fillStyle = '#00f';
            this.ctx.beginPath();
            this.ctx.rect(this.player.width / 2 - 2, -this.player.height / 2, 4, 8);
            this.ctx.fill();

            // Draw pulsing exhausts
            const time = Date.now() * 0.005; // Speed of pulse
            const flameHeight = 10 + Math.sin(time * 2) * 5; // Height varies between 5 and 15

            // Create gradient for flames
            const flameGradient = this.ctx.createLinearGradient(0, 0, 0, flameHeight);
            flameGradient.addColorStop(0, '#ff0'); // Yellow at base
            flameGradient.addColorStop(0.5, '#f80'); // Orange in middle
            flameGradient.addColorStop(1, '#f00'); // Red at tip

            // Add glow effect
            this.ctx.shadowColor = '#f00';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 2;

            // Left exhaust
            this.ctx.fillStyle = flameGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(-this.player.width / 4, 0);
            this.ctx.lineTo(-this.player.width / 6, flameHeight);
            this.ctx.lineTo(-this.player.width / 8, 0);
            this.ctx.closePath();
            this.ctx.fill();

            // Right exhaust
            this.ctx.fillStyle = flameGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.width / 4, 0);
            this.ctx.lineTo(this.player.width / 6, flameHeight);
            this.ctx.lineTo(this.player.width / 8, 0);
            this.ctx.closePath();
            this.ctx.fill();

            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;

            // Add white glow effect for ship
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -this.player.height);
            this.ctx.lineTo(-this.player.width / 2, 0);
            this.ctx.lineTo(this.player.width / 2, 0);
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.restore();
        }

        // Draw bullets
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw bombs
        this.bombs.forEach(bomb => {
            // Set color based on the stored alien type
            switch (bomb.alienType) {
                case 1: // Yellow alien
                    this.ctx.fillStyle = '#ff0';
                    break;
                case 2: // Red alien
                    this.ctx.fillStyle = '#f00';
                    break;
                case 3: // Blue alien
                    this.ctx.fillStyle = '#0ff';
                    break;
                default:
                    this.ctx.fillStyle = '#f00';
            }
            
            this.ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
        });

        // Draw aliens
        this.aliens.forEach(alien => {
            this.ctx.save();
            this.ctx.translate(alien.x + alien.width / 2, alien.y + alien.height / 2);
            
            switch (alien.type) {
                case 1: // Original bee-like alien
                    // Draw wings (blue)
                    this.ctx.fillStyle = '#00f';
                    this.ctx.beginPath();
                    this.ctx.ellipse(-alien.width / 2, -alien.height / 6, alien.width / 2.5, alien.height / 4, Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.ellipse(alien.width / 2, -alien.height / 6, alien.width / 2.5, alien.height / 4, -Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Main body (yellow)
                    this.ctx.fillStyle = '#ff0';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Black stripes
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(-alien.width / 3, -alien.height / 4, alien.width / 1.5, alien.height / 8);
                    this.ctx.fillRect(-alien.width / 3, alien.height / 8, alien.width / 1.5, alien.height / 8);

                    // Red dots
                    this.ctx.fillStyle = '#f00';
                    this.ctx.beginPath();
                    this.ctx.arc(-alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 2: // Red wings, white/blue body
                    // Draw larger butterfly-like wings
                    this.ctx.fillStyle = '#f00';
                    // Left wing
                    this.ctx.beginPath();
                    this.ctx.moveTo(-alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        -alien.width / 1.2, -alien.height / 3,  // Control point 1
                        -alien.width, -alien.height / 4,        // Control point 2
                        -alien.width / 2, alien.height / 2      // End point
                    );
                    this.ctx.bezierCurveTo(
                        -alien.width / 2.5, alien.height / 3,   // Control point 1
                        -alien.width / 3, -alien.height / 6,    // Control point 2
                        -alien.width / 2, -alien.height / 6     // Back to start
                    );
                    this.ctx.fill();

                    // Right wing
                    this.ctx.beginPath();
                    this.ctx.moveTo(alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        alien.width / 1.2, -alien.height / 3,   // Control point 1
                        alien.width, -alien.height / 4,         // Control point 2
                        alien.width / 2, alien.height / 2       // End point
                    );
                    this.ctx.bezierCurveTo(
                        alien.width / 2.5, alien.height / 3,    // Control point 1
                        alien.width / 3, -alien.height / 6,     // Control point 2
                        alien.width / 2, -alien.height / 6      // Back to start
                    );
                    this.ctx.fill();

                    // Add wing details
                    this.ctx.strokeStyle = '#800';
                    this.ctx.lineWidth = 1;
                    // Left wing detail
                    this.ctx.beginPath();
                    this.ctx.moveTo(-alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        -alien.width / 1.5, -alien.height / 4,
                        -alien.width / 1.3, -alien.height / 5,
                        -alien.width / 2, alien.height / 4
                    );
                    this.ctx.stroke();
                    // Right wing detail
                    this.ctx.beginPath();
                    this.ctx.moveTo(alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        alien.width / 1.5, -alien.height / 4,
                        alien.width / 1.3, -alien.height / 5,
                        alien.width / 2, alien.height / 4
                    );
                    this.ctx.stroke();

                    // Main body (white with blue gradient)
                    const gradient = this.ctx.createLinearGradient(0, -alien.height / 2, 0, alien.height / 2);
                    gradient.addColorStop(0, '#fff');
                    gradient.addColorStop(1, '#4af');
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Bug-like eyes
                    // Outer black ring
                    this.ctx.fillStyle = '#000';
                    this.ctx.beginPath();
                    this.ctx.arc(-alien.width / 5, -alien.height / 4, alien.width / 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(alien.width / 5, -alien.height / 4, alien.width / 6, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Inner white highlight
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(-alien.width / 5, -alien.height / 4, alien.width / 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(alien.width / 5, -alien.height / 4, alien.width / 8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Blue details
                    this.ctx.fillStyle = '#00f';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, alien.width / 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 3: // Purple alien
                    // Draw shorter downward-pointing wings
                    this.ctx.fillStyle = '#808'; // Dark purple
                    // Left wing
                    this.ctx.beginPath();
                    this.ctx.moveTo(-alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        -alien.width / 1.8, alien.height / 3,
                        -alien.width / 2, alien.height / 2,
                        -alien.width / 2.5, alien.height * 0.8
                    );
                    this.ctx.bezierCurveTo(
                        -alien.width / 3, alien.height / 2,
                        -alien.width / 2.5, alien.height / 3,
                        -alien.width / 2, -alien.height / 6
                    );
                    this.ctx.fill();

                    // Right wing
                    this.ctx.beginPath();
                    this.ctx.moveTo(alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        alien.width / 1.8, alien.height / 3,
                        alien.width / 2, alien.height / 2,
                        alien.width / 2.5, alien.height * 0.8
                    );
                    this.ctx.bezierCurveTo(
                        alien.width / 3, alien.height / 2,
                        alien.width / 2.5, alien.height / 3,
                        alien.width / 2, -alien.height / 6
                    );
                    this.ctx.fill();

                    // Add wing details
                    this.ctx.strokeStyle = '#404';
                    this.ctx.lineWidth = 1;
                    // Left wing detail
                    this.ctx.beginPath();
                    this.ctx.moveTo(-alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        -alien.width / 1.9, alien.height / 4,
                        -alien.width / 2.2, alien.height / 2,
                        -alien.width / 2.5, alien.height * 0.8
                    );
                    this.ctx.stroke();
                    // Right wing detail
                    this.ctx.beginPath();
                    this.ctx.moveTo(alien.width / 2, -alien.height / 6);
                    this.ctx.bezierCurveTo(
                        alien.width / 1.9, alien.height / 4,
                        alien.width / 2.2, alien.height / 2,
                        alien.width / 2.5, alien.height * 0.8
                    );
                    this.ctx.stroke();

                    // Main body (purple)
                    this.ctx.fillStyle = '#a0a';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Bright eyes
                    // Outer glow
                    this.ctx.shadowColor = '#f0f';
                    this.ctx.shadowBlur = 10;
                    this.ctx.fillStyle = '#f0f';
                    this.ctx.beginPath();
                    this.ctx.arc(-alien.width / 6, -alien.height / 4, alien.width / 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(alien.width / 6, -alien.height / 4, alien.width / 8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Inner bright core
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(-alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Purple dots pattern
                    this.ctx.fillStyle = '#f0f';
                    const dotPositions = [
                        { x: 0, y: 0 },
                        { x: -alien.width / 6, y: alien.height / 4 },
                        { x: alien.width / 6, y: alien.height / 4 }
                    ];
                    dotPositions.forEach(pos => {
                        this.ctx.beginPath();
                        this.ctx.arc(pos.x, pos.y, alien.width / 16, 0, Math.PI * 2);
                        this.ctx.fill();
                    });
                    break;
            }

            // Antennae for all types
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-alien.width / 8, -alien.height / 2);
            this.ctx.lineTo(-alien.width / 6, -alien.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(alien.width / 8, -alien.height / 2);
            this.ctx.lineTo(alien.width / 6, -alien.height);
            this.ctx.stroke();

            // Glow effect
            this.ctx.shadowColor = alien.type === 1 ? '#ff0' : alien.type === 2 ? '#fff' : '#00f';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();
        });

        // Draw pause overlay if game is paused
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${36 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = `${18 * this.scale}px Arial`;
            this.ctx.fillText('Press ESC or P to resume', this.canvas.width / 2, this.canvas.height / 2 + 50 * this.scale);
        }

        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${36 * this.scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

            const gameOverDuration = Date.now() - this.gameOverTime;
            if (gameOverDuration >= this.MIN_GAME_OVER_DURATION) {
                this.ctx.font = `${18 * this.scale}px Arial`;
                this.ctx.fillText('Press SPACE or touch screen to restart', this.canvas.width / 2, this.canvas.height / 2 + 50 * this.scale);
            }
        }

        // Draw sound status with clickable area
        this.ctx.font = `${14 * this.scale}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#0f0'; // Make it green to indicate it's clickable
        
        // Get sound state emoji
        const soundEmoji = this.soundManager.isEnabled() ? '🔊' : '🔇';
        
        // Show keyboard shortcut only on desktop
        const keyboardHint = this.isMobile() ? '' : ' (M to toggle)';
        
        this.ctx.fillText(`Sound ${soundEmoji}${keyboardHint}`, 10 * this.scale, this.canvas.height - 10 * this.scale);
    }

    private gameLoop() {
        this.handleInput();
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
new Game(); 