# Stratik web

Static website for Stratik d.o.o.

## Deploy on Vercel

This is a static site with a dependency-free Node.js build. Connect the GitHub repository to Vercel:

- Framework preset: Other
- Build command: `node build.mjs`
- Output directory: `dist` (both settings are in `vercel.json`)

Edit `preview/index.html`, `preview/styles.css` and `preview/brand.css`. Run `node build.mjs` to create the published `dist/index.html` with inline CSS and optimized assets. The repository-root `index.html` is the previous version.

Serve the repository locally and open `/dist/` to test the production build. Browser checks support `BASE_URL` and `EXPECT_INLINE_CSS=1`; see `preview/README.md`.
