document.addEventListener('DOMContentLoaded', () => {
    // 0. Smart Site Preloader - Only shows if slow load
    const preloader = document.getElementById('site-preloader');
    const container = document.querySelector('.container');
    let isPageLoaded = false;
    let animationsInitialized = false;

    // Set a grace period of 700ms
    const loaderGracePeriod = setTimeout(() => {
        if (!isPageLoaded && preloader) {
            // It's a slow load! Show the loader.
            preloader.classList.add('visible');
            // Hide container temporarily to avoid partial flash
            if (container) container.style.opacity = '0';
        }
    }, 700);

    // Main window load event
    window.addEventListener('load', () => {
        isPageLoaded = true;
        clearTimeout(loaderGracePeriod);
        
        if (preloader) {
            preloader.classList.add('loaded');
            if (container) {
                container.style.opacity = '1';
                container.classList.add('loaded');
            }
            // Wait for slide animation to finish if it was shown
            setTimeout(initSiteAnimations, 600);
        } else {
            initSiteAnimations();
        }
    });

    function initSiteAnimations() {
        if (animationsInitialized) return;
        animationsInitialized = true;

        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        // 1. HUD Progress Bar Sync
        gsap.to('.scroll-progress', {
            width: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3
            }
        });

        // 2. Parallax Grid
        gsap.to('.background-grid', {
            y: '-100px',
            ease: 'none',
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.5
            }
        });

        // 3. Initial Hero Animation
        const heroTl = gsap.timeline();
        heroTl.from('.profile-container', { duration: 1.5, y: 100, opacity: 0, ease: "expo.out" })
        .from('.hero-content h1', { duration: 1, x: -100, opacity: 0, ease: "power4.out" }, "-=1")
        .from('.typewriter-text', { 
            duration: 1.2, width: 0, opacity: 0, ease: "none",
            onComplete: () => {
                const el = document.querySelector('.typewriter-text');
                if (el) el.style.borderRight = "none";
            }
        }, "-=0.2")
        .from('.contact-info span', { duration: 0.8, y: 20, opacity: 0, stagger: 0.1, ease: "power3.out" }, "-=0.8")
        .from('.social-links a', { duration: 0.8, y: 20, autoAlpha: 0, stagger: 0.15, ease: "power3.out" }, "-=0.5")
        .from('.cyber-btn', { duration: 1, scaleX: 0, transformOrigin: "left", opacity: 0, ease: "expo.out" }, "-=0.5");

        // 4. Section Reveals
        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach((el) => {
            gsap.to(el, {
                scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
                opacity: 1, y: 0, duration: 1.4, ease: "power4.out"
            });
        });

        // 5. Card Hover
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, { duration: 0.4, boxShadow: "0 0 30px rgba(0, 243, 255, 0.2)", borderColor: "#00f3ff", ease: "power2.out" });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { duration: 0.4, boxShadow: "0 0 0px rgba(0, 243, 255, 0)", borderColor: "rgba(255, 255, 255, 0.1)", ease: "power2.out" });
            });
        });

        // 6. Game Reveal
        gsap.from('#game-trigger', {
            scrollTrigger: {
                trigger: '#game-trigger',
                start: "top 95%",
                onEnter: () => {
                    setTimeout(() => {
                        const gPreloader = document.getElementById('game-preloader');
                        const msg = document.querySelector('.terminal-msg');
                        if (gPreloader && msg) {
                            gPreloader.classList.add('hidden');
                            msg.classList.remove('hidden');
                            gsap.from(msg, { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" });
                        }
                    }, 1500);
                }
            }
        });

        // Game Performance Observers
        const gameCanvas = document.getElementById('cybertruck-game');
        if (gameCanvas) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: entry.isIntersecting } }));
                });
            }, { threshold: 0.1 });
            observer.observe(gameCanvas);
        }
    }

    // Tab Visibility/Focus Events for Game
    document.addEventListener('visibilitychange', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: !document.hidden } }));
    });
    window.addEventListener('blur', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: false } }));
    });
    window.addEventListener('focus', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { detail: { isVisible: true } }));
    });
});
