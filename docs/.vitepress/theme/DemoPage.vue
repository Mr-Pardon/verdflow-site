<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import { withBase } from 'vitepress';
import { ArrowUpRight, LoaderCircle, Play, RotateCcw } from '@lucide/vue';

const video = ref<HTMLVideoElement>();
const activated = ref(false);
const waiting = ref(false);
const failed = ref(false);
let disposed = false;

function showError() {
  if (disposed) return;
  failed.value = true;
  waiting.value = false;
}

async function play() {
  failed.value = false;
  waiting.value = true;
  activated.value = true;
  await nextTick();
  if (!video.value || disposed) return;
  video.value.load();
  try {
    await video.value.play();
    video.value?.focus({ preventScroll: true });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    showError();
  }
}

onBeforeUnmount(() => {
  disposed = true;
  video.value?.pause();
  video.value?.removeAttribute('src');
  video.value?.load();
});
</script>

<template>
  <main class="demo-page" aria-labelledby="demo-title">
    <header class="demo-intro">
      <h1 id="demo-title">看见 VerdFlow</h1>
      <p>从选区到场景植被，看一次完整的实时种植流程。</p>
    </header>

    <figure class="demo-film" aria-labelledby="demo-film-title">
      <figcaption class="demo-film-heading">
        <h2 id="demo-film-title">DTS 实时种植演示</h2>
        <span><span class="demo-time">49</span> 秒</span>
      </figcaption>
      <div class="demo-player" :aria-busy="waiting">
        <video
          ref="video"
          :src="activated ? withBase('/media/dts-live-demo.mp4') : undefined"
          :poster="withBase('/media/dts-live-demo-poster.webp')"
          :controls="activated"
          preload="none"
          playsinline
          width="1920"
          height="1080"
          :tabindex="activated ? 0 : -1"
          aria-label="DTS 实时种植演示，49 秒"
          @playing="waiting = false"
          @waiting="waiting = true"
          @pause="waiting = false"
          @ended="waiting = false"
          @error="showError"
        />
        <button v-if="!activated" class="demo-play" type="button" aria-label="播放 DTS 实时种植演示" @click="play">
          <span class="demo-play-icon"><Play :size="30" fill="currentColor" :stroke-width="1.5" aria-hidden="true" /></span>
        </button>
        <div v-if="waiting && !failed" class="demo-loading" role="status">
          <LoaderCircle :size="30" aria-hidden="true" />
          <span class="demo-sr-only">正在加载视频</span>
        </div>
        <div v-if="failed" class="demo-error" role="alert">
          <p>视频暂时无法播放</p>
          <button type="button" @click="play"><RotateCcw :size="16" aria-hidden="true" />重新加载</button>
          <a :href="withBase('/media/dts-live-demo.mp4')">直接打开视频<ArrowUpRight :size="16" aria-hidden="true" /></a>
        </div>
      </div>
    </figure>

    <nav class="demo-next" aria-label="演示之后">
      <a :href="withBase('/workflows/live.html')">阅读实时种植指南<ArrowUpRight :size="18" aria-hidden="true" /></a>
      <a :href="withBase('/guide/start.html')">开始第一次种植<ArrowUpRight :size="18" aria-hidden="true" /></a>
    </nav>
  </main>
</template>

<style scoped>
.demo-page { width: calc(100% - 96px); max-width: 1184px; margin: 0 auto; padding: 44px 0 48px; }
.demo-intro { margin-bottom: 30px; }
.demo-intro h1 { color: #164c42; font-size: 44px; font-weight: 650; line-height: 1.3; margin: 0; }
.demo-intro p { color: #697c73; font-size: 16px; line-height: 1.8; margin: 14px 0 0; }
.demo-film { margin: 0; }
.demo-film-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-top: 1px solid #dce5df; color: #687d72; font-size: 12px; }
.demo-film-heading h2 { color: #2d5143; font-size: 14px; font-weight: 600; line-height: 1.5; margin: 0; }
.demo-film-heading>span { flex-shrink: 0; }
.demo-time { font-variant-numeric: tabular-nums; font-size: 14px; }
.demo-player { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #102b23; border-radius: 6px; overflow: hidden; }
.demo-player video { display: block; width: 100%; height: 100%; object-fit: contain; }
.demo-play { position: absolute; inset: 0; display: grid; place-items: center; width: 100%; cursor: pointer; }
.demo-play-icon { display: grid; place-items: center; width: 76px; height: 76px; border-radius: 50%; background: rgb(15 57 46 / 92%); border: 1px solid rgb(255 255 255 / 70%); color: #fff; box-shadow: 0 4px 24px #061f2830; transition: background .2s; }
.demo-play-icon svg { margin-left: 4px; }
.demo-play:hover .demo-play-icon { background: #20755d; }
.demo-play:focus-visible { outline: 3px solid #b2edcf; outline-offset: -5px; }
.demo-loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: grid; place-items: center; width: 62px; height: 62px; border-radius: 50%; background: #102b23e6; color: #fff; pointer-events: none; }
.demo-loading svg { animation: demo-spin 1.2s linear infinite; }
.demo-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.demo-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; align-content: center; gap: 12px 24px; padding: 16px; background: #102b23f5; color: #e4f2e9; font-size: 14px; }
.demo-error p { width: 100%; text-align: center; margin: 0; }
.demo-error button,.demo-error a { display: inline-flex; align-items: center; gap: 8px; padding: 8px 0; color: #b0e7cb; text-decoration: underline; text-underline-offset: 4px; }
.demo-next { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #dce5df; }
.demo-next a { display: inline-flex; align-items: center; gap: 12px; color: #276853; font-size: 14px; font-weight: 500; text-decoration: none; }
.demo-next a:hover { text-decoration: underline; text-underline-offset: 5px; }
@keyframes demo-spin { to { transform: rotate(360deg); } }
@media (min-width: 960px) and (min-height: 700px) { .demo-page { max-width: min(1184px, calc((100svh - 340px) * 16 / 9)); } }
@media (max-width: 767px) {
  .demo-page { width: calc(100% - 40px); padding: 34px 0 44px; }
  .demo-intro { margin-bottom: 26px; }
  .demo-intro h1 { font-size: 32px; }
  .demo-intro p { font-size: 14px; margin-top: 12px; }
  .demo-play-icon { width: 58px; height: 58px; }
  .demo-play-icon svg { width: 24px; height: 24px; }
  .demo-next { flex-wrap: wrap; gap: 20px 28px; margin-top: 20px; }
  .demo-next a { font-size: 13px; gap: 8px; }
}
@media (prefers-reduced-motion: reduce) { .demo-loading svg { animation: none; } }
</style>
