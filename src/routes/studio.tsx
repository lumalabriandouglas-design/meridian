import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/money/types";
import { useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/studio")({ component: Studio });

function Studio() {
  const profile = useMoney((s) => s.profile);
  const setProfile = useMoney((s) => s.setProfile);
  const resetDemo = useMoney((s) => s.resetDemo);

  return (
    <AppShell>
      <PageHeader
        kicker="Studio"
        title="Your letterhead"
        description="This is what prints on every estimate. Main currency is Ugandan shillings — change only if a client insists."
      />
      <div className="mx-auto grid max-w-3xl gap-5">
        <div className="grid gap-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:grid-cols-2">
          <Field label="Your name">
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
          </Field>
          <Field label="Studio">
            <Input
              value={profile.company}
              onChange={(e) => setProfile({ company: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ phone: e.target.value })}
            />
          </Field>
          <Field label="Address">
            <Input
              value={profile.address}
              onChange={(e) => setProfile({ address: e.target.value })}
            />
          </Field>
          <Field label="City">
            <Input
              value={profile.city}
              onChange={(e) => setProfile({ city: e.target.value })}
            />
          </Field>
          <Field label="Currency">
            <select
              className="flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
              value={profile.currency}
              onChange={(e) =>
                setProfile({
                  currency: e.target.value as (typeof CURRENCIES)[number],
                })
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                  {c === "UGX" ? " — default" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Deposit %">
            <Input
              type="number"
              min={0}
              max={100}
              value={profile.depositPercent}
              onChange={(e) =>
                setProfile({ depositPercent: Number(e.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Payment terms" className="sm:col-span-2">
            <Input
              value={profile.paymentTerms}
              onChange={(e) => setProfile({ paymentTerms: e.target.value })}
            />
          </Field>
          <Field label="How they pay (MoMo, bank)" className="sm:col-span-2">
            <Textarea
              value={profile.paymentNote}
              onChange={(e) => setProfile({ paymentNote: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/rate">Rate lab</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/clients">Clients</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/time">Time</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (
                window.confirm("Replace everything with the Kampala demo data?")
              ) {
                resetDemo();
              }
            }}
          >
            Reset demo
          </Button>
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
