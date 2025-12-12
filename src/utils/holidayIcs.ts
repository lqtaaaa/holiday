import dayjs from "./time";
import ICAL from "ical.js";
import type { HolidayEvent } from "../types";

function ensureDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return dayjs(date).format("YYYY-MM-DD");
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

