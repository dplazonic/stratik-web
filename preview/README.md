# Stratik local redesign

Open `index.html` or visit `http://127.0.0.1:3001/preview/` through the existing local server.

This is a separate static design preview. The original website in the repository root is unchanged. No build step is required.

Visual thesis: precise geological linework, generous white space, forest-green typography and an understated mineral-gold accent.

Content: concise hero, six services, areas of expertise, project process, company and contact.

Motion: the generative maptrace terrain draws itself once, section content reveals on scroll, and interactive elements use restrained hover transitions. Rendering pauses outside the viewport and mobile does not load the terrain dependencies. Reduced-motion settings show the finished terrain immediately.

The inquiry form prepares an email in the visitor's mail app. It does not claim to send mail through a backend.

Assets:
- Existing Stratik logo assets, supplied by the client.
- Terrain adapted from the existing maptrace sketch, originally by Kjetil Golid: https://github.com/kgolid/p5ycho/tree/master/trace-perspective
- Quarry photograph: Dion Beetson, Unsplash. Illustrative image, not a Stratik project reference. https://unsplash.com/photos/oF7hh97lVqA (Unsplash License).
- Icons: Lucide, ISC license, selected icon nodes from the installed package.
- p5.js 0.5.10: existing sketch dependency, LGPL-2.1.
- Montserrat: Google Fonts, SIL Open Font License.

Preview pages deliberately use `noindex` until approved for publication.

`check.cjs` performs browser checks with Playwright and installed Chrome. It checks responsive layouts, local assets, terrain pixels, dialog focus, mobile navigation, theme persistence and reduced motion. Screenshots are written to the operating system's temporary directory. Run with Playwright available in `NODE_PATH`:

```sh
node preview/check.cjs
```
