/**
 * Cybertruck Dodge - High Performance Arcade Engine
 * Delta-Time Normalized Physics, HiDPI Retina Canvas, Web Audio Retro Synth,
 * Multi-Type Obstacle Spawning & Dynamic Resume Trivia Rewards.
 */

// Web Audio API Retro Cyber Sound Synthesizer
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('cyber_sfx_muted') === 'true';
        this.initUI();
    }

    initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initUI() {
        const toggleBtn = document.getElementById('audio-toggle-btn');
        const audioIcon = document.getElementById('audio-icon');
        const btnText = document.querySelector('.hud-btn-text');

        const updateUI = () => {
            if (this.isMuted) {
                if (audioIcon) audioIcon.className = 'fas fa-volume-xmark';
                if (btnText) btnText.textContent = 'SFX: OFF';
                if (toggleBtn) toggleBtn.classList.remove('active');
            } else {
                if (audioIcon) audioIcon.className = 'fas fa-volume-high';
                if (btnText) btnText.textContent = 'SFX: ON';
                if (toggleBtn) toggleBtn.classList.add('active');
            }
        };

        updateUI();

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.initCtx();
                this.isMuted = !this.isMuted;
                localStorage.setItem('cyber_sfx_muted', this.isMuted.toString());
                updateUI();
                if (!this.isMuted) {
                    this.playBeep(440, 0.08, 'sine');
                }
            });
        }
    }

    playBeep(freq, duration = 0.1, type = 'square', volume = 0.15) {
        if (this.isMuted) return;
        this.initCtx();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context policy fallback
        }
    }

    playCloseCall() {
        if (this.isMuted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                gain.gain.setValueAtTime(0.12, now + idx * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.04);
                osc.stop(now + idx * 0.04 + 0.12);
            } catch (err) {}
        });
    }

    playCrash() {
        if (this.isMuted) return;
        this.initCtx();
        if (!this.ctx) return;

        try {
            // Low pitch decay + noise
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        } catch (e) {}
    }

    playFactAlert() {
        if (this.isMuted) return;
        this.playBeep(880, 0.12, 'sine', 0.2);
        setTimeout(() => this.playBeep(1174.66, 0.2, 'sine', 0.2), 120);
    }
}

class Player {
    constructor(canvasWidth, canvasHeight, image) {
        this.width = 38;
        this.height = 54;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = canvasHeight - 85;
        this.targetX = this.x;
        this.speed = 12; // Interpolation speed per second
        this.laneWidth = canvasWidth / 3;
        this.image = image;
        this.tilt = 0;
        this.particles = [];
        this.particleTimer = 0;
    }

    move(dir) {
        const currentLane = Math.round((this.targetX - (this.laneWidth / 2 - this.width / 2)) / this.laneWidth);
        const nextLane = Math.max(0, Math.min(2, currentLane + dir));
        this.targetX = nextLane * this.laneWidth + (this.laneWidth / 2 - this.width / 2);
    }

    setTargetX(x) {
        this.targetX = Math.max(5, Math.min(this.canvasWidth - this.width - 5, x - this.width / 2));
    }

    update(dt) {
        // Delta time normalized smooth interpolation
        const dx = this.targetX - this.x;
        const lerpFactor = Math.min(1, this.speed * dt);
        this.x += dx * lerpFactor;
        
        // Dynamic tilt based on delta distance
        this.tilt = (dx / (this.canvasWidth || 1)) * 0.8;

        // Exhaust Particles with fixed generation rate
        this.particleTimer += dt;
        if (this.particleTimer > 0.04) {
            this.particleTimer = 0;
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 12,
                y: this.y + this.height - 2,
                size: 1.5 + Math.random() * 2.5,
                life: 1.0,
                vY: 100 + Math.random() * 80
            });
        }

        // Update particles (reverse loop for safe splice)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.vY * dt;
            p.life -= 2.2 * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. Headlight Glow Projection onto Road
        const grad = ctx.createRadialGradient(
            this.x + this.width / 2, this.y - 40, 5,
            this.x + this.width / 2, this.y - 20, 110
        );
        grad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
        grad.addColorStop(0.6, 'rgba(0, 243, 255, 0.08)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + 10);
        ctx.lineTo(this.x - 45, this.y - 120);
        ctx.lineTo(this.x + this.width + 45, this.y - 120);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Exhaust Plasma
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(0, 243, 255, ${Math.max(0, p.life * 0.6)})`;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Apply chassis rotation & position
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.tilt);
        ctx.translate(-this.width / 2, -this.height / 2);

        // 3. Draw Cyber Wheels
        const wheelW = 6;
        const wheelH = 12;
        const drawWheel = (wx, wy) => {
            ctx.save();
            ctx.fillStyle = '#0a0a0f';
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 1.2;
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#00f3ff';
            ctx.fillRect(wx, wy, wheelW, wheelH);
            ctx.strokeRect(wx, wy, wheelW, wheelH);
            ctx.restore();
        };

        drawWheel(-3, 6);                       // Front Left
        drawWheel(this.width - 3, 6);           // Front Right
        drawWheel(-3, this.height - 18);        // Back Left
        drawWheel(this.width - 3, this.height - 18); // Back Right

        // 4. Main Cybertruck Chassis (Angular Polygon)
        ctx.save();
        ctx.fillStyle = '#141419';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00f3ff';

        ctx.beginPath();
        ctx.moveTo(6, 0);                       // Front Nose Left
        ctx.lineTo(this.width - 6, 0);           // Front Nose Right
        ctx.lineTo(this.width, 12);              // Front Fender Right
        ctx.lineTo(this.width - 1, this.height - 6); // Rear Side Right
        ctx.lineTo(this.width - 4, this.height); // Rear Right
        ctx.lineTo(4, this.height);              // Rear Left
        ctx.lineTo(1, this.height - 6);          // Rear Side Left
        ctx.lineTo(0, 12);                       // Front Fender Left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Angular Cockpit / Windshield Glass
        ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 14);
        ctx.lineTo(this.width - 8, 14);
        ctx.lineTo(this.width - 5, 30);
        ctx.lineTo(5, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 6. Front Cyber Lightbar (White/Cyan Glow)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(6, 1, this.width - 12, 2.5);

        // 7. Rear Cyber Lightbar (Neon Red)
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillRect(4, this.height - 3, this.width - 8, 2.5);

        ctx.restore();
        ctx.restore();
    }
}

class Obstacle {
    constructor(canvasWidth, type, speedMultiplier = 1) {
        this.type = type; // 'drone', 'shard', 'glitch'
        this.width = type === 'drone' ? 44 : (type === 'glitch' ? 52 : 32);
        this.height = type === 'drone' ? 28 : 34;
        this.x = Math.random() * (canvasWidth - this.width - 10) + 5;
        this.y = -60;
        this.baseSpeed = (type === 'shard' ? 240 : (type === 'drone' ? 190 : 170)) * speedMultiplier;
        this.blinkTimer = 0;
        this.closeCall = false;
        this.trail = [];

        this.glitchTokens = ['0xFA', 'NULL', '404', 'SRE', 'API', 'PING', 'ROOT', 'ERR'];
        this.currentGlitch = this.glitchTokens[Math.floor(Math.random() * this.glitchTokens.length)];
    }

    update(dt) {
        this.y += this.baseSpeed * dt;
        this.blinkTimer += dt;

        if (this.type === 'shard') {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 5) this.trail.shift();
        }

        if (this.type === 'glitch' && Math.random() < 0.08) {
            this.currentGlitch = this.glitchTokens[Math.floor(Math.random() * this.glitchTokens.length)];
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'drone') {
            // Aerial Combat Drone with Neon Red Strobe
            ctx.strokeStyle = '#ff0055';
            ctx.fillStyle = 'rgba(255, 0, 85, 0.15)';
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 14;
            ctx.lineWidth = 2;

            // Main drone body
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Pulsing Red Beacons
            const isBlink = Math.sin(this.blinkTimer * 12) > 0;
            if (isBlink) {
                ctx.fillStyle = '#ff0055';
                ctx.beginPath();
                ctx.arc(this.x + 8, this.y + this.height / 2, 4, 0, Math.PI * 2);
                ctx.arc(this.x + this.width - 8, this.y + this.height / 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Central Targeting Sensor
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3, 6, 6);

        } else if (this.type === 'shard') {
            // Energy Data Shard with Cyan Trail
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < this.trail.length; i++) {
                ctx.fillStyle = `rgba(0, 243, 255, ${(i + 1) * 0.15})`;
                this.drawShardPath(ctx, this.trail[i].x, this.trail[i].y, false);
            }

            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#00f3ff';
            ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            this.drawShardPath(ctx, this.x, this.y, true);

        } else if (this.type === 'glitch') {
            // Matrix Fault / Code Block
            ctx.strokeStyle = '#f0db4f';
            ctx.fillStyle = 'rgba(240, 219, 79, 0.12)';
            ctx.shadowColor = '#f0db4f';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 1.5;

            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.fillStyle = '#f0db4f';
            ctx.font = 'bold 13px "Roboto Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentGlitch, this.x + this.width / 2, this.y + this.height / 2);

            // Glitch Scan Artifact
            if (Math.random() > 0.75) {
                ctx.fillRect(this.x - 8, this.y + Math.random() * this.height, this.width + 16, 2);
            }
        }

        ctx.restore();
    }

    drawShardPath(ctx, x, y, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2, y);
        ctx.lineTo(x + this.width, y + this.height * 0.7);
        ctx.lineTo(x + this.width / 2, y + this.height);
        ctx.lineTo(x, y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        if (stroke) ctx.stroke();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('cybertruck-game');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('game-container');
        this.initBtn = document.getElementById('init-game');
        this.rebootBtn = document.getElementById('reboot-game');
        this.overlay = document.getElementById('game-overlay');
        this.scoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        this.speedBadge = document.getElementById('game-speed-badge');
        this.finalScoreDisplay = document.getElementById('final-score-display');
        this.newRecordAlert = document.getElementById('new-record-alert');

        this.sound = new SoundEngine();

        this.score = 0;
        this.STORAGE_HIGH_SCORE = 'cyber_arcade_best_score';
        this.highScore = parseInt(localStorage.getItem(this.STORAGE_HIGH_SCORE) || '0', 10);
        if (this.highScoreEl) {
            this.highScoreEl.textContent = this.highScore.toString().padStart(5, '0');
        }

        this.isPaused = true;
        this.isGameOver = false;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.1; // Base seconds between obstacles
        this.difficulty = 1.0;
        this.lastTime = null;
        this.animationId = null;

        // Reward / Fact system
        this.facts = [
            "Akash once automated a 4-hour SQL monitoring task into 5 minutes!",
            "Expertise in distributed API integrations & Enterprise troubleshooting.",
            "Advancing Data Science & ML at IIT Guwahati (E&ICT Academy).",
            "8+ years of experience across Technical Solutions, SRE & Team Leadership.",
            "Specialized in SRE metrics, payload tracing & MTTR reduction."
        ];
        this.currentFact = '';
        this.factTimeRemaining = 0;
        this.lastFactScore = 0;
        this.factIndex = 0;

        // Load Player Image
        this.playerImage = new Image();
        this.playerImage.src = 'static/cyberpunk_car.jpg';

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();

        this.player = new Player(this.displayWidth, this.displayHeight, this.playerImage);

        this.initControls();
        this.bindEvents();

        window.addEventListener('resize', () => this.resize());

        // Draw initial canvas frame immediately so it's ready upon display
        this.draw();

        // Check if 2nd+ visit is already active
        if (window.visitTracker && window.visitTracker.visitCount >= 2) {
            this.start();
        }

        // Visibility & focus listener
        window.addEventListener('gameVisibilityChange', (e) => {
            const isVisible = e.detail.isVisible;
            const isGameActive = this.container && !this.container.classList.contains('hidden');

            if (!isVisible || !isGameActive || this.isGameOver) {
                this.isPaused = true;
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            } else if (isGameActive && !this.isGameOver && this.isPaused) {
                this.isPaused = false;
                this.lastTime = performance.now();
                if (!this.animationId) {
                    this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
                }
            }
        });
    }

    resize() {
        if (!this.container || !this.canvas) return;

        const rect = this.container.getBoundingClientRect();
        this.displayWidth = Math.max(320, Math.floor(rect.width));
        this.displayHeight = Math.max(360, Math.floor(rect.height || 460));

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // HiDPI Scaling
        this.canvas.width = Math.floor(this.displayWidth * this.dpr);
        this.canvas.height = Math.floor(this.displayHeight * this.dpr);
        this.canvas.style.width = `${this.displayWidth}px`;
        this.canvas.style.height = `${this.displayHeight}px`;

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        if (this.player) {
            this.player.canvasWidth = this.displayWidth;
            this.player.canvasHeight = this.displayHeight;
            this.player.laneWidth = this.displayWidth / 3;
            this.player.y = this.displayHeight - 85;
            this.player.x = Math.max(5, Math.min(this.displayWidth - this.player.width - 5, this.player.x));
            this.player.targetX = Math.max(5, Math.min(this.displayWidth - this.player.width - 5, this.player.targetX));
        }
    }

    bindEvents() {
        if (this.initBtn) {
            this.initBtn.addEventListener('click', () => this.start());
        }
        if (this.rebootBtn) {
            this.rebootBtn.addEventListener('click', () => this.restart());
        }
    }

    initControls() {
        // Desktop Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.isPaused || this.isGameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.player.move(-1);
                this.sound.playBeep(320, 0.05, 'triangle', 0.08);
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.player.move(1);
                this.sound.playBeep(360, 0.05, 'triangle', 0.08);
            }
        });

        // Mouse & Touch Dragging
        const handlePointerMove = (clientX) => {
            if (this.isPaused || this.isGameOver) return;
            const rect = this.canvas.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            this.player.setTargetX(relativeX);
        };

        this.canvas.addEventListener('mousemove', (e) => handlePointerMove(e.clientX));

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                handlePointerMove(e.touches[0].clientX);
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                handlePointerMove(e.touches[0].clientX);
            }
        }, { passive: true });

        // Mobile On-Screen Virtual Buttons
        const touchLeftBtn = document.getElementById('btn-touch-left');
        const touchRightBtn = document.getElementById('btn-touch-right');

        if (touchLeftBtn) {
            touchLeftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isPaused || this.isGameOver) return;
                this.player.move(-1);
                this.sound.playBeep(320, 0.05, 'triangle', 0.08);
            });
        }

        if (touchRightBtn) {
            touchRightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isPaused || this.isGameOver) return;
                this.player.move(1);
                this.sound.playBeep(360, 0.05, 'triangle', 0.08);
            });
        }
    }

    spawnObstacle() {
        const rand = Math.random();
        let type = 'drone';
        if (rand > 0.65) type = 'shard';
        else if (rand > 0.35) type = 'glitch';

        this.obstacles.push(new Obstacle(this.displayWidth, type, this.difficulty));
    }

    showFact(fact) {
        this.currentFact = fact;
        this.factTimeRemaining = 3.5; // Show for 3.5 seconds
        this.sound.playFactAlert();
    }

    updateScore(points) {
        this.score += points;
        if (this.scoreEl) {
            this.scoreEl.textContent = Math.floor(this.score).toString().padStart(5, '0');
        }

        // Trivia facts every 500 points
        if (this.score - this.lastFactScore >= 500) {
            this.showFact(this.facts[this.factIndex]);
            this.factIndex = (this.factIndex + 1) % this.facts.length;
            this.lastFactScore = this.score;
        }

        // High Score Record Persistence
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem(this.STORAGE_HIGH_SCORE, this.highScore.toString());
            if (this.highScoreEl) {
                this.highScoreEl.textContent = this.highScore.toString().padStart(5, '0');
            }
        }
    }

    checkCollisions() {
        const pBox = {
            x: this.player.x + 6,
            y: this.player.y + 4,
            w: this.player.width - 12,
            h: this.player.height - 8
        };

        for (const obs of this.obstacles) {
            // Direct Hit
            if (
                pBox.x < obs.x + obs.width &&
                pBox.x + pBox.w > obs.x &&
                pBox.y < obs.y + obs.height &&
                pBox.y + pBox.h > obs.y
            ) {
                this.gameOver();
                return;
            }

            // Close Call Grazing Bonus
            const margin = 20;
            if (
                !obs.closeCall &&
                this.player.x - margin < obs.x + obs.width &&
                this.player.x + this.player.width + margin > obs.x &&
                this.player.y - margin < obs.y + obs.height &&
                this.player.y + this.player.height + margin > obs.y
            ) {
                obs.closeCall = true;
                this.updateScore(50);
                this.sound.playCloseCall();
                this.showFact("⚡ CLOSE CALL! +50 PTS");
            }
        }
    }

    update(dt) {
        if (this.isPaused || this.isGameOver) return;

        // Player physics update
        this.player.update(dt);

        // Continuous survival score
        this.updateScore(8 * dt);

        // Difficulty ramp
        this.difficulty = Math.min(2.5, 1.0 + (this.score / 2000) * 0.5);
        if (this.speedBadge) {
            this.speedBadge.textContent = `${this.difficulty.toFixed(1)}X SPD`;
        }

        // Spawn timer
        this.spawnTimer += dt;
        const currentInterval = Math.max(0.45, this.spawnInterval / this.difficulty);
        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.spawnObstacle();
        }

        // Obstacles update (reverse loop for safe splice)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt);

            if (obs.y > this.displayHeight + 40) {
                this.obstacles.splice(i, 1);
                this.updateScore(15);
            }
        }

        this.checkCollisions();

        if (this.factTimeRemaining > 0) {
            this.factTimeRemaining -= dt;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

        // Cyber Grid Road
        this.drawRoadGrid();

        // Entities
        this.player.draw(this.ctx);
        for (const obs of this.obstacles) {
            obs.draw(this.ctx);
        }

        // Trivia & Reward Banner
        if (this.factTimeRemaining > 0) {
            this.drawTriviaBanner();
        }
    }

    drawRoadGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
        this.ctx.lineWidth = 1;

        const spacing = 36;
        const offset = ((performance.now() / 1000) * 80 * this.difficulty) % spacing;

        // Lane dividing lines
        for (let i = 1; i <= 2; i++) {
            const lx = i * (this.displayWidth / 3);
            this.ctx.beginPath();
            this.ctx.setLineDash([12, 12]);
            this.ctx.moveTo(lx, 0);
            this.ctx.lineTo(lx, this.displayHeight);
            this.ctx.stroke();
        }

        // Horizontal road motion lines
        this.ctx.setLineDash([]);
        for (let y = offset; y <= this.displayHeight; y += spacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.displayWidth, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawTriviaBanner() {
        this.ctx.save();
        this.ctx.font = 'bold 13px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const text = this.currentFact;
        const textWidth = this.ctx.measureText(text).width;
        const boxWidth = Math.min(this.displayWidth - 20, textWidth + 36);
        const boxHeight = 32;
        const boxX = this.displayWidth / 2 - boxWidth / 2;
        const boxY = 48;

        // Neon backdrop box
        this.ctx.fillStyle = 'rgba(5, 5, 10, 0.88)';
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 12;

        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Text
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fillText(text, this.displayWidth / 2, boxY + boxHeight / 2);

        this.ctx.restore();
    }

    gameLoop(timestamp) {
        if (this.isPaused) return;

        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    start() {
        const terminalMsg = document.querySelector('.terminal-msg');
        if (terminalMsg) terminalMsg.classList.add('hidden');

        this.container.classList.remove('hidden');
        this.container.classList.add('active');

        this.resize();
        this.player.x = this.displayWidth / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;

        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = performance.now();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    restart() {
        this.score = 0;
        if (this.scoreEl) this.scoreEl.textContent = '00000';
        this.obstacles = [];
        this.isGameOver = false;
        this.difficulty = 1.0;
        this.spawnTimer = 0;
        this.lastFactScore = 0;
        this.factTimeRemaining = 0;

        if (this.overlay) this.overlay.classList.add('hidden');
        if (this.newRecordAlert) this.newRecordAlert.classList.add('hidden');

        this.player.x = this.displayWidth / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;

        this.isPaused = false;
        this.lastTime = performance.now();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    gameOver() {
        this.isGameOver = true;
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.sound.playCrash();

        if (this.finalScoreDisplay) {
            this.finalScoreDisplay.textContent = Math.floor(this.score).toString();
        }

        const isNewRecord = Math.floor(this.score) >= this.highScore && this.score > 0;
        if (this.newRecordAlert) {
            if (isNewRecord) {
                this.newRecordAlert.classList.remove('hidden');
            } else {
                this.newRecordAlert.classList.add('hidden');
            }
        }

        const rewardMsg = document.getElementById('game-reward-msg');
        if (rewardMsg) {
            if (this.score > 2500) {
                rewardMsg.textContent = "🏆 LEGENDARY SRE RUN! SYSTEM STABILIZED AT 99.999% UP-TIME.";
            } else if (this.score > 1200) {
                rewardMsg.textContent = "⚡ IMPRESSIVE INTEGRATION SPEED. INCIDENT MITIGATED.";
            } else {
                rewardMsg.textContent = "⚠️ CONNECTION RESET. REBOOT DEFENSE SYSTEM TO RETRY.";
            }
        }

        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    }
}

// Auto-instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.cyberGame = new Game();
});
