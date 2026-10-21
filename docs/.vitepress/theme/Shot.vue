<script setup lang="ts">
import { ref } from 'vue';
import { withBase } from 'vitepress';
import { X, Maximize2 } from '@lucide/vue';

defineProps<{ src: string; alt: string; caption?: string; compact?: boolean }>();
const dialog = ref<HTMLDialogElement | null>(null);
const open = () => dialog.value?.showModal();
const close = () => dialog.value?.close();
</script>

<template>
  <figure class="manual-shot" :class="{ compact }">
    <button class="shot-trigger" type="button" :aria-label="`放大截图：${alt}`" @click="open">
      <img :src="withBase(src)" :alt="alt" loading="lazy" width="1440" height="960" />
      <span class="shot-zoom" aria-hidden="true"><Maximize2 :size="16" /></span>
    </button>
    <figcaption v-if="caption">{{ caption }}</figcaption>
    <dialog ref="dialog" class="shot-dialog" :aria-label="alt" @click="close">
      <button type="button" class="shot-close" aria-label="关闭放大截图" @click.stop="close"><X :size="22" /></button>
      <img :src="withBase(src)" :alt="alt" @click.stop />
      <p v-if="caption">{{ caption }}</p>
    </dialog>
  </figure>
</template>
