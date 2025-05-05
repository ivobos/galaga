interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: GameObject;
    private bullets: GameObject[];
    private aliens: GameObject[];
    private keys: { [key: string]: boolean };
    private lastBulletTime: number;
    private readonly BULLET_COOLDOWN = 250; // ms between shots

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
        this.keys = {};
        this.lastBulletTime = 0;

        // Initialize aliens in formation
        this.initAliens();

        // Event listeners
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // Start game loop
        this.gameLoop();
    }

    private initAliens() {
        const rows = 5;
        const cols = 8;
        const spacing = 60;
        const startX = (this.canvas.width - (cols * spacing)) / 2;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.aliens.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing,
                    width: 30,
                    height: 30,
                    speed: 1
                });
            }
        }
    }

    private handleInput() {
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
                speed: 7
            });
            this.lastBulletTime = Date.now();
        }
    }

    private update() {
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > 0;
        });

        // Update aliens
        this.aliens.forEach(alien => {
            alien.x += alien.speed;
        });

        // Check if aliens need to change direction
        const rightmostAlien = Math.max(...this.aliens.map(a => a.x + a.width));
        const leftmostAlien = Math.min(...this.aliens.map(a => a.x));
        
        if (rightmostAlien > this.canvas.width || leftmostAlien < 0) {
            this.aliens.forEach(alien => {
                alien.speed *= -1;
                alien.y += 20;
            });
        }

        // Check collisions
        this.bullets = this.bullets.filter(bullet => {
            const hitAlien = this.aliens.find(alien => 
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y
            );

            if (hitAlien) {
                this.aliens = this.aliens.filter(a => a !== hitAlien);
                return false;
            }
            return true;
        });
    }

    private draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw player
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw bullets
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw aliens
        this.ctx.fillStyle = '#f00';
        this.aliens.forEach(alien => {
            this.ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        });
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