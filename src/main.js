import './style.css';
import { LiquidBackground } from './gl/LiquidBackground.js';
import { ProjectOrb } from './gl/ProjectOrb.js';
import { SmoothScroll, SectionObserver } from './scroll.js';
import { initContactRipple, initMobileNav } from './animations.js';
import { initLoadingScreen } from './loading.js';
import { Timeline } from './timeline.js';
import { projects, categories, timelineData } from './projects.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Generate Project Sections ---
function generateProjects() {
  const container = document.getElementById('projects');
  if (!container) return;

  const statusMap = { live: 'LIVE', dev: 'ACTIVE DEV', prototype: 'PROTOTYPE' };
  const statusClass = { live: 'status--live', dev: 'status--dev', prototype: 'status--prototype' };

  let projectIndex = 0;
  const layouts = ['layout-flush-left', 'layout-flush-right', 'layout-flush-left', 'layout-flush-right'];

  categories.forEach(cat => {
    const catProjects = projects.filter(p => p.category === cat.id);
    if (catProjects.length === 0) return;

    // Category header
    const header = document.createElement('div');
    header.className = 'category-header anim-enter';
    header.innerHTML = `
      <span class="category-label" style="color: ${cat.color}">${cat.label}</span>
      <span class="category-count">${catProjects.length} project${catProjects.length > 1 ? 's' : ''}</span>
    `;
    container.appendChild(header);

    // Project cards
    catProjects.forEach(project => {
      projectIndex++;
      const layout = layouts[(projectIndex - 1) % layouts.length];
      const isRight = layout === 'layout-flush-right';

      const section = document.createElement('section');
      section.id = project.id;
      section.className = `section section--project`;
      section.dataset.accent = project.accent;

      section.innerHTML = `
        <div class="project-content anim-enter ${layout}">
          <div class="glass-panel project-panel">
            <div class="project-header">
              <div class="project-meta">
                <span class="project-number">${String(projectIndex).padStart(2, '0')}</span>
                <span class="project-category-badge" style="border-color: ${cat.color}; color: ${cat.color}">${cat.label}</span>
              </div>
              <h2 class="project-title chrome-text" style="--accent: ${project.accent}">${project.name}</h2>
              <p class="project-tagline">${project.tagline}</p>
            </div>
            <ul class="project-features">
              ${project.features.map(f => `<li><span class="chrome-bullet"></span>${f}</li>`).join('')}
            </ul>
            <div class="project-tech">
              ${project.tech.map(t => `<span class="tech-badge">${t}</span>`).join('')}
            </div>
            <div class="project-status">
              <span class="status-dot ${statusClass[project.status]}"></span>
              <span class="status-label">${statusMap[project.status]}</span>
            </div>
          </div>
        </div>
        <div class="project-orb-container ${isRight ? 'orb-left' : 'orb-right'}" id="orb-${project.id}"></div>
      `;

      container.appendChild(section);
    });
  });
}

// --- Generate Timeline ---
function generateTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  timelineData.forEach((item, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const node = document.createElement('div');
    node.className = `timeline-node timeline-node--${side} anim-enter`;
    node.dataset.index = i;
    node.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card glass-panel">
        <h3 class="timeline-project" style="color: ${item.color}">${item.project}</h3>
        <p class="timeline-note">${item.note}</p>
      </div>
    `;
    container.appendChild(node);
  });
}

// --- Build DOM ---
generateProjects();
generateTimeline();

// --- Init ---
initLoadingScreen().then(() => {
  if (!prefersReducedMotion) {
    init();
  } else {
    initStatic();
  }
});

function initStatic() {
  document.querySelectorAll('.anim-enter').forEach(el => el.classList.add('visible'));
  initContactRipple();
  initMobileNav();
  new SectionObserver();
}

function init() {
  const canvas = document.getElementById('bg-canvas');
  let liquidBg = null;
  if (canvas) {
    try {
      liquidBg = new LiquidBackground(canvas);
    } catch (e) {
      console.warn('WebGL background failed:', e);
    }
  }

  const scroll = new SmoothScroll();
  const orbMap = new Map();

  new SectionObserver(
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

  // Create orbs lazily
  projects.forEach(project => {
    const container = document.getElementById(`orb-${project.id}`);
    if (!container) return;

    const orbObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const orb = orbMap.get(container.id);
          if (!orb) return;
          if (entry.isIntersecting) orb.show();
          else orb.hide();
        });
      },
      { threshold: 0.1 }
    );

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
  });

  const timeline = new Timeline();
  initContactRipple();
  initMobileNav();

  const clock = { start: performance.now() };

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (performance.now() - clock.start) / 1000;
    const scrollY = scroll.update();
    const scrollProgress = scroll.progress;

    if (liquidBg) liquidBg.update(elapsed, scrollProgress);
    orbMap.forEach(orb => orb.update(elapsed));
    timeline.update(scrollY);
  }

  animate();
}
