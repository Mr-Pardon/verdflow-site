import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const product = fileURLToPath(new URL('../../VerdFlow/apps/studio/', import.meta.url));
const base = 'http://127.0.0.1:4173';
const out = new URL('../.work/input-guide-ui/', import.meta.url);
const media = new URL('../docs/public/media/', import.meta.url);
await mkdir(out, { recursive: true });
let server, browser;
const errors = [], requests = [];
try {
  let reachable = false;
  try { reachable = (await fetch(base)).ok; } catch { /* Use an isolated component host. */ }
  if (!reachable) {
    server = spawn(process.execPath, [`${product}node_modules/vite/bin/vite.js`, '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
      { cwd: product, windowsHide: true, stdio: 'ignore' });
    for (let attempt = 0; attempt < 80 && !reachable; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      try { reachable = (await fetch(base)).ok; } catch { /* Wait for Vite. */ }
    }
    assert.ok(reachable, 'Component host did not start');
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1.5 });
  await context.route('**/api/**', async route => { requests.push(route.request().url()); await route.abort(); });
  await context.route('**/__input-guide*', route => {
    const imagery = new URL(route.request().url()).searchParams.get('view') === 'imagery';
    const component = imagery ? 'DtsGeospatialCreateDialog' : 'DtsCreateDialog';
    const props = imagery
      ? { imagery: true, vectorPath: 'park-rgb.tif', elevationPath: 'park-elevation.tif', projectName: '影像种植练习', projectPath: '' }
      : { sourcePath: 'park-landscape.fbx', projectName: '模型种植练习', projectPath: '', selectionMode: 'ai_assisted', confirmationMode: 'manual', providerId: 'demo-material-service',
        providers: [{ provider_id: 'demo-material-service', display_name: '示例模型服务', default_model: 'configured-model-id' }] };
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head>
      <body><div id="fixture"></div><script type="module">
      import {createApp,h} from '/node_modules/.vite/deps/vue.js';
      import '/src/styles/tokens.css'; import '/src/styles/base.css';
      import Component from '/src/features/dts/${component}.vue';
      createApp({render:()=>h(Component,${JSON.stringify({ ...props, managementAvailable: true, busy: false, canSubmit: false, stage: 'idle', errorMessage: null })})}).mount('#fixture');
      </script></body></html>` });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  for (const view of ['fbx', 'imagery']) {
    await page.goto(`${base}/__input-guide?view=${view}`);
    await page.getByRole('heading', { name: '创建种植项目' }).waitFor();
    if (view === 'fbx') {
      assert.equal(await page.getByRole('radio', { name: /AI 辅助选择/ }).isChecked(), true);
      assert.equal(await page.getByRole('checkbox').isChecked(), false);
      assert.equal(await page.locator('select').inputValue(), 'demo-material-service');
    }
    await page.evaluate(() => document.fonts.ready);
    const png = fileURLToPath(new URL(`studio-create-${view}.png`, out));
    await page.getByRole('dialog').screenshot({ path: png });
    await sharp(png).webp({ quality: 94 }).toFile(fileURLToPath(new URL(`studio-create-${view}.webp`, media)));
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(JSON.stringify({ captured: 2, productWrites: 0, apiRequests: 0, sceneCommands: 0 }));
} finally {
  await browser?.close();
  if (server) {
    const ended = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await ended;
  }
}
