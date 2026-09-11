import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { ClientPicker } from "@/components/money/client-picker";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { computeRates } from "@/lib/money/calc";
import { formatHours, formatMoney, roundUgxNice } from "@/lib/money/format";
import {
  quoteWebsite,
  scaleOutcomeLines,
  SITE_FEATURES,
  SITE_TYPES,
  STACKS,
  websiteOutcomeLines,
  websiteOutcomeNotes,
} from "@/lib/money/playbooks";
import { useMoney } from "@/lib/money/store";
import type { ClientDraft } from "@/lib/money/types";
import { workById } from "@/lib/money/works";
import { addDaysISO, cn, todayISO, uid } from "@/lib/utils";

type WebsiteSearch = { like?: string };

export const Route = createFileRoute("/estimate/website")({
  validateSearch: (search: Record<string, unknown>): WebsiteSearch => ({
    like: typeof search.like === "string" ? search.like : undefined,
  }),
  component: WebsiteEstimate,
});

function WebsiteEstimate() {
  const { like } = Route.useSearch();
  const sample = workById(like);
  const navigate = useNavigate();
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const saveEstimate = useMoney((s) => s.saveEstimate);
  const upsertClient = useMoney((s) => s.upsertClient);

  const recommended = Math.round(computeRates(rate).recommended / 1000) * 1000;
  const startType = sample?.siteTypeId ?? "business";
  const startPages =
    SITE_TYPES.find((t) => t.id === startType)?.pagesIncluded ?? 6;

  const [typeId, setTypeId] = useState(startType);
  const [pages, setPages] = useState(startPages);
  const [featureIds, setFeatureIds] = useState<string[]>(
    sample?.featureIds ?? ["booking", "whatsapp"],
  );
  const [stackId, setStackId] = useState("custom");
  const [showStack, setShowStack] = useState(false);
  const [client, setClient] = useState<ClientDraft>({
    clientId: null,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
  });
  const [price, setPrice] = useState<number | null>(sample?.price ?? null);
  const [notes, setNotes] = useState("");

  const quoted = useMemo(
    () =>
      quoteWebsite({
        typeId,
        pages,
        featureIds,
        stackId,
        hourlyRate: recommended,
      }),
    [typeId, pages, featureIds, stackId, recommended],
  );

  const list = roundUgxNice(quoted.listPrice);
  const cost = roundUgxNice(quoted.cost);
  const yourPrice = price ?? list;
  const margin = yourPrice - cost;
  const earnedHour = quoted.hours > 0 ? yourPrice / quoted.hours : 0;
  const stack = STACKS.find((s) => s.id === stackId)!;

  const items = useMemo(
    () => scaleOutcomeLines(websiteOutcomeLines(quoted, pages), yourPrice),
    [quoted, pages, yourPrice],
  );

  const autoNotes = notes || websiteOutcomeNotes(quoted, pages);

  function toggle(id: string) {
    setFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setPrice(null);
  }

  function save() {
    const clientId = client.clientName.trim()
      ? upsertClient({
          id: client.clientId ?? undefined,
          name: client.clientName.trim(),
          company: client.clientCompany.trim(),
          email: client.clientEmail.trim(),
        })
      : null;
    const id = saveEstimate({
      kind: "website",
      clientId,
      clientName: client.clientName.trim() || "Client",
      clientCompany: client.clientCompany.trim(),
      clientEmail: client.clientEmail.trim(),
      issueDate: todayISO(),
      validUntil: addDaysISO(14),
      status: "draft",
      items: items.map((i) => ({ ...i, id: uid() })),
      notes: autoNotes,
      taxPercent: 0,
      depositPercent: profile.depositPercent,
      stackLabel: stack.clientLabel,
      showStack,
      hours: quoted.hours,
    });
    void navigate({ to: "/estimates/$id", params: { id } });
  }

  return (
    <AppShell>
      <PageHeader
        kicker="Website playbook"
        title="Kind of site, then the price"
        description="Pick who you are billing. The paper lists what the site will do — not the languages you write it in."
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          {sample ? (
            <p className="rounded-xl bg-card px-5 py-4 text-sm shadow-[var(--shadow-border)]">
              Starting from{" "}
              <span className="font-medium">{sample.name}</span>
              {" — "}
              {formatMoney(sample.price, profile.currency)}. Change the kind of
              site if this job is smaller or larger.
            </p>
          ) : null}

          <ClientPicker
            value={client}
            onChange={setClient}
            companyPlaceholder="Binti"
          />

          <section>
            <Label>What kind of website?</Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SITE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTypeId(t.id);
                    setPages(t.pagesIncluded);
                    setPrice(null);
                  }}
                  className={cn(
                    "rounded-lg px-4 py-3 text-left shadow-[var(--shadow-border)] transition-[background-color] duration-150",
                    typeId === t.id ? "bg-secondary" : "bg-card hover:bg-secondary/70",
                  )}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.blurb}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pages">Pages (they asked for)</Label>
              <Input
                id="pages"
                className="mt-2"
                type="number"
                min={1}
                value={pages}
                onChange={(e) => {
                  setPages(Math.max(1, Number(e.target.value) || 1));
                  setPrice(null);
                }}
              />
            </div>
            <div>
              <Label htmlFor="stack">How you’ll build it (stays off the paper)</Label>
              <select
                id="stack"
                className="mt-2 flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
                value={stackId}
                onChange={(e) => {
                  setStackId(e.target.value);
                  setPrice(null);
                }}
              >
                {STACKS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <label className="mt-3 flex h-11 items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Show “built with” on the estimate only
                </span>
                <Switch checked={showStack} onCheckedChange={setShowStack} />
              </label>
            </div>
          </section>

          <section>
            <Label>What else did they ask for?</Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SITE_FEATURES.map((f) => (
                <label
                  key={f.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-start gap-3 rounded-lg px-3 py-3 shadow-[var(--shadow-border)]",
                    featureIds.includes(f.id) ? "bg-secondary" : "bg-card",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={featureIds.includes(f.id)}
                    onChange={() => toggle(f.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{f.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {f.blurb}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <Label htmlFor="notes">Note on the estimate</Label>
            <Textarea
              id="notes"
              className="mt-2"
              rows={4}
              placeholder={autoNotes}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Your number
            </p>
            <div className="mt-4">
              <Label>Price to send</Label>
              <MoneyField
                className="mt-2"
                currency={profile.currency}
                value={yourPrice}
                onChange={setPrice}
              />
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Line
                k="Kampala list (typical)"
                v={formatMoney(list, profile.currency)}
              />
              <Line
                k={`Your cost · ${formatHours(quoted.hours)}`}
                v={formatMoney(cost, profile.currency)}
              />
              <Line
                k="Margin"
                v={formatMoney(margin, profile.currency)}
                warn={margin < 0}
              />
              <Line
                k="You’d earn"
                v={`${formatMoney(Math.round(earnedHour / 1000) * 1000, profile.currency)}/hr`}
                warn={earnedHour < recommended * 0.7}
              />
            </dl>
            {earnedHour < recommended * 0.7 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Below your recommended rate. Raise the package or cut the
                scope — don’t gift the hours.
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                This job holds the rate from your lab.
              </p>
            )}
            <Button className="mt-6 w-full" onClick={save}>
              Save estimate
            </Button>
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => {
                setPrice(sample?.price ?? list);
              }}
              type="button"
            >
              Reset to typical price
            </Button>
          </div>

          <div className="origin-top scale-[0.92] sm:scale-100">
            <DocumentPaper
              profile={profile}
              currency={profile.currency}
              doc={{
                kindLabel: "Estimate",
                number: "EST-preview",
                clientName: client.clientName || "Client",
                clientCompany: client.clientCompany,
                clientEmail: client.clientEmail,
                issueDate: todayISO(),
                untilLabel: "Valid until",
                untilDate: addDaysISO(14),
                items,
                notes: autoNotes,
                taxPercent: 0,
                depositPercent: profile.depositPercent,
                stackLabel: stack.clientLabel,
                showStack,
              }}
            />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Line({
  k,
  v,
  warn,
}: {
  k: string;
  v: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("tabular-nums", warn && "text-destructive")}>{v}</dd>
    </div>
  );
}
