export class SmoothScroll {
  constructor() {
    this.current = 0;
    this.target = 0;
    this.ease = 0.08;
    this.rafId = null;
    this.enabled = !this.isMobile() && !this.prefersReducedMotion();

    if (this.enabled) {
      // Intercept wheel to lerp scroll
      window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

      // Sync target when user scrolls via other means (scrollbar drag, etc)
      this.target = window.scrollY;
      this.current = window.scrollY;

      // Handle anchor links with smooth scroll
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const id = link.getAttribute('href').slice(1);
          const el = document.getElementById(id);
          if (el) {
            this.target = el.offsetTop;
            this.clampTarget();
          }
        });
      });
    } else {
      // Native smooth scroll for mobile/reduced motion
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }

  isMobile() {
    return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get maxScroll() {
    return document.body.scrollHeight - window.innerHeight;
  }

  clampTarget() {
    this.target = Math.max(0, Math.min(this.target, this.maxScroll));
  }

  onWheel(e) {
    e.preventDefault();
    this.target += e.deltaY;
    this.clampTarget();
  }

  update() {
    if (!this.enabled) {
      this.current = window.scrollY;
      return this.current;
    }

    this.current += (this.target - this.current) * this.ease;
    window.scrollTo(0, this.current);
    return this.current;
  }

  get progress() {
    const max = this.maxScroll;
    return max > 0 ? this.current / max : 0;
  }
}

export class SectionObserver {
  constructor(onEnter, onLeave) {
    this.observers = [];

    const options = {
      threshold: 0.2,
      rootMargin: '0px',
    };

    document.querySelectorAll('.anim-enter').forEach(el => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (onEnter) onEnter(entry.target);
          }
        });
      }, options);
      observer.observe(el);
      this.observers.push(observer);
    });

    // Nav active state
    const navOptions = { threshold: 0.3 };
    document.querySelectorAll('.section').forEach(section => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll('.nav-link').forEach(link => {
              link.classList.toggle('active', link.dataset.section === id);
            });
          }
        });
      }, navOptions);
      observer.observe(section);
      this.observers.push(observer);
    });
  }
}
