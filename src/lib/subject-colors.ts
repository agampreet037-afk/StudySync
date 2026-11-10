import type { SubjectColor } from "@/types";

export const SUBJECT_COLORS: SubjectColor[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

export const SUBJECT_COLOR_NAMES: Record<SubjectColor, string> = {
  "1": "Indigo",
  "2": "Violet",
  "3": "Blue",
  "4": "Teal",
  "5": "Green",
  "6": "Amber",
  "7": "Rose",
  "8": "Slate",
};

/** Literal class names so Tailwind keeps them in the build. */
export const subjectBg: Record<SubjectColor, string> = {
  "1": "bg-subject-1",
  "2": "bg-subject-2",
  "3": "bg-subject-3",
  "4": "bg-subject-4",
  "5": "bg-subject-5",
  "6": "bg-subject-6",
  "7": "bg-subject-7",
  "8": "bg-subject-8",
};

export const subjectBorder: Record<SubjectColor, string> = {
  "1": "border-l-subject-1",
  "2": "border-l-subject-2",
  "3": "border-l-subject-3",
  "4": "border-l-subject-4",
  "5": "border-l-subject-5",
  "6": "border-l-subject-6",
  "7": "border-l-subject-7",
  "8": "border-l-subject-8",
};

export const subjectSoftBg: Record<SubjectColor, string> = {
  "1": "bg-subject-1/10",
  "2": "bg-subject-2/10",
  "3": "bg-subject-3/10",
  "4": "bg-subject-4/10",
  "5": "bg-subject-5/10",
  "6": "bg-subject-6/10",
  "7": "bg-subject-7/10",
  "8": "bg-subject-8/10",
};

export const subjectText: Record<SubjectColor, string> = {
  "1": "text-subject-1",
  "2": "text-subject-2",
  "3": "text-subject-3",
  "4": "text-subject-4",
  "5": "text-subject-5",
  "6": "text-subject-6",
  "7": "text-subject-7",
  "8": "text-subject-8",
};

export function subjectCssVar(color: SubjectColor): string {
  return `var(--subject-${color})`;
}
