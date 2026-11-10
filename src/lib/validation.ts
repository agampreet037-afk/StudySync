import { isValidDateString } from "@/lib/dates";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const MIN_SESSION_MINUTES = 5;
export const MAX_SESSION_MINUTES = 600;

export interface SessionInput {
  subjectId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  goal: string;
}

export function validateSession(input: SessionInput): FieldErrors<keyof SessionInput> {
  const errors: FieldErrors<keyof SessionInput> = {};
  if (!input.subjectId) errors.subjectId = "Pick a subject for this session.";
  if (!input.date || !isValidDateString(input.date)) errors.date = "Choose a valid date.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime))
    errors.startTime = "Choose a valid start time.";
  if (
    !Number.isFinite(input.durationMinutes) ||
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < MIN_SESSION_MINUTES ||
    input.durationMinutes > MAX_SESSION_MINUTES
  ) {
    errors.durationMinutes = `Duration must be a whole number between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes.`;
  }
  if (input.goal.length > 200) errors.goal = "Keep the goal under 200 characters.";
  return errors;
}

export interface AssignmentInput {
  title: string;
  deadline: string;
  description: string;
}

export function validateAssignment(input: AssignmentInput): FieldErrors<keyof AssignmentInput> {
  const errors: FieldErrors<keyof AssignmentInput> = {};
  const title = input.title.trim();
  if (!title) errors.title = "Give the assignment a title.";
  else if (title.length > 120) errors.title = "Keep the title under 120 characters.";
  if (!input.deadline || !isValidDateString(input.deadline))
    errors.deadline = "Choose a valid deadline.";
  if (input.description.length > 1000)
    errors.description = "Keep the description under 1000 characters.";
  return errors;
}

export interface ExamInput {
  title: string;
  dateTime: string;
}

export function validateExam(input: ExamInput): FieldErrors<keyof ExamInput> {
  const errors: FieldErrors<keyof ExamInput> = {};
  const title = input.title.trim();
  if (!title) errors.title = "Give the exam a name.";
  else if (title.length > 120) errors.title = "Keep the name under 120 characters.";
  if (!input.dateTime || !isValidDateString(input.dateTime))
    errors.dateTime = "Choose a valid date and time.";
  return errors;
}

export interface TaskInput {
  title: string;
  deadline: string;
}

export function validateTask(input: TaskInput): FieldErrors<keyof TaskInput> {
  const errors: FieldErrors<keyof TaskInput> = {};
  const title = input.title.trim();
  if (!title) errors.title = "Write what needs to be done.";
  else if (title.length > 160) errors.title = "Keep the task under 160 characters.";
  if (input.deadline && !isValidDateString(input.deadline))
    errors.deadline = "Choose a valid date.";
  return errors;
}

export interface SubjectInput {
  name: string;
  targetHours: string;
}

export function validateSubject(
  input: SubjectInput,
  existingNames: string[],
): FieldErrors<keyof SubjectInput> {
  const errors: FieldErrors<keyof SubjectInput> = {};
  const name = input.name.trim();
  if (!name) errors.name = "Give the subject a name.";
  else if (name.length > 60) errors.name = "Keep the name under 60 characters.";
  else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase()))
    errors.name = "You already have a subject with this name.";
  if (input.targetHours.trim()) {
    const value = Number(input.targetHours);
    if (!Number.isFinite(value) || value <= 0 || value > 1000)
      errors.targetHours = "Target must be between 1 and 1000 hours.";
  }
  return errors;
}

export function validateLogMinutes(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Enter time greater than zero.";
  if (minutes > 24 * 60) return "You can log at most 24 hours at once.";
  return null;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
