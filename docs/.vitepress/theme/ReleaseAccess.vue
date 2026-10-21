<script setup lang="ts">
import { withBase } from 'vitepress';
import { Download, ArrowUpRight, Package } from '@lucide/vue';
declare const __RELEASE_URL__: string;
const candidate = __RELEASE_URL__;
const releaseUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases(?:\/|$)/.test(candidate) ? candidate : '';
</script>

<template>
  <div class="release-callout">
    <Package :size="32" />
    <div v-if="releaseUrl">
      <h2>从 GitHub 获取 VerdFlow</h2>
      <p>请阅读对应发布说明，选择适合的 Windows 便携包。</p>
      <a class="site-button solid" :href="releaseUrl" target="_blank" rel="noopener noreferrer"><Download :size="17" />前往 GitHub Releases<ArrowUpRight :size="16" /></a>
    </div>
    <div v-else>
      <h2>当前为 Windows 内测</h2>
      <p>通过现有内测渠道获取便携包。正式开源后，这里会接入 GitHub Releases；目前不提供公开安装包下载。</p>
      <a class="site-button secondary" :href="withBase('/guide/install.html')">查看安装与准备<ArrowUpRight :size="16" /></a>
    </div>
  </div>
</template>
