import { addDays, setHours, setMinutes } from "date-fns";
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
import { toLocalDateTime } from "@/lib/dates";
import { actions } from "@/lib/storage";
import { hasErrors, validateExam, type ExamInput, type FieldErrors } from "@/lib/validation";
import type { Exam } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: Exam | null | undefined;
}

export function ExamFormDialog({ open, onOpenChange, exam }: Props) {
  const { subjects } = useAppState();
  const [form, setForm] = useState({
    title: "",
    subjectId: "none",
    dateTime: "",
    location: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof ExamInput>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      exam
        ? {
            title: exam.title,
            subjectId: exam.subjectId ?? "none",
            dateTime: exam.dateTime,
            location: exam.location,
            notes: exam.notes,
          }
        : {
            title: "",
            subjectId: subjects[0]?.id ?? "none",
            dateTime: toLocalDateTime(setMinutes(setHours(addDays(new Date(), 7), 10), 0)),
            location: "",
            notes: "",
          },
    );
  }, [open, exam, subjects]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateExam(form);
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const data = {
      title: form.title.trim(),
      subjectId: form.subjectId === "none" ? null : form.subjectId,
      dateTime: form.dateTime,
      location: form.location.trim(),
      notes: form.notes.trim(),
    };
    if (exam) {
      actions.updateExam(exam.id, data);
      toast.success("Exam updated");
    } else {
      actions.addExam(data);
      toast.success("Exam added — good luck!");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {exam ? "Edit exam" : "Add an exam"}
          </DialogTitle>
          <DialogDescription>Keep every test and midterm on your radar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="e-title" label="Exam name" error={errors.title}>
            <Input
              id="e-title"
              value={form.title}
              placeholder="e.g. Organic Chemistry midterm"
              aria-invalid={!!errors.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="e-subject" label="Subject">
              <SubjectSelect
                id="e-subject"
                subjects={subjects}
                value={form.subjectId}
                allowNone
                onChange={(v) => set({ subjectId: v })}
              />
            </FormField>
            <FormField id="e-date" label="Date & time" error={errors.dateTime}>
              <Input
                id="e-date"
                type="datetime-local"
                value={form.dateTime}
                aria-invalid={!!errors.dateTime}
                onChange={(e) => set({ dateTime: e.target.value })}
              />
            </FormField>
          </div>
          <FormField id="e-location" label="Location" optional>
            <Input
              id="e-location"
              value={form.location}
              placeholder="e.g. Hall A, Room 101"
              onChange={(e) => set({ location: e.target.value })}
            />
          </FormField>
          <FormField id="e-notes" label="Notes" optional>
            <Textarea
              id="e-notes"
              rows={2}
              placeholder="Syllabus, allowed materials…"
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </FormField>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{exam ? "Save changes" : "Add exam"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
