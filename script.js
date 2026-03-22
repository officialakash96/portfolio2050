document.addEventListener('DOMContentLoaded', () => {
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

    // 2. Parallax Grid - Syncs with scroll movement
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

    // 3. Initial Hero Animation - High Impact
    const heroTl = gsap.timeline();

    heroTl.from('.profile-container', {
        duration: 1.5,
        y: 100,
        opacity: 0,
        ease: "expo.out"
    })
    .from('.hero-content h1', {
        duration: 1,
        x: -100,
        opacity: 0,
        ease: "power4.out"
    }, "-=1")
    .from('.typewriter-text', {
        duration: 1.2,
        width: 0,
        opacity: 0,
        ease: "none",
        onComplete: () => {
            document.querySelector('.typewriter-text').style.borderRight = "none";
        }
    }, "-=0.2")
    .from('.contact-info span', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out"
    }, "-=0.8")
    .from('.social-links a', {
        duration: 0.8,
        y: 20,
        autoAlpha: 0,
        stagger: 0.15,
        ease: "power3.out"
    }, "-=0.5")
    .from('.cyber-btn', {
        duration: 1,
        scaleX: 0,
        transformOrigin: "left",
        opacity: 0,
        ease: "expo.out"
    }, "-=0.5");

    // 4. Ultra-Smooth Section Reveals
    const reveals = document.querySelectorAll('.reveal');

    reveals.forEach((el) => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%", 
                toggleActions: "play none none none",
            },
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: "power4.out"
        });
    });

    // 5. Card Hover Interaction (Enhanced via JS for subtlety)
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                duration: 0.4,
                boxShadow: "0 0 30px rgba(0, 243, 255, 0.2)",
                borderColor: "#00f3ff",
                ease: "power2.out"
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                duration: 0.4,
                boxShadow: "0 0 0px rgba(0, 243, 255, 0)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                ease: "power2.out"
            });
        });
    });

    // 6. Game Reveal ScrollTrigger
    gsap.from('#game-trigger .terminal-msg', {
        scrollTrigger: {
            trigger: '#game-trigger',
            start: "top 90%",
            toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Performance: Pause game when not in view
    const gameCanvas = document.getElementById('cybertruck-game');
    if (gameCanvas) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                window.dispatchEvent(new CustomEvent('gameVisibilityChange', { 
                    detail: { isVisible: entry.isIntersecting } 
                }));
            });
        }, { threshold: 0.1 });
        observer.observe(gameCanvas);
    }

    // Performance: Pause game when tab is hidden
    document.addEventListener('visibilitychange', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { 
            detail: { isVisible: !document.hidden } 
        }));
    });

    // Performance: Pause game when window loses focus
    window.addEventListener('blur', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { 
            detail: { isVisible: false } 
        }));
    });

    window.addEventListener('focus', () => {
        window.dispatchEvent(new CustomEvent('gameVisibilityChange', { 
            detail: { isVisible: true } 
        }));
    });
});
