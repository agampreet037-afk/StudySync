import { addDays, setHours, setMinutes } from "date-fns";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
import { PrioritySelect, SubjectSelect } from "@/components/common/Selects";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/hooks/use-app-store";
import { toLocalDateTime } from "@/lib/dates";
import { actions } from "@/lib/storage";
import {
  hasErrors,
  validateAssignment,
  type AssignmentInput,
  type FieldErrors,
} from "@/lib/validation";
import type { Assignment, AssignmentStatus, Priority } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment | null | undefined;
}

export function AssignmentFormDialog({ open, onOpenChange, assignment }: Props) {
  const { subjects } = useAppState();
  const [form, setForm] = useState({
    title: "",
    subjectId: "none",
    description: "",
    deadline: "",
    priority: "medium" as Priority,
    status: "not-started" as AssignmentStatus,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof AssignmentInput>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      assignment
        ? {
            title: assignment.title,
            subjectId: assignment.subjectId ?? "none",
            description: assignment.description,
            deadline: assignment.deadline,
            priority: assignment.priority,
            status: assignment.status,
          }
        : {
            title: "",
            subjectId: "none",
            description: "",
            deadline: toLocalDateTime(setMinutes(setHours(addDays(new Date(), 3), 23), 59)),
            priority: "medium",
            status: "not-started",
          },
    );
  }, [open, assignment]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateAssignment(form);
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const data = {
      title: form.title.trim(),
      subjectId: form.subjectId === "none" ? null : form.subjectId,
      description: form.description.trim(),
      deadline: form.deadline,
      priority: form.priority,
      status: form.status,
    };
    if (assignment) {
      actions.updateAssignment(assignment.id, data);
      toast.success("Assignment updated");
    } else {
      actions.addAssignment(data);
      toast.success("Assignment added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {assignment ? "Edit assignment" : "New assignment"}
          </DialogTitle>
          <DialogDescription>Track what's due and how far along you are.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="a-title" label="Title" error={errors.title}>
            <Input
              id="a-title"
              value={form.title}
              placeholder="e.g. Lab report: Ohm's law"
              aria-invalid={!!errors.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="a-subject" label="Subject">
              <SubjectSelect
                id="a-subject"
                subjects={subjects}
                value={form.subjectId}
                allowNone
                onChange={(v) => set({ subjectId: v })}
              />
            </FormField>
            <FormField id="a-deadline" label="Deadline" error={errors.deadline}>
              <Input
                id="a-deadline"
                type="datetime-local"
                value={form.deadline}
                aria-invalid={!!errors.deadline}
                onChange={(e) => set({ deadline: e.target.value })}
              />
            </FormField>
            <FormField id="a-priority" label="Priority">
              <PrioritySelect
                id="a-priority"
                value={form.priority}
                onChange={(v) => set({ priority: v })}
              />
            </FormField>
            <FormField id="a-status" label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set({ status: v as AssignmentStatus })}
              >
                <SelectTrigger id="a-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not started</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField id="a-desc" label="Description" optional error={errors.description}>
            <Textarea
              id="a-desc"
              rows={3}
              placeholder="Requirements, links, notes…"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </FormField>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{assignment ? "Save changes" : "Add assignment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
