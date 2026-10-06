import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Car, Globe, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { amountPaid, computeRates, grandTotal } from "@/lib/money/calc";
import { formatCompact, formatMoney } from "@/lib/money/format";
import { derivedInvoiceStatus, useMoney } from "@/lib/money/store";
import { ADMIN_EMAIL } from "@/lib/money/admin";
import type { Currency } from "@/lib/money/types";
import { formatDate } from "@/lib/utils";

const ShippedStrip = lazy(() => import("@/components/desk/shipped-strip"));

/** Signed-in desk. Prices and shipped cards stay out of the public page. */
export function HomeDesk() {
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const invoices = useMoney((s) => s.invoices);
  const estimates = useMoney((s) => s.estimates);
  const math = computeRates(rate);
  const currency = profile.currency || "UGX";
  const showCatalog =
    profile.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const outstanding = invoices.reduce((s, i) => {
    if (derivedInvoiceStatus(i) === "paid") return s;
    const total = grandTotal(i.items, i.taxPercent);
    return s + Math.max(0, total - amountPaid(i.payments));
  }, 0);
  const collected = invoices.reduce((s, i) => s + amountPaid(i.payments), 0);
  const openEstimates = estimates.filter(
    (e) => e.status === "sent" || e.status === "draft",
  ).length;
  const recommended = Math.round(math.recommended / 1000) * 1000;
  const title = profile.name.trim() || "Your desk";

  return (
    <>
      <PageHeader
        kicker="Kampala, Uganda"
        title={title}
        description="Your estimates and invoices. Price the next job from work you have already done."
        actions={
          <Button asChild>
            <Link to="/estimate">
              New estimate
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {showCatalog ? (
        <Suspense fallback={null}>
          <ShippedStrip currency={currency as Currency} layout="grid" />
        </Suspense>
      ) : null}

      <section className="enter enter-3 mx-auto grid max-w-5xl gap-4 lg:grid-cols-12">
        <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-border)] lg:col-span-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Recommended rate
          </p>
          <p className="mt-4 font-serif text-5xl leading-none tracking-tight tabular-nums sm:text-6xl">
            {formatMoney(recommended, currency)}
          </p>
          <p className="mt-2 text-muted-foreground">
            per hour, after tax and overhead
          </p>
          {rate.currentRate > 0 && rate.currentRate < math.recommended ? (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              At {formatMoney(rate.currentRate, currency)}/hr you need about{" "}
              <span className="text-foreground tabular-nums">
                {math.multiplier === Infinity
                  ? "∞"
                  : `${math.multiplier.toFixed(1)}×`}
              </span>{" "}
              the hours. The gap this year is{" "}
              <span className="text-foreground">
                {formatMoney(Math.max(0, math.gapAnnual), currency)}
              </span>
              .
            </p>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              {Math.round(math.billableHours)} hrs billable this year pays the
              life you described in Rate lab.
            </p>
          )}
          <Link
            to="/rate"
            className="mt-6 inline-flex h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            Open rate lab
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <Stat
            label="Outstanding"
            value={formatCompact(outstanding, currency)}
            hint="Unpaid invoices"
          />
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Collected"
              value={formatCompact(collected, currency)}
              hint="Marked paid"
            />
            <Stat
              label="Open estimates"
              value={String(openEstimates)}
              hint="Draft or sent"
            />
          </div>
        </div>
      </section>

      <section className="enter enter-3 mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
        <PlayCard
          to="/estimate/website"
          icon={Globe}
          kicker="Playbook"
          title="Website"
          copy="Kind of site, features, your stack in the back. Price in UGX before you reply on WhatsApp."
        />
        <PlayCard
          to="/estimate/auto"
          icon={Car}
          kicker="Playbook"
          title="Auto shop"
          copy="Job, labour, parts. The bay version of the same desk."
        />
      </section>

      <section className="enter enter-4 mx-auto mt-12 max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent paper
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/invoices">
              All invoices
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
          {invoices.length === 0 ? (
            <li className="px-5 py-10 text-sm text-muted-foreground">
              Nothing on paper yet. Price a website or a bay job.
            </li>
          ) : (
            invoices.slice(0, 4).map((inv) => {
              const status = derivedInvoiceStatus(inv);
              return (
                <li key={inv.id}>
                  <Link
                    to="/invoices/$id"
                    params={{ id: inv.id }}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-secondary/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {inv.clientCompany || inv.clientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {inv.number} · {formatDate(inv.issueDate)}
                      </p>
                    </div>
                    <p className="tabular-nums text-sm">
                      {formatMoney(
                        grandTotal(inv.items, inv.taxPercent),
                        currency,
                      )}
                    </p>
                    <StatusBadge status={status} />
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PlayCard({
  to,
  icon: Icon,
  kicker,
  title,
  copy,
}: {
  to: "/estimate/website" | "/estimate/auto";
  icon: typeof Globe;
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl bg-card p-6 shadow-[var(--shadow-border)] transition-[background-color] duration-150 hover:bg-secondary"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {kicker}
        </p>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 font-serif text-3xl tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
      <p className="mt-5 inline-flex items-center text-sm">
        Start
        <Plus className="ml-2 size-4" />
      </p>
    </Link>
  );
}
