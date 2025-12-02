import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useCountdownStore } from "../store/useCountdownStore";
import {
  findNextWorkSession,
  summarizeWorkProgress,
} from "../utils/workSession";
import { formatCompactDuration } from "../utils/time";

function resolvePalette(percent: number, phase: string | null): string {
  if (phase === "lunch") return "paused";
  if (percent >= 90) return "finish";
  if (percent >= 70) return "late";
  if (percent >= 30) return "mid";
  if (percent > 0) return "early";
  return "before";
}

export function useWorkProgress() {
  const store = useCountdownStore();
  const { currentTime, workSchedule, lunchBreak } = storeToRefs(store);

  const snapshot = computed(() => {
    if (!workSchedule.value?.workdays?.length) return null;
    const session = findNextWorkSession(
      currentTime.value,
      workSchedule.value,
      lunchBreak.value
    );
    if (!session) return null;
    return summarizeWorkProgress(currentTime.value, session);
  });

  const percent = computed(() => {
    const summary = snapshot.value;
    if (!summary || !summary.totalMs) return 0;
    return Math.min(100, Math.max(0, (summary.workedMs / summary.totalMs) * 100));
  });

  const palette = computed(() => {
    const summary = snapshot.value;
    return resolvePalette(percent.value, summary?.phase ?? null);
  });

  const statusText = computed(() => {
    const summary = snapshot.value;
    if (!summary) return "尚未配置工时";
    switch (summary.phase) {
      case "working":
        return "专注搬砖中";
      case "lunch":
        return "午休充电中";
      case "after":
        return "今日已完成";
      case "before":
      default:
        return summary.session.isToday ? "等待今日开工" : "下一班次待命";
    }
  });

  const workedText = computed(() =>
    formatCompactDuration(snapshot.value?.workedMs ?? 0)
  );
  const remainingText = computed(() =>
    formatCompactDuration(snapshot.value?.remainingMs ?? 0)
  );
  const totalText = computed(() =>
    formatCompactDuration(snapshot.value?.totalMs ?? 0)
  );

  return {
    snapshot,
    percent,
    palette,
    statusText,
    workedText,
    remainingText,
    totalText,
  };
}
