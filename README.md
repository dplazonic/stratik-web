# GEOdraft web

Static Croatian website for GEOdraft d.o.o., a mining and geological project office.

## Source

- `preview/index.html`: page content and metadata
- `preview/styles.css` and `preview/brand.css`: layout, typography and themes
- `preview/site.js`: navigation, theme toggle and image/service interactions
- `preview/assets/`: current images, logo, fonts and licenses
- `robots.txt` and `sitemap.xml`: indexing configuration for the current gir.hr domain

## Build and Local Preview

Use Node.js 18 or newer. The website and build require no npm dependencies.

```sh
node build.mjs
node serve.mjs 3001
```

Open `http://127.0.0.1:3001/`. The preview server serves only generated `dist/` files, binds to localhost and does not expose the repository or local company documents. Use another port if 3001 is occupied.

Every build recreates `dist/` and copies only page-referenced assets, license notices and indexing files. The directory is generated and ignored by Git.

## Deployment

Connect this repository to Vercel with framework preset **Other**, build command `node build.mjs` and output directory `dist`. These settings and basic security headers are in `vercel.json`.

## Browser Checks

Build isolation and local-server security checks use Node.js without dependencies:

```sh
node --test tests/build.test.mjs
```

The optional browser checks require Playwright and an installed Chrome browser. Make Playwright available through `NODE_PATH` or an existing tool runtime, start the local preview, and run:

```sh
node preview/check.cjs
```

Set `BASE_URL` to use a different preview URL. See `preview/README.md` for check coverage.

## Assets and Private Files

The GD mark, company name and public email belong to the GEOdraft website. Montserrat and Lucide license notices remain with their assets. High-resolution GD logo sources and original TTF fonts are retained for brand maintenance; production uses optimized WebP/AVIF images and WOFF2 fonts.

Credentials, `.env` files, Vercel account configuration, local design notes, generated documents, wallpapers and temporary files are ignored. Keep registration documents, client files, passwords and API keys outside this public repository. If a credential is ever committed, revoke it first; deleting a file in a later commit does not erase Git history.
