import assert from 'node:assert/strict';
import { mkdir, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { verifyDemo } from './verify-demo.mjs';

const base = (process.env.SITE_URL || 'http://127.0.0.1:4180/').replace(/\/?$/, '/');
const output = new URL('../verification/', import.meta.url);
await mkdir(output, { recursive: true });
const channel = process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
const browser = await chromium.launch({ channel, headless: true });
const errors = [];
const broken = [];
const destinations = new Map();
const localLinks = [];
let pageCount = 0;
async function pages(dir, prefix = '') {
  const items = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory() && entry.name !== 'public') items.push(...await pages(new URL(`${entry.name}/`, dir), `${prefix}${entry.name}/`));
    else if (entry.name.endsWith('.md') && !['index.md', '404.md'].includes(entry.name)) items.push(`${prefix}${entry.name.replace('.md', '.html')}`);
  }
  return items;
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) broken.push(`${response.status()} ${response.url()}`); });
  const shot = async name => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)), fullPage: true });
  async function overflow() {
    const value = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(value.scroll <= value.width + 1, `Overflow: ${JSON.stringify(value)} ${page.url()}`);
  }
  async function images() {
    await page.locator('main h1').first().waitFor();
    await page.locator('img').evaluateAll(items => items.forEach(img => img.loading = 'eager'));
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
  }
  async function collectLinks() {
    const snapshot = await page.evaluate(() => ({
      ids: [...document.querySelectorAll('[id]')].map(element => element.id),
      links: [...document.querySelectorAll('a[href]')].map(link => link.href),
    }));
    destinations.set(new URL(page.url()).pathname, new Set(snapshot.ids));
    for (const href of snapshot.links) {
      const target = new URL(href);
      if (target.origin === new URL(base).origin) localLinks.push({ from: page.url(), target });
    }
  }
  async function brand() {
    const link = page.locator('.VPNavBarTitle').getByRole('link', { name: 'VerdFlow', exact: true });
    assert.equal(await link.count(), 1, 'Logo must remain an accessible home link');
    assert.equal(await link.getAttribute('href'), new URL(base).pathname, 'Logo home link lost deployment base');
    const logo = link.locator('img');
    assert.equal(await logo.getAttribute('src'), new URL('media/verdflow-logo-light.png', base).pathname);
    const bounds = await logo.boundingBox();
    assert.ok(bounds.width >= 150 && bounds.width <= 180 && bounds.height >= 30 && bounds.height <= 36, 'Wordmark is distorted or incorrectly sized');
    assert.equal((await link.innerText()).trim(), '', 'Wordmark must not duplicate the site title');
    const licenseLink = page.locator('.VPFooter').getByRole('link', { name: '许可与署名', exact: true });
    assert.equal(await licenseLink.getAttribute('href'), new URL('license.html', base).pathname, 'Footer license link lost deployment base');
  }
  await page.goto(base);
  await page.getByRole('heading', { level: 1, name: /VerdFlow/ }).waitFor();
  await images(); await overflow(); await brand(); await shot('home-desktop');
  await collectLinks();
  for (const [rel, file, size] of [
    ['icon', 'verdflow-icon-32.png', '32x32'],
    ['apple-touch-icon', 'verdflow-apple-touch-icon.png', '180x180'],
  ]) {
    const icon = page.locator(`head link[rel="${rel}"]`);
    const href = new URL(`media/${file}`, base);
    assert.equal(await icon.getAttribute('href'), href.pathname, `${rel}: incorrect deployment base`);
    assert.equal(await icon.getAttribute('sizes'), size);
    const response = await context.request.get(href.href);
    assert.equal(response.status(), 200, `${rel}: missing image`);
    assert.ok(response.headers()['content-type'].startsWith('image/png'), `${rel}: expected PNG`);
  }
  assert.equal(await page.locator('.hero-image-note').count(), 0, 'Removed hero note returned');
  const hero = await page.locator('.home-hero').boundingBox();
  assert.ok(hero.width >= 1438 && hero.x < 1, 'Hero is not full bleed');
  assert.equal(await page.locator('.hero-inner h1').evaluate(element => getComputedStyle(element).fontSize), '88px');
  assert.ok(hero.y + hero.height < 1000, 'No hint of next section');
  await page.getByRole('tab', { name: /配置植被搭配/ }).click();
  assert.ok((await page.locator('.shot-trigger img').getAttribute('src')).endsWith('live-mapping-v031.webp'));
  await page.getByRole('tab', { name: /配置植被搭配/ }).press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: /调整效果与预览/ }).getAttribute('aria-selected'), 'true');
  assert.ok((await page.locator('.shot-trigger img').getAttribute('src')).endsWith('studio-point-preview-overview.png'), 'Renamed home preview reference missing');
  assert.ok((await page.locator('.manual-shot figcaption').innerText()).includes('用户提供'), 'Real screenshot mislabeled as synthetic');
  await page.locator('.shot-trigger').click();
  await page.locator('dialog[open]').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  const demoLink = page.getByRole('link', { name: '观看演示', exact: true });
  assert.equal(await demoLink.getAttribute('href'), new URL('demo.html', base).pathname);
  await demoLink.click();
  await page.getByRole('heading', { name: '看见 VerdFlow', exact: true }).waitFor();
  await verifyDemo({ page, base, shot, overflow, exercise: true });
  await page.goto(base);
  await page.getByRole('link', { name: '开始第一次种植' }).click();
  await page.getByRole('heading', { level: 1, name: '选择你的上手路线' }).waitFor();
  await overflow(); await shot('guide-desktop');
  for (const route of await pages(new URL('../docs/', import.meta.url))) {
    const response = await page.goto(new URL(route, base).href);
    assert.equal(response.status(), 200, route);
    await page.locator('main h1').first().waitFor();
    assert.equal(await page.locator('h1').count(), 1, route);
    await images(); await overflow();
    await collectLinks();
    pageCount++;
  }
  for (const { from, target } of localLinks) {
    let pathname = target.pathname;
    if (pathname === new URL('index.html', base).pathname) pathname = new URL(base).pathname;
    const ids = destinations.get(pathname);
    if (pathname.includes('/media/')) continue;
    assert.ok(ids, `Internal page link not found: ${target.href} from ${from}`);
    if (target.hash) assert.ok(ids.has(decodeURIComponent(target.hash.slice(1))), `Section link not found: ${target.href} from ${from}`);
  }
  const workflowImages = {
    live: ['live-workbench-session.png', 'live-explorer-panel.png', 'live-configuration-entry.png', 'live-mapping-v031.webp'],
    fbx: ['studio-workflow-source.png', 'studio-runtime-settings.png', 'studio-material-classification.png', 'studio-region-selection.png', 'studio-effect-example-v031.webp', 'studio-point-preview.png', 'studio-xml-output.png'],
    geospatial: ['studio-workflow-source.png', 'studio-create-geospatial.webp', 'studio-region-selection.png', 'studio-effect-example-v031.webp', 'studio-point-preview.png', 'studio-xml-output.png'],
  };
  for (const [workflow, expectedImages] of Object.entries(workflowImages)) {
    await page.goto(new URL(`workflows/${workflow}.html`, base).href);
    await images(); await overflow(); await shot(`${workflow}-guide-desktop`);
    const screenshots = page.locator('.manual-shot .shot-trigger img');
    const actualImages = await screenshots.evaluateAll(items => items.map(img => img.getAttribute('src')));
    assert.deepEqual(actualImages, expectedImages.map(file => new URL(`media/${file}`, base).pathname), `${workflow}: screenshot references or order changed`);
    assert.equal(await page.locator('.manual-shot figcaption').count(), expectedImages.length, `${workflow}: screenshot caption missing`);
    await page.locator('.manual-shot .shot-trigger').first().click();
    await page.locator('dialog[open]').waitFor();
    assert.equal(await page.locator('dialog[open] img').getAttribute('src'), actualImages[0], `${workflow}: lightbox uses a different image`);
    await page.keyboard.press('Escape');
  }
  await page.goto(new URL('resources/assets.html', base).href);
  await images(); await overflow(); await shot('assets-guide-desktop');
  assert.equal(await page.locator('.manual-shot').count(), 2, 'Asset workflow illustrations missing');
  assert.ok(!(await page.locator('.vp-doc').innerText()).includes('两套版本树'), 'Removed asset paragraph returned');
  await page.getByRole('heading', { level: 2, name: /参考高度/ }).waitFor();
  await page.goto(new URL('manual/overview.html', base).href);
  const documentLicense = page.locator('.content-license');
  assert.equal(await documentLicense.count(), 1, 'Document license notice missing or duplicated');
  assert.equal(await documentLicense.getByRole('link', { name: '许可与署名', exact: true }).getAttribute('href'), new URL('license.html', base).pathname);
  const builtin = () => page.locator('.VPSidebarItem.level-0').filter({ has: page.getByRole('heading', { name: '内置策略', exact: true }) });
  assert.ok((await builtin().getAttribute('class')).includes('collapsed'), 'Built-in strategy navigation must start collapsed');
  await builtin().locator(':scope > .item').press('Enter');
  assert.ok(!(await builtin().getAttribute('class')).includes('collapsed'), 'Keyboard could not expand built-in strategies');
  assert.equal(await builtin().getByRole('link').count(), 4);
  assert.equal(await builtin().getByRole('link', { name: '通用自然聚落', exact: true }).count(), 0);
  await builtin().getByRole('link', { name: '层次生态群落', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: /^层次生态群落/ }).waitFor();
  const strategyCounts = { community: 2, lawn: 2, 'street-trees': 4 };
  for (const [strategy, count] of Object.entries(strategyCounts)) {
    await page.goto(new URL(`strategies/${strategy}.html`, base).href);
    await images(); await overflow(); await shot(`strategy-${strategy}-desktop`);
    assert.equal(await page.locator('.manual-shot').count(), count, `${strategy}: missing role diagrams`);
    await page.locator('.shot-trigger').first().click();
    await page.locator('dialog[open]').waitFor();
    await page.keyboard.press('Escape');
  }
  await page.goto(new URL('resources/mixes.html', base).href);
  await images(); await overflow(); await shot('mix-presets-desktop');
  await page.getByRole('heading', { level: 2, name: /保存方案与参数/ }).waitFor();
  assert.ok((await page.locator('.manual-shot.compact').boundingBox()).width <= 420, 'Preset dialog illustration stretched too wide');
  await page.goto(new URL('manual/effect-preview.html', base).href);
  await images(); await overflow(); await shot('effect-example-desktop');
  assert.ok((await page.locator('.shot-trigger img').getAttribute('src')).endsWith('studio-effect-example-v031.webp'));
  await page.goto(new URL('authoring/roles.html', base).href);
  await shot('roles-desktop');
  await page.goto(new URL('authoring/overview.html', base).href);
  await page.locator('.VPSidebar').getByRole('link', { name: '架构与扩展', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: /^架构与扩展/ }).waitFor();
  await page.locator('.workflow-architecture').waitFor();
  await overflow(); await shot('architecture-desktop');
  await page.locator('summary').filter({ hasText: '给开发者' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.vp-doc details[open]').count(), 1, 'Architecture explanation must be keyboard accessible');
  await page.keyboard.press('Control+k');
  const search = page.locator('.VPLocalSearchBox input');
  await search.waitFor();
  await search.fill('跨资产库');
  await page.locator('.VPLocalSearchBox .result').first().waitFor();
  await shot('search-desktop');
  await page.keyboard.press('Escape');
  for (const [width, height] of [[1024, 900], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base); await images(); await overflow(); await brand();
    await shot(`home-${width}`);
    await verifyDemo({ page, base, shot, overflow, exercise: width === 390 });
    await page.goto(new URL('authoring/architecture.html', base).href);
    await page.locator('.workflow-architecture').waitFor();
    await overflow(); await shot(`architecture-${width}`);
    if (width === 390) {
      const menu = page.locator('.VPNavBarHamburger');
      await menu.click();
      await page.locator('.VPNavScreen').getByRole('link', { name: '用户手册' }).click();
      await page.getByRole('heading', { level: 1, name: '用户手册' }).waitFor();
      await overflow(); await shot('manual-mobile');
      await page.getByRole('button', { name: '手册目录' }).click();
      await page.locator('.VPSidebar').getByRole('link', { name: '资产库与分类', exact: true }).click();
      await page.getByRole('heading', { level: 1, name: '资产库与分类' }).waitFor();
      await page.waitForFunction(() => !document.querySelector('.VPSidebar')?.classList.contains('open'));
      await page.waitForTimeout(300);
      await overflow(); await shot('assets-mobile');
      for (const workflow of Object.keys(workflowImages)) {
        await page.goto(new URL(`workflows/${workflow}.html`, base).href);
        await images(); await overflow(); await shot(`${workflow}-guide-mobile`);
      }
      await page.goto(new URL('manual/effect-preview.html', base).href);
      await images(); await overflow(); await shot('effect-example-mobile');
      await page.goto(new URL('license.html', base).href);
      await overflow(); await shot('license-mobile');
    }
    if (width === 390 || width === 360) {
      for (const strategy of Object.keys(strategyCounts)) {
        await page.goto(new URL(`strategies/${strategy}.html`, base).href);
        await images(); await overflow();
        if (width === 390) await shot(`strategy-${strategy}-mobile`);
      }
      if (width === 390) {
        await page.goto(new URL('manual/overview.html', base).href);
        await page.getByRole('button', { name: '手册目录' }).click();
        await builtin().locator(':scope > .item').click();
        await builtin().getByRole('link', { name: '草坪点景组团', exact: true }).click();
        await page.getByRole('heading', { level: 1, name: /^草坪点景组团/ }).waitFor();
        await page.waitForFunction(() => !document.querySelector('.VPSidebar')?.classList.contains('open'));
      }
    }
    await page.goto(new URL('guide/start.html', base).href); await overflow();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL('license.html', base).href);
  await page.getByRole('heading', { level: 1, name: /^许可与署名/ }).waitFor();
  await page.locator('summary').filter({ hasText: '展开 MIT License 全文' }).click();
  const licenseText = await page.locator('.vp-doc details').innerText();
  assert.ok(licenseText.includes('Copyright (c) 2026 Mr_Pardon') && licenseText.includes('Permission is hereby granted'), 'Canonical MIT text was not included');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await overflow(); await shot('license-desktop');
  await page.goto(new URL('404.html', base).href);
  await page.getByRole('heading', { level: 1, name: '这条路径暂时没有内容。' }).waitFor();
  await page.getByRole('link', { name: '回到首页', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: /VerdFlow/ }).waitFor();
  assert.equal(new URL(page.url()).pathname, new URL(base).pathname, '404 home link lost deployment base');
  await page.goto(new URL('download.html', base).href);
  await shot('download-desktop');
  const external = await page.locator('a[href*="github.com"]').count();
  if (!process.env.EXPECT_RELEASE_URL) assert.equal(external, 0, 'Unconfigured release link');
  else {
    assert.equal(external, 1, 'Expected exactly one configured release link');
    assert.equal(await page.getByRole('link', { name: /前往 GitHub Releases/ }).getAttribute('href'), process.env.EXPECT_RELEASE_URL);
  }
  assert.deepEqual(broken, []);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, base, articles: pageCount, viewports: [1440, 1024, 390, 360], tested: ['navigation', 'all articles', 'internal page and section links', 'brand and favicons', 'licensing notices and canonical text', 'images', 'demo lazy loading, keyboard playback, seek, decoded frame, fullscreen, replay and retry', 'workflow image references and order', 'collapsible strategy navigation', 'strategy diagrams', 'parameter preset illustrations', 'keyboard tabs', 'lightbox', 'local search', 'mobile menu', 'sidebar', 'overflow', '404 recovery', 'honest downloads'], output: output.pathname }, null, 2));
} finally { await browser.close(); }
