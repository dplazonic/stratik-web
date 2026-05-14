import { animate, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

const serviceGrid = document.querySelector(".service-card-grid");
const introPoints = document.querySelector(".intro-points");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateStaggeredGroup(container, itemSelector, options = {}) {
  if (!container || reduceMotion) return;

  const items = Array.from(container.querySelectorAll(itemSelector));
  const y = options.y || 22;
  const scale = options.scale || 0.97;
  const margin = options.margin || "0px 0px -16% 0px";

  items.forEach((item) => {
    item.style.opacity = "0";
    item.style.transform = `translateY(${y}px) scale(${scale})`;
    item.style.transformOrigin = "50% 80%";
    item.style.willChange = "transform, opacity";
  });

  inView(
    container,
    () => {
      const animation = animate(
        items,
        {
          opacity: [0, 1],
          transform: [`translateY(${y}px) scale(${scale})`, "translateY(0) scale(1)"]
        },
        {
          delay: stagger(options.staggerDelay || 0.08),
          duration: options.duration || 0.65,
          easing: [0.22, 1, 0.36, 1]
        }
      );

      const cleanup = () => {
        items.forEach((item) => {
          item.style.opacity = "";
          item.style.transform = "";
          item.style.transformOrigin = "";
          item.style.willChange = "";
        });
      };

      if (animation.finished) {
        animation.finished.then(cleanup).catch(cleanup);
      } else {
        window.setTimeout(cleanup, 900);
      }
    },
    { margin }
  );
}

animateStaggeredGroup(introPoints, "span", {
  y: 18,
  scale: 0.98,
  staggerDelay: 0.07,
  duration: 0.55,
  margin: "0px 0px -8% 0px"
});

animateStaggeredGroup(serviceGrid, ".service-tile");
