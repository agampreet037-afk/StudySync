import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode | undefined;
  tone?: "primary" | "lavender" | "blue" | "success" | undefined;
  className?: string | undefined;
}

const toneClass = {
  primary: "bg-primary-soft text-primary",
  lavender: "bg-secondary text-secondary-foreground",
  blue: "bg-accent text-accent-foreground",
  success: "bg-success-soft text-success",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "primary", className }: StatCardProps) {
  return (
    <div className={cn("surface-card animate-rise p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneClass[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
        {value}
      </p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
