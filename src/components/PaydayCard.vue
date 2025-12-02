<script lang="ts" setup>
defineProps<{
  diffDays: number;
  dateText: string;
  message: string;
  isSoon?: boolean;
}>();
</script>

<template>
  <div class="payday-card" :class="{ 'is-soon': isSoon }">
    <div class="icon">💰</div>
    <div class="content">
      <p class="label">发薪提醒</p>
      <p class="message">{{ message }}</p>
      <p class="date">{{ dateText }}</p>
      <p class="tip" v-if="diffDays === 0">请记得检查工资条 ✅</p>
    </div>
  </div>
</template>

<style scoped>
.payday-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  color: #2d1f0f;
  box-shadow: 0 12px 30px rgba(253, 160, 133, 0.35);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.payday-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(253, 160, 133, 0.45);
}

.payday-card.is-soon {
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
}

.icon {
  font-size: 42px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.85;
  margin: 0;
}

.message {
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.date,
.tip {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
</style>
