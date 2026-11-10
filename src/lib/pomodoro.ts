export type PomodoroMode = "focus" | "short" | "long";

export const POMODORO_MINUTES: Record<PomodoroMode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

export const POMODORO_LABELS: Record<PomodoroMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

/** Every 4th completed focus session earns a long break. */
export const FOCUS_SESSIONS_PER_LONG_BREAK = 4;

export function modeDurationMs(mode: PomodoroMode): number {
  return POMODORO_MINUTES[mode] * 60 * 1000;
}

/**
 * Mode that follows a finished session.
 * @param completedFocusCount focus sessions completed in this cycle, including the one just finished.
 */
export function nextMode(finished: PomodoroMode, completedFocusCount: number): PomodoroMode {
  if (finished !== "focus") return "focus";
  return completedFocusCount > 0 && completedFocusCount % FOCUS_SESSIONS_PER_LONG_BREAK === 0
    ? "long"
    : "short";
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
