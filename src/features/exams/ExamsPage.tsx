import { differenceInCalendarDays, format } from "date-fns";
import { GraduationCap, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SubjectLabel } from "@/components/common/Badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { IconAction } from "@/components/common/IconAction";
import { PageHeader } from "@/components/common/PageHeader";
import { ExamFormDialog } from "@/components/forms/ExamFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppState, useSubjectsMap } from "@/hooks/use-app-store";
import { useNow } from "@/hooks/use-now";
import { fromLocalDateTime } from "@/lib/dates";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Exam } from "@/types";

function countdownLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function ExamsPage() {
  const { exams } = useAppState();
  const subjects = useSubjectsMap();
  const now = useNow();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState<Exam | null>(null);

  const sorted = [...exams].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const upcoming = sorted.filter((e) => fromLocalDateTime(e.dateTime) >= now);
  const past = sorted.filter((e) => fromLocalDateTime(e.dateTime) < now).reverse();

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const renderExam = (e: Exam, isPast: boolean) => {
    const when = fromLocalDateTime(e.dateTime);
    const days = differenceInCalendarDays(when, now);
    return (
      <li
        key={e.id}
        className={cn("surface-card animate-rise flex items-start gap-4 p-4", isPast && "opacity-60")}
      >
        <div
          className={cn(
            "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl",
            isPast ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground",
          )}
        >
          <span className="text-[11px] font-semibold uppercase">{format(when, "MMM")}</span>
          <span className="font-display text-xl leading-none font-bold">{format(when, "d")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-base font-semibold tracking-normal">{e.title}</h3>
            {!isPast && (
              <Badge variant={days <= 3 ? "warning" : "info"}>{countdownLabel(days)}</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <SubjectLabel subject={e.subjectId ? subjects.get(e.subjectId) : undefined} />
            <span>{format(when, "EEEE, h:mm a")}</span>
            {e.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden /> {e.location}
              </span>
            )}
          </div>
          {e.notes && <p className="mt-2 text-sm text-foreground/80">{e.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconAction
            icon={Pencil}
            label="Edit exam"
            onClick={() => {
              setEditing(e);
              setFormOpen(true);
            }}
          />
          <IconAction
            icon={Trash2}
            label="Delete exam"
            className="hover:text-destructive"
            onClick={() => setDeleting(e)}
          />
        </div>
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Exams"
        description="Countdowns for every test, quiz and final."
        actions={
          <Button onClick={openNew}>
            <Plus /> Add exam
          </Button>
        }
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No exams added"
          description="Add your exam dates so they show up on your dashboard."
          action={
            <Button variant="soft" onClick={openNew}>
              <Plus /> Add exam
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState compact icon={GraduationCap} title="No upcoming exams" />
            ) : (
              <ul className="space-y-3">{upcoming.map((e) => renderExam(e, false))}</ul>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Past ({past.length})
              </h2>
              <ul className="space-y-3">{past.map((e) => renderExam(e, true))}</ul>
            </section>
          )}
        </div>
      )}

      <ExamFormDialog open={formOpen} onOpenChange={setFormOpen} exam={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this exam?"
        description={deleting ? `“${deleting.title}” will be permanently removed.` : ""}
        onConfirm={() => {
          if (deleting) actions.deleteExam(deleting.id);
          setDeleting(null);
          toast.success("Exam deleted");
        }}
      />
    </div>
  );
}
