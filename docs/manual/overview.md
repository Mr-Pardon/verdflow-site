---
title: 用户手册
description: 按操作目标浏览 VerdFlow 的种植、资源管理与输出指南。
---

<span class="doc-eyebrow">VERDFLOW HANDBOOK</span>

# 用户手册

<p class="lead">从第一次种植，到管理一个完整场景。每一页都对应一件具体的事。</p>

## 刚开始使用

先[选择上手路线](../guide/start.md)，再完成[安装与准备](../guide/install.md)。策略、角色和植被搭配的关系，集中解释在[三个核心概念](./concepts.md)。

## 完成一次种植

<div class="guide-links">
  <a href="../workflows/live.html">在 DTS 场景中直接种植 <span>绘制 / 导入选区，采样并写入场景</span></a>
  <a href="../workflows/fbx.html">从 FBX 模型提取绿地 <span>按材质提取区域，再预览与输出</span></a>
  <a href="../workflows/geospatial.html">从 SHP / GeoJSON 与高程开始 <span>使用已经对齐的米制面数据与 GeoTIFF</span></a>
  <a href="./batches.html">分多批完成一个场景 <span>继续种植，筛选点位，重新种植某一批</span></a>
  <a href="./output.html">输出与保存 XML <span>合并保留点位，设置偏移，保留输出文件</span></a>
</div>

## 了解内置策略

侧栏的 **内置策略**可以折叠。先从[如何选择策略](../strategies/overview.md)比较三种组织方式，再查看[层次生态群落](../strategies/community.md)、[草坪点景组团](../strategies/lawn.md)和[通用行道树](../strategies/street-trees.md)的用途示意、参数与调节建议。

## 整理可复用的资源

| 我想做什么 | 阅读 |
| --- | --- |
| 给植被添加分类、缩略图和参考尺寸 | [资产库与分类](../resources/assets.md) |
| 保存策略、植被搭配与完整公开参数 | [种植方案](../resources/mixes.md) |
| 在固定样本上比较参数与植被尺度 | [效果示意](./effect-preview.md) |
| 导入策略、切换版本、确认信任 | [策略库与信任](../resources/strategies.md) |
| 理解百分比、间距和随机种子 | [参数参考](../reference/parameters.md) |

## 创作自己的内容

目前的作者路线是 **导出模板与 Skill → 在外部 Agent 中创作 → 审阅与测试 → 导入标准包**。产品内不提供策略编辑器，也不要求接入内置 Agent 才能创作。

从[创作与扩展](../authoring/overview.md)了解整体架构，以及 VFS Author 和 VFA Author 两个作者工具包。

## 遇到问题

[输入数据检查](../reference/data.md)用于排除格式与坐标问题；[常见问题](../reference/troubleshooting.md)按症状提供排查顺序；[备份与更新](../reference/backup.md)说明用户数据与项目数据的区别。

<div class="version-note">本指南于 2026-10-20 对照 0.3.1 源码更新；目前已核验的最近本地便携包为 0.3.0。部分流程截图来自旧版，以正文和新版配图为准。版本、包与公开下载状态见更新说明。</div>
