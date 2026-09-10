(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeMedia = matchMedia('(prefers-color-scheme: dark)');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('#mobile-nav');
  const dialog = document.querySelector('#inquiry-dialog');
  const form = document.querySelector('#inquiry-form');
  const formStatus = document.querySelector('#form-status');
  let lastTrigger;

  function renderIcons(scope = document) {
    scope.querySelectorAll('[data-icon]').forEach((placeholder) => {
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
    document.querySelector('meta[name="theme-color"]').content = dark ? '#1c221e' : '#f5f6f3';
    document.dispatchEvent(new CustomEvent('stratik:theme', { detail: theme }));
  }
  applyTheme(root.dataset.theme);
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('stratik-preview-theme', theme); } catch {}
    applyTheme(theme);
  });
  themeMedia.addEventListener('change', ({ matches }) => {
    let saved;
    try { saved = localStorage.getItem('stratik-preview-theme'); } catch {}
    if (!saved) applyTheme(matches ? 'dark' : 'light');
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
  matchMedia('(min-width: 981px)').addEventListener('change', ({ matches }) => { if (matches) setMenu(false); });
  document.addEventListener('click', (event) => {
    if (!mobileNav.hidden && !event.composedPath().includes(document.querySelector('.site-header'))) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });

  document.querySelectorAll('[data-inquiry]').forEach(button => {
    button.addEventListener('click', () => {
      lastTrigger = mobileNav.contains(button) ? menuButton : button;
      setMenu(false);
      if (button.dataset.inquiry) form.elements.service.value = button.dataset.inquiry;
      formStatus.textContent = '';
      dialog.showModal();
      document.body.classList.add('dialog-open');
      form.elements.name.focus({ preventScroll: true });
    });
  });
  document.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  let pointerStartedOutside = false;
  dialog.addEventListener('pointerdown', (event) => { pointerStartedOutside = event.target === dialog; });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && pointerStartedOutside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lastTrigger?.focus({ preventScroll: true });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const text = name => String(data.get(name) || '').trim();
    const body = [
      `Ime i prezime: ${text('name')}`,
      `E-mail: ${text('email')}`,
      `Tvrtka: ${text('company') || 'Nije navedeno'}`,
      `Lokacija projekta: ${text('location') || 'Nije navedeno'}`,
      `Usluga: ${text('service')}`,
      '', 'Opis projekta:', text('message')
    ].join('\n');
    const mail = `mailto:info@stratik.hr?subject=${encodeURIComponent(`Projektni upit: ${text('service')}`)}&body=${encodeURIComponent(body)}`;
    formStatus.textContent = 'Upit je pripremljen za vašu e-mail aplikaciju. Ako se aplikacija ne otvori, pišite nam na info@stratik.hr.';
    window.location.href = mail;
  });

  document.querySelector('[data-year]').textContent = new Date().getFullYear();
  const revealItems = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08 });
  if (!motionMedia.matches) {
    revealItems.forEach((item, i) => {
      item.classList.add('reveal-ready');
      if (item.classList.contains('service')) item.style.transitionDelay = `${(i % 3) * 55}ms`;
      revealObserver.observe(item);
    });
  }
  motionMedia.addEventListener('change', ({ matches }) => {
    if (matches) {
      revealObserver.disconnect();
      revealItems.forEach(item => item.classList.add('is-visible'));
    }
  });

  const sections = [...document.querySelectorAll('main>section[id]')];
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => sectionObserver.observe(section));

  // Keep the generative terrain off mobile to avoid loading its drawing dependencies.
  let terrainPromise;
  const desktopTerrain = matchMedia('(min-width: 701px)');
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  function startTerrain() {
    if (!desktopTerrain.matches || terrainPromise) return;
    terrainPromise = loadScript('assets/p5.min.js')
      .then(() => loadScript('assets/perspective-transform.js'))
      .then(() => loadScript('terrain.js'))
      .catch(() => {
        document.querySelector('.hero-art').classList.add('terrain-unavailable');
        terrainPromise = undefined;
      });
  }
  startTerrain();
  desktopTerrain.addEventListener('change', startTerrain);
})();
