/* Adapted from Kjetil Golid's trace-perspective sketch and the existing Stratik maptrace. */
(() => {
  const mount = document.querySelector('#terrain');
  const desktop = matchMedia('(min-width: 701px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 9999999;
  const maxFrames = 190;
  const setCount = 10;
  const perSet = 2000;
  let visible = true;
  let instance;

  const sketch = p => {
    let particles = [];
    let transform;
    let frame = 0;
    let fill;
    let ready = false;

    function setColor() {
      fill = document.documentElement.dataset.theme === 'dark' ? 'rgba(181,204,170,0.14)' : 'rgba(30,72,45,0.14)';
    }
    function initialize() {
      p.randomSeed(seed);
      p.noiseSeed(seed);
      p.clear();
      frame = 0;
      particles = [];
      setColor();
      for (let group = 0; group < setCount; group++) {
        for (let i = 0; i < perSet; i++) {
          particles.push({ x: p.randomGaussian(p.width * .50, 205), y: p.randomGaussian(p.height * .56, 165), angle: p.random(p.TWO_PI), group });
        }
      }
      mount.dataset.state = 'drawing';
      if (reduced.matches) {
        mount.style.visibility = 'hidden';
      } else {
        mount.style.visibility = '';
      }
    }
    function drawStep() {
      const ctx = p.drawingContext;
      ctx.fillStyle = fill;
      for (const particle of particles) {
        particle.x += Math.cos(particle.angle);
        particle.y += Math.sin(particle.angle);
        const nx = 2.05 * (2 * particle.x / p.width - 1);
        const ny = 1.9 * (2 * particle.y / p.height - 1);
        const altitude = p.noise(nx + 423.2, ny - 231.1) + .05 * p.noise(nx * 15 + 113.3, ny * 15 + 221.1);
        const value = (altitude + .045 * (particle.group - setCount / 2)) % 1;
        particle.angle += 3 * (2 * value - 1);
        if (value > .476 && value < .524) {
          const point = transform.transform(particle.x, particle.y + 170 - altitude * 430);
          // Let sparse traces disappear before the canvas edge, without a visible crop.
          const edge = Math.min(point[0], p.width - point[0], point[1], p.height - point[1]);
          if (edge <= 0) continue;
          ctx.globalAlpha = Math.min(1, edge / 95) ** 2;
          ctx.fillRect(point[0], point[1], .95, .95);
        }
      }
      ctx.globalAlpha = 1;
      frame++;
      mount.dataset.frame = String(frame);
    }
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(1400, 1050);
      p.frameRate(30);
      transform = window.PerspT([0, 0, p.width, 0, p.width, p.height, 0, p.height], [160, 220, p.width - 160, 220, p.width + 200, p.height - 180, -200, p.height - 180]);
      ready = true;
      initialize();
      if (!desktop.matches || document.hidden || !visible) p.noLoop();
    };
    p.draw = () => {
      const steps = reduced.matches ? 12 : 1;
      for (let i = 0; i < steps && frame < maxFrames; i++) drawStep();
      if (frame >= maxFrames) {
        p.noLoop();
        mount.style.visibility = '';
        mount.dataset.state = 'complete';
      }
    };
    p.updateActivity = () => {
      if (!ready) return;
      if (desktop.matches && !document.hidden && visible && frame < maxFrames) p.loop();
      else p.noLoop();
    };
    document.addEventListener('stratik:theme', () => {
      if (!ready) return;
      initialize();
      p.updateActivity();
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches && frame < maxFrames) mount.style.visibility = 'hidden';
      else mount.style.visibility = '';
      p.updateActivity();
    });
  };
  instance = new p5(sketch, mount);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    instance.updateActivity?.();
  }, { threshold: 0 });
  observer.observe(document.querySelector('.hero'));
  document.addEventListener('visibilitychange', () => instance.updateActivity?.());
  desktop.addEventListener('change', () => instance.updateActivity?.());
})();
