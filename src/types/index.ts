export interface WorkSchedule {
  start: string; // HH:mm
  end: string; // HH:mm
  workdays: number[]; // 0-6, 0 for Sunday
}

export interface LunchBreakSetting {
  enabled: boolean;
  start: string;
  end: string;
}

export type HolidayAdjustmentRule = "delay" | "advance" | "nearest" | "ignore";

export interface SalarySettings {
  day: number;
  holidayRule: HolidayAdjustmentRule;
}

export type DisplayMode = "normal" | "stealth";

export interface DisplaySettings {
  showSeconds: boolean;
  mode: DisplayMode;
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

// 礼花颜色方案
export type ConfettiColorScheme = 'classic' | 'golden' | 'purple' | 'rainbow';

// 礼花强度
export type ConfettiIntensity = 'low' | 'medium' | 'high';

// 礼花设置
export interface ConfettiSettings {
  enabled: boolean;
  colorScheme: ConfettiColorScheme;
  intensity: ConfettiIntensity;
  fullscreen: boolean;
}
