import assert from 'node:assert/strict';
import { mkdir, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { verifyDemo } from './verify-demo.mjs';
import { verifyComparison, verifyTouchComparison } from './verify-comparison.mjs';

const base = (process.env.SITE_URL || 'http://127.0.0.1:4180/').replace(/\/?$/, '/');
const releasesUrl = 'https://github.com/Mr-Pardon/VerdFlow/releases';
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
  async function heroSpacing() {
    const { gap, remaining, viewport } = await page.locator('.home-hero').evaluate(hero => {
      const meta = hero.querySelector('.hero-meta').getBoundingClientRect();
      const scroll = hero.querySelector('.hero-scroll').getBoundingClientRect();
      const nextSection = document.querySelector('#planting-plan .section-kicker').getBoundingClientRect();
      return { gap: scroll.top - meta.bottom, remaining: innerHeight - nextSection.top, viewport: `${innerWidth}x${innerHeight}` };
    });
    assert.ok(gap >= 12, `Hero metadata overlaps the route link at ${viewport}`);
    assert.ok(remaining >= 12, `No hint of next section at ${viewport}`);
  }
  async function images() {
    await page.locator('main h1').first().waitFor();
    await page.locator('img').evaluateAll(items => items.forEach(img => img.loading = 'eager'));
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
  }
  async function homeShotFits() {
    await images();
    const compare = page.locator('.home-workbench .screenshot-compare > .reveal-surface');
    if (await compare.count()) {
      const shape = await compare.evaluate(element => ({ frame: element.getBoundingClientRect().toJSON(),
        images: [...element.querySelectorAll('img')].map(img => img.getBoundingClientRect().toJSON()) }));
      assert.ok(Math.abs(shape.frame.height - shape.frame.width * 9 / 16) < 1, 'Keep the comparison at a stable landscape ratio');
      assert.ok(shape.images.every(img => Math.abs(img.width - shape.frame.width) <= 2 && Math.abs(img.height - shape.frame.height) <= 2), 'Comparison images must fill the same frame');
      return;
    }
    const image = await page.locator('.home-workbench .shot-trigger img').evaluate(img => {
      const { width, height } = img.getBoundingClientRect();
      return { width, height, frame: img.parentElement.clientWidth, intrinsicHeight: width * img.naturalHeight / img.naturalWidth, src: img.currentSrc };
    });
    assert.ok(Math.abs(image.frame - image.width) <= 1 && Math.abs(image.height - image.intrinsicHeight) <= 1, `Homepage screenshot must fill its frame at its own aspect ratio: ${image.src}`);
  }
  const regionRoutes = [
    ['实时种植', 'live', 'live', null],
    ['模型材质提取', 'fbx', 'fbx', 'FBX 模型材质提取'],
    ['影像提取', 'imagery', 'imagery', '影像绿地提取'],
    ['SHP 导入', 'shp', 'geospatial', 'SHP 大范围区域导入'],
  ];
  async function verifyRegionRoute(index, screenshot) {
    const [label, file, route, project] = regionRoutes[index];
    const tabs = page.getByRole('tablist', { name: '确认区域的方式' });
    const tab = tabs.getByRole('tab', { name: label, exact: true });
    assert.equal(await tab.getAttribute('aria-selected'), 'true');
    const panel = page.getByRole('tabpanel', { name: label, exact: true });
    assert.equal(await panel.getAttribute('id'), await tab.getAttribute('aria-controls'));
    const image = panel.locator('.shot-trigger img');
    assert.equal(await image.getAttribute('src'), new URL(`media/home-region-${file}.webp`, base).pathname);
    assert.equal(await panel.getByRole('link').getAttribute('href'), new URL(`workflows/${route}.html`, base).pathname);
    assert.deepEqual(await panel.locator('.shot-trigger .region-project-title strong').allTextContents(), project ? [project] : []);
    assert.match(await panel.locator('figcaption').innerText(), /实拍/);
    await homeShotFits();
    assert.ok(await image.evaluate(img => img.naturalWidth === Number(img.getAttribute('width')) && img.naturalHeight === Number(img.getAttribute('height'))));
    await overflow();
    if (screenshot) await page.locator('.region-routes').screenshot({ path: fileURLToPath(new URL(`${screenshot}.png`, output)) });
  }
  async function verifyRegionRotation() {
    const preview = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    try {
      await preview.clock.install();
      await preview.goto(base);
      await preview.bringToFront();
      await preview.waitForFunction(() => document.visibilityState === 'visible');
      await preview.mouse.move(4, 100);
      await preview.getByRole('tab', { name: '确认种植区域' }).evaluate(button => button.click());
      const tabs = preview.getByRole('tablist', { name: '确认区域的方式' });
      const active = tabs.getByRole('tab', { selected: true });
      const current = () => active.textContent();
      const tick = () => preview.clock.fastForward(6100);
      const show = () => preview.locator('.region-routes').evaluate(element => {
        element.scrollIntoView({ block: 'center', behavior: 'instant' });
        // IntersectionObserver delivers separately from animation frames.
        return new Promise((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            observer.disconnect();
            reject(new Error('The route carousel did not enter the viewport'));
          }, 5000);
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.intersectionRatio < 0.25) return;
            window.clearTimeout(timeout);
            observer.disconnect();
            resolve(true);
          }, { threshold: 0.25 });
          observer.observe(element);
        });
      });

      await tick();
      assert.equal(await current(), '实时种植', 'Do not rotate offscreen');
      await show();
      for (const index of [1, 2, 3, 0]) {
        await tick();
        assert.equal(await current(), regionRoutes[index][0], 'Rotate in route order and wrap to the start');
      }

      await active.hover();
      await tick();
      assert.equal(await current(), '实时种植', 'Pause while the pointer is inside the panel');
      await preview.mouse.move(4, 100);
      await tick();
      assert.equal(await current(), '模型材质提取', 'Resume after the pointer leaves');
      await active.press('ArrowRight');
      await tick();
      assert.equal(await current(), '影像提取', 'Do not rotate after manually selecting a tab');
      const play = preview.getByRole('button', { name: '开启自动切换' });
      await play.press('Enter');
      await tick();
      assert.equal(await current(), 'SHP 导入');
      await preview.getByRole('button', { name: '暂停自动切换' }).press('Enter');
      await tick();
      assert.equal(await current(), 'SHP 导入', 'The pause button stops rotation');

      await preview.emulateMedia({ reducedMotion: 'reduce' });
      await preview.reload();
      await preview.getByRole('tab', { name: '确认种植区域' }).evaluate(button => button.click());
      await show();
      await play.waitFor();
      await tick();
      assert.equal(await current(), '实时种植', 'Reduced motion opts out of automatic rotation');
    } finally { await preview.close(); }
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
  await heroSpacing();
  assert.match(await page.locator('.hero-meta').innerText(), /1\.3\.0 用户手册/);
  assert.deepEqual(await page.locator('.site-home > section').evaluateAll(sections => sections.slice(1, 3).map(section => section.id)), ['planting-plan', 'paths']);
  assert.equal(await page.locator('.hero-scroll').getAttribute('href'), '#planting-plan');
  assert.equal(await page.locator('.VPNavBar').getByRole('link', { name: '资源中心', exact: true }).getAttribute('href'), 'https://mr-pardon.github.io/verdflow-resources/');
  const homeCards = page.locator('#home-route-track .route-card');
  assert.equal(await homeCards.count(), 4);
  assert.equal(await homeCards.nth(2).getAttribute('href'), new URL('workflows/imagery.html', base).pathname);
  assert.equal(await homeCards.nth(3).getAttribute('href'), new URL('workflows/geospatial.html', base).pathname);
  assert.ok(await page.locator('#home-route-track').evaluate(rail => rail.scrollWidth <= rail.clientWidth + 1), 'Four routes must fit side by side on a wide screen');
  assert.ok(!await page.getByRole('button', { name: '下一条路线' }).isVisible(), 'Do not show carousel controls when all routes are visible');
  assert.ok((await page.locator('.shot-trigger img').getAttribute('src')).endsWith('studio-resource-center.webp'));
  await homeShotFits();
  await page.getByRole('tab', { name: '选一套方案' }).click();
  await page.getByRole('tab', { name: '选一套方案' }).press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: '确认种植区域' }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.getByRole('link', { name: '选择种植路线', exact: true }).getAttribute('href'), '#paths');
  const regionTabs = page.getByRole('tablist', { name: '确认区域的方式' }).getByRole('tab');
  assert.deepEqual(await regionTabs.allTextContents(), regionRoutes.map(([label]) => label));
  await verifyRegionRoute(0, 'home-region-live');
  for (let index = 1; index < regionRoutes.length; index++) {
    await regionTabs.nth(index - 1).press('ArrowRight');
    assert.equal(await regionTabs.nth(index).evaluate(element => element === document.activeElement), true);
    await verifyRegionRoute(index, `home-region-${regionRoutes[index][1]}`);
  }
  const regionZoom = page.getByRole('tabpanel', { name: 'SHP 导入', exact: true }).getByRole('button', { name: /^放大截图/ });
  await regionZoom.click();
  assert.equal(await page.getByRole('dialog').locator('.region-project-title strong').innerText(), 'SHP 大范围区域导入');
  await page.keyboard.press('Escape');
  assert.equal(await regionZoom.evaluate(element => element === document.activeElement), true);
  await regionTabs.last().press('Home');
  assert.equal(await regionTabs.first().getAttribute('aria-selected'), 'true');
  await verifyRegionRotation();
  await page.getByRole('tab', { name: '确认种植区域' }).press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: '看落地效果' }).getAttribute('aria-selected'), 'true');
  assert.ok((await page.locator('.screenshot-compare .reveal-left').getAttribute('src')).endsWith('dts-planting-after.webp'));
  assert.ok((await page.locator('.screenshot-compare .reveal-right').getAttribute('src')).endsWith('dts-planting-before.webp'));
  await homeShotFits();
  assert.deepEqual(await page.locator('.screenshot-compare > .reveal-surface img').evaluateAll(images => images.map(img => [img.naturalWidth, img.naturalHeight])), [[1776, 999], [1776, 999]]);
  await verifyComparison({ page, output });
  const demoLink = page.getByRole('link', { name: '观看演示', exact: true });
  assert.equal(await demoLink.getAttribute('href'), new URL('demo.html', base).pathname);
  await demoLink.click();
  await page.getByRole('heading', { name: '看见 VerdFlow', exact: true }).waitFor();
  await verifyDemo({ page, base, shot, overflow, exercise: true });
  await page.goto(base);
  await verifyTouchComparison({ browser, base, output });
  await page.getByRole('link', { name: '开始第一次种植' }).click();
  await page.getByRole('heading', { level: 1, name: '快速开始' }).waitFor();
  await overflow(); await shot('guide-desktop');
  const routeCards = page.locator('.route-grid-detailed .route-card');
  assert.equal(await routeCards.count(), 4);
  for (const card of await routeCards.all()) {
    assert.deepEqual(await card.locator('dt').allTextContents(), ['需要准备', '完成后']);
  }
  assert.equal(await routeCards.nth(2).locator('dd').first().innerText(), '同一米制投影的地形影像与高程、有效高程覆盖');
  for (const [name, route] of [['VFS Author', 'strategy'], ['VFA Author', 'assets']]) {
    const link = page.locator('.vp-doc').getByRole('link', { name, exact: true });
    assert.equal(await link.evaluate(item => item.href), new URL(`authoring/${route}.html`, base).href);
  }
  assert.deepEqual(await page.locator('.vp-doc h2[id]').evaluateAll(items => items.slice(0, 3).map(heading => heading.id)), ['install', 'resources', 'routes']);
  for (const [link, destination, returnLink, anchor] of [
    ['查看安装与准备', 'guide/install.html', /返回第 1 步/, 'install'],
    ['获取第一套资源', 'guide/first-use.html', /返回第 2 步/, 'resources'],
  ]) {
    await page.locator('.vp-doc').getByRole('link', { name: link, exact: true }).click();
    await page.waitForURL(new URL(destination, base).href);
    if (anchor === 'install') {
      const installDownload = page.locator('.release-callout');
      await installDownload.getByRole('heading', { name: 'VerdFlow Studio', exact: true }).waitFor();
      assert.equal(await installDownload.getByRole('link', { name: /前往 GitHub Releases/ }).getAttribute('href'), releasesUrl);
      const installRows = page.locator('.vp-doc table tbody tr');
      assert.equal(await installRows.count(), 4);
      assert.deepEqual(await installRows.locator('td:first-child a').evaluateAll(links => links.map(link => link.href)), ['live', 'fbx', 'imagery', 'geospatial'].map(route => new URL(`workflows/${route}.html`, base).href));
      assert.ok(!(await installRows.first().innerText()).includes('实时连接配置'));
      assert.deepEqual(await page.locator('.vp-doc .shot-trigger img').evaluateAll(items => items.map(img => img.getAttribute('src'))), ['studio-external-runtime-settings.png', 'dts-explorer-root-folder.png', 'dts-explorer-webui-preferences.png'].map(file => new URL(`media/${file}`, base).pathname));
      await images();
      await shot('install-desktop');
    }
    await page.getByRole('link', { name: returnLink }).click();
    await page.waitForURL(new URL(`guide/start.html#${anchor}`, base).href);
  }
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
    live: ['live-workbench-session.png', 'live-explorer-panel.png', 'home-region-live.webp', 'live-region-selection.webp', 'live-mapping-v100.webp'],
    fbx: ['studio-runtime-settings.png', 'studio-create-fbx.webp', 'studio-material-classification.png'],
    geospatial: ['studio-create-geospatial.webp', 'studio-geospatial-region-selection.webp'],
    imagery: ['studio-create-imagery.webp', 'studio-imagery-extraction-review.webp', 'studio-imagery-region-selection.webp'],
    workbench: ['studio-imagery-region-selection.webp', 'studio-parameter-effect-preview.webp', 'studio-point-preview-detail.webp', 'studio-output.webp'],
  };
  for (const [workflow, expectedImages] of Object.entries(workflowImages)) {
    await page.goto(new URL(`workflows/${workflow}.html`, base).href);
    await images(); await overflow(); await shot(`${workflow}-guide-desktop`);
    const screenshots = page.locator('.manual-shot .shot-trigger img');
    const actualImages = await screenshots.evaluateAll(items => items.map(img => img.getAttribute('src')));
    assert.deepEqual(actualImages, expectedImages.map(file => new URL(`media/${file}`, base).pathname), `${workflow}: screenshot references or order changed`);
    assert.equal(await page.locator('.manual-shot figcaption').count(), expectedImages.length, `${workflow}: screenshot caption missing`);
    if (workflow === 'live') {
      const flow = page.locator('.live-configuration-flow');
      assert.deepEqual((await flow.locator('.live-flow-entry strong, .live-flow-node > strong, .live-flow-result strong, .live-flow-preview strong').allTextContents()).map(title => title.trim()), ['配置入口', '预设方案', '手动配置', '确认种植范围，开始种植', '效果示意']);
      assert.equal(await flow.locator('.live-flow-branches .live-flow-node').count(), 2);
      assert.equal(await flow.locator('.live-flow-preset').getByText('方案列表', { exact: true }).count(), 1);
      assert.equal(await flow.locator('.live-flow-fork, .live-flow-merge').count(), 2);
      assert.equal(await flow.getByRole('complementary', { name: '效果示意' }).count(), 1);
      assert.equal(await flow.locator('img').count(), 0);
      assert.ok(!(await flow.innerText()).includes('可选'));
      await flow.screenshot({ path: fileURLToPath(new URL('live-configuration-flow-desktop.png', output)) });
      const mappingTable = page.locator('.vp-doc table').filter({ hasText: '角色启用' });
      const mappingRows = mappingTable.locator('tbody tr');
      assert.deepEqual(await mappingRows.locator('td:first-child').allTextContents(), ['权重', '缩放方式', '角色启用（植被用途开关）']);
      const mappingGuide = await mappingTable.innerText();
      for (const meaning of ['随机分配比例', '自动配平到 100%', '资产默认', '固定', '随机范围', '至少启用一个用途']) assert.ok(mappingGuide.includes(meaning), `Missing live mapping explanation: ${meaning}`);
      assert.deepEqual(await page.locator('.shot-trigger img[src$="live-region-selection.webp"]').evaluate(img => [img.naturalWidth, img.naturalHeight]), [1920, 1080]);
      const liveGuide = await page.locator('.vp-doc').innerText();
      for (const step of ['本页流程：', '选择种植方案', '完成标志：', '仅选失败项', '不会擦除已种植的植被', 'Explorer 中保存工程']) assert.ok(liveGuide.includes(step), `Missing live workflow instruction: ${step}`);
      const headings = (await page.locator('.vp-doc h2, .vp-doc h3').allTextContents()).map(value => value.replaceAll('\u200b', '').trim());
      assert.ok(headings.indexOf('确认写入并保存工程') < headings.indexOf('复用选区'), 'Finish scene verification and saving before optional workflows');
      assert.equal(await page.locator('.vp-doc').getByRole('link', { name: '开始种植', exact: true }).getAttribute('href'), '#_5-调整效果并开始种植');
      const shpHelp = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: '导入 SHP 的数据要求' }) });
      assert.equal(await shpHelp.getAttribute('open'), null, 'Detailed SHP requirements should not interrupt the first planting flow');
      await shpHelp.locator('summary').press('Enter');
      assert.ok((await shpHelp.innerText()).includes('不直接接收 GeoJSON'));
      await shpHelp.locator('summary').press('Enter');
    }
    await page.locator('.manual-shot .shot-trigger').first().click();
    await page.locator('dialog[open]').waitFor();
    assert.equal(await page.locator('dialog[open] img').getAttribute('src'), actualImages[0], `${workflow}: lightbox uses a different image`);
    await page.keyboard.press('Escape');
    if (['fbx', 'geospatial', 'imagery'].includes(workflow)) {
      const guide = await page.locator('.vp-doc').innerText();
      assert.ok(guide.includes('本页流程：'), `${workflow}: missing route orientation`);
      assert.ok(guide.includes('完成标志：'), `${workflow}: missing success checkpoint`);
      assert.ok(guide.includes('在这里卡住了？'), `${workflow}: missing contextual troubleshooting`);
      if (workflow === 'fbx') {
        for (const meaning of ['按材质提取种植面', '先确定绿地对应的材质', '每一行是一种材质', '不是绿地面积', '不决定种植策略或树种', '确认并提取绿地']) assert.ok(guide.includes(meaning), `Missing FBX explanation: ${meaning}`);
        assert.match(guide, /推荐先使用 AI 辅助选择[\s\S]*模型 Provider[\s\S]*置信度[\s\S]*备选：没有 AI 服务时，手动选择/);
        assert.match(guide, /2\. 创建项目并选择识别方式[\s\S]*按材质提取种植面[\s\S]*先确定绿地对应的材质[\s\S]*推荐先使用 AI 辅助选择/);
        assert.ok(!guide.includes('不必先记住每种材质的用途'), 'Explain material extraction at the creation step, not as a prerequisite');
        assert.ok(!guide.includes('第一次建议将材质识别方式设为 手动选择'), 'FBX must recommend AI before the manual fallback');
        assert.equal(await page.locator('.vp-doc').getByRole('link', { name: '备选方式', exact: true }).getAttribute('href'), '#manual-selection');
        const fallback = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: '展开手动分类步骤' }) });
        assert.equal(await fallback.getAttribute('open'), null, 'Manual fallback should start collapsed');
        await fallback.locator('summary').press('Enter');
        assert.match(await fallback.innerText(), /找到目标材质[\s\S]*逐项分类[\s\S]*共用同一个材质/);
        await fallback.locator('summary').press('Enter');
        const configuration = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: '展开模型服务配置步骤' }) });
        assert.equal(await configuration.getAttribute('open'), null, 'Advanced model service instructions must start collapsed');
        await configuration.locator('summary').press('Enter');
        await configuration.getByText('保存配置', { exact: false }).waitFor();
        await configuration.locator('summary').press('Enter');
      }
      if (workflow === 'imagery') {
        for (const meaning of ['扩展名相同不代表内容相同', '最小区域按像素数过滤，不是平方米', '不是只让画布少显示', '细化预览还没有保存', '确认提取区域']) assert.ok(guide.includes(meaning), `Missing imagery explanation: ${meaning}`);
        assert.equal(await page.locator('.vp-doc img[src$="image.png"]').count(), 0, 'Unorganized imagery screenshot remains');
      }
      if (workflow === 'geospatial') {
        for (const meaning of ['.shp', '.shx', '.dbf', '不要只拷贝', '不能当作高程', '创建并准备区域', '高程要到输出阶段']) assert.ok(guide.includes(meaning), `Missing SHP explanation: ${meaning}`);
      }
      await page.locator('.vp-doc').getByRole('link', { name: '进入工作台种植流程', exact: true }).click();
      await page.waitForURL(new URL('workflows/workbench.html#regions', base).href);
      await page.getByRole('heading', { level: 1, name: /^工作台种植流程/ }).waitFor();
    }
    if (workflow === 'workbench') {
      assert.deepEqual(await page.locator('.vp-doc h2[id]').evaluateAll(headings => headings.slice(0, 4).map(heading => heading.id)), ['regions', 'plant', 'review', 'export']);
      const workbench = await page.locator('.vp-doc').innerText();
      for (const step of ['预设方案', '开始种植', '继续种植', '输出预览点位', '尚未开始高程采样', '生成 XML', 'Blender', '高程 TIF', '在 DTS 检查实际结果']) assert.ok(workbench.includes(step), `Missing common workbench step: ${step}`);
      for (const meaning of ['Shift', 'Ctrl', '进入种植', '不会同时安装模型', '不是已经渲染出来的三维植被', '另存为']) assert.ok(workbench.includes(meaning), `Missing first-run workbench help: ${meaning}`);
    }
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
  const strategySection = () => page.locator('.VPSidebarItem.level-0').filter({ has: page.getByRole('heading', { name: '常用策略', exact: true }) });
  assert.ok((await strategySection().getAttribute('class')).includes('collapsed'), 'Strategy navigation must start collapsed');
  await strategySection().locator(':scope > .item').press('Enter');
  assert.ok(!(await strategySection().getAttribute('class')).includes('collapsed'), 'Keyboard could not expand strategies');
  assert.equal(await strategySection().getByRole('link').count(), 5);
  assert.equal(await strategySection().getByRole('link', { name: '沿线树池种植', exact: true }).count(), 1);
  assert.equal(await strategySection().getByRole('link', { name: '通用自然聚落', exact: true }).count(), 0);
  await strategySection().getByRole('link', { name: '层次生态群落', exact: true }).click();
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
  assert.ok((await page.locator('.vp-doc').innerText()).includes('检索范围'), 'Unified catalog search instructions missing');
  assert.equal(await page.locator('.shot-trigger img[src$="studio-multi-catalog-search.webp"]').count(), 1);
  await page.goto(new URL('guide/first-use.html', base).href);
  await images(); await overflow(); await shot('first-use-desktop');
  await page.getByRole('heading', { level: 1, name: /^获取第一套资源/ }).waitFor();
  const firstUse = await page.locator('.vp-doc').innerText();
  assert.match(firstUse, /一键导入推荐资源[\s\S]*全部导入[\s\S]*设置 → 产品引导[\s\S]*侧栏左下角的\s*资源中心[\s\S]*VFS Author[\s\S]*VFA Author/);
  assert.ok(firstUse.includes('导入不等于信任'));
  assert.ok(firstUse.includes('批量信任'));
  assert.deepEqual(await page.locator('.vp-doc .shot-trigger img').evaluateAll(items => items.map(img => img.getAttribute('src'))), ['studio-recommended-resource-import.webp', 'studio-resource-center.webp'].map(file => new URL(`media/${file}`, base).pathname));
  assert.equal(await page.locator('.VPSidebar').getByRole('link', { name: '获取第一套资源', exact: true }).count(), 1);
  await page.goto(new URL('manual/concepts.html', base).href);
  const plan = page.locator('.plan-diagram');
  assert.deepEqual((await plan.locator('.plan-node strong').allTextContents()).map(value => value.trim()), ['策略', '角色', '植被搭配']);
  assert.match(await plan.locator('.plan-result').innerText(), /保存为种植方案[\s\S]*策略及版本 · 各角色的植被搭配 · 构图参数/);
  await plan.screenshot({ path: fileURLToPath(new URL('plan-diagram-desktop.png', output)) });
  await page.locator('.VPSidebar').getByRole('link', { name: 'Studio 内置资源中心', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: 'Studio 内置资源中心' }).waitFor();
  assert.match(await page.locator('.vp-doc').innerText(), /侧栏左下角的\s*资源中心/);
  await overflow(); await shot('resources-center-desktop');
  assert.match(await page.locator('.vp-doc').innerText(), /导入 VerdFlow[\s\S]*策略库[\s\S]*确认信任/);
  await page.goto(new URL('workflows/imagery.html', base).href);
  await overflow(); await shot('imagery-guide-desktop');
  assert.match(await page.locator('.vp-doc').innerText(), /单波段[\s\S]*最小区域[\s\S]*拟留白[\s\S]*确认提取区域/);
  await page.goto(new URL('workflows/live.html', base).href);
  const liveGuide = page.locator('.vp-doc');
  await liveGuide.getByRole('link', { name: '绘制路径', exact: true }).click();
  await page.waitForURL(url => decodeURIComponent(url.hash) === '#沿线种植-绘制开放折线');
  await liveGuide.getByRole('link', { name: '沿线树池种植', exact: true }).click();
  await page.getByRole('heading', { level: 1, name: '沿线树池种植' }).waitFor();
  await overflow(); await shot('strategy-path-planters-desktop');
  await page.goto(new URL('resources/strategies.html', base).href);
  await page.getByRole('heading', { level: 2, name: /^方案与策略版本兼容/ }).waitFor();
  const compatibility = await page.locator('.vp-doc').innerText();
  for (const rule of ['保存基线', '同一主版本', '不会自动改用', '仅按原精确版本匹配', '兼容复用与精确复现不同']) {
    assert.ok(compatibility.includes(rule), `Missing strategy compatibility rule: ${rule}`);
  }
  await shot('strategy-compatibility-desktop');
  await page.goto(new URL('reference/backup.html', base).href);
  await images(); await overflow(); await shot('application-updates-desktop');
  assert.ok((await page.locator('.vp-doc').innerText()).includes('重启并更新'));
  assert.ok((await page.locator('.vp-doc').innerText()).includes('只关闭实时面板不等于停止服务'));
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
  const shortHeroViewports = [[1280, 720], [820, 650]];
  for (const [width, height] of shortHeroViewports) {
    await page.setViewportSize({ width, height });
    await page.goto(base); await images(); await overflow(); await heroSpacing();
    await shot(`home-${width}x${height}`);
  }
  const layoutViewports = [[1024, 900], [900, 900], [768, 900], [390, 844], [360, 740]];
  for (const [width, height] of layoutViewports) {
    await page.setViewportSize({ width, height });
    await page.goto(base); await images(); await overflow(); await brand(); await heroSpacing();
    assert.equal(await page.locator('#home-route-track').evaluate(rail => getComputedStyle(rail).scrollbarWidth), 'none', 'Hide the route scrollbar without disabling carousel scrolling');
    await shot(`home-${width}`);
    if (width === 390) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const next = page.getByRole('button', { name: '下一条路线' });
      const previous = page.getByRole('button', { name: '上一条路线' });
      assert.equal(await previous.getAttribute('aria-disabled'), 'true');
      for (let index = 0; index < 3; index++) {
        const start = await page.locator('#home-route-track').evaluate(rail => rail.scrollLeft);
        await next.press('Enter');
        await page.waitForFunction(left => document.querySelector('#home-route-track').scrollLeft > left + 90, start);
      }
      await page.waitForFunction(() => document.querySelector('.route-controls button:last-child').getAttribute('aria-disabled') === 'true');
      const fullyVisible = await homeCards.last().evaluate(card => {
        const rect = card.getBoundingClientRect(), rail = card.parentElement.getBoundingClientRect();
        return rect.left >= rail.left - 1 && rect.right <= rail.right + 1;
      });
      assert.ok(fullyVisible, 'The final SHP route cannot be reached at 390px');
      await previous.click();
      await page.waitForFunction(() => document.querySelector('.route-controls button:last-child').getAttribute('aria-disabled') === 'false');
      for (const name of ['选一套方案', '确认种植区域', '看落地效果']) {
        await page.getByRole('tab', { name }).click();
        await homeShotFits();
        if (name === '确认种植区域') {
          await page.getByRole('tab', { name: '影像提取', exact: true }).click();
          await verifyRegionRoute(2, 'home-region-imagery-mobile');
        }
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    await verifyDemo({ page, base, shot, overflow, exercise: width === 390 });
    await page.goto(new URL('authoring/architecture.html', base).href);
    await page.locator('.workflow-architecture').waitFor();
    await overflow(); await shot(`architecture-${width}`);
    if (width === 390) {
      const menu = page.locator('.VPNavBarHamburger');
      await menu.click();
      await page.locator('.VPNavScreen').getByRole('link', { name: '快速开始', exact: true }).click();
      await page.getByRole('heading', { level: 1, name: '快速开始' }).waitFor();
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
        if (workflow !== 'live') {
          const labels = await page.locator('.vp-doc table tr > :first-child').evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width));
          assert.ok(labels.length > 0 && labels.every(width => width >= 95), `${workflow}: narrow table labels became unreadable`);
        }
        if (workflow === 'live') {
          const flow = page.getByRole('region', { name: '实时种植配置流程图' });
          assert.ok(await flow.evaluate(element => element.scrollWidth > element.clientWidth), 'Keep the full landscape flow accessible on a narrow screen');
          await flow.focus();
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(() => document.querySelector('.live-configuration-flow__scroll').scrollLeft > 0);
          await page.locator('.live-configuration-flow').screenshot({ path: fileURLToPath(new URL('live-configuration-flow-mobile.png', output)) });
        }
      }
      await page.goto(new URL('manual/effect-preview.html', base).href);
      await images(); await overflow(); await shot('effect-example-mobile');
      await page.goto(new URL('manual/concepts.html', base).href);
      const diagramPositions = await plan.locator('.plan-node').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      assert.ok(diagramPositions.length === 3 && diagramPositions[0] < diagramPositions[1] && diagramPositions[1] < diagramPositions[2], 'Mobile concept diagram must read top to bottom');
      await overflow();
      await plan.screenshot({ path: fileURLToPath(new URL('plan-diagram-mobile.png', output)) });
      for (const route of ['guide/install', 'guide/first-use', 'resources/center', 'workflows/imagery', 'strategies/path-planters', 'resources/mixes', 'resources/strategies', 'reference/backup']) {
        await page.goto(new URL(`${route}.html`, base).href);
        await images(); await overflow(); await shot(`${route.replace('/', '-')}-mobile`);
      }
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
        await strategySection().locator(':scope > .item').click();
        await strategySection().getByRole('link', { name: '草坪点景组团', exact: true }).click();
        await page.getByRole('heading', { level: 1, name: /^草坪点景组团/ }).waitFor();
        await page.waitForFunction(() => !document.querySelector('.VPSidebar')?.classList.contains('open'));
      }
    }
    await page.goto(new URL('guide/start.html', base).href); await overflow();
    if (width === 390) await shot('guide-mobile');
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
  const downloadCallout = page.locator('.release-callout');
  const external = await downloadCallout.locator('a[href*="github.com"]').count();
  assert.equal(external, 1, 'Expected exactly one release navigation link');
  assert.equal(await downloadCallout.getByRole('heading', { name: 'VerdFlow Studio', exact: true }).count(), 1);
  assert.equal(await downloadCallout.getByRole('link', { name: /前往 GitHub Releases/ }).getAttribute('href'), releasesUrl);
  assert.deepEqual(broken, []);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, base, articles: pageCount, viewports: [[1440, 1000], ...layoutViewports], shortHeroViewports, tested: ['navigation', 'all articles', 'internal page and section links', 'brand and favicons', 'licensing notices and canonical text', 'images', 'demo lazy loading, keyboard playback, seek, decoded frame, fullscreen, replay and retry', 'workflow image references and order', 'first-use and recommended imports', 'route cards and DTS verification', 'strategy compatibility rules', 'unified catalog search', 'application update instructions', 'collapsible strategy navigation', 'strategy diagrams', 'parameter preset illustrations', 'keyboard tabs', 'lightbox', 'local search', 'mobile menu', 'sidebar', 'overflow and hero spacing', '404 recovery', 'honest downloads'], output: output.pathname }, null, 2));
} finally { await browser.close(); }
