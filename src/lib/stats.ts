import { format, isSameDay } from "date-fns";

import {
  fromLocalDateTime,
  sessionEnd,
  sessionStart,
  toDateKey,
  weekDays,
} from "@/lib/dates";
import type {
  AppState,
  Assignment,
  AssignmentStatus,
  Exam,
  Priority,
  StudySession,
  Subject,
  Task,
} from "@/types";

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/* ---------- Assignments ---------- */

export function isAssignmentOverdue(a: Pick<Assignment, "deadline" | "status">, now: Date) {
  return a.status !== "completed" && fromLocalDateTime(a.deadline).getTime() < now.getTime();
}

export type AssignmentSort = "deadline-asc" | "deadline-desc" | "priority" | "newest";

export interface AssignmentFilters {
  subjectId: string | "all";
  priority: Priority | "all";
  status: AssignmentStatus | "all" | "overdue";
}

export function filterAssignments(
  list: Assignment[],
  filters: AssignmentFilters,
  now: Date,
): Assignment[] {
  return list.filter((a) => {
    if (filters.subjectId !== "all" && (a.subjectId ?? "none") !== filters.subjectId) return false;
    if (filters.priority !== "all" && a.priority !== filters.priority) return false;
    if (filters.status === "overdue") return isAssignmentOverdue(a, now);
    if (filters.status !== "all" && a.status !== filters.status) return false;
    return true;
  });
}

export function sortAssignments(list: Assignment[], sort: AssignmentSort): Assignment[] {
  const copy = [...list];
  const time = (a: Assignment) => fromLocalDateTime(a.deadline).getTime();
  switch (sort) {
    case "deadline-asc":
      return copy.sort((a, b) => time(a) - time(b));
    case "deadline-desc":
      return copy.sort((a, b) => time(b) - time(a));
    case "priority":
      return copy.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || time(a) - time(b),
      );
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Unfinished assignments (overdue first, then soonest deadline). */
export function upcomingAssignments(list: Assignment[], limit = 5): Assignment[] {
  return sortAssignments(
    list.filter((a) => a.status !== "completed"),
    "deadline-asc",
  ).slice(0, limit);
}

/* ---------- Exams ---------- */

export function upcomingExams(list: Exam[], now: Date, limit = 5): Exam[] {
  return list
    .filter((e) => fromLocalDateTime(e.dateTime).getTime() >= now.getTime())
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    .slice(0, limit);
}

/* ---------- Tasks ---------- */

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  percent: number;
}

export function isTaskOverdue(t: Task, now: Date): boolean {
  return !t.completed && !!t.deadline && t.deadline < toDateKey(now);
}

export function taskStats(tasks: Task[], now: Date): TaskStats {
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  return {
    total,
    completed,
    pending: total - completed,
    overdue: tasks.filter((t) => isTaskOverdue(t, now)).length,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/**
 * Today's tasks are the ones due today plus any task completed today.
 * Completion % = completed / today's tasks (0 when there are none).
 */
export function todaysTaskProgress(tasks: Task[], now: Date) {
  const today = toDateKey(now);
  const todays = tasks.filter(
    (t) =>
      t.deadline === today || (t.completedAt != null && isSameDay(new Date(t.completedAt), now)),
  );
  const done = todays.filter((t) => t.completed).length;
  return {
    total: todays.length,
    done,
    percent: todays.length === 0 ? 0 : Math.round((done / todays.length) * 100),
  };
}

/* ---------- Study sessions ---------- */

export type SessionStatus = "completed" | "in-progress" | "upcoming" | "missed";

export function sessionStatus(s: StudySession, now: Date): SessionStatus {
  if (s.completed) return "completed";
  const start = sessionStart(s.date, s.startTime).getTime();
  const end = sessionEnd(s.date, s.startTime, s.durationMinutes).getTime();
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t <= end) return "in-progress";
  return "missed";
}

export function sortSessions(list: StudySession[]): StudySession[] {
  return [...list].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}

/** The next session that hasn't started yet (or is in progress), across all days. */
export function nextSession(list: StudySession[], now: Date): StudySession | undefined {
  return sortSessions(list).find((s) => {
    const st = sessionStatus(s, now);
    return st === "upcoming" || st === "in-progress";
  });
}

/* ---------- Study time ---------- */

/** Minutes studied on a given date: completed sessions + manual/Pomodoro logs. */
export function studiedMinutesOn(state: AppState, dateKey: string): number {
  const sessions = state.sessions
    .filter((s) => s.completed && s.date === dateKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const logs = state.logs
    .filter((l) => l.date === dateKey)
    .reduce((sum, l) => sum + l.minutes, 0);
  return sessions + logs;
}

export function plannedMinutesOn(state: AppState, dateKey: string): number {
  return state.sessions
    .filter((s) => s.date === dateKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export interface DayActivity {
  day: string;
  dateKey: string;
  studied: number;
  planned: number;
}

/** Monday–Sunday of the week containing `now`, values in hours. */
export function weeklyActivity(state: AppState, now: Date): DayActivity[] {
  return weekDays(now).map((d) => {
    const key = toDateKey(d);
    return {
      day: format(d, "EEE"),
      dateKey: key,
      studied: round1(studiedMinutesOn(state, key) / 60),
      planned: round1(plannedMinutesOn(state, key) / 60),
    };
  });
}

export function weekStudiedMinutes(state: AppState, now: Date): number {
  return weekDays(now).reduce((sum, d) => sum + studiedMinutesOn(state, toDateKey(d)), 0);
}

export function minutesBySubject(state: AppState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of state.sessions) {
    if (s.completed) out[s.subjectId] = (out[s.subjectId] ?? 0) + s.durationMinutes;
  }
  for (const l of state.logs) {
    if (l.subjectId) out[l.subjectId] = (out[l.subjectId] ?? 0) + l.minutes;
  }
  return out;
}

/** Percent of target hours reached, capped at 100. Null when the subject has no target. */
export function subjectProgressPercent(subject: Subject, minutes: number): number | null {
  if (!subject.targetHours || subject.targetHours <= 0) return null;
  return Math.min(100, Math.round((minutes / 60 / subject.targetHours) * 100));
}

export function totalFocusMinutes(state: AppState): number {
  return state.logs.filter((l) => l.source === "pomodoro").reduce((sum, l) => sum + l.minutes, 0);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
