import { format, isToday, isTomorrow } from "date-fns";
import { CalendarDays, CheckCheck, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PriorityBadge } from "@/components/common/Badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { IconAction } from "@/components/common/IconAction";
import { PageHeader } from "@/components/common/PageHeader";
import { PrioritySelect } from "@/components/common/Selects";
import { TaskFormDialog } from "@/components/forms/TaskFormDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from "@/hooks/use-app-store";
import { useNow } from "@/hooks/use-now";
import { fromDateKey } from "@/lib/dates";
import { isTaskOverdue, PRIORITY_RANK, taskStats } from "@/lib/stats";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { validateTask } from "@/lib/validation";
import type { Priority, Task } from "@/types";

type Filter = "all" | "pending" | "completed";

function dueLabel(deadline: string) {
  const d = fromDateKey(deadline);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
}

export function TasksPage() {
  const { tasks } = useAppState();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [quickError, setQuickError] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = taskStats(tasks, now);
  const visible = tasks
    .filter((t) => (filter === "all" ? true : filter === "pending" ? !t.completed : t.completed))
    .sort(
      (a, b) =>
        Number(a.completed) - Number(b.completed) ||
        (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    );

  const quickAdd = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateTask({ title, deadline });
    if (errs.title || errs.deadline) {
      setQuickError(errs.title ?? errs.deadline ?? "");
      return;
    }
    actions.addTask({ title: title.trim(), deadline: deadline || null, priority });
    toast.success("Task added");
    setTitle("");
    setQuickError("");
  };

  return (
    <div>
      <PageHeader title="To-Do List" description="Quick wins, errands and everything in between." />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="surface-card p-4 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-muted-foreground">Completion</p>
            <p className="tabular font-display text-2xl font-bold">{stats.percent}%</p>
          </div>
          <Progress value={stats.percent} className="mt-2 h-2 bg-muted" aria-label="Task completion" />
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Pending</p>
          <p className="tabular font-display text-2xl font-bold text-info">{stats.pending}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Overdue</p>
          <p className="tabular font-display text-2xl font-bold text-destructive">{stats.overdue}</p>
        </div>
      </div>

      <form onSubmit={quickAdd} noValidate className="surface-card mb-5 p-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <label htmlFor="quick-task" className="sr-only">
            New task
          </label>
          <Input
            id="quick-task"
            value={title}
            placeholder="Add a task and press Enter…"
            aria-invalid={!!quickError}
            onChange={(e) => {
              setTitle(e.target.value);
              setQuickError("");
            }}
            className="flex-1"
          />
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 md:flex">
            <label htmlFor="quick-deadline" className="sr-only">
              Due date
            </label>
            <Input
              id="quick-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="md:w-40"
            />
            <div className="md:w-32">
              <PrioritySelect id="quick-priority" value={priority} onChange={setPriority} />
            </div>
            <Button type="submit">
              <Plus /> Add
            </Button>
          </div>
        </div>
        {quickError && (
          <p role="alert" className="mt-2 px-1 text-xs font-medium text-destructive">
            {quickError}
          </p>
        )}
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="sm"
          disabled={stats.completed === 0}
          onClick={() => setConfirmClear(true)}
        >
          <CheckCheck /> Clear completed
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Your list is empty"
          description="Add a task above — even small ones count."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={ListChecks}
          title={filter === "pending" ? "Nothing pending — enjoy the moment!" : "No completed tasks yet"}
        />
      ) : (
        <ul className="surface-card divide-y divide-border">
          {visible.map((t) => {
            const overdue = isTaskOverdue(t, now);
            return (
              <li key={t.id} className="group flex items-center gap-3 px-4 py-3">
                <Checkbox
                  id={`task-${t.id}`}
                  checked={t.completed}
                  onCheckedChange={() => {
                    actions.toggleTask(t.id);
                    if (!t.completed) toast.success("Task completed");
                  }}
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`task-${t.id}`}
                    className={cn(
                      "block cursor-pointer text-sm font-medium",
                      t.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </label>
                  {t.deadline && (
                    <p
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1 text-xs",
                        overdue ? "font-semibold text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <CalendarDays className="size-3" aria-hidden />
                      {overdue ? `Overdue · ${dueLabel(t.deadline)}` : dueLabel(t.deadline)}
                    </p>
                  )}
                </div>
                <PriorityBadge priority={t.priority} />
                <div className="flex gap-0.5">
                  <IconAction icon={Pencil} label="Edit task" onClick={() => setEditing(t)} />
                  <IconAction
                    icon={Trash2}
                    label="Delete task"
                    className="hover:text-destructive"
                    onClick={() => setDeleting(t)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TaskFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} task={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this task?"
        description={deleting ? `“${deleting.title}” will be permanently removed.` : ""}
        onConfirm={() => {
          if (deleting) actions.deleteTask(deleting.id);
          setDeleting(null);
          toast.success("Task deleted");
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear completed tasks?"
        description={`${stats.completed} completed ${stats.completed === 1 ? "task" : "tasks"} will be removed.`}
        confirmLabel="Clear completed"
        onConfirm={() => {
          actions.clearCompletedTasks();
          toast.success("Completed tasks cleared");
        }}
      />
    </div>
  );
}
