import {
  amountPaid,
  clientCashDue,
  depositDue,
  itemsSubtotal,
  MOMO_TX_MAX,
  netPayable,
  taxAmount,
  withholdingAmount,
} from "@/lib/money/calc";
import { formatMoney, formatUsdLine, paymentLines, paymentMethodLabel } from "@/lib/money/format";
import type {
  Currency,
  Invoice,
  LineItem,
  Payment,
  Profile,
} from "@/lib/money/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type PaperDoc = {
  kindLabel: string;
  number: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  untilLabel: string;
  untilDate: string;
  items: LineItem[];
  notes: string;
  taxPercent: number;
  depositPercent?: number;
  stackLabel?: string;
  showStack?: boolean;
  status?: string;
  paidToDate?: number;
  withholdTax?: boolean;
  showUsd?: boolean;
  usdRate?: number;
  usdAsOf?: string;
  /** Withholding already recorded as a payment, so it is not subtracted twice. */
  whtPaid?: number;
};

export function DocumentPaper({
  profile,
  currency,
  doc,
  className,
}: {
  profile: Profile;
  currency: Currency;
  doc: PaperDoc;
  className?: string;
}) {
  const sub = itemsSubtotal(doc.items);
  const taxPercent = Math.max(0, doc.taxPercent || 0);
  const tax = taxAmount(sub, taxPercent);
  const total = sub + tax;
  const withheld = withholdingAmount(sub, doc.withholdTax);
  const net = netPayable(total, withheld);
  const deposit =
    doc.depositPercent && doc.depositPercent > 0
      ? depositDue(total, doc.depositPercent)
      : 0;
  const paid = Math.max(0, doc.paidToDate ?? 0);
  const showPaid = doc.paidToDate != null;
  const balance = Math.max(0, total - paid);
  const settled = showPaid && total > 0 && paid >= total;
  const kindLabel =
    doc.kindLabel === "Invoice" && taxPercent > 0 ? "VAT invoice" : doc.kindLabel;
  const payTo = paymentLines(profile);
  const clientPays = clientCashDue({
    total,
    withheld: doc.withholdTax ? withheld : 0,
    paid,
    whtPaid: doc.whtPaid,
    trackingPayments: showPaid,
  });
  const usd =
    doc.showUsd && (doc.usdRate ?? 0) > 0
      ? formatUsdLine(doc.withholdTax ? net : total, doc.usdRate ?? 0, doc.usdAsOf ?? "")
      : "";

  return (
    <article
      className={cn(
        "print-document mx-auto w-full max-w-2xl bg-paper text-paper-foreground shadow-[var(--shadow-paper)] rounded-xl px-6 py-8 sm:px-10 sm:py-12",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-6 border-b border-paper-line pb-6">
        <div>
          <p className="font-serif text-3xl leading-none tracking-tight">
            {profile.company || profile.name || "Studio"}
          </p>
          <p className="mt-3 text-sm text-paper-muted whitespace-pre-line">
            {[profile.name, profile.address, profile.city, profile.phone, profile.email]
              .filter(Boolean)
              .join("\n")}
          </p>
          {(taxPercent > 0 || profile.vatRegistered) && profile.taxId ? (
            <p className="mt-2 text-sm text-paper-muted">TIN {profile.taxId}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted">
            {kindLabel}
          </p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{doc.number}</p>
          <p className="mt-3 text-sm text-paper-muted">
            {formatDate(doc.issueDate)}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-paper-muted">
            Prepared for
          </p>
          <p className="mt-2 font-medium">
            {doc.clientCompany || doc.clientName || "Client"}
          </p>
          {doc.clientCompany && doc.clientName ? (
            <p className="text-sm text-paper-muted">{doc.clientName}</p>
          ) : null}
          {doc.clientEmail ? (
            <p className="text-sm text-paper-muted">{doc.clientEmail}</p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-paper-muted">
            {doc.untilLabel}
          </p>
          <p className="mt-2 tabular-nums">{formatDate(doc.untilDate)}</p>
          {doc.showStack && doc.stackLabel ? (
            <p className="mt-3 text-sm text-paper-muted">
              Built with {doc.stackLabel}
            </p>
          ) : null}
        </div>
      </section>

      <table className="mt-10 w-full text-sm">
        <thead>
          <tr className="border-b border-paper-line text-left text-xs uppercase tracking-[0.14em] text-paper-muted">
            <th className="pb-2 font-medium">What this does</th>
            <th className="pb-2 text-right font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Rate</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.filter((i) => i.description || i.rate).map((item) => (
            <tr key={item.id} className="border-b border-paper-line/70">
              <td className="py-3 pr-3">{item.description || "—"}</td>
              <td className="py-3 text-right tabular-nums">{item.quantity}</td>
              <td className="py-3 text-right tabular-nums">
                {formatMoney(item.rate, currency)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatMoney(item.quantity * item.rate, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(sub, currency)} />
        {taxPercent > 0 ? (
          <Row
            label={`VAT ${taxPercent}%`}
            value={formatMoney(tax, currency)}
          />
        ) : null}
        <Row
          label="Total"
          value={formatMoney(total, currency)}
          strong
        />
        {doc.withholdTax ? (
          <>
            <Row label="Less WHT 6%" value={formatMoney(withheld, currency)} />
            <Row label="Net payable" value={formatMoney(net, currency)} strong />
          </>
        ) : null}
        {usd ? <p className="text-xs text-paper-muted">{usd}</p> : null}
        {deposit > 0 && !showPaid ? (
          <Row
            label={`Deposit ${doc.depositPercent}%`}
            value={formatMoney(deposit, currency)}
          />
        ) : null}
        {showPaid ? (
          <>
            <Row label="Paid to date" value={formatMoney(paid, currency)} />
            <Row
              label={settled ? "Paid in full" : "Balance due"}
              value={formatMoney(balance, currency)}
              strong
            />
          </>
        ) : null}
      </section>

      {doc.notes ? (
        <p className="mt-10 max-w-prose text-sm leading-relaxed text-paper-muted">
          {doc.notes}
        </p>
      ) : null}

      {payTo.length ? (
        <p className="mt-6 max-w-prose whitespace-pre-line text-sm text-paper-muted">
          {payTo.join("\n")}
        </p>
      ) : null}
      {clientPays > MOMO_TX_MAX ? (
        <p className="mt-2 max-w-prose text-sm text-paper-muted">
          Mobile money max is UGX 5M per transaction. Pay in parts or by bank.
        </p>
      ) : null}

      {profile.paymentTerms ? (
        <p className="mt-2 text-xs text-paper-muted">{profile.paymentTerms}</p>
      ) : null}
    </article>
  );
}

export function ReceiptPaper({
  profile,
  currency,
  invoice,
  payment,
  className,
}: {
  profile: Profile;
  currency: Currency;
  invoice: Invoice;
  payment: Payment;
  className?: string;
}) {
  const taxPercent = Math.max(0, invoice.taxPercent || 0);
  const sub = itemsSubtotal(invoice.items);
  const total = sub + taxAmount(sub, taxPercent);
  const withheld = withholdingAmount(sub, invoice.withholdTax);
  const net = netPayable(total, withheld);
  const paid = amountPaid(invoice.payments);
  const balance = Math.max(0, total - paid);
  const settled = total > 0 && paid >= total;
  const payTo = paymentLines(profile);
  const certificate = payment.method === "wht";
  const whtPaid = (invoice.payments ?? [])
    .filter((p) => p.method === "wht")
    .reduce((sum, p) => sum + Math.max(0, p.amount), 0);
  const clientPays = clientCashDue({
    total,
    withheld: invoice.withholdTax ? withheld : 0,
    paid,
    whtPaid,
    trackingPayments: true,
  });
  const usd =
    invoice.showUsd && (invoice.usdRate ?? 0) > 0
      ? formatUsdLine(
          invoice.withholdTax ? net : total,
          invoice.usdRate ?? 0,
          invoice.usdAsOf ?? "",
        )
      : "";

  return (
    <article
      className={cn(
        "print-document mx-auto w-full max-w-2xl bg-paper text-paper-foreground shadow-[var(--shadow-paper)] rounded-xl px-6 py-8 sm:px-10 sm:py-12",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-6 border-b border-paper-line pb-6">
        <div>
          <p className="font-serif text-3xl leading-none tracking-tight">
            {profile.company || profile.name || "Studio"}
          </p>
          <p className="mt-3 text-sm text-paper-muted whitespace-pre-line">
            {[profile.name, profile.address, profile.city, profile.phone, profile.email]
              .filter(Boolean)
              .join("\n")}
          </p>
          {(taxPercent > 0 || profile.vatRegistered) && profile.taxId ? (
            <p className="mt-2 text-sm text-paper-muted">TIN {profile.taxId}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted">
            Receipt
          </p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{payment.number}</p>
          <p className="mt-3 text-sm text-paper-muted">
            {formatDate(payment.date)}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-paper-muted">
            Received from
          </p>
          <p className="mt-2 font-medium">
            {invoice.clientCompany || invoice.clientName || "Client"}
          </p>
          {invoice.clientCompany && invoice.clientName ? (
            <p className="text-sm text-paper-muted">{invoice.clientName}</p>
          ) : null}
          {invoice.clientEmail ? (
            <p className="text-sm text-paper-muted">{invoice.clientEmail}</p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-paper-muted">
            Against invoice
          </p>
          <p className="mt-2 tabular-nums">{invoice.number}</p>
          <p className="mt-3 text-sm text-paper-muted">
            {paymentMethodLabel(payment.method)}
          </p>
        </div>
      </section>

      <p
        className={cn(
          "mt-10 font-serif tracking-tight",
          settled ? "text-4xl" : "text-3xl",
        )}
      >
        {settled ? "Paid in full" : certificate ? "WHT certificate" : "Payment received"}
      </p>

      <section className="mt-8 ml-auto w-full max-w-xs space-y-2 text-sm">
        <Row
          label={certificate ? "WHT certificate" : "This payment"}
          value={formatMoney(payment.amount, currency)}
          strong
        />
        <Row label="Invoice total" value={formatMoney(total, currency)} />
        {invoice.withholdTax ? (
          <>
            <Row label="Less WHT 6%" value={formatMoney(withheld, currency)} />
            <Row label="Net payable" value={formatMoney(net, currency)} />
          </>
        ) : null}
        {usd ? <p className="text-xs text-paper-muted">{usd}</p> : null}
        <Row label="Paid to date" value={formatMoney(paid, currency)} />
        <Row
          label={settled ? "Balance" : "Still due"}
          value={formatMoney(balance, currency)}
        />
      </section>

      {payment.note ? (
        <p className="mt-10 max-w-prose text-sm leading-relaxed text-paper-muted">
          {payment.note}
        </p>
      ) : null}

      {payTo.length ? (
        <p className="mt-6 max-w-prose whitespace-pre-line text-sm text-paper-muted">
          {payTo.join("\n")}
        </p>
      ) : null}
      {clientPays > MOMO_TX_MAX ? (
        <p className="mt-2 max-w-prose text-sm text-paper-muted">
          Mobile money max is UGX 5M per transaction. Pay in parts or by bank.
        </p>
      ) : null}
    </article>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6",
        strong && "border-t border-paper-line pt-2 font-medium",
      )}
    >
      <span className="text-paper-muted">{label}</span>
      <span className={cn("tabular-nums", strong && "font-serif text-xl")}>
        {value}
      </span>
    </div>
  );
}
