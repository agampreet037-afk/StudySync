import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

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

/** Asks first-time visitors for their name. */
export function OnboardingDialog() {
  const { settings } = useAppState();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const open = !settings.onboarded;

  const finish = (value: string) => {
    actions.updateSettings({ name: value, onboarded: true });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter your name, or choose “Skip for now”.");
    if (trimmed.length > 40) return setError("Keep your name under 40 characters.");
    finish(trimmed);
    toast.success(`Welcome to StudySync, ${trimmed}!`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish(settings.name)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <DialogTitle className="font-display text-xl">Welcome to StudySync</DialogTitle>
            <DialogDescription>
              Your planner, assignments, exams and focus timer in one place. We've added some
              sample data so you can explore — remove it anytime from the dashboard or Settings.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-1.5">
            <Label htmlFor="onboard-name">What should we call you?</Label>
            <Input
              id="onboard-name"
              autoFocus
              value={name}
              placeholder="e.g. Priya"
              aria-invalid={!!error}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="ghost" onClick={() => finish("")}>
              Skip for now
            </Button>
            <Button type="submit" variant="hero">
              Get started
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
