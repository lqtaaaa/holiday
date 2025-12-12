import dayjs from "dayjs";
import { PluginLunar } from "dayjs-plugin-lunar";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import duration from "dayjs/plugin/duration";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(duration);
dayjs.extend(PluginLunar);

/**
 * 格式化时长为完整格式（含秒）
 * 例如：1天2小时30分15秒
 */
export function formatDuration(diffMs: number): string {
  if (diffMs <= 0) return "已到达";
  const dur = dayjs.duration(diffMs);
  const days = Math.floor(dur.asDays());
  const hours = dur.hours();
  const minutes = dur.minutes();
  const seconds = dur.seconds();
  const parts: string[] = [];
  if (days) parts.push(`${days}天`);
  if (hours || parts.length) parts.push(`${hours}小时`);
  if (minutes || parts.length) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join("");
}

/**
 * 格式化时长为紧凑格式（不含秒，除非时长小于1分钟）
 * 例如：2小时30分
 */
export function formatCompactDuration(ms: number): string {
  if (ms <= 0) return "0分";
  const dur = dayjs.duration(ms);
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();
  const parts: string[] = [];
  if (hours) parts.push(`${hours}小时`);
  if (minutes) parts.push(`${minutes}分`);
  if (!parts.length) {
    parts.push(`${dur.seconds()}秒`);
  }
  return parts.join("");
}

export default dayjs;
export type Dayjs = dayjs.Dayjs;
