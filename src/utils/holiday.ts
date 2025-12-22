import dayjs from "./time";
import type { HolidayEvent } from "../types";

interface MajorHolidayConfig {
  name: string;
  type: "solar" | "lunar" | "special";
  month?: number;
  day?: number;
}

const MAJOR_HOLIDAYS: MajorHolidayConfig[] = [
  { name: "元旦", type: "solar", month: 1, day: 1 },
  { name: "春节", type: "lunar", month: 1, day: 1 },
  { name: "清明", type: "special" },
  { name: "劳动节", type: "solar", month: 5, day: 1 },
  { name: "端午", type: "lunar", month: 5, day: 5 },
  { name: "中秋", type: "lunar", month: 8, day: 15 },
  { name: "国庆", type: "solar", month: 10, day: 1 },
];

function calculateQingming(year: number): dayjs.Dayjs {
  // 基于常用的清明节算法：Y * 0.2422 + 4.81 - floor((Y-1)/4)
  const c = year <= 1999 ? 5.59 : 4.81;
  const y = year % 100;
  const day = Math.floor(y * 0.2422 + c) - Math.floor(y / 4);
  return dayjs().year(year).month(3).date(day).startOf("day");
}

function computeFallbackDate(config: MajorHolidayConfig, year: number): dayjs.Dayjs {
  try {
    if (config.type === "solar" && config.month && config.day) {
      return dayjs()
        .year(year)
        .month(config.month - 1)
        .date(config.day)
        .startOf("day");
    }
    if (config.type === "lunar" && config.month && config.day) {
      return dayjs.lunar(year, config.month, config.day).startOf("day");
    }
    if (config.type === "special" && config.name === "清明") {
      return calculateQingming(year);
    }
  } catch (error) {
    console.error("[holiday:fallback]", config.name, year, error);
  }
  return dayjs().year(year).startOf("year");
}

function findNextEvent(
  events: HolidayEvent[],
  name: string
): HolidayEvent | null {
  const now = dayjs();

  // 过滤出匹配的事件，排除包含"(班)"的事件
  const filtered = events
    .filter((event) => {
      const eventName = event.name;
      // 必须包含节假日名称
      if (!eventName.includes(name)) return false;
      // 排除工作日（班）
      if (eventName.includes("(班)") || eventName.includes("（班）")) return false;
      return true;
    })
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

  // 优先查找带有"(休)"标记的第一个未来事件
  for (const event of filtered) {
    if (dayjs(event.date).endOf("day").isAfter(now)) {
      const eventName = event.name;
      if (eventName.includes("(休)") || eventName.includes("（休）")) {
        return event;
      }
    }
  }

  // 如果没有找到带"(休)"的，返回第一个不带后缀的未来事件
  for (const event of filtered) {
    if (dayjs(event.date).endOf("day").isAfter(now)) {
      return event;
    }
  }

  return null;
}

export function ensureMajorHolidayEvents(
  events: HolidayEvent[]
): HolidayEvent[] {
  const now = dayjs();
  const ensured: HolidayEvent[] = [];

  MAJOR_HOLIDAYS.forEach((config) => {
    const next = findNextEvent(events, config.name);
    if (next) {
      // 清理节假日名称，去掉（休）（班）等后缀
      const cleanName = next.name
        .replace(/[（(]休[）)]/g, "")
        .replace(/[（(]班[）)]/g, "")
        .trim();

      ensured.push({
        ...next,
        name: cleanName || config.name, // 如果清理后为空，使用配置的名称
      });
      return;
    }

    let year = now.year();
    let fallback = computeFallbackDate(config, year);
    if (fallback.endOf("day").isBefore(now)) {
      year += 1;
      fallback = computeFallbackDate(config, year);
    }
    ensured.push({
      id: `${config.name}-${fallback.format("YYYY")}`,
      name: config.name,
      date: fallback.format("YYYY-MM-DD"),
      source: "custom",
    });
  });

  return ensured.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
}
