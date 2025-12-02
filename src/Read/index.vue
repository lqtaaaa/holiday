<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import ProgressBar from "../components/ProgressBar.vue";
import PaydayCard from "../components/PaydayCard.vue";
import StealthClock from "../components/StealthClock.vue";
import { useCountdownStore } from "../store/useCountdownStore";
import { useWorkProgress } from "../hooks/useWorkProgress";
import { usePayday } from "../hooks/usePayday";

defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});

const store = useCountdownStore();
const { displaySettings, currentTime } = storeToRefs(store);

const majorCountdowns = computed(() => store.majorHolidayCountdowns);
const customCountdowns = computed(() => store.customCountdownDisplays);
const workCountdown = computed(() => store.workCountdown);
const currentDateInfo = computed(() => store.currentDateInfo);

const {
  percent: workPercent,
  palette: workPalette,
  statusText: workStatusText,
  workedText: workWorkedText,
  totalText: workTotalText,
  remainingText: workRemainingText,
} = useWorkProgress();
const { payday } = usePayday();

const showSeconds = computed(() => displaySettings.value.showSeconds);
const timeDisplay = computed(() =>
  showSeconds.value ? currentDateInfo.value.time : currentDateInfo.value.timeSimple
);
const isStealthMode = computed(() => displaySettings.value.mode === "stealth");
const isFriday = computed(() => currentTime.value.day() === 5);
const stealthPaydayText = computed(() => payday.value?.message ?? "");

const handleOpenSettings = () => {
  if (window.utools && window.utools.redirect) {
    window.utools.redirect("假期设置", "");
  }
};

const handleToggleStealth = () => {
  store.updateDisplaySettings({
    mode: displaySettings.value.mode === "stealth" ? "normal" : "stealth",
  });
};

onMounted(() => {
  store.startTicker();
});

onUnmounted(() => {
  store.stopTicker();
});
</script>

<template>
  <div
    class="countdown-page"
    :class="{ 'stealth-mode': isStealthMode }"
    @dblclick.self="handleToggleStealth"
  >
    <header v-if="!isStealthMode" class="header">
      <div class="clock-block">
        <div class="time-display">{{ timeDisplay }}</div>
        <div class="date-info">
          <span class="date-text">{{ currentDateInfo.date }}</span>
          <span class="lunar-text">{{ currentDateInfo.lunar }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="stealth-btn" title="切换摸鱼模式" @click="handleToggleStealth">👁</button>
        <button class="settings-btn" @click="handleOpenSettings">
          <span>⚙️</span>
          <span>设置</span>
        </button>
      </div>
    </header>

    <section v-else class="stealth-header">
      <StealthClock
        :time="timeDisplay"
        :date="currentDateInfo.date"
        :lunar="currentDateInfo.lunar"
        :status="workStatusText"
        :remaining="workRemainingText"
        :payday-text="stealthPaydayText"
      />
      <button class="stealth-exit" @click="handleToggleStealth">👀</button>
    </section>

    <section class="work-section" :class="{ 'friday-mode': isFriday }">
      <div v-if="workCountdown" class="work-card-enhanced">
        <div class="work-icon">{{ isFriday ? '🎉' : '🏃' }}</div>
        <div class="work-content">
          <div class="work-title">{{ isFriday ? '周五限定：坚持住！' : '下班倒计时' }}</div>
          <div class="work-time">{{ workCountdown.text }}</div>
          <div class="work-target">目标：{{ workCountdown.targetText }}</div>
          <ProgressBar
            :percent="workPercent"
            :palette="workPalette"
            :status-text="workStatusText"
            :worked-text="workWorkedText"
            :total-text="workTotalText"
            :remaining-text="workRemainingText"
          />
        </div>
      </div>
      <div v-else class="work-card-empty">
        <div class="empty-icon">⏳</div>
        <div class="empty-text">暂未配置工作时间</div>
        <div class="empty-hint">点击右上角设置添加</div>
      </div>
      <div class="payday-container" v-if="payday">
        <PaydayCard
          :diff-days="payday.diffDays"
          :date-text="payday.dateText"
          :message="payday.message"
          :is-soon="payday.isSoon"
        />
      </div>
    </section>

    <section class="holiday-section">
      <h2 class="section-title">🎉 节日倒计时</h2>
      <div class="holiday-grid">
        <div v-for="item in majorCountdowns" :key="item.id" class="holiday-card">
          <div v-if="item.name === '国庆'" class="flag-stars">
            <span class="big-star">★</span>
            <span class="small-star star-1">★</span>
            <span class="small-star star-2">★</span>
            <span class="small-star star-3">★</span>
            <span class="small-star star-4">★</span>
          </div>
          <div class="holiday-name">{{ item.name }}</div>
          <div class="holiday-date">{{ item.targetDate }}</div>
          <div class="holiday-days">
            <span class="days-number">{{ item.diffDays }}</span>
            <span class="days-unit">天</span>
          </div>
        </div>
      </div>
    </section>

    <section class="custom-section">
      <div class="section-header">
        <h2 class="section-title">📝 自定义倒计时</h2>
        <div class="section-tips">在设置页添加</div>
      </div>
      <div v-if="customCountdowns.length" class="custom-grid">
        <div v-for="item in customCountdowns" :key="item.id" class="custom-card">
          <div class="custom-name">{{ item.name }}</div>
          <div class="custom-date">{{ item.targetDate }}</div>
          <div class="custom-days">
            <span class="days-number">{{ item.diffDays }}</span>
            <span class="days-unit">天</span>
          </div>
        </div>
      </div>
      <div v-else class="custom-empty">
        <div class="empty-icon">📅</div>
        <div class="empty-text">暂无自定义倒计时</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.countdown-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  min-height: 100vh;
}

.countdown-page.stealth-mode {
  background: #050505;
  color: #e5e7eb;
  font-family: "Fira Code", "JetBrains Mono", monospace;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stealth-btn,
.stealth-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  width: 38px;
  height: 38px;
  font-size: 16px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stealth-btn:hover,
.stealth-exit:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.7);
  transform: scale(1.05);
}

.stealth-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.clock-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-display {
  font-size: 42px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  opacity: 0.95;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.work-section {
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-card-enhanced {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(245, 87, 108, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  transition: all 0.3s ease;
}

.friday-mode .work-card-enhanced {
  background: linear-gradient(120deg, #7f5af0 0%, #00f5d4 100%);
  box-shadow: 0 12px 34px rgba(0, 245, 212, 0.32);
}

.work-icon {
  font-size: 48px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.work-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-title {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.95;
}

.work-time {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
}

.work-target {
  font-size: 14px;
  opacity: 0.9;
}

.work-card-empty {
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  padding: 32px;
  border-radius: 20px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 6px;
}

.empty-hint {
  font-size: 13px;
  opacity: 0.7;
}

.payday-container {
  max-width: 420px;
}

.holiday-section,
.custom-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-tips {
  font-size: 13px;
  color: #9ca3af;
}

.holiday-grid,
.custom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.holiday-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.holiday-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.holiday-card:nth-child(1) {
  background: linear-gradient(135deg, #ffd89b 0%, #f6a623 100%);
  color: #2d3436;
}

.holiday-card:nth-child(2) {
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
}

.holiday-card:nth-child(3) {
  background: linear-gradient(135deg, #a8dadc 0%, #457b9d 100%);
  color: white;
}

.holiday-card:nth-child(4) {
  background: linear-gradient(135deg, #51cf66 0%, #2f9e44 100%);
  color: white;
}

.holiday-card:nth-child(5) {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
  color: #2d3436;
}

.holiday-card:nth-child(6) {
  background: linear-gradient(135deg, #de2910 0%, #c41e0f 100%);
  color: white;
}

.flag-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.big-star,
.small-star {
  position: absolute;
  color: #ffde00;
  opacity: 0.65;
}

.big-star {
  top: 20px;
  left: 20px;
  font-size: 40px;
}

.small-star {
  font-size: 13px;
}

.star-1 {
  top: 16px;
  left: 72px;
}

.star-2 {
  top: 36px;
  left: 90px;
}

.star-3 {
  top: 60px;
  left: 88px;
}

.star-4 {
  top: 84px;
  left: 72px;
}

.holiday-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.holiday-date {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.holiday-days {
  display: flex;
  align-items: baseline;
  gap: 4px;
  position: relative;
  z-index: 1;
}

.days-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.days-unit {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
}

.custom-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
  cursor: pointer;
}

.custom-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.custom-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.custom-date {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.custom-days {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: #667eea;
}

.custom-empty {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  color: #9ca3af;
}

.countdown-page.stealth-mode .work-card-enhanced,
.countdown-page.stealth-mode .holiday-card,
.countdown-page.stealth-mode .custom-card,
.countdown-page.stealth-mode .work-card-empty,
.countdown-page.stealth-mode .custom-empty {
  background: #0f172a;
  color: #e5e7eb;
  border: 1px solid #1f2937;
  box-shadow: none;
}

.countdown-page.stealth-mode .holiday-name,
.countdown-page.stealth-mode .holiday-date,
.countdown-page.stealth-mode .custom-name,
.countdown-page.stealth-mode .custom-date {
  color: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  .countdown-page:not(.stealth-mode) {
    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  }
  .section-title {
    color: #e5e7eb;
  }
  .holiday-card,
  .custom-card,
  .custom-empty {
    background: #1f2937;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
