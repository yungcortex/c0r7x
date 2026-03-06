export class Timeline {
  constructor() {
    this.container = document.querySelector('.timeline-container');
    this.line = document.getElementById('timeline-line');
    this.glow = document.getElementById('timeline-glow');
    this.nodes = document.querySelectorAll('.timeline-node');

    if (!this.container || !this.line) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    this.nodes.forEach(node => this.observer.observe(node));
  }

  update(scrollY) {
    if (!this.container || !this.line) return;

    const rect = this.container.getBoundingClientRect();
    const containerTop = rect.top;
    const containerHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Calculate how far the timeline has been scrolled through
    const progress = Math.max(0, Math.min(1,
      (viewportHeight - containerTop) / (containerHeight + viewportHeight)
    ));

    // Draw the line
    const lineHeight = progress * 100;
    this.line.style.height = lineHeight + '%';

    // Move the glow pulse
    if (this.glow) {
      this.glow.style.opacity = progress > 0.05 && progress < 0.95 ? '1' : '0';
      this.glow.style.top = (lineHeight) + '%';
    }
  }
}
