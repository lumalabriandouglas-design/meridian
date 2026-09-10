import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
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
  SITE_FEATURES,
  SITE_TYPES,
  STACKS,
} from "@/lib/money/playbooks";
import { useMoney } from "@/lib/money/store";
import { addDaysISO, cn, todayISO, uid } from "@/lib/utils";

export const Route = createFileRoute("/estimate/website")({
  component: WebsiteEstimate,
});

function WebsiteEstimate() {
  const navigate = useNavigate();
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const clients = useMoney((s) => s.clients);
  const saveEstimate = useMoney((s) => s.saveEstimate);
  const upsertClient = useMoney((s) => s.upsertClient);

  const recommended = Math.round(computeRates(rate).recommended / 1000) * 1000;

  const [typeId, setTypeId] = useState("business");
  const [pages, setPages] = useState(6);
  const [featureIds, setFeatureIds] = useState<string[]>(["booking", "whatsapp"]);
  const [stackId, setStackId] = useState("custom");
  const [showStack, setShowStack] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [price, setPrice] = useState<number | null>(null);
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

  const featureNames = quoted.features.map((f) => f.name.toLowerCase());
  const autoNotes =
    notes ||
    [
      `This estimate covers a ${quoted.type.name.toLowerCase()}`,
      quoted.extraPages
        ? `with ${pages} pages`
        : `with ${quoted.type.pagesIncluded} pages included`,
      featureNames.length ? `plus ${featureNames.join(", ")}` : null,
      quoted.rush ? "on a rush timeline" : null,
      "40% to start, remainder on launch.",
    ]
      .filter(Boolean)
      .join(" ")
      .replace("  ", " ");

  const items = [
    {
      id: "pkg",
      description: `${quoted.type.name} — ${pages} page${pages === 1 ? "" : "s"}`,
      quantity: 1,
      rate: yourPrice,
    },
  ];

  function toggle(id: string) {
    setFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setPrice(null);
  }

  function save() {
    const clientId = clientName.trim()
      ? upsertClient({
          name: clientName.trim(),
          company: clientCompany.trim(),
          email: clientEmail.trim(),
        })
      : null;
    const id = saveEstimate({
      kind: "website",
      clientId,
      clientName: clientName.trim() || "Client",
      clientCompany: clientCompany.trim(),
      clientEmail: clientEmail.trim(),
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
        description="Languages you code in stay backstage. Extra language means the site itself — English plus Luganda, for example."
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
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
              <Label htmlFor="stack">How you’ll build it</Label>
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
                <span>Show “built with” on the estimate</span>
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

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cname">Client</Label>
              <Input
                id="cname"
                className="mt-2"
                list="client-names"
                placeholder="Binti Nakato"
                value={clientName}
                onChange={(e) => {
                  const name = e.target.value;
                  setClientName(name);
                  const hit = clients.find(
                    (c) => c.name.toLowerCase() === name.toLowerCase(),
                  );
                  if (hit) {
                    setClientCompany(hit.company);
                    setClientEmail(hit.email);
                  }
                }}
              />
              <datalist id="client-names">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="cco">Company</Label>
              <Input
                id="cco"
                className="mt-2"
                placeholder="Binti"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cem">Email</Label>
              <Input
                id="cem"
                className="mt-2"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
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
                setPrice(list);
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
                clientName: clientName || "Client",
                clientCompany,
                clientEmail,
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
