import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isTemplateTerms, termsForDeposit } from "@/lib/money/empty-desk";
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
        description="This is what prints on every estimate. Amounts stay in Ugandan shillings."
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
          <Field label="Deposit %">
            <Input
              type="number"
              min={0}
              max={100}
              value={profile.depositPercent}
              onChange={(e) => {
                const depositPercent = Number(e.target.value) || 0;
                const current = profile.paymentTerms.trim();
                setProfile({
                  depositPercent,
                  ...(!current || isTemplateTerms(current)
                    ? { paymentTerms: termsForDeposit(depositPercent) }
                    : {}),
                });
              }}
            />
          </Field>
          <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-md bg-secondary px-3 py-3">
            <div>
              <p className="text-sm">VAT registered</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Uganda’s VAT threshold is UGX 300M a year. This only sets the
                default on a new invoice: 18% when on, none when off. Invoices
                already saved keep their own VAT.
              </p>
            </div>
            <Switch
              checked={Boolean(profile.vatRegistered)}
              onCheckedChange={(on) => setProfile({ vatRegistered: on })}
            />
          </div>
          <Field label="TIN" className="sm:col-span-2">
            <Input
              value={profile.taxId}
              onChange={(e) => setProfile({ taxId: e.target.value })}
              placeholder="Only printed on a VAT invoice"
            />
          </Field>
          <Field label="Payment terms" className="sm:col-span-2">
            <Input
              value={profile.paymentTerms}
              onChange={(e) => setProfile({ paymentTerms: e.target.value })}
            />
          </Field>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Amounts are stored in UGX. Show dollars on an individual estimate or
            invoice when you want a conversion — nothing here relabels the numbers.
          </p>
        </div>

        <div className="grid gap-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-medium">How they pay</p>
          <Field label="MTN MoMo number">
            <Input
              value={profile.mtnNumber}
              onChange={(e) => setProfile({ mtnNumber: e.target.value })}
            />
          </Field>
          <Field label="MTN registered name">
            <Input
              value={profile.mtnName}
              onChange={(e) => setProfile({ mtnName: e.target.value })}
            />
          </Field>
          <Field label="Airtel Money number">
            <Input
              value={profile.airtelNumber}
              onChange={(e) => setProfile({ airtelNumber: e.target.value })}
            />
          </Field>
          <Field label="Airtel registered name">
            <Input
              value={profile.airtelName}
              onChange={(e) => setProfile({ airtelName: e.target.value })}
            />
          </Field>
          <Field label="Bank">
            <Input
              value={profile.bankName}
              onChange={(e) => setProfile({ bankName: e.target.value })}
            />
          </Field>
          <Field label="Account name">
            <Input
              value={profile.bankAccountName}
              onChange={(e) => setProfile({ bankAccountName: e.target.value })}
            />
          </Field>
          <Field label="Account number">
            <Input
              value={profile.bankAccountNumber}
              onChange={(e) => setProfile({ bankAccountNumber: e.target.value })}
            />
          </Field>
          <Field label="Branch">
            <Input
              value={profile.bankBranch}
              onChange={(e) => setProfile({ bankBranch: e.target.value })}
            />
          </Field>
          <Field label="SWIFT (optional)" className="sm:col-span-2">
            <Input
              value={profile.bankSwift}
              onChange={(e) => setProfile({ bankSwift: e.target.value })}
            />
          </Field>
          <Field label="Payment note" className="sm:col-span-2">
            <Input
              value={profile.paymentNote}
              onChange={(e) => setProfile({ paymentNote: e.target.value })}
              placeholder="Printed only when mobile money and bank are empty"
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
                window.confirm(
                  "Replace this desk with the shipped-work sample? Current estimates on this phone will be overwritten.",
                )
              ) {
                resetDemo();
              }
            }}
          >
            Reset to shipped work
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
