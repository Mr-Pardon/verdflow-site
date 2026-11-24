<script setup lang="ts">
import { Download, ArrowUpRight, Package } from '@lucide/vue';
</script>

<template>
  <div class="release-callout">
    <Package :size="32" />
    <div>
      <h2>VerdFlow Studio</h2>
      <p>Windows x64 免安装便携版。在 Releases 列表选取最新正式版，下载 ZIP 并查看版本说明与校验信息。</p>
      <a class="site-button solid" href="https://github.com/Mr-Pardon/VerdFlow/releases" target="_blank" rel="noopener noreferrer"><Download :size="17" />前往 GitHub Releases<ArrowUpRight :size="16" /></a>
    </div>
  </div>
</template>
