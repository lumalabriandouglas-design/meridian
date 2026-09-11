import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { ClientPicker } from "@/components/money/client-picker";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeRates } from "@/lib/money/calc";
import { formatHours, formatMoney, roundUgxNice } from "@/lib/money/format";
import { AUTO_JOBS } from "@/lib/money/playbooks";
import type { ClientDraft, LineItem } from "@/lib/money/types";
import { useMoney } from "@/lib/money/store";
import { addDaysISO, cn, todayISO, uid } from "@/lib/utils";

export const Route = createFileRoute("/estimate/auto")({
  component: AutoEstimate,
});

function AutoEstimate() {
  const navigate = useNavigate();
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const saveEstimate = useMoney((s) => s.saveEstimate);
  const upsertClient = useMoney((s) => s.upsertClient);
  const recommended = Math.round(computeRates(rate).recommended / 1000) * 1000;

  const [jobId, setJobId] = useState("brakes-f");
  const [client, setClient] = useState<ClientDraft>({
    clientId: null,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
  });
  const [vehicle, setVehicle] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [labor, setLabor] = useState<number | null>(null);
  const [parts, setParts] = useState<{ id: string; name: string; cost: number }[]>(
    () =>
      (AUTO_JOBS.find((j) => j.id === "brakes-f")?.parts ?? []).map((p) => ({
        id: uid(),
        name: p.name,
        cost: p.cost,
      })),
  );
  const [notes, setNotes] = useState("");

  const job = AUTO_JOBS.find((j) => j.id === jobId) ?? AUTO_JOBS[0];

  const laborHours = hours ?? job.hours;
  const laborPrice = labor ?? job.laborList;
  const partRows = parts;

  const items: LineItem[] = useMemo(() => {
    const rows: LineItem[] = [
      {
        id: "labor",
        description: `${job.name} — labour`,
        quantity: 1,
        rate: laborPrice,
      },
      ...partRows
        .filter((p) => p.name || p.cost)
        .map((p) => ({
          id: p.id,
          description: p.name || "Part",
          quantity: 1,
          rate: p.cost,
        })),
    ];
    return rows;
  }, [job.name, laborPrice, partRows]);

  const partsTotal = partRows.reduce((s, p) => s + p.cost, 0);
  const total = laborPrice + partsTotal;
  const cost = laborHours * recommended + partsTotal;
  const earnedHour = laborHours > 0 ? laborPrice / laborHours : 0;

  function pickJob(id: string) {
    setJobId(id);
    setHours(null);
    setLabor(null);
    const next = AUTO_JOBS.find((j) => j.id === id);
    setParts(
      (next?.parts ?? []).map((p) => ({
        id: uid(),
        name: p.name,
        cost: p.cost,
      })),
    );
  }

  function save() {
    const clientId = client.clientName.trim()
      ? upsertClient({
          id: client.clientId ?? undefined,
          name: client.clientName.trim(),
          company: vehicle.trim() || client.clientCompany.trim(),
          email: client.clientEmail.trim(),
        })
      : null;
    const id = saveEstimate({
      kind: "auto",
      clientId,
      clientName: client.clientName.trim() || "Customer",
      clientCompany: vehicle.trim() || client.clientCompany.trim(),
      clientEmail: client.clientEmail.trim(),
      issueDate: todayISO(),
      validUntil: addDaysISO(7),
      status: "draft",
      items: items.map((i) => ({ ...i, id: uid() })),
      notes:
        notes ||
        `${job.blurb} Labour ${formatHours(laborHours)}. Parts priced as listed — subject to what we find on the car.`,
      taxPercent: 0,
      depositPercent: 0,
      stackLabel: "",
      showStack: false,
      hours: laborHours,
    });
    void navigate({ to: "/estimates/$id", params: { id } });
  }

  return (
    <AppShell>
      <PageHeader
        kicker="Auto shop"
        title="Name the job, not the tools"
        description="Labour plus parts, in UGX. Same paper a website estimate uses — so a garage looks like a firm."
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <section>
            <Label>Job</Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {AUTO_JOBS.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => pickJob(j.id)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    jobId === j.id ? "bg-secondary" : "bg-card hover:bg-secondary/70",
                  )}
                >
                  <p className="font-medium">{j.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{j.blurb}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ClientPicker
                value={client}
                onChange={setClient}
                nameLabel="Customer"
                companyLabel="Company"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input
                id="vehicle"
                className="mt-2"
                placeholder="Toyota Premio 2016"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
              />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hrs">Labour hours</Label>
              <Input
                id="hrs"
                className="mt-2"
                type="number"
                min={0.1}
                step={0.1}
                value={laborHours}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Labour charge</Label>
              <MoneyField
                className="mt-2"
                currency={profile.currency}
                value={laborPrice}
                onChange={setLabor}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <Label>Parts</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setParts((p) => [...p, { id: uid(), name: "", cost: 0 }])
                }
              >
                Add part
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {partRows.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-7"
                    placeholder="Part name"
                    value={p.name}
                    onChange={(e) => {
                      setParts((rows) =>
                        rows.map((r) =>
                          r.id === p.id ? { ...r, name: e.target.value } : r,
                        ),
                      );
                    }}
                  />
                  <div className="col-span-5">
                    <MoneyField
                      currency={profile.currency}
                      value={p.cost}
                      onChange={(n) => {
                        setParts((rows) =>
                          rows.map((r) =>
                            r.id === p.id ? { ...r, cost: n } : r,
                          ),
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
              {partRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No parts on this job — labour only.
                </p>
              ) : null}
            </div>
          </section>

          <section>
            <Label htmlFor="notes">Note on the estimate</Label>
            <Textarea
              id="notes"
              className="mt-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What you found, what you’d rather they don’t cheap out on."
            />
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Bay total
            </p>
            <p className="mt-3 font-serif text-4xl tabular-nums">
              {formatMoney(roundUgxNice(total, 1000), profile.currency)}
            </p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Parts</dt>
                <dd className="tabular-nums">
                  {formatMoney(partsTotal, profile.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Labour / hr</dt>
                <dd className="tabular-nums">
                  {formatMoney(Math.round(earnedHour / 1000) * 1000, profile.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cost at studio rate</dt>
                <dd className="tabular-nums">
                  {formatMoney(roundUgxNice(cost, 1000), profile.currency)}
                </dd>
              </div>
            </dl>
            <Button className="mt-6 w-full" onClick={save}>
              Save estimate
            </Button>
          </div>
          <DocumentPaper
            profile={profile}
            currency={profile.currency}
            doc={{
              kindLabel: "Estimate",
              number: "EST-preview",
              clientName: client.clientName || "Customer",
              clientCompany: vehicle || client.clientCompany,
              clientEmail: client.clientEmail,
              issueDate: todayISO(),
              untilLabel: "Valid until",
              untilDate: addDaysISO(7),
              items,
              notes:
                notes ||
                `${job.blurb} Labour ${formatHours(laborHours)}.`,
              taxPercent: 0,
            }}
          />
        </aside>
      </div>
    </AppShell>
  );
}
