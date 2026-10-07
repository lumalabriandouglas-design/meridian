import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { MoneyField } from "@/components/money-field";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { computeRates } from "@/lib/money/calc";
import { DEFAULT_RATE, RATE_PRESETS } from "@/lib/money/empty-desk";
import { formatHours, formatMoney } from "@/lib/money/format";
import { useMoney } from "@/lib/money/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/rate")({ component: RateLab });

function RateLab() {
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const setRate = useMoney((s) => s.setRate);
  const math = computeRates(rate);
  const c = profile.currency;
  const rec = Math.round(math.recommended / 1000) * 1000;
  const floor = Math.round(math.floor / 1000) * 1000;
  const prem = Math.round(math.premium / 1000) * 1000;

  return (
    <AppShell>
      <PageHeader
        kicker="Rate lab"
        title="The number you do not go below"
        description="Monthly take-home in UGX, weeks off, how much of your week is actually billable. Tax follows the URA 2026/27 bands unless you override it."
      />

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-12">
        <div className="space-y-8 rounded-xl bg-card p-6 shadow-[var(--shadow-border)] lg:col-span-7">
          <div className="flex flex-wrap gap-2">
            {RATE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setRate({
                    monthlyTakeHome: preset.monthlyTakeHome,
                    overheadMonthly: preset.overheadMonthly,
                    weeksOff: DEFAULT_RATE.weeksOff,
                    hoursPerWeek: DEFAULT_RATE.hoursPerWeek,
                    utilization: DEFAULT_RATE.utilization,
                    profitMargin: DEFAULT_RATE.profitMargin,
                    taxManual: false,
                  })
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Field
            label="What you need to take home each month"
            value={formatMoney(rate.monthlyTakeHome, c)}
          >
            <MoneyField
              currency={c}
              value={rate.monthlyTakeHome}
              onChange={(n) => setRate({ monthlyTakeHome: n })}
            />
          </Field>

          <Field
            label="What you charge now"
            value={`${formatMoney(rate.currentRate, c)}/hr`}
          >
            <MoneyField
              currency={c}
              value={rate.currentRate}
              onChange={(n) => setRate({ currentRate: n })}
            />
          </Field>

          <Range
            label="Weeks off each year"
            value={`${rate.weeksOff} weeks`}
            min={0}
            max={12}
            step={1}
            current={rate.weeksOff}
            onChange={(n) => setRate({ weeksOff: n })}
          />
          <Range
            label="Hours on the clock, per week"
            value={`${rate.hoursPerWeek} hrs`}
            min={10}
            max={50}
            step={1}
            current={rate.hoursPerWeek}
            onChange={(n) => setRate({ hoursPerWeek: n })}
          />
          <Range
            label="Share of that time you can actually bill"
            value={`${Math.round(rate.utilization * 100)}%`}
            min={0.3}
            max={0.9}
            step={0.05}
            current={rate.utilization}
            onChange={(n) => setRate({ utilization: n })}
          />
          <Field
            label="Monthly overhead"
            value={formatMoney(rate.overheadMonthly, c)}
          >
            <MoneyField
              currency={c}
              value={rate.overheadMonthly}
              onChange={(n) => setRate({ overheadMonthly: n })}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Rent, internet, software, a boda, the accountant.
            </p>
          </Field>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <Label>Effective tax</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(math.effectiveTax * 100)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              URA 2026/27 bands, guidance only. Overhead is not grossed up.
            </p>
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span>Set the tax percent yourself</span>
              <Switch
                checked={Boolean(rate.taxManual)}
                onCheckedChange={(on) =>
                  setRate({
                    taxManual: on,
                    taxRate: on ? math.effectiveTax : rate.taxRate,
                  })
                }
              />
            </label>
            {rate.taxManual ? (
              <div className="mt-3">
                <Range
                  label="Manual tax"
                  value={`${Math.round(rate.taxRate * 100)}%`}
                  min={0}
                  max={0.45}
                  step={0.01}
                  current={rate.taxRate}
                  onChange={(n) => setRate({ taxRate: n, taxManual: true })}
                />
              </div>
            ) : null}
          </div>
          <Range
            label="Profit on top"
            value={`${Math.round(rate.profitMargin * 100)}%`}
            min={0}
            max={0.5}
            step={0.05}
            current={rate.profitMargin}
            onChange={(n) => setRate({ profitMargin: n })}
          />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <RateCard
            label="Floor"
            amount={formatMoney(floor, c)}
            hint="Covers the life. No cushion."
          />
          <RateCard
            label="Recommended"
            amount={formatMoney(rec, c)}
            hint="The Meridian line. Use this on estimates."
            featured
          />
          <RateCard
            label="Premium"
            amount={formatMoney(prem, c)}
            hint="Rush, difficult clients, the ones who found you."
          />
          <div className="rounded-xl bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-[var(--shadow-border)]">
            <p>
              {formatHours(math.billableHours)} billed this year at the
              recommended rate is{" "}
              <span className="text-foreground">
                {formatMoney(math.withProfit, c)}
              </span>{" "}
              before you take it home.
            </p>
            {rate.currentRate > 0 && rate.currentRate < rec ? (
              <p className="mt-3">
                Stay at {formatMoney(rate.currentRate, c)}/hr and you leave{" "}
                <span className="text-foreground">
                  {formatMoney(Math.max(0, math.gapAnnual), c)}
                </span>{" "}
                on the table — or you work {math.multiplier.toFixed(1)}× the
                hours.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={(v) => onChange(v[0] ?? current)}
      />
    </div>
  );
}

function RateCard({
  label,
  amount,
  hint,
  featured,
}: {
  label: string;
  amount: string;
  hint: string;
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "rounded-xl bg-primary px-5 py-6 text-primary-foreground"
          : "rounded-xl bg-card p-5 shadow-[var(--shadow-border)]"
      }
    >
      <p
        className={
          featured
            ? "text-xs font-medium uppercase tracking-[0.16em] opacity-70"
            : "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl tabular-nums leading-none">{amount}</p>
      <p
        className={
          featured
            ? "mt-3 text-sm opacity-70"
            : "mt-3 text-sm text-muted-foreground"
        }
      >
        {hint}
      </p>
    </div>
  );
}
