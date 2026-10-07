import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBadge } from "@/components/status-badge";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { amountPaid, grandTotal } from "@/lib/money/calc";
import { formatMoney } from "@/lib/money/format";
import { derivedInvoiceStatus, emptyItem, useMoney } from "@/lib/money/store";
import { addDaysISO, formatDate, todayISO } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({ component: Invoices });

function Invoices() {
  const invoices = useMoney((s) => s.invoices);
  const profile = useMoney((s) => s.profile);
  const currency = profile.currency;
  const saveInvoice = useMoney((s) => s.saveInvoice);
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageHeader
        kicker="Paper"
        title="Invoices"
        description="What they owe. Record a payment and they get a receipt."
        actions={
          <Button
            onClick={() => {
              const id = saveInvoice({
                estimateId: null,
                clientId: null,
                clientName: "Client",
                clientCompany: "",
                clientEmail: "",
                issueDate: todayISO(),
                dueDate: addDaysISO(14),
                status: "draft",
                items: [emptyItem()],
                notes: "",
                taxPercent: profile.vatRegistered ? 18 : 0,
                payments: [],
              });
              void navigate({ to: "/invoices/$id", params: { id } });
            }}
          >
            New invoice
          </Button>
        }
      />
      <ul className="enter enter-2 mx-auto max-w-5xl divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
        {invoices.length === 0 ? (
          <li className="px-5 py-10 text-sm text-muted-foreground">
            No invoices yet. Convert an estimate, or start a blank one.
          </li>
        ) : (
          invoices.map((row) => {
            const status = derivedInvoiceStatus(row, profile.vatRegistered);
            const total = grandTotal(
              row.items,
              profile.vatRegistered ? row.taxPercent : 0,
            );
            const paid = amountPaid(row.payments);
            const due = Math.max(0, total - paid);
            return (
              <li key={row.id}>
                <Link
                  to="/invoices/$id"
                  params={{ id: row.id }}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {row.clientCompany || row.clientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.number} · due {formatDate(row.dueDate)}
                      {paid > 0 && due > 0
                        ? ` · paid ${formatMoney(paid, currency)}`
                        : ""}
                    </p>
                  </div>
                  <p className="tabular-nums text-sm">
                    {status === "paid"
                      ? formatMoney(total, currency)
                      : formatMoney(due, currency)}
                  </p>
                  <StatusBadge status={status} />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </AppShell>
  );
}
