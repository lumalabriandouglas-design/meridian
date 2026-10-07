import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { ClientPicker } from "@/components/money/client-picker";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money/format";
import { emptyItem, useMoney } from "@/lib/money/store";
import type { ClientDraft, LineItem } from "@/lib/money/types";
import { LINE_PRESETS } from "@/lib/money/playbooks";
import { workById, workLines } from "@/lib/money/works";
import { addDaysISO, todayISO, uid } from "@/lib/utils";

type CustomSearch = { like?: string };

export const Route = createFileRoute("/estimate/custom")({
  validateSearch: (search: Record<string, unknown>): CustomSearch => ({
    like: typeof search.like === "string" ? search.like : undefined,
  }),
  component: CustomEstimate,
});

function CustomEstimate() {
  const { like } = Route.useSearch();
  const sample = workById(like);
  const navigate = useNavigate();
  const profile = useMoney((s) => s.profile);
  const saveEstimate = useMoney((s) => s.saveEstimate);
  const upsertClient = useMoney((s) => s.upsertClient);

  const [client, setClient] = useState<ClientDraft>({
    clientId: null,
    clientName: "",
    clientCompany: "",
    clientEmail: "",
  });
  const [items, setItems] = useState<LineItem[]>(() => {
    if (!sample) return [{ ...emptyItem(), description: "" }];
    return workLines(sample).map((i) => ({ ...i, id: uid() }));
  });
  const [notes, setNotes] = useState(sample?.blurb ?? "");

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
      kind: "custom",
      clientId,
      clientName: client.clientName.trim() || "Client",
      clientCompany: client.clientCompany.trim(),
      clientEmail: client.clientEmail.trim(),
      issueDate: todayISO(),
      validUntil: addDaysISO(14),
      status: "draft",
      items: items.map((i) => ({ ...i, id: i.id || uid() })),
      notes,
      taxPercent: profile.vatRegistered ? 18 : 0,
      depositPercent: profile.depositPercent,
      stackLabel: "",
      showStack: false,
      hours: 0,
    });
    void navigate({ to: "/estimates/$id", params: { id } });
  }

  return (
    <AppShell>
      <PageHeader
        kicker="Custom"
        title="What will this do?"
        description="Name the outcome — a booking app, a shop, a client portal. Not React or Python."
      />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {sample ? (
            <p className="rounded-xl bg-card px-5 py-4 text-sm shadow-[var(--shadow-border)]">
              Starting from{" "}
              <span className="font-medium">{sample.name}</span>
              {" — "}
              {formatMoney(sample.price, profile.currency)}. Lines are what the
              app does, not how it is built.
            </p>
          ) : null}

          <ClientPicker value={client} onChange={setClient} />

          <div className="space-y-3">
            <Label>What the site or app will do</Label>
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-12 sm:col-span-6"
                  placeholder={
                    index === 0
                      ? "Booking app — clients pick a time and pay with MoMo"
                      : "Another thing it will do"
                  }
                  value={item.description}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((r) =>
                        r.id === item.id
                          ? { ...r, description: e.target.value }
                          : r,
                      ),
                    )
                  }
                />
                <Input
                  className="col-span-4 sm:col-span-2"
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((rows) =>
                      rows.map((r) =>
                        r.id === item.id
                          ? { ...r, quantity: Number(e.target.value) || 0 }
                          : r,
                      ),
                    )
                  }
                />
                <div className="col-span-8 sm:col-span-4">
                  <MoneyField
                    currency={profile.currency}
                    value={item.rate}
                    onChange={(n) =>
                      setItems((rows) =>
                        rows.map((r) =>
                          r.id === item.id ? { ...r, rate: n } : r,
                        ),
                      )
                    }
                  />
                </div>
                {index === items.length - 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className="col-span-12"
                      onClick={() => setItems((rows) => [...rows, emptyItem()])}
                    >
                      Add line
                    </Button>
                    <div className="col-span-12 flex flex-wrap gap-2">
                      {LINE_PRESETS.map((preset) => (
                        <Button
                          key={preset.id}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setItems((rows) => [
                              ...rows,
                              {
                                ...emptyItem(),
                                description: preset.description,
                                rate: preset.rate,
                              },
                            ])
                          }
                        >
                          {preset.description}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              className="mt-2"
              placeholder="What they walk away with. No stack, no languages."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={save}>Save estimate</Button>
        </div>
        <div className="lg:col-span-5">
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
              notes,
              taxPercent: profile.vatRegistered ? 18 : 0,
              depositPercent: profile.depositPercent,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
