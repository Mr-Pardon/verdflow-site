---
title: 获取 VerdFlow
sidebar: false
outline: false
---

<span class="doc-eyebrow">GET VERDFLOW</span>

# 获取 VerdFlow

<p class="lead">先从一个小范围开始，验证适合你的种植路线。</p>

<ReleaseAccess />

## 当前版本说明

本站当前对照 **0.3.1 源码基线**编写，已核验的最近 Git 标签和本地便携包为 **0.3.0**。手册版本不代表对应包已经公开发布；请按实际获得的软件及策略包核对能力，差异见[更新说明](./updates.md)。

目前主要面向 Windows 与 DTS 输出工作流，不提供其他平台安装包或尚未落地的 Blender 输出承诺。

## 使用前准备

- DTS 实时路线需要可用 Explorer 场景和实时连接配置。
- FBX 路线需要本机可用的 Blender。
- 地理空间路线需要已经对齐的米制面数据与 GeoTIFF 高程。
- 目标植被模型需要在 DTS 中实际可用；`.vfa` 不安装模型。

继续阅读[安装与准备](./guide/install.md)或[选择上手路线](./guide/start.md)。

## 更新与数据

用户数据保存在 `%LOCALAPPDATA%\VerdFlow`，项目保存位置由创建时选择。升级前请分别备份，详见[数据备份与更新](./reference/backup.md)。

近期功能与开发态差异见[更新说明](./updates.md)。
