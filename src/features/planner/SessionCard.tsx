import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SubjectDot } from "@/components/common/Badges";
import { IconAction } from "@/components/common/IconAction";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMinutes, formatTime12, sessionEnd } from "@/lib/dates";
import type { SessionStatus } from "@/lib/stats";
import { actions } from "@/lib/storage";
import { subjectBorder } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import type { StudySession, Subject } from "@/types";
import { format } from "date-fns";

interface Props {
  session: StudySession;
  subject: Subject | undefined;
  status: SessionStatus;
  isNext: boolean;
  compact?: boolean | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_BADGE: Record<SessionStatus, { label: string; variant: "success" | "soft" | "muted" | "warning" }> = {
  completed: { label: "Done", variant: "success" },
  "in-progress": { label: "In progress", variant: "warning" },
  upcoming: { label: "Upcoming", variant: "soft" },
  missed: { label: "Missed", variant: "muted" },
};

export function SessionCard({ session, subject, status, isNext, compact, onEdit, onDelete }: Props) {
  const end = format(sessionEnd(session.date, session.startTime, session.durationMinutes), "h:mm a");
  const badge = isNext && status === "upcoming" ? { label: "Up next", variant: "soft" as const } : STATUS_BADGE[status];

  const toggle = (checked: boolean) => {
    actions.updateSession(session.id, { completed: checked });
    toast.success(checked ? "Session marked as completed" : "Session marked as not completed");
  };

  return (
    <article
      className={cn(
        "group relative rounded-lg border border-l-4 bg-card transition-shadow hover:shadow-card",
        subject ? subjectBorder[subject.color] : "border-l-muted-foreground/40",
        isNext && "ring-2 ring-primary/30",
        status === "completed" && "opacity-75",
        compact ? "p-2" : "p-3 sm:p-4",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          checked={session.completed}
          onCheckedChange={(c) => toggle(c === true)}
          aria-label={session.completed ? "Mark as not completed" : "Mark as completed"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {compact && <SubjectDot subject={subject} />}
            <h3
              className={cn(
                "truncate font-sans font-semibold tracking-normal",
                compact ? "text-xs" : "text-sm",
                session.completed && "line-through",
              )}
            >
              {subject?.name ?? "Unknown subject"}
            </h3>
            {!compact && <Badge variant={badge.variant}>{badge.label}</Badge>}
          </div>
          <p className={cn("tabular text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
            {formatTime12(session.startTime)}
            {compact ? "" : ` – ${end}`} · {formatMinutes(session.durationMinutes)}
          </p>
          {!compact && session.goal && (
            <p className="mt-1.5 text-sm text-foreground/80">{session.goal}</p>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 gap-0.5",
            compact &&
              "xl:absolute xl:top-1 xl:right-1 xl:rounded-md xl:bg-card xl:opacity-0 xl:shadow-card xl:group-focus-within:opacity-100 xl:group-hover:opacity-100",
          )}
        >
          <IconAction icon={Pencil} label="Edit session" onClick={onEdit} className={compact ? "size-6" : ""} />
          <IconAction
            icon={Trash2}
            label="Delete session"
            onClick={onDelete}
            className={cn("hover:text-destructive", compact ? "size-6" : "")}
          />
        </div>
      </div>
    </article>
  );
}
