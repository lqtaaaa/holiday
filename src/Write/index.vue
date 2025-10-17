<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCountdownStore } from '../store/useCountdownStore';
import { createId } from '../utils/id';
import dayjs from '../utils/time';

defineProps({
  enterAction: {
    type: Object,
    required: true
  }
});

const store = useCountdownStore();
const { workSchedule, customCountdowns, holidaySyncTime, holidayLoading } = storeToRefs(store);

const workForm = reactive({
  start: '09:00',
  end: '18:00',
  workdays: [] as number[]
});

watch(workSchedule, (value) => {
  if (!value) return;
  workForm.start = value.start;
  workForm.end = value.end;
  workForm.workdays = [...value.workdays];
}, { immediate: true, deep: true });

const workdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 }
];

const customForm = reactive({
  name: '',
  date: '',
  note: ''
});

const errorMessage = ref('');
const successMessage = ref('');

const sortedCustomCountdowns = computed(() =>
  [...customCountdowns.value].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
);

function showToast(message: string, type: 'success' | 'error') {
  if (type === 'success') {
    successMessage.value = message;
    errorMessage.value = '';
  } else {
    errorMessage.value = message;
    successMessage.value = '';
  }
  if (window.utools && window.utools.showNotification) {
    window.utools.showNotification(message);
  }
}

const handleSaveWork = () => {
  if (!workForm.start || !workForm.end) {
    showToast('请完善工作时间', 'error');
    return;
  }
  if (!workForm.workdays.length) {
    showToast('请至少选择一个工作日', 'error');
    return;
  }
  store.setWorkSchedule({
    start: workForm.start,
    end: workForm.end,
    workdays: Array.from(new Set(workForm.workdays))

  });
  showToast('工作时间已保存', 'success');
};

const handleAddCustom = () => {
  if (!customForm.name || !customForm.date) {
    showToast('请填写名称和日期', 'error');
    return;
  }
  store.addCustomCountdown({
    id: createId('custom'),
    name: customForm.name,
    date: customForm.date,
    note: customForm.note
  });
  customForm.name = '';
  customForm.date = '';
  customForm.note = '';
  showToast('已添加自定义倒计时', 'success');
};

const handleRemoveCustom = (id: string) => {
  store.removeCustomCountdown(id);
  showToast('已删除', 'success');
};

const ICS_URL = 'https://cdn.jsdelivr.net/npm/chinese-days/dist/holidays.ics';

const handleSyncHoliday = async () => {
  try {
    const response = await fetch(ICS_URL);
    if (!response.ok) {
      throw new Error('请求失败');
    }
    const text = await response.text();
    await store.syncHolidayFromICS(text);
    showToast('节假日已同步', 'success');
  } catch (error) {
    console.error('[syncHoliday] failed', error);
    showToast('节假日同步失败', 'error');
  }
};

const lastSyncTime = computed(() => {
  if (!holidaySyncTime.value) return '未同步';
  return dayjs(holidaySyncTime.value).format('YYYY-MM-DD HH:mm:ss');
});

const handleClearHoliday = () => {
  store.resetHolidayEvents();
  showToast('已清空节假日数据', 'success');
};

const handleClearCustom = () => {
  store.clearCustomCountdowns();
  showToast('已清空自定义倒计时', 'success');
};

const handleBack = () => {
  if (window.utools && window.utools.redirect) {
    window.utools.redirect('假期星图', '');
    return;
  }
  window.history.back();
};

</script>

<template>
  <div class="settings-page">
    <header class="title">
      <h1>设置</h1>
      <button class="link" @click="handleBack">返回倒计时</button>
    </header>

    <section class="block">
      <h2>工作时间</h2>
      <div class="form-row">
        <label>上班时间</label>
        <input v-model="workForm.start" type="time" />
      </div>
      <div class="form-row">
        <label>下班时间</label>
        <input v-model="workForm.end" type="time" />
      </div>
      <div class="form-row">
        <label>工作日</label>
        <div class="workdays">
          <label v-for="day in workdayOptions" :key="day.value" class="checkbox">
            <input type="checkbox" :value="day.value" v-model="workForm.workdays" />
            <span>{{ day.label }}</span>
          </label>
        </div>
      </div>
      <button class="primary" @click="handleSaveWork">保存工作时间</button>
    </section>

    <section class="block">
      <div class="block-header">
        <h2>中国节假日数据</h2>
        <span class="note">来源：{{ ICS_URL }}</span>
      </div>
      <div class="sync-info">上次同步：{{ lastSyncTime }}</div>
      <div class="action-group">
        <button class="primary" :disabled="holidayLoading" @click="handleSyncHoliday">
          {{ holidayLoading ? '同步中…' : '同步节假日' }}
        </button>
        <button class="danger" @click="handleClearHoliday">清空节假日缓存</button>
      </div>
    </section>

    <section class="block">
      <div class="block-header">
        <h2>自定义倒计时</h2>
        <span class="note">用于添加纪念日、特殊日程等</span>
      </div>
      <div class="grid">
        <div class="form-row">
          <label>名称</label>
          <input v-model="customForm.name" type="text" placeholder="如：结婚纪念日" />
        </div>
        <div class="form-row">
          <label>日期</label>
          <input v-model="customForm.date" type="date" />
        </div>
        <div class="form-row">
          <label>备注</label>
          <input v-model="customForm.note" type="text" placeholder="可选" />
        </div>
      </div>
      <div class="action-group">
        <button class="primary" @click="handleAddCustom">添加倒计时</button>
        <button class="danger" @click="handleClearCustom" :disabled="!customCountdowns.length">
          清空所有自定义
        </button>
      </div>
      <div class="custom-list" v-if="sortedCustomCountdowns.length">
        <div class="custom-item" v-for="item in sortedCustomCountdowns" :key="item.id">
          <div class="info">
            <div class="name">{{ item.name }}</div>
            <div class="date">{{ item.date }}</div>
            <div class="note" v-if="item.note">备注：{{ item.note }}</div>
          </div>
          <button class="link" @click="handleRemoveCustom(item.id)">删除</button>
        </div>
      </div>
      <div class="empty" v-else>暂无自定义倒计时</div>
    </section>

    <transition name="fade">
      <div v-if="successMessage" class="toast success">{{ successMessage }}</div>
    </transition>
    <transition name="fade">
      <div v-if="errorMessage" class="toast error">{{ errorMessage }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.title {
  border-bottom: 1px solid rgba(22, 119, 255, 0.2);
  padding-bottom: 8px;
}

.block {
  background: rgba(22, 119, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block h2 {
  margin: 0;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-weight: 600;
}

.form-row input,
.form-row select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
}

.workdays {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
}

.primary,
.danger,
.link {
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.primary {
  background: #1677ff;
  color: #fff;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary:not(:disabled):hover {
  background: #125bcc;
}

.danger {
  background: #ff4d4f;
  color: #fff;
}

.danger:hover {
  background: #d9363e;
}

.link {
  background: transparent;
  color: #ff4d4f;
}

.link:hover {
  text-decoration: underline;
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note {
  font-size: 12px;
  color: #999;
}

.action-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.custom-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
}

.custom-item .name {
  font-weight: 600;
}

.custom-item .date {
  font-size: 13px;
  color: #555;
}

.custom-item .note {
  font-size: 12px;
  color: #888;
}

.empty {
  color: #999;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #fff;
}

.toast.success {
  background: #52c41a;
}

.toast.error {
  background: #ff4d4f;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  .settings-page {
    color: #ddd;
  }
  .block {
    background: rgba(255, 255, 255, 0.05);
  }
  .form-row input,
  .form-row select {
    background: #1f1f1f;
    border-color: #444;
    color: #ddd;
  }
  .custom-item {
    background: #2b2b2b;
  }
  .checkbox {
    background: rgba(255, 255, 255, 0.12);
  }
}
</style>
