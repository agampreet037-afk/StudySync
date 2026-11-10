import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, ClipboardList, FilterX, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PriorityBadge, STATUS_LABEL, SubjectDot, SubjectLabel } from "@/components/common/Badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { IconAction } from "@/components/common/IconAction";
import { PageHeader } from "@/components/common/PageHeader";
import { AssignmentFormDialog } from "@/components/forms/AssignmentFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState, useSubjectsMap } from "@/hooks/use-app-store";
import { useNow } from "@/hooks/use-now";
import { fromLocalDateTime } from "@/lib/dates";
import {
  filterAssignments,
  isAssignmentOverdue,
  sortAssignments,
  type AssignmentFilters,
  type AssignmentSort,
} from "@/lib/stats";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Assignment, AssignmentStatus } from "@/types";

const DEFAULT_FILTERS: AssignmentFilters = { subjectId: "all", priority: "all", status: "all" };

export function AssignmentsPage() {
  const { assignments, subjects } = useAppState();
  const subjectsMap = useSubjectsMap();
  const now = useNow();
  const [filters, setFilters] = useState<AssignmentFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<AssignmentSort>("deadline-asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const visible = useMemo(
    () => sortAssignments(filterAssignments(assignments, filters, now), sort),
    [assignments, filters, sort, now],
  );
  const filtered =
    filters.subjectId !== "all" || filters.priority !== "all" || filters.status !== "all";

  const counts = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status !== "completed").length,
    overdue: assignments.filter((a) => isAssignmentOverdue(a, now)).length,
    done: assignments.filter((a) => a.status === "completed").length,
  };

  const setStatus = (a: Assignment, status: AssignmentStatus) => {
    actions.updateAssignment(a.id, { status });
    toast.success(`Marked “${a.title}” as ${STATUS_LABEL[status].toLowerCase()}`);
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Every deadline in one list — sorted, filtered and colour-coded."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> New assignment
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total, cls: "text-foreground" },
          { label: "Pending", value: counts.pending, cls: "text-info" },
          { label: "Overdue", value: counts.overdue, cls: "text-destructive" },
          { label: "Completed", value: counts.done, cls: "text-success" },
        ].map((c) => (
          <div key={c.label} className="surface-card px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className={cn("tabular font-display text-2xl font-bold", c.cls)}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="f-subject" className="text-xs">Subject</Label>
          <Select value={filters.subjectId} onValueChange={(v) => setFilters((f) => ({ ...f, subjectId: v }))}>
            <SelectTrigger id="f-subject">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              <SelectItem value="none">General</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <SubjectDot subject={s} /> {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-priority" className="text-xs">Priority</Label>
          <Select
            value={filters.priority}
            onValueChange={(v) => setFilters((f) => ({ ...f, priority: v as AssignmentFilters["priority"] }))}
          >
            <SelectTrigger id="f-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-status" className="text-xs">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v as AssignmentFilters["status"] }))}
          >
            <SelectTrigger id="f-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="not-started">Not started</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-sort" className="text-xs">Sort by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as AssignmentSort)}>
            <SelectTrigger id="f-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline-asc">Deadline (soonest)</SelectItem>
              <SelectItem value="deadline-desc">Deadline (latest)</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="newest">Recently added</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" disabled={!filtered} onClick={() => setFilters(DEFAULT_FILTERS)}>
          <FilterX /> Clear filters
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Add your first assignment to start tracking deadlines."
          action={
            <Button variant="soft" onClick={() => setFormOpen(true)}>
              <Plus /> Add assignment
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FilterX}
          title="No assignments match these filters"
          action={
            <Button variant="soft" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((a) => {
            const overdue = isAssignmentOverdue(a, now);
            const due = fromLocalDateTime(a.deadline);
            const subject = a.subjectId ? subjectsMap.get(a.subjectId) : undefined;
            return (
              <li
                key={a.id}
                className={cn(
                  "surface-card animate-rise flex flex-col gap-3 p-4 sm:flex-row sm:items-start",
                  overdue && "border-destructive/50 bg-destructive-soft/60",
                  a.status === "completed" && "opacity-70",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "font-sans text-base font-semibold tracking-normal",
                        a.status === "completed" && "line-through",
                      )}
                    >
                      {a.title}
                    </h3>
                    <PriorityBadge priority={a.priority} />
                    {overdue && (
                      <Badge variant="destructive">
                        <AlertTriangle className="size-3" aria-hidden /> Overdue
                      </Badge>
                    )}
                  </div>
                  {a.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <SubjectLabel subject={subject} />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        overdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      Due {format(due, "EEE d MMM yyyy, h:mm a")} ·{" "}
                      {overdue
                        ? `${formatDistanceToNowStrict(due)} late`
                        : a.status === "completed"
                          ? "done"
                          : `in ${formatDistanceToNowStrict(due)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:shrink-0">
                  <Select value={a.status} onValueChange={(v) => setStatus(a, v as AssignmentStatus)}>
                    <SelectTrigger className="h-8 w-36 text-xs" aria-label="Change status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not started</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <IconAction
                    icon={Pencil}
                    label="Edit assignment"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  />
                  <IconAction
                    icon={Trash2}
                    label="Delete assignment"
                    className="hover:text-destructive"
                    onClick={() => setDeleting(a)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AssignmentFormDialog open={formOpen} onOpenChange={setFormOpen} assignment={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this assignment?"
        description={deleting ? `“${deleting.title}” will be permanently removed.` : ""}
        onConfirm={() => {
          if (deleting) actions.deleteAssignment(deleting.id);
          setDeleting(null);
          toast.success("Assignment deleted");
        }}
      />
    </div>
  );
}
