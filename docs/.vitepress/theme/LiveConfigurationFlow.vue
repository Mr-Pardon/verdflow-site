<script setup lang="ts">
import { ArrowDown, Layers, SlidersHorizontal, ScanEye, Sprout, PanelTop } from '@lucide/vue';
</script>

<template>
  <figure class="live-configuration-flow">
    <div class="live-configuration-flow__scroll" tabindex="0" role="region" aria-label="实时种植配置流程图">
      <div class="live-flow-canvas">
        <div class="live-flow-entry">
          <PanelTop :size="18" aria-hidden="true" />
          <strong>配置入口</strong>
        </div>
        <div class="live-flow-fork" aria-hidden="true"><ArrowDown :size="17" /><ArrowDown :size="17" /></div>

        <div class="live-flow-branches">
          <section class="live-flow-node live-flow-preset">
            <strong><Layers :size="18" aria-hidden="true" /> 预设方案</strong>
            <p>在<strong>方案列表</strong>中选择或更换</p>
            <small>带回策略、植被搭配和参数</small>
          </section>
          <section class="live-flow-node live-flow-manual">
            <strong><SlidersHorizontal :size="18" aria-hidden="true" /> 手动配置</strong>
            <p>自行选择策略和植被搭配</p>
            <small>按需调整构图参数</small>
          </section>
        </div>

        <div class="live-flow-merge" aria-hidden="true"><ArrowDown :size="18" /></div>
        <div class="live-flow-result">
          <Sprout :size="20" aria-hidden="true" />
          <div><strong>确认种植范围，开始种植</strong><small>绘制或导入选区 → 高程采样 → 写入 DTS</small></div>
        </div>

        <aside class="live-flow-preview" aria-label="效果示意">
          <ScanEye :size="18" aria-hidden="true" />
          <strong>效果示意</strong>
          <span>查看固定样本，不生成当前选区结果</span>
        </aside>
      </div>
    </div>
    <figcaption>预设方案带回已有配置；需要更换植被或调整参数时，可进入手动配置。</figcaption>
  </figure>
</template>

<style scoped>
.live-configuration-flow { margin: 24px 0; }
.live-configuration-flow__scroll { overflow-x: auto; padding: 4px 0; scrollbar-color: #abc4b7 #f1f5f2; }
.live-flow-canvas { min-width: 560px; }
.live-flow-entry { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 10px 14px; width: fit-content; min-width: 170px; margin: 0 auto; border: 1px solid #d7e3eb; border-radius: 6px; background: #f1f6fa; color: #31576b; font-size: 15px; }
.live-flow-branches { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.live-flow-node { padding: 14px 16px; border: 1px solid #d5e3dc; border-radius: 6px; background: #f1f7f3; }
.live-flow-manual { background: #faf7ef; border-color: #e8dfca; }
.live-flow-node > strong { display: flex; align-items: center; gap: 7px; font-size: 15px; color: #2c594d; }
.live-flow-manual > strong { color: #70532b; }
.live-configuration-flow .live-flow-node p { margin: 8px 0 4px; font-size: 13px; line-height: 1.6; }
.live-flow-node small, .live-flow-result small { display: block; font-size: 12px; line-height: 1.6; color: #52685f; }
.live-flow-fork, .live-flow-merge { position: relative; height: 32px; color: #78968a; }
.live-flow-fork::before { content: ''; position: absolute; left: 50%; top: 0; height: 10px; border-left: 1px solid #a9bfb4; }
.live-flow-fork::after { content: ''; position: absolute; left: 25%; right: 25%; top: 10px; height: 8px; border: 1px solid #a9bfb4; border-bottom: 0; }
.live-flow-fork svg { position: absolute; bottom: 0; transform: translateX(-50%); }
.live-flow-fork svg:first-child { left: 25%; }
.live-flow-fork svg:last-child { left: 75%; }
.live-flow-merge::before { content: ''; position: absolute; left: 25%; right: 25%; top: 0; height: 12px; border: 1px solid #a9bfb4; border-top: 0; }
.live-flow-merge svg { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); }
.live-flow-result { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 16px; border-block: 1px solid #cee2d7; color: #234e41; background: #edf6ef; }
.live-flow-result strong { font-size: 14px; }
.live-flow-result > svg, .live-flow-preview > svg { flex: none; }
.live-flow-preview { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; padding: 10px 12px; border-top: 1px dashed #c3d2c9; color: #52685f; font-size: 12px; }
.live-flow-preview strong { color: #365c4f; font-size: 13px; }
.live-configuration-flow figcaption { margin-top: 8px; color: #52685f; text-align: center; font-size: 12px; line-height: 1.7; }
</style>
