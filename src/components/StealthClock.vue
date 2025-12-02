<script lang="ts" setup>
defineProps<{
  time: string;
  date: string;
  lunar: string;
  status: string;
  remaining: string;
  paydayText?: string;
}>();
</script>

<template>
  <section class="stealth-clock">
    <p class="line">[TIME] {{ time }}</p>
    <p class="line">[DATE] {{ date }}</p>
    <p class="line">[LUNR] {{ lunar }}</p>
    <p class="line">[WORK] {{ status }} | 剩余 {{ remaining }}</p>
    <p v-if="paydayText" class="line highlight">[CASH] {{ paydayText }}</p>
  </section>
</template>

<style scoped>
.stealth-clock {
  background: #050505;
  border: 1px solid #27272a;
  padding: 18px;
  border-radius: 8px;
  font-family: "Fira Code", "JetBrains Mono", monospace;
  color: #e5e5e5;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.6);
}

.line {
  margin: 4px 0;
  letter-spacing: 0.08em;
  font-size: 14px;
}

.highlight {
  color: #a3e635;
}
</style>
