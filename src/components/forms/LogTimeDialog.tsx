import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
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
import { formatMinutes, toDateKey } from "@/lib/dates";
import { actions } from "@/lib/storage";
import { validateLogMinutes } from "@/lib/validation";
import type { Subject } from "@/types";

interface Props {
  subject: Subject | null;
  onOpenChange: (open: boolean) => void;
}

/** Records study hours done outside the planner (e.g. library time). */
export function LogTimeDialog({ subject, onOpenChange }: Props) {
  const open = !!subject;
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHours("1");
    setMinutes("0");
    setDate(toDateKey(new Date()));
    setError(null);
  }, [open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!subject) return;
    const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const err =
      Number(hours) < 0 || Number(minutes) < 0
        ? "Time can't be negative."
        : !date
          ? "Choose a date."
          : validateLogMinutes(total);
    setError(err);
    if (err) return;
    actions.addLog({
      subjectId: subject.id,
      minutes: Math.round(total),
      date,
      source: "manual",
    });
    toast.success(`Logged ${formatMinutes(total)} for ${subject.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Log study time</DialogTitle>
          <DialogDescription>
            Add hours you studied {subject ? `for ${subject.name}` : ""} outside the planner.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField id="log-h" label="Hours">
              <Input
                id="log-h"
                type="number"
                min={0}
                max={24}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </FormField>
            <FormField id="log-m" label="Minutes">
              <Input
                id="log-m"
                type="number"
                min={0}
                max={59}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </FormField>
          </div>
          <FormField id="log-date" label="Date">
            <Input id="log-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Log time</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
