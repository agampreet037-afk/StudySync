import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
import { PrioritySelect } from "@/components/common/Selects";
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
import { toDateKey } from "@/lib/dates";
import { actions } from "@/lib/storage";
import { hasErrors, validateTask, type FieldErrors, type TaskInput } from "@/lib/validation";
import type { Priority, Task } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null | undefined;
}

export function TaskFormDialog({ open, onOpenChange, task }: Props) {
  const [form, setForm] = useState({ title: "", deadline: "", priority: "medium" as Priority });
  const [errors, setErrors] = useState<FieldErrors<keyof TaskInput>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      task
        ? { title: task.title, deadline: task.deadline ?? "", priority: task.priority }
        : { title: "", deadline: toDateKey(new Date()), priority: "medium" },
    );
  }, [open, task]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateTask(form);
    setErrors(errs);
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const data = {
      title: form.title.trim(),
      deadline: form.deadline || null,
      priority: form.priority,
    };
    if (task) {
      actions.updateTask(task.id, data);
      toast.success("Task updated");
    } else {
      actions.addTask(data);
      toast.success("Task added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {task ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>Small steps add up.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="t-title" label="Task" error={errors.title}>
            <Input
              id="t-title"
              value={form.title}
              placeholder="e.g. Review lecture 6 notes"
              aria-invalid={!!errors.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="t-deadline" label="Due date" optional error={errors.deadline}>
              <Input
                id="t-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => set({ deadline: e.target.value })}
              />
            </FormField>
            <FormField id="t-priority" label="Priority">
              <PrioritySelect
                id="t-priority"
                value={form.priority}
                onChange={(v) => set({ priority: v })}
              />
            </FormField>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
