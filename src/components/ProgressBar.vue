<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  percent: number;
  palette: string;
  statusText: string;
  workedText: string;
  totalText: string;
  remainingText: string;
}>();

const width = computed(() => {
  const value = Number(props.percent) || 0;
  return `${Math.min(100, Math.max(0, value)).toFixed(2)}%`;
});
</script>

<template>
  <div class="progress-card" :class="`palette-${palette}`">
    <div class="progress-header">
      <span class="status">{{ statusText }}</span>
      <span class="meta">{{ workedText }} / {{ totalText }}</span>
    </div>
    <div class="progress-track">
      <div class="progress-inner" :style="{ width }">
        <div v-if="palette === 'finish'" class="shimmer"></div>
      </div>
    </div>
    <div class="progress-footer">
      <span>剩余 {{ remainingText }}</span>
    </div>
  </div>
</template>

<style scoped>
.progress-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: background 0.3s ease;
}

.progress-header,
.progress-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.progress-header .status {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.progress-inner {
  position: relative;
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
  background: linear-gradient(90deg, #ff6b6b, #ffd93d);
}

.palette-early .progress-inner {
  background: linear-gradient(90deg, #f87171, #facc15);
}

.palette-mid .progress-inner {
  background: linear-gradient(90deg, #4989ff, #5de0e6);
}

.palette-late .progress-inner {
  background: linear-gradient(90deg, #34d399, #22c55e);
}

.palette-finish .progress-inner {
  background: linear-gradient(90deg, #fcd34d, #f97316);
}

.palette-before .progress-inner {
  background: linear-gradient(90deg, #94a3b8, #cbd5f5);
}

.palette-paused .progress-inner {
  background: repeating-linear-gradient(
    45deg,
    #a5b4fc,
    #a5b4fc 8px,
    #c7d2fe 8px,
    #c7d2fe 16px
  );
}

.palette-after .progress-inner {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.progress-footer span {
  font-size: 12px;
  opacity: 0.9;
}

.shimmer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  from {
    left: -40%;
  }
  to {
    left: 100%;
  }
}
</style>
