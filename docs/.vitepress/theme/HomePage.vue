<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { withBase } from 'vitepress';
import { ArrowRight, ArrowUpRight, Layers, Trees, Download, Play, Check, Box, Shuffle, ScanLine, Workflow } from '@lucide/vue';
import ScreenshotCompare from './ScreenshotCompare.vue';
import RegionRouteTabs from './RegionRouteTabs.vue';

const activeStep = ref(0);
async function moveStep(direction: number) {
  activeStep.value = (activeStep.value + direction + steps.length) % steps.length;
  await nextTick();
  document.getElementById(`step-tab-${activeStep.value}`)?.focus();
}
const steps = [
  { title: '选一套方案', icon: Layers, image: '/media/studio-resource-center.webp', width: 1685, height: 935, heading: '在资源中心找到适合的资源与方案。', detail: '花坛点景、草坪铺设或大范围林地，从适合的方案开始。方案已保存种植方式、植被搭配和参数，不必从头配一遍。', link: '/resources/center.html', label: '获取种植方案', alt: 'VerdFlow Studio 资源中心内的种植方案、资产库与策略卡片', caption: 'Studio 资源中心实拍：浏览种植方案、资产库与策略。' },
  {
    title: '确认种植区域', icon: ScanLine, heading: '决定把方案用在哪些区域。', detail: '可以直接在 DTS 场景选区，也可以在工作台从模型、影像或已有的区域数据准备种植范围。', link: '#paths', label: '选择种植路线', regionRoutes: true,
  },
  {
    title: '看落地效果', icon: Trees, heading: '从预设方案，到场景里的植被。', detail: '在 DTS 实时种植里，选好区域和方案后即可写入当前场景。', link: '/demo.html', label: '观看完整演示',
    comparison: {
      title: '种植前后对照', sliderLabel: '种植前后显示比例', initialPosition: 58,
      caption: '同一 DTS 场景的种植前后实拍。',
      images: {
        leftSrc: '/media/dts-planting-after.webp', leftAlt: '种植后，滨水步道与道路旁分布着乔木和棕榈', leftLabel: '种植后',
        rightSrc: '/media/dts-planting-before.webp', rightAlt: '种植前，同一滨水场景的道路和草地', rightLabel: '种植前',
      },
    },
  },
];
</script>

<template>
  <main class="site-home">
    <section class="home-hero">
      <img class="hero-landscape" :src="withBase('/media/landscape-hero.webp')" alt="由主景乔木、灌木与草坪形成层次的空间种植概念示意" width="1672" height="941" fetchpriority="high" />
      <div class="hero-shade"></div>
      <div class="hero-inner">
        <div class="hero-eyebrow"><span></span> VEGETATION · SPACE · FLOW</div>
        <h1>VerdFlow<span>让种植，回到空间。</span></h1>
        <p>连接区域数据、种植策略与植被搭配。<br />把一片绿地，变成可预览、可调整的种植方案。</p>
        <div class="hero-actions">
          <a class="site-button light" :href="withBase('/guide/start.html')">开始第一次种植<ArrowUpRight :size="18" /></a>
          <a class="hero-text-link" :href="withBase('/demo.html')"><Play :size="17" aria-hidden="true" />观看演示</a>
        </div>
        <div class="hero-meta"><span>Windows x64 便携版</span><span>DTS 场景工作流</span><span>1.3.0 用户手册</span></div>
      </div>
      <a class="hero-scroll" href="#planting-plan"><ArrowRight :size="17" aria-hidden="true" /><span>查看种植流程</span></a>
    </section>

    <section id="planting-plan" class="home-workbench">
      <div class="home-section">
        <div class="section-heading"><div><span class="section-kicker">START WITH A PLANTING PLAN</span><h2>从现成方案开始种植。</h2></div><a class="section-link" :href="withBase('/resources/mixes.html')">了解种植方案<ArrowUpRight :size="17" /></a></div>
        <div class="workbench-tabs" role="tablist" aria-label="预设种植方案演示">
          <button v-for="(step, index) in steps" :key="step.title" :id="`step-tab-${index}`" type="button" role="tab" :aria-selected="activeStep === index" :tabindex="activeStep === index ? 0 : -1" aria-controls="workbench-panel" :class="{ active: activeStep === index }" @click="activeStep = index" @keydown.right.prevent="moveStep(1)" @keydown.left.prevent="moveStep(-1)">
            <span class="step-index">0{{ index + 1 }}</span><component :is="step.icon" :size="18" />{{ step.title }}
          </button>
        </div>
        <div id="workbench-panel" role="tabpanel" :aria-labelledby="`step-tab-${activeStep}`">
          <div class="workbench-copy">
            <div><h3>{{ steps[activeStep].heading }}</h3><p>{{ steps[activeStep].detail }}</p></div>
            <a class="section-link" :href="withBase(steps[activeStep].link)">{{ steps[activeStep].label }}<ArrowUpRight :size="17" /></a>
          </div>
          <Shot v-if="steps[activeStep].image" :src="steps[activeStep].image" :alt="steps[activeStep].alt" :caption="steps[activeStep].caption" :width="steps[activeStep].width" :height="steps[activeStep].height" />
          <RegionRouteTabs v-else-if="steps[activeStep].regionRoutes" />
          <ScreenshotCompare v-else-if="steps[activeStep].comparison" :key="activeStep" v-bind="steps[activeStep].comparison" />
        </div>
      </div>
    </section>

    <section id="paths" class="home-section paths-section">
      <div class="section-heading"><div><span class="section-kicker">ONE FLOW, DIFFERENT STARTS</span><h2>从已有数据开始。</h2></div><p>直接在 DTS 场景选区，或从 FBX、影像与 SHP 开始。<br class="desktop-break" />按手头的数据选择适合的种植路线。</p></div>
      <RouteChooser />
    </section>

    <section class="home-section principles-section">
      <div class="section-heading"><div><span class="section-kicker">A CLEARER WAY TO PLANT</span><h2>自由调整，也有清晰边界。</h2></div></div>
      <div class="principle-grid">
        <article><Shuffle :size="25" /><h3>策略与植被分开</h3><p>同一种空间组织，可以搭配不同植被。一个角色，也可以按权重分配多种资产。</p><a :href="withBase('/authoring/roles.html')">理解空间角色<ArrowRight :size="15" /></a></article>
        <article><ScanLine :size="25" /><h3>按批次完成大场景</h3><p>继续种植其他区域，在点位预览中统一筛选。最终输出保留的点位，不必重做整片场景。</p><a :href="withBase('/manual/batches.html')">管理种植批次<ArrowRight :size="15" /></a></article>
        <article><Box :size="25" /><h3>资源可以整理与复用</h3><p>在 Studio 中查找和导入策略、资产库与种植方案。</p><a href="https://mr-pardon.github.io/verdflow-resources/" target="_blank" rel="noopener noreferrer">浏览资源中心<ArrowUpRight :size="15" aria-hidden="true" /></a></article>
      </div>
    </section>

    <section class="home-authoring">
      <div class="home-section authoring-inner">
        <div>
          <span class="section-kicker">CREATE & CONNECT</span>
          <h2>不止使用，也能扩展。</h2>
          <p>理解区域、策略与目标工具如何协作。<br />创作自己的种植方式，让成果回到可复用的工作流。</p>
          <a class="site-button outline" :href="withBase('/authoring/overview.html')">探索创作与扩展<ArrowUpRight :size="18" /></a>
        </div>
        <div class="authoring-list">
          <a :href="withBase('/authoring/architecture.html')"><span class="kit-code"><Workflow :size="22" aria-hidden="true" /></span><div><h3>架构与扩展</h3><p>一条共用流程，连接不同来源与工具</p></div><ArrowUpRight :size="21" /></a>
          <a :href="withBase('/authoring/strategy.html')"><span class="kit-code">VFS</span><div><h3>VFS Author</h3><p>定义角色、分布算法与可调参数</p></div><ArrowUpRight :size="21" /></a>
          <a :href="withBase('/authoring/assets.html')"><span class="kit-code">VFA</span><div><h3>VFA Author</h3><p>将植被资料整理成标准资产包</p></div><ArrowUpRight :size="21" /></a>
          <p class="authoring-note"><Check :size="14" />作者工具包现已提供，更多工具接入持续探索。</p>
        </div>
      </div>
    </section>

    <section class="home-section closing-section"><span class="section-kicker">YOUR FIRST PLANTING</span><h2>下一片绿地，从这里开始。</h2><p>选一条适合你的路线，完成第一次种植。</p><div class="closing-actions"><a class="site-button solid" :href="withBase('/guide/start.html')">快速开始<ArrowRight :size="18" /></a><a class="site-button secondary" :href="withBase('/download.html')"><Download :size="17" />获取 VerdFlow</a></div><span class="closing-note">VerdFlow Studio · Windows x64 免安装便携版</span></section>
  </main>
</template>
