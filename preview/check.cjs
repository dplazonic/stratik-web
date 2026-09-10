const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

(async () => {
  const output = path.join(os.tmpdir(), 'stratik-preview-check');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await page.goto('http://127.0.0.1:3001/preview/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('#terrain').dataset.state === 'complete', { timeout: 25000 });
  await page.screenshot({ path: path.join(output, 'desktop.png') });
  const canvasImage = await page.locator('#terrain canvas').screenshot();
  const { data, info } = await sharp(canvasImage).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const terrain = { pixels: 0, frame: await page.locator('#terrain').getAttribute('data-frame') };
  for (let i = 0; i < data.length; i += info.channels) {
    if (Math.abs(data[i] - 245) + Math.abs(data[i + 1] - 246) + Math.abs(data[i + 2] - 243) > 35) terrain.pixels++;
  }
  assert(terrain.pixels > 10000, 'Terrain should contain visible drawn pixels');
  console.log('Terrain:', terrain);
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(output, 'full-desktop.png'), fullPage: true });
  await page.locator('#usluge').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'services.png') });
  await page.locator('[data-inquiry="Elaborat o rezervama"]').click();
  assert(await page.locator('#inquiry-dialog').evaluate(el => el.open));
  assert.equal(await page.locator('select[name=service]').inputValue(), 'Elaborat o rezervama');
  assert(await page.locator('input[name=name]').evaluate(el => el === document.activeElement));
  await page.screenshot({ path: path.join(output, 'dialog.png') });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#inquiry-dialog').evaluate(el => el.open), false);
  assert(await page.locator('[data-inquiry="Elaborat o rezervama"]').evaluate(el => el === document.activeElement));
  const secondStep = page.locator('.process-steps details').nth(1);
  await secondStep.locator('summary').click();
  assert(await secondStep.evaluate(el => el.open));
  assert.equal(await page.locator('.process-steps details[open]').count(), 1);
  const layouts = [];
  for (const [width, height] of [[1920,1000], [1440,1000], [1440,800], [1024,768], [768,1000], [390,844], [320,568]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const dimensions = await page.evaluate(() => ({
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      gridColumns: getComputedStyle(document.querySelector('.services-grid')).gridTemplateColumns,
      terrainVisible: getComputedStyle(document.querySelector('.hero-art')).display !== 'none',
      imagesLoaded: [...document.images].every(i => i.complete && i.naturalWidth > 0),
      fontLoaded: document.fonts.check('500 16px Montserrat'),
      overflowingText: [...document.querySelectorAll('h1,h2,h3,button,a,li')].filter(el => el.getClientRects().length && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).display !== 'inline').map(el => el.textContent.trim()).slice(0,10)
    }));
    layouts.push(dimensions);
    await page.screenshot({ path: path.join(output, 'viewport-' + width + '-' + height + '.png') });
    assert(dimensions.scrollWidth <= width, 'Page overflows at ' + width);
    assert(dimensions.fontLoaded, 'Local Montserrat should load');
    assert.equal(dimensions.overflowingText.length, 0, 'Text overflows at ' + width);
    assert.equal(dimensions.terrainVisible, width > 700);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-menu-toggle]').click();
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'true');
  await page.screenshot({ path: path.join(output, 'mobile-menu.png') });
  await page.locator('#mobile-nav a[href="#podrucja"]').click();
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');
  await page.locator('.header-actions [data-theme-toggle]').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('#terrain canvas').count(), 0, 'No terrain canvas should be created on mobile');
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => /p5.min.js/.test(r.name))), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('#terrain').dataset.state === 'complete', { timeout: 25000 });
  await page.screenshot({ path: path.join(output, 'dark.png') });
  const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://127.0.0.1:3001/preview/');
  await reducedPage.waitForFunction(() => document.querySelector('#terrain').dataset.state === 'complete', { timeout: 25000 });
  assert.equal(await reducedPage.locator('.reveal-ready:not(.is-visible)').count(), 0);
  const frame = await reducedPage.locator('#terrain').getAttribute('data-frame');
  await reducedPage.waitForTimeout(200);
  assert.equal(await reducedPage.locator('#terrain').getAttribute('data-frame'), frame);
  assert.deepEqual(errors, [], 'Browser should report no failed resources or script errors');
  console.log('Layouts:', JSON.stringify(layouts, null, 2));
  console.log('PASS: dialog, focus, accordion, menu, theme persistence, mobile loading, reduced motion.');
  console.log('Screenshots:', output);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
