import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const product = fileURLToPath(new URL('../../VerdFlow/', import.meta.url));
const studio = `${product}apps/studio`;
const base = process.env.STUDIO_URL || 'http://127.0.0.1:4173';
const out = new URL('../.work/release-ui/', import.meta.url);
const media = new URL('../docs/public/media/', import.meta.url);
await mkdir(out, { recursive: true });
// Only parse a checked-in declaration; no generator, service or scene is executed.
const declaration = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c',
  'import json,pathlib,sys,yaml; print(json.dumps(yaml.safe_load((pathlib.Path(sys.argv[1])/"strategy-packs/layered-ecological-community-v2/strategy.yaml").read_text(encoding="utf-8")),ensure_ascii=True))',
  product], { encoding: 'utf8' }));
const presentation = declaration.extensions.role_presentation;
const roles = declaration.roles.map(role => {
  const group = presentation.groups.find(item => item.role_keys.includes(role.role_key));
  return { ...role, guide: { group_id: group.id, group_order: group.order ?? presentation.groups.indexOf(group),
    group_name: group.name, group_description: group.description, diagram: group.diagram,
    ...presentation.roles[role.role_key] } };
});
const catalogs = ['通用植被库', '庭院补充库'].map((display_name, index) => ({
  catalog_id: `demo-${index}`, display_name, target_type: 'dts', provider_id: 'dts.static-mesh',
}));
const assets = ['地被草坪', '冬青', '矮松', '橡木', '榆树', '麦冬', '绣球', '细叶芒'].map((display_name, index) => ({
  asset_id: `demo-plant-${index}`, display_name, source_catalog_name: catalogs[index < 5 ? 0 : 1].display_name,
  catalog_id: catalogs[index < 5 ? 0 : 1].catalog_id,
}));
const serialize = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const source = path => `/@fs/${product.replaceAll('\\', '/')}${path}`;
let server;
let browser;
const blocked = [], errors = [];
try {
  let reachable = false;
  try { reachable = (await fetch(base)).ok; } catch { /* Start an isolated static Vite host if needed. */ }
  if (!reachable) {
    assert.equal(Boolean(process.env.STUDIO_URL), false, 'Start the configured Studio Vite before capturing');
    server = spawn(process.execPath, [`${studio}/node_modules/vite/bin/vite.js`, '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: studio, windowsHide: true, stdio: 'ignore' });
    server.on('error', error => errors.push(error.message));
    for (let attempt = 0; attempt < 80 && !reachable; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      try { reachable = (await fetch(base)).ok; } catch { /* Wait for the owned development host. */ }
    }
    assert.ok(reachable, 'Isolated Vite host did not start');
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1060 }, deviceScaleFactor: 1.5 });
  await context.route('**/api/**', async route => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue();
    blocked.push(route.request().url());
    await route.abort();
  });
  await context.route('**/__manual-release*', route => {
    const view = new URL(route.request().url()).searchParams.get('view');
    let script, css = '';
    if (view === 'mapping') {
      css = `import '${source('apps/dts-live-webui/src/styles.css')}';`;
      script = `import Component from '${source('apps/dts-live-webui/src/components/MappingWorkspace.vue')}';
        const roles=${serialize(roles)}, catalogs=${serialize(catalogs)}, assets=${serialize(assets)};
        const candidates=assets.slice(0,2).map(asset=>({asset_id:asset.asset_id,display_name_snapshot:asset.display_name,weight:.5,
          scale:{mode:'uniform_random',min:.8,max:1.2},catalog_link:{catalog_id:asset.catalog_id,asset_id:asset.asset_id},
          target_asset_ref:{target_type:'dts',provider_id:'dts.static-mesh',locator:{model_name:'DemoPlant'}}}));
        const controller={selectedStrategy:ref({summary:{display_name:'层次生态群落',strategy_version:${serialize(declaration.strategy_version)}},roles}),
          activeRoleKey:ref(roles[0].role_key),mappingOpen:ref(true),mappingReady:ref(true),missingRoles:ref([]),
          activeRole:ref(roles[0]),activeRoleEnabled:ref(true),activeCandidates:ref(candidates),
          roleEnabledStates:ref(Object.fromEntries(roles.map(role=>[role.role_key,true]))),
          roleCandidateCounts:ref(Object.fromEntries(roles.map(role=>[role.role_key,2]))),enabledRoleCount:ref(2),
          mappingError:ref(''),profileSaveOpen:ref(false),savingProfile:ref(false),options:ref({catalogs}),
          assignments:ref({[roles[0].role_key]:{enabled:true,candidates}}),
          toggleRole(){},applyMapping(){},cancelMapping(){},setRoleEnabled(){},toggleAsset(){},thumbnailFor:()=>null,
          candidateScaleMode:()=> 'uniform_random',updateScaleMode(){},updateCandidate(){},removeCandidate(){},
          assetForCandidate:id=>assets.find(asset=>asset.asset_id===id),
          searchAssets:async request=>{const items=assets.filter(asset=>request.catalog_ids.includes(asset.catalog_id));
            return {items,total_count:items.length,offset:0,next_offset:null,revision:'demo',unavailable_catalogs:[],
              collections:catalogs.map(catalog=>({catalog_id:catalog.catalog_id,source_catalog_name:catalog.display_name,
                collection_id:'low',display_name:'低矮植被',asset_count:3}))};}};
        createApp({render:()=>h(Component,{controller})}).mount('#fixture');`;
    } else if (view === 'guide') {
      css = "import '/src/styles/base.css';";
      script = `import Component from '/src/features/onboarding/FirstUseGuide.vue';
        import {guideSteps,initialProgress} from '/src/features/onboarding/steps.ts';
        import {createRouter,createMemoryHistory} from '/node_modules/.vite/deps/vue-router.js';
        const guide={step:ref(guideSteps[0]),progress:ref(initialProgress()),page:ref(null),surface:ref('welcome'),
          activeStep:ref(null),busy:ref(false),onStepPage:ref(false),index:ref(0),pause(){},dismiss(){},start(){},go(){},setWorkflow(){}};
        createApp({render:()=>h(Component,{guide})}).use(createRouter({history:createMemoryHistory(),routes:[{path:'/',component:{render:()=>null}}]})).mount('#fixture');`;
    } else {
      css = "import '/src/styles/base.css';";
      script = `import Component from '/src/features/settings/ApplicationUpdates.vue';
        import {applicationUpdatesKey} from '/src/features/settings/useApplicationUpdates.ts';
        const updates={state:ref({currentVersion:'1.0.0',supported:true,configured:true,stage:'idle',autoCheck:true,autoDownload:true}),
          label:ref('尚未检查更新'),error:ref(null),acting:ref(false),savingPreferences:ref(false),preferences(){},run(){}};
        createApp({setup(){provide(applicationUpdatesKey,updates);return()=>h('article',{class:'updates-capture'},[h(Component)]);}}).mount('#fixture');`;
    }
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
      body{margin:0;background:#f4f7f6}.updates-capture{width:940px;margin:64px auto;background:white}
      </style></head><body><main id="fixture"></main><script type="module">
      import{createApp,h,ref,provide}from'/node_modules/.vite/deps/vue.js';import'/src/styles/tokens.css';${css}${script}</script></body></html>` });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  async function capture(selector, name) {
    await page.locator(selector).waitFor();
    await page.waitForTimeout(300);
    const png = fileURLToPath(new URL(`${name}.png`, out));
    await page.locator(selector).screenshot({ path: png });
    await sharp(png).webp({ quality: 94 }).toFile(fileURLToPath(new URL(`${name}.webp`, media)));
  }
  await page.goto(`${base}/__manual-release?view=mapping`);
  await page.locator('.vf-browser-asset').first().waitFor();
  assert.equal(await page.locator('.vf-browser-asset').count(), 5);
  await page.getByRole('button', { name: '选择检索资产库' }).click();
  await page.getByRole('button', { name: '全选', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.vf-browser-asset').length === 8);
  await capture('.vf-asset-browser', 'studio-multi-catalog-search');
  await page.getByRole('button', { name: '选择检索资产库' }).click();
  await capture('.mapping-modal', 'live-mapping-v100');
  await page.goto(`${base}/__manual-release?view=guide`);
  await capture('.guide-welcome[open]', 'studio-first-use-guide');
  await page.goto(`${base}/__manual-release?view=updates`);
  await capture('.updates-capture', 'studio-application-updates');
  assert.deepEqual(errors, []);
  assert.deepEqual(blocked, []);
  console.log(JSON.stringify({ captured: 4, productWrites: 0, sceneCommands: 0, networkApiRequests: 0 }));
} catch (error) {
  console.error(JSON.stringify({ errors, blocked }));
  throw error;
} finally {
  await browser?.close();
  if (server) {
    const ended = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await ended;
  }
}
