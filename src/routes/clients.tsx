import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMoney } from "@/lib/money/store";

export const Route = createFileRoute("/clients")({ component: Clients });

function Clients() {
  const clients = useMoney((s) => s.clients);
  const upsertClient = useMoney((s) => s.upsertClient);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <AppShell>
      <PageHeader
        kicker="People"
        title="Clients"
        description="A short list. Estimates pull from here when the name matches."
      />
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-12">
        <form
          className="space-y-3 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] lg:col-span-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            upsertClient({
              name: name.trim(),
              company: company.trim(),
              email: email.trim(),
              phone: phone.trim(),
              notes: notes.trim(),
            });
            setName("");
            setCompany("");
            setEmail("");
            setPhone("");
            setNotes("");
          }}
        >
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Company">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Button type="submit">Save client</Button>
        </form>

        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)] lg:col-span-7">
          {clients.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <p className="font-medium">{c.company || c.name}</p>
              <p className="text-sm text-muted-foreground">
                {[c.name, c.email, c.phone].filter(Boolean).join(" · ")}
              </p>
              {c.notes ? (
                <p className="mt-2 text-sm text-muted-foreground">{c.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
