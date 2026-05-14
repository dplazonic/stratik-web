import { animate, inView, stagger } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

const serviceGrid = document.querySelector(".service-card-grid");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (serviceGrid && !reduceMotion) {
  const serviceTiles = Array.from(serviceGrid.querySelectorAll(".service-tile"));

  serviceTiles.forEach((tile) => {
    tile.style.opacity = "0";
    tile.style.transform = "translateY(26px) scale(0.97)";
    tile.style.transformOrigin = "50% 80%";
    tile.style.willChange = "transform, opacity";
  });

  inView(
    serviceGrid,
    () => {
      const animation = animate(
        serviceTiles,
        {
          opacity: [0, 1],
          transform: ["translateY(26px) scale(0.97)", "translateY(0) scale(1)"]
        },
        {
          delay: stagger(0.08),
          duration: 0.65,
          easing: [0.22, 1, 0.36, 1]
        }
      );

      const cleanup = () => {
        serviceTiles.forEach((tile) => {
          tile.style.opacity = "";
          tile.style.transform = "";
          tile.style.transformOrigin = "";
          tile.style.willChange = "";
        });
      };

      if (animation.finished) {
        animation.finished.then(cleanup).catch(cleanup);
      } else {
        window.setTimeout(cleanup, 900);
      }
    },
    { margin: "0px 0px -16% 0px" }
  );
}
