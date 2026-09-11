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
import { type ReactNode, useEffect, useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMoney } from "@/lib/money/store";
import { ADMIN_EMAIL } from "@/lib/money/works";
import { cn } from "@/lib/utils";

type Path =
  | "/"
  | "/estimate"
  | "/estimates"
  | "/invoices"
  | "/rate"
  | "/time"
  | "/clients"
  | "/studio"
  | "/work"
  | "/login";

const NAV: { to: Path; label: string; icon: typeof Home }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/work", label: "Work", icon: FileText },
  { to: "/estimate", label: "New", icon: Plus },
  { to: "/invoices", label: "Invoices", icon: Receipt },
];

const MORE: { to: Path; label: string; icon: typeof Home }[] = [
  { to: "/estimates", label: "Estimates", icon: FileText },
  { to: "/rate", label: "Rate lab", icon: Gauge },
  { to: "/time", label: "Time", icon: Clock },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/studio", label: "Studio", icon: Settings },
];

const PUBLIC_NAV: { to: Path; label: string; icon: typeof Home }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/work", label: "Work", icon: FileText },
];

function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

export { useClientReady };

function SignInRedirect({ next }: { next: string }) {
  useEffect(() => {
    const url =
      next && next !== "/"
        ? `/login?next=${encodeURIComponent(next)}`
        : "/login";
    if (`${window.location.pathname}${window.location.search}` !== url) {
      window.location.replace(url);
    }
  }, [next]);
  return <ShellFrame pending>{null}</ShellFrame>;
}

export function AppShell({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const ready = useClientReady();
  const deskStatus = useMoney((s) => s.status);
  const deskError = useMoney((s) => s.error);
  const load = useMoney((s) => s.load);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  if (requireAuth) {
    if (!ready || isPending) {
      return <ShellFrame pending>{null}</ShellFrame>;
    }
    if (!user) {
      const next = `${pathname}${searchStr ?? ""}`;
      return <SignInRedirect next={next} />;
    }
    if (deskStatus === "error") {
      return (
        <ShellFrame>
          <div className="mx-auto max-w-md py-20 text-center">
            <p className="font-serif text-3xl tracking-tight">
              Couldn’t open your desk
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {deskError || "Sign in with Google and try again."}
            </p>
            <Button className="mt-6" onClick={() => void load(user.id)}>
              Try again
            </Button>
          </div>
        </ShellFrame>
      );
    }
    if (deskStatus !== "ready") {
      return <ShellFrame pending>{null}</ShellFrame>;
    }
  }

  return <ShellFrame>{children}</ShellFrame>;
}

function ShellFrame({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const ready = useClientReady();
  const signedIn = ready && !isPending && Boolean(user);
  const nav = signedIn ? NAV : PUBLIC_NAV;
  const more = signedIn ? MORE : [];

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
            {nav.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
            {more.length ? (
              <>
                <p className="mt-6 mb-2 px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Studio
                </p>
                {more.map((item) => (
                  <NavLink key={item.to} {...item} />
                ))}
              </>
            ) : null}
          </nav>
          <div className="mt-4 space-y-3 border-t border-border px-2 pt-4 text-xs text-muted-foreground">
            <AuthSlot />
            <p>Luma Labrian</p>
            <a
              href={`mailto:${ADMIN_EMAIL}`}
              className="block truncate hover:text-foreground"
            >
              {ADMIN_EMAIL}
            </a>
          </div>
        </aside>

        <div className="lg:pl-56">
          <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm lg:hidden">
            <Link to="/" className="shrink-0 font-serif text-xl tracking-tight">
              Meridian
            </Link>
            <AuthSlot compact />
          </header>
          <div className="print-root px-4 pb-28 pt-6 sm:px-8 sm:pt-10 lg:pb-12">
            {pending ? (
              <div className="mx-auto max-w-5xl space-y-4">
                <div className="h-10 w-48 animate-pulse rounded-md bg-secondary" />
                <div className="h-48 animate-pulse rounded-xl bg-card" />
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        <nav
          className={cn(
            "no-print fixed inset-x-0 bottom-0 z-20 grid border-t border-border bg-background/95 px-1 py-1 backdrop-blur-sm lg:hidden",
            signedIn ? "grid-cols-5" : "grid-cols-3",
          )}
        >
          {signedIn ? (
            <>
              {NAV.map((item) => (
                <NavLink key={item.to} {...item} compact />
              ))}
              <NavLink to="/studio" label="Studio" icon={Settings} compact />
            </>
          ) : (
            <>
              {PUBLIC_NAV.map((item) => (
                <NavLink key={item.to} {...item} compact />
              ))}
              <NavLink to="/login" label="Sign in" icon={Plus} compact />
            </>
          )}
        </nav>
      </div>
    </TooltipProvider>
  );
}

function AuthSlot({ compact }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const ready = useClientReady();
  if (!ready || isPending) {
    return (
      <div
        className={
          compact
            ? "h-8 w-24 animate-pulse rounded-md bg-secondary"
            : "h-8 w-full animate-pulse rounded-md bg-secondary"
        }
      />
    );
  }
  if (user) {
    return (
      <div className={cn("account-chip", compact && "max-w-[70%] truncate")}>
        <UserButton />
      </div>
    );
  }
  return (
    <Button asChild variant="secondary" size={compact ? "sm" : "default"}>
      <Link to="/login">Sign in with Google</Link>
    </Button>
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
