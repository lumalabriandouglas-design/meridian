import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { grandTotal } from "./calc";
import { deskForAccount, emptyDesk } from "./seed";
import type { Invoice, MoneyState, Payment, PaymentMethod } from "./types";

function asPayment(raw: unknown): Payment | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<Payment>;
  const amount = Number(p.amount);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const method: PaymentMethod =
    p.method === "bank" ||
    p.method === "cash" ||
    p.method === "card" ||
    p.method === "other"
      ? p.method
      : "momo";
  return {
    id: typeof p.id === "string" ? p.id : `pay-${amount}`,
    number: typeof p.number === "string" ? p.number : "RCP-0000",
    date: typeof p.date === "string" ? p.date : "",
    amount,
    method,
    note: typeof p.note === "string" ? p.note : "",
  };
}

function normalizeInvoice(raw: unknown): Invoice | null {
  if (!raw || typeof raw !== "object") return null;
  const inv = raw as Invoice;
  if (!inv.id || !Array.isArray(inv.items)) return null;
  let payments = Array.isArray(inv.payments)
    ? inv.payments.map(asPayment).filter((p): p is Payment => Boolean(p))
    : [];
  if (payments.length === 0 && inv.status === "paid") {
    const total = grandTotal(inv.items, inv.taxPercent || 0);
    if (total > 0) {
      payments = [
        {
          id: `legacy-${inv.id}`,
          number: String(inv.number || "INV").replace("INV", "RCP"),
          date: inv.issueDate || "",
          amount: total,
          method: "momo",
          note: "Recorded as paid in full",
        },
      ];
    }
  }
  return { ...inv, payments };
}

function parseState(raw: unknown): MoneyState {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const base = emptyDesk();
  if (!parsed || typeof parsed !== "object") return base;
  const p = parsed as Partial<MoneyState>;
  const invoices = Array.isArray(p.invoices)
    ? p.invoices.map(normalizeInvoice).filter((i): i is Invoice => Boolean(i))
    : [];
  return {
    profile: { ...base.profile, ...p.profile },
    rate: { ...base.rate, ...p.rate },
    clients: Array.isArray(p.clients) ? p.clients : [],
    estimates: Array.isArray(p.estimates) ? p.estimates : [],
    invoices,
    timeEntries: Array.isArray(p.timeEntries) ? p.timeEntries : [],
  };
}

function asState(data: MoneyState): MoneyState {
  if (!data?.profile || !data?.rate) throw new Error("Invalid desk");
  if (
    !Array.isArray(data.clients) ||
    !Array.isArray(data.estimates) ||
    !Array.isArray(data.invoices) ||
    !Array.isArray(data.timeEntries)
  ) {
    throw new Error("Invalid desk");
  }
  return parseState(data);
}

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ state: unknown }>`
      select state from desks where user_id = ${context.userId}
    `;
    if (rows[0]) return parseState(rows[0].state);

    const users = await sql<{ name: string; email: string }>`
      select name, email from "user" where id = ${context.userId}
    `;
    const state = deskForAccount({
      name: users[0]?.name,
      email: users[0]?.email,
    });
    await sql`
      insert into desks (user_id, state)
      values (${context.userId}, ${JSON.stringify(state)}::jsonb)
    `;
    return state;
  });

export const saveDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(asState)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into desks (user_id, state, updated_at)
      values (${context.userId}, ${JSON.stringify(data)}::jsonb, now())
      on conflict (user_id) do update
        set state = excluded.state, updated_at = now()
    `;
    return { ok: true as const };
  });
