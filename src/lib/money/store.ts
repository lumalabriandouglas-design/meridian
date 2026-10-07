import { create } from "zustand";
import { addDaysISO, todayISO, uid } from "@/lib/utils";
import { amountPaid, computeRates, grandTotal } from "./calc";
import { nextNumber } from "./format";
import { emptyDesk } from "./empty-desk";
import { loadDesk, saveDesk } from "./server";
import type {
  Client,
  Estimate,
  EstimateKind,
  Invoice,
  InvoiceStatus,
  LineItem,
  MoneyState,
  Payment,
  PaymentMethod,
  Profile,
  RateInputs,
  TimeEntry,
} from "./types";

type Actions = {
  status: "idle" | "loading" | "ready" | "error";
  ownerId: string | null;
  error: string | null;
  load: (ownerId: string) => Promise<void>;
  clear: () => void;
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
  recordPayment: (
    invoiceId: string,
    input: {
      amount: number;
      method: PaymentMethod;
      date?: string;
      note?: string;
    },
  ) => string | null;
  deletePayment: (invoiceId: string, paymentId: string) => void;
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

function snapshot(s: MoneyState): MoneyState {
  return {
    profile: s.profile,
    rate: s.rate,
    clients: s.clients,
    estimates: s.estimates,
    invoices: s.invoices,
    timeEntries: s.timeEntries,
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveSeq = 0;

function persist(get: () => MoneyStore, immediate = false) {
  const flush = () => {
    const s = get();
    if (s.status !== "ready" || !s.ownerId) return;
    const n = ++saveSeq;
    void saveDesk({ data: snapshot(s) }).catch((err: unknown) => {
      if (n !== saveSeq) return;
      const message = err instanceof Error ? err.message : "Could not save";
      useMoney.setState({ error: message });
    });
  };
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    flush();
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush();
  }, 400);
}

function receiptNumbers(invoices: Invoice[]): string[] {
  return invoices.flatMap((inv) => (inv.payments ?? []).map((p) => p.number));
}

function withInvoiceStatus(inv: Invoice): Invoice {
  const total = grandTotal(inv.items, inv.taxPercent);
  const paid = amountPaid(inv.payments);
  if (inv.status === "draft" && paid <= 0) return inv;
  if (total > 0 && paid >= total) return { ...inv, status: "paid" };
  if (paid > 0) return { ...inv, status: "partial" };
  if (inv.status === "paid") return { ...inv, status: "sent" };
  return inv;
}

export const useMoney = create<MoneyStore>()((set, get) => ({
  ...emptyDesk(),
  status: "idle",
  ownerId: null,
  error: null,

  load: async (ownerId) => {
    set({ status: "loading", ownerId, error: null });
    try {
      const state = await loadDesk();
      set({ ...state, status: "ready", ownerId, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load desk";
      if (message === "Unauthorized") {
        set({ ...emptyDesk(), status: "idle", ownerId: null, error: null });
        return;
      }
      set({ status: "error", ownerId, error: message });
    }
  },

  clear: () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    set({ ...emptyDesk(), status: "idle", ownerId: null, error: null });
  },

  setProfile: (patch) => {
    set((s) => ({ profile: { ...s.profile, ...patch } }));
    persist(get, false);
  },

  setRate: (patch) => {
    set((s) => ({ rate: { ...s.rate, ...patch } }));
    persist(get, false);
  },

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
      persist(get, true);
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
    persist(get, true);
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
    persist(get, true);
    return id;
  },

  updateEstimate: (id, patch) => {
    set((s) => ({
      estimates: s.estimates.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    }));
    persist(get, true);
  },

  deleteEstimate: (id) => {
    set((s) => ({ estimates: s.estimates.filter((e) => e.id !== id) }));
    persist(get, true);
  },

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
    const row: Invoice = withInvoiceStatus({
      ...input,
      id,
      number,
      payments: input.payments ?? current?.payments ?? [],
      createdAt: current?.createdAt ?? todayISO(),
    });
    set((s) => ({
      invoices: current
        ? s.invoices.map((e) => (e.id === id ? row : e))
        : [row, ...s.invoices],
    }));
    persist(get, true);
    return id;
  },

  updateInvoice: (id, patch) => {
    set((s) => ({
      invoices: s.invoices.map((e) =>
        e.id === id
          ? withInvoiceStatus({ ...e, ...patch })
          : e,
      ),
    }));
    persist(get, true);
  },

  deleteInvoice: (id) => {
    set((s) => ({ invoices: s.invoices.filter((e) => e.id !== id) }));
    persist(get, true);
  },

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
      withholdTax: false,
      showUsd: est.showUsd,
      usdRate: est.usdRate,
      usdAsOf: est.usdAsOf,
      payments: [],
    });
  },

  recordPayment: (invoiceId, input) => {
    const inv = get().invoices.find((i) => i.id === invoiceId);
    if (!inv) return null;
    const amount = Math.max(0, Math.round(input.amount));
    if (amount <= 0) return null;
    const id = uid();
    const payment: Payment = {
      id,
      number: nextNumber("RCP", receiptNumbers(get().invoices)),
      date: input.date || todayISO(),
      amount,
      method: input.method,
      note: input.note?.trim() || "",
    };
    const payments = [...(inv.payments ?? []), payment];
    get().updateInvoice(invoiceId, { payments });
    return id;
  },

  deletePayment: (invoiceId, paymentId) => {
    const inv = get().invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    get().updateInvoice(invoiceId, {
      payments: (inv.payments ?? []).filter((p) => p.id !== paymentId),
    });
  },

  addTime: (input) => {
    const id = uid();
    const row: TimeEntry = { ...input, id, createdAt: todayISO() };
    set((s) => ({ timeEntries: [row, ...s.timeEntries] }));
    persist(get, true);
    return id;
  },

  updateTime: (id, patch) => {
    set((s) => ({
      timeEntries: s.timeEntries.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    }));
    persist(get, true);
  },

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
    persist(get, true);
  },

  deleteTime: (id) => {
    set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) }));
    persist(get, true);
  },

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
      taxPercent: get().profile.vatRegistered ? 18 : 0,
      payments: [],
    });
  },

  resetDemo: () => {
    const current = get();
    void import("./seed").then(({ deskForAccount }) => {
      const next = deskForAccount({
        name: current.profile.name,
        email: current.profile.email,
      });
      set({ ...next, status: current.status, ownerId: current.ownerId });
      persist(get, true);
    });
  },
}));

export function useRecommendedRate(): number {
  const rate = useMoney((s) => s.rate);
  return computeRates(rate).recommended;
}

export function derivedInvoiceStatus(inv: Invoice): InvoiceStatus {
  const total = grandTotal(inv.items, inv.taxPercent);
  const paid = amountPaid(inv.payments);
  if (inv.status === "draft" && paid <= 0) return "draft";
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0 && paid < total) {
    if (inv.dueDate < todayISO()) return "overdue";
    return "partial";
  }
  if (inv.status === "paid") return "paid";
  if (inv.dueDate < todayISO()) return "overdue";
  return inv.status === "partial" ? "sent" : inv.status;
}

export { emptyItem };
export type { EstimateKind };
