import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clock,
  FileText,
  Gauge,
  Home,
  Plus,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Path =
  | "/"
  | "/estimate"
  | "/estimates"
  | "/invoices"
  | "/rate"
  | "/time"
  | "/clients"
  | "/studio";

const NAV: { to: Path; label: string; icon: typeof Home }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/estimate", label: "New", icon: Plus },
  { to: "/estimates", label: "Estimates", icon: FileText },
  { to: "/invoices", label: "Invoices", icon: Receipt },
];

const MORE: { to: Path; label: string; icon: typeof Home }[] = [
  { to: "/rate", label: "Rate lab", icon: Gauge },
  { to: "/time", label: "Time", icon: Clock },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/studio", label: "Studio", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <aside className="no-print fixed inset-y-0 left-0 hidden w-56 border-r border-border px-4 py-6 lg:flex lg:flex-col">
          <Link to="/" className="px-2">
            <p className="font-serif text-2xl leading-none tracking-tight">
              Meridian
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Kampala · UGX</p>
          </Link>
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
            <p className="mt-6 mb-2 px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Studio
            </p>
            {MORE.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
          </nav>
        </aside>

        <div className="lg:pl-56">
          <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm lg:hidden">
            <Link to="/" className="font-serif text-xl tracking-tight">
              Meridian
            </Link>
            <span className="text-xs text-muted-foreground">UGX</span>
          </header>
          <div className="print-root px-4 pb-28 pt-6 sm:px-8 sm:pt-10 lg:pb-12">
            {ready ? (
              children
            ) : (
              <div className="mx-auto max-w-5xl space-y-4">
                <div className="h-8 w-40 rounded-md bg-secondary" />
                <div className="h-40 rounded-xl bg-card" />
              </div>
            )}
          </div>
        </div>

        <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/95 px-1 py-1 backdrop-blur-sm lg:hidden">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} compact />
          ))}
          <NavLink to="/studio" label="Studio" icon={Settings} compact />
        </nav>
      </div>
    </TooltipProvider>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  compact,
}: {
  to: Path;
  label: string;
  icon: typeof Home;
  compact?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active =
    to === "/"
      ? pathname === "/"
      : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 text-sm transition-[background-color,color] duration-150 ease-out",
        compact
          ? "h-14 flex-col justify-center gap-1 px-0 text-xs"
          : "h-10",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="enter mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 max-w-2xl">
        {kicker ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2 lg:shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
