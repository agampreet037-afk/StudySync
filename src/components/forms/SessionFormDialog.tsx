import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
import { SubjectSelect } from "@/components/common/Selects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/hooks/use-app-store";
import { toDateKey } from "@/lib/dates";
import { actions } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { hasErrors, validateSession, type FieldErrors, type SessionInput } from "@/lib/validation";
import type { StudySession } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: StudySession | null | undefined;
  defaultDate?: string | undefined;
}

const QUICK_DURATIONS = [30, 45, 60, 90, 120];

export function SessionFormDialog({ open, onOpenChange, session, defaultDate }: Props) {
  const { subjects } = useAppState();
  const [form, setForm] = useState({
    subjectId: "",
    date: "",
    startTime: "09:00",
    duration: "60",
    goal: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof SessionInput>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      session
        ? {
            subjectId: session.subjectId,
            date: session.date,
            startTime: session.startTime,
            duration: String(session.durationMinutes),
            goal: session.goal,
          }
        : {
            subjectId: subjects[0]?.id ?? "",
            date: defaultDate ?? toDateKey(new Date()),
            startTime: "09:00",
            duration: "60",
            goal: "",
          },
    );
  }, [open, session, defaultDate, subjects]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input: SessionInput = {
      subjectId: form.subjectId,
      date: form.date,
      startTime: form.startTime,
      durationMinutes: form.duration.trim() === "" ? Number.NaN : Number(form.duration),
      goal: form.goal.trim(),
    };
    const errs = validateSession(input);
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (session) {
      actions.updateSession(session.id, input);
      toast.success("Study session updated");
    } else {
      actions.addSession(input);
      toast.success("Study session added to your planner");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {session ? "Edit study session" : "Plan a study session"}
          </DialogTitle>
          <DialogDescription>Block focused time for a subject.</DialogDescription>
        </DialogHeader>

        {subjects.length === 0 ? (
          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            Add a subject first so you can plan sessions for it.{" "}
            <Link
              to="/subjects"
              className="font-semibold text-primary underline-offset-4 hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Go to Subjects
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormField id="session-subject" label="Subject" error={errors.subjectId}>
              <SubjectSelect
                id="session-subject"
                subjects={subjects}
                value={form.subjectId}
                onChange={(v) => set({ subjectId: v })}
                invalid={!!errors.subjectId}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="session-date" label="Date" error={errors.date}>
                <Input
                  id="session-date"
                  type="date"
                  value={form.date}
                  aria-invalid={!!errors.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
              </FormField>
              <FormField id="session-time" label="Start time" error={errors.startTime}>
                <Input
                  id="session-time"
                  type="time"
                  value={form.startTime}
                  aria-invalid={!!errors.startTime}
                  onChange={(e) => set({ startTime: e.target.value })}
                />
              </FormField>
            </div>
            <FormField
              id="session-duration"
              label="Duration (minutes)"
              error={errors.durationMinutes}
            >
              <Input
                id="session-duration"
                type="number"
                inputMode="numeric"
                min={5}
                max={600}
                step={5}
                value={form.duration}
                aria-invalid={!!errors.durationMinutes}
                onChange={(e) => set({ duration: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set({ duration: String(d) })}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      form.duration === String(d)
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField id="session-goal" label="Study goal" optional error={errors.goal}>
              <Textarea
                id="session-goal"
                rows={2}
                placeholder="e.g. Finish exercises 4.1 – 4.6"
                value={form.goal}
                onChange={(e) => set({ goal: e.target.value })}
              />
            </FormField>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{session ? "Save changes" : "Add session"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
