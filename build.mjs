import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('./preview/', import.meta.url);
const output = new URL('./dist/', import.meta.url);
let html = await readFile(new URL('index.html', source), 'utf8');

// Keep editable stylesheets in preview; ship their ordered contents with the document.
for (const name of ['styles.css', 'brand.css']) {
  const link = new RegExp(`<link rel="stylesheet" href="${name.replace('.', '\\.')}\\?[^\"]+" />`);
  if (!link.test(html)) throw new Error(`Missing stylesheet link: ${name}`);
  const css = await readFile(new URL(name, source), 'utf8');
  html = html.replace(link, () => `<style data-source="${name}">\n${css}\n    </style>`);
}

await mkdir(new URL('assets/', output), { recursive: true });
await copyFile(new URL('site.js', source), new URL('site.js', output));

// Only publish assets referenced by the page and its inlined styles, plus licenses.
const assets = new Set([...html.matchAll(/assets\/[\w.-]+/g)].map(match => match[0]));
for (const license of ['LICENSE-lucide.txt', 'LICENSE-montserrat.txt']) assets.add(`assets/${license}`);
for (const asset of assets) {
  await copyFile(new URL(asset, source), new URL(asset, output));
}
await writeFile(new URL('index.html', output), html);
console.log(`Built ${fileURLToPath(output)} with ${assets.size} assets and inline CSS.`);
