import { Check } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useAppState } from "@/hooks/use-app-store";
import { actions } from "@/lib/storage";
import { SUBJECT_COLOR_NAMES, SUBJECT_COLORS, subjectBg } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";
import {
  hasErrors,
  validateSubject,
  type FieldErrors,
  type SubjectInput,
} from "@/lib/validation";
import type { Subject, SubjectColor } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject | null | undefined;
}

export function SubjectFormDialog({ open, onOpenChange, subject }: Props) {
  const { subjects } = useAppState();
  const [form, setForm] = useState({ name: "", targetHours: "", color: "1" as SubjectColor });
  const [errors, setErrors] = useState<FieldErrors<keyof SubjectInput>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (subject) {
      setForm({
        name: subject.name,
        targetHours: subject.targetHours ? String(subject.targetHours) : "",
        color: subject.color,
      });
    } else {
      const used = new Set(subjects.map((s) => s.color));
      const color = SUBJECT_COLORS.find((c) => !used.has(c)) ?? "1";
      setForm({ name: "", targetHours: "", color });
    }
  }, [open, subject, subjects]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const others = subjects.filter((s) => s.id !== subject?.id).map((s) => s.name);
    const errs = validateSubject(form, others);
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const data = {
      name: form.name.trim(),
      color: form.color,
      targetHours: form.targetHours.trim() ? Number(form.targetHours) : null,
    };
    if (subject) {
      actions.updateSubject(subject.id, data);
      toast.success("Subject updated");
    } else {
      actions.addSubject(data);
      toast.success(`${data.name} added`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {subject ? "Edit subject" : "Add a subject"}
          </DialogTitle>
          <DialogDescription>Set an optional target to track your progress.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="s-name" label="Subject name" error={errors.name}>
            <Input
              id="s-name"
              value={form.name}
              placeholder="e.g. Organic Chemistry"
              aria-invalid={!!errors.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </FormField>
          <FormField
            id="s-target"
            label="Target study hours"
            optional
            error={errors.targetHours}
            hint="Total hours you want to study this term."
          >
            <Input
              id="s-target"
              type="number"
              inputMode="decimal"
              min={1}
              value={form.targetHours}
              placeholder="e.g. 40"
              aria-invalid={!!errors.targetHours}
              onChange={(e) => set({ targetHours: e.target.value })}
            />
          </FormField>
          <div className="space-y-2">
            <Label id="s-color-label">Colour</Label>
            <div role="radiogroup" aria-labelledby="s-color-label" className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.color === c}
                  aria-label={SUBJECT_COLOR_NAMES[c]}
                  onClick={() => set({ color: c })}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    subjectBg[c],
                    form.color === c && "ring-2 ring-foreground/60",
                  )}
                >
                  {form.color === c && <Check className="size-4 text-primary-foreground" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{subject ? "Save changes" : "Add subject"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
