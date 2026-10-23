---
title: 获取 VerdFlow
sidebar: false
outline: false
---

<span class="doc-eyebrow">GET VERDFLOW</span>

# 获取 VerdFlow

<p class="lead">先从一个小范围开始，验证适合你的种植路线。</p>

<ReleaseAccess />

## 版本与平台

本手册适用于 **VerdFlow 1.0.0**。客户端为 **Windows x64 免安装便携版**，支持 DTS 实时种植，以及 FBX / 地理空间项目到 DTS XML 的输出工作流。

在 Releases 的对应版本页面选择 Windows 便携包，完整解压后运行 **VerdFlow Studio.exe**。策略包、资产库与种植方案从 [资源中心](https://mr-pardon.github.io/verdflow-resources/)获取，按各自版本和依赖导入。

## 使用前准备

- DTS 实时路线需要 Explorer 7.1.0730 及之后版本、可用场景和实时连接配置。
- FBX 路线需要本机可用的 Blender。
- 地理空间路线需要已经对齐的米制面数据与 GeoTIFF 高程。
- 目标植被模型需要在 DTS 中实际可用；`.vfa` 不安装模型。

继续阅读[安装与准备](./guide/install.md)或[选择上手路线](./guide/start.md)。

## 更新与数据

用户数据保存在 `%LOCALAPPDATA%\VerdFlow`，项目保存位置由创建时选择。升级前请分别备份，详见[数据备份与更新](./reference/backup.md)。

版本能力与升级注意事项见[更新说明](./updates.md)。
