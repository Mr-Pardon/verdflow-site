<script setup lang="ts">
import { ArrowDown, ArrowRight, Layers, ListTree, Sprout, Bookmark } from '@lucide/vue';
</script>

<template>
  <figure class="plan-diagram" aria-label="种植方案的组成">
    <ol class="plan-flow" role="list">
      <li class="plan-node plan-strategy">
        <strong><Layers :size="18" aria-hidden="true" /> 策略</strong>
        <p>决定植被怎么分布</p>
        <small>例：层次生态群落</small>
      </li>
      <li class="plan-edge" aria-hidden="true">
        <span>定义</span><ArrowRight class="plan-edge-horizontal" :size="18" /><ArrowDown class="plan-edge-vertical" :size="18" />
      </li>
      <li class="plan-node plan-role">
        <strong><ListTree :size="18" aria-hidden="true" /> 角色</strong>
        <p>每种空间关系的用途</p>
        <small>例：主景、铺底</small>
      </li>
      <li class="plan-edge" aria-hidden="true">
        <span>按用途选材</span><ArrowRight class="plan-edge-horizontal" :size="18" /><ArrowDown class="plan-edge-vertical" :size="18" />
      </li>
      <li class="plan-node plan-mix">
        <strong><Sprout :size="18" aria-hidden="true" /> 植被搭配</strong>
        <p>每个用途由哪些植被承担</p>
        <small>例：主景用橡木、榆树；铺底用矮灌木</small>
      </li>
    </ol>
    <div class="plan-save" aria-hidden="true"><ArrowDown :size="18" /></div>
    <div class="plan-result">
      <Bookmark :size="20" aria-hidden="true" />
      <div><strong>保存为种植方案</strong><small>策略及版本 · 各角色的植被搭配 · 构图参数</small></div>
    </div>
    <figcaption>角色由策略定义。植被搭配把具体植被分给角色；两者配好后，可以保存为方案重复使用。</figcaption>
  </figure>
</template>

<style scoped>
.plan-diagram { container-type: inline-size; margin: 24px 0; }
.plan-diagram .plan-flow { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1.35fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.plan-diagram .plan-flow li { min-width: 0; margin: 0; }
.plan-node { --ink: #2c594d; padding: 14px; border: 1px solid #d5e3dc; border-radius: 6px; background: #f1f7f3; }
.plan-strategy { --ink: #31576b; background: #f1f6fa; border-color: #d7e3eb; }
.plan-role { --ink: #70532b; background: #faf7ef; border-color: #e8dfca; }
.plan-node strong { display: flex; align-items: center; gap: 7px; font-size: 15px; color: var(--ink); }
.plan-node strong svg { flex: none; }
.plan-diagram .plan-node p { margin: 8px 0 4px; font-size: 13px; line-height: 1.6; }
.plan-node small, .plan-result small { display: block; font-size: 12px; line-height: 1.6; color: #52685f; }
.plan-edge { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: #57746a; font-size: 12px; white-space: nowrap; }
.plan-edge-vertical { display: none; }
.plan-save { display: flex; justify-content: center; padding: 8px; color: #57746a; }
.plan-result { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 16px; border-block: 1px solid #cee2d7; color: #234e41; background: #edf6ef; }
.plan-result > svg { flex: none; }
.plan-diagram figcaption { margin-top: 10px; color: #52685f; font-size: 12px; line-height: 1.7; text-align: center; }
@container (max-width: 510px) {
  .plan-diagram .plan-flow { grid-template-columns: 1fr; gap: 6px; }
  .plan-edge { flex-direction: row; gap: 6px; }
  .plan-edge-horizontal { display: none; }
  .plan-edge-vertical { display: initial; }
}
</style>
