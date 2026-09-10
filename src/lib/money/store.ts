import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addDaysISO, todayISO, uid } from "@/lib/utils";
import { computeRates } from "./calc";
import { nextNumber } from "./format";
import { createSeed } from "./seed";
import type {
  Client,
  Estimate,
  EstimateKind,
  Invoice,
  InvoiceStatus,
  LineItem,
  MoneyState,
  Profile,
  RateInputs,
  TimeEntry,
} from "./types";

type Actions = {
  setProfile: (patch: Partial<Profile>) => void;
  setRate: (patch: Partial<RateInputs>) => void;
  upsertClient: (input: Partial<Client> & { name: string }) => string;
  saveEstimate: (
    input: Omit<Estimate, "id" | "number" | "createdAt"> & {
      id?: string;
      number?: string;
    },
  ) => string;
  updateEstimate: (id: string, patch: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
  saveInvoice: (
    input: Omit<Invoice, "id" | "number" | "createdAt"> & {
      id?: string;
      number?: string;
    },
  ) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  convertEstimate: (estimateId: string) => string | null;
  addTime: (input: Omit<TimeEntry, "id" | "createdAt">) => string;
  updateTime: (id: string, patch: Partial<TimeEntry>) => void;
  toggleTimer: (id: string) => void;
  deleteTime: (id: string) => void;
  invoiceFromTime: (ids: string[]) => string | null;
  resetDemo: () => void;
};

export type MoneyStore = MoneyState & Actions;

const emptyItem = (): LineItem => ({
  id: uid(),
  description: "",
  quantity: 1,
  rate: 0,
});

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  };
}

export const useMoney = create<MoneyStore>()(
  persist(
    (set, get) => ({
      ...createSeed(),

      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      setRate: (patch) => set((s) => ({ rate: { ...s.rate, ...patch } })),

      upsertClient: (input) => {
        const name = input.name.trim();
        const existing = get().clients.find(
          (c) =>
            (input.id && c.id === input.id) ||
            c.name.toLowerCase() === name.toLowerCase() ||
            (input.company &&
              c.company.toLowerCase() === input.company.trim().toLowerCase()),
        );
        if (existing) {
          set((s) => ({
            clients: s.clients.map((c) =>
              c.id === existing.id ? { ...c, ...input, name } : c,
            ),
          }));
          return existing.id;
        }
        const id = uid();
        const client: Client = {
          id,
          name,
          company: input.company ?? "",
          email: input.email ?? "",
          phone: input.phone ?? "",
          notes: input.notes ?? "",
          createdAt: todayISO(),
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        return id;
      },

      saveEstimate: (input) => {
        const id = input.id ?? uid();
        const current = get().estimates.find((e) => e.id === id);
        const number =
          input.number ??
          current?.number ??
          nextNumber(
            "EST",
            get().estimates.map((e) => e.number),
          );
        const row: Estimate = {
          ...input,
          id,
          number,
          createdAt: current?.createdAt ?? todayISO(),
        };
        set((s) => ({
          estimates: current
            ? s.estimates.map((e) => (e.id === id ? row : e))
            : [row, ...s.estimates],
        }));
        return id;
      },

      updateEstimate: (id, patch) =>
        set((s) => ({
          estimates: s.estimates.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),

      deleteEstimate: (id) =>
        set((s) => ({ estimates: s.estimates.filter((e) => e.id !== id) })),

      saveInvoice: (input) => {
        const id = input.id ?? uid();
        const current = get().invoices.find((e) => e.id === id);
        const number =
          input.number ??
          current?.number ??
          nextNumber(
            "INV",
            get().invoices.map((e) => e.number),
          );
        const row: Invoice = {
          ...input,
          id,
          number,
          createdAt: current?.createdAt ?? todayISO(),
        };
        set((s) => ({
          invoices: current
            ? s.invoices.map((e) => (e.id === id ? row : e))
            : [row, ...s.invoices],
        }));
        return id;
      },

      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),

      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((e) => e.id !== id) })),

      convertEstimate: (estimateId) => {
        const est = get().estimates.find((e) => e.id === estimateId);
        if (!est) return null;
        const existing = get().invoices.find((i) => i.estimateId === estimateId);
        if (existing) return existing.id;
        get().updateEstimate(estimateId, { status: "accepted" });
        return get().saveInvoice({
          estimateId,
          clientId: est.clientId,
          clientName: est.clientName,
          clientCompany: est.clientCompany,
          clientEmail: est.clientEmail,
          issueDate: todayISO(),
          dueDate: addDaysISO(14),
          status: "sent",
          items: est.items.map((item) => ({ ...item, id: uid() })),
          notes: est.notes,
          taxPercent: est.taxPercent,
        });
      },

      addTime: (input) => {
        const id = uid();
        const row: TimeEntry = { ...input, id, createdAt: todayISO() };
        set((s) => ({ timeEntries: [row, ...s.timeEntries] }));
        return id;
      },

      updateTime: (id, patch) =>
        set((s) => ({
          timeEntries: s.timeEntries.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),

      toggleTimer: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          timeEntries: s.timeEntries.map((t) => {
            if (t.runningSince && t.id !== id) {
              const extra = Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(t.runningSince).getTime()) / 1000,
                ),
              );
              return { ...t, seconds: t.seconds + extra, runningSince: null };
            }
            if (t.id !== id) return t;
            if (t.runningSince) {
              const extra = Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(t.runningSince).getTime()) / 1000,
                ),
              );
              return { ...t, seconds: t.seconds + extra, runningSince: null };
            }
            return { ...t, runningSince: now };
          }),
        }));
      },

      deleteTime: (id) =>
        set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) })),

      invoiceFromTime: (ids) => {
        const rows = get().timeEntries.filter((t) => ids.includes(t.id));
        if (!rows.length) return null;
        const items: LineItem[] = rows.map((t) => ({
          id: uid(),
          description: t.project ? `${t.clientName} — ${t.project}` : t.clientName,
          quantity: Math.round((t.seconds / 3600) * 100) / 100,
          rate: t.rate,
        }));
        return get().saveInvoice({
          estimateId: null,
          clientId: null,
          clientName: rows[0].clientName,
          clientCompany: "",
          clientEmail: "",
          issueDate: todayISO(),
          dueDate: addDaysISO(14),
          status: "draft",
          items,
          notes: "From tracked time.",
          taxPercent: 0,
        });
      },

      resetDemo: () => set(() => createSeed()),
    }),
    {
      name: "meridian-ugx-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage() : localStorage,
      ),
    },
  ),
);

export function useRecommendedRate(): number {
  const rate = useMoney((s) => s.rate);
  return computeRates(rate).recommended;
}

export function derivedInvoiceStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "paid" || inv.status === "draft") return inv.status;
  if (inv.dueDate < todayISO()) return "overdue";
  return inv.status;
}

export { emptyItem };
export type { EstimateKind };
