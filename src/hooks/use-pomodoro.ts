/**
 * Pomodoro timer state lives in a small in-memory store so it survives page navigation.
 * The ticking interval lives in the component (usePomodoroTicker) and is cleared on unmount;
 * on the next mount it reconciles from `endsAt`, so no time is lost.
 */
import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";

import { modeDurationMs, nextMode, type PomodoroMode } from "@/lib/pomodoro";

export interface PomodoroState {
  mode: PomodoroMode;
  status: "idle" | "running" | "paused";
  /** Remaining time when paused/idle. */
  remainingMs: number;
  /** Epoch ms when the running session ends. */
  endsAt: number | null;
  /** Focus sessions completed in the current cycle (resets after a long break). */
  cycleCount: number;
  subjectId: string | null;
}

const initial: PomodoroState = {
  mode: "focus",
  status: "idle",
  remainingMs: modeDurationMs("focus"),
  endsAt: null,
  cycleCount: 0,
  subjectId: null,
};

let state: PomodoroState = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<PomodoroState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const pomodoro = {
  start() {
    if (state.status === "running") return;
    set({ status: "running", endsAt: Date.now() + state.remainingMs });
  },
  pause() {
    if (state.status !== "running" || state.endsAt == null) return;
    set({ status: "paused", remainingMs: Math.max(0, state.endsAt - Date.now()), endsAt: null });
  },
  toggle() {
    if (state.status === "running") pomodoro.pause();
    else pomodoro.start();
  },
  reset() {
    set({ status: "idle", remainingMs: modeDurationMs(state.mode), endsAt: null });
  },
  switchMode(mode: PomodoroMode) {
    set({ mode, status: "idle", remainingMs: modeDurationMs(mode), endsAt: null });
  },
  setSubject(subjectId: string | null) {
    set({ subjectId });
  },
};

export function usePomodoroState(): PomodoroState {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}

export function remainingNow(s: PomodoroState, now: number): number {
  if (s.status === "running" && s.endsAt != null) return Math.max(0, s.endsAt - now);
  return s.remainingMs;
}

/**
 * Drives the countdown while mounted. Calls `onComplete` once per finished session,
 * then moves to the next mode (idle, ready to start).
 */
export function usePomodoroTicker(
  onComplete: (finished: PomodoroMode, s: PomodoroState) => void,
): number {
  const s = usePomodoroState();
  const [, force] = useReducer((x: number) => x + 1, 0);
  const cb = useRef(onComplete);
  cb.current = onComplete;

  useEffect(() => {
    if (s.status !== "running") return;
    const tick = () => {
      if (state.status === "running" && state.endsAt != null && Date.now() >= state.endsAt) {
        const finished = state.mode;
        const snapshot = state;
        const cycleCount = finished === "focus" ? state.cycleCount + 1 : state.cycleCount;
        const upcoming = nextMode(finished, cycleCount);
        set({
          mode: upcoming,
          status: "idle",
          remainingMs: modeDurationMs(upcoming),
          endsAt: null,
          cycleCount: finished === "long" ? 0 : cycleCount,
        });
        cb.current(finished, snapshot);
      } else {
        force();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [s.status, force]);

  return remainingNow(s, Date.now());
}
