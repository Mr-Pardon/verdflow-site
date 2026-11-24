<script setup lang="ts">
import { ArrowLeft, ArrowRight, ArrowUpRight, FileBox, Image, Layers, MousePointer2, Check } from '@lucide/vue';
import { withBase } from 'vitepress';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{ detailed?: boolean }>();

const routes = [
  { number: '01', icon: MousePointer2, title: '在 DTS 中直接种植', format: 'DTS EXPLORER', summary: '已经打开场景？使用面选区或绘制路径，让种植结果直接回到场景。', points: ['选面或绘制开放折线', '选择策略与植被搭配', '采样并回写场景'], needs: '受支持的 Explorer、可用场景和植被模型', result: '植被写入当前场景，可保存 Explorer 工程', link: '/workflows/live.html', color: 'mint' },
  { number: '02', icon: FileBox, title: '从 FBX 模型开始', format: 'FBX MODEL', summary: '从带绿地材质的模型提取区域，在预览中确认后输出。', points: ['按材质提取绿地', '多批次种植与预览', '合并输出 DTS XML'], needs: '本机 Blender、可识别的绿地材质', result: '项目点位预览和 DTS XML', link: '/workflows/fbx.html', color: 'blue' },
  { number: '03', icon: Image, title: '从影像识别绿地', format: 'RGB GEOTIFF + TIF', summary: '只有影像，还没有绿地面？先在本机识别并确认范围。', points: ['本机识别候选绿地', '复核边界与留白', '确认范围后生成点位'], needs: '同一米制投影的地形影像与高程、有效高程覆盖', result: '已确认的种植区域、项目点位预览和 DTS XML', link: '/workflows/imagery.html', color: 'pine' },
  { number: '04', icon: Layers, title: '从 SHP 数据开始', format: 'SHP + TIF', summary: '已有划好的种植范围？导入区域和高程，直接进入种植流程。', points: ['导入已有种植区域', '选择本次要种的区域', '采样高程并输出 XML'], needs: 'SHP 区域面和同一区域的高程 TIF', result: '项目点位预览和 DTS XML', link: '/workflows/geospatial.html', color: 'amber' },
];

const track = ref<HTMLElement>();
const atStart = ref(true);
const atEnd = ref(false);
let resizeObserver: ResizeObserver | undefined;

function syncScroll() {
  const rail = track.value;
  if (!rail) return;
  atStart.value = rail.scrollLeft <= 1;
  atEnd.value = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1;
}

function scrollCards(direction: -1 | 1) {
  const rail = track.value;
  if (!rail || (direction < 0 ? atStart.value : atEnd.value)) return;
  const [first, second] = rail.children;
  const distance = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  rail.scrollBy({ left: direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

onMounted(() => {
  if (props.detailed || !track.value) return;
  syncScroll();
  resizeObserver = new ResizeObserver(syncScroll);
  resizeObserver.observe(track.value);
});
onUnmounted(() => resizeObserver?.disconnect());
</script>

<template>
  <div v-if="!detailed" class="route-controls" role="group" aria-label="浏览种植路线">
    <button type="button" aria-controls="home-route-track" :aria-disabled="atStart" aria-label="上一条路线" title="上一条路线" @click="scrollCards(-1)"><ArrowLeft :size="18" aria-hidden="true" /></button>
    <button type="button" aria-controls="home-route-track" :aria-disabled="atEnd" aria-label="下一条路线" title="下一条路线" @click="scrollCards(1)"><ArrowRight :size="18" aria-hidden="true" /></button>
  </div>
  <div ref="track" :id="detailed ? undefined : 'home-route-track'" class="route-grid" :class="detailed ? 'route-grid-detailed' : 'route-track'" @scroll.passive="syncScroll">
    <a v-for="route in routes" :key="route.number" :href="withBase(route.link)" :class="['route-card', route.color]">
      <div class="route-top"><component :is="route.icon" :size="24" :stroke-width="1.6" /><span>{{ route.number }}</span></div>
      <span class="route-format">{{ route.format }}</span>
      <h3>{{ route.title }}</h3>
      <p>{{ route.summary }}</p>
      <dl v-if="detailed" class="route-facts">
        <div><dt>需要准备</dt><dd>{{ route.needs }}</dd></div>
        <div><dt>完成后</dt><dd>{{ route.result }}</dd></div>
      </dl>
      <ul v-else><li v-for="point in route.points" :key="point"><Check :size="14" />{{ point }}</li></ul>
      <div class="route-bottom">查看操作指南<ArrowUpRight :size="18" /></div>
    </a>
  </div>
</template>

<style scoped>
.route-controls { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
.route-controls button { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #cddbd3; border-radius: 6px; color: #28624f; background: #fff; }
.route-controls button:hover:not([aria-disabled='true']) { background: #ecf5ef; border-color: #8eaf9d; }
.route-controls button[aria-disabled='true'] { opacity: .42; cursor: default; }
.route-track { position: relative; grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: calc((100% - 76px) / 3); overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px 0 12px; scrollbar-width: none; }
.route-track::-webkit-scrollbar { display: none; }
.route-track .route-card { scroll-snap-align: start; }
.route-track .route-card:focus-visible { outline-offset: -3px; }
.route-card.pine .route-top svg { color: #58756b; }
.vp-doc .route-grid-detailed { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.vp-doc .route-grid-detailed .route-card { font-weight: 400; text-decoration: none; }
.route-grid-detailed .route-card:hover .route-bottom, .route-grid-detailed .route-card:focus-visible .route-bottom { text-decoration: underline; text-underline-offset: 4px; }
.route-grid-detailed .route-top { margin-bottom: 16px; }
.vp-doc .route-grid-detailed .route-card > p { min-height: 0; margin: 8px 0 14px; }
.route-facts { display: grid; gap: 8px; margin: 0 0 16px; font-size: 12px; line-height: 1.65; }
.route-facts > div { display: grid; grid-template-columns: 4.5em minmax(0, 1fr); gap: 8px; }
.route-facts dt { font-weight: 600; }
.route-facts dd { margin: 0; color: #536f62; }
@media (min-width: 1200px) {
  .route-controls { display: none; }
  .route-track { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-flow: row; overflow: visible; padding: 0; }
}
@media (max-width: 1050px) { .route-track { grid-auto-columns: calc((100% - 62px) / 2); } }
@media (max-width: 767px) {
  .route-track { grid-auto-columns: min(86%, 340px); }
  .vp-doc .route-grid-detailed { grid-template-columns: minmax(0, 1fr); }
}
</style>
