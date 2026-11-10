import { addDays, format, isToday, subDays } from "date-fns";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { IconAction } from "@/components/common/IconAction";
import { PageHeader } from "@/components/common/PageHeader";
import { SessionFormDialog } from "@/components/forms/SessionFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionCard } from "@/features/planner/SessionCard";
import { useAppState, useSubjectsMap } from "@/hooks/use-app-store";
import { useNow } from "@/hooks/use-now";
import { formatMinutes, formatTime12, fromDateKey, toDateKey, weekDays } from "@/lib/dates";
import { nextSession, sessionStatus, sortSessions } from "@/lib/stats";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { StudySession } from "@/types";

type View = "day" | "week";

export function PlannerPage() {
  const { sessions } = useAppState();
  const subjects = useSubjectsMap();
  const now = useNow();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(() => toDateKey(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState<StudySession | null>(null);

  const cursorDate = fromDateKey(cursor);
  const days = view === "week" ? weekDays(cursorDate) : [cursorDate];
  const upNext = nextSession(sessions, now);

  const byDay = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    for (const s of sortSessions(sessions)) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [sessions]);

  const rangeSessions = days.flatMap((d) => byDay.get(toDateKey(d)) ?? []);
  const planned = rangeSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const done = rangeSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);

  const step = (dir: 1 | -1) => {
    const n = view === "week" ? 7 : 1;
    setCursor(toDateKey(dir === 1 ? addDays(cursorDate, n) : subDays(cursorDate, n)));
  };

  const openNew = (date?: string) => {
    setEditing(null);
    setDefaultDate(date ?? (view === "day" ? cursor : toDateKey(new Date())));
    setFormOpen(true);
  };

  const rangeLabel =
    view === "week"
      ? `${format(days[0]!, "d MMM")} – ${format(days[6]!, "d MMM yyyy")}`
      : format(cursorDate, "EEEE, d MMMM yyyy");

  const renderCard = (s: StudySession, compact: boolean) => (
    <SessionCard
      key={s.id}
      session={s}
      subject={subjects.get(s.subjectId)}
      status={sessionStatus(s, now)}
      isNext={upNext?.id === s.id}
      compact={compact}
      onEdit={() => {
        setEditing(s);
        setFormOpen(true);
      }}
      onDelete={() => setDeleting(s)}
    />
  );

  return (
    <div>
      <PageHeader
        title="Study Planner"
        description="Plan focused study blocks and tick them off as you go."
        actions={
          <Button onClick={() => openNew()}>
            <Plus /> Add session
          </Button>
        }
      />

      {upNext && (
        <div className="animate-rise mb-5 flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {sessionStatus(upNext, now) === "in-progress" ? "Happening now" : "Up next"}
              </p>
              <p className="text-sm font-semibold">
                {subjects.get(upNext.subjectId)?.name} ·{" "}
                {isToday(fromDateKey(upNext.date)) ? "Today" : format(fromDateKey(upNext.date), "EEE d MMM")}{" "}
                at {formatTime12(upNext.startTime)}
              </p>
              {upNext.goal && <p className="text-xs text-muted-foreground">{upNext.goal}</p>}
            </div>
          </div>
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              setCursor(upNext.date);
              setView("day");
            }}
          >
            View day
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconAction icon={ChevronLeft} label={view === "week" ? "Previous week" : "Previous day"} variant="outline" onClick={() => step(-1)} />
          <Button variant="outline" size="sm" className="h-8" onClick={() => setCursor(toDateKey(new Date()))}>
            Today
          </Button>
          <IconAction icon={ChevronRight} label={view === "week" ? "Next week" : "Next day"} variant="outline" onClick={() => step(1)} />
          <p className="ml-1 text-sm font-semibold">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="tabular text-xs text-muted-foreground">
            {formatMinutes(done)} done of {formatMinutes(planned)} planned
          </p>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "day" ? (
        <div className="space-y-3">
          {(byDay.get(cursor) ?? []).length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing planned for this day"
              description="Add a session to give your day some structure."
              action={
                <Button variant="soft" onClick={() => openNew(cursor)}>
                  <CalendarPlus /> Plan a session
                </Button>
              }
            />
          ) : (
            (byDay.get(cursor) ?? []).map((s) => renderCard(s, false))
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((d) => {
            const key = toDateKey(d);
            const list = byDay.get(key) ?? [];
            const today = isToday(d);
            const minutes = list.reduce((sum, s) => sum + s.durationMinutes, 0);
            return (
              <section
                key={key}
                aria-label={format(d, "EEEE d MMMM")}
                className={cn(
                  "flex min-h-32 flex-col rounded-xl border bg-card/60 p-2",
                  today ? "border-primary/40 bg-primary-soft/50" : "border-border",
                )}
              >
                <header className="mb-2 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCursor(key);
                      setView("day");
                    }}
                    className="rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={cn("block text-[11px] font-semibold uppercase", today ? "text-primary" : "text-muted-foreground")}>
                      {format(d, "EEE")}
                    </span>
                    <span className={cn("font-display text-lg font-bold", today && "text-primary")}>
                      {format(d, "d")}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {minutes > 0 && (
                      <span className="tabular text-[11px] text-muted-foreground">{formatMinutes(minutes)}</span>
                    )}
                    <IconAction
                      icon={Plus}
                      label={`Add session on ${format(d, "EEE d MMM")}`}
                      className="size-6"
                      onClick={() => openNew(key)}
                    />
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-1.5">
                  {list.length === 0 ? (
                    <p className="px-1 py-2 text-[11px] text-muted-foreground">Free</p>
                  ) : (
                    list.map((s) => renderCard(s, true))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editing}
        defaultDate={defaultDate}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this study session?"
        description="This removes it from your planner and study-time stats."
        onConfirm={() => {
          if (deleting) actions.deleteSession(deleting.id);
          setDeleting(null);
          toast.success("Study session deleted");
        }}
      />
    </div>
  );
}
