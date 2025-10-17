import type { Dayjs } from "dayjs";

export function getLunarText(date: Dayjs): string {
  try {
    const text = date.format("LMLD");
    return text.trim();
  } catch (error) {
    console.error("[lunar] format lunar failed", error);
    return "";
  }
}
