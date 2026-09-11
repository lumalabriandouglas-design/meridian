import type { Currency } from "./types";

const ZERO_DECIMAL: Record<string, true> = {
  UGX: true,
  KES: true,
  RWF: true,
};

export function moneyDecimals(currency: Currency): number {
  return ZERO_DECIMAL[currency] ? 0 : 2;
}

export function roundMoney(amount: number, currency: Currency): number {
  const d = moneyDecimals(currency);
  const f = 10 ** d;
  return Math.round((amount + Number.EPSILON) * f) / f;
}

export function roundUgxNice(amount: number, step = 10_000): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount / step) * step;
}

export function formatMoney(amount: number, currency: Currency = "UGX"): string {
  const n = roundMoney(amount, currency);
  const digits = moneyDecimals(currency);
  const grouped = n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${currency} ${grouped}`;
}

export function formatCompact(amount: number, currency: Currency = "UGX"): string {
  const abs = Math.abs(amount);
  if (currency === "UGX" || currency === "KES") {
    if (abs >= 1_000_000) {
      const m = amount / 1_000_000;
      const text = m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "");
      return `${currency} ${text}M`;
    }
    if (abs >= 1_000) {
      return `${currency} ${Math.round(amount / 1_000)}k`;
    }
  }
  return formatMoney(amount, currency);
}

export function formatHours(hours: number): string {
  const n = Math.round(hours * 10) / 10;
  return n === 1 ? "1 hr" : `${n} hrs`;
}

export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function nextNumber(prefix: string, existing: string[]): string {
  let max = 100;
  for (const value of existing) {
    const match = value.match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "momo":
      return "Mobile money";
    case "bank":
      return "Bank transfer";
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    default:
      return "Other";
  }
}
