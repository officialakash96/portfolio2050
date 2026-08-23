/**
 * Akash Singh - Cyber-Resume Site Controller & Visit Engine
 * Handles visit counting, GSAP animations, HUD progression, and game orchestration.
 */

class VisitTracker {
    constructor() {
        this.STORAGE_KEY = 'cyber_resume_visits';
        this.LAST_VISIT_KEY = 'cyber_resume_last_visit';
        this.visitCount = 1;
        this.isReturning = false;
        this.init();
    }

    init() {
        try {
            const rawCount = localStorage.getItem(this.STORAGE_KEY);
            const now = Date.now();

            if (rawCount) {
                this.visitCount = parseInt(rawCount, 10) + 1;
                this.isReturning = true;
            } else {
                this.visitCount = 1;
                this.isReturning = false;
            }

            localStorage.setItem(this.STORAGE_KEY, this.visitCount.toString());
            localStorage.setItem(this.LAST_VISIT_KEY, now.toString());
        } catch (e) {
            console.warn('LocalStorage unavailable for visit tracking', e);
            this.visitCount = 1;
            this.isReturning = false;
        }

        this.updateHUD();
        this.checkReturnVisitorUnlock();
    }

    updateHUD() {
        const badge = document.getElementById('visit-badge');
        if (badge) {
            if (this.visitCount === 1) {
                badge.textContent = 'SESSION: 001 // RECRUIT';
                badge.classList.remove('active');
            } else {
                badge.textContent = `AGENT #${this.visitCount} // ARCADE ACTIVE`;
                badge.classList.add('active');
            }
        }
    }

    checkReturnVisitorUnlock() {
        // Requirement: 2nd+ visit automatically showcases and unlocks the game on the page!
        if (this.visitCount >= 2) {
            const banner = document.getElementById('return-visitor-banner');
            const quickPlayBtn = document.getElementById('quick-play-btn');
            const dismissBtn = document.getElementById('dismiss-banner-btn');
            const terminalGreeting = document.getElementById('terminal-greeting');
            const gameTrigger = document.getElementById('game-trigger');
            const gameContainer = document.getElementById('game-container');
            const gPreloader = document.getElementById('game-preloader');
            const terminalMsg = document.querySelector('.terminal-msg');

            // 1. Immediately make the game section visible and active on 2nd visit
            if (gameTrigger) {
                gameTrigger.style.opacity = '1';
                gameTrigger.style.transform = 'none';
            }
            if (gPreloader) gPreloader.classList.add('hidden');
            if (terminalMsg) terminalMsg.classList.add('hidden');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.classList.add('active');
            }

            // Launch game engine
            const launchGame = () => {
                if (window.cyberGame) {
                    window.cyberGame.start();
                }
            };
            if (document.readyState === 'complete') {
                setTimeout(launchGame, 100);
            } else {
                window.addEventListener('load', () => setTimeout(launchGame, 200));
            }

            if (terminalGreeting) {
                terminalGreeting.textContent = `WELCOME BACK AGENT #${this.visitCount}! CYBER-ARCADE UNLOCKED🎁`;
            }

            // 2. Show the top banner to alert the user
            if (banner) {
                setTimeout(() => {
                    banner.classList.remove('hidden');
                    banner.classList.add('slide-in');
                }, 800);

                if (quickPlayBtn) {
                    quickPlayBtn.addEventListener('click', () => {
                        if (gameTrigger) {
                            gameTrigger.scrollIntoView({ behavior: 'smooth' });
                        }
                        banner.classList.add('hidden');
                    });
                }

                if (dismissBtn) {
                    dismissBtn.addEventListener('click', () => {
                        banner.classList.add('hidden');
                    });
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Visit Tracker
    const visitTracker = new VisitTracker();
    window.visitTracker = visitTracker;

    // 2. Smart Preloader
    const preloader = document.getElementById('site-preloader');
    const container = document.querySelector('.container');

    const removePreloader = () => {
        if (preloader) {
            preloader.classList.add('loaded');
            if (container) {
                container.style.opacity = '1';
                container.classList.add('loaded');
            }
        }
        initSiteAnimations();
    };

    if (document.readyState === 'complete') {
        setTimeout(removePreloader, 200);
    } else {
        window.addEventListener('load', () => {
            setTimeout(removePreloader, 300);
        });
    }

    // Safety timeout in case load event delays
    setTimeout(removePreloader, 1500);

    // 3. Site Animations (GSAP with Robust Fallback)
    let animationsInitialized = false;

    function initSiteAnimations() {
        if (animationsInitialized) return;
        animationsInitialized = true;

        // Check if GSAP is loaded
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded, applying CSS fallback.');
            document.querySelectorAll('.reveal').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            const gPreloader = document.getElementById('game-preloader');
            const msg = document.querySelector('.terminal-msg');
            if (gPreloader) gPreloader.classList.add('hidden');
            if (msg) msg.classList.remove('hidden');
            return;
        }

        try {
            gsap.registerPlugin(ScrollTrigger);

            // Scroll Progress Bar Sync
            gsap.to('.scroll-progress', {
                width: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.2
                }
            });

            // Parallax Grid Movement
            gsap.to('.background-grid', {
                y: '-80px',
                ease: 'none',
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1
                }
            });

            // Hero Entrance Animation
            const heroTl = gsap.timeline();
            heroTl.from('.profile-container', { duration: 1.2, y: 60, opacity: 0, ease: 'expo.out' })
                  .from('.hero-content h1', { duration: 0.8, x: -60, opacity: 0, ease: 'power3.out' }, '-=0.8')
                  .from('.typewriter-text', { duration: 0.8, opacity: 0, y: 10, ease: 'power2.out' }, '-=0.5')
                  .from('.contact-info span', { duration: 0.6, y: 15, opacity: 0, stagger: 0.1, ease: 'power2.out' }, '-=0.4')
                  .from('.social-links a', { duration: 0.6, y: 15, opacity: 0, stagger: 0.1, ease: 'power2.out' }, '-=0.4')
                  .from('.hero-actions .cyber-btn', { duration: 0.8, scale: 0.9, opacity: 0, ease: 'back.out(1.4)' }, '-=0.3');

            // Section Reveals (Including Game Trigger on 1st visit)
            document.querySelectorAll('.reveal').forEach((el) => {
                gsap.to(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        toggleActions: 'play none none none'
                    },
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out'
                });
            });

            // Game Trigger Preloader Reveal on 1st Visit
            if (visitTracker.visitCount === 1) {
                ScrollTrigger.create({
                    trigger: '#game-trigger',
                    start: 'top 92%',
                    onEnter: () => {
                        const gPreloader = document.getElementById('game-preloader');
                        const msg = document.querySelector('.terminal-msg');
                        const preloaderText = document.getElementById('game-preloader-text');

                        if (preloaderText) preloaderText.textContent = 'ACCESS_GRANTED.SYS';

                        setTimeout(() => {
                            if (gPreloader) gPreloader.classList.add('hidden');
                            if (msg) {
                                msg.classList.remove('hidden');
                                gsap.from(msg, { y: 25, opacity: 0, duration: 0.8, ease: 'power3.out' });
                            }
                        }, 500);
                    }
                });
            }
        } catch (err) {
            console.error('Animation error, gracefully showing content:', err);
            document.querySelectorAll('.reveal').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }
    }

    // 4. Performance & Visibility Listeners for Game Engine
    const gameCanvas = document.getElementById('cybertruck-game');
    if (gameCanvas) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                window.dispatchEvent(new CustomEvent('gameVisibilityChange', {
                    detail: { isVisible: entry.isIntersecting }
                }));
            });
        }, { threshold: 0.05 });

        observer.observe(gameCanvas);
    }

    document.addEventListener('visibilitychange', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', {
            detail: { isVisible: !document.hidden }
        }));
    });

    window.addEventListener('blur', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: false } }));
    });

    window.addEventListener('focus', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: true } }));
    });
});
