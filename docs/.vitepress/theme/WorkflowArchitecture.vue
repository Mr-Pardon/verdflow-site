<script setup lang="ts">
import { ArrowDown, ArrowRight, ScanLine, Sprout, Trees, Mountain, FileOutput } from '@lucide/vue';

const stages = [
  { title: '统一区域', question: '种在哪里', result: '区域集', icon: ScanLine, color: '#3e7395' },
  { title: '策略生成', question: '怎样分布', result: '带角色的点位', icon: Sprout, color: '#756184' },
  { title: '植被分配', question: '使用什么', result: '具体资产与缩放', icon: Trees, color: '#277d69' },
  { title: '高程采样', question: '落在多高', result: '地形高度', icon: Mountain, color: '#547887' },
  { title: '目标输出', question: '交给哪里', result: '文件或场景', icon: FileOutput, color: '#977141' },
];
</script>

<template>
  <figure class="workflow-architecture" aria-label="VerdFlow 架构示意：多个操作入口调用共用流程，外部能力由适配器连接">
    <div class="workflow-entry">
      <span class="workflow-label">操作入口</span>
      <strong>Studio <span>·</span> 实时 WebUI <span>·</span> CLI</strong>
      <small>提交配置，查看进度与结果</small>
    </div>
    <div class="workflow-direction" aria-hidden="true"><ArrowDown :size="18" /></div>
    <div class="workflow-core">
      <div class="workflow-core-heading"><strong>共用的种植流程</strong><span>CORE</span></div>
      <ol class="workflow-stages">
        <li v-for="(stage, index) in stages" :key="stage.title" :style="{ '--stage-color': stage.color }">
          <div class="workflow-stage-top"><component :is="stage.icon" :size="22" aria-hidden="true" /><span>0{{ index + 1 }}</span></div>
          <span class="workflow-question">{{ stage.question }}</span>
          <strong>{{ stage.title }}</strong>
          <small>{{ stage.result }}</small>
          <ArrowRight v-if="index < stages.length - 1" class="workflow-stage-arrow" :size="15" aria-hidden="true" />
        </li>
      </ol>
      <p class="workflow-records">项目与任务贯穿流程 <span>·</span> 输入、配置与结果保持关联</p>
    </div>
    <div class="workflow-integrations">
      <span class="workflow-label">外部适配</span>
      <dl>
        <div><dt>区域</dt><dd><span>FBX / SHP / GeoJSON</span><span>DTS 选区</span></dd></div>
        <div><dt>高程</dt><dd><span>模型几何 / GeoTIFF</span><span>DTS 场景</span></dd></div>
        <div><dt>交付</dt><dd><span>DTS XML</span><span>实时场景写入</span></dd></div>
      </dl>
    </div>
    <figcaption>操作入口可以不同，区域、点位与任务遵循共同约定。</figcaption>
  </figure>
</template>

<style scoped>
.workflow-architecture { container-type: inline-size; margin: 30px 0; }
.workflow-label { font-size: 11px; color: #73857e; font-weight: 600; }
.workflow-entry { display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; padding: 12px 0 0; }
.workflow-entry strong { font-size: 16px; line-height: 1.6; font-weight: 600; }
.workflow-entry strong span { color: #99a7a0; padding: 0 6px; }
.workflow-entry small { font-size: 12px; color: #6e8078; }
.workflow-direction { display: flex; justify-content: center; padding: 14px 0; color: #82988b; }
.workflow-core { border-block: 1px solid #cddfd4; padding: 20px 0 0; background: #f7faf8; }
.workflow-core-heading { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
.workflow-core-heading strong { font-size: 16px; font-weight: 600; color: #244e3f; }
.workflow-core-heading span { font-size: 10px; color: #7c9686; }
.workflow-stages { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px; list-style: none; margin: 20px 16px 22px; padding: 0; }
.workflow-stages li { position: relative; min-width: 0; padding-top: 14px; margin: 0; border-top: 2px solid var(--stage-color); line-height: 1.65; }
.workflow-stage-top { display: flex; justify-content: space-between; align-items: center; color: var(--stage-color); margin-bottom: 12px; }
.workflow-stage-top span { font-size: 10px; opacity: .8; }
.workflow-question { display: block; font-size: 11px; color: #76877f; }
.workflow-stages strong { display: block; font-size: 14px; font-weight: 600; margin: 3px 0; }
.workflow-stages small { display: block; font-size: 11px; color: #6b7f74; }
.workflow-stage-arrow { position: absolute; right: -18px; top: 74px; color: #96a49d; }
.workflow-records { font-size: 11px !important; line-height: 1.8 !important; text-align: center; padding: 11px 16px; margin: 0 !important; border-top: 1px solid #e3eae5; color: #627a6c; }
.workflow-records span { margin: 0 4px; color: #a2aea6; }
.workflow-integrations { padding: 18px 16px; border-bottom: 1px solid #e1e8e3; }
.workflow-integrations dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin: 12px 0 0; }
.workflow-integrations dl div { border-left: 2px solid #d9e1e5; padding-left: 12px; }
.workflow-integrations dt { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
.workflow-integrations dd { font-size: 11px; line-height: 1.8; color: #6e8078; margin: 0; overflow-wrap: anywhere; }
.workflow-integrations dd span { display: block; }
.workflow-architecture figcaption { margin-top: 12px; text-align: center; font-size: 11px; line-height: 1.8; color: #798b80; }
@container (max-width: 570px) {
  .workflow-stages { grid-template-columns: 1fr; gap: 24px; }
  .workflow-stages li { border-top: 0; border-left: 2px solid var(--stage-color); padding: 0 0 0 14px; display: grid; grid-template-columns: 32px minmax(0, 1fr); column-gap: 14px; }
  .workflow-stage-top { grid-row: 1 / 4; flex-direction: column; justify-content: center; gap: 5px; margin: 0; }
  .workflow-question, .workflow-stages strong, .workflow-stages small { grid-column: 2; }
  .workflow-stages strong { margin: 2px 0; }
  .workflow-stage-arrow { right: auto; left: 21px; top: auto; bottom: -20px; transform: rotate(90deg); }
  .workflow-records span { display: block; height: 0; overflow: hidden; }
  .workflow-integrations dl { grid-template-columns: 1fr; gap: 12px; }
  .workflow-integrations dl div { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 8px; }
  .workflow-integrations dt { margin: 0; }
  .workflow-integrations dd { display: flex; flex-wrap: wrap; column-gap: 8px; }
}
</style>
