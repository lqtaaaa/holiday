import dayjs, { Dayjs } from "./time";
import type { LunchBreakSetting, WorkSchedule } from "../types";

export interface WorkSegment {
  start: Dayjs;
  end: Dayjs;
}

export interface WorkSession {
  date: Dayjs;
  start: Dayjs;
  end: Dayjs;
  segments: WorkSegment[];
  lunch?: { start: Dayjs; end: Dayjs };
  isToday: boolean;
}

export type WorkPhase = "before" | "working" | "lunch" | "after";

export interface WorkProgressSnapshot {
  session: WorkSession;
  totalMs: number;
  workedMs: number;
  remainingMs: number;
  phase: WorkPhase;
}

export function parseTimeToDayjs(base: Dayjs, time: string): Dayjs {
  const [hour, minute] = time.split(":").map((v) => Number(v));
  return base.hour(hour).minute(minute).second(0).millisecond(0);
}

function buildSegmentsForSession(
  date: Dayjs,
  schedule: WorkSchedule,
  lunch: LunchBreakSetting
): { segments: WorkSegment[]; lunch?: { start: Dayjs; end: Dayjs } } | null {
  const dayStart = date.startOf("day");
  const start = parseTimeToDayjs(dayStart, schedule.start);
  let end = parseTimeToDayjs(dayStart, schedule.end);

  if (!end.isAfter(start)) {
    return null;
  }

  let segments: WorkSegment[] = [{ start, end }];
  let lunchRange: { start: Dayjs; end: Dayjs } | undefined;

  if (lunch.enabled) {
    const lunchStartRaw = parseTimeToDayjs(dayStart, lunch.start);
    const lunchEndRaw = parseTimeToDayjs(dayStart, lunch.end);

    if (lunchEndRaw.isAfter(lunchStartRaw)) {
      const lunchStart = lunchStartRaw.isBefore(start) ? start : lunchStartRaw;
      const lunchEnd = lunchEndRaw.isAfter(end) ? end : lunchEndRaw;
      const intersects =
        lunchStart.isAfter(start) && lunchEnd.isBefore(end) && lunchEnd.isAfter(lunchStart);
      if (intersects) {
        lunchRange = { start: lunchStart, end: lunchEnd };
        segments = [
          { start, end: lunchStart },
          { start: lunchEnd, end },
        ].filter((segment) => segment.end.isAfter(segment.start));
      }
    }
  }

  if (!segments.length) {
    return null;
  }

  return { segments, lunch: lunchRange };
}

export function findNextWorkSession(
  now: Dayjs,
  schedule?: WorkSchedule | null,
  lunch?: LunchBreakSetting | null
): WorkSession | null {
  if (!schedule || !schedule.workdays?.length) return null;
  for (let i = 0; i < 21; i++) {
    const date = now.add(i, "day");
    if (!schedule.workdays.includes(date.day())) continue;
    const segmentsResult = buildSegmentsForSession(date, schedule, lunch || { enabled: false, start: "12:00", end: "13:30" });
    if (!segmentsResult) continue;
    const isToday = date.isSame(now, "day");
    const { segments, lunch: lunchRange } = segmentsResult;
    const session: WorkSession = {
      date,
      start: segments[0].start,
      end: segments[segments.length - 1].end,
      segments,
      lunch: lunchRange,
      isToday,
    };
    if (isToday && now.isSameOrAfter(session.end)) {
      continue;
    }
    return session;
  }
  return null;
}

export function summarizeWorkProgress(
  now: Dayjs,
  session: WorkSession
): WorkProgressSnapshot {
  let workedMs = 0;
  let remainingMs = 0;
  const totalMs = session.segments.reduce(
    (sum, item) => sum + item.end.diff(item.start),
    0
  );

  session.segments.forEach((segment) => {
    if (now.isSameOrBefore(segment.start)) {
      remainingMs += segment.end.diff(segment.start);
      return;
    }
    if (now.isSameOrAfter(segment.end)) {
      workedMs += segment.end.diff(segment.start);
      return;
    }
    workedMs += now.diff(segment.start);
    remainingMs += segment.end.diff(now);
  });

  let phase: WorkPhase = "before";
  if (now.isSameOrAfter(session.end)) {
    phase = "after";
  } else if (session.lunch && now.isAfter(session.lunch.start) && now.isBefore(session.lunch.end)) {
    phase = "lunch";
  } else if (now.isAfter(session.start)) {
    phase = "working";
  }

  if (!session.isToday || now.isSameOrBefore(session.start)) {
    phase = "before";
  }

  if (now.isSameOrAfter(session.end)) {
    phase = "after";
  }

  return {
    session,
    totalMs,
    workedMs: Math.min(workedMs, totalMs),
    remainingMs: Math.max(0, remainingMs),
    phase,
  };
}
