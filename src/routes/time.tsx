import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeRates } from "@/lib/money/calc";
import { formatMoney } from "@/lib/money/format";
import { useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/time")({ component: TimePage });

function TimePage() {
  const entries = useMoney((s) => s.timeEntries);
  const addTime = useMoney((s) => s.addTime);
  const toggleTimer = useMoney((s) => s.toggleTimer);
  const deleteTime = useMoney((s) => s.deleteTime);
  const invoiceFromTime = useMoney((s) => s.invoiceFromTime);
  const profile = useMoney((s) => s.profile);
  const rate = useMoney((s) => s.rate);
  const recommended = Math.round(computeRates(rate).recommended / 1000) * 1000;
  const navigate = useNavigate();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const [clientName, setClientName] = useState("");
  const [project, setProject] = useState("");

  return (
    <AppShell>
      <PageHeader
        kicker="Time"
        title="Hours on the clock"
        description="Start a timer. Dump it onto an invoice when the work is real."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <form
          className="grid gap-3 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:grid-cols-12"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clientName.trim()) return;
            addTime({
              clientName: clientName.trim(),
              project: project.trim(),
              seconds: 0,
              runningSince: new Date().toISOString(),
              rate: recommended,
            });
            setProject("");
          }}
        >
          <div className="sm:col-span-5">
            <Label htmlFor="c">Client</Label>
            <Input
              id="c"
              className="mt-2"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Paloma Coffee"
            />
          </div>
          <div className="sm:col-span-5">
            <Label htmlFor="p">What you’re doing</Label>
            <Input
              id="p"
              className="mt-2"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Home page"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button className="w-full" type="submit">
              Start
            </Button>
          </div>
        </form>

        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
          {entries.length === 0 ? (
            <li className="px-5 py-8 text-sm text-muted-foreground">
              No time yet.
            </li>
          ) : (
            entries.map((row) => {
              const live = liveSeconds(row.seconds, row.runningSince);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{row.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.project || "General"} ·{" "}
                      {formatMoney(row.rate, profile.currency)}/hr
                    </p>
                  </div>
                  <p className="font-serif text-2xl tabular-nums">
                    {formatDuration(live)}
                  </p>
                  <Button
                    size="sm"
                    variant={row.runningSince ? "default" : "secondary"}
                    onClick={() => toggleTimer(row.id)}
                  >
                    {row.runningSince ? "Stop" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const invId = invoiceFromTime([row.id]);
                      if (invId)
                        void navigate({
                          to: "/invoices/$id",
                          params: { id: invId },
                        });
                    }}
                  >
                    Invoice
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTime(row.id)}
                  >
                    Remove
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </AppShell>
  );
}

function liveSeconds(base: number, runningSince: string | null) {
  if (!runningSince) return base;
  return (
    base +
    Math.max(0, Math.floor((Date.now() - new Date(runningSince).getTime()) / 1000))
  );
}

function formatDuration(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
