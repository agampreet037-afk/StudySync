import { format } from "date-fns";
import { Coffee, Pause, Play, RotateCcw, Timer, TimerReset, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { SubjectLabel } from "@/components/common/Badges";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SubjectSelect } from "@/components/common/Selects";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppState, useSubjectsMap } from "@/hooks/use-app-store";
import {
  pomodoro,
  usePomodoroState,
  usePomodoroTicker,
  type PomodoroState,
} from "@/hooks/use-pomodoro";
import { formatMinutes, toDateKey, weekDays } from "@/lib/dates";
import {
  FOCUS_SESSIONS_PER_LONG_BREAK,
  formatCountdown,
  modeDurationMs,
  POMODORO_LABELS,
  POMODORO_MINUTES,
  type PomodoroMode,
} from "@/lib/pomodoro";
import { totalFocusMinutes } from "@/lib/stats";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Audio not available — the toast is enough.
  }
}

export function FocusPage() {
  const state = useAppState();
  const subjects = useSubjectsMap();

  const onComplete = useCallback((finished: PomodoroMode, snapshot: PomodoroState) => {
    playChime();
    if (finished === "focus") {
      actions.addLog({
        subjectId: snapshot.subjectId,
        minutes: POMODORO_MINUTES.focus,
        date: toDateKey(new Date()),
        source: "pomodoro",
      });
      toast.success("Focus session complete! 🎉", {
        description: "25 minutes recorded. Take a well-earned break.",
      });
    } else {
      toast("Break's over", { description: "Ready for another focus session?" });
    }
  }, []);

  const remaining = usePomodoroTicker(onComplete);
  const timer = usePomodoroState();
  const total = modeDurationMs(timer.mode);
  const progress = 1 - remaining / total;
  const running = timer.status === "running";

  // Show the countdown in the browser tab while running.
  useEffect(() => {
    const original = document.title;
    if (running) document.title = `${formatCountdown(remaining)} · ${POMODORO_LABELS[timer.mode]} — StudySync`;
    return () => {
      document.title = original;
    };
  }, [running, remaining, timer.mode]);

  // Space toggles start/pause when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.code !== "Space" || !el) return;
      if (el.closest("input, textarea, select, button, [role='combobox'], [role='tab']")) return;
      e.preventDefault();
      pomodoro.toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const todayKey = toDateKey(new Date());
  const focusLogs = state.logs.filter((l) => l.source === "pomodoro");
  const todayLogs = focusLogs.filter((l) => l.date === todayKey);
  const weekKeys = new Set(weekDays(new Date()).map(toDateKey));
  const weekFocus = focusLogs.filter((l) => weekKeys.has(l.date)).reduce((s, l) => s + l.minutes, 0);
  const recent = [...focusLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const ModeIcon = timer.mode === "focus" ? Zap : Coffee;

  return (
    <div>
      <PageHeader
        title="Focus Timer"
        description="Work in focused 25-minute sprints with short breaks in between."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="surface-card flex flex-col items-center p-6 sm:p-8 lg:col-span-3">
          <Tabs value={timer.mode} onValueChange={(v) => pomodoro.switchMode(v as PomodoroMode)}>
            <TabsList>
              {(Object.keys(POMODORO_MINUTES) as PomodoroMode[]).map((m) => (
                <TabsTrigger key={m} value={m}>
                  {POMODORO_LABELS[m]}
                  <span className="ml-1 hidden text-muted-foreground sm:inline">· {POMODORO_MINUTES[m]}m</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative my-8 aspect-square w-full max-w-72">
            <svg viewBox="0 0 280 280" className="size-full -rotate-90" aria-hidden>
              <circle cx="140" cy="140" r={RADIUS} fill="none" strokeWidth="14" className="stroke-muted" />
              <circle
                cx="140"
                cy="140"
                r={RADIUS}
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                className={cn(
                  "transition-[stroke-dashoffset] duration-300 ease-linear",
                  timer.mode === "focus" ? "stroke-primary" : "stroke-success",
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  "mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  timer.mode === "focus" ? "bg-primary-soft text-primary" : "bg-success-soft text-success",
                )}
              >
                <ModeIcon className="size-3.5" aria-hidden /> {POMODORO_LABELS[timer.mode]}
              </span>
              <span
                role="timer"
                aria-live="off"
                aria-label={`${formatCountdown(remaining)} remaining`}
                className="tabular font-mono text-6xl font-bold tracking-tight text-foreground sm:text-7xl"
              >
                {formatCountdown(remaining)}
              </span>
              <span className="mt-2 text-xs text-muted-foreground">
                Round {Math.min(timer.cycleCount + (timer.mode === "focus" ? 1 : 0), FOCUS_SESSIONS_PER_LONG_BREAK) || 1} of{" "}
                {FOCUS_SESSIONS_PER_LONG_BREAK}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="size-12 rounded-full" aria-label="Reset timer" onClick={() => pomodoro.reset()}>
                  <RotateCcw className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>
            <Button
              variant="hero"
              size="lg"
              className="h-14 min-w-40 rounded-full text-base"
              onClick={() => (running ? pomodoro.pause() : pomodoro.start())}
            >
              {running ? <Pause className="size-5" /> : <Play className="size-5" />}
              {running ? "Pause" : timer.status === "paused" ? "Resume" : "Start"}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-12 rounded-full"
                  aria-label="Switch mode"
                  onClick={() => pomodoro.switchMode(timer.mode === "focus" ? "short" : "focus")}
                >
                  {timer.mode === "focus" ? <Coffee className="size-5" /> : <Zap className="size-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{timer.mode === "focus" ? "Switch to break" : "Switch to focus"}</TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> to start or pause.
          </p>

          <div className="mt-6 w-full max-w-xs space-y-1.5">
            <Label htmlFor="focus-subject" className="text-xs">Studying</Label>
            <SubjectSelect
              id="focus-subject"
              subjects={state.subjects}
              value={timer.subjectId ?? "none"}
              allowNone
              onChange={(v) => pomodoro.setSubject(v === "none" ? null : v)}
            />
            <p className="text-xs text-muted-foreground">Completed focus time counts toward this subject.</p>
          </div>
        </section>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Timer} label="Total focus" value={formatMinutes(totalFocusMinutes(state))} tone="primary" />
            <StatCard icon={Trophy} label="Sessions" value={focusLogs.length} tone="lavender" hint="all time" />
            <StatCard
              icon={Zap}
              label="Today"
              value={todayLogs.length}
              tone="success"
              hint={`${formatMinutes(todayLogs.reduce((s, l) => s + l.minutes, 0))} focused`}
            />
            <StatCard icon={TimerReset} label="This week" value={formatMinutes(weekFocus)} tone="blue" />
          </div>

          <section className="surface-card p-5">
            <h2 className="mb-3 text-base font-semibold">Recent focus sessions</h2>
            {recent.length === 0 ? (
              <EmptyState compact icon={Timer} title="No sessions yet" description="Finish a 25-minute focus round to see it here." />
            ) : (
              <ul className="space-y-2">
                {recent.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
                    <SubjectLabel subject={l.subjectId ? subjects.get(l.subjectId) : undefined} />
                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                      {formatMinutes(l.minutes)} · {format(new Date(l.createdAt), "d MMM, h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
