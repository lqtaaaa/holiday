export interface WorkSchedule {
  start: string; // HH:mm
  end: string; // HH:mm
  workdays: number[]; // 0-6, 0 for Sunday
}

export interface CountdownItem {
  id: string;
  name: string;
  date: string; // ISO string or YYYY-MM-DD
  note?: string;
}

export interface HolidayEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  source: "ics" | "custom";
}

export interface CountdownDisplayItem {
  id: string;
  name: string;
  targetDate: string;
  diffDays: number;
  diffText: string;
}
