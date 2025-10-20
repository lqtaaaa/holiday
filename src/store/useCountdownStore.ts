import { defineStore } from "pinia";
import { computed, ref } from "vue";
import dayjs, { Dayjs } from "../utils/time";
import { getStorage, removeStorage, setStorage } from "../utils/storage";
import type {
  CountdownDisplayItem,
  CountdownItem,
  HolidayEvent,
  WorkSchedule,
} from "../types";
import { getLunarText } from "../utils/lunar";
import { ensureMajorHolidayEvents, parseHolidayICS } from "../utils/holiday";

const STORAGE_KEYS = {
  workSchedule: "workSchedule",
  customCountdowns: "customCountdowns",
  holidayEvents: "holidayEvents",
  holidaySyncTime: "holidaySyncTime",
} as const;

const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  start: "09:00",
  end: "18:00",
  workdays: [1, 2, 3, 4, 5],
};

function parseTimeToDayjs(base: Dayjs, time: string): Dayjs {
  const [hour, minute] = time.split(":").map((v) => Number(v));
  return base.hour(hour).minute(minute).second(0).millisecond(0);
}

function getNextWorkEnd(now: Dayjs, schedule?: WorkSchedule | null): Dayjs | null {
  if (!schedule || !schedule.workdays?.length) return null;
  for (let i = 0; i < 14; i++) {
    const date = now.add(i === 0 ? 0 : 1, "day");
    const day = date.day();
    if (!schedule.workdays.includes(day)) continue;

    const start = parseTimeToDayjs(date.startOf("day"), schedule.start);
    const end = parseTimeToDayjs(date.startOf("day"), schedule.end);

    if (date.isBefore(start)) {
      return end;
    }

    if (date.isSame(now, "day")) {
      if (now.isBefore(end)) {
        return end;
      }
    } else {
      return end;
    }
  }
  return null;
}

function formatDuration(diffMs: number): string {
  if (diffMs <= 0) return "已到达";
  const duration = dayjs.duration(diffMs);
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  const parts: string[] = [];
  if (days) parts.push(`${days}天`);
  if (hours || parts.length) parts.push(`${hours}小时`);
  if (minutes || parts.length) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join("");
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
    const nextEnd = getNextWorkEnd(currentTime.value, workSchedule.value);
    if (!nextEnd) return null;
    const diffMs = nextEnd.diff(currentTime.value);
    return {
      target: nextEnd.toISOString(),
      targetText: nextEnd.format("YYYY-MM-DD HH:mm:ss"),
      diffMs,
      text: formatDuration(diffMs),
    };
  });

  const currentDateInfo = computed(() => {
    const now = currentTime.value;
    const lunar = lunarText.value;
    return {
      date: now.format("YYYY年M月D日 dddd"),
      time: now.format("HH:mm:ss"),
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
    workCountdown,
    majorHolidayCountdowns,
    customCountdowns,
    customCountdownDisplays,
    holidayEvents,
    holidaySyncTime,
    holidayLoading,
    setWorkSchedule,
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
