import { addDays, addMinutes, format, isValid, parseISO, startOfWeek } from "date-fns";

import type { DateKey } from "@/types";

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

/** Parses a yyyy-MM-dd key as local midnight. */
export function fromDateKey(key: DateKey): Date {
  return parseISO(key);
}

/** Parses yyyy-MM-ddTHH:mm (local) into a Date. */
export function fromLocalDateTime(value: string): Date {
  return parseISO(value);
}

export function toLocalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function isValidDateString(value: string): boolean {
  return !!value && isValid(parseISO(value));
}

export function sessionStart(date: DateKey, startTime: string): Date {
  return parseISO(`${date}T${startTime}`);
}

export function sessionEnd(date: DateKey, startTime: string, durationMinutes: number): Date {
  return addMinutes(sessionStart(date, startTime), durationMinutes);
}

export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekDays(date: Date): Date[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function formatTime12(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm a");
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
