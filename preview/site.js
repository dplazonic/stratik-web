(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('#mobile-nav');
  const mobileMedia = matchMedia('(max-width: 767px)');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');

  function renderIcons(scope = document) {
    scope.querySelectorAll('[data-icon]').forEach(placeholder => {
      const nodes = window.STRATIK_ICONS?.[placeholder.dataset.icon];
      if (!nodes) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('class', 'icon');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      for (const [tag, attrs] of nodes) {
        const element = document.createElementNS(svg.namespaceURI, tag);
        for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
        svg.append(element);
      }
      placeholder.replaceWith(svg);
    });
  }
  renderIcons();

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    const label = dark ? 'Uključi svijetli način' : 'Uključi tamni način';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    document.querySelector('meta[name="theme-color"]').content = dark ? '#151a18' : '#f7f8f5';
  }
  applyTheme(root.dataset.theme);
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('geodraft-theme', theme); } catch {}
    applyTheme(theme);
  });

  function setMenu(open) {
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Zatvori navigaciju' : 'Otvori navigaciju');
    const icon = document.createElement('i');
    icon.dataset.icon = open ? 'X' : 'Menu';
    menuButton.replaceChildren(icon);
    renderIcons(menuButton);
  }
  menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.composedPath().includes(document.querySelector('.site-header'))) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });

  const slider = document.querySelector('.services-grid');
  const cards = [...slider.children];
  const scrollBehavior = () => motionMedia.matches ? 'instant' : 'smooth';
  const positions = () => {
    const start = cards[0].offsetLeft;
    const max = slider.scrollWidth - slider.clientWidth;
    return cards.map(card => Math.min(card.offsetLeft - start, max));
  };
  const nearestIndex = () => positions().reduce((best, pos, index, points) =>
    Math.abs(pos - slider.scrollLeft) < Math.abs(points[best] - slider.scrollLeft) ? index : best, 0);
  const goTo = index => slider.scrollTo({ left: positions()[index], behavior: scrollBehavior() });

  slider.addEventListener('keydown', event => {
    if (!mobileMedia.matches || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = nearestIndex();
    const targets = { ArrowLeft: Math.max(0, current - 1), ArrowRight: Math.min(cards.length - 1, current + 1), Home: 0, End: cards.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    goTo(targets[event.key]);
  });

  // Touch and trackpad stay native; pointer handling adds mouse dragging only.
  let drag;
  slider.addEventListener('pointerdown', event => {
    if (!mobileMedia.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault();
    slider.focus({ preventScroll: true });
    drag = { pointer: event.pointerId, x: event.clientX, left: slider.scrollLeft, moved: false };
    slider.setPointerCapture(event.pointerId);
  });
  slider.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const distance = drag.x - event.clientX;
    if (Math.abs(distance) < 5 && !drag.moved) return;
    drag.moved = true;
    slider.classList.add('is-dragging');
    slider.scrollLeft = drag.left + distance;
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const moved = drag.moved;
    const target = nearestIndex();
    drag = undefined;
    slider.classList.remove('is-dragging');
    if (moved) goTo(target);
  }
  slider.addEventListener('pointerup', finishDrag);
  slider.addEventListener('pointercancel', finishDrag);
  slider.addEventListener('lostpointercapture', finishDrag);

  function updateLayout() {
    slider.tabIndex = mobileMedia.matches ? 0 : -1;
    if (!mobileMedia.matches) {
      setMenu(false);
      drag = undefined;
      slider.classList.remove('is-dragging');
      slider.scrollLeft = 0;
    }
  }
  mobileMedia.addEventListener('change', updateLayout);
  updateLayout();

  document.querySelector('[data-year]').textContent = new Date().getFullYear();
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main>section[id]').forEach(section => sectionObserver.observe(section));
})();
