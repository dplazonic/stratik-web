# GEOdraft Website Source

This directory contains the active website source. Run `node build.mjs` from the repository root, then `node serve.mjs 3001` to view the production build.

The compact page contains an introduction, four services, company information and contact details. Contact links open `mailto:info@geodraft.hr`; there is no backend contact form, analytics integration or client database.

The theme preference is saved under `geodraft-theme`. Hero illustrations alternate automatically, and mobile services use a native horizontal slider with keyboard, mouse and touch support. Motion respects `prefers-reduced-motion`.

The header uses the original green/gold GD mark with live Montserrat text. Hero illustrations depict a quarry and gravel extraction area. Font and icon license notices are stored in `assets/`.

## Verification

`check.cjs` runs `check-rework.cjs` using Playwright and Chrome. It checks six viewport sizes, images, links, service ordering, horizontal scrolling and wrapping, touch and mouse dragging, mobile navigation, theme persistence and no-JavaScript content. Screenshots are written to the system temporary directory.

The default preview URL is `http://127.0.0.1:3001/`. Set `BASE_URL` if using another port or a deployed test URL.
