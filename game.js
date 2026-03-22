/**
 * Cybertruck Dodge - Core Game Engine
 * A stylized canvas-based game for the Cyber-Resume.
 */

class Player {
    constructor(canvasWidth, canvasHeight) {
        this.width = 60;
        this.height = 30;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - 80;
        this.targetX = this.x;
        this.speed = 0.15; // Interpolation speed
        this.laneWidth = canvasWidth / 3;
        this.canvasWidth = canvasWidth;
    }

    move(dir) {
        // dir: -1 (left), 0 (center), 1 (right)
        const lane = Math.max(0, Math.min(2, Math.floor(this.targetX / this.laneWidth) + dir));
        this.targetX = lane * this.laneWidth + (this.laneWidth / 2 - this.width / 2);
    }

    setTargetX(x) {
        this.targetX = Math.max(0, Math.min(this.canvasWidth - this.width, x - this.width / 2));
    }

    update() {
        // Smooth interpolation towards targetX
        this.x += (this.targetX - this.x) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';

        // Draw stylized Cybertruck (trapezoidal)
        ctx.beginPath();
        // Base
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        // Right side
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.2);
        // Top
        ctx.lineTo(this.x + this.width * 0.3, this.y);
        // Left side
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.stroke();

        // Add some detail lines
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.2);
        ctx.stroke();

        ctx.restore();
    }
}

class Obstacle {
    constructor(canvasWidth, type) {
        this.width = type === 'code' ? 80 : 40;
        this.height = 30;
        this.x = Math.random() * (canvasWidth - this.width);
        this.y = -50;
        this.type = type; // 'drone' or 'code'
        this.speed = 3 + Math.random() * 2;
        this.text = type === 'code' ? this.getRandomCodeSnippet() : '';
        this.blinkTimer = 0;
        this.closeCall = false;
    }

    getRandomCodeSnippet() {
        const snippets = ['<div>', 'const', 'await', 'fetch()', 'git push', 'npm i', '<h1>'];
        return snippets[Math.floor(Math.random() * snippets.length)];
    }

    update() {
        this.y += this.speed;
        this.blinkTimer++;
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'drone') {
            ctx.strokeStyle = '#ff003c';
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            
            // Body
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Blinking lights
            if (Math.floor(this.blinkTimer / 10) % 2 === 0) {
                ctx.fillStyle = '#ff003c';
                ctx.beginPath();
                ctx.arc(this.x + 10, this.y + 10, 3, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 10, this.y + 10, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.strokeStyle = '#00f3ff';
            ctx.fillStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 1;
            
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.font = '12px "Roboto Mono"';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2 + 5);
        }
        ctx.restore();
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
        this.player = new Player(this.canvas.width, this.canvas.height);
        
        this.initControls();
        this.bindEvents();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 400; // Fixed height for game area
        if (this.player) {
            this.player.canvasWidth = this.canvas.width;
            this.player.laneWidth = this.canvas.width / 3;
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
        const type = Math.random() > 0.3 ? 'drone' : 'code';
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
            // Collision check
            if (
                this.player.x < obs.x + obs.width &&
                this.player.x + this.player.width > obs.x &&
                this.player.y < obs.y + obs.height &&
                this.player.y + this.player.height > obs.y
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
        if (this.isPaused) return; // Optimization: don't loop if paused
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.container.classList.remove('hidden');
        document.querySelector('.terminal-msg').classList.add('hidden');
        this.isPaused = false;
        this.gameLoop();
    }

    restart() {
        this.score = 0;
        this.scoreEl.textContent = '00000';
        this.obstacles = [];
        this.isGameOver = false;
        this.difficulty = 1;
        this.frameCount = 0;
        this.lastFactScore = 0;
        this.factTimer = 0;
        this.overlay.classList.add('hidden');
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;
        
        if (this.isPaused) {
            this.isPaused = false;
            this.gameLoop();
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
