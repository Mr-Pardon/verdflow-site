import { defineConfig } from 'vitepress';

const [owner, repository] = process.env.GITHUB_REPOSITORY?.split('/') || [];
const repositoryBase = repository && repository.toLowerCase() !== `${owner}.github.io`.toLowerCase() ? `/${repository}/` : '/';
const base = process.env.SITE_BASE || (process.env.GITHUB_ACTIONS ? repositoryBase : '/');
const releaseUrl = process.env.RELEASE_URL || '';
if (!/^\/(?:[^?#\\]*\/)?$/.test(base)) throw new Error('SITE_BASE must start and end with /, such as /verdflow-site/.');
if (releaseUrl && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases(?:\/|$)/.test(releaseUrl)) {
  throw new Error('RELEASE_URL must point to the verified GitHub Releases page, or be left empty.');
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'VerdFlow',
  titleTemplate: ':title · VerdFlow',
  description: '面向空间设计的植被种植工具。连接区域数据、种植策略与植被搭配，在可预览的工作流中完成种植。',
  base,
  cleanUrls: false,
  appearance: false,
  lastUpdated: false,
  head: [
    ['meta', { name: 'theme-color', content: '#164c42' }],
    ['meta', { property: 'og:site_name', content: 'VerdFlow' }],
    ['link', { rel: 'icon', href: `${base}media/verdflow-icon-32.png`, type: 'image/png', sizes: '32x32' }],
    ['link', { rel: 'apple-touch-icon', href: `${base}media/verdflow-apple-touch-icon.png`, sizes: '180x180' }],
  ],
  vite: {
    define: { __RELEASE_URL__: JSON.stringify(releaseUrl) },
    plugins: [{
      name: 'verdflow:local-search-hmr',
      apply: 'serve',
      // VitePress 1.x accepts this URL for HMR; Vite 6 also resolves it as an ID.
      resolveId(id) {
        if (id === '/@localSearchIndex') return id;
      },
    }],
  },
  markdown: { image: { lazyLoading: true } },
  themeConfig: {
    logo: { src: '/media/verdflow-logo-light.png', alt: 'VerdFlow', width: 768, height: 153 },
    siteTitle: false,
    nav: [
      { text: '产品', link: '/' },
      { text: '开始使用', link: '/guide/start', activeMatch: '/guide/(start|install)' },
      { text: '用户手册', link: '/manual/overview', activeMatch: '/(manual|workflows|resources|reference|strategies)/' },
      { text: '创作与扩展', link: '/authoring/overview', activeMatch: '/authoring/' },
      { text: '下载与更新', link: '/download', activeMatch: '/(download|updates)' },
    ],
    sidebar: {
      '/guide/': manualSidebar(),
      '/manual/': manualSidebar(),
      '/workflows/': manualSidebar(),
      '/resources/': manualSidebar(),
      '/reference/': manualSidebar(),
      '/strategies/': manualSidebar(),
      '/authoring/': [
        { text: '设计与架构', items: [
          { text: '创作与扩展', link: '/authoring/overview' },
          { text: '架构与扩展', link: '/authoring/architecture' },
        ] },
        { text: '作者工具包', items: [
          { text: '理解策略角色', link: '/authoring/roles' },
          { text: 'VFS Author · 创作策略', link: '/authoring/strategy' },
          { text: 'VFA Author · 整理资产', link: '/authoring/assets' },
        ] },
        { text: '继续阅读', items: [
          { text: '交换包参考', link: '/reference/packages' },
          { text: '策略库与信任', link: '/resources/strategies' },
          { text: '回到用户手册', link: '/manual/overview' },
        ] },
      ],
    },
    outline: { level: [2, 3], label: '本页内容' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    sidebarMenuLabel: '手册目录',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关内容', resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    footer: {
      message: `为每一片绿地，找到合适的种植方式。 <a href="${base}license.html">许可与署名</a>`,
      copyright: 'Copyright 2026 Mr_Pardon · 正文 CC BY 4.0 · 站点代码 MIT',
    },
  },
});

function manualSidebar() {
  return [
    { text: '从这里开始', items: [
      { text: '手册概览', link: '/manual/overview' },
      { text: '选择你的上手路线', link: '/guide/start' },
      { text: '安装与准备', link: '/guide/install' },
      { text: '三个核心概念', link: '/manual/concepts' },
    ] },
    { text: '完成一次种植', items: [
      { text: 'DTS 实时种植', link: '/workflows/live' },
      { text: 'FBX 模型种植', link: '/workflows/fbx' },
      { text: 'SHP / GeoJSON + 高程', link: '/workflows/geospatial' },
      { text: '调参时查看效果示意', link: '/manual/effect-preview' },
      { text: '多批次与点位预览', link: '/manual/batches' },
      { text: '输出 XML 与坐标偏移', link: '/manual/output' },
    ] },
    { text: '内置策略', collapsed: true, items: [
      { text: '如何选择策略', link: '/strategies/overview' },
      { text: '层次生态群落', link: '/strategies/community' },
      { text: '草坪点景组团', link: '/strategies/lawn' },
      { text: '通用行道树', link: '/strategies/street-trees' },
    ] },
    { text: '管理种植资源', items: [
      { text: '资产库与分类', link: '/resources/assets' },
      { text: '种植方案与植被搭配', link: '/resources/mixes' },
      { text: '策略库与信任', link: '/resources/strategies' },
      { text: '参数、权重与缩放', link: '/reference/parameters' },
    ] },
    { text: '参考与排障', items: [
      { text: '输入数据检查', link: '/reference/data' },
      { text: '交换包参考', link: '/reference/packages' },
      { text: '常见问题', link: '/reference/troubleshooting' },
      { text: '数据备份与更新', link: '/reference/backup' },
    ] },
  ];
}
