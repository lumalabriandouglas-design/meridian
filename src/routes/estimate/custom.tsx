import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DocumentPaper } from "@/components/document/paper";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { MoneyField } from "@/components/money-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyItem, useMoney } from "@/lib/money/store";
import type { LineItem } from "@/lib/money/types";
import { addDaysISO, todayISO, uid } from "@/lib/utils";

export const Route = createFileRoute("/estimate/custom")({
  component: CustomEstimate,
});

function CustomEstimate() {
  const navigate = useNavigate();
  const profile = useMoney((s) => s.profile);
  const saveEstimate = useMoney((s) => s.saveEstimate);
  const upsertClient = useMoney((s) => s.upsertClient);

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [notes, setNotes] = useState("");

  function save() {
    const clientId = clientName.trim()
      ? upsertClient({
          name: clientName.trim(),
          company: clientCompany.trim(),
          email: clientEmail.trim(),
        })
      : null;
    const id = saveEstimate({
      kind: "custom",
      clientId,
      clientName: clientName.trim() || "Client",
      clientCompany: clientCompany.trim(),
      clientEmail: clientEmail.trim(),
      issueDate: todayISO(),
      validUntil: addDaysISO(14),
      status: "draft",
      items: items.map((i) => ({ ...i, id: i.id || uid() })),
      notes,
      taxPercent: 0,
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
        title="Line items"
        description="For work that is not a website or a car. Same UGX paper."
      />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="n">Client</Label>
              <Input
                id="n"
                className="mt-2"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c">Company</Label>
              <Input
                id="c"
                className="mt-2"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="e">Email</Label>
              <Input
                id="e"
                className="mt-2"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-12 sm:col-span-6"
                  placeholder="Description"
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
                  <Button
                    type="button"
                    variant="ghost"
                    className="col-span-12"
                    onClick={() => setItems((rows) => [...rows, emptyItem()])}
                  >
                    Add line
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              className="mt-2"
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
              clientName: clientName || "Client",
              clientCompany,
              clientEmail,
              issueDate: todayISO(),
              untilLabel: "Valid until",
              untilDate: addDaysISO(14),
              items,
              notes,
              taxPercent: 0,
              depositPercent: profile.depositPercent,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
