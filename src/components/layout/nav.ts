import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to:
    | "/"
    | "/planner"
    | "/assignments"
    | "/exams"
    | "/tasks"
    | "/focus"
    | "/subjects"
    | "/settings";
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Study Planner", icon: CalendarDays },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/tasks", label: "To-Do", icon: ListChecks },
  { to: "/focus", label: "Focus Timer", icon: Timer },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
];

export const SETTINGS_ITEM: NavItem = { to: "/settings", label: "Settings", icon: Settings };
