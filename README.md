# VerdFlow Site

VerdFlow 的独立官网与中文使用指南。产品源码、ADR 与内部验证记录仍由 VerdFlow 产品仓库维护。

[在线站点](https://mr-pardon.github.io/verdflow-site/) ·
[文档反馈](https://github.com/Mr-Pardon/verdflow-site/issues) ·
[部署状态](https://github.com/Mr-Pardon/verdflow-site/actions/workflows/pages.yml)

当前手册核对基线为 VerdFlow `0.3.1` 主分支源码（`f454493`，2026-10-20 核对）。
最近已核验的本地便携包与标签为 `v0.3.0`，不将源码版本当作公开下载状态。
`docs/strategies/` 介绍层次生态群落 2.2.2、草坪点景组团 1.0.2、通用行道树 2.0.2。
统一种植方案、动态效果示例与跨库搭配已同步；素材依据见 `ASSET_REGISTER.md` 和 `CONTENT_GUIDE.md`。

## 本地运行

使用 Node.js 22 或更高版本：

```powershell
npm ci
npm run dev
```

默认地址为 `http://127.0.0.1:4180/`。

需要在局域网内访问时运行：

```powershell
npm run dev:lan
```

该命令监听 `0.0.0.0`，其他设备通过 `http://<本机局域网IP>:4180/` 访问。
端口已占用时会自动尝试其他可用端口，以终端输出的实际地址为准。
仅在可信局域网中使用，无法访问时检查 Windows 防火墙是否允许该开发服务。

```powershell
npm run check
npm run build
npm test
npm run test:build
```

`npm test` 对本地 4180 站点做浏览器回归，使用已安装的 Microsoft Edge，检查桌面、
窄窗口、手机、搜索和文章导航，截图输出到被忽略的 `verification/`。
`npm run test:build` 自动启动临时生产预览、运行同一套检查并关闭临时服务，不占用 4180。
它还验证页内锚点、Logo、favicon 和 404 返回入口。Windows 默认使用 Edge；其他平台
使用 Playwright Chromium，首次运行需执行 `npx playwright install --with-deps chromium`。
可通过 `PLAYWRIGHT_CHANNEL` 显式选择已安装的浏览器渠道。

## 工具链维护

站点保持 VitePress 1.6.4。为修复旧依赖的已知问题，`package.json` 将其 Vite 依赖
覆盖为 6.4.4，并更新 markdown-it 14.3.3、sharp 0.35.5；锁文件须与配置一起维护。
这是本站验证的兼容覆盖，上游 VitePress 1.6.4 仍声明 Vite 5.x。开发配置同时兼容
本地搜索索引的 HMR ID。以后升级框架时重新核对 override 和这项兼容配置，使用
`npm ci`、`npm audit` 和开发 / 生产浏览器回归检查结果。
开发服务中修改文章后，搜索索引暂需重启服务同步；正式构建会重新生成索引。
维护依据与练习数据计划见 [发布准备清单](./RELEASE_CHECKLIST.md)。

## 内容与素材

- `docs/`：公开页面与手册。
- `docs/.vitepress/theme/`：首页、组件与视觉系统。
- `docs/public/media/`：页面使用的已审阅图片。
- `scripts/`：内容校验、浏览器验证与素材转换。
- `CONTENT_GUIDE.md`：事实、版本、截图和发布规范。
- `ASSET_REGISTER.md`：素材来源、使用边界与替换方法。

“创作与扩展”包含整体架构介绍与 VFS / VFA 作者路线。
`docs/authoring/architecture.md` 的流程图由独立 Vue 组件维护，文字可检索，窄屏按纵向阅读；
图示解释职责与数据关系，具体功能支持范围仍以正文中的当前能力表为准。

本版官网主图为 AI 空间种植示意，来源记录在素材登记中，不是 DTS 实测成果。
组件演示截图使用隔离数据，不连接或修改生产项目；用户补充的操作截图单独登记来源和发布前审阅事项。
没有自动公开用户项目文件。

## 许可与署名

Copyright (c) 2026 Mr_Pardon。

- 本站自有代码和原创示例代码采用 [MIT](./LICENSE)。
- 自有手册、维护文档和页面说明文字采用 [CC BY 4.0](./LICENSE-DOCS)，允许商业使用；分享时保留署名、原文与许可链接，并说明修改。
- Logo、图标、横幅、截图及其他媒体不自动适用上述许可，按具体素材的许可或授权处理。
- 第三方依赖、VerdFlow 产品与用户数据保留各自的权利和许可。

详细范围与推荐署名见 [许可范围说明](./LICENSING.md)；站点的公开说明位于
[`docs/license.md`](./docs/license.md)。页面会直接引用根目录 MIT 原文，保持统一。
素材来源与公开检查继续维护在 `ASSET_REGISTER.md` 和 `RELEASE_CHECKLIST.md` 中。

## GitHub Pages

仓库默认分支 `main`，在 GitHub 设置 Pages 的 Source 为 GitHub Actions。
工作流只安装本站依赖并部署静态产物，不构建 VerdFlow 客户端。

项目 Pages 会自动使用 `/<repository-name>/` 作为 base；自定义域名可设置仓库变量
`SITE_BASE=/`；`<owner>.github.io` 用户或组织仓库自动使用 `/`。站点源码不硬编码 GitHub 用户名。

本地验证项目子路径时，构建与预览必须使用相同的 `SITE_BASE`：

```powershell
$env:SITE_BASE = '/verdflow-site/'
npm run build
npm run test:build
```

这两个命令使用相同的 `SITE_BASE`，测试结束会关闭临时服务。切回根路径时移除该变量，
重新构建一次，避免本地生产目录保留子路径产物。仅想查看生产结果时可手动运行
`node node_modules/vitepress/bin/vitepress.js preview docs --port 4181`。

可在仓库 Actions Variables 中配置：

| 变量 | 用途 |
| --- | --- |
| `RELEASE_URL` | 已核验的客户端发布页面，未填写时展示内测获取说明 |
| `SITE_BASE` | 覆盖部署 base，默认从仓库名推导 |

公开仓库为 [Mr-Pardon/verdflow-site](https://github.com/Mr-Pardon/verdflow-site)，默认站点地址为
`https://mr-pardon.github.io/verdflow-site/`，暂不使用自定义域名。`main` 推送后自动构建部署，
每次运行结果见上方部署状态；客户端发布链接暂留空，文档上线不代表软件已公开发行。
后续发布继续核对版本、素材、下载地址和截图，详见 `CONTENT_GUIDE.md` 与
[发布检查清单](./RELEASE_CHECKLIST.md)。
GitHub Actions 在上传 Pages 产物前也执行生产浏览器回归；失败不会进入部署步骤。
