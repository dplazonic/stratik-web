const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3001/dist/';
const out = path.join(process.env.TEMP, 'geodraft-office-review');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    for (const [width, height] of [[375,812],[390,844],[430,932],[768,1024],[1024,768],[1440,1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').innerText(), 'GEOdraft');
      assert.deepEqual(await page.locator('main>section').evaluateAll(els => els.map(el => el.id)), ['hero','usluge','o-nama','kontakt']);
      assert.deepEqual(await page.locator('.service h3').allTextContents(), ['Rudarski projekti','Elaborati rezervi','Geološka istraživanja','Stručna podrška']);
      assert.equal(await page.locator('dialog, .process-steps, [data-inquiry]').count(), 0);
      assert.equal(await page.locator('.hero .button').getAttribute('href'), '#kontakt');
      assert.equal(await page.locator('.email-link').getAttribute('href'), 'mailto:info@geodraft.hr');
      const geometry = await page.evaluate(() => {
        const slider = document.querySelector('.services-grid');
        const cards = [...slider.children].map(el => el.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          hero: document.querySelector('.hero').getBoundingClientRect().height / innerHeight,
          peek: innerWidth - cards[1].left,
          cardRatio: cards[0].width / innerWidth,
          sliderOverflow: slider.scrollWidth > slider.clientWidth,
          snap: getComputedStyle(slider).scrollSnapType,
          textOverflow: [...document.querySelectorAll('h1,h2,h3,p,a')].filter(el => el.getClientRects().length && getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent),
          brokenLinks: [...document.querySelectorAll('a[href^="#"]')].filter(el => !document.querySelector(el.hash)).map(el => el.hash),
          heroImage: document.querySelector('.hero-landscape').complete && document.querySelector('.hero-landscape').naturalWidth > 0,
          height: document.documentElement.scrollHeight,
        };
      });
      assert(!geometry.overflow, 'Page overflow at ' + width);
      assert.deepEqual(geometry.textOverflow, [], 'Text overflow at ' + width);
      assert.deepEqual(geometry.brokenLinks, []);
      assert(geometry.hero <= .80 && geometry.hero >= .65, 'Hero height at ' + width);
      assert(geometry.heroImage);
      const slider = page.locator('.services-grid');
      if (width < 768) {
        assert(geometry.sliderOverflow);
        assert.equal(geometry.snap, 'x mandatory');
        assert(geometry.peek > 8, 'Next card must peek at ' + width);
        assert(geometry.cardRatio >= .82 && geometry.cardRatio <= .88);
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('.services-grid').scrollLeft > 250);
        await page.keyboard.press('End');
        await page.waitForFunction(() => {
          const el = document.querySelector('.services-grid');
          return Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) < 2;
        });
        await page.keyboard.press('Home');
        await page.waitForFunction(() => document.querySelector('.services-grid').scrollLeft < 2);
        const bounds = await slider.boundingBox();
        await page.mouse.move(bounds.x + width * .75, bounds.y + 100);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 30, bounds.y + 100, { steps: 12 });
        await page.mouse.up();
        await page.waitForFunction(() => document.querySelector('.services-grid').scrollLeft > 250);
        await page.keyboard.press('Home');
        await page.locator('[data-menu-toggle]').click();
        assert(await page.locator('#mobile-nav').isVisible());
        await page.locator('#mobile-nav a[href="#kontakt"]').click();
        assert(!(await page.locator('#mobile-nav').isVisible()));
        const contactTop = await page.locator('#kontakt').evaluate(el => el.getBoundingClientRect().top);
        assert(contactTop >= 65, 'Anchor behind header');
        await page.locator('[data-menu-toggle]').click();
        await page.keyboard.press('Escape');
        assert(await page.locator('[data-menu-toggle]').evaluate(el => el === document.activeElement));
      } else {
        assert(!geometry.sliderOverflow, 'Desktop must be grid');
        assert.equal(await slider.getAttribute('tabindex'), '-1');
        await page.locator('.desktop-nav a[href="#o-nama"]').click();
        assert((await page.locator('#o-nama').boundingBox()).y >= 80);
      }
      await page.evaluate(() => { document.activeElement.blur(); scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: path.join(out, 'page-' + width + '.png'), fullPage: true });
      console.log(width, JSON.stringify(geometry));
      if (width === 390) {
        await page.locator('[data-theme-toggle]').click();
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
        assert.equal(await page.locator('.theme-sun').evaluate(el => getComputedStyle(el).opacity), '1');
        await page.screenshot({ path: path.join(out, 'page-dark.png'), fullPage: true });
      }
      await page.close();
    }
    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await touch.goto(baseUrl);
    await touch.locator('#usluge').scrollIntoViewIfNeeded();
    const track = await touch.locator('.services-grid').boundingBox();
    const cdp = await touch.context().newCDPSession(touch);
    const y = Math.min(track.y + 110, 650);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y }] });
    for (let x = 310; x >= 50; x -= 20) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.waitForFunction(() => document.querySelector('.services-grid').scrollLeft > 250);
    console.log('PASS real touch swipe');
    await touch.close();
    const noScript = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await noScript.goto(baseUrl);
    assert(await noScript.locator('.desktop-nav a[href="#kontakt"]').isVisible());
    assert.equal(await noScript.locator('.service').count(), 4);
    assert.equal(await noScript.locator('.services-grid').evaluate(el => getComputedStyle(el).scrollSnapType), 'x mandatory');
    await noScript.close();
    assert.deepEqual(errors, []);
    console.log('PASS responsive layout, keyboard/mouse/touch slider, menu, anchors, themes and no-JS content.', out);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
