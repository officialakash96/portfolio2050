/**
 * Cybertruck Dodge - Core Game Engine
 * A stylized canvas-based game for the Cyber-Resume.
 */

class Player {
    constructor(canvasWidth, canvasHeight, image) {
        this.width = 35;
        this.height = 50; 
        this.canvasWidth = canvasWidth;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - 80;
        this.targetX = this.x;
        this.speed = 0.1; // Slightly slower for more grace
        this.laneWidth = canvasWidth / 3;
        this.image = image;
        this.tilt = 0;
        this.wheelRotation = 0;
        this.particles = [];
    }

    move(dir) {
        const currentLane = Math.round((this.targetX - (this.laneWidth / 2 - this.width / 2)) / this.laneWidth);
        const nextLane = Math.max(0, Math.min(2, currentLane + dir));
        this.targetX = nextLane * this.laneWidth + (this.laneWidth / 2 - this.width / 2);
    }

    setTargetX(x) {
        this.targetX = Math.max(0, Math.min(this.canvasWidth - this.width, x - this.width / 2));
    }

    update() {
        const dx = this.targetX - this.x;
        this.x += dx * this.speed;
        // Subtler tilt for graceful movement
        this.tilt = dx * 0.02;
        this.wheelRotation += 0.2;
        
        if (Math.random() > 0.4) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 15,
                y: this.y + this.height,
                size: 1 + Math.random() * 2,
                life: 1,
                vY: 2 + Math.random() * 2
            });
        }
        this.particles.forEach((p, i) => {
            p.y += p.vY;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        });
    }

    draw(ctx) {
        ctx.save();
        
        // 1. Draw Exhaust
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(0, 243, 255, ${p.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.tilt);
        ctx.translate(-this.width / 2, -this.height / 2);

        // 2. Draw Wheels
        const wheelW = 6;
        const wheelH = 10;
        const drawWheel = (wx, wy) => {
            ctx.save();
            ctx.fillStyle = '#111';
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00f3ff';
            ctx.strokeRect(wx, wy, wheelW, wheelH);
            ctx.restore();
        };
        drawWheel(-3, 5); // FL
        drawWheel(this.width - 3, 5); // FR
        drawWheel(-3, this.height - 15); // BL
        drawWheel(this.width - 3, this.height - 15); // BR

        // 3. Main Chassis
        ctx.save();
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        
        ctx.beginPath();
        ctx.moveTo(5, 0); 
        ctx.lineTo(this.width - 5, 0);
        ctx.lineTo(this.width, 10);
        ctx.lineTo(this.width, this.height - 5);
        ctx.lineTo(this.width - 2, this.height);
        ctx.lineTo(2, this.height);
        ctx.lineTo(0, this.height - 5);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Cockpit
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(this.width - 8, 12);
        ctx.lineTo(this.width - 5, 25);
        ctx.lineTo(5, 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Hood Logo
        if (this.image && this.image.complete) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this.image, 10, 2, this.width - 20, 8);
            ctx.restore();
        }

        // 6. Tail Lights
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.fillRect(3, this.height - 3, 8, 2);
        ctx.fillRect(this.width - 11, this.height - 3, 8, 2);

        ctx.restore();
        ctx.restore();
    }
}

class Obstacle {
    constructor(canvasWidth, type) {
        this.width = type === 'drone' ? 40 : 50;
        this.height = 30;
        this.x = Math.random() * (canvasWidth - this.width);
        this.y = -50;
        this.type = type; // 'drone', 'shard', or 'glitch'
        this.speed = 3 + Math.random() * 2;
        this.blinkTimer = 0;
        this.closeCall = false;
        this.glitchChars = ['█', '▓', '▒', '░', '!', '#', '$', '%', '&'];
        this.currentGlitch = this.getRandomGlitch();
        this.trail = [];
    }

    getRandomGlitch() {
        let str = '';
        for (let i = 0; i < 4; i++) {
            str += this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
        }
        return str;
    }

    update() {
        this.y += this.speed;
        this.blinkTimer++;

        // Update trail for shards
        if (this.type === 'shard') {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 5) this.trail.shift();
        }

        // Randomize glitch text every few frames
        if (this.type === 'glitch' && this.blinkTimer % 5 === 0) {
            this.currentGlitch = this.getRandomGlitch();
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'drone') {
            ctx.strokeStyle = '#ff003c';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            
            // Body
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Blinking lights
            if (Math.floor(this.blinkTimer / 10) % 2 === 0) {
                ctx.fillStyle = '#ff003c';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + 10, 4, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 10, this.y + 10, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'shard') {
            // Draw trail
            ctx.globalAlpha = 0.3;
            this.trail.forEach((pos, i) => {
                ctx.fillStyle = `rgba(0, 243, 255, ${i * 0.1})`;
                this.drawShard(ctx, pos.x, pos.y);
            });
            
            // Main Shard
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            this.drawShard(ctx, this.x, this.y, true);
        } else if (this.type === 'glitch') {
            ctx.strokeStyle = '#f0db4f';
            ctx.fillStyle = '#f0db4f';
            ctx.shadowColor = '#f0db4f';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 1;
            
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.font = '14px "Roboto Mono"';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentGlitch, this.x + this.width / 2, this.y + this.height / 2 + 5);
            
            // Random horizontal flicker lines
            if (Math.random() > 0.8) {
                ctx.fillRect(this.x - 10, this.y + Math.random() * 30, this.width + 20, 2);
            }
        }
        ctx.restore();
    }

    drawShard(ctx, x, y, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2, y);
        ctx.lineTo(x + this.width, y + this.height);
        ctx.lineTo(x, y + this.height);
        ctx.closePath();
        if (stroke) ctx.stroke();
        else ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('cybertruck-game');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('game-container');
        this.initBtn = document.getElementById('init-game');
        this.rebootBtn = document.getElementById('reboot-game');
        this.overlay = document.getElementById('game-overlay');
        this.scoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        
        this.score = 0;
        this.highScore = sessionStorage.getItem('cyber-best') || 0;
        this.highScoreEl.textContent = this.highScore.toString().padStart(5, '0');
        
        this.isPaused = true;
        this.isGameOver = false;
        this.obstacles = [];
        this.spawnRate = 60; // frames between spawns
        this.frameCount = 0;
        this.difficulty = 1;
        this.animationId = null;

        // Reward / Fact system
        this.facts = [
            "Akash once automated a 4-hour task into 5 minutes!",
            "Expertise in API integrations and technical troubleshooting.",
            "Currently advancing in Data Science at IIT Guwahati.",
            "7+ years of experience in Technical Solutions & SRE."
        ];
        this.currentFact = '';
        this.factTimer = 0;
        this.lastFactScore = 0;
        this.factIndex = 0;

        this.resize();
        
        // Load Player Image
        this.playerImage = new Image();
        this.playerImage.src = 'static/cyberpunk_car.jpg';
        
        this.player = new Player(this.canvas.width || 800, this.canvas.height || 400, this.playerImage);
        
        this.initControls();
        this.bindEvents();
        
        window.addEventListener('resize', () => this.resize());

        // Performance: Listen for visibility changes
        window.addEventListener('gameVisibilityChange', (e) => {
            const wasPaused = this.isPaused;
            const isGameStarted = !this.container.classList.contains('hidden');
            
            this.isPaused = !e.detail.isVisible || this.isGameOver || !isGameStarted;
            
            // Resume loop if it was paused only by visibility/focus and now is visible/focused, 
            // but ONLY if the game has actually been started by the user.
            if (wasPaused && !this.isPaused && isGameStarted && !this.isGameOver) {
                if (!this.animationId) {
                    this.gameLoop();
                }
            }
        });
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 400; // Fixed height for game area
        if (this.player) {
            this.player.canvasWidth = this.canvas.width;
            this.player.laneWidth = this.canvas.width / 3;
            // Reposition player to keep in bounds
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
            this.player.targetX = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.targetX));
        }
    }

    bindEvents() {
        this.initBtn.addEventListener('click', () => this.start());
        this.rebootBtn.addEventListener('click', () => this.restart());
    }

    initControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.isPaused || this.isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.player.move(-1);
            if (e.key === 'ArrowRight' || e.key === 'd') this.player.move(1);
        });

        // Touch / Mouse Drag
        const handleMove = (clientX) => {
            if (this.isPaused || this.isGameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            this.player.setTargetX(x);
        };

        this.canvas.addEventListener('mousemove', (e) => handleMove(e.clientX));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        }, { passive: false });
    }

    spawnObstacle() {
        if (this.frameCount < 120) return; // 2 second safety delay at 60fps
        
        const rand = Math.random();
        let type = 'drone';
        if (rand > 0.6) type = 'shard';
        else if (rand > 0.3) type = 'glitch';
        
        this.obstacles.push(new Obstacle(this.canvas.width, type));
    }

    showFact(fact) {
        this.currentFact = fact;
        this.factTimer = 180; // Show for 3 seconds (60fps)
    }

    updateScore(points) {
        this.score += points;
        this.scoreEl.textContent = Math.floor(this.score).toString().padStart(5, '0');
        
        // Check for 500 point intervals for facts
        if (this.score - this.lastFactScore >= 500) {
            this.showFact(this.facts[this.factIndex]);
            this.factIndex = (this.factIndex + 1) % this.facts.length;
            this.lastFactScore = this.score;
        }

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            sessionStorage.setItem('cyber-best', this.highScore);
            this.highScoreEl.textContent = this.highScore.toString().padStart(5, '0');
        }
    }

    checkCollisions() {
        for (const obs of this.obstacles) {
            // Precise collision check (shrunk box for better feel)
            const pBox = { 
                x: this.player.x + 5, 
                y: this.player.y + 5, 
                w: this.player.width - 10, 
                h: this.player.height - 10 
            };
            
            if (
                pBox.x < obs.x + obs.width &&
                pBox.x + pBox.w > obs.x &&
                pBox.y < obs.y + obs.height &&
                pBox.y + pBox.h > obs.y
            ) {
                this.gameOver();
                return;
            }

            // Close call check
            const margin = 25;
            if (!obs.closeCall && 
                this.player.x - margin < obs.x + obs.width &&
                this.player.x + this.player.width + margin > obs.x &&
                this.player.y - margin < obs.y + obs.height &&
                this.player.y + this.player.height + margin > obs.y
            ) {
                obs.closeCall = true;
                this.updateScore(50);
                this.showFact("CLOSE CALL! +50");
            }
        }
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        this.player.update();

        this.frameCount++;
        
        // Survival points
        if (this.frameCount % 10 === 0) {
            this.updateScore(1);
        }

        if (this.frameCount % Math.max(20, Math.floor(this.spawnRate / this.difficulty)) === 0) {
            this.spawnObstacle();
        }

        this.obstacles.forEach((obs, index) => {
            obs.update();
            if (obs.y > this.canvas.height) {
                this.obstacles.splice(index, 1);
                this.updateScore(10);
                this.difficulty += 0.005;
            }
        });

        this.checkCollisions();

        if (this.factTimer > 0) {
            this.factTimer--;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid effect
        this.drawGrid();

        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));

        // Draw fact if active
        if (this.factTimer > 0) {
            this.ctx.save();
            this.ctx.fillStyle = '#00f3ff';
            this.ctx.font = 'bold 16px "Roboto Mono"';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00f3ff';
            
            // Background for text
            const textWidth = this.ctx.measureText(this.currentFact).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.canvas.width/2 - textWidth/2 - 10, 45, textWidth + 20, 30);
            
            this.ctx.fillStyle = '#00f3ff';
            this.ctx.fillText(this.currentFact, this.canvas.width / 2, 65);
            this.ctx.restore();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        this.ctx.lineWidth = 1;
        const spacing = 40;
        const offset = (this.frameCount * 2) % spacing;

        for (let x = 0; x <= this.canvas.width; x += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = offset; y <= this.canvas.height; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    gameLoop() {
        if (this.isPaused) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            return;
        }
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.container.classList.add('active');
        // Force a reflow to ensure display: block is applied before adding .visible
        this.container.offsetHeight; 
        this.container.classList.add('visible');
        this.container.classList.remove('hidden');
        document.querySelector('.terminal-msg').classList.add('hidden');
        
        // Recalculate dimensions now that container is visible
        this.resize();
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;

        this.isPaused = false;
        if (!this.animationId) {
            this.gameLoop();
        }
    }

    restart() {
        this.score = 0;
        this.scoreEl.textContent = '00000';
        this.obstacles = [];
        this.isGameOver = false;
        this.difficulty = 1;
        this.frameCount = 0; // Resets the 2s safety delay
        this.lastFactScore = 0;
        this.factTimer = 0;
        this.overlay.classList.add('hidden');
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;
        
        if (this.isPaused) {
            this.isPaused = false;
            if (!this.animationId) {
                this.gameLoop();
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.overlay.classList.remove('hidden');
        
        const rewardMsg = document.getElementById('game-reward-msg');
        if (this.score > 2000) {
            rewardMsg.textContent = "LEGENDARY PERFORMANCE! REWARD: HIRED?";
        } else if (this.score > 1000) {
            rewardMsg.textContent = "IMPRESSIVE REFLEXES. SYSTEM STABILIZED.";
        } else {
            rewardMsg.textContent = "SYSTEM FAILURE. TRY AGAIN, RECRUIT.";
        }
    }
}

// Initialize game on load
window.addEventListener('load', () => {
    new Game();
});
