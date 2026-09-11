import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { ClientPicker } from "@/components/money/client-picker";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Estimate, EstimateStatus, LineItem } from "@/lib/money/types";
import { emptyItem, useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/estimates_/$id")({
  component: EstimateDetail,
});

const STATUSES: EstimateStatus[] = ["draft", "sent", "accepted", "declined"];

function EstimateDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const estimate = useMoney((s) => s.estimates.find((e) => e.id === id));
  const profile = useMoney((s) => s.profile);
  const updateEstimate = useMoney((s) => s.updateEstimate);
  const deleteEstimate = useMoney((s) => s.deleteEstimate);
  const convertEstimate = useMoney((s) => s.convertEstimate);
  const invoices = useMoney((s) => s.invoices);

  if (!estimate) {
    return (
      <AppShell>
        <PageHeader title="Estimate missing" />
        <Link to="/estimates" className="text-sm text-muted-foreground">
          Back to estimates
        </Link>
      </AppShell>
    );
  }

  const row = estimate;
  const existingInv = invoices.find((i) => i.estimateId === row.id);

  function patch(next: Partial<Estimate>) {
    updateEstimate(id, next);
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
        description="Edit, print, or turn this into an invoice when they say yes."
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            {existingInv ? (
              <Button asChild>
                <Link to="/invoices/$id" params={{ id: existingInv.id }}>
                  Open invoice
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const invId = convertEstimate(id);
                  if (invId) {
                    void navigate({ to: "/invoices/$id", params: { id: invId } });
                  }
                }}
              >
                Convert to invoice
              </Button>
            )}
          </>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="no-print space-y-5 lg:col-span-5">
          <ClientPicker
            value={{
              clientId: row.clientId,
              clientName: row.clientName,
              clientCompany: row.clientCompany,
              clientEmail: row.clientEmail,
            }}
            onChange={(next) =>
              patch({
                clientId: next.clientId,
                clientName: next.clientName,
                clientCompany: next.clientCompany,
                clientEmail: next.clientEmail,
              })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Issued">
              <Input
                type="date"
                value={row.issueDate}
                onChange={(e) => patch({ issueDate: e.target.value })}
              />
            </Field>
            <Field label="Valid until">
              <Input
                type="date"
                value={row.validUntil}
                onChange={(e) => patch({ validUntil: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className="flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
                value={row.status}
                onChange={(e) =>
                  patch({ status: e.target.value as EstimateStatus })
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
              deleteEstimate(id);
              void navigate({ to: "/estimates" });
            }}
          >
            Delete estimate
          </Button>
        </div>

        <div className="lg:col-span-7">
          <DocumentPaper
            profile={profile}
            currency={profile.currency}
            doc={{
              kindLabel: "Estimate",
              number: row.number,
              clientName: row.clientName,
              clientCompany: row.clientCompany,
              clientEmail: row.clientEmail,
              issueDate: row.issueDate,
              untilLabel: "Valid until",
              untilDate: row.validUntil,
              items: row.items,
              notes: row.notes,
              taxPercent: row.taxPercent,
              depositPercent: row.depositPercent,
              stackLabel: row.stackLabel,
              showStack: row.showStack,
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
