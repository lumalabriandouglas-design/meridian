import { depositDue, grandTotal, itemsSubtotal, taxAmount } from "@/lib/money/calc";
import { formatMoney } from "@/lib/money/format";
import type { Currency, LineItem, Profile } from "@/lib/money/types";
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
  const tax = taxAmount(sub, doc.taxPercent);
  const total = grandTotal(doc.items, doc.taxPercent);
  const deposit =
    doc.depositPercent && doc.depositPercent > 0
      ? depositDue(total, doc.depositPercent)
      : 0;

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
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-paper-muted">
            {doc.kindLabel}
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
            <th className="pb-2 font-medium">Item</th>
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
        {doc.taxPercent > 0 ? (
          <Row
            label={`VAT ${doc.taxPercent}%`}
            value={formatMoney(tax, currency)}
          />
        ) : null}
        <Row
          label="Total"
          value={formatMoney(total, currency)}
          strong
        />
        {deposit > 0 ? (
          <Row
            label={`Deposit ${doc.depositPercent}%`}
            value={formatMoney(deposit, currency)}
          />
        ) : null}
      </section>

      {doc.notes ? (
        <p className="mt-10 max-w-prose text-sm leading-relaxed text-paper-muted">
          {doc.notes}
        </p>
      ) : null}

      {profile.paymentNote ? (
        <p className="mt-6 max-w-prose text-sm text-paper-muted">
          {profile.paymentNote}
        </p>
      ) : null}

      {profile.paymentTerms ? (
        <p className="mt-2 text-xs text-paper-muted">{profile.paymentTerms}</p>
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
