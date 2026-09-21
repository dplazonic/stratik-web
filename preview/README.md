# Stratik local redesign

Visit `http://127.0.0.1:3001/preview/?v=new-brand#top` through the local server (`node server.mjs 3001` from the repository root).

This is a separate static design preview. The original website in the repository root is unchanged. No build step is required.

Visual thesis: full-width quarry photography, a graphite and forest-green palette, generous display typography, and mineral-gold topographic linework, inspired by the client's landscape reference. `brand.css` applies this art direction over the existing component styles.

Content: concise hero, six services, project process, company and contact.

Motion: the hero is visible immediately for fast LCP, section content reveals on scroll, and interactive elements use restrained hover transitions. The geological block section was removed. The original maptrace remains in `terrain.js` for reference and is not loaded.

Dark is the initial theme for this concept. The light-mode toggle persists a separate `stratik-rework-theme` preference.

The inquiry form prepares an email in the visitor's mail app. It does not claim to send mail through a backend.

Assets:
- Transparent Stratik logos and the Zagreb stamp, supplied by the client on September 14, 2026. The page uses lossless WebP derivatives (324px logos, 820px stamp, 1000px watermark), plus 64px and 180px PNG icons. Original artwork is preserved.
- Terrain adapted from the existing maptrace sketch, originally by Kjetil Golid: https://github.com/kgolid/p5ycho/tree/master/trace-perspective
- Quarry photograph: Dion Beetson, Unsplash. Illustrative image, not a Stratik project reference. https://unsplash.com/photos/oF7hh97lVqA (Unsplash License).
- Icons: Lucide, ISC license, selected icon nodes from the installed package.
- p5.js 0.5.10: existing sketch dependency, LGPL-2.1.
- Montserrat: Google Fonts, SIL Open Font License.

Performance assets: the original 1600x842 quarry JPEG is preserved as fallback, with AVIF (quality 35, effort 7) and WebP (quality 60, effort 6) derivatives made with Sharp. FontTools converts the four original TTF weights to WOFF2 with Latin and Latin Extended coverage (`U+0000-024F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF`), retaining Croatian characters and layout features. The AVIF and medium font are preloaded; other formats are not downloaded by supporting browsers.

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
