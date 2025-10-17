import dayjs from "./time";
import ICAL from "ical.js";
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
  { name: "端午", type: "lunar", month: 5, day: 5 },
  { name: "中秋", type: "lunar", month: 8, day: 15 },
  { name: "国庆", type: "solar", month: 10, day: 1 },
];

function ensureDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return dayjs(date).format("YYYY-MM-DD");
}

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

export function parseHolidayICS(icsText: string): HolidayEvent[] {
  if (!icsText) return [];
  try {
    const jcalData = ICAL.parse(icsText);
    const component = new ICAL.Component(jcalData);
    const events = component.getAllSubcomponents("vevent") || [];

    const mapped: HolidayEvent[] = events
      .map((vevent) => {
        const event = new ICAL.Event(vevent);
        const date = event.startDate ? event.startDate.toJSDate() : null;
        const dayString = ensureDateString(date);
        if (!event.summary || !dayString) return null;
        return {
          id: event.uid || `${event.summary}-${dayString}`,
          name: event.summary,
          date: dayString,
          source: "ics",
        } as HolidayEvent;
      })
      .filter((item): item is HolidayEvent => Boolean(item));

    const uniqueMap = new Map<string, HolidayEvent>();
    mapped.forEach((item) => {
      const key = `${item.name}-${item.date}`;
      uniqueMap.set(key, item);
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
      dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
  } catch (error) {
    console.error("[holiday:parse] failed", error);
    return [];
  }
}

function findNextEvent(
  events: HolidayEvent[],
  name: string
): HolidayEvent | null {
  const now = dayjs();
  const sorted = events
    .filter((event) => event.name.includes(name))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  for (const event of sorted) {
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
      ensured.push(next);
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
