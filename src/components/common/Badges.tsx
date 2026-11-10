import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { subjectBg } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import type { AssignmentStatus, Priority, Subject } from "@/types";

const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
const PRIORITY_ICON = { high: ArrowUp, medium: Minus, low: ArrowDown };

export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = PRIORITY_ICON[priority];
  return (
    <Badge variant={priority} aria-label={`${PRIORITY_LABEL[priority]} priority`}>
      <Icon className="size-3" aria-hidden />
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const variant = status === "completed" ? "success" : status === "in-progress" ? "info" : "muted";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export function SubjectDot({ subject, className }: { subject?: Subject | undefined; className?: string | undefined }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        subject ? subjectBg[subject.color] : "bg-muted-foreground/40",
        className,
      )}
    />
  );
}

export function SubjectLabel({ subject }: { subject?: Subject | undefined }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <SubjectDot subject={subject} />
      <span className="truncate">{subject?.name ?? "General"}</span>
    </span>
  );
}
