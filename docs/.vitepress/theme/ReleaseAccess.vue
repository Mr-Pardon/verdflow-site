<script setup lang="ts">
import { Download, ArrowUpRight, Package } from '@lucide/vue';
declare const __RELEASE_URL__: string;
const releaseUrl = __RELEASE_URL__;
</script>

<template>
  <div class="release-callout">
    <Package :size="32" />
    <div>
      <h2>VerdFlow 1.0.0</h2>
      <p>Windows x64 免安装便携版。进入发布页下载 ZIP，查看版本说明与校验信息。</p>
      <a class="site-button solid" :href="releaseUrl" target="_blank" rel="noopener noreferrer"><Download :size="17" />前往 GitHub Releases<ArrowUpRight :size="16" /></a>
    </div>
  </div>
</template>
