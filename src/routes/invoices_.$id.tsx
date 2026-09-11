import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { ClientPicker } from "@/components/money/client-picker";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  amountPaid,
  depositDue,
  grandTotal,
} from "@/lib/money/calc";
import { formatMoney, paymentMethodLabel } from "@/lib/money/format";
import type {
  Invoice,
  InvoiceStatus,
  LineItem,
  PaymentMethod,
} from "@/lib/money/types";
import { PAYMENT_METHODS } from "@/lib/money/types";
import { derivedInvoiceStatus, emptyItem, useMoney } from "@/lib/money/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/invoices_/$id")({
  component: InvoiceDetail,
});

const STATUSES: InvoiceStatus[] = ["draft", "sent", "partial", "paid", "overdue"];

function InvoiceDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const invoice = useMoney((s) => s.invoices.find((e) => e.id === id));
  const profile = useMoney((s) => s.profile);
  const updateInvoice = useMoney((s) => s.updateInvoice);
  const deleteInvoice = useMoney((s) => s.deleteInvoice);
  const recordPayment = useMoney((s) => s.recordPayment);
  const deletePayment = useMoney((s) => s.deletePayment);

  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("momo");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");

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
  const total = grandTotal(row.items, row.taxPercent);
  const paid = amountPaid(row.payments);
  const balance = Math.max(0, total - paid);
  const deposit = depositDue(total, profile.depositPercent);
  const amount = payAmount ?? balance;

  function patch(next: Partial<Invoice>) {
    updateInvoice(id, next);
  }

  function patchItem(itemId: string, next: Partial<LineItem>) {
    patch({
      items: row.items.map((i) => (i.id === itemId ? { ...i, ...next } : i)),
    });
  }

  function takePayment() {
    const paymentId = recordPayment(id, {
      amount,
      method: payMethod,
      date: payDate,
      note: payNote,
    });
    setPayAmount(null);
    setPayNote("");
    if (paymentId) {
      void navigate({
        to: "/invoices/$id/receipt/$paymentId",
        params: { id, paymentId },
      });
    }
  }

  return (
    <AppShell>
      <PageHeader
        kicker={row.number}
        title={row.clientCompany || row.clientName}
        description={
          status === "paid"
            ? "Paid in full. Print the last receipt if they need one."
            : status === "overdue"
              ? "This one is late. Record what came in, then ask for the rest."
              : "Collect in UGX. Record each payment — they get a receipt."
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print invoice
            </Button>
            {balance > 0 ? (
              <Button onClick={takePayment} disabled={amount <= 0}>
                Take payment
              </Button>
            ) : null}
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
            onChange={(next) => {
              patch({
                clientId: next.clientId,
                clientName: next.clientName,
                clientCompany: next.clientCompany,
                clientEmail: next.clientEmail,
              });
            }}
          />

          <div className="grid grid-cols-2 gap-3">
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
            <Label>What this does</Label>
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

          <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Payments
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Invoice total</dt>
                <dd className="tabular-nums">
                  {formatMoney(total, profile.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid to date</dt>
                <dd className="tabular-nums">
                  {formatMoney(paid, profile.currency)}
                </dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{balance <= 0 && total > 0 ? "Paid in full" : "Still due"}</dt>
                <dd className="tabular-nums">
                  {formatMoney(balance, profile.currency)}
                </dd>
              </div>
            </dl>

            {(row.payments ?? []).length ? (
              <ul className="mt-4 divide-y divide-border">
                {row.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="tabular-nums">
                        {formatMoney(p.amount, profile.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.number} · {formatDate(p.date)} ·{" "}
                        {paymentMethodLabel(p.method)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to="/invoices/$id/receipt/$paymentId"
                        params={{ id, paymentId: p.id }}
                      >
                        Receipt
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePayment(id, p.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing recorded yet.
              </p>
            )}

            {balance > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {deposit > 0 && paid < deposit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPayAmount(Math.min(deposit - paid, balance))}
                    >
                      Deposit {profile.depositPercent}%
                    </Button>
                  ) : null}
                  {paid > 0 && balance > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPayAmount(balance)}
                    >
                      Remainder
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPayAmount(balance)}
                  >
                    Full balance
                  </Button>
                </div>
                <Field label="This payment">
                  <MoneyField
                    currency={profile.currency}
                    value={amount}
                    onChange={setPayAmount}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="How they paid">
                    <select
                      className="flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
                      value={payMethod}
                      onChange={(e) =>
                        setPayMethod(e.target.value as PaymentMethod)
                      }
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date">
                    <Input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Note on the receipt">
                  <Input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="MTN MoMo 0700…"
                  />
                </Field>
                <Button className="w-full" onClick={takePayment} disabled={amount <= 0}>
                  Record payment & receipt
                </Button>
              </div>
            ) : null}
          </section>

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
              paidToDate: paid,
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
