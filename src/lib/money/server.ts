import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { emptyDesk } from "./seed";
import type { MoneyState } from "./types";

function parseState(raw: unknown): MoneyState {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const base = emptyDesk();
  if (!parsed || typeof parsed !== "object") return base;
  const p = parsed as Partial<MoneyState>;
  return {
    profile: { ...base.profile, ...p.profile },
    rate: { ...base.rate, ...p.rate },
    clients: Array.isArray(p.clients) ? p.clients : [],
    estimates: Array.isArray(p.estimates) ? p.estimates : [],
    invoices: Array.isArray(p.invoices) ? p.invoices : [],
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
    const state = emptyDesk({
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
