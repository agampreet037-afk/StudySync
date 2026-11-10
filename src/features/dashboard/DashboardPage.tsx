import { Link } from "@tanstack/react-router";
import { differenceInCalendarDays, format, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Flame,
  GraduationCap,
  ListPlus,
  MapPin,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PriorityBadge, SubjectDot, SubjectLabel } from "@/components/common/Badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { AssignmentFormDialog } from "@/components/forms/AssignmentFormDialog";
import { SessionFormDialog } from "@/components/forms/SessionFormDialog";
import { TaskFormDialog } from "@/components/forms/TaskFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AcademicProgressChart, WeeklyActivityChart } from "@/features/dashboard/DashboardCharts";
import { useAppState, useSubjectsMap } from "@/hooks/use-app-store";
import { useNow } from "@/hooks/use-now";
import {
  formatHours,
  formatMinutes,
  formatTime12,
  fromLocalDateTime,
  greetingFor,
  toDateKey,
} from "@/lib/dates";
import {
  isAssignmentOverdue,
  minutesBySubject,
  nextSession,
  sessionStatus,
  sortSessions,
  studiedMinutesOn,
  subjectProgressPercent,
  todaysTaskProgress,
  upcomingAssignments,
  upcomingExams,
  weeklyActivity,
  weekStudiedMinutes,
} from "@/lib/stats";
import { actions, hasSampleData } from "@/lib/storage";
import { cn } from "@/lib/utils";

function Card({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: typeof Clock;
  action?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("surface-card animate-rise flex flex-col p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon className="size-4 text-primary" aria-hidden />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ to }: { to: "/planner" | "/assignments" | "/exams" | "/subjects" | "/tasks" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      View all <ArrowRight className="size-3" aria-hidden />
    </Link>
  );
}

export function DashboardPage() {
  const state = useAppState();
  const subjectsMap = useSubjectsMap();
  const now = useNow();
  const [dialog, setDialog] = useState<null | "task" | "assignment" | "session">(null);
  const [confirmSample, setConfirmSample] = useState(false);

  const name = state.settings.name.trim() || "there";
  const todayKey = toDateKey(now);

  const todaySessions = useMemo(
    () => sortSessions(state.sessions.filter((s) => s.date === todayKey)),
    [state.sessions, todayKey],
  );
  const upNext = nextSession(state.sessions, now);
  const taskProgress = todaysTaskProgress(state.tasks, now);
  const weekMinutes = weekStudiedMinutes(state, now);
  const todayMinutes = studiedMinutesOn(state, todayKey);
  const assignments = upcomingAssignments(state.assignments, 5);
  const overdueCount = state.assignments.filter((a) => isAssignmentOverdue(a, now)).length;
  const exams = upcomingExams(state.exams, now, 4);
  const activity = weeklyActivity(state, now);
  const bySubject = minutesBySubject(state);
  const todayTasks = state.tasks
    .filter((t) => t.deadline === todayKey)
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const showSampleBanner = hasSampleData(state) && !state.settings.sampleBannerDismissed;
  const nextDeadlines = state.assignments.filter((a) => {
    if (a.status === "completed") return false;
    const diff = fromLocalDateTime(a.deadline).getTime() - now.getTime();
    return diff >= 0 && diff <= 48 * 3600 * 1000;
  }).length;
  const remainingSessions = todaySessions.filter((s) => {
    const st = sessionStatus(s, now);
    return st === "upcoming" || st === "in-progress";
  }).length;

  return (
    <div className="space-y-6">
      {showSampleBanner && (
        <div className="animate-rise flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-foreground">
              <span className="font-semibold">You're exploring sample data.</span>{" "}
              <span className="text-muted-foreground">
                Try things out, then clear it to start fresh with your own subjects.
              </span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmSample(true)}>
              Clear sample data
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Dismiss"
              onClick={() => actions.updateSettings({ sampleBannerDismissed: true })}
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      {/* Greeting */}
      <section className="animate-rise relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-primary-foreground shadow-elevated sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/75">
              {format(now, "EEEE, d MMMM yyyy")}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              {greetingFor(now)}, {name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
              {remainingSessions > 0
                ? `${remainingSessions} study ${remainingSessions === 1 ? "session" : "sessions"} left today`
                : "No more sessions planned today"}
              {" · "}
              {nextDeadlines > 0
                ? `${nextDeadlines} ${nextDeadlines === 1 ? "deadline" : "deadlines"} in the next 48 hours`
                : "no deadlines in the next 48 hours"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="on-gradient" onClick={() => setDialog("task")}>
              <ListPlus /> Add task
            </Button>
            <Button variant="on-gradient" onClick={() => setDialog("assignment")}>
              <ClipboardPlus /> Add assignment
            </Button>
            <Button variant="on-gradient" onClick={() => setDialog("session")}>
              <CalendarPlus /> Plan session
            </Button>
            <Button variant="on-gradient" asChild>
              <Link to="/focus">
                <Timer /> Focus
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Today's tasks"
          value={taskProgress.total === 0 ? "—" : `${taskProgress.percent}%`}
          tone="success"
          hint={
            taskProgress.total === 0 ? (
              "Nothing due today"
            ) : (
              <div className="space-y-1.5">
                <Progress
                  value={taskProgress.percent}
                  className="h-1.5 bg-success-soft [&>div]:bg-success"
                  aria-label="Today's task completion"
                />
                <span>
                  {taskProgress.done} of {taskProgress.total} done
                </span>
              </div>
            )
          }
        />
        <StatCard
          icon={Flame}
          label="This week"
          value={formatHours(weekMinutes)}
          tone="primary"
          hint={`${formatMinutes(todayMinutes)} studied today`}
        />
        <StatCard
          icon={CalendarClock}
          label="Assignments due"
          value={state.assignments.filter((a) => a.status !== "completed").length}
          tone="lavender"
          hint={
            overdueCount > 0 ? (
              <span className="font-semibold text-destructive">{overdueCount} overdue</span>
            ) : (
              "Nothing overdue — nice!"
            )
          }
        />
        <StatCard
          icon={GraduationCap}
          label="Upcoming exams"
          value={upcomingExams(state.exams, now, 999).length}
          tone="blue"
          hint={
            exams[0]
              ? `Next in ${formatDistanceToNowStrict(fromLocalDateTime(exams[0].dateTime))}`
              : "No exams scheduled"
          }
        />
      </div>

      {/* Chart + today */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          title="Weekly study activity"
          icon={Flame}
          className="lg:col-span-3"
          action={
            <span className="text-xs text-muted-foreground">
              {format(new Date(`${activity[0]?.dateKey}T00:00`), "d MMM")} –{" "}
              {format(new Date(`${activity[6]?.dateKey}T00:00`), "d MMM")}
            </span>
          }
        >
          <WeeklyActivityChart data={activity} todayKey={todayKey} />
        </Card>

        <Card title="Today's schedule" icon={Clock} className="lg:col-span-2" action={<ViewAll to="/planner" />}>
          {todaySessions.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarPlus}
              title="No sessions today"
              description="Plan a focused block to make progress."
              action={
                <Button size="sm" variant="soft" onClick={() => setDialog("session")}>
                  Plan a session
                </Button>
              }
            />
          ) : (
            <ol className="space-y-2">
              {todaySessions.map((s) => {
                const subject = subjectsMap.get(s.subjectId);
                const status = sessionStatus(s, now);
                const isNext = upNext?.id === s.id;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                      isNext ? "border-primary/40 bg-primary-soft" : "border-border",
                      status === "completed" && "opacity-70",
                    )}
                  >
                    <Checkbox
                      checked={s.completed}
                      aria-label={`Mark ${subject?.name ?? "session"} as ${s.completed ? "not done" : "done"}`}
                      onCheckedChange={(c) => {
                        actions.updateSession(s.id, { completed: c === true });
                        if (c === true) toast.success("Session completed — great work!");
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <SubjectDot subject={subject} />
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            s.completed && "line-through",
                          )}
                        >
                          {subject?.name ?? "Unknown subject"}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatTime12(s.startTime)} · {formatMinutes(s.durationMinutes)}
                        {s.goal ? ` · ${s.goal}` : ""}
                      </p>
                    </div>
                    {isNext && status === "in-progress" && <Badge variant="soft">Now</Badge>}
                    {isNext && status === "upcoming" && <Badge variant="soft">Up next</Badge>}
                    {status === "missed" && <Badge variant="muted">Missed</Badge>}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      {/* Deadlines, exams, tasks */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Upcoming deadlines" icon={CalendarClock} action={<ViewAll to="/assignments" />}>
          {assignments.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardPlus}
              title="All caught up"
              description="No pending assignments."
            />
          ) : (
            <ul className="space-y-2">
              {assignments.map((a) => {
                const overdue = isAssignmentOverdue(a, now);
                const due = fromLocalDateTime(a.deadline);
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-lg border p-3",
                      overdue ? "border-destructive/40 bg-destructive-soft" : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{a.title}</p>
                      <PriorityBadge priority={a.priority} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <SubjectLabel subject={a.subjectId ? subjectsMap.get(a.subjectId) : undefined} />
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          overdue ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {overdue
                          ? `Overdue ${formatDistanceToNowStrict(due)}`
                          : `Due ${format(due, "EEE d MMM, h:mm a")}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Upcoming exams" icon={GraduationCap} action={<ViewAll to="/exams" />}>
          {exams.length === 0 ? (
            <EmptyState
              compact
              icon={GraduationCap}
              title="No exams scheduled"
              action={
                <Button size="sm" variant="soft" asChild>
                  <Link to="/exams">Add an exam</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {exams.map((e) => {
                const when = fromLocalDateTime(e.dateTime);
                const days = differenceInCalendarDays(when, now);
                return (
                  <li key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <span className="text-[10px] font-semibold uppercase">{format(when, "MMM")}</span>
                      <span className="font-display text-lg leading-none font-bold">
                        {format(when, "d")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {format(when, "h:mm a")}
                        {e.location && (
                          <>
                            <MapPin className="ml-1 size-3" aria-hidden /> {e.location}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant={days <= 3 ? "warning" : "info"}>
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Due today" icon={CheckCircle2} action={<ViewAll to="/tasks" />}>
          {todayTasks.length === 0 ? (
            <EmptyState
              compact
              icon={ListPlus}
              title="No tasks due today"
              action={
                <Button size="sm" variant="soft" onClick={() => setDialog("task")}>
                  Add a task
                </Button>
              }
            />
          ) : (
            <ul className="space-y-1">
              {todayTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <Checkbox
                    id={`dash-task-${t.id}`}
                    checked={t.completed}
                    onCheckedChange={() => actions.toggleTask(t.id)}
                  />
                  <label
                    htmlFor={`dash-task-${t.id}`}
                    className={cn(
                      "min-w-0 flex-1 cursor-pointer truncate text-sm",
                      t.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </label>
                  <PriorityBadge priority={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Subject progress */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Subject progress" icon={Target} className="lg:col-span-3" action={<ViewAll to="/subjects" />}>
          {state.subjects.length === 0 ? (
            <EmptyState
              compact
              icon={Target}
              title="No subjects yet"
              description="Add subjects to track hours against your targets."
              action={
                <Button size="sm" variant="soft" asChild>
                  <Link to="/subjects">Add a subject</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {state.subjects.map((s) => {
                const minutes = bySubject[s.id] ?? 0;
                const pct = subjectProgressPercent(s, minutes);
                return (
                  <li key={s.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        <SubjectDot subject={s} />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        {formatHours(minutes)}
                        {s.targetHours ? ` / ${s.targetHours}h` : ""}
                        {pct != null && <span className="ml-2 font-semibold text-foreground">{pct}%</span>}
                      </span>
                    </div>
                    <Progress
                      value={pct ?? 0}
                      className="h-2 bg-muted"
                      aria-label={`${s.name} progress`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Hours by subject" icon={Sparkles} className="lg:col-span-2">
          <AcademicProgressChart subjects={state.subjects} minutesBySubject={bySubject} />
        </Card>
      </div>

      <TaskFormDialog open={dialog === "task"} onOpenChange={(o) => !o && setDialog(null)} />
      <AssignmentFormDialog
        open={dialog === "assignment"}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <SessionFormDialog open={dialog === "session"} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={confirmSample}
        onOpenChange={setConfirmSample}
        title="Clear sample data?"
        description="All sample subjects, sessions, assignments, exams and tasks will be removed. Anything you added yourself stays."
        confirmLabel="Clear sample data"
        onConfirm={() => {
          actions.removeSampleData();
          toast.success("Sample data cleared — you're starting fresh");
        }}
      />
    </div>
  );
}
