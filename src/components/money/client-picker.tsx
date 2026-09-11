import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMoney } from "@/lib/money/store";
import type { ClientDraft } from "@/lib/money/types";

export function ClientPicker({
  value,
  onChange,
  nameLabel = "Name",
  companyLabel = "Company",
  companyPlaceholder,
}: {
  value: ClientDraft;
  onChange: (next: ClientDraft) => void;
  nameLabel?: string;
  companyLabel?: string;
  companyPlaceholder?: string;
}) {
  const clients = useMoney((s) => s.clients);

  function selectId(id: string) {
    if (!id) {
      onChange({
        clientId: null,
        clientName: "",
        clientCompany: "",
        clientEmail: "",
      });
      return;
    }
    const hit = clients.find((c) => c.id === id);
    if (!hit) return;
    onChange({
      clientId: hit.id,
      clientName: hit.name,
      clientCompany: hit.company,
      clientEmail: hit.email,
    });
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="bill-who">Who are you billing?</Label>
        <select
          id="bill-who"
          className="mt-2 flex h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)]"
          value={value.clientId ?? ""}
          onChange={(e) => selectId(e.target.value)}
        >
          <option value="">Someone new</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company ? `${c.company} — ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="bill-name">{nameLabel}</Label>
        <Input
          id="bill-name"
          className="mt-2"
          value={value.clientName}
          onChange={(e) =>
            onChange({ ...value, clientName: e.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor="bill-co">{companyLabel}</Label>
        <Input
          id="bill-co"
          className="mt-2"
          placeholder={companyPlaceholder}
          value={value.clientCompany}
          onChange={(e) =>
            onChange({ ...value, clientCompany: e.target.value })
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="bill-em">Email</Label>
        <Input
          id="bill-em"
          className="mt-2"
          type="email"
          value={value.clientEmail}
          onChange={(e) =>
            onChange({ ...value, clientEmail: e.target.value })
          }
        />
      </div>
    </section>
  );
}
