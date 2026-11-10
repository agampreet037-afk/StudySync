/**
 * StudySync data store.
 *
 * Everything the student creates lives in one JSON blob in localStorage under STORAGE_KEY.
 * Components read it through useSyncExternalStore (see src/hooks/use-app-store.ts) and write
 * through the `actions` object below — never touch localStorage directly elsewhere.
 */
import { createEmptyState, createSampleData, DEFAULT_SETTINGS } from "@/data/sample";
import { uid } from "@/lib/id";
import type {
  AppState,
  Assignment,
  Exam,
  Settings,
  StudyLog,
  StudySession,
  Subject,
  Task,
} from "@/types";

export const STORAGE_KEY = "studysync:data:v1";

type Listener = () => void;

const listeners = new Set<Listener>();
let current: AppState | null = null;
let serverSnapshot: AppState | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function withSample(settings: Settings): AppState {
  return { ...createEmptyState(settings), ...createSampleData(new Date()) };
}

/** Fills in any missing keys so older or hand-edited saves still load. */
function normalize(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<AppState>;
  const base = createEmptyState();
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    subjects: Array.isArray(r.subjects) ? r.subjects : base.subjects,
    sessions: Array.isArray(r.sessions) ? r.sessions : base.sessions,
    assignments: Array.isArray(r.assignments) ? r.assignments : base.assignments,
    exams: Array.isArray(r.exams) ? r.exams : base.exams,
    tasks: Array.isArray(r.tasks) ? r.tasks : base.tasks,
    logs: Array.isArray(r.logs) ? r.logs : base.logs,
  };
}

function load(): AppState {
  if (!isBrowser()) return createEmptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalize(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Corrupt data: fall through and start with sample data.
  }
  const seeded = withSample(DEFAULT_SETTINGS);
  persist(seeded);
  return seeded;
}

function persist(state: AppState) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — keep working in memory.
  }
}

export function getState(): AppState {
  if (!current) current = load();
  return current;
}

export function getServerState(): AppState {
  if (!serverSnapshot) serverSnapshot = createEmptyState();
  return serverSnapshot;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = null; // another tab changed data; reload lazily
    listener();
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

function update(updater: (s: AppState) => AppState) {
  current = updater(getState());
  persist(current);
  listeners.forEach((l) => l());
}

const now = () => new Date().toISOString();

/* ---------- Actions ---------- */

export const actions = {
  /* Settings */
  updateSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },

  /* Subjects */
  addSubject(input: Omit<Subject, "id" | "createdAt">): Subject {
    const subject: Subject = { ...input, id: uid(), createdAt: now() };
    update((s) => ({ ...s, subjects: [...s.subjects, subject] }));
    return subject;
  },
  updateSubject(id: string, patch: Partial<Omit<Subject, "id">>) {
    update((s) => ({
      ...s,
      subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch, isSample: false } : x)),
    }));
  },
  /** Removes the subject, its study sessions and logged time. Assignments/exams become "General". */
  deleteSubject(id: string) {
    update((s) => ({
      ...s,
      subjects: s.subjects.filter((x) => x.id !== id),
      sessions: s.sessions.filter((x) => x.subjectId !== id),
      logs: s.logs.filter((x) => x.subjectId !== id),
      assignments: s.assignments.map((a) => (a.subjectId === id ? { ...a, subjectId: null } : a)),
      exams: s.exams.map((e) => (e.subjectId === id ? { ...e, subjectId: null } : e)),
    }));
  },

  /* Study sessions */
  addSession(input: Omit<StudySession, "id" | "createdAt" | "completed">): StudySession {
    const session: StudySession = { ...input, id: uid(), createdAt: now(), completed: false };
    update((s) => ({ ...s, sessions: [...s.sessions, session] }));
    return session;
  },
  updateSession(id: string, patch: Partial<Omit<StudySession, "id">>) {
    update((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  },
  deleteSession(id: string) {
    update((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
  },

  /* Assignments */
  addAssignment(input: Omit<Assignment, "id" | "createdAt">): Assignment {
    const a: Assignment = { ...input, id: uid(), createdAt: now() };
    update((s) => ({ ...s, assignments: [...s.assignments, a] }));
    return a;
  },
  updateAssignment(id: string, patch: Partial<Omit<Assignment, "id">>) {
    update((s) => ({
      ...s,
      assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  },
  deleteAssignment(id: string) {
    update((s) => ({ ...s, assignments: s.assignments.filter((x) => x.id !== id) }));
  },

  /* Exams */
  addExam(input: Omit<Exam, "id" | "createdAt">): Exam {
    const e: Exam = { ...input, id: uid(), createdAt: now() };
    update((s) => ({ ...s, exams: [...s.exams, e] }));
    return e;
  },
  updateExam(id: string, patch: Partial<Omit<Exam, "id">>) {
    update((s) => ({
      ...s,
      exams: s.exams.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  },
  deleteExam(id: string) {
    update((s) => ({ ...s, exams: s.exams.filter((x) => x.id !== id) }));
  },

  /* Tasks */
  addTask(input: Omit<Task, "id" | "createdAt" | "completed" | "completedAt">): Task {
    const t: Task = { ...input, id: uid(), createdAt: now(), completed: false, completedAt: null };
    update((s) => ({ ...s, tasks: [t, ...s.tasks] }));
    return t;
  },
  updateTask(id: string, patch: Partial<Omit<Task, "id">>) {
    update((s) => ({
      ...s,
      tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  },
  toggleTask(id: string) {
    update((s) => ({
      ...s,
      tasks: s.tasks.map((x) =>
        x.id === id
          ? { ...x, completed: !x.completed, completedAt: x.completed ? null : now() }
          : x,
      ),
    }));
  },
  deleteTask(id: string) {
    update((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id) }));
  },
  clearCompletedTasks() {
    update((s) => ({ ...s, tasks: s.tasks.filter((x) => !x.completed) }));
  },

  /* Study logs */
  addLog(input: Omit<StudyLog, "id" | "createdAt">): StudyLog {
    const log: StudyLog = { ...input, id: uid(), createdAt: now() };
    update((s) => ({ ...s, logs: [...s.logs, log] }));
    return log;
  },
  deleteLog(id: string) {
    update((s) => ({ ...s, logs: s.logs.filter((x) => x.id !== id) }));
  },

  /* Data management */
  removeSampleData() {
    update((s) => {
      const subjects = s.subjects.filter((x) => !x.isSample);
      const kept = new Set(subjects.map((x) => x.id));
      return {
        ...s,
        settings: { ...s.settings, sampleBannerDismissed: true },
        subjects,
        sessions: s.sessions.filter((x) => !x.isSample && kept.has(x.subjectId)),
        assignments: s.assignments
          .filter((x) => !x.isSample)
          .map((a) => (a.subjectId && !kept.has(a.subjectId) ? { ...a, subjectId: null } : a)),
        exams: s.exams
          .filter((x) => !x.isSample)
          .map((e) => (e.subjectId && !kept.has(e.subjectId) ? { ...e, subjectId: null } : e)),
        tasks: s.tasks.filter((x) => !x.isSample),
        logs: s.logs.filter((x) => !x.isSample && (!x.subjectId || kept.has(x.subjectId))),
      };
    });
  },
  restoreSampleData() {
    update((s) => ({ ...withSample(s.settings), settings: { ...s.settings, sampleBannerDismissed: false } }));
  },
  /** Deletes every study item but keeps name and theme. */
  clearAllData() {
    update((s) => createEmptyState({ ...s.settings, sampleBannerDismissed: true }));
  },
};

export function hasSampleData(state: AppState): boolean {
  return (
    state.subjects.some((x) => x.isSample) ||
    state.sessions.some((x) => x.isSample) ||
    state.assignments.some((x) => x.isSample) ||
    state.exams.some((x) => x.isSample) ||
    state.tasks.some((x) => x.isSample) ||
    state.logs.some((x) => x.isSample)
  );
}

/** Test helper: forget the in-memory copy so the next read comes from localStorage. */
export function __resetStoreForTests() {
  current = null;
}
