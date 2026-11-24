<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import { ChevronsLeftRight } from '@lucide/vue';

const props = defineProps<{
  modelValue: number;
  sliderLabel: string;
  leftSrc: string;
  leftAlt: string;
  leftLabel: string;
  rightSrc: string;
  rightAlt: string;
  rightLabel: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const surface = ref<HTMLElement>();
const range = ref<HTMLInputElement>();
const surfaceWidth = ref(0);
const position = computed(() => Math.max(0, Math.min(100, props.modelValue)));
let observer: ResizeObserver | undefined;
let gesture: { id: number; x: number; y: number; active: boolean } | undefined;

function updateFromPointer(event: PointerEvent) {
  const rect = surface.value?.getBoundingClientRect();
  if (!rect?.width) return;
  emit('update:modelValue', Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 100));
}

function beginDrag(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  range.value?.focus({ preventScroll: true });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, active: event.pointerType !== 'touch' };
  if (gesture.active) updateFromPointer(event);
}

function drag(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return;
  if (!gesture.active) {
    const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
    // Leave vertical touch gestures to the page instead of moving the divider.
    if (dx < 6 || dy > dx) return;
    gesture.active = true;
  }
  updateFromPointer(event);
}

function endDrag(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return;
  if (!gesture.active && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 6) updateFromPointer(event);
  gesture = undefined;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => { surfaceWidth.value = entry.contentRect.width; });
  if (surface.value) observer.observe(surface.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="surface" class="reveal-surface" :style="{ '--split': `${position}%` }">
    <img class="reveal-image reveal-right" :src="withBase(rightSrc)" :alt="rightAlt" width="1920" height="1080" loading="lazy" :draggable="false" />
    <img class="reveal-image reveal-left" :src="withBase(leftSrc)" :alt="leftAlt" width="1920" height="1080" loading="lazy" :draggable="false" :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }" />
    <span class="reveal-label reveal-label-left" :class="{ hidden: position * surfaceWidth / 100 < 128 }" aria-hidden="true">{{ leftLabel }}</span>
    <span class="reveal-label reveal-label-right" :class="{ hidden: (100 - position) * surfaceWidth / 100 < 128 }" aria-hidden="true">{{ rightLabel }}</span>
    <input ref="range" class="reveal-range" type="range" min="0" max="100" step="1" :value="position"
      :aria-label="sliderLabel" :aria-valuetext="`${leftLabel} ${position}%，${rightLabel} ${100 - position}%`"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
    <div class="reveal-drag-area" aria-hidden="true" title="拖动分隔线" @pointerdown.prevent="beginDrag" @pointermove="drag" @pointerup="endDrag" @pointercancel="gesture = undefined" @lostpointercapture="gesture = undefined"></div>
    <span class="reveal-divider" aria-hidden="true"></span>
    <span class="reveal-thumb" aria-hidden="true"><ChevronsLeftRight :size="21" :stroke-width="1.7" /></span>
    <slot />
  </div>
</template>

<style scoped>
.reveal-surface { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border: 1px solid #d6e2d9; border-radius: 6px; background: #edf3f0; isolation: isolate; user-select: none; }
.reveal-surface .reveal-image { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.reveal-label { position: absolute; bottom: 12px; padding: 5px 9px; font-size: 12px; font-weight: 600; line-height: 1.5; border-radius: 4px; pointer-events: none; white-space: nowrap; }
.reveal-label-left { left: 12px; background: rgb(255 255 255 / 94%); color: #214e40; border: 1px solid #d6e2d9; }
.reveal-label-right { right: 60px; background: rgb(14 43 37 / 92%); color: #f1faf5; border: 1px solid #8eb3a066; }
.reveal-label.hidden { visibility: hidden; }
.reveal-range { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; pointer-events: none; }
.reveal-drag-area { position: absolute; z-index: 2; inset: 0; cursor: col-resize; touch-action: pan-y; }
.reveal-divider { position: absolute; z-index: 3; top: 0; bottom: 0; left: var(--split); width: 2px; background: #fff; box-shadow: 0 0 0 1px #21463755; transform: translateX(-50%); pointer-events: none; }
.reveal-thumb { position: absolute; z-index: 3; left: clamp(24px, var(--split), calc(100% - 24px)); top: 50%; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #bdcfc4; border-radius: 50%; background: #fff; color: #1b5844; box-shadow: 0 2px 12px #0d2a2933; transform: translate(-50%, -50%); pointer-events: none; }
.reveal-range:focus-visible ~ .reveal-thumb { outline: 3px solid #1d755b; outline-offset: 3px; }
</style>
