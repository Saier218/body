// Contract test for the viewer core. Serves the repo, opens harness.html in headless Chromium
// and fails if the core needs anything a mini-program runtime does not provide.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  let code = 1;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 480 }, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
    await page.goto(`http://127.0.0.1:${port}/tools/contract-test/harness.html`);
    const shots = process.argv[2];
    if (shots) {
      await page.waitForFunction(() => window.__shot === 'focus' || document.title === 'done', { timeout: 120000 });
      await page.screenshot({ path: path.join(shots, 'focus.png') });
    }
    await page.waitForFunction(() => document.title === 'done', { timeout: 120000 });
    if (shots) await page.screenshot({ path: path.join(shots, 'overview.png') });
    const r = await page.evaluate(() => window.__result);
    for (const [name, value] of r.steps)
      console.log((value === false ? 'FAIL ' : 'ok   ') + name + (value === true || value === false ? '' : ': ' + JSON.stringify(value)));
    const extra = (r.steps.find((s) => s[0].startsWith('host canvas')) || [0, []])[1];
    const failed = !r.ok || r.steps.some((s) => s[1] === false) || extra.length > 0;
    if (!r.ok) console.log('ERROR', r.error);
    if (extra.length) console.log('FAIL core touched canvas members outside the contract:', extra.join(', '));
    console.log(failed ? 'CONTRACT TEST FAILED' : 'CONTRACT TEST PASSED');
    code = failed ? 1 : 0;
  } finally {
    await browser.close();
    server.close();
    process.exit(code);
  }
});
