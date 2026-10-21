<script setup lang="ts">
import { withBase } from 'vitepress';
</script>

<template>
  <p class="content-license">
    正文采用 CC BY 4.0
    <span aria-hidden="true">·</span>
    <a :href="withBase('/license.html')">许可与署名</a>
  </p>
</template>

<style scoped>
.content-license {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin-top: 28px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.8;
}
.content-license a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.content-license a:hover { color: var(--vp-c-brand-2); }
</style>
