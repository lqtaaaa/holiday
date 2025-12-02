import { defineStore } from "pinia";
import { computed, ref } from "vue";
import dayjs, { formatDuration } from "../utils/time";
import { getStorage, removeStorage, setStorage } from "../utils/storage";
import type {
  CountdownDisplayItem,
  CountdownItem,
  DisplaySettings,
  HolidayEvent,
  LunchBreakSetting,
  SalarySettings,
  WorkSchedule,
} from "../types";
import { getLunarText } from "../utils/lunar";
import { ensureMajorHolidayEvents, parseHolidayICS } from "../utils/holiday";
import {
  findNextWorkSession,
  summarizeWorkProgress,
} from "../utils/workSession";

const STORAGE_KEYS = {
  workSchedule: "workSchedule",
  lunchBreak: "lunchBreak",
  salarySettings: "salarySettings",
  displaySettings: "displaySettings",
  customCountdowns: "customCountdowns",
  holidayEvents: "holidayEvents",
  holidaySyncTime: "holidaySyncTime",
} as const;

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  start: "09:00",
  end: "18:00",
  workdays: [1, 2, 3, 4, 5],
};

const DEFAULT_LUNCH_BREAK: LunchBreakSetting = {
  enabled: false,
  start: "12:00",
  end: "13:30",
};

const DEFAULT_SALARY_SETTINGS: SalarySettings = {
  day: 10,
  holidayRule: "nearest",
};

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showSeconds: false,
  mode: "normal",
};

function normalizeLunchBreak(
  value?: Partial<LunchBreakSetting> | null
): LunchBreakSetting {
  if (!value) return { ...DEFAULT_LUNCH_BREAK };
  return {
    enabled: Boolean(value.enabled),
    start: value.start || DEFAULT_LUNCH_BREAK.start,
    end: value.end || DEFAULT_LUNCH_BREAK.end,
  };
}

function normalizeSalarySettings(
  value?: Partial<SalarySettings> | null
): SalarySettings {
  if (!value) return { ...DEFAULT_SALARY_SETTINGS };
  const day = Number(value.day);
  const safeDay = Number.isFinite(day)
    ? Math.min(31, Math.max(1, Math.round(day)))
    : DEFAULT_SALARY_SETTINGS.day;
  const validRules: SalarySettings["holidayRule"][] = [
    "delay",
    "advance",
    "nearest",
    "ignore",
  ];
  const rule = validRules.includes(value.holidayRule as SalarySettings["holidayRule"])
    ? (value.holidayRule as SalarySettings["holidayRule"])
    : DEFAULT_SALARY_SETTINGS.holidayRule;
  return {
    day: safeDay,
    holidayRule: rule,
  };
}

function normalizeDisplaySettings(
  value?: Partial<DisplaySettings> | null
): DisplaySettings {
  if (!value) return { ...DEFAULT_DISPLAY_SETTINGS };
  return {
    showSeconds:
      typeof value.showSeconds === "boolean"
        ? value.showSeconds
        : DEFAULT_DISPLAY_SETTINGS.showSeconds,
    mode: value.mode === "stealth" ? "stealth" : "normal",
  };
}


export const useCountdownStore = defineStore("countdown", () => {
  const currentTime = ref(dayjs());
  const timer = ref<number | null>(null);
  const lunarCache = ref<{ dateKey: string; text: string }>({
    dateKey: "",
    text: "",
  });

  const workSchedule = ref<WorkSchedule>(
    getStorage<WorkSchedule>(STORAGE_KEYS.workSchedule, DEFAULT_WORK_SCHEDULE)
  );
  const lunchBreak = ref<LunchBreakSetting>(
    normalizeLunchBreak(
      getStorage<LunchBreakSetting | null>(
        STORAGE_KEYS.lunchBreak,
        DEFAULT_LUNCH_BREAK
      )
    )
  );
  const salarySettings = ref<SalarySettings>(
    normalizeSalarySettings(
      getStorage<SalarySettings | null>(
        STORAGE_KEYS.salarySettings,
        DEFAULT_SALARY_SETTINGS
      )
    )
  );
  const displaySettings = ref<DisplaySettings>(
    normalizeDisplaySettings(
      getStorage<DisplaySettings | null>(
        STORAGE_KEYS.displaySettings,
        DEFAULT_DISPLAY_SETTINGS
      )
    )
  );
  const customCountdowns = ref<CountdownItem[]>(
    getStorage<CountdownItem[]>(STORAGE_KEYS.customCountdowns, [])
  );
  const holidayEvents = ref<HolidayEvent[]>(
    getStorage<HolidayEvent[]>(STORAGE_KEYS.holidayEvents, [])
  );
  const holidaySyncTime = ref<string | null>(
    getStorage<string | null>(STORAGE_KEYS.holidaySyncTime, null)
  );
  const holidayLoading = ref(false);

  const lunarText = computed(() => {
    const now = currentTime.value;
    const dateKey = now.format("YYYY-MM-DD");
    if (lunarCache.value.dateKey !== dateKey) {
      lunarCache.value = {
        dateKey,
        text: getLunarText(now),
      };
    }
    return lunarCache.value.text;
  });

  const startTicker = () => {
    stopTicker();
    timer.value = window.setInterval(() => {
      currentTime.value = dayjs();
    }, 1000);
  };

  const stopTicker = () => {
    if (timer.value) {
      window.clearInterval(timer.value);
      timer.value = null;
    }
  };

  const workCountdown = computed(() => {
    const session = findNextWorkSession(
      currentTime.value,
      workSchedule.value,
      lunchBreak.value
    );
    if (!session) return null;
    const snapshot = summarizeWorkProgress(currentTime.value, session);
    const diffMs = snapshot.remainingMs;
    return {
      target: session.end.toISOString(),
      targetText: session.end.format("YYYY-MM-DD HH:mm:ss"),
      diffMs,
      text: formatDuration(diffMs),
      phase: snapshot.phase,
      totalMs: snapshot.totalMs,
      workedMs: snapshot.workedMs,
      isToday: session.isToday,
      lunchActive: snapshot.phase === "lunch",
    };
  });

  const currentDateInfo = computed(() => {
    const now = currentTime.value;
    const lunar = lunarText.value;
    return {
      date: now.format("YYYY年M月D日 dddd"),
      time: now.format("HH:mm:ss"),
      timeSimple: now.format("HH:mm"),
      lunar,
    };
  });

  const majorHolidayCountdowns = computed<CountdownDisplayItem[]>(() => {
    const ensured = ensureMajorHolidayEvents(holidayEvents.value);
    return ensured
      .map((event) => {
        const target = dayjs(event.date).startOf("day");
        const diffMs = target.diff(currentTime.value);
        return {
          id: event.id,
          name: event.name,
          targetDate: target.format("YYYY-MM-DD"),
          diffDays: Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))),
          diffText: formatDuration(diffMs),
        } as CountdownDisplayItem;
      })
      .sort((a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf());
  });

  const customCountdownDisplays = computed<CountdownDisplayItem[]>(() => {
    return customCountdowns.value
      .map((item) => {
        const target = dayjs(item.date).startOf("day");
        const diffMs = target.diff(currentTime.value);
        return {
          id: item.id,
          name: item.name,
          targetDate: target.format("YYYY-MM-DD"),
          diffDays: Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))),
          diffText: formatDuration(diffMs),
        } as CountdownDisplayItem;
      })
      .sort((a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf());
  });

  const setWorkSchedule = (value: WorkSchedule) => {
    const dedupWorkdays = Array.isArray(value.workdays)
      ? value.workdays.filter((day, index, arr) => arr.indexOf(day) === index)
      : undefined;
    const merged: WorkSchedule = {
      ...DEFAULT_WORK_SCHEDULE,
      ...value,
      workdays:
        dedupWorkdays && dedupWorkdays.length
          ? dedupWorkdays
          : DEFAULT_WORK_SCHEDULE.workdays,
    };
    workSchedule.value = merged;
    setStorage(STORAGE_KEYS.workSchedule, merged);
  };

  const setLunchBreakSetting = (value: LunchBreakSetting) => {
    const normalized = normalizeLunchBreak(value);
    lunchBreak.value = normalized;
    setStorage(STORAGE_KEYS.lunchBreak, normalized);
  };

  const setSalarySetting = (value: SalarySettings) => {
    const normalized = normalizeSalarySettings(value);
    salarySettings.value = normalized;
    setStorage(STORAGE_KEYS.salarySettings, normalized);
  };

  const updateDisplaySettings = (value: Partial<DisplaySettings>) => {
    const merged = normalizeDisplaySettings({
      ...displaySettings.value,
      ...value,
    });
    displaySettings.value = merged;
    setStorage(STORAGE_KEYS.displaySettings, merged);
  };

  const addCustomCountdown = (item: CountdownItem) => {
    customCountdowns.value = [...customCountdowns.value, item];
    setStorage(STORAGE_KEYS.customCountdowns, customCountdowns.value);
  };

  const updateCustomCountdown = (item: CountdownItem) => {
    customCountdowns.value = customCountdowns.value.map((it) =>
      it.id === item.id ? item : it
    );
    setStorage(STORAGE_KEYS.customCountdowns, customCountdowns.value);
  };

  const removeCustomCountdown = (id: string) => {
    customCountdowns.value = customCountdowns.value.filter((it) => it.id !== id);
    setStorage(STORAGE_KEYS.customCountdowns, customCountdowns.value);
  };

  const clearCustomCountdowns = () => {
    customCountdowns.value = [];
    removeStorage(STORAGE_KEYS.customCountdowns);
  };

  const syncHolidayFromICS = (icsText: string) => {
    try {
      holidayLoading.value = true;
      const parsed = parseHolidayICS(icsText);
      holidayEvents.value = parsed;
      holidaySyncTime.value = dayjs().toISOString();
      setStorage(STORAGE_KEYS.holidayEvents, parsed);
      setStorage(STORAGE_KEYS.holidaySyncTime, holidaySyncTime.value);
    } finally {
      holidayLoading.value = false;
    }
  };

  const resetHolidayEvents = () => {
    holidayEvents.value = [];
    holidaySyncTime.value = null;
    removeStorage(STORAGE_KEYS.holidayEvents);
    removeStorage(STORAGE_KEYS.holidaySyncTime);
  };

  return {
    currentTime,
    currentDateInfo,
    workSchedule,
    lunchBreak,
    salarySettings,
    displaySettings,
    workCountdown,
    majorHolidayCountdowns,
    customCountdowns,
    customCountdownDisplays,
    holidayEvents,
    holidaySyncTime,
    holidayLoading,
    setWorkSchedule,
    setLunchBreakSetting,
    setSalarySetting,
    updateDisplaySettings,
    addCustomCountdown,
    updateCustomCountdown,
    removeCustomCountdown,
    clearCustomCountdowns,
    syncHolidayFromICS,
    resetHolidayEvents,
    startTicker,
    stopTicker,
  };
});
