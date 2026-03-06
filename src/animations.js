export function initContactRipple() {
  document.querySelectorAll('.contact-pill').forEach(pill => {
    pill.addEventListener('mousemove', (e) => {
      const rect = pill.getBoundingClientRect();
      pill.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      pill.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });
}

export function initCursorInteraction() {
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Subtle parallax on glass panels based on cursor
  const panels = document.querySelectorAll('.glass-panel');
  function updateParallax() {
    const cx = (mx / window.innerWidth - 0.5) * 2;
    const cy = (my / window.innerHeight - 0.5) * 2;
    panels.forEach(panel => {
      const rect = panel.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        panel.style.transform = panel.style.transform.replace(/translate\([^)]*\)/, '') +
          ` translate(${cx * 3}px, ${cy * 3}px)`;
      }
    });
    requestAnimationFrame(updateParallax);
  }

  if (window.innerWidth > 768) {
    requestAnimationFrame(updateParallax);
  }
}

export function initMobileNav() {
  const toggle = document.getElementById('mobile-nav-toggle');
  const menu = document.getElementById('mobile-nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
    });
  });
}
