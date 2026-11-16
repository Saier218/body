// End-to-end check of the built app (apps/app/dist) in headless Chromium with a phone-sized touch screen.
// It drives the real page the way a user would and fails on any broken step.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const dist = path.resolve(__dirname, '../../apps/app/dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (file.endsWith(path.sep)) file += 'index.html';
  if (!file.startsWith(dist) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const shots = process.argv[2]; let failed = false;
  const check = (name, ok, extra) => { if (!ok) failed = true; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? ': ' + extra : '')); };
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'zh-CN' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => /meshes/.test(document.getElementById('diag').textContent), { timeout: 60000 });
    const title = () => page.textContent('#title');
    check('model loads and prompt is shown in Chinese', (await title()) === '点一下任意结构', await page.textContent('#diag'));
    const box = await page.locator('#gl').boundingBox();
    check('canvas fills the width', Math.round(box.width) === 390, `${box.width}x${box.height}`);
    // find a spot that hits a structure by tapping a small grid until the title changes
    let hit = null;
    for (const fy of [0.5, 0.35, 0.65, 0.8]) { for (const fx of [0.5, 0.4, 0.6]) {
      await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(120);
      if ((await title()) !== '点一下任意结构') { hit = [fx, fy]; break; }
    } if (hit) break; }
    check('tapping a structure shows its name', !!hit, await title());
    check('region line is shown', /所在分区/.test(await page.textContent('#subtitle')), await page.textContent('#subtitle'));
    check('back button appears after focusing a region', await page.isVisible('#back'));
    await page.waitForTimeout(500);
    if (shots) await page.screenshot({ path: path.join(shots, 'app-focus.png') });
    await page.tap('#lang');
    check('language switch changes the interface', (await page.textContent('#back')) === 'Back to overview' && (await page.textContent('#layers')).includes('Bones'));
    await page.tap('#lang');
    await page.tap('#layers [data-kind="muscle"]');
    check('layer toggle reflects state', (await page.getAttribute('#layers [data-kind="muscle"]', 'aria-pressed')) === 'false');
    await page.waitForTimeout(200);
    if (shots) await page.screenshot({ path: path.join(shots, 'app-no-muscle.png') });
    await page.tap('#layers [data-kind="muscle"]');
    await page.tap('#back');
    check('back returns to the overview', (await title()) === '点一下任意结构' && !(await page.isVisible('#back')));
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const b2 = await page.locator('#gl').boundingBox();
    const buf = await page.evaluate(() => { const c = document.getElementById('gl'); return [c.width, c.height]; });
    check('rotation resizes the drawing buffer', buf[0] === Math.round(b2.width) * 2 && buf[1] === Math.round(b2.height) * 2, `${buf} for ${b2.width}x${b2.height}`);
    const sizes = await page.evaluate(() => [...document.querySelectorAll('.chip,.btn:not([hidden])')].map((e) => e.getBoundingClientRect().height));
    check('touch targets are at least 44px tall', sizes.every((h) => h >= 44), sizes.join(','));
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { failed = true; console.log('ERROR', e.message); }
  finally { await browser.close(); server.close(); console.log(failed ? 'APP TEST FAILED' : 'APP TEST PASSED'); process.exit(failed ? 1 : 0); }
});
