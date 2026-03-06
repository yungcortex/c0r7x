import './style.css';
import { LiquidBackground } from './gl/LiquidBackground.js';
import { ProjectOrb } from './gl/ProjectOrb.js';
import { SmoothScroll, SectionObserver } from './scroll.js';
import { initContactRipple, initMobileNav } from './animations.js';
import { initLoadingScreen } from './loading.js';
import { Timeline } from './timeline.js';
import { projects } from './projects.js';

// Detect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Loading Screen ---
initLoadingScreen().then(() => {
  if (!prefersReducedMotion) {
    init();
  } else {
    initStatic();
  }
});

function initStatic() {
  // Show all sections without animation
  document.querySelectorAll('.anim-enter').forEach(el => el.classList.add('visible'));
  initContactRipple();
  initMobileNav();
  new SectionObserver();
}

function init() {
  // --- WebGL Background ---
  const canvas = document.getElementById('bg-canvas');
  let liquidBg = null;
  if (canvas) {
    try {
      liquidBg = new LiquidBackground(canvas);
    } catch (e) {
      console.warn('WebGL background failed:', e);
    }
  }

  // --- Smooth Scroll ---
  const scroll = new SmoothScroll();

  // --- Section Observer ---
  const orbMap = new Map();
  new SectionObserver(
    // onEnter
    (el) => {
      const section = el.closest('.section--project');
      if (section) {
        const orbContainer = section.querySelector('.project-orb-container');
        if (orbContainer && orbMap.has(orbContainer.id)) {
          orbMap.get(orbContainer.id).show();
        }
      }
    }
  );

  // --- Project Orbs ---
  projects.forEach(project => {
    const container = document.getElementById(`orb-${project.id}`);
    if (container) {
      const orbObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const orb = orbMap.get(container.id);
            if (!orb) return;
            if (entry.isIntersecting) {
              orb.show();
            } else {
              orb.hide();
            }
          });
        },
        { threshold: 0.1 }
      );

      // Defer orb creation until visible
      const createObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              createObserver.disconnect();
              try {
                const orb = new ProjectOrb(container, project);
                orbMap.set(container.id, orb);
                orb.show();
                orbObserver.observe(container);
              } catch (e) {
                console.warn(`Orb creation failed for ${project.id}:`, e);
              }
            }
          });
        },
        { threshold: 0, rootMargin: '200px' }
      );
      createObserver.observe(container);
    }
  });

  // --- Timeline ---
  const timeline = new Timeline();

  // --- Animations ---
  initContactRipple();
  initMobileNav();

  // --- Render Loop ---
  const clock = { start: performance.now() };

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = (performance.now() - clock.start) / 1000;
    const scrollY = scroll.update();
    const scrollProgress = scroll.progress;

    // Update background
    if (liquidBg) {
      liquidBg.update(elapsed, scrollProgress);
    }

    // Update visible orbs
    orbMap.forEach(orb => {
      orb.update(elapsed);
    });

    // Update timeline
    timeline.update(scrollY);
  }

  animate();
}
