import { storeToRefs } from "pinia";
import { useCountdownStore } from "../store/useCountdownStore";

export function useWorkProgress() {
  const store = useCountdownStore();
  const {
    workProgressSnapshot,
    workProgressPercent,
    workProgressPalette,
    workProgressStatusText,
    workProgressWorkedText,
    workProgressRemainingText,
    workProgressTotalText,
  } = storeToRefs(store);

  return {
    snapshot: workProgressSnapshot,
    percent: workProgressPercent,
    palette: workProgressPalette,
    statusText: workProgressStatusText,
    workedText: workProgressWorkedText,
    remainingText: workProgressRemainingText,
    totalText: workProgressTotalText,
  };
}
