import { lazy, Suspense } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, useClientReady } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const HomeDesk = lazy(() =>
  import("@/components/desk/home-desk").then((m) => ({ default: m.HomeDesk })),
);

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const mounted = useClientReady();

  if (!mounted || isPending) {
    return (
      <AppShell requireAuth={false}>
        <div className="mx-auto h-10 w-48 max-w-5xl animate-pulse rounded-md bg-secondary" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell requireAuth={false}>
        <PageHeader
          kicker="Kampala"
          title="Meridian"
          description="A private estimate and invoice desk. Sign in to open yours."
          actions={
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="mx-auto h-10 w-48 max-w-5xl animate-pulse rounded-md bg-secondary" />
        }
      >
        <HomeDesk />
      </Suspense>
    </AppShell>
  );
}
