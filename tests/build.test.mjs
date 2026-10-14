import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function get(port, route, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: route, method }, res => {
      let body = '';
      res.on('data', data => { body += data; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('clean build publishes only current assets and indexing files', async () => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: root });
  await writeFile(new URL('../dist/obsolete-test.txt', import.meta.url), 'old build');
  execFileSync(process.execPath, ['build.mjs'], { cwd: root });
  const files = await readdir(new URL('../dist/', import.meta.url));
  assert.deepEqual(files.sort(), ['assets', 'index.html', 'robots.txt', 'site.js', 'sitemap.xml']);
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const expected = new Set([...html.matchAll(/assets\/([\w.-]+)/g)].map(match => match[1]));
  expected.add('LICENSE-lucide.txt');
  expected.add('LICENSE-montserrat.txt');
  const assets = await readdir(new URL('../dist/assets/', import.meta.url));
  assert.deepEqual(assets.sort(), [...expected].sort());
  assert(!/litologik/i.test(html));
  assert(!html.includes('<link rel="stylesheet"'));
});

test('preview serves the build without exposing repository or private paths', async () => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['serve.mjs', String(port)], { cwd: root });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
      child.on('error', reject);
      child.on('exit', code => reject(new Error(`Server exited: ${code}`)));
      child.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    });
    const home = await get(port, '/');
    assert.equal(home.status, 200);
    assert(home.body.includes('GEOdraft'));
    assert.equal(home.headers['x-content-type-options'], 'nosniff');
    assert.equal((await get(port, '/robots.txt')).status, 200);
    assert.equal((await get(port, '/sitemap.xml')).status, 200);
    assert.equal((await get(port, '/assets/quarry-ag-1672.avif')).headers['content-type'], 'image/avif');
    assert.equal((await get(port, '/', 'HEAD')).body, '');
    assert.equal((await get(port, '/', 'POST')).status, 405);
    for (const route of ['/.git/config', '/.env', '/README.md', '/output/', '/tmp/', '/../README.md', '/%2e%2e/README.md', '/%2e%2e%5cREADME.md', '/%ZZ']) {
      assert.equal((await get(port, route)).status, 404, route);
    }
  } finally {
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await stopped;
  }
});
