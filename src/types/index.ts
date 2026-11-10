export type Priority = "low" | "medium" | "high";

export type AssignmentStatus = "not-started" | "in-progress" | "completed";

export type SubjectColor = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type ThemeMode = "light" | "dark";

/** Calendar date in local time, formatted yyyy-MM-dd. */
export type DateKey = string;

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  /** Optional goal for total study hours. */
  targetHours: number | null;
  createdAt: string;
  isSample?: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: DateKey;
  /** 24h time, HH:mm */
  startTime: string;
  durationMinutes: number;
  goal: string;
  completed: boolean;
  createdAt: string;
  isSample?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string | null;
  description: string;
  /** Local datetime, yyyy-MM-ddTHH:mm */
  deadline: string;
  priority: Priority;
  status: AssignmentStatus;
  createdAt: string;
  isSample?: boolean;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string | null;
  /** Local datetime, yyyy-MM-ddTHH:mm */
  dateTime: string;
  location: string;
  notes: string;
  createdAt: string;
  isSample?: boolean;
}

export interface Task {
  id: string;
  title: string;
  deadline: DateKey | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  isSample?: boolean;
}

/** Study time recorded outside planned sessions (manual log or Pomodoro). */
export interface StudyLog {
  id: string;
  subjectId: string | null;
  minutes: number;
  date: DateKey;
  source: "manual" | "pomodoro";
  createdAt: string;
  isSample?: boolean;
}

export interface Settings {
  name: string;
  theme: ThemeMode;
  onboarded: boolean;
  sampleBannerDismissed: boolean;
}

export interface AppState {
  version: 1;
  settings: Settings;
  subjects: Subject[];
  sessions: StudySession[];
  assignments: Assignment[];
  exams: Exam[];
  tasks: Task[];
  logs: StudyLog[];
}
