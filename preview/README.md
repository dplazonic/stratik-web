# Stratik local redesign

Visit `http://127.0.0.1:3001/preview/?v=new-brand#top` through the local server (`node server.mjs 3001` from the repository root).

This is a separate static design preview. The original website in the repository root is unchanged. No build step is required.

Visual thesis: full-width quarry photography, a graphite and forest-green palette, generous display typography, and mineral-gold topographic linework, inspired by the client's landscape reference. `brand.css` applies this art direction over the existing component styles.

Content: concise hero, six services, project process, company and contact.

Motion: the hero photograph enters subtly, section content reveals on scroll, and interactive elements use restrained hover transitions. The geological block section was removed. The original maptrace remains in `terrain.js` for reference and is not loaded.

Dark is the initial theme for this concept. The light-mode toggle persists a separate `stratik-rework-theme` preference.

The inquiry form prepares an email in the visitor's mail app. It does not claim to send mail through a backend.

Assets:
- New transparent Stratik color, white and black logos and the horizontal Zagreb stamp, supplied by the client on September 14, 2026. PNGs are used directly; the supplied SVG versions contain embedded raster images rather than vector paths. Original artwork is preserved.
- Terrain adapted from the existing maptrace sketch, originally by Kjetil Golid: https://github.com/kgolid/p5ycho/tree/master/trace-perspective
- Quarry photograph: Dion Beetson, Unsplash. Illustrative image, not a Stratik project reference. https://unsplash.com/photos/oF7hh97lVqA (Unsplash License).
- Icons: Lucide, ISC license, selected icon nodes from the installed package.
- p5.js 0.5.10: existing sketch dependency, LGPL-2.1.
- Montserrat: Google Fonts, SIL Open Font License.

Vercel serves this directory at the site root. The page allows indexing after publication.

`check-rework.cjs` performs the current browser checks with Playwright and installed Chrome. It checks responsive layouts, hero imagery, logos, services, dialog focus, mobile navigation and theme persistence. Screenshots are written to the operating system's temporary directory. Run with dependencies available in `NODE_PATH`:

```sh
node preview/check-rework.cjs
```
