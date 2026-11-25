<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import { ArrowUpRight, FileBox, Image, Layers, MousePointer2, Pause, Play } from '@lucide/vue';
import Shot from './Shot.vue';

const routes = [
  {
    id: 'live', label: '实时种植', icon: MousePointer2,
    file: 'home-region-live.webp', width: 1914, height: 1079,
    alt: 'DTS 实时种植面板的拾取绿地、绘制与导入工具，及场景中高亮的种植范围',
    caption: 'DTS 实拍：在场景中绘制选区、拾取绿地或导入 SHP。图中笔刷提示为旧版，操作以指南为准。',
  },
  {
    id: 'fbx', label: '模型材质提取', icon: FileBox, project: 'FBX 模型材质提取',
    file: 'home-region-fbx.webp', width: 1694, height: 850,
    alt: 'FBX 模型提取后的工作台选区画布，按普通绿地和行道树绿地分类显示',
    caption: 'Studio 实拍：按材质从 FBX 模型提取绿地，在工作台选择本次种植区域。',
  },
  {
    id: 'imagery', label: '影像提取', icon: Image, project: '影像绿地提取',
    file: 'home-region-imagery.webp', width: 1693, height: 849,
    alt: '地形影像上叠加识别出的候选绿地，右侧面板可调整种植范围和留白',
    caption: 'Studio 实拍：从地形影像识别候选绿地，复核边界和留白后确认范围。',
  },
  {
    id: 'geospatial', label: 'SHP 导入', icon: Layers, project: 'SHP 大范围区域导入',
    file: 'home-region-shp.webp', width: 1694, height: 846,
    alt: '导入大范围 SHP 后的工作台选区画布，突出显示本次所选的部分面',
    caption: 'Studio 实拍：导入已有的 SHP 面与高程，从大范围数据中选择本次要种的区域。',
  },
];
const active = ref(0);
const section = ref<HTMLElement>();
const tablist = ref<HTMLElement>();
const rotationButton = ref<HTMLButtonElement>();
const playing = ref(true);
const inView = ref(false);
const hovering = ref(false);
const pageVisible = ref(false);
let stopObserving: (() => void) | undefined;

watch([playing, inView, hovering, pageVisible], ([enabled, visible, over, foreground], _, onCleanup) => {
  if (!enabled || !visible || over || !foreground) return;
  const timer = window.setInterval(() => { active.value = (active.value + 1) % routes.length; }, 6000);
  onCleanup(() => window.clearInterval(timer));
});

onMounted(() => {
  if (!section.value) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => { if (motion.matches) playing.value = false; };
  const syncVisibility = () => { pageVisible.value = document.visibilityState === 'visible'; };
  syncMotion();
  syncVisibility();
  motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncVisibility);

  const observer = new IntersectionObserver(([entry]) => {
    inView.value = entry.intersectionRatio >= 0.25;
  }, { threshold: 0.25 });
  observer.observe(section.value);
  stopObserving = () => {
    observer.disconnect();
    motion.removeEventListener('change', syncMotion);
    document.removeEventListener('visibilitychange', syncVisibility);
  };
});
onUnmounted(() => stopObserving?.());

function selectRoute(index: number) {
  playing.value = false;
  active.value = index;
}

function onFocus(event: FocusEvent) {
  if (event.target !== rotationButton.value) playing.value = false;
}

async function onTabKey(event: KeyboardEvent) {
  const offsets = { ArrowLeft: -1, ArrowRight: 1 };
  if (event.key === 'Home') selectRoute(0);
  else if (event.key === 'End') selectRoute(routes.length - 1);
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    selectRoute((active.value + offsets[event.key] + routes.length) % routes.length);
  } else return;
  event.preventDefault();
  await nextTick();
  tablist.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
}
</script>

<template>
  <div
    ref="section"
    class="region-routes"
    @focusin="onFocus"
    @pointerenter="hovering = $event.pointerType === 'mouse' || $event.pointerType === 'pen'"
    @pointerleave="hovering = false"
  >
    <div class="region-route-bar">
      <div ref="tablist" class="region-route-tabs" role="tablist" aria-label="确认区域的方式" @keydown="onTabKey">
        <button
          v-for="(route, index) in routes"
          :id="`region-route-${route.id}-tab`"
          :key="route.id"
          type="button"
          role="tab"
          :aria-selected="active === index"
          :aria-controls="`region-route-${route.id}-panel`"
          :tabindex="active === index ? 0 : -1"
          @click="selectRoute(index)"
        >
          <component :is="route.icon" :size="16" aria-hidden="true" />
          <span>{{ route.label }}</span>
        </button>
      </div>
      <button
        ref="rotationButton"
        class="region-route-rotation"
        type="button"
        :aria-label="playing ? '暂停自动切换' : '开启自动切换'"
        :title="playing ? '暂停自动切换' : '开启自动切换'"
        @click="playing = !playing"
      >
        <Pause v-if="playing" :size="16" aria-hidden="true" />
        <Play v-else :size="16" aria-hidden="true" />
      </button>
    </div>
    <div
      v-for="(route, index) in routes"
      :id="`region-route-${route.id}-panel`"
      :key="route.id"
      role="tabpanel"
      :aria-labelledby="`region-route-${route.id}-tab`"
      :hidden="active !== index"
    >
      <template v-if="active === index">
        <Shot :src="`/media/${route.file}`" :width="route.width" :height="route.height" :alt="route.alt" :caption="route.caption">
          <template v-if="route.project" #header>
            <span class="region-project-title">
              <span>DTS 项目</span>
              <strong>{{ route.project }}</strong>
            </span>
          </template>
        </Shot>
        <a class="section-link region-route-link" :href="withBase(`/workflows/${route.id}.html`)">查看{{ route.label }}指南<ArrowUpRight :size="16" aria-hidden="true" /></a>
      </template>
    </div>
  </div>
</template>

<style scoped>
.region-route-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px; padding: 4px; margin-bottom: 14px; border: 1px solid #d6e2d9; border-radius: 6px; background: #eaf0ea; }
.region-route-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.region-route-tabs button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 6px; border: 1px solid transparent; border-radius: 4px; color: #536e61; font-size: 13px; line-height: 1.4; }
.region-route-tabs button svg { flex: none; }
.region-route-rotation { display: grid; place-items: center; width: 44px; height: 42px; border: 1px solid #d6e2d9; border-radius: 4px; color: #346650; }
.region-route-tabs button:hover, .region-route-rotation:hover { background: #f6f9f6; color: #215d49; }
.region-route-tabs button[aria-selected="true"] { background: #fff; border-color: #a8c6b6; color: #175740; font-weight: 600; }
.region-route-tabs button:focus-visible, .region-route-rotation:focus-visible { outline: 2px solid #297a61; outline-offset: -2px; }
.region-project-title { display: grid; gap: 2px; padding: 8px 2.2%; background: #f1f5f4; color: #152b32; text-align: left; }
.region-project-title span { color: #546d6a; font-size: 10px; line-height: 1.25; }
.region-project-title strong { font-size: 15px; line-height: 1.35; }
.region-route-link { display: flex; justify-content: center; width: fit-content; margin: 9px auto 0; }
@media (max-width: 550px) {
  .region-route-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .region-route-tabs button { min-height: 44px; }
  .region-project-title { padding-block: 5px; }
  .region-project-title strong { font-size: 12px; }
}
@media (max-width: 380px) {
  .region-route-tabs button svg { display: none; }
}
</style>
