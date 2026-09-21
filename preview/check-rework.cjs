const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3001/preview/';

(async () => {
  const out = path.join(process.env.TEMP, 'stratik-brand-review');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2100);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('.hero-landscape').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('link[rel="preload"][as="image"]').getAttribute('fetchpriority'), 'high');
    assert(await page.locator('.hero-landscape').evaluate(el => el.currentSrc.endsWith('/quarry.avif')));
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name));
    assert.equal(resources.filter(url => url.endsWith('/quarry.avif')).length, 1);
    assert(!resources.some(url => /\.(ttf|jpg|webp)$/.test(url) && !url.includes('stratik-')));
    if (process.env.EXPECT_INLINE_CSS) assert.equal(await page.locator('link[rel="stylesheet"]').count(), 0);
    await page.screenshot({ path: path.join(out, 'hero-dark.png') });
    assert.equal(await page.locator('#podrucja, #terrain').count(), 0);
    assert.equal(await page.locator('.service-top .index').count(), 6);
    assert.deepEqual(await page.locator('.service-top .index').allTextContents(), ['01', '02', '03', '04', '05', '06']);
    await page.locator('[data-inquiry="Elaborat o rezervama"]').click();
    assert.equal(await page.locator('select[name=service]').inputValue(), 'Elaborat o rezervama');
    assert(await page.locator('input[name=name]').evaluate(el => el === document.activeElement));
    await page.screenshot({ path: path.join(out, 'dialog.png') });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#inquiry-dialog').evaluate(el => el.open), false);
    await page.locator('.process-steps details').nth(2).locator('summary').click();
    assert.equal(await page.locator('.process-steps details[open]').count(), 1);
    for (const element of await page.locator('[data-reveal]').all()) await element.scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, 'full-dark.png'), fullPage: true });
    await page.locator('[data-theme-toggle]').click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.locator('#usluge').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, 'services-light.png') });
    for (const [width, height] of [[1920,1080], [1440,800], [1024,768], [768,1024], [390,844], [320,568]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(400);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        text: [...document.querySelectorAll('h1,h2,h3,button,a,li')].filter(el => el.getClientRects().length && getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 2).map(el => el.textContent.trim()),
        heroBottom: document.querySelector('.hero').getBoundingClientRect().bottom,
        image: document.querySelector('.hero-landscape').naturalWidth,
        logos: [...document.querySelectorAll('.site-header .brand-logo')].filter(el => el.getClientRects().length).every(el => el.complete && el.naturalWidth > 0)
      }));
      assert(!state.overflow, `Horizontal overflow ${width}`);
      assert.deepEqual(state.text, [], `Text overflow ${width}`);
      assert(state.image > 0 && state.logos);
      console.log(width, height, state);
      await page.screenshot({ path: path.join(out, `hero-${width}.png`) });
    }
    await page.locator('[data-menu-toggle]').click();
    assert.equal(await page.locator('#mobile-nav').isVisible(), true);
    await page.screenshot({ path: path.join(out, 'mobile-menu.png') });
    await page.locator('#mobile-nav a[href="#kontakt"]').click();
    assert.equal(await page.locator('#mobile-nav').isVisible(), false);
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
    const noScript = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await noScript.goto(baseUrl, { waitUntil: 'networkidle' });
    const phaseBounds = await mobile.locator('.project-phases').boundingBox();
    const noScriptBounds = await noScript.locator('.project-phases').boundingBox();
    assert.equal(noScriptBounds.height, phaseBounds.height, 'Icon hydration must not resize the mobile phases');
    await noScript.close();
    assert.equal(await mobile.locator('#podrucja, #terrain').count(), 0);
    assert.equal(await mobile.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('three.module') || r.name.includes('p5.min.js'))), false);
    assert.deepEqual(errors, []);
    console.log('PASS: services, section removal, form focus, navigation, theme persistence and responsive layout.', out);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
