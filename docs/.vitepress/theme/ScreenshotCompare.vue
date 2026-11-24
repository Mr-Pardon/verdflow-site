<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { Maximize2, X } from '@lucide/vue';
import ImageReveal from './ImageReveal.vue';

const props = withDefaults(defineProps<{
  images: {
    leftSrc: string;
    leftAlt: string;
    leftLabel: string;
    rightSrc: string;
    rightAlt: string;
    rightLabel: string;
  };
  title: string;
  sliderLabel: string;
  caption: string;
  initialPosition?: number;
}>(), { initialPosition: 50 });
const position = ref(props.initialPosition);
const expanded = ref(false);
const dialog = ref<HTMLDialogElement>();

async function open() {
  expanded.value = true;
  await nextTick();
  dialog.value?.showModal();
}
function close() { dialog.value?.close(); }
</script>

<template>
  <figure class="manual-shot screenshot-compare">
    <ImageReveal v-model="position" v-bind="images" :slider-label="sliderLabel">
      <button class="compare-zoom" type="button" :title="`放大${title}`" :aria-label="`放大${title}`" @click="open"><Maximize2 :size="17" /></button>
    </ImageReveal>
    <figcaption>{{ caption }}</figcaption>
    <dialog ref="dialog" class="compare-dialog" :aria-label="title" @close="expanded = false" @click.self="close">
      <header><strong>{{ title }}</strong><button type="button" :title="`关闭${title}`" :aria-label="`关闭${title}`" @click="close"><X :size="21" /></button></header>
      <ImageReveal v-if="expanded" v-model="position" v-bind="images" :slider-label="sliderLabel" />
      <p>{{ caption }}</p>
    </dialog>
  </figure>
</template>

<style scoped>
.compare-zoom { position: absolute; z-index: 4; bottom: 12px; right: 12px; display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #d3e0d8; border-radius: 4px; background: #fff; color: #416654; box-shadow: 0 1px 8px #234a3420; }
.compare-zoom:hover { background: #eef6f0; }
.compare-zoom:focus-visible { outline: 3px solid #1d755b; outline-offset: 2px; }
.compare-dialog { position: fixed; margin: auto; width: min(1600px, calc(100vw - 32px), calc(177.7778svh - 177.7778px)); max-width: calc(100vw - 20px); max-height: calc(100svh - 24px); padding: 12px; border: 0; border-radius: 6px; background: #fff; overflow: auto; }
.compare-dialog::backdrop { background: rgb(9 22 17 / 75%); }
.compare-dialog header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 10px; color: #315b4a; font-size: 14px; }
.compare-dialog header button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 4px; color: #416654; }
.compare-dialog header button:hover { background: #eef6f0; }
.compare-dialog header button:focus-visible { outline: 2px solid #1d755b; }
.compare-dialog p { margin: 10px 4px 0; color: #657c6d; font-size: 12px; line-height: 1.6; text-align: center; }
</style>
