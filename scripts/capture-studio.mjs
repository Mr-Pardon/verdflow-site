import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Real components, synthetic data, and a deny-by-default API boundary.
const base = process.env.STUDIO_URL || 'http://127.0.0.1:4173';
const liveSource = '/@fs/' + fileURLToPath(new URL('../../VerdFlow/apps/dts-live-webui/src/', import.meta.url)).replaceAll('\\', '/');
const out = new URL('../.work/captures/', import.meta.url);
await mkdir(out, { recursive: true });
const strategies = [
  ['layered_ecological_community', '层次生态群落', '2.1.0', 'community'],
  ['lawn_feature_groups', '草坪点景组团', '1.0.0', 'lawn'],
  ['universal_street_tree', '通用行道树', '2.0.0', 'street'],
].map(([strategy_id, display_name, strategy_version, package_hash]) => ({ strategy_id, display_name, strategy_version, package_hash, library_entry_id: package_hash, executable: true, trust_state: 'trusted' }));
const roles = [
  { role_key: 'groundcover_matrix', display_name: '地表基质', description: '形成连续且较广的地表承接层，可使用地被、花草或低矮植被。', required: true, assignment_policy: 'weighted_pool' },
  { role_key: 'focal_structure', display_name: '主景结构', description: '在地表支撑区内形成主要体量与节奏，可使用空间尺度相近的乔木或灌木。', required: true, assignment_policy: 'weighted_pool' },
];
const parameters = [
  ['groundcover_coverage_percent', '地表支撑覆盖率（%）', 85, 5, 98, 1, '控制允许生成地表基质的面积比例。'],
  ['focal_core_ratio_percent', '主景占地表比例（%）', 55, 1, 100, 1, '控制主景核心相对地表支撑区的比例。'],
  ['groundcover_spacing_m', '地表植被间距（m）', 3.4, 0.5, 12, 0.1, '控制地表基质点位的基础间距。'],
  ['focal_spacing_m', '主景植被间距（m）', 11, 2, 40, 0.5, '控制主景结构点位的基础间距。'],
  ['patch_scale_m', '宏观斑块尺度（m）', 48, 10, 200, 2, '控制连续密度起伏的空间尺度。'],
].map(([key, display_name, value, minimum, maximum, step, effect], i) => ({ key, display_name, default: value, minimum, maximum, step, effect, value_type: 'number', group: i === 4 ? 'advanced' : 'quick' }));
const descriptions = {
  layered_ecological_community: '使用连续密度场组织地表基质与主景结构，形成自然、非均匀的局部疏密。',
  lawn_feature_groups: '使用主体草坪承接连续覆盖，在安全空间中布置点景组团。',
  universal_street_tree: '沿区域中心线形成连续而有节奏的植被序列。',
};
const catalog = { catalog_entry_id: 'demo-catalog', catalog_id: 'demo-plants', target_type: 'dts', provider_id: 'dts.static-mesh', display_name: '示例植被资产库', generation: 1 };
const assets = ['地被草坪', '冬青', '矮松', '橡木', '榆树'].map((name, i) => ({ ordinal: i, asset_id: `asset-${i}`, display_name: name, thumbnail_resource_id: null, collection_ids: [i < 3 ? 'low' : 'trees'], tags: [], lod: {}, provider_metadata: { mesh_name: `DemoPlant_${i}` }, reference_radius_m: i < 3 ? 1.3 : 3.2, suggested_scale: { mode: 'uniform_random', min: 0.8, max: 1.2 } }));
const collections = [{ collection_id: 'low', display_name: '低矮植被', asset_count: 3 }, { collection_id: 'trees', display_name: '乔木', asset_count: 2 }];
const candidates = (ids) => ids.map(i => ({ asset_id: assets[i].asset_id, display_name_snapshot: assets[i].display_name, weight: 1 / ids.length, scale: { mode: 'uniform_random', min: 0.8, max: 1.2 }, reference_radius_m: assets[i].reference_radius_m, target_asset_ref: { target_type: 'dts', provider_id: 'dts.static-mesh', locator: assets[i].provider_metadata } }));
const profiles = ['乔灌自然搭配', '低矮植被搭配'].map((display_name, i) => ({ profile_entry_id: `mix-${i}`, profile_id: `mix-${i}`, display_name, strategy_id: 'layered_ecological_community', strategy_version: '2.1.0', target_type: 'dts', provider_id: 'dts.static-mesh', catalog_id: catalog.catalog_id, generation: 1 }));
const profileDetails = Object.fromEntries(profiles.map((summary, i) => [summary.profile_id, { summary, role_count: 2, assignments: { groundcover_matrix: { enabled: true, candidates: candidates([0, 1]) }, focal_structure: { enabled: true, candidates: candidates(i ? [2] : [3, 4]) } }, catalog_drift: {}, drift_count: 0 }]));

const boundaries = [
  [[10, 14], [100, 8], [143, 33], [132, 71], [92, 101], [28, 88], [5, 52]],
  [[158, 27], [198, 13], [254, 27], [268, 76], [228, 96], [179, 82]],
  [[25, 122], [122, 115], [149, 144], [134, 174], [62, 185], [16, 158]],
];
const bounds = { min_x: 0, min_y: 0, min_z: 0, max_x: 280, max_y: 195, max_z: 0 };
const regions = boundaries.map((ring, i) => ({ region_id: `region-${i}`, ordinal: i, label: `示例绿地 ${i + 1}`, classification: 'greenbelt', strategy_hint: null,
  footprint_area_xy: Math.abs(ring.reduce((area, [x, y], index) => { const next = ring[(index + 1) % ring.length]; return area + x * next[1] - next[0] * y; }, 0)) / 2,
  bounds, footprint_boundary_xyz: [[...ring, ring[0]].map(([x, y]) => [x, y, 0])] }));
function inside(x, y, ring) {
  let value = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) value = !value;
  }
  return value;
}
const points = [];
for (let y = 6; y < 190; y += 4.6) {
  for (let x = 8; x < 272; x += 4.6) {
    const px = x + Math.sin(y * 1.7 + x) * 1.5, py = y + Math.cos(x * 1.2 + y) * 1.5;
    const region = boundaries.findIndex(ring => inside(px, py, ring));
    if (region < 0 || region === 2) continue;
    const density = Math.sin(px / 25) + Math.cos(py / 20);
    if (density < -0.65) continue;
    const focal = density > 0.8 && Math.floor(x + y) % 4 === 0;
    const assetIndex = focal ? (Math.floor(x) % 2 ? 3 : 4) : (Math.floor(y) % 2 ? 0 : 1);
    points.push({ point_id: `demo-${points.length}`, ordinal: points.length, region_id: `region-${region}`, role_key: roles[focal ? 1 : 0].role_key, position: [px, py, 0], asset_id: assets[assetIndex].asset_id, target_scale_xyz: [1, 1, 1], group_id: null });
  }
}
const legend = assets.filter(a => points.some(p => p.asset_id === a.asset_id)).map(a => ({ key: a.asset_id, display_name: a.display_name, point_count: points.filter(p => p.asset_id === a.asset_id).length, reference_radius_m: a.reference_radius_m, max_resolved_radius_m: a.reference_radius_m }));
const manifest = { point_set_id: 'demo-points', assignment_set_id: 'demo-assignments', planting_run_id: 'demo-run', region_set_id: 'demo-regions', coordinate_frame_id: 'demo-local', kind: 'generated', target_type: 'dts', point_count: points.length, bounds, roles: [], assets: legend, max_resolved_radius_m: 3.2 };
const batch = { batch_id: 'demo-batch', ordinal: 0, plant_run_execution_id: 'demo-run', generated_point_set_id: manifest.point_set_id, asset_assignment_set_id: manifest.assignment_set_id, selected_region_ids: ['region-0', 'region-1'], selected_asset_ids: null, strategy_id: strategies[0].strategy_id, strategy_version: '2.1.0', point_count: points.length, status: 'completed', stage: 'review' };
const composition = { composition_id: 'demo-composition', region_set_id: 'demo-regions', batches: [batch], occupied_region_ids: batch.selected_region_ids };
const catalogDetail = {
  info: { ...catalog, semantic_hash: 'demo-catalog-hash', byte_size: 2400, created_at: '2026-10-10T01:00:00Z', updated_at: '2026-10-10T01:00:00Z', origin_package_hash: null },
  document: { schema: 'verdflow.target-asset-catalog', version: '1', catalog_id: catalog.catalog_id, display_name: catalog.display_name, target_type: 'dts', provider_id: catalog.provider_id,
    assets: assets.map(a => ({ asset_id: a.asset_id, display_name: a.display_name, provider_metadata: { model_name: a.provider_metadata.mesh_name }, suggested_scale: a.suggested_scale, reference_radius_m: a.reference_radius_m, tags: a.tags })),
    collections: collections.map(c => ({ collection_id: c.collection_id, display_name: c.display_name, asset_ids: assets.filter(a => a.collection_ids.includes(c.collection_id)).map(a => a.asset_id) })),
  },
};
const liveSnapshot = { connector_session_id: 'demo-live', generation_token: 0, operation_id: null, stage: null, execution: null, pending_request_id: null, pending_command_kind: null, selection_coordinate_count: 0, elevation_point_count: 0, export_id: null, error: null, sampling_failures: [],
  selection_regions: boundaries.slice(0, 2).map((ring, i) => ({ region_id: `live-region-${i}`, name: `选区 ${i + 1}`, coordinates: [...ring, ring[0]].map(([x, y]) => [x, y, 0]), bbox: [0, 0, 0, 280, 195, 0] })),
};
const liveOptions = { strategies: strategies.map(s => ({ summary: s, description: descriptions[s.strategy_id], roles, generation_parameters: parameters, default_random_seed: 17, profiles: s.strategy_id === strategies[0].strategy_id ? profiles : [] })), catalogs: [catalog] };
const xmlOutputs = [
  { export_id: 'demo-xml-2', suggested_filename: 'planting-offset.xml', media_type: 'application/xml', byte_size: 168800, record_count: points.length, offset: [12, 0, 0], created_at: '2026-10-10T02:30:00Z' },
  { export_id: 'demo-xml-1', suggested_filename: 'planting-preview.xml', media_type: 'application/xml', byte_size: 168800, record_count: points.length, offset: [0, 0, 0], created_at: '2026-10-10T02:00:00Z' },
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const unexpected = [];
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 930 } });
  await context.addInitScript(() => {
    window.verdflowPlatform = {
      getLocalApiConnection: async () => ({ ok: true, value: { baseUrl: '', managementAvailable: true } }),
      requestLocalApi: async (request) => {
        const response = await fetch(request.path, { method: request.method || 'GET', body: request.body, headers: { 'Content-Type': 'application/json' } });
        return { ok: true, value: { status: response.status, contentType: 'application/json', body: await response.text() } };
      },
    };
  });
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    if (!path.startsWith('/api/')) return route.continue();
    let body;
    if (path === '/api/v1/configuration/assets' && route.request().method() === 'POST') body = { total_count: assets.length, collections, items: assets };
    else if (route.request().method() !== 'GET') unexpected.push(`Write blocked: ${path}`);
    else if (path === '/api/v1/session') body = liveSnapshot;
    else if (path === '/api/v1/configuration/options') body = liveOptions;
    else if (path.startsWith('/api/v1/configuration/profiles/')) body = profileDetails[path.split('/').at(-1)];
    else if (path === '/api/v1/commands') {
      await new Promise(resolve => setTimeout(resolve, 500));
      body = { items: [] };
    }
    else if (path === '/api/v1/strategies') body = { items: strategies };
    else if (path.startsWith('/api/v1/strategies/')) {
      const summary = strategies.find(s => s.package_hash === path.split('/')[4]);
      body = { summary, description: descriptions[summary.strategy_id], roles, generation_parameters: parameters, default_random_seed: 17, intent: {}, terrain_suitability: {} };
    } else if (path === '/api/v1/asset-catalogs') body = { target_type: 'dts', items: [catalog] };
    else if (path.endsWith('/assets')) body = { catalog, collections, total_count: assets.length, items: assets, next_after_ordinal: null };
    else if (path === '/api/v1/role-binding-profiles') body = { target_type: 'dts', items: profiles.filter(p => p.strategy_id === url.searchParams.get('strategy_id') && p.strategy_version === url.searchParams.get('strategy_version')) };
    else if (path.startsWith('/api/v1/role-binding-profiles/')) body = profileDetails[path.split('/')[4]];
    else if (path.endsWith('/xml-outputs')) body = { items: xmlOutputs };
    else if (path.endsWith('/planting-composition-exports/active')) body = { operation: null };
    else if (path.endsWith('/review')) body = manifest;
    else if (path.endsWith('/viewer')) body = { region_set_id: 'demo-regions', scene_revision_id: 'demo-scene', coordinate_frame_id: 'demo-local', region_count: regions.length, bounds, classifications: [{ classification: 'greenbelt', region_count: regions.length, footprint_area_xy: regions.reduce((sum, region) => sum + region.footprint_area_xy, 0) }] };
    else if (path.endsWith('/geometry')) body = { items: regions, next_after_ordinal: null, truncated: false };
    else if (path.endsWith('/points')) body = { items: points, next_after_ordinal: null, truncated: false };
    else unexpected.push(path);
    await route.fulfill({ status: body ? 200 : 403, contentType: 'application/json', body: JSON.stringify(body || { error: 'Blocked in isolated capture' }) });
  });
  // Replace only the scene boundary. The live Vue UI and its interactions remain real.
  await context.route('**/dts-live-webui/src/dtsSdk.ts*', route => route.fulfill({ contentType: 'application/javascript', body: `export class DtsSdkBridge { constructor(callbacks) { this.callbacks = callbacks; } async initialize() { this.callbacks.onReady(); } dispose() {} }` }));
  await context.route('**/__site-capture*', async route => {
    const query = new URL(route.request().url()).searchParams;
    const kind = query.has('review') ? 'review' : query.get('view') || 'planting';
    const components = { planting: 'dts/PlantingStage', review: 'dts/PointReviewStage', regions: 'dts/RegionStage', output: 'dts/CompositionOutputStage', assets: 'library/AssetCatalogEditor', catalog: 'library/CreateAssetCatalogDialog', geospatial: 'dts/DtsGeospatialCreateDialog' };
    const propsByKind = {
      planting: { sessionId: 'demo-session', sceneRevisionId: 'demo-scene', regionSetId: 'demo-regions', selectedRegionIds: ['region-0', 'region-1'], currentExecution: null },
      review: { sessionId: 'demo-session', committedBatches: [batch] },
      regions: { sessionId: 'demo-session', regionSetId: 'demo-regions', initialSelectedRegionIds: ['region-0', 'region-1'], composition: null },
      output: { sessionId: 'demo-session', composition, batchSelections: [{ batchId: batch.batch_id, plantRunExecutionId: 'demo-run', selectedAssetIds: null, pointCount: points.length }], selectedPointCount: points.length },
      assets: { catalog: catalogDetail, busy: false },
      catalog: { targetType: 'dts', initialCatalogId: 'demo-plants', busy: false },
      geospatial: { vectorPath: 'planting-regions.geojson', elevationPath: 'terrain-elevation.tif', projectName: '示例地理空间种植', projectPath: '示例项目目录', managementAvailable: true, busy: false, canSubmit: true, stage: 'idle', errorMessage: null },
    };
    const live = kind === 'live';
    const component = live ? `${liveSource}App.vue` : `/src/features/${components[kind]}.vue`;
    const styles = live ? `import ${JSON.stringify(`${liveSource}styles.css`)};` : "import '/src/styles/tokens.css';import '/src/styles/base.css';";
    await route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{margin:0;background:#f4f7f6}header.fixture-heading{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:white;border-bottom:1px solid #dce6e0;font:600 16px system-ui;color:#243e35}header.fixture-heading span{font-size:12px;font-weight:400;color:#82928a}#fixture{display:flex;height:calc(100vh - 112px);margin:24px;border:1px solid #d9e1df;min-height:0}</style></head><body>${live ? '' : '<header class="fixture-heading">VerdFlow Studio<span>示例绿地 · 界面演示</span></header>'}<main id="fixture"></main><script type="module">import{createApp,h}from'/node_modules/.vite/deps/vue.js';import Component from '${component}';import ConfirmDialogHost from '/src/components/ConfirmDialogHost.vue';${styles}createApp({render(){return[h(Component,{...${JSON.stringify(propsByKind[kind] || {})},importThumbnail:async()=>null}),${live ? '' : 'h(ConfirmDialogHost)'}]}}).mount('#fixture');</script></body></html>` });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/__site-capture`);
  await page.waitForTimeout(1800);
  if (!(await page.getByRole('radio', { name: /层次生态群落/ }).count())) {
    console.log(JSON.stringify({ errors, unexpected, body: (await page.locator('body').innerText()).slice(0, 1600) }));
  }
  await page.getByRole('radio', { name: /层次生态群落/ }).click();
  await page.waitForFunction(() => document.querySelector('.guide-steps')?.textContent.includes('层次生态群落'));
  await page.screenshot({ path: new URL('studio-strategies.png', out).pathname.slice(1), fullPage: true });
  await page.getByRole('button', { name: '下一步：选择植被' }).click();
  await page.getByRole('radio', { name: /乔灌自然搭配/ }).click();
  await page.waitForFunction(() => !document.querySelector('.guide-actions .primary-button')?.disabled);
  await page.screenshot({ path: new URL('studio-mixes.png', out).pathname.slice(1), fullPage: true });
  await page.getByRole('button', { name: '调整搭配', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: new URL('studio-role-mapping.png', out).pathname.slice(1), fullPage: true });
  await page.getByRole('button', { name: /选择植被/ }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(400);
  await page.getByRole('dialog').screenshot({ path: new URL('studio-asset-picker.png', out).pathname.slice(1) });
  await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '调整效果', exact: true }).click();
  await page.locator('.guide-effects[open]').waitFor();
  await page.screenshot({ path: new URL('studio-effects.png', out).pathname.slice(1), fullPage: true });
  await page.goto(`${base}/__site-capture?review`);
  await page.waitForFunction(() => document.querySelector('.point-review-stage')?.textContent.includes('橡木'));
  await page.waitForTimeout(700);
  const painted = await page.locator('canvas').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] > data[i + 1] + 25 || data[i + 1] > data[i] + 25) colored++;
    return colored;
  });
  assert.ok(painted > 1000, `Preview canvas appears blank: ${painted}`);
  await page.screenshot({ path: new URL('studio-preview.png', out).pathname.slice(1), fullPage: true });
  for (const [kind, name, selector] of [
    ['regions', 'studio-regions', '.region-stage'],
    ['output', 'studio-output', '.composition-output-stage'],
    ['assets', 'studio-asset-editor', '.asset-catalog-editor'],
    ['catalog', 'studio-create-catalog', '.asset-catalog-create-dialog'],
    ['geospatial', 'studio-create-geospatial', '.creation-dialog'],
  ]) {
    await page.goto(`${base}/__site-capture?view=${kind}`);
    await page.locator(selector).waitFor();
    await page.waitForTimeout(650);
    if (kind === 'assets') await page.getByRole('button', { name: /橡木/ }).click();
    if (kind === 'output') {
      await page.locator('input[type="number"]').first().fill('12');
      await page.locator('input[type="number"]').first().blur();
    }
    await page.locator(selector).screenshot({ path: new URL(`${name}.png`, out).pathname.slice(1) });
  }
  await page.goto(`${base}/__site-capture?view=live`);
  await page.getByText('DTS Explorer 已连接', { exact: true }).waitFor();
  await page.locator('#profile').selectOption('mix-0');
  await page.locator('.strategy-section .section-toggle').click();
  await page.waitForTimeout(500);
  await page.locator('.live-shell').screenshot({ path: new URL('live-panel.png', out).pathname.slice(1) });
  await page.getByRole('button', { name: '本次改为手动映射', exact: true }).click();
  await page.getByRole('dialog', { name: '配置植被映射' }).waitFor();
  await page.waitForTimeout(650);
  await page.getByRole('dialog', { name: '配置植被映射' }).screenshot({ path: new URL('live-mapping.png', out).pathname.slice(1) });
  assert.deepEqual(unexpected, []);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ captured: 13, syntheticPoints: points.length, coloredCanvasPixels: painted, productWrites: 0, sceneCommands: 0, output: out.pathname }));
} finally { await browser.close(); }
