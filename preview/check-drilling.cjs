const { chromium } = require('playwright');
const sharp = require('sharp');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const out=path.join(process.env.TEMP,'stratik-drilling-review');
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
    await page.goto('http://127.0.0.1:3001/preview/');
    await page.locator('#podrucja').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('#terrain').dataset.phase==='ready');
    const before=await page.locator('#terrain canvas').screenshot();
    await page.waitForFunction(()=>+document.querySelector('#terrain').dataset.boreDepth>1.3);
    await page.locator('[data-geology-pause]').click();
    const depth=await page.locator('#terrain').getAttribute('data-bore-depth');
    const frame=await page.locator('#terrain').getAttribute('data-frame');
    await page.screenshot({path:path.join(out,'drilling-dark.png')});
    const middle=await page.locator('#terrain canvas').screenshot();
    const a=await sharp(before).raw().toBuffer(),b=await sharp(middle).raw().toBuffer();
    let changed=0;for(let i=0;i<a.length;i++) if(Math.abs(a[i]-b[i])>15)changed++;
    assert(changed>1000,'The deepening bore should visibly change the rendered pixels');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#terrain').getAttribute('data-frame'),frame);
    assert.equal(await page.locator('#terrain').getAttribute('data-bore-depth'),depth);
    await page.locator('[data-geology-pause]').click();
    await page.waitForFunction(()=>document.querySelector('#terrain').dataset.state==='complete');
    await page.screenshot({path:path.join(out,'completed-dark.png')});
    assert(+await page.locator('#terrain').getAttribute('data-bore-depth')>2.3);
    const complete=await page.locator('#terrain canvas').screenshot();
    await page.waitForTimeout(1200);
    assert(!complete.equals(await page.locator('#terrain canvas').screenshot()),'Rotation resumes after drilling');
    await page.locator('[data-geology-replay]').click();
    assert.equal(await page.locator('#terrain').getAttribute('data-phase'),'forming');
    assert.equal(await page.locator('#terrain').getAttribute('data-bore-depth'),'0');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('#terrain').dataset.state==='complete');
    assert.equal(await page.locator('.geology-controls').isVisible(),false);
    await page.locator('[data-theme-toggle]').click();
    for(const width of [1920,768,390]) {
      await page.setViewportSize({width,height:1000});
      await page.locator('#podrucja').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`completed-light-${width}.png`)});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('.geology-art').isVisible(),width>700);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: visible drilling, persistent bore, pause, replay, rotation, reduced motion, themes and responsive layout.',out);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
