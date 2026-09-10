import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/status-badge";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { grandTotal } from "@/lib/money/calc";
import { formatMoney } from "@/lib/money/format";
import { useMoney } from "@/lib/money/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/estimates")({ component: Estimates });

function Estimates() {
  const estimates = useMoney((s) => s.estimates);
  const currency = useMoney((s) => s.profile.currency);

  return (
    <AppShell>
      <PageHeader
        kicker="Paper"
        title="Estimates"
        description="What you quoted. Accept one and it becomes an invoice."
        actions={
          <Button asChild>
            <Link to="/estimate">New estimate</Link>
          </Button>
        }
      />
      <ul className="enter enter-2 mx-auto max-w-5xl divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
        {estimates.length === 0 ? (
          <li className="px-5 py-10 text-sm text-muted-foreground">
            No estimates yet. Start from a website or auto playbook.
          </li>
        ) : (
          estimates.map((row) => (
            <li key={row.id}>
              <Link
                to="/estimates/$id"
                params={{ id: row.id }}
                className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-secondary/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {row.clientCompany || row.clientName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.number} · {row.kind} · {formatDate(row.issueDate)}
                  </p>
                </div>
                <p className="tabular-nums text-sm">
                  {formatMoney(grandTotal(row.items, row.taxPercent), currency)}
                </p>
                <StatusBadge status={row.status} />
              </Link>
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
