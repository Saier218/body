// End-to-end check of the built app (apps/app/dist) in headless Chromium with a phone-sized touch screen.
// It drives the real page the way a user would and fails on any broken step.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '../../apps/app/dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
};
const server = http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (file.endsWith(path.sep)) file += 'index.html';
  if (!file.startsWith(dist) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const shots = process.argv[2];
  let failed = false;
  const check = (name, ok, extra) => {
    if (!ok) failed = true;
    console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? ': ' + extra : ''));
  };
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
      locale: 'zh-CN',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const title = () => page.textContent('#sheet-title');
    await page.waitForFunction(() => document.querySelector('#sheet-title')?.textContent === '点一下任意结构', { timeout: 60000 });
    check('model loads on the body tab and the prompt is in Chinese', true);
    check(
      'left hand is the default',
      (await page.getAttribute('.side', 'aria-checked')) === 'false' && (await page.textContent('.crumbs')) === '左手',
    );
    const canvasPng = () => page.locator('#gl').screenshot();
    const leftShot = await canvasPng();
    if (shots) await page.screenshot({ path: path.join(shots, 'app-left.png') });

    await page.tap('.side');
    await page.waitForTimeout(300);
    const rightShot = await canvasPng();
    check(
      'the switch shows the right hand',
      (await page.getAttribute('.side', 'aria-checked')) === 'true' &&
        (await page.textContent('.crumbs')) === '右手' &&
        !leftShot.equals(rightShot),
    );
    if (shots) await page.screenshot({ path: path.join(shots, 'app-right.png') });
    await page.tap('.side');
    await page.waitForTimeout(300);

    // Tap a grid of points over the canvas until one hits a structure. Done on the mirrored (left) hand,
    // which also proves that picking still works on mirrored geometry.
    const box = await page.locator('#gl').boundingBox();
    let hit = false;
    for (const fy of [0.5, 0.6, 0.4, 0.7, 0.3]) {
      for (const fx of [0.5, 0.45, 0.55, 0.4, 0.6]) {
        await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy);
        await page.waitForTimeout(120);
        if ((await title()) !== '点一下任意结构') {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }
    const name = await title();
    check('tapping the left hand selects a structure with a Chinese name', hit && /[一-鿿]/.test(name), name);
    const crumbs = await page.textContent('.crumbs');
    check(
      'breadcrumb shows hand › region › structure',
      crumbs.startsWith('左手') && crumbs.endsWith(name) && crumbs.length > 2 + name.length,
      crumbs,
    );
    check('region fact is shown', /所在分区/.test(await page.textContent('#sheet')));
    await page.waitForTimeout(500);
    if (shots) await page.screenshot({ path: path.join(shots, 'app-selected.png') });

    await page.tap('#crumb-group');
    check('the region crumb clears the selection', (await title()) === '点一下任意结构');
    await page.tap('#crumb-root');
    check('the hand crumb returns to the overview', (await page.textContent('.crumbs')) === '左手');

    await page.tap('#list-open');
    const rows = await page.locator('.listview .row').count();
    check('list view offers the structures of the hand without 3D', rows > 20, `${rows} rows`);
    const firstRow = page.locator('.listview .row').first();
    const rowName = await firstRow.locator('.row__title').textContent();
    await firstRow.tap();
    await page.waitForTimeout(450);
    check('choosing from the list selects that structure', (await page.isHidden('#listview')) && (await title()) === rowName, rowName);
    await page.tap('#crumb-root');

    await page.tap('.layers [data-kind="muscle"]');
    check('layer toggle reflects state', (await page.getAttribute('.layers [data-kind="muscle"]', 'aria-pressed')) === 'false');
    await page.waitForTimeout(150);
    if (shots) await page.screenshot({ path: path.join(shots, 'app-no-muscle.png') });
    await page.tap('.layers [data-kind="muscle"]');

    await page.tap('[data-tab="moves"]');
    check(
      'moves tab shows its placeholder',
      (await page.isHidden('.screen--body')) && /内容正在对照文献整理/.test(await page.textContent('.screens')),
    );
    await page.tap('[data-tab="me"]');
    check(
      'about section carries the full BodyParts3D credit',
      /The Database Center for Life Science licensed under CC Attribution 4\.0 International/.test(await page.textContent('#credit')),
    );
    await page.tap('[data-lang="en"]');
    check(
      'language switch changes the interface',
      (await page.textContent('[data-tab="body"]')) === 'Body' && /About and credits/.test(await page.textContent('.screens')),
    );
    await page.tap('[data-lang="zh"]');
    await page.tap('#bench');
    check('benchmark returns to the body tab', await page.isVisible('.screen--body'));
    await page.tap('[data-tab="me"]');
    await page.waitForFunction(() => /benchmark [\d.]+ fps/.test(document.querySelector('#diag')?.textContent || ''), { timeout: 20000 });
    check('benchmark result is recorded', true, (await page.textContent('#diag')).split('\n').pop());
    await page.tap('[data-tab="body"]');

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const b2 = await page.locator('#gl').boundingBox();
    const buf = await page.evaluate(() => {
      const c = document.getElementById('gl');
      return [c.width, c.height];
    });
    check(
      'rotation resizes the drawing buffer',
      buf[0] === Math.round(b2.width) * 2 && buf[1] === Math.round(b2.height) * 2,
      `${buf} for ${b2.width}x${b2.height}`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((e) => e.offsetParent !== null)
        .map((e) => ({
          t: (e.getAttribute('aria-label') || e.textContent).trim(),
          h: e.getBoundingClientRect().height,
          w: e.getBoundingClientRect().width,
        }))
        .filter((r) => r.h < 44 || r.w < 44),
    );
    check(
      'every visible button is at least 44x44',
      small.length === 0,
      small.map((r) => `${r.t} ${Math.round(r.w)}x${Math.round(r.h)}`).join(', ') || undefined,
    );
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } catch (e) {
    failed = true;
    console.log('ERROR', e.message);
  } finally {
    await browser.close();
    server.close();
    console.log(failed ? 'APP TEST FAILED' : 'APP TEST PASSED');
    process.exit(failed ? 1 : 0);
  }
});
