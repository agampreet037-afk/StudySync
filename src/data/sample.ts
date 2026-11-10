import { addDays, addHours, setHours, setMinutes, subDays } from "date-fns";

import { toDateKey, toLocalDateTime, weekStart } from "@/lib/dates";
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

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  theme: "light",
  onboarded: false,
  sampleBannerDismissed: false,
};

export function createEmptyState(settings: Settings = DEFAULT_SETTINGS): AppState {
  return {
    version: 1,
    settings: { ...settings },
    subjects: [],
    sessions: [],
    assignments: [],
    exams: [],
    tasks: [],
    logs: [],
  };
}

/** Realistic demo data positioned relative to `now`, so it always looks current. */
export function createSampleData(now: Date): Omit<AppState, "version" | "settings"> {
  const created = now.toISOString();
  const today = toDateKey(now);
  const monday = weekStart(now);
  const day = (offsetFromMonday: number) => toDateKey(addDays(monday, offsetFromMonday));
  const at = (base: Date, h: number, m = 0) => toLocalDateTime(setMinutes(setHours(base, h), m));

  const subject = (name: string, color: Subject["color"], targetHours: number | null): Subject => ({
    id: uid(),
    name,
    color,
    targetHours,
    createdAt: created,
    isSample: true,
  });

  const dsa = subject("Data Structures", "1", 40);
  const calc = subject("Calculus II", "3", 30);
  const physics = subject("Physics", "4", 35);
  const lit = subject("English Literature", "2", 20);
  const econ = subject("Microeconomics", "6", null);
  const subjects = [dsa, calc, physics, lit, econ];

  const todayIndex = (now.getDay() + 6) % 7; // Monday = 0
  const session = (
    subjectId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    goal: string,
    completed: boolean,
  ): StudySession => ({
    id: uid(),
    subjectId,
    date,
    startTime,
    durationMinutes,
    goal,
    completed,
    createdAt: created,
    isSample: true,
  });

  const sessions: StudySession[] = [];
  // Earlier this week (completed, one missed)
  const past: Array<[string, number, string, number, string, boolean]> = [
    [dsa.id, 0, "09:00", 90, "Review linked lists and stacks", true],
    [calc.id, 0, "15:00", 60, "Integration by parts — exercise set 4", true],
    [physics.id, 1, "10:00", 75, "Rotational dynamics notes", true],
    [lit.id, 1, "18:30", 45, "Read Act II of Hamlet", false],
    [dsa.id, 2, "09:30", 120, "Binary trees: traversal practice", true],
    [econ.id, 2, "16:00", 60, "Elasticity problem sheet", true],
    [calc.id, 3, "11:00", 90, "Series convergence tests", true],
    [physics.id, 4, "14:00", 60, "Lab report draft", true],
    [lit.id, 5, "10:00", 60, "Essay outline: tragic heroes", true],
  ];
  for (const [sid, offset, time, dur, goal, done] of past) {
    if (offset < todayIndex) sessions.push(session(sid, day(offset), time, dur, goal, done));
  }
  // Today
  sessions.push(
    session(dsa.id, today, "08:00", 60, "Warm-up: 3 LeetCode easy problems", true),
    session(calc.id, today, "13:00", 90, "Practice exam questions 1–10", false),
    session(physics.id, today, "17:30", 60, "Revise thermodynamics formulas", false),
    session(lit.id, today, "20:30", 45, "Annotate assigned poems", false),
  );
  // Coming days
  sessions.push(
    session(dsa.id, toDateKey(addDays(now, 1)), "09:00", 120, "Graphs: BFS & DFS", false),
    session(econ.id, toDateKey(addDays(now, 1)), "15:00", 60, "Market structures chapter", false),
    session(calc.id, toDateKey(addDays(now, 2)), "10:30", 90, "Power series review", false),
    session(physics.id, toDateKey(addDays(now, 3)), "14:00", 75, "Mock test", false),
  );

  const assignment = (
    title: string,
    subjectId: string | null,
    description: string,
    deadline: Date,
    priority: Assignment["priority"],
    status: Assignment["status"],
  ): Assignment => ({
    id: uid(),
    title,
    subjectId,
    description,
    deadline: toLocalDateTime(deadline),
    priority,
    status,
    createdAt: created,
    isSample: true,
  });

  const assignments: Assignment[] = [
    assignment(
      "Linked list implementation in C",
      dsa.id,
      "Implement insert, delete and reverse operations with test cases.",
      setMinutes(setHours(subDays(now, 1), 23), 59),
      "high",
      "in-progress",
    ),
    assignment(
      "Problem set 5: Integration techniques",
      calc.id,
      "Questions 1–20 from chapter 7. Show all working.",
      setMinutes(setHours(addDays(now, 1), 17), 0),
      "high",
      "in-progress",
    ),
    assignment(
      "Pendulum lab report",
      physics.id,
      "Include error analysis and graphs of period vs length.",
      setMinutes(setHours(addDays(now, 3), 12), 0),
      "medium",
      "not-started",
    ),
    assignment(
      "Essay: The role of fate in Macbeth",
      lit.id,
      "1500 words, MLA format, at least 4 sources.",
      setMinutes(setHours(addDays(now, 6), 23), 59),
      "medium",
      "not-started",
    ),
    assignment(
      "Supply & demand case study",
      econ.id,
      "Analyse the coffee market case and present findings in 5 slides.",
      setMinutes(setHours(addDays(now, 9), 10), 0),
      "low",
      "not-started",
    ),
    assignment(
      "Recursion worksheet",
      dsa.id,
      "Ten short recursion exercises.",
      setMinutes(setHours(subDays(now, 3), 18), 0),
      "low",
      "completed",
    ),
  ];

  const exam = (
    title: string,
    subjectId: string,
    date: Date,
    location: string,
    notes: string,
  ): Exam => ({
    id: uid(),
    title,
    subjectId,
    dateTime: toLocalDateTime(date),
    location,
    notes,
    createdAt: created,
    isSample: true,
  });

  const exams: Exam[] = [
    exam(
      "Calculus II midterm",
      calc.id,
      setMinutes(setHours(addDays(now, 4), 10), 0),
      "Hall B, Room 204",
      "Chapters 5–8. Formula sheet allowed.",
    ),
    exam(
      "Data Structures quiz",
      dsa.id,
      setMinutes(setHours(addDays(now, 8), 14), 0),
      "Lab 3",
      "Trees and graphs.",
    ),
    exam(
      "Physics end-semester",
      physics.id,
      setMinutes(setHours(addDays(now, 18), 9), 30),
      "Main auditorium",
      "Full syllabus. Bring a scientific calculator.",
    ),
  ];

  const task = (
    title: string,
    deadline: string | null,
    priority: Task["priority"],
    completed: boolean,
  ): Task => ({
    id: uid(),
    title,
    deadline,
    priority,
    completed,
    completedAt: completed ? addHours(now, -1).toISOString() : null,
    createdAt: created,
    isSample: true,
  });

  const tasks: Task[] = [
    task("Email professor about lab extension", today, "high", true),
    task("Print lecture slides for Calculus", today, "medium", true),
    task("Submit library book", today, "low", false),
    task("Form study group for DSA quiz", today, "medium", false),
    task("Buy graph paper", toDateKey(addDays(now, 2)), "low", false),
    task("Update resume for internship fair", toDateKey(addDays(now, 5)), "high", false),
    task("Pay hostel fees", toDateKey(subDays(now, 1)), "high", false),
    task("Download past exam papers", null, "medium", false),
  ];

  const log = (subjectId: string, minutes: number, date: string): StudyLog => ({
    id: uid(),
    subjectId,
    minutes,
    date,
    source: "pomodoro",
    createdAt: created,
    isSample: true,
  });

  const logs: StudyLog[] = [
    log(dsa.id, 25, today),
    log(calc.id, 25, today),
    { ...log(physics.id, 600, toDateKey(subDays(monday, 7))), source: "manual" },
    { ...log(dsa.id, 900, toDateKey(subDays(monday, 10))), source: "manual" },
    { ...log(calc.id, 480, toDateKey(subDays(monday, 5))), source: "manual" },
    { ...log(lit.id, 240, toDateKey(subDays(monday, 4))), source: "manual" },
    { ...log(econ.id, 180, toDateKey(subDays(monday, 3))), source: "manual" },
  ];
  for (let i = 0; i < todayIndex; i++) {
    logs.push(log(i % 2 === 0 ? dsa.id : physics.id, 25, day(i)));
  }

  return { subjects, sessions, assignments, exams, tasks, logs };
}
