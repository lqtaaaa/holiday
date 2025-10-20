<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useCountdownStore } from '../store/useCountdownStore';

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

const store = useCountdownStore()

const majorCountdowns = computed(() => store.majorHolidayCountdowns)
const customCountdowns = computed(() => store.customCountdownDisplays)
const workCountdown = computed(() => store.workCountdown)
const currentDateInfo = computed(() => store.currentDateInfo)

const handleOpenSettings = () => {
  if (window.utools && window.utools.redirect) {
    window.utools.redirect('假期设置', '')
  }
}

// 组件挂载时启动定时器
onMounted(() => {
  store.startTicker()
})

// 组件卸载时停止定时器
onUnmounted(() => {
  store.stopTicker()
})
</script>

<template>
  <div class="countdown-page">
    <!-- 优化后的头部：大号时钟设计 -->
    <header class="header">
      <div class="clock-block">
        <div class="time-display">{{ currentDateInfo.time }}</div>
        <div class="date-info">
          <span class="date-text">{{ currentDateInfo.date }}</span>
          <span class="lunar-text">{{ currentDateInfo.lunar }}</span>
        </div>
      </div>
      <button class="settings-btn" @click="handleOpenSettings">
        <span>⚙️</span>
        <span>设置</span>
      </button>
    </header>

    <!-- 增强的下班倒计时 -->
    <section class="work-section">
      <div v-if="workCountdown" class="work-card-enhanced">
        <div class="work-icon">🏃</div>
        <div class="work-content">
          <div class="work-title">下班倒计时</div>
          <div class="work-time">{{ workCountdown.text }}</div>
          <div class="work-target">{{ workCountdown.targetText }}</div>
        </div>
      </div>
      <div v-else class="work-card-empty">
        <div class="empty-icon">⏰</div>
        <div class="empty-text">暂无工作时间设置</div>
        <div class="empty-hint">点击右上角设置添加</div>
      </div>
    </section>

    <!-- 优化的节日倒计时 -->
    <section class="holiday-section">
      <h2 class="section-title">🎊 节日倒计时</h2>
      <div class="holiday-grid">
        <div v-for="(item, index) in majorCountdowns" :key="item.name" class="holiday-card">
          <!-- 国庆卡片添加五星图案 -->
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

    <!-- 优化的自定义倒计时 -->
    <section class="custom-section">
      <div class="section-header">
        <h2 class="section-title">✨ 自定义倒计时</h2>
        <div class="section-tips">在设置页添加</div>
      </div>
      <div v-if="customCountdowns.length" class="custom-grid">
        <div v-for="item in customCountdowns" :key="item.name" class="custom-card">
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

/* ========== 头部样式 ========== */
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

.date-text {
  font-weight: 500;
}

.lunar-text {
  opacity: 0.85;
  font-size: 14px;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
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

/* ========== 下班倒计时增强样式 ========== */
.work-section {
  margin: 8px 0;
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

.work-card-enhanced:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(245, 87, 108, 0.4);
}

.work-icon {
  font-size: 48px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.work-content {
  flex: 1;
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

/* ========== 节日倒计时样式 ========== */
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
}

.holiday-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

/* 根据节日顺序动态设置颜色 */
/* 元旦 - 金橙色系（新年喜庆） */
.holiday-card:nth-child(1) {
  background: linear-gradient(135deg, #ffd89b 0%, #f6a623 100%);
  color: #2d3436;
}

/* 春节 - 中国红（传统喜庆） */
.holiday-card:nth-child(2) {
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  color: white;
}

/* 清明 - 青灰色（肃穆追思） */
.holiday-card:nth-child(3) {
  background: linear-gradient(135deg, #a8dadc 0%, #457b9d 100%);
  color: white;
}

/* 端午 - 绿色系（粽叶龙舟） */
.holiday-card:nth-child(4) {
  background: linear-gradient(135deg, #51cf66 0%, #2f9e44 100%);
  color: white;
}

/* 中秋 - 金黄色（月饼圆月） */
.holiday-card:nth-child(5) {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
  color: #2d3436;
}

/* 国庆 - 红色系（国旗红）+ 五星图案 */
.holiday-card:nth-child(6) {
  background: linear-gradient(135deg, #de2910 0%, #c41e0f 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

/* 移除伪元素，改用模板中的真实元素 */

/* 五星图案容器 */
.flag-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 按照国旗法标准计算（假设卡片160px高度）
   左上方长方形：80px × 80px
   横向15等分：5.33px/格，纵向10等分：8px/格 */

.big-star {
  position: absolute;
  /* 大星中心：上五下五、左五右十 = (5×5.33px, 5×8px) = (26.65px, 40px) */
  top: calc(40px - 20px); /* 减去星星半径使中心对齐 */
  left: calc(26.65px - 20px);
  font-size: 40px; /* 直径 = 旗高3/10 = 48px，字体稍小 */
  color: #ffde00;
  opacity: 0.65;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.small-star {
  position: absolute;
  font-size: 13.3px; /* 直径 = 旗高1/10 = 16px */
  color: #ffde00;
  opacity: 0.65;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* 四颗小星的精确位置（中心点坐标） */
.star-1 {
  /* 上二下八、左十右五 = (10×5.33px, 2×8px) = (53.3px, 16px) */
  top: calc(16px - 6.65px);
  left: calc(53.3px - 6.65px);
  transform: rotate(-41deg); /* 角尖指向大星中心 */
}

.star-2 {
  /* 上四下六、左十二右三 = (12×5.33px, 4×8px) = (64px, 32px) */
  top: calc(32px - 6.65px);
  left: calc(64px - 6.65px);
  transform: rotate(-18deg);
}

.star-3 {
  /* 上七下三、左十二右三 = (12×5.33px, 7×8px) = (64px, 56px) */
  top: calc(56px - 6.65px);
  left: calc(64px - 6.65px);
  transform: rotate(18deg);
}

.star-4 {
  /* 上九下一、左十右五 = (10×5.33px, 9×8px) = (53.3px, 72px) */
  top: calc(72px - 6.65px);
  left: calc(53.3px - 6.65px);
  transform: rotate(41deg);
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

/* ========== 自定义倒计时样式 ========== */
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
  border-left-width: 6px;
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

/* ========== 深色模式 ========== */
@media (prefers-color-scheme: dark) {
  .countdown-page {
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

  .holiday-card:hover,
  .custom-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .custom-name {
    color: #e5e7eb;
  }

  .custom-date {
    color: #9ca3af;
  }

  .work-card-empty {
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    color: #9ca3af;
  }
}
</style>
