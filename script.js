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
        // Requirement: 2nd+ visit showcases the arcade unlock, but waits for user to manually start!
        if (this.visitCount >= 2) {
            const banner = document.getElementById('return-visitor-banner');
            const quickPlayBtn = document.getElementById('quick-play-btn');
            const dismissBtn = document.getElementById('dismiss-banner-btn');
            const terminalGreeting = document.getElementById('terminal-greeting');
            const gameTrigger = document.getElementById('game-trigger');
            const gPreloader = document.getElementById('game-preloader');
            const terminalMsg = document.querySelector('.terminal-msg');

            // 1. Prepare the game terminal section ready for manual start
            if (gameTrigger) {
                gameTrigger.style.opacity = '1';
                gameTrigger.style.transform = 'none';
            }
            if (gPreloader) gPreloader.classList.add('hidden');
            if (terminalMsg) terminalMsg.classList.remove('hidden');

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
                        if (window.cyberGame) {
                            window.cyberGame.start();
                        }
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
            heroTl.from('.profile-container', { duration: 1.2, y: 60, opacity: 0, ease: 'expo.out', clearProps: 'all' })
                  .from('.hero-content h1', { duration: 0.8, x: -60, opacity: 0, ease: 'power3.out', clearProps: 'all' }, '-=0.8')
                  .from('.typewriter-text', { duration: 0.8, opacity: 0, y: 10, ease: 'power2.out', clearProps: 'all' }, '-=0.5')
                  .from('.contact-info span', { duration: 0.6, y: 15, opacity: 0, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }, '-=0.4')
                  .from('.social-links a', { duration: 0.6, y: 15, opacity: 0, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }, '-=0.4')
                  .from('.hero-actions .cyber-btn', { duration: 0.8, scale: 0.9, opacity: 0, ease: 'back.out(1.4)', clearProps: 'all' }, '-=0.3');

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

    // 4. Dynamic Profile Hydration on Load
    if (window.cyberSupabase) {
        window.cyberSupabase.fetchSiteContent().then(content => {
            if (content && window.cyberHydrateSite) {
                window.cyberHydrateSite(content);
            }
        });
    }

    // 5. Performance & Visibility Listeners for Game Engine
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

/**
 * Dynamic Profile Hydration Engine
 * Populates DOM elements dynamically from Supabase database / local cache
 * with graceful fallback to hardcoded markup.
 */
window.cyberHydrateSite = function(data) {
    if (!data) return;

    try {
        // 1. Hero & Contact Info
        if (data.hero) {
            const nameEl = document.getElementById('hero-name');
            const roleEl = document.getElementById('role');
            const locEl = document.getElementById('hero-location-text');
            const ghEl = document.getElementById('hero-github-link');
            const liEl = document.getElementById('hero-linkedin-link');
            const resumeBtn = document.getElementById('hero-resume-download');

            if (nameEl && data.hero.name) {
                nameEl.textContent = data.hero.name;
                nameEl.setAttribute('data-text', data.hero.name);
            }
            if (roleEl && data.hero.role) {
                roleEl.textContent = data.hero.role;
            }
            if (locEl && data.hero.location) {
                locEl.textContent = data.hero.location;
            }
            if (ghEl && data.hero.github) {
                ghEl.href = data.hero.github;
            }
            if (liEl && data.hero.linkedin) {
                liEl.href = data.hero.linkedin;
            }
            if (resumeBtn && data.hero.resumeUrl) {
                resumeBtn.href = data.hero.resumeUrl;
            }
        }

        // 2. Summary Section
        if (Array.isArray(data.summary) && data.summary.length > 0) {
            const summaryList = document.getElementById('summary-bullets-list');
            if (summaryList) {
                summaryList.innerHTML = data.summary.map(bullet => `<li>${bullet}</li>`).join('');
            }
        }

        // 3. Work History Section
        if (Array.isArray(data.experience) && data.experience.length > 0) {
            const timeline = document.getElementById('timeline-container');
            if (timeline) {
                timeline.innerHTML = data.experience.map(exp => `
                    <div class="timeline-item reveal" style="opacity: 1; transform: none;">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content card glass">
                            <div class="experience-header">
                                <div>
                                    <h3>${exp.role || ''}</h3>
                                    <span class="company">${exp.company || ''}</span>
                                </div>
                                <span class="date">${exp.date || ''}</span>
                            </div>
                            <ul>
                                ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 4. Academic Records
        if (Array.isArray(data.education) && data.education.length > 0) {
            const eduGrid = document.getElementById('education-grid-container');
            if (eduGrid) {
                eduGrid.innerHTML = data.education.map(edu => `
                    <div class="card glass reveal" style="opacity: 1; transform: none;">
                        <div class="edu-badge"><i class="fas fa-certificate"></i> ${edu.badge || 'DEGREE'}</div>
                        <h3>${edu.degree || ''}</h3>
                        <p class="edu-school">${edu.school || ''}</p>
                        <span class="date">${edu.date || ''}</span>
                    </div>
                `).join('');
            }
        }

        // 5. Skills
        if (data.skills) {
            if (Array.isArray(data.skills.programming) && data.skills.programming.length > 0) {
                const progTags = document.getElementById('skills-programming-tags');
                if (progTags) progTags.innerHTML = data.skills.programming.map(s => `<span>${s}</span>`).join('');
            }
            if (Array.isArray(data.skills.databases) && data.skills.databases.length > 0) {
                const dbTags = document.getElementById('skills-database-tags');
                if (dbTags) dbTags.innerHTML = data.skills.databases.map(s => `<span>${s}</span>`).join('');
            }
            if (Array.isArray(data.skills.tools) && data.skills.tools.length > 0) {
                const toolTags = document.getElementById('skills-tools-tags');
                if (toolTags) toolTags.innerHTML = data.skills.tools.map(s => `<span>${s}</span>`).join('');
            }
        }
    } catch (e) {
        console.warn('[cyberHydrateSite] Hydration warning:', e);
    }
};
