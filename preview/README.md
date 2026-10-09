# Litologik website preview

Visit `http://127.0.0.1:3001/preview/?v=new-brand#top` through the local server (`node server.mjs 3001` from the repository root).

This is a separate static design preview. The original website in the repository root is unchanged. No build step is required.

Visual thesis: full-width quarry photography, a graphite and forest-green palette, generous display typography, and mineral-gold topographic linework, inspired by the client's landscape reference. `brand.css` applies this art direction over the existing component styles.

Content: concise hero, six services, project process, company and contact.

Motion: the hero is visible immediately for fast LCP, section content reveals on scroll, and interactive elements use restrained hover transitions. The geological block section was removed. The original maptrace remains in `terrain.js` for reference and is not loaded.

The theme toggle uses `litologik-theme` and retains compatibility with earlier saved preferences. Contact emails use `info@litologik.hr`.

The inquiry form prepares an email in the visitor's mail app. It does not claim to send mail through a backend.

Assets:
- Litologik circular logo supplied by the client. The header uses `assets/litologik-brand.webp`, displaying only the circular symbol beside the existing live-text company name. The favicon uses `assets/litologik-symbol-64.png`.
- Terrain adapted from the existing maptrace sketch, originally by Kjetil Golid: https://github.com/kgolid/p5ycho/tree/master/trace-perspective
- Quarry photograph: Dion Beetson, Unsplash. Illustrative image, not a company project reference. https://unsplash.com/photos/oF7hh97lVqA (Unsplash License).
- Icons: Lucide, ISC license, selected icon nodes from the installed package.
- p5.js 0.5.10: existing sketch dependency, LGPL-2.1.
- Montserrat: Google Fonts, SIL Open Font License.

Performance assets: the quarry photograph now uses a 2560x1347 copy of the same Dion Beetson image, retrieved from https://geostratconsulting.co.za/wp-content/uploads/2022/09/dion-beetson-oF7hh97lVqA-unsplash-scaled.jpg. Sharp produces 1280px mobile and 2560px desktop AVIF (quality 60) and WebP (quality 82) variants, plus a JPEG fallback. Matching media queries preload only the relevant AVIF. The previous 1600px files remain unused. FontTools converts the four original TTF weights to WOFF2 with Latin and Latin Extended coverage (`U+0000-024F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF`), retaining Croatian characters and layout features.

Run `node build.mjs` from the repository root before production testing. Vercel serves the generated `dist` directory, with both stylesheets inlined in document order to avoid render-blocking CSS requests. Source preview remains usable without a build. The page allows indexing after publication.

`check-rework.cjs` performs the current browser checks with Playwright and installed Chrome. It checks responsive layouts, hero imagery, logos, services, dialog focus, mobile navigation and theme persistence. Screenshots are written to the operating system's temporary directory. Run with dependencies available in `NODE_PATH`:

```sh
node preview/check-rework.cjs
```

To test the published build in PowerShell:

```powershell
node build.mjs
$env:BASE_URL='http://127.0.0.1:3001/dist/'
$env:EXPECT_INLINE_CSS='1'
node preview/check-rework.cjs
```
