<script lang="ts" setup>
import { computed, nextTick, reactive, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMessage } from "naive-ui";
import { useCountdownStore } from "../store/useCountdownStore";
import { createId } from "../utils/id";
import dayjs from "../utils/time";

defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});

const store = useCountdownStore();
const message = useMessage();

const {
  workSchedule,
  lunchBreak,
  salarySettings,
  displaySettings,
  customCountdowns,
  holidaySyncTime,
  holidayLoading,
} = storeToRefs(store);

const workForm = reactive({
  start: "09:00",
  end: "18:00",
  workdays: [] as number[],
});

const lunchForm = reactive({
  enabled: false,
  start: "12:00",
  end: "13:30",
});

const salaryForm = reactive({
  day: 10,
  holidayRule: "nearest" as "delay" | "advance" | "nearest" | "ignore",
});

const displayForm = reactive({
  showSeconds: false,
  mode: "normal" as "normal" | "stealth",
});

const customForm = reactive({
  name: "",
  date: null as string | null,
  note: "",
});

watch(
  workSchedule,
  (value) => {
    if (!value) return;
    workForm.start = value.start;
    workForm.end = value.end;
    workForm.workdays = [...value.workdays];
  },
  { immediate: true, deep: true }
);

watch(
  lunchBreak,
  (value) => {
    if (!value) return;
    lunchForm.enabled = value.enabled;
    lunchForm.start = value.start;
    lunchForm.end = value.end;
  },
  { immediate: true, deep: true }
);

watch(
  salarySettings,
  (value) => {
    if (!value) return;
    salaryForm.day = value.day;
    salaryForm.holidayRule = value.holidayRule;
  },
  { immediate: true, deep: true }
);

watch(
  displaySettings,
  (value) => {
    if (!value) return;
    displayForm.showSeconds = value.showSeconds;
    displayForm.mode = value.mode;
  },
  { immediate: true, deep: true }
);

const workdayOptions = [
  { label: "周一", value: 1 },
  { label: "周二", value: 2 },
  { label: "周三", value: 3 },
  { label: "周四", value: 4 },
  { label: "周五", value: 5 },
  { label: "周六", value: 6 },
  { label: "周日", value: 0 },
];

const holidayRuleOptions = [
  { label: "顺延（遇休息往后）", value: "delay" },
  { label: "提前（遇休息往前）", value: "advance" },
  { label: "就近（优先周五）", value: "nearest" },
  { label: "不调整", value: "ignore" },
];

const modeOptions = [
  { label: "标准模式", value: "normal" },
  { label: "摸鱼模式", value: "stealth" },
];

const sortedCustomCountdowns = computed(() =>
  [...customCountdowns.value].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  )
);
const customCount = computed(() => customCountdowns.value.length);

const ICS_URL = "https://cdn.jsdelivr.net/npm/chinese-days/dist/holidays.ics";

const lastSyncTime = computed(() => {
  if (!holidaySyncTime.value) return "未同步";
  return dayjs(holidaySyncTime.value).format("YYYY-MM-DD HH:mm:ss");
});

const savingFlags = reactive({
  work: false,
  lunch: false,
  salary: false,
  display: false,
});

function validateRange(start: string, end: string) {
  return dayjs(`2000-01-01 ${end}`).isAfter(dayjs(`2000-01-01 ${start}`));
}

const saveWorkSchedule = async () => {
  if (!workForm.workdays.length) {
    message.error("请至少选择一个工作日");
    return;
  }
  if (!validateRange(workForm.start, workForm.end)) {
    message.error("上下班时间区间不合法");
    return;
  }
  savingFlags.work = true;
  store.setWorkSchedule({
    start: workForm.start,
    end: workForm.end,
    workdays: Array.from(new Set(workForm.workdays)),
  });
  await nextTick();
  savingFlags.work = false;
  message.success("工作时间已更新");
};

const saveLunchSettings = async () => {
  if (lunchForm.enabled && !validateRange(lunchForm.start, lunchForm.end)) {
    message.error("午休时间区间不合法");
    return;
  }
  savingFlags.lunch = true;
  store.setLunchBreakSetting({ ...lunchForm });
  await nextTick();
  savingFlags.lunch = false;
  message.success("午休设置已更新");
};

const saveSalarySettings = async () => {
  savingFlags.salary = true;
  store.setSalarySetting({ ...salaryForm });
  await nextTick();
  savingFlags.salary = false;
  message.success("发薪日设置已更新");
};

const saveDisplaySettings = async () => {
  savingFlags.display = true;
  store.updateDisplaySettings({ ...displayForm });
  await nextTick();
  savingFlags.display = false;
  message.success("显示偏好已更新");
};

const handleAddCustom = () => {
  if (!customForm.name || !customForm.date) {
    message.error("请填写名称和日期");
    return;
  }
  store.addCustomCountdown({
    id: createId("custom"),
    name: customForm.name,
    date: customForm.date,
    note: customForm.note,
  });
  customForm.name = "";
  customForm.date = null;
  customForm.note = "";
  message.success("已添加自定义倒计时");
};

const handleRemoveCustom = (id: string) => {
  store.removeCustomCountdown(id);
  message.success("已删除");
};

const handleClearCustom = () => {
  store.clearCustomCountdowns();
  message.success("已清空所有自定义项目");
};

const handleSyncHoliday = async () => {
  try {
    const response = await fetch(ICS_URL);
    if (!response.ok) throw new Error("请求失败");
    store.syncHolidayFromICS(await response.text());
    message.success("节假日数据已同步");
  } catch (error) {
    console.error("[syncHoliday]", error);
    message.error("节假日同步失败");
  }
};

const handleClearHoliday = () => {
  store.resetHolidayEvents();
  message.success("已清空节假日缓存");
};

const handleBack = () => {
  if (window.utools && window.utools.redirect) {
    window.utools.redirect("假期星图", "");
    return;
  }
  window.history.back();
};
</script>

<template>
  <div class="settings-page">
    <header class="title">
      <h1>设置</h1>
      <n-button tertiary @click="handleBack">返回倒计时</n-button>
    </header>

    <section class="panel">
      <div class="panel-header">
        <h2>工作时间</h2>
        <span>配置工作日与上下班时间</span>
      </div>
      <n-form label-placement="top" :model="workForm">
        <div class="grid-3">
          <n-form-item label="上班时间">
            <n-time-picker
              v-model:formatted-value="workForm.start"
              format="HH:mm"
              value-format="HH:mm"
              clearable
            />
          </n-form-item>
          <n-form-item label="下班时间">
            <n-time-picker
              v-model:formatted-value="workForm.end"
              format="HH:mm"
              value-format="HH:mm"
              clearable
            />
          </n-form-item>
          <n-form-item label="工作日">
            <n-select
              v-model:value="workForm.workdays"
              :options="workdayOptions"
              multiple
              placeholder="选择工作日"
            />
          </n-form-item>
        </div>
      </n-form>
      <n-button type="primary" :loading="savingFlags.work" @click="saveWorkSchedule">
        保存工作时间
      </n-button>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>午休设置</h2>
        <span>可选，受进度条与倒计时影响</span>
      </div>
      <n-form label-placement="top" :model="lunchForm">
        <div class="grid-inline">
          <n-form-item label="启用午休">
            <n-switch v-model:value="lunchForm.enabled" />
          </n-form-item>
          <n-form-item label="开始时间">
            <n-time-picker
              v-model:formatted-value="lunchForm.start"
              format="HH:mm"
              value-format="HH:mm"
              clearable
              :disabled="!lunchForm.enabled"
            />
          </n-form-item>
          <n-form-item label="结束时间">
            <n-time-picker
              v-model:formatted-value="lunchForm.end"
              format="HH:mm"
              value-format="HH:mm"
              clearable
              :disabled="!lunchForm.enabled"
            />
          </n-form-item>
        </div>
      </n-form>
      <n-button type="primary" ghost :loading="savingFlags.lunch" @click="saveLunchSettings">
        保存午休设置
      </n-button>
    </section>

    <section class="panel grid-2">
      <div class="panel">
        <div class="panel-header">
          <h3>发薪日设置</h3>
          <span>用于展示发薪倒计时</span>
        </div>
        <n-form label-placement="top" :model="salaryForm">
          <n-form-item label="发薪日（1-31）">
            <n-input-number v-model:value="salaryForm.day" :min="1" :max="31" />
          </n-form-item>
          <n-form-item label="节假日处理">
            <n-select v-model:value="salaryForm.holidayRule" :options="holidayRuleOptions" />
          </n-form-item>
        </n-form>
        <n-button type="primary" quaternary :loading="savingFlags.salary" @click="saveSalarySettings">
          保存发薪规则
        </n-button>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3>显示偏好</h3>
          <span>影响主界面的显示方式</span>
        </div>
        <n-form label-placement="top" :model="displayForm">
          <n-form-item label="显示秒数">
            <n-switch v-model:value="displayForm.showSeconds" />
          </n-form-item>
          <n-form-item label="模式">
            <n-radio-group v-model:value="displayForm.mode">
              <n-radio-button
                v-for="option in modeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
        </n-form>
        <n-button type="primary" quaternary :loading="savingFlags.display" @click="saveDisplaySettings">
          保存显示偏好
        </n-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>中国节假日数据</h2>
        <span>来源：{{ ICS_URL }}</span>
      </div>
      <div class="sync-info">上次同步：{{ lastSyncTime }}</div>
      <div class="action-row">
        <n-button type="primary" :loading="holidayLoading" @click="handleSyncHoliday">
          同步节假日
        </n-button>
        <n-button type="error" tertiary @click="handleClearHoliday">
          清空节假日缓存
        </n-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>自定义倒计时</h2>
        <span>用于纪念日、项目节点等</span>
      </div>
      <n-form label-placement="top" :model="customForm" class="grid-3">
        <n-form-item label="名称">
          <n-input v-model:value="customForm.name" placeholder="如：项目里程碑" />
        </n-form-item>
        <n-form-item label="日期">
          <n-date-picker
            v-model:formatted-value="customForm.date"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            clearable
          />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="customForm.note" placeholder="可选" />
        </n-form-item>
      </n-form>
      <div class="action-row">
        <n-button type="primary" @click="handleAddCustom">添加倒计时</n-button>
        <n-button type="error" tertiary :disabled="!customCount" @click="handleClearCustom">
          清空全部
        </n-button>
      </div>
      <div v-if="sortedCustomCountdowns.length" class="custom-list">
        <div class="custom-item" v-for="item in sortedCustomCountdowns" :key="item.id">
          <div>
            <div class="name">{{ item.name }}</div>
            <div class="date">{{ item.date }}</div>
            <div v-if="item.note" class="note">备注：{{ item.note }}</div>
          </div>
          <n-button text type="error" size="small" @click="handleRemoveCustom(item.id)">删除</n-button>
        </div>
      </div>
      <div v-else class="empty">暂无自定义倒计时</div>
    </section>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(22, 119, 255, 0.2);
  padding-bottom: 12px;
}

.panel {
  background: rgba(22, 119, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel.grid-2 {
  background: transparent;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.panel-header h2,
.panel-header h3 {
  margin: 0;
}

.panel-header span {
  font-size: 13px;
  color: #6b7280;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.grid-inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.sync-info {
  font-size: 13px;
  color: #6b7280;
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
  background: white;
  border-radius: 8px;
}

.custom-item .name {
  font-weight: 600;
}

.custom-item .date {
  font-size: 13px;
  color: #6b7280;
}

.custom-item .note {
  font-size: 12px;
  color: #9ca3af;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 12px 0;
}

@media (prefers-color-scheme: dark) {
  .panel {
    background: rgba(255, 255, 255, 0.04);
  }
  .custom-item {
    background: #1f1f1f;
    color: #e5e7eb;
  }
}
</style>
