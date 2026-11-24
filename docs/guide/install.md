---
title: 安装与准备
---

<span class="doc-eyebrow">BEFORE YOU BEGIN</span>

# 安装与准备

<p class="lead">先让数据、工具和目标场景准备就绪，再开始种植。</p>

## 获取与启动

<ReleaseAccess />

1. 在 Releases 选择标记为 **Latest** 的正式版，从 **Assets** 下载 Windows x64 便携包，不要选源码压缩包。
2. 将完整 ZIP 解压到一个可读写的目录，不要直接在压缩包内运行。
3. 打开解压目录中的 **VerdFlow Studio.exe**，无需额外安装。
4. 等待顶栏显示本地服务正常，再进入工作台或资源管理。

首次使用可跟随[产品引导](./first-use.md)准备推荐资源；已有配置的用户可从 **设置 → 产品引导**重新打开。应用更新入口位于 **设置 → 应用更新**，详见[备份与更新](../reference/backup.md#在应用内更新)。

用户数据保存在 `%LOCALAPPDATA%\VerdFlow`，种植项目则保存在创建项目时指定的目录。软件解压目录不是项目备份目录。

下载后可按发布说明中的 SHA-256 校验文件。Windows 若显示未知发布者提醒，先核对获取来源与文件校验结果，不要通过关闭系统防护来解决来源不明的文件警告。

## 按路线准备工具

| 路线 | 必需准备 | 不必为此配置 |
| --- | --- | --- |
| [DTS 实时种植](../workflows/live.md) | DTS Explorer 7.1.0730 及之后版本、可用场景和植被模型 | Blender、在线模型服务 |
| [FBX 模型种植](../workflows/fbx.md) | FBX 文件、可用的 Blender 程序路径 | Explorer、在线模型服务（可选） |
| [从影像识别绿地](../workflows/imagery.md) | 同一米制投影的 RGB GeoTIFF 和单波段高程 GeoTIFF | Explorer、Blender、在线模型服务 |
| [SHP / GeoJSON + 高程](../workflows/geospatial.md) | SHP / GeoJSON 面和配套 GeoTIFF 高程 | Explorer、Blender、在线模型服务 |

**FBX 路线推荐配置在线模型服务，优先使用 AI 辅助选择绿地材质。** 它不是硬性依赖；没有可用服务时，可以使用手动选择作为备选。

项目工作台生成 XML 不需要先连接 Explorer；等 XML 生成后，再用 DTS 做场景验收。已有区域面或影像可跳过首次引导的外部环境配置，从 **多源工作台 → DTS → DTS 项目工作台**选择对应输入。

<Shot src="/media/studio-external-runtime-settings.png" :width="1418" :height="847" alt="Studio 设置中的产品引导、应用更新和外部运行环境，包含 Blender 程序与 Explorer 安装文件夹" caption="在设置中检查外部运行环境；图中 Blender 尚未就绪，实际本机路径已遮挡。" />

### DTS 连接

在 **设置 → 外部运行环境**中配置 DTS Explorer 的根目录，并保存、检查状态。应选择同时包含 SDK 和 Explorer 程序的安装根目录，而不是只选择 exe 所在目录。

<Shot src="/media/dts-explorer-root-folder.png" :width="556" :height="268" alt="Explorer 安装根目录包含 AirCityExplorer、Engine、SDK 与 Tools 文件夹" caption="选择这一层安装目录，不要只选择程序所在的 Win64 文件夹。" />

若已自动发现可用的 Explorer，核对路径和状态即可，不必重复配置。

```text
Explorer 根目录/
  SDK/ac_conf.js
  SDK/ac.min.js
  AirCityExplorer/Binaries/Win64/DTS Explorer.exe
```

之后进入 **多源工作台 → DTS → 实时选区种植**，点击 **启动实时种植**。Explorer 启动后，可在 **偏好设置**中开启 **WebUI 控制**，启用工程右侧菜单栏的 WebUI 选项。

<Shot src="/media/dts-explorer-webui-preferences.png" :width="755" :height="598" alt="Explorer 偏好设置中的 WebUI 控制开关，黄色方框标出了需要启用的选项" caption="在 Explorer 偏好设置中启用 WebUI 控制，再从工程右侧菜单打开面板。" />

打开目标工程，在右侧菜单手动打开 **WebUI**。面板显示 **DTS Explorer 已连接**且场景地形加载完成后，即可开始选区。需要时可刷新状态、重建会话或停止服务；重建前先确认当前没有仍需完成的种植任务。

连接成功不代表场景资源已经齐备。先确认地形可以正常浏览，植被搭配中的目标模型名称能在该 DTS 场景中使用。

### Blender 路径

在设置中指定本机可用的 Blender 可执行文件。FBX 检查、绿地提取和相关高程处理需要它；不要假设便携包已经包含 Blender。

已自动发现的可用 Blender 无需重复设置。侧栏中的 Blender 工作台是规划入口，不等于已提供 Blender 场景内的完整种植功能。

### 可选模型服务

在线模型服务只用于辅助 FBX 材质分类，推荐在使用 FBX 路线前配置并测试，见 [FBX 模型服务配置](../workflows/fbx.md#可选-配置模型服务)。没有可用服务时可手动选择；影像识别使用便携包内置的本地推理，不需要这项配置。

## 先准备一套资源

推荐从[获取第一套资源](./first-use.md)开始，跟随引导一键导入，或从资源中心按需挑选。导入后仍要确认策略信任，并按详情准备配套 DTS 模型。

自带资源包或离线时，再走[手动导入](../reference/packages.md#批量导入)；也可以从[资源中心](https://mr-pardon.github.io/verdflow-resources/)下载后导入。**资产库不包含 DTS 模型。** 是否需要配套 PAK、如何获取，以资产详情为准。

::: warning 更新前先备份
关闭 Studio，备份用户数据目录和项目目录，再更换软件。API 凭证由系统凭证存储管理，不能仅靠复制用户数据文件夹保证迁移，见[备份与更新](../reference/backup.md)。
:::

## 回到快速开始

[返回第 1 步：安装并检查环境](./start.md#install)，然后继续准备第一套种植资源。
