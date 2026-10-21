import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const product = fileURLToPath(new URL('../../VerdFlow/', import.meta.url));
const base = process.env.STUDIO_URL || 'http://127.0.0.1:4173';
const out = new URL('../.work/current-ui/', import.meta.url);
const media = new URL('../docs/public/media/', import.meta.url);
await mkdir(out, { recursive: true });
const packs = ['layered-ecological-community-v2', 'lawn-feature-groups', 'universal-street-tree'];
// Read package declarations, then run only the checked-in community's synthetic sample.
const documents = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c',
  'import json,pathlib,sys,yaml; root=pathlib.Path(sys.argv[1]); print(json.dumps([yaml.safe_load((root/"strategy-packs"/name/"strategy.yaml").read_text(encoding="utf-8")) for name in sys.argv[2:]],ensure_ascii=True))',
  product, ...packs], { encoding: 'utf8' }));
const strategies = documents.map((doc, index) => {
  const presentation = doc.extensions.role_presentation;
  const roles = doc.roles.map(role => {
    const group = presentation.groups.find(group => group.role_keys.includes(role.role_key));
    return { ...role, guide: { group_id: group.id, group_order: group.order ?? presentation.groups.indexOf(group), group_name: group.name, group_description: group.description,
      suggested_assets: presentation.roles[role.role_key].suggested_assets, note: presentation.roles[role.role_key].note, diagram: group.diagram } };
  }).sort((a, b) => a.guide.group_order - b.guide.group_order);
  return { summary: { strategy_id: doc.strategy_id, strategy_version: doc.strategy_version, display_name: doc.display_name, library_entry_id: `strategy-${index}`, package_hash: `strategy-${index}`, trust_state: 'trusted', executable: true },
    description: doc.description, roles, parameter_preview: doc.extensions.parameter_preview, generation_parameters: (doc.generation_parameters || []).map(p => ({ ...p, minimum: p.min, maximum: p.max })), default_random_seed: doc.parameters.default_seed, profiles: [] };
});
const sample = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-B', '-c', [
  'import json,pathlib,sys,yaml',
  'root=pathlib.Path(sys.argv[1])/"strategy-packs"/"layered-ecological-community-v2"',
  'sys.path.insert(0,str(root))',
  'from generator import generate',
  'doc=yaml.safe_load((root/"strategy.yaml").read_text(encoding="utf-8"))',
  'sample=doc["extensions"]["parameter_preview"]',
  'region={"id":"strategy_example","rings":[{"role":"outer","loop":[[x,y,0] for x,y in sample["boundary_xy"]]}]}',
  'result=generate({"strategy":doc,"args":{},"seed":sample["fixed_seed"],"selected_regions":[region],"excluded_role_keys":[]})',
  'roles=[r["role_key"] for r in doc["roles"]]',
  'print(json.dumps({"schema":"verdflow.strategy-example-preview","version":"1","package_hash":"strategy-0","role_keys":roles,"points":[[p["generated_position"][0],p["generated_position"][1],roles.index(p["role_key"])] for p in result["points"]]}))',
].join('\n'), product], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 }));
assert.ok(sample.points.length > 0);
const catalog = { catalog_entry_id: 'demo-catalog', catalog_id: 'demo-plants', target_type: 'dts', provider_id: 'dts.static-mesh', display_name: '示例植被资产库', generation: 1 };
const assets = ['地被草坪', '冬青', '矮松', '橡木', '榆树'].map((display_name, ordinal) => ({ ordinal, asset_id: `plant-${ordinal}`, display_name, thumbnail_resource_id: null, collection_ids: [ordinal < 3 ? 'low' : 'trees'], tags: [], lod: {}, provider_metadata: { model_name: `DemoPlant_${ordinal}` }, suggested_scale: { mode: 'uniform_random', min: 0.8, max: 1.2 }, reference_radius_m: ordinal < 3 ? 1.3 : 3.2, reference_height_m: ordinal < 3 ? 0.6 : 8 }));
const collections = [{ collection_id: 'low', display_name: '低矮植被', asset_count: 3 }, { collection_id: 'trees', display_name: '乔木', asset_count: 2 }];
const profile = { profile_entry_id: 'demo-mix', profile_id: 'demo-mix', display_name: '群落搭配与参数示例', strategy_id: strategies[0].summary.strategy_id, strategy_version: strategies[0].summary.strategy_version, target_type: 'dts', provider_id: 'dts.static-mesh', catalog_id: catalog.catalog_id, generation: 1, semantic_hash: 'demo-profile-hash', updated_at: '2026-10-14T01:00:00Z' };
strategies[0].profiles = [profile];
const candidates = indices => indices.map(i => ({ asset_id: assets[i].asset_id, display_name_snapshot: assets[i].display_name, weight: 1 / indices.length, scale: assets[i].suggested_scale, reference_radius_m: assets[i].reference_radius_m, reference_height_m: assets[i].reference_height_m, target_asset_ref: { target_type: 'dts', provider_id: 'dts.static-mesh', locator: assets[i].provider_metadata } }));
const detail = { summary: profile, role_count: 2, assets, assignments: { groundcover_matrix: { enabled: true, candidates: candidates([0, 1]) }, focal_structure: { enabled: true, candidates: candidates([3, 4]) } }, strategy_parameters: { groundcover_coverage_percent: 85, focal_core_ratio_percent: 55 }, catalog_drift: {}, drift_count: 0 };
const catalogDetail = { info: { ...catalog, semantic_hash: 'demo-catalog-hash', byte_size: 2600, created_at: profile.updated_at, updated_at: profile.updated_at, origin_package_hash: null }, document: { schema: 'verdflow.target-asset-catalog', version: '1', catalog_id: catalog.catalog_id, display_name: catalog.display_name, target_type: 'dts', provider_id: catalog.provider_id, assets: assets.map(({ asset_id, display_name, provider_metadata, suggested_scale, reference_radius_m, reference_height_m }) => ({ asset_id, display_name, provider_metadata, suggested_scale, reference_radius_m, reference_height_m })), collections: collections.map(c => ({ collection_id: c.collection_id, display_name: c.display_name, asset_ids: assets.filter(a => a.collection_ids.includes(c.collection_id)).map(a => a.asset_id) })) } };
const snapshot = { connector_session_id: 'demo-live', generation_token: 0, operation_id: null, stage: null, execution: null, pending_request_id: null, pending_command_kind: null, selection_coordinate_count: 0, elevation_point_count: 0, export_id: null, error: null, sampling_failures: [], selection_regions: [] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const unexpected = [], errors = [], captured = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1060 }, deviceScaleFactor: 1.5 });
  await context.addInitScript(() => localStorage.setItem('verdflow.dts-live.strategy', 'strategy-0'));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    let body;
    if (path === '/api/v1/configuration/assets' && route.request().method() === 'POST') body = { total_count: assets.length, collections, items: assets };
    else if (path === '/api/v1/strategy-previews/cancel-all') body = {};
    else if (path.startsWith('/api/v1/strategy-previews')) body = { preview_id: 'demo-example', package_hash: 'strategy-0', status: 'succeeded', result: sample, error_message: null };
    else if (route.request().method() !== 'GET') unexpected.push(`Write blocked: ${path}`);
    else if (path === '/api/v1/session') body = snapshot;
    else if (path === '/api/v1/configuration/options') body = { strategies, catalogs: [catalog] };
    else if (path === '/api/v1/configuration/profiles/demo-mix') body = detail;
    else if (path === '/api/v1/commands') { await new Promise(resolve => setTimeout(resolve, 500)); body = { items: [] }; }
    else unexpected.push(path);
    await route.fulfill({ status: body ? 200 : 403, contentType: 'application/json', body: JSON.stringify(body || { error: 'Blocked in isolated capture' }) });
  });
  await context.route('**/dts-live-webui/src/sdk/DtsSdkBridge.ts*', route => route.fulfill({ contentType: 'application/javascript', body: 'export class DtsSdkBridge { constructor(callbacks) { this.callbacks = callbacks; } async initialize() { this.callbacks.onReady(); } dispose() {} }' }));
  await context.route('**/__manual-current*', route => {
    const query = new URL(route.request().url()).searchParams;
    const view = query.get('view') || 'guide';
    const strategy = strategies[Number(query.get('strategy') || 0)];
    const active = query.get('role') || strategy.roles[0].role_key;
    const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c');
    let script;
    if (view === 'guide') script = `import{RoleChoiceNav,RolePurposePanel}from'/@fs/${product.replaceAll('\\', '/')}/packages/role-guide-ui/src/index.ts';const roles=${serialize(strategy.roles)};const selected=ref(${serialize(active)});createApp({setup(){return()=>h('article',{class:'guide-capture'},[h('header',[h('span','植被用途 · '+${serialize(strategy.summary.strategy_version)}),h('h1',${serialize(strategy.summary.display_name)})]),h(RoleChoiceNav,{roles,activeRoleKey:selected.value,enabled:Object.fromEntries(roles.map(r=>[r.role_key,true])),counts:Object.fromEntries(roles.map(r=>[r.role_key,1])),onSelect:key=>selected.value=key}),h(RolePurposePanel,{roles,role:roles.find(r=>r.role_key===selected.value)})])}}).mount('#fixture');`;
    else if (view === 'assets') script = `import Component from'/src/features/library/AssetCatalogEditor.vue';createApp({render(){return h(Component,{catalog:${serialize(catalogDetail)},busy:false,importThumbnail:async()=>null})}}).mount('#fixture');`;
    else if (view === 'effect') script = `import Component from'/src/components/StrategyEffectWorkspace.vue';const strategy=${serialize(strategies[0])};createApp({render(){return h('article',{class:'effect-capture'},[h('header',[h('span','层次生态群落 · v'+strategy.summary.strategy_version),h('h1','效果与预览')]),h(Component,{strategy,parameters:strategy.generation_parameters,values:Object.fromEntries(strategy.generation_parameters.map(p=>[p.key,p.default])),enabled:Object.fromEntries(strategy.roles.map(r=>[r.role_key,true])),randomSeed:17})])}}).mount('#fixture');`;
    else script = `import Component from'/@fs/${product.replaceAll('\\', '/')}/apps/dts-live-webui/src/App.vue';import'/@fs/${product.replaceAll('\\', '/')}/apps/dts-live-webui/src/styles.css';createApp(Component).mount('#fixture');`;
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{margin:0;background:#f4f7f6}#fixture{font-family:'Microsoft YaHei',sans-serif}.guide-capture{width:900px;margin:24px;padding:26px 30px;background:white;color:#182320}.guide-capture header{margin-bottom:24px}.guide-capture header span{font-size:12px;color:#66736f}.guide-capture h1{font-size:23px;margin:8px 0 0}.guide-capture .role-purpose-panel{margin-bottom:0}.guide-capture .role-purpose-panel figure{max-width:210px}</style></head><body><main id="fixture"></main><script type="module">import{createApp,h,ref}from'/node_modules/.vite/deps/vue.js';import'/src/styles/tokens.css';${view === 'live' ? '' : "import'/src/styles/base.css';"}${script}</script></body></html>` });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  async function capture(selector, name) {
    const target = page.locator(selector);
    await target.waitFor();
    await page.waitForTimeout(200);
    const png = fileURLToPath(new URL(`${name}.png`, out));
    await target.screenshot({ path: png });
    await sharp(png).webp({ quality: 94 }).toFile(fileURLToPath(new URL(`${name}.webp`, media)));
    captured.push(name);
  }
  const guides = [
    [0, 'groundcover_matrix', 'strategy-community-ground'], [0, 'focal_structure', 'strategy-community-focal'],
    [1, 'lawn_groundcover', 'strategy-lawn-coverage'], [1, 'feature_anchor', 'strategy-lawn-feature'],
    [2, 'tree_accent', 'strategy-street-trees'], [2, 'narrow_center_shrub', 'strategy-street-narrow'],
    [2, 'double_left_shrub', 'strategy-street-double'], [2, 'middle_shrub', 'strategy-street-wide'],
  ];
  for (const [index, role, name] of guides) {
    await page.goto(`${base}/__manual-current?strategy=${index}&role=${role}`);
    await page.locator('.role-purpose-panel figure > svg').waitFor();
    assert.ok(await page.locator('.role-purpose-panel svg :is(polygon,circle)').count() > 0, 'Empty strategy diagram');
    await capture('.guide-capture', name);
  }
  await page.goto(`${base}/__manual-current?view=assets`);
  await page.getByRole('button', { name: /橡木/ }).click();
  await page.getByText('参考高度（米）', { exact: true }).waitFor();
  await capture('.asset-catalog-editor', 'studio-asset-dimensions');
  await page.goto(`${base}/__manual-current?view=live`);
  await page.getByText('DTS Explorer 已连接', { exact: true }).waitFor();
  await page.getByRole('button', { name: /手动配置/ }).click();
  await page.locator('#profile').selectOption('demo-mix');
  await page.getByRole('button', { name: '调整植被搭配', exact: true }).click();
  await page.getByRole('dialog', { name: '配置植被搭配', exact: true }).waitFor();
  await page.getByText('用途示意与推荐植被', { exact: true }).waitFor();
  await capture('.mapping-modal', 'live-mapping-v031');
  await page.getByRole('button', { name: '仅本次应用', exact: true }).click();
  await page.getByRole('button', { name: '保存种植方案', exact: true }).click();
  await capture('.mapping-save-dialog[open]', 'live-save-plan-v031');
  await page.goto(`${base}/__manual-current?view=effect`);
  await page.addStyleTag({ content: '.effect-capture{width:1120px;margin:28px auto;padding:30px;background:#fff}.effect-capture header{margin-bottom:26px}.effect-capture header span{font-size:12px;color:#66736f}.effect-capture h1{font-size:24px;margin:8px 0}' });
  await page.locator('.strategy-example-preview canvas').waitFor();
  await page.waitForFunction(() => !document.querySelector('.strategy-example-preview .spin'));
  await page.waitForTimeout(600);
  assert.ok(await page.locator('canvas').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 16) colors.add(data.slice(i, i + 3).join(','));
    return colors.size > 20;
  }), 'Example canvas is blank');
  await capture('.effect-capture', 'studio-effect-example-v031');
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ captured, versions: strategies.map(s => `${s.summary.strategy_id}@${s.summary.strategy_version}`), productWrites: 0, sceneCommands: 0 }));
} finally { await browser.close(); }
