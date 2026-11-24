---
title: 获取 VerdFlow
sidebar: false
outline: false
---

<span class="doc-eyebrow">GET VERDFLOW</span>

# 获取 VerdFlow

<p class="lead">先从一个小范围开始，验证所选种植路线。</p>

<ReleaseAccess />

## 支持平台

客户端支持 DTS 实时种植，也可以从 FBX、已有区域面或地形影像创建项目并输出 DTS XML。

在发布页选择 Windows 便携包，完整解压后运行 **VerdFlow Studio.exe**。策略包、资产库与种植方案可在 [Studio 内置资源中心](./resources/center.md)按版本与依赖导入，也可在[网页版](https://mr-pardon.github.io/verdflow-resources/)查阅。

## 使用前准备

- DTS 实时路线需要 Explorer 7.1.0730 及之后版本、可用场景和植被模型。
- FBX 路线需要本机可用的 Blender。
- 地理空间路线需要已经对齐的米制面数据与 GeoTIFF 高程。
- 影像识别路线需要同一米制投影的 RGB 影像与单波段高程 GeoTIFF，无需在线模型服务。
- 目标植被模型需要在 DTS 中实际可用；`.vfa` 不安装模型。

继续阅读[安装与准备](./guide/install.md)或[快速开始](./guide/start.md)。

## 更新与数据

用户数据保存在 `%LOCALAPPDATA%\VerdFlow`，项目保存位置由创建时选择。升级前请分别备份，详见[数据备份与更新](./reference/backup.md)。

已有安装可在 **设置 → 应用更新**检查新的正式版；没有可用更新入口时，请从 Releases 下载完整便携包，解压到新目录。首次启动可通过[产品引导](./guide/first-use.md)准备推荐资源。

版本能力与升级注意事项见[更新说明](./updates.md)。
