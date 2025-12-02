import { computed } from "vue";
import { storeToRefs } from "pinia";
import dayjs, { Dayjs } from "../utils/time";
import { useCountdownStore } from "../store/useCountdownStore";
import type { HolidayEvent, SalarySettings } from "../types";

type LookupMark = "rest" | "work";

function buildHolidayLookup(events: HolidayEvent[]): Map<string, LookupMark> {
  const map = new Map<string, LookupMark>();
  events.forEach((event) => {
    if (!event.date) return;
    const key = dayjs(event.date).format("YYYY-MM-DD");
    // 判断是否为调休上班日：包含"班"但不包含"放假"或"休"
    const name = event.name || "";
    const isWorkday = name.includes("班") && !name.includes("放假") && !name.includes("休");
    const mark: LookupMark = isWorkday ? "work" : "rest";
    if (mark === "work") {
      map.set(key, "work");
    } else if (!map.has(key)) {
      map.set(key, "rest");
    }
  });
  return map;
}

function isNonWorkingDay(date: Dayjs, lookup: Map<string, LookupMark>): boolean {
  const key = date.format("YYYY-MM-DD");
  const mark = lookup.get(key);
  if (mark === "work") return false;
  if (mark === "rest") return true;
  const weekday = date.day();
  return weekday === 0 || weekday === 6;
}

function seekWorkingDay(
  date: Dayjs,
  lookup: Map<string, LookupMark>,
  direction: 1 | -1
): Dayjs {
  let cursor = date;
  for (let i = 0; i < 31; i++) {
    cursor = direction === 1 ? cursor.add(1, "day") : cursor.subtract(1, "day");
    if (!isNonWorkingDay(cursor, lookup)) {
      return cursor;
    }
  }
  return date;
}

function adjustByRule(
  base: Dayjs,
  rule: SalarySettings["holidayRule"],
  lookup: Map<string, LookupMark>
): Dayjs {
  if (rule === "ignore") return base;
  if (rule === "delay") {
    let cursor = base;
    for (let i = 0; i < 31; i++) {
      if (!isNonWorkingDay(cursor, lookup)) return cursor;
      cursor = cursor.add(1, "day");
    }
    return cursor;
  }
  if (rule === "advance") {
    let cursor = base;
    for (let i = 0; i < 31; i++) {
      if (!isNonWorkingDay(cursor, lookup)) return cursor;
      cursor = cursor.subtract(1, "day");
    }
    return cursor;
  }
  if (rule === "nearest") {
    if (!isNonWorkingDay(base, lookup)) return base;
    const prev = seekWorkingDay(base, lookup, -1);
    const next = seekWorkingDay(base, lookup, 1);
    const diffPrev = Math.abs(base.diff(prev, "day"));
    const diffNext = Math.abs(next.diff(base, "day"));
    return diffPrev <= diffNext ? prev : next;
  }
  return base;
}

function clampDay(year: number, monthIndex: number, day: number): Dayjs {
  const start = dayjs().year(year).month(monthIndex).date(1).hour(9).minute(0).second(0).millisecond(0);
  const actualDay = Math.min(day, start.daysInMonth());
  return start.date(actualDay);
}

function computeNextPayday(
  now: Dayjs,
  salary: SalarySettings,
  lookup: Map<string, LookupMark>
): { base: Dayjs; actual: Dayjs } | null {
  for (let i = 0; i < 18; i++) {
    const targetMonth = now.add(i, "month");
    const base = clampDay(targetMonth.year(), targetMonth.month(), salary.day);
    const actual = adjustByRule(base, salary.holidayRule, lookup);
    if (actual.endOf("day").isAfter(now)) {
      return { base, actual };
    }
  }
  return null;
}

export function usePayday() {
  const store = useCountdownStore();
  const { currentTime, salarySettings, holidayEvents } = storeToRefs(store);

  const lookup = computed(() => buildHolidayLookup(holidayEvents.value));

  const payday = computed(() => {
    if (!salarySettings.value) return null;
    const next = computeNextPayday(currentTime.value, salarySettings.value, lookup.value);
    if (!next) return null;
    const diffDays = Math.max(
      0,
      next.actual.startOf("day").diff(currentTime.value.startOf("day"), "day")
    );
    return {
      diffDays,
      dateText: next.actual.format("YYYY-MM-DD dddd"),
      exactTime: next.actual.format("YYYY-MM-DD HH:mm"),
      message:
        diffDays === 0
          ? "今天就能到账！"
          : `距离发工资还有 ${diffDays} 天`,
      isSoon: diffDays <= 3,
    };
  });

  return {
    payday,
  };
}
