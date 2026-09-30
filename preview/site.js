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

  const hero = document.querySelector('.hero');
  const heroImages = hero.querySelectorAll('.hero-landscape');
  let currentSlide = 0;
  let slideTimer;

  function showSlide(index) {
    currentSlide = index;
    hero.dataset.slide = String(index);
    heroImages.forEach((img, imageIndex) => img.setAttribute('aria-hidden', String(imageIndex !== index)));
  }

  function scheduleSlides() {
    clearInterval(slideTimer);
    if (!motionMedia.matches && !document.hidden) {
      slideTimer = setInterval(() => showSlide((currentSlide + 1) % heroImages.length), 7000);
    }
  }

  document.addEventListener('visibilitychange', scheduleSlides);
  motionMedia.addEventListener('change', scheduleSlides);
  scheduleSlides();

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
    try { localStorage.setItem('litologik-theme', theme); } catch {}
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
  const scrollTrack = document.createElement('div');
  scrollTrack.className = 'services-scroll-track';
  scrollTrack.setAttribute('aria-hidden', 'true');
  const scrollThumb = document.createElement('span');
  scrollThumb.className = 'services-scroll-thumb';
  scrollTrack.append(scrollThumb);
  slider.after(scrollTrack);
  let loopEnabled = false;
  let activeCard = 0;
  let restoringLayout = false;
  let drag;
  let settleTimer;
  const scrollBehavior = () => motionMedia.matches ? 'instant' : 'smooth';
  const positions = () => {
    const start = slider.getBoundingClientRect().left + parseFloat(getComputedStyle(slider).paddingLeft);
    return [...slider.children].map(card => card.getBoundingClientRect().left - start + slider.scrollLeft);
  };
  const nearestIndex = () => positions().reduce((best, pos, index, points) =>
    Math.abs(pos - slider.scrollLeft) < Math.abs(points[best] - slider.scrollLeft) ? index : best, 0);
  const realIndex = index => ((index - cards.length) % cards.length + cards.length) % cards.length;
  const goTo = (index, behavior = scrollBehavior()) => slider.scrollTo({ left: positions()[index], behavior });

  // Copies on either side preserve native swiping; reset to the identical middle card after settling.
  function makeLoopCopy(card) {
    const copy = card.cloneNode(true);
    copy.dataset.loopCopy = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('inert', '');
    [copy, ...copy.querySelectorAll('[id], [aria-labelledby]')].forEach(element => {
      element.removeAttribute('id');
      element.removeAttribute('aria-labelledby');
    });
    return copy;
  }
  function settleLoop() {
    clearTimeout(settleTimer);
    if (!loopEnabled || !mobileMedia.matches || restoringLayout || drag) return;
    const index = nearestIndex();
    const target = positions()[index];
    if (Math.abs(slider.scrollLeft - target) > 2) return;
    activeCard = realIndex(index);
    if (index < cards.length || index >= cards.length * 2) goTo(cards.length + activeCard, 'instant');
    updateScrollIndicator();
  }
  function updateScrollIndicator() {
    if (!loopEnabled || !mobileMedia.matches || restoringLayout) return;
    activeCard = realIndex(nearestIndex());
    const ratio = 1 / cards.length;
    const progress = activeCard / (cards.length - 1);
    slider.classList.add('can-scroll-back', 'can-scroll-forward');
    scrollThumb.style.width = `${ratio * 100}%`;
    scrollThumb.style.transform = `translateX(${progress * (1 - ratio) / ratio * 100}%)`;
  }
  slider.addEventListener('scroll', () => {
    updateScrollIndicator();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleLoop, 180);
  }, { passive: true });
  slider.addEventListener('scrollend', settleLoop);

  slider.addEventListener('keydown', event => {
    if (!mobileMedia.matches || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = nearestIndex();
    const targets = { ArrowLeft: Math.max(0, current - 1), ArrowRight: Math.min(slider.children.length - 1, current + 1), Home: cards.length, End: cards.length * 2 - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    goTo(targets[event.key]);
  });

  // Touch and trackpad stay native; pointer handling adds mouse dragging only.
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
    clearTimeout(settleTimer);
    if (mobileMedia.matches && !loopEnabled) {
      const restoreCard = activeCard;
      restoringLayout = true;
      slider.prepend(...cards.map(makeLoopCopy));
      slider.append(...cards.map(makeLoopCopy));
      loopEnabled = true;
      goTo(cards.length + restoreCard, 'instant');
      requestAnimationFrame(() => {
        if (loopEnabled && mobileMedia.matches) goTo(cards.length + restoreCard, 'instant');
        restoringLayout = false;
        updateScrollIndicator();
      });
    } else if (!mobileMedia.matches) {
      loopEnabled = false;
      restoringLayout = false;
      slider.querySelectorAll('[data-loop-copy]').forEach(copy => copy.remove());
      setMenu(false);
      drag = undefined;
      slider.classList.remove('is-dragging', 'can-scroll-back', 'can-scroll-forward');
      slider.scrollLeft = 0;
    }
  }
  mobileMedia.addEventListener('change', updateLayout);
  updateLayout();
  let sliderWidth = slider.clientWidth;
  new ResizeObserver(() => {
    if (slider.clientWidth === sliderWidth) return;
    sliderWidth = slider.clientWidth;
    if (loopEnabled && !restoringLayout && !drag) {
      goTo(cards.length + activeCard, 'instant');
      updateScrollIndicator();
    }
  }).observe(slider);

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
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
})();
