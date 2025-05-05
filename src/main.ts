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
}

interface Bomb extends GameObject {
    active: boolean;
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

class SoundManager {
    private audioContext: AudioContext;
    private enabled: boolean;

    constructor() {
        this.enabled = true;
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    public playShoot() {
        if (!this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);

        // Reduced volume for shooting sound
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    public playBombDrop() {
        if (!this.enabled) return;

        // Create a short descending whistle sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Start with a high pitch and quickly descend
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3); // A3

        // Set a very low volume that fades out quickly
        gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    public playExplosion() {
        if (!this.enabled) return;

        // Create multiple oscillators for a richer explosion sound
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        // Generate noise
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        
        // Create filter for the explosion
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime); // Reduced volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        // Connect nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Play the explosion
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }

    public playGameOver() {
        if (!this.enabled) return;

        // Create a longer, sadder explosion sound
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        
        // Generate noise with a slower decay
        for (let i = 0; i < noiseBuffer.length; i++) {
            const decay = 1 - (i / noiseBuffer.length);
            noiseData[i] = (Math.random() * 2 - 1) * decay;
        }
        
        noise.buffer = noiseBuffer;
        
        // Create a filter that sweeps down more slowly
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 2);
        
        // Create gain node with slower decay
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        // Add a sad tone using an oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3 note
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 2); // A2 note
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        // Connect all nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.connect(oscGain);
        oscGain.connect(this.audioContext.destination);
        
        // Play both sounds
        noise.start();
        oscillator.start();
        noise.stop(this.audioContext.currentTime + 2);
        oscillator.stop(this.audioContext.currentTime + 2);
    }

    public toggle() {
        this.enabled = !this.enabled;
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
    private keys: { [key: string]: boolean };
    private lastBulletTime: number;
    private readonly BULLET_COOLDOWN = 250; // ms between shots
    private gameOver: boolean;
    private gameStartTime: number;
    private gameOverTime: number;
    private readonly MIN_GAME_OVER_DURATION = 3000;
    private soundManager: SoundManager;
    private score: number;
    private highScore: number;
    private level: number;
    private levelStartTime: number;
    private readonly LEVEL_START_DELAY = 2000; // 2 seconds between levels

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            speed: 5
        };

        this.bullets = [];
        this.aliens = [];
        this.bombs = [];
        this.explosions = [];
        this.keys = {};
        this.lastBulletTime = 0;
        this.gameOver = false;
        this.gameStartTime = Date.now();
        this.gameOverTime = 0;
        this.soundManager = new SoundManager();
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('galagaHighScore') || '0');
        this.level = 1;
        this.levelStartTime = Date.now();

        // Initialize aliens in formation
        this.initAliens();

        // Event listeners
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'm') {
                this.soundManager.toggle();
            }
        });

        // Start game loop
        this.gameLoop();
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
        
        const spacing = 60;
        const formationStartX = (this.canvas.width - (cols * spacing)) / 2;
        const formationStartY = 50;
        const entryDelay = 500; // 500ms between each alien entry

        // Increase alien speed with level
        const baseSpeed = 2;
        const speedIncrease = 0.2;
        const currentSpeed = baseSpeed + (this.level - 1) * speedIncrease;

        let alienCount = 0;
        for (let row = 0; row < rows && alienCount < totalAliens; row++) {
            for (let col = 0; col < cols && alienCount < totalAliens; col++) {
                // Calculate final position
                const targetX = formationStartX + col * spacing;
                const targetY = formationStartY + row * spacing;
                
                // Start from off-screen (alternate between left and right)
                const entryX = col % 2 === 0 ? -100 : this.canvas.width + 100;
                const entryY = -100 - (row * 50); // Stagger the vertical entry

                this.aliens.push({
                    x: entryX,
                    y: entryY,
                    width: 30,
                    height: 30,
                    speed: currentSpeed + Math.random(),
                    direction: 1, // All start moving right
                    verticalSpeed: 0,
                    moveTimer: Date.now(),
                    moveInterval: Math.max(1000, 2000 - (this.level - 1) * 100), // Decrease interval with level
                    lastBombTime: 0,
                    bombInterval: Math.max(1000, 2000 - (this.level - 1) * 100) + Math.random() * 1000,
                    targetX: targetX,
                    targetY: targetY,
                    state: AlienState.OffScreen,
                    swoopPhase: Math.random() * Math.PI * 2,
                    swoopAmplitude: 30 + Math.random() * 20,
                    swoopSpeed: 0.02 + Math.random() * 0.02,
                    attackStartTime: 0,
                    originalX: targetX,
                    originalY: targetY,
                    entryDelay: alienCount * entryDelay
                });
                alienCount++;
            }
        }
    }

    private handleInput() {
        if (this.gameOver) {
            const gameOverDuration = Date.now() - this.gameOverTime;
            if (this.keys[' '] && gameOverDuration >= this.MIN_GAME_OVER_DURATION) {
                this.reset();
            }
            return;
        }
        
        if (this.keys['ArrowLeft']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys[' '] && Date.now() - this.lastBulletTime > this.BULLET_COOLDOWN) {
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

    private reset() {
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;

        // Clear all game objects
        this.bullets = [];
        this.bombs = [];
        this.explosions = [];
        this.aliens = [];

        // Reset game state
        this.gameOver = false;
        this.gameOverTime = 0;
        this.lastBulletTime = 0;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.level = 1;
        this.levelStartTime = Date.now();

        // Reinitialize aliens
        this.initAliens();
    }

    private handlePlayerDeath() {
        this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.gameOver = true;
        this.gameOverTime = Date.now();
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
        const now = Date.now();
        const gameTime = now - this.gameStartTime;

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
                        alien.state = AlienState.Formation;
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
                            }
                        });
                    }

                    // Move in formation
                    alien.x += alien.speed * alien.direction;
                    
                    // Keep within bounds
                    if (alien.x < 0) {
                        alien.x = 0;
                        alien.direction *= -1;
                    } else if (alien.x + alien.width > this.canvas.width) {
                        alien.x = this.canvas.width - alien.width;
                        alien.direction *= -1;
                    }

                    // Update original position
                    alien.originalX = alien.x;

                    // Handle attack phase transitions
                    if (Math.random() < 0.001) {
                        alien.state = AlienState.Attacking;
                        alien.attackStartTime = now;
                        alien.swoopPhase = 0;
                    }
                    break;

                case AlienState.Attacking:
                    // Attack phase - swoop down and return
                    const attackDuration = 3000;
                    const attackProgress = (now - alien.attackStartTime) / attackDuration;
                    
                    if (attackProgress >= 1) {
                        // Return to formation
                        alien.state = AlienState.Formation;
                        alien.x = alien.originalX;
                        alien.y = alien.originalY;
                    } else {
                        // Swoop attack pattern
                        const swoopX = alien.originalX + Math.sin(attackProgress * Math.PI * 2) * 100;
                        const swoopY = alien.originalY + Math.sin(attackProgress * Math.PI) * 200;
                        
                        // Calculate movement with collision avoidance
                        const dx = swoopX - alien.x;
                        const dy = swoopY - alien.y;
                        
                        // Apply collision avoidance
                        const avoidance = this.calculateCollisionAvoidance(alien);
                        
                        // Combine movement and avoidance
                        alien.x += (dx * 0.1) + avoidance.x;
                        alien.y += (dy * 0.1) + avoidance.y;
                    }
                    break;
            }

            // Handle bomb dropping
            if (now - alien.lastBombTime > (alien.state === AlienState.Attacking ? alien.bombInterval * 0.5 : alien.bombInterval)) {
                // Only drop bombs if the alien is on screen
                if (alien.y > 0 && alien.y < this.canvas.height) {
                    this.bombs.push({
                        x: alien.x + alien.width / 2 - 2,
                        y: alien.y + alien.height,
                        width: 4,
                        height: 10,
                        speed: 3,
                        active: true
                    });
                    alien.lastBombTime = now;
                    this.soundManager.playBombDrop();
                }
            }
        });

        // Update bombs
        this.bombs = this.bombs.filter(bomb => {
            bomb.y += bomb.speed;
            
            // Check if bomb hits player if not game over
            if (!this.gameOver && bomb.active &&
                bomb.x < this.player.x + this.player.width &&
                bomb.x + bomb.width > this.player.x &&
                bomb.y < this.player.y + this.player.height &&
                bomb.y + bomb.height > this.player.y) {
                this.handlePlayerDeath();
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

    private calculateCollisionAvoidance(alien: Alien): { x: number, y: number } {
        const avoidance = { x: 0, y: 0 };
        const minDistance = 40; // Minimum distance between aliens
        const avoidanceStrength = 0.5; // How strongly aliens avoid each other

        this.aliens.forEach(otherAlien => {
            if (otherAlien === alien) return;

            // Calculate distance between aliens
            const dx = otherAlien.x - alien.x;
            const dy = otherAlien.y - alien.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                // Calculate avoidance force
                const force = (minDistance - distance) / minDistance;
                const angle = Math.atan2(dy, dx);
                
                // Apply force in opposite direction
                avoidance.x -= Math.cos(angle) * force * avoidanceStrength;
                avoidance.y -= Math.sin(angle) * force * avoidanceStrength;
            }
        });

        return avoidance;
    }

    private draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw score
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);

        // Draw high score
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#f00';
        this.ctx.fillText('HIGH SCORE', this.canvas.width / 2, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(this.highScore.toString(), this.canvas.width / 2, 60);

        // Draw level
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`Level: ${this.level}`, this.canvas.width - 10, 30);

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

            // Draw cockpit
            this.ctx.fillStyle = '#fff';
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

            // Add white glow effect
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
        this.ctx.fillStyle = '#f00';
        this.bombs.forEach(bomb => {
            this.ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
        });

        // Draw aliens
        this.aliens.forEach(alien => {
            this.ctx.save();
            this.ctx.translate(alien.x + alien.width / 2, alien.y + alien.height / 2);
            
            // Draw wings (blue) - larger and more prominent
            this.ctx.fillStyle = '#00f';
            this.ctx.beginPath();
            this.ctx.ellipse(-alien.width / 2, -alien.height / 6, alien.width / 2.5, alien.height / 4, Math.PI / 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(alien.width / 2, -alien.height / 6, alien.width / 2.5, alien.height / 4, -Math.PI / 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Main body (yellow) - narrower
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Black stripes - adjusted for narrower body
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(-alien.width / 3, -alien.height / 4, alien.width / 1.5, alien.height / 8);
            this.ctx.fillRect(-alien.width / 3, alien.height / 8, alien.width / 1.5, alien.height / 8);

            // Red dots - adjusted for narrower body
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(-alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(alien.width / 6, -alien.height / 4, alien.width / 12, 0, Math.PI * 2);
            this.ctx.fill();

            // Antennae - adjusted for narrower body
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
            this.ctx.shadowColor = '#ff0';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, alien.width / 3, alien.height / 2, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();
        });

        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

            // Show "Press SPACE to restart" message only after minimum duration
            const gameOverDuration = Date.now() - this.gameOverTime;
            if (gameOverDuration >= this.MIN_GAME_OVER_DURATION) {
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
            }
        }

        // Draw sound status
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Press M to toggle sound', 10, this.canvas.height - 10);
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