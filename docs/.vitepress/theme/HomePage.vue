<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { withBase } from 'vitepress';
import { ArrowRight, ArrowUpRight, Layers, Trees, SlidersHorizontal, Download, Play, Check, Box, Shuffle, ScanLine, Workflow } from '@lucide/vue';

const activeStep = ref(0);
async function moveStep(direction: number) {
  activeStep.value = (activeStep.value + direction + steps.length) % steps.length;
  await nextTick();
  document.getElementById(`step-tab-${activeStep.value}`)?.focus();
}
const steps = [
  { title: '选择种植方式', icon: Layers, image: '/media/studio-strategies.webp', heading: '先决定空间如何组织。', detail: '层次群落、草坪点景、行道树。用策略描述空间关系，让每一种植被承担合适的构图职责。', link: '/resources/strategies.html', label: '认识种植策略' },
  { title: '配置植被搭配', icon: Trees, image: '/media/live-mapping-v031.webp', heading: '把空间角色，交给具体植被。', detail: '跨资产库选择合适的植物，调整权重、缩放与用途开关。将搭配和公开参数一起保存成方案，下次直接复用。', link: '/resources/mixes.html', label: '了解种植方案' },
  { title: '调整效果与预览', icon: SlidersHorizontal, image: '/media/studio-point-preview-overview.png', heading: '看得见，才更好调整。', detail: '调节公开参数与随机种子，按批次和资产检查点位。保留需要的结果，再统一进行高程采样与 XML 输出。', link: '/manual/batches.html', label: '查看预览与批次' },
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
        <div class="hero-meta"><span>Windows x64 便携版</span><span>DTS 场景工作流</span><span>1.0.0 用户手册</span></div>
      </div>
      <a class="hero-scroll" href="#paths" aria-label="了解种植路线"><ArrowRight :size="17" /><span>探索你的种植路线</span></a>
    </section>

    <section id="paths" class="home-section paths-section">
      <div class="section-heading"><div><span class="section-kicker">ONE FLOW, DIFFERENT STARTS</span><h2>从你已有的数据开始。</h2></div><p>无论在场景中选面，还是从模型与地理数据出发，<br class="desktop-break" />都能汇入同一条种植工作流。</p></div>
      <RouteChooser />
    </section>

    <section class="home-workbench">
      <div class="home-section">
        <div class="section-heading"><div><span class="section-kicker">DESIGN, THEN REFINE</span><h2>从构图，到每一株植被。</h2></div><a class="section-link" :href="withBase('/manual/concepts.html')">理解三个核心概念<ArrowUpRight :size="17" /></a></div>
        <div class="workbench-tabs" role="tablist" aria-label="种植工作流演示">
          <button v-for="(step, index) in steps" :key="step.title" :id="`step-tab-${index}`" type="button" role="tab" :aria-selected="activeStep === index" :tabindex="activeStep === index ? 0 : -1" aria-controls="workbench-panel" :class="{ active: activeStep === index }" @click="activeStep = index" @keydown.right.prevent="moveStep(1)" @keydown.left.prevent="moveStep(-1)">
            <span class="step-index">0{{ index + 1 }}</span><component :is="step.icon" :size="18" />{{ step.title }}
          </button>
        </div>
        <div id="workbench-panel" class="workbench-copy" role="tabpanel" :aria-labelledby="`step-tab-${activeStep}`">
          <div><h3>{{ steps[activeStep].heading }}</h3><p>{{ steps[activeStep].detail }}</p></div>
          <a class="section-link" :href="withBase(steps[activeStep].link)">{{ steps[activeStep].label }}<ArrowUpRight :size="17" /></a>
        </div>
        <Shot :src="steps[activeStep].image" :alt="steps[activeStep].title + '的 VerdFlow 界面'" :caption="activeStep === 2 ? '用户提供的 Studio 项目预览 · 查看整体区域与植被分布' : activeStep === 1 ? '实时搭配工作区 · 真实组件与隔离演示植被' : '种植方式配置示例 · 支持预设方案与手动配置双入口'" />
      </div>
    </section>

    <section class="home-section principles-section">
      <div class="section-heading"><div><span class="section-kicker">A CLEARER WAY TO PLANT</span><h2>自由调整，也有清晰边界。</h2></div></div>
      <div class="principle-grid">
        <article><Shuffle :size="25" /><h3>策略与植被分开</h3><p>同一种空间组织，可以搭配不同植被。一个角色，也可以按权重分配多种资产。</p><a :href="withBase('/authoring/roles.html')">理解空间角色<ArrowRight :size="15" /></a></article>
        <article><ScanLine :size="25" /><h3>按批次完成大场景</h3><p>继续种植其他区域，在点位预览中统一筛选。最终输出保留的点位，不必重做整片场景。</p><a :href="withBase('/manual/batches.html')">管理种植批次<ArrowRight :size="15" /></a></article>
        <article><Box :size="25" /><h3>资源可以整理与复用</h3><p>浏览现成的策略与资产库，查看版本与使用说明，也可以整理自己的资源与植被搭配。</p><a href="https://mr-pardon.github.io/verdflow-resources/" target="_blank" rel="noopener noreferrer">前往资源中心<ArrowUpRight :size="15" aria-hidden="true" /></a></article>
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

    <section class="home-section closing-section"><span class="section-kicker">YOUR FIRST PLANTING</span><h2>下一片绿地，从这里开始。</h2><p>选一条适合你的路线，完成第一次种植。</p><div class="closing-actions"><a class="site-button solid" :href="withBase('/guide/start.html')">选择上手路线<ArrowRight :size="18" /></a><a class="site-button secondary" :href="withBase('/download.html')"><Download :size="17" />获取 VerdFlow</a></div><span class="closing-note">VerdFlow 1.0.0 · Windows x64 免安装便携版</span></section>
  </main>
</template>
