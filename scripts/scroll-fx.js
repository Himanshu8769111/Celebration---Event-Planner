/**
 * CELEBRAI SCROLL ANIMATIONS, TEXTURES & AMBIENT VISUAL EFFECTS
 * Handles IntersectionObserver scroll reveals, scroll progress indicator,
 * active section navigation spy, luxury grain texture, and celebration confetti.
 */

class ScrollEffects {
  constructor() {
    this.observer = null;
  }

  init() {
    this.setupScrollObserver();
    this.setupScrollProgressBar();
    this.setupHeaderScrollSpy();
    this.setupAmbientOrbs();
  }

  setupScrollObserver() {
    const revealElements = document.querySelectorAll(
      '.reveal-on-scroll, .reveal-scale, .reveal-left, .reveal-right, .stagger-container'
    );

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Unobserve after animating in for performance
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(el => this.observer.observe(el));
    } else {
      // Fallback for older browsers
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  }

  refreshObserver() {
    if (this.observer) {
      const newElements = document.querySelectorAll(
        '.reveal-on-scroll:not(.is-visible), .reveal-scale:not(.is-visible), .reveal-left:not(.is-visible), .reveal-right:not(.is-visible), .stagger-container:not(.is-visible)'
      );
      newElements.forEach(el => this.observer.observe(el));
    }
  }

  setupScrollProgressBar() {
    const bar = document.querySelector('.scroll-progress-bar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    }, { passive: true });
  }

  setupHeaderScrollSpy() {
    const header = document.querySelector('.header-nav');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 120;

      // Header shadow / blur state
      if (header) {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }

      // Nav link spy
      sections.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { passive: true });
  }

  setupAmbientOrbs() {
    const orbContainer = document.querySelector('.ambient-glow-mesh');
    if (!orbContainer) return;

    // Create subtle floating glowing orbs in our palette colors
    const colors = [
      'rgba(239, 177, 29, 0.18)', // Gold
      'rgba(228, 61, 18, 0.15)', // Coral
      'rgba(214, 83, 109, 0.16)', // Berry
      'rgba(255, 162, 182, 0.22)'  // Blush
    ];

    for (let i = 0; i < 4; i++) {
      const orb = document.createElement('div');
      orb.className = 'sparkle-orb';
      const size = Math.floor(Math.random() * 200) + 180;
      orb.style.width = `${size}px`;
      orb.style.height = `${size}px`;
      orb.style.background = colors[i % colors.length];
      orb.style.top = `${Math.random() * 85}%`;
      orb.style.left = `${Math.random() * 85}%`;
      orb.style.animationDelay = `${i * 1.5}s`;
      orb.style.animationDuration = `${7 + i * 2}s`;
      orbContainer.appendChild(orb);
    }
  }

  /**
   * Confetti celebration burst using SVG elements
   */
  celebrateBurst() {
    const count = 35;
    const colors = ['#E43D12', '#D6536D', '#FFA2B6', '#EFB11D', '#EBE9E1'];
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      confetti.style.left = `${Math.random() * 95}vw`;
      confetti.style.top = `-20px`;
      const size = Math.floor(Math.random() * 8) + 6;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 1.4}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.animation = `celebrationConfetti ${2.5 + Math.random() * 2}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
      confetti.style.animationDelay = `${Math.random() * 0.4}s`;

      document.body.appendChild(confetti);

      setTimeout(() => {
        if (confetti.parentNode) confetti.parentNode.removeChild(confetti);
      }, 5000);
    }
  }
}

// Global scroll instance
window.scrollEffects = new ScrollEffects();
