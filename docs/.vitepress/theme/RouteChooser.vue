<script setup lang="ts">
import { ArrowUpRight, FileBox, Layers, MousePointer2, Check } from '@lucide/vue';
import { withBase } from 'vitepress';

const routes = [
  { number: '01', icon: MousePointer2, title: '在 DTS 中直接种植', format: 'DTS EXPLORER', summary: '已经打开场景？绘制选区或导入 SHP，让种植结果直接回到场景。', points: ['绘制多个选区', '选择策略与植被搭配', '采样并回写场景'], link: '/workflows/live.html', color: 'mint' },
  { number: '02', icon: FileBox, title: '从 FBX 模型开始', format: 'FBX MODEL', summary: '从模型中提取绿地区域，分批规划植被，在预览中确认后输出。', points: ['按材质提取绿地', '多批次种植与预览', '合并输出 DTS XML'], link: '/workflows/fbx.html', color: 'blue' },
  { number: '03', icon: Layers, title: '使用地理区域数据', format: 'SHP / GEOJSON + TIF', summary: '区域已经准备好了？配合对齐的高程栅格，直接进入种植流程。', points: ['使用已对齐的米制数据', '选择 Polygon 区域', '采样高程并输出 XML'], link: '/workflows/geospatial.html', color: 'amber' },
];
</script>

<template>
  <div class="route-grid">
    <a v-for="route in routes" :key="route.number" :href="withBase(route.link)" :class="['route-card', route.color]">
      <div class="route-top"><component :is="route.icon" :size="24" :stroke-width="1.6" /><span>{{ route.number }}</span></div>
      <span class="route-format">{{ route.format }}</span>
      <h3>{{ route.title }}</h3>
      <p>{{ route.summary }}</p>
      <ul><li v-for="point in route.points" :key="point"><Check :size="14" />{{ point }}</li></ul>
      <div class="route-bottom">查看操作指南<ArrowUpRight :size="18" /></div>
    </a>
  </div>
</template>
