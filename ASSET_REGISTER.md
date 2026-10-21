# 素材登记

Logo、截图、横幅和本登记列出的其他媒体，不自动适用本站代码的 MIT 或文字的
CC BY 4.0 授权。具体许可与授权范围按逐项来源说明处理，未注明开放许可的素材不视为
可自由再分发。总体规则见 [许可范围说明](./LICENSING.md)。

网站只使用已审阅的静态素材。来源和使用边界保留在本登记中；首屏不叠加来源提示，不代表把概念图认定为真实运行成果。界面截图仍通过图注明确演示数据的边界。

内容审阅不等于确认公开授权。2026-10-20 已逐张检查用户补充的操作 PNG，仍有需要
脱敏或确认场景、项目展示权限的图片，详见 `RELEASE_CHECKLIST.md`。未处理前不应发布，
且 `docs/public/` 内未被页面引用的图片也会被复制到站点，不可只移除 Markdown 引用。

| 文件 | 来源与用途 | 边界 |
| --- | --- | --- |
| `landscape-hero.webp` | 本次通过内置 ImageGen 生成，白天公园中的乔木、灌木、草坪与曲线路径 | AI 空间种植概念图，不是 VerdFlow / DTS 运行成果 |
| `studio-strategies.webp` | 当前本地 Studio 的真实 `PlantingStage.vue`，隔离演示数据 | 不是私人生产项目，版本与角色按 2.1.0 示例整理 |
| `studio-mixes.webp` | 同一组件的植被搭配步骤 | 示例资源名称，不保证目标场景存在，未使用外部植被图片 |
| `studio-effects.webp` | 同一组件的效果参数步骤 | 仅展示真实界面，非参数性能评测 |
| `studio-preview.webp` | 真实 `PointReviewStage.vue` 与 Canvas，合成区域和点位 | 界面演示，不是策略算法效果或性能证明 |
| `studio-role-mapping.webp` | 真实 `PlantingStage.vue` 与角色配置组件 | 示例搭配与两个角色，不代替所有策略的角色定义 |
| `studio-asset-picker.webp` | 真实植被选择弹窗 | 示例名称、分类与默认占位图，无第三方植被图片 |
| `studio-regions.webp` | 真实 `RegionStage.vue` 与选区 Canvas | 合成区域，不是实际 FBX 提取成果 |
| `studio-create-geospatial.webp` | 真实 `DtsGeospatialCreateDialog.vue` | 示范区域、高程文件名与项目目录，不含私人路径 |
| `studio-create-catalog.webp` | 真实 `CreateAssetCatalogDialog.vue` | 示例名称与标识，未创建真实资产库 |
| `studio-asset-editor.webp` | 真实 `AssetCatalogEditor.vue` | 演示资产、参考半径和缩放，未保存真实库 |
| `studio-output.webp` | 真实 `CompositionOutputStage.vue` | 演示 XML 列表与偏移，不执行真实生成或文件删除 |
| `live-panel.webp` | 真实实时 WebUI `App.vue`，场景边界替换为隔离桩 | 连接状态、选面、策略与搭配为示例，不连接 DTS |
| `live-mapping.webp` | 同一实时组件的角色配置弹窗 | 隔离资产与配置，不保存真实搭配或执行种植 |
| `verdflow-logo-light.png` | 用户于 2026-10-20 提供的正式透明 PNG Logo，浅色背景版本，用于导航栏 | 原图等比缩小至 768 像素宽，未重绘、裁切或改色 |
| `verdflow-icon-32.png` | 同一素材包的独立应用图标，等比缩小为 32 × 32 | 浏览器标签页图标，替换旧临时 V 标识 |
| `verdflow-apple-touch-icon.png` | 同一独立应用图标，等比缩小为 180 × 180 | 移动设备添加到主屏幕的图标 |

## 用户补充的操作截图

2026-10-13 整理用户为手册补充的截图，统一保存于 `docs/public/media/`。
本次仅移动、重命名和调整文档引用，保留原始 PNG 内容与清晰度，不覆盖已有隔离演示图。
这些截图不是捕获脚本生成的合成演示数据，图注按实际操作界面说明。

| 文件 | 原文件 | 用途与边界 |
| --- | --- | --- |
| `live-workbench-session.png` | `media/live-workbench.png` | Studio 实时服务与 Explorer 会话状态；含临时会话详情，发布前审阅 |
| `live-explorer-panel.png` | `workflows/image-1.png` | DTS 场景中的实时种植 WebUI；场景展示权限发布前核对 |
| `studio-workflow-source.png` | `workflows/image-2.png` | FBX 与地理空间路线共用的区域来源选择；背景含项目卡片名称 |
| `studio-runtime-settings.png` | `workflows/image-3.png` | Blender 与 DTS 外部运行环境配置；用户已遮挡本机路径 |
| `studio-material-classification.png` | `workflows/image.png` | FBX 材质分类与恢复提取；仍含模型材质名称，发布前审阅 |
| `studio-region-selection.png` | `workflows/image-4.png` | 两条项目路线共用的区域选择操作；不作为特定输入格式的提取结果证明 |
| `studio-point-preview.png` | `workflows/image-5.png` | 两条项目路线共用的批次与植被图例预览 |
| `studio-xml-output.png` | `workflows/image-6.png` | 共用 XML 输出面板与文件留档；截图中本次预览计数为零，不能据此解释生成条件 |
| `studio-point-preview-overview.png` | `media/studio-preview.png` | 用户补充的整体区域点位预览，用于首页与多批次手册；不是隔离演示数据 |

文档使用 `/media/<用途名称>.png` 引用，通过 `Shot` 组件处理部署 base 与点击放大。
跨路线共用图片只保留一份，不复制为 FBX、GeoJSON 等多个版本。
截图中的现有信息原样保留；正式公开前由用户确认项目、材质、场景展示权限及脱敏结果。

2026-10-21 新增 `live-configuration-entry.png`：由用户补充到 `workflows/live.md` 的
`workflows/image.png` 移入，展示正式 Logo 下的“预设方案 / 手动配置”入口和已连接状态。
原始 PNG 内容保持不变，使用窄幅 `Shot` 展示并支持放大；不是隔离演示数据。
用户将后续自行评估截图的公开范围，本次只整理文件与引用。

## 当前策略用途与界面

2026-10-20 对照产品源码 `0.3.1` / `f454493` 更新以下静态素材。用途数据来自三个维护策略的
`strategy.yaml`，通过真实 `RoleChoiceNav` / `RolePurposePanel` 组件渲染，不手工重新绘制空间规则。
图中“1 种植被”等状态仅为隔离展示配置，图示不是算法运行结果、当前选区预览或模型尺寸证明。

| 文件 | 来源与用途 |
| --- | --- |
| `strategy-community-ground.webp` | 层次生态群落 2.2.2，铺底用途、分组与推荐 |
| `strategy-community-focal.webp` | 同一包，主景用途与嵌套关系 |
| `strategy-lawn-coverage.webp` | 草坪点景组团 1.0.2，主体与收边草坪 |
| `strategy-lawn-feature.webp` | 同一包，中心主景、组团灌木与外围点缀 |
| `strategy-street-trees.webp` | 通用行道树 2.0.2，所有宽度的沿线乔木 |
| `strategy-street-narrow.webp` | 同一包，窄绿带的单排灌木 |
| `strategy-street-double.webp` | 同一包，中等宽度的左右双排 |
| `strategy-street-wide.webp` | 同一包，宽绿带两侧与中排 |
| `studio-asset-dimensions.webp` | 当前资产编辑组件；演示半径 3.2 米、高度 8 米，不保存真实资产 |
| `live-mapping-v031.webp` | 当前实时搭配工作区，隔离候选与参数，不连接真实 DTS |
| `live-save-plan-v031.webp` | 当前方案保存确认，更新/另存与完整参数语义，不执行保存 |
| `studio-effect-example-v031.webp` | 真实 `StrategyEffectWorkspace`；原群落 2.2.2 生成器处理包内固定合成边界，默认参数、种子 17；展示普通角色点，不是私人地形、真实植被或性能证明 |
| `live-mapping-v020.webp`、`live-save-preset-v020.webp` | 保留的 0.2.0 历史图，不再作为现行保存流程配图 |

复现命令：

```powershell
node scripts/capture-current-ui.mjs
```

需要同级 VerdFlow 源码、本地 Studio Vite、Python 与 PyYAML；可用 `STUDIO_URL` 和 `PYTHON`
覆盖运行位置。脚本安全解析策略声明，并用 `python -B` 在有超时限制的独立进程中执行已核对的仓库内群落生成器，只处理包内合成样本，结果留在捕获进程内。
它不调用真实项目、库写入、高程或导入。API 默认阻断，资产查询和示例生命周期使用隔离响应；
DTS 场景桥接替换为桩，未匹配请求会导致检查失败。
原始 PNG 位于被忽略的 `.work/current-ui/`，公开素材为 WebP。

旧 `studio-role-mapping.webp`、`studio-effects.webp`、`studio-asset-editor.webp` 与
`live-mapping.webp` 保留为早期界面素材；本次更新的章节引用新版图，不将旧图标成当前界面。

## 主图生成说明

生成目标为日间、清晰、全幅的空间种植概念图，包含连续草坪、低矮植被与较高主景，
没有文字、人物主角或假界面。生成图任务 ID：`8780dd78-5dbe-443f-8da3-8e103a7d6d67`。
转换仅做 WebP 压缩，不把概念图修改或标记为真实产品截图。

## 截图复现

本地 Studio Vite 已运行时：

```powershell
node scripts/capture-studio.mjs
node scripts/prepare-media.mjs
```

捕获脚本只在浏览器侧使用隔离数据，所有 API 请求默认阻断，未匹配请求及写请求会使验证失败。
实时资产分页的只读 POST 使用单独匹配的模拟响应，仍不会发送到真实服务。DTS SDK 场景边界使用桩实现，实际场景命令为零。
不修改产品源码，不调用真实生成、保存或导入操作，不包含私人目录和项目名。

`STUDIO_URL` 可覆盖本地 Studio 地址。原始截图保存在被忽略的 `.work/captures/`，
最终静态素材保存于 `docs/public/media/`。

正式发布时可以换成拥有展示权限的真实成果图；届时同时更新图片来源、页内标注和本登记。

## 发布前素材检查

用户已补充部分真实操作截图。以下内容仍需在公开前确认展示权限；不从私人项目或同事模型中自行提取更多素材：

- 首页已使用 `studio-point-preview-overview.png` 替换原合成区域预览，发布前确认整体区域与植被信息的展示权限；原 `studio-preview.webp` 保留为隔离演示素材。
- FBX 的模型检查与绿地材质选择步骤：已收到用户补充的操作图，发布前核对其中模型与材质名称的展示权限；可另补首次提取的正常状态。
- DTS 场景中的贴地选区与最终种植成果：已收到场景与实时面板图，最终种植效果图仍可补充；发布前隐藏不宜公开的服务、项目和路径信息。
- 资产缩略图：使用具有公开展示权限的植被模型预览图，不能直接搬用私人库中的图片。

现有截图可用于说明界面和操作。用户操作截图与隔离演示图应分别标注，不将界面示意当作经过评测的效果案例。
