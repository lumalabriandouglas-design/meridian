import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { WorkSample } from "@/components/money/work-sample";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/money/store";
import { ADMIN_EMAIL, SHIPPED_WORK } from "@/lib/money/works";

export const Route = createFileRoute("/work")({ component: Work });

function Work() {
  const currency = useMoney((s) => s.profile.currency) || "UGX";

  return (
    <AppShell requireAuth={false}>
      <PageHeader
        kicker="Luma Labrian"
        title="Shipped work, with the price"
        description="Every job Douglas has already built. Use these numbers when someone asks for the same kind of site or app. Admin for this desk is the same email."
        actions={
          <>
            <a
              href={`mailto:${ADMIN_EMAIL}`}
              className="inline-flex h-11 max-w-full items-center truncate text-sm text-muted-foreground hover:text-foreground"
            >
              {ADMIN_EMAIL}
            </a>
            <Button asChild>
              <Link to="/estimate">New estimate</Link>
            </Button>
          </>
        }
      />
      <div className="enter enter-2 mx-auto grid max-w-5xl gap-6">
        {SHIPPED_WORK.map((job) => (
          <WorkSample
            key={job.id}
            job={job}
            currency={currency}
            layout="detail"
          />
        ))}
      </div>
    </AppShell>
  );
}
