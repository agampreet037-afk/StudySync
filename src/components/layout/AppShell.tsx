import { Link, Outlet, useRouterState, useHydrated } from "@tanstack/react-router";
import { Menu, Sparkles, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { OnboardingDialog } from "@/components/layout/OnboardingDialog";
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useAppState } from "@/hooks/use-app-store";
import { usePomodoroState } from "@/hooks/use-pomodoro";
import { POMODORO_LABELS } from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Sparkles className="size-4.5" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Study<span className="text-primary">Sync</span>
      </span>
    </Link>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground data-[status=active]:font-semibold"
    >
      <Icon className="size-4.5 shrink-0 opacity-80 group-data-[status=active]:text-sidebar-primary group-data-[status=active]:opacity-100" aria-hidden />
      {item.label}
    </Link>
  );
}

function TimerPill({ onNavigate }: { onNavigate?: () => void }) {
  const timer = usePomodoroState();
  if (timer.status !== "running") return null;
  return (
    <Link
      to="/focus"
      onClick={onNavigate}
      className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-xs font-semibold text-primary"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <Timer className="size-3.5" aria-hidden />
      {POMODORO_LABELS[timer.mode]} running
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useAppState();
  const name = settings.name.trim() || "Student";
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <TimerPill onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border px-3 pt-3 pb-4">
        <NavLink item={SETTINGS_ITEM} onNavigate={onNavigate} />
        <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">Saved on this device</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function AppShell() {
  const hydrated = useHydrated();
  const { settings } = useAppState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-6 pt-6 pb-6">
          <Logo />
        </div>
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:hidden">
        <Logo />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetHeader className="px-6 pt-6 pb-4 text-left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo />
            </SheetHeader>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className={cn("lg:pl-64")}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {hydrated ? <Outlet /> : <PageSkeleton />}
        </div>
      </main>

      {hydrated && <OnboardingDialog />}
      <Toaster theme={settings.theme} position="bottom-right" richColors closeButton />
    </div>
  );
}
