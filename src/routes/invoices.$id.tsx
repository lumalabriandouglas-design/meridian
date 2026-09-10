import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice, InvoiceStatus, LineItem } from "@/lib/money/types";
import { derivedInvoiceStatus, emptyItem, useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/invoices/$id")({
  component: InvoiceDetail,
});

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue"];

function InvoiceDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const invoice = useMoney((s) => s.invoices.find((e) => e.id === id));
  const profile = useMoney((s) => s.profile);
  const updateInvoice = useMoney((s) => s.updateInvoice);
  const deleteInvoice = useMoney((s) => s.deleteInvoice);

  if (!invoice) {
    return (
      <AppShell>
        <PageHeader title="Invoice missing" />
        <Link to="/invoices" className="text-sm text-muted-foreground">
          Back to invoices
        </Link>
      </AppShell>
    );
  }

  const row = invoice;
  const status = derivedInvoiceStatus(row);

  function patch(next: Partial<Invoice>) {
    updateInvoice(id, next);
  }

  function patchItem(itemId: string, next: Partial<LineItem>) {
    patch({
      items: row.items.map((i) => (i.id === itemId ? { ...i, ...next } : i)),
    });
  }

  return (
    <AppShell>
      <PageHeader
        kicker={row.number}
        title={row.clientCompany || row.clientName}
        description={
          status === "overdue"
            ? "This one is late. Print it again. Ask once, clearly."
            : "Collect in UGX. Mark paid when the MoMo hits."
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            {row.status !== "paid" ? (
              <Button onClick={() => patch({ status: "paid" })}>Mark paid</Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => patch({ status: "sent" })}
              >
                Mark unpaid
              </Button>
            )}
          </>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="no-print space-y-5 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <Input
                value={row.clientName}
                onChange={(e) => patch({ clientName: e.target.value })}
              />
            </Field>
            <Field label="Company">
              <Input
                value={row.clientCompany}
                onChange={(e) => patch({ clientCompany: e.target.value })}
              />
            </Field>
            <Field label="Email" className="col-span-2">
              <Input
                value={row.clientEmail}
                onChange={(e) => patch({ clientEmail: e.target.value })}
              />
            </Field>
            <Field label="Issued">
              <Input
                type="date"
                value={row.issueDate}
                onChange={(e) => patch({ issueDate: e.target.value })}
              />
            </Field>
            <Field label="Due">
              <Input
                type="date"
                value={row.dueDate}
                onChange={(e) => patch({ dueDate: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className="flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
                value={row.status}
                onChange={(e) =>
                  patch({ status: e.target.value as InvoiceStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="VAT %">
              <Input
                type="number"
                min={0}
                value={row.taxPercent}
                onChange={(e) =>
                  patch({ taxPercent: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Lines</Label>
            {row.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-12"
                  value={item.description}
                  onChange={(e) =>
                    patchItem(item.id, { description: e.target.value })
                  }
                />
                <Input
                  className="col-span-4"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    patchItem(item.id, { quantity: Number(e.target.value) || 0 })
                  }
                />
                <div className="col-span-8">
                  <MoneyField
                    currency={profile.currency}
                    value={item.rate}
                    onChange={(n) => patchItem(item.id, { rate: n })}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => patch({ items: [...row.items, emptyItem()] })}
            >
              Add line
            </Button>
          </div>

          <Field label="Notes">
            <Textarea
              value={row.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>

          <Button
            variant="ghost"
            onClick={() => {
              deleteInvoice(id);
              void navigate({ to: "/invoices" });
            }}
          >
            Delete invoice
          </Button>
        </div>

        <div className="lg:col-span-7">
          <DocumentPaper
            profile={profile}
            currency={profile.currency}
            doc={{
              kindLabel: "Invoice",
              number: row.number,
              clientName: row.clientName,
              clientCompany: row.clientCompany,
              clientEmail: row.clientEmail,
              issueDate: row.issueDate,
              untilLabel: "Due",
              untilDate: row.dueDate,
              items: row.items,
              notes: row.notes,
              taxPercent: row.taxPercent,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
