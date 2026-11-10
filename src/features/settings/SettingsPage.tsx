import { Database, Moon, RefreshCcw, Sparkles, Sun, Trash2, User } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/hooks/use-app-store";
import { actions, hasSampleData } from "@/lib/storage";

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card animate-rise p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const state = useAppState();
  const { settings } = state;
  const [name, setName] = useState(settings.name);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [confirm, setConfirm] = useState<null | "sample" | "restore" | "all">(null);

  useEffect(() => setName(settings.name), [settings.name]);

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setNameError("Enter a display name.");
    if (trimmed.length > 40) return setNameError("Keep your name under 40 characters.");
    setNameError(undefined);
    actions.updateSettings({ name: trimmed, onboarded: true });
    toast.success("Display name saved");
  };

  const counts = [
    ["Subjects", state.subjects.length],
    ["Sessions", state.sessions.length],
    ["Assignments", state.assignments.length],
    ["Exams", state.exams.length],
    ["Tasks", state.tasks.length],
  ] as const;

  const sample = hasSampleData(state);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Personalise StudySync and manage your saved data." />

      <div className="space-y-5">
        <Section icon={User} title="Profile" description="Used for your dashboard greeting.">
          <form onSubmit={saveName} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <FormField id="settings-name" label="Display name" error={nameError} className="flex-1">
              <Input
                id="settings-name"
                value={name}
                placeholder="Your name"
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(undefined);
                }}
              />
            </FormField>
            <Button type="submit" className="sm:mt-6" disabled={name.trim() === settings.name}>
              Save
            </Button>
          </form>
        </Section>

        <Section icon={settings.theme === "dark" ? Moon : Sun} title="Appearance" description="Choose a theme that's easy on your eyes.">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <label htmlFor="theme-switch" className="text-sm font-medium">
                Dark mode
              </label>
              <p className="text-xs text-muted-foreground">Great for late-night study sessions.</p>
            </div>
            <Switch
              id="theme-switch"
              checked={settings.theme === "dark"}
              onCheckedChange={(c) => {
                actions.updateSettings({ theme: c ? "dark" : "light" });
                toast.success(c ? "Dark mode on" : "Light mode on");
              }}
            />
          </div>
        </Section>

        <Section icon={Database} title="Your data" description="Everything is saved in this browser only — nothing is uploaded.">
          <dl className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {counts.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted/60 px-3 py-2">
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="tabular font-display text-lg font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="divide-y divide-border rounded-lg border border-border">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Clear sample data</p>
                <p className="text-xs text-muted-foreground">
                  {sample ? "Remove the demo items and keep what you've added." : "No sample data left."}
                </p>
              </div>
              <Button variant="outline" disabled={!sample} onClick={() => setConfirm("sample")}>
                <Sparkles /> Clear sample data
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Load sample data</p>
                <p className="text-xs text-muted-foreground">Replace everything with fresh demo data.</p>
              </div>
              <Button variant="outline" onClick={() => setConfirm("restore")}>
                <RefreshCcw /> Load sample data
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Reset all data</p>
                <p className="text-xs text-muted-foreground">
                  Delete every subject, session, assignment, exam, task and focus record.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setConfirm("all")}>
                <Trash2 /> Reset data
              </Button>
            </div>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirm === "sample"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Clear sample data?"
        description="All demo items are removed. Anything you created yourself stays."
        confirmLabel="Clear sample data"
        onConfirm={() => {
          actions.removeSampleData();
          toast.success("Sample data cleared");
        }}
      />
      <ConfirmDialog
        open={confirm === "restore"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Load sample data?"
        description="This replaces all of your current data with demo data. Your name and theme are kept."
        confirmLabel="Replace with sample data"
        onConfirm={() => {
          actions.restoreSampleData();
          toast.success("Sample data loaded");
        }}
      />
      <ConfirmDialog
        open={confirm === "all"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Reset all data?"
        description="This permanently deletes everything you've saved in StudySync on this device. This can't be undone."
        confirmLabel="Yes, delete everything"
        onConfirm={() => {
          actions.clearAllData();
          toast.success("All data deleted — you're starting fresh");
        }}
      />
    </div>
  );
}
