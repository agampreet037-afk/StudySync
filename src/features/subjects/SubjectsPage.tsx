import { BookOpen, Clock, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { IconAction } from "@/components/common/IconAction";
import { PageHeader } from "@/components/common/PageHeader";
import { LogTimeDialog } from "@/components/forms/LogTimeDialog";
import { SubjectFormDialog } from "@/components/forms/SubjectFormDialog";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/hooks/use-app-store";
import { formatHours } from "@/lib/dates";
import { minutesBySubject, subjectProgressPercent } from "@/lib/stats";
import { actions } from "@/lib/storage";
import { subjectBg, subjectCssVar, subjectSoftBg, subjectText } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

const chartConfig = { hours: { label: "Hours studied", color: "var(--chart-1)" } } satisfies ChartConfig;

export function SubjectsPage() {
  const state = useAppState();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [logging, setLogging] = useState<Subject | null>(null);

  const minutes = minutesBySubject(state);
  const totalMinutes = Object.values(minutes).reduce((a, b) => a + b, 0);
  const chartData = state.subjects.map((s) => ({
    name: s.name,
    hours: Math.round(((minutes[s.id] ?? 0) / 60) * 10) / 10,
    target: s.targetHours ?? 0,
    fill: subjectCssVar(s.color),
  }));

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Track hours against your goals for every course."
        actions={
          <Button onClick={openNew}>
            <Plus /> Add subject
          </Button>
        }
      />

      {state.subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add the courses you're taking this term. You'll use them in the planner, assignments and focus timer."
          action={
            <Button variant="soft" onClick={openNew}>
              <Plus /> Add your first subject
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {state.subjects.map((s) => {
              const mins = minutes[s.id] ?? 0;
              const pct = subjectProgressPercent(s, mins);
              const sessions = state.sessions.filter((x) => x.subjectId === s.id);
              const doneSessions = sessions.filter((x) => x.completed).length;
              const openAssignments = state.assignments.filter(
                (a) => a.subjectId === s.id && a.status !== "completed",
              ).length;
              return (
                <article key={s.id} className="surface-card animate-rise overflow-hidden">
                  <div className={cn("h-1.5", subjectBg[s.color])} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            subjectSoftBg[s.color],
                            subjectText[s.color],
                          )}
                        >
                          <BookOpen className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-sans text-base font-semibold tracking-normal">
                            {s.name}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {s.targetHours ? `Target ${s.targetHours}h` : "No target set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0">
                        <IconAction
                          icon={Pencil}
                          label="Edit subject"
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                        />
                        <IconAction
                          icon={Trash2}
                          label="Delete subject"
                          className="hover:text-destructive"
                          onClick={() => setDeleting(s)}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <p className="tabular font-display text-3xl font-bold">{formatHours(mins)}</p>
                      {pct != null && (
                        <p className={cn("text-sm font-semibold", subjectText[s.color])}>{pct}%</p>
                      )}
                    </div>
                    <Progress
                      value={pct ?? 0}
                      className="mt-2 h-2 bg-muted"
                      aria-label={`${s.name} progress toward target`}
                    />
                    {pct == null && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Set a target to see progress.
                      </p>
                    )}

                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/60 py-2">
                        <dt className="text-[11px] text-muted-foreground">Sessions</dt>
                        <dd className="tabular text-sm font-semibold">
                          {doneSessions}/{sessions.length}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-muted/60 py-2">
                        <dt className="text-[11px] text-muted-foreground">Share</dt>
                        <dd className="tabular text-sm font-semibold">
                          {totalMinutes ? Math.round((mins / totalMinutes) * 100) : 0}%
                        </dd>
                      </div>
                      <div className="rounded-lg bg-muted/60 py-2">
                        <dt className="text-[11px] text-muted-foreground">Open tasks</dt>
                        <dd className="tabular text-sm font-semibold">{openAssignments}</dd>
                      </div>
                    </dl>

                    <Button variant="soft" size="sm" className="mt-4 w-full" onClick={() => setLogging(s)}>
                      <Clock /> Log study time
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="surface-card p-5">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <Target className="size-4 text-primary" aria-hidden /> Time spent by subject
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Completed planner sessions, focus rounds and logged hours.
            </p>
            <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
              <BarChart data={chartData} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
                />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}h`} />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.4 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _n, item) => (
                        <div className="flex w-full flex-col gap-0.5">
                          <span className="tabular font-semibold text-foreground">{value}h studied</span>
                          {item.payload?.target ? (
                            <span className="text-muted-foreground">Target {item.payload.target}h</span>
                          ) : null}
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </section>
        </div>
      )}

      <SubjectFormDialog open={formOpen} onOpenChange={setFormOpen} subject={editing} />
      <LogTimeDialog subject={logging} onOpenChange={(o) => !o && setLogging(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "subject"}?`}
        description="Its study sessions and logged hours will be deleted too. Assignments and exams for this subject are kept and moved to “General”."
        onConfirm={() => {
          if (deleting) actions.deleteSubject(deleting.id);
          toast.success(`${deleting?.name ?? "Subject"} deleted`);
          setDeleting(null);
        }}
      />
    </div>
  );
}
