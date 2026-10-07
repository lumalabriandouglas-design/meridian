import type { Currency, Profile } from "./types";

export const USD_RATE_PLACEHOLDER = 4025;
export const USD_AS_OF_PLACEHOLDER = "5 Oct 2026";
export const USD_RATE_HINT = "BoU mid 5 Oct 2026, edit before sending";

export function formatUsdLine(ugx: number, rate: number, asOf: string): string {
  const perDollar = rate > 0 ? rate : USD_RATE_PLACEHOLDER;
  const dollars = ugx / perDollar;
  const usd = dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const fx = perDollar.toLocaleString("en-US");
  const when = asOf.trim() || USD_AS_OF_PLACEHOLDER;
  return `≈ USD ${usd} at ${fx} UGX/USD on ${when}`;
}

export function paymentLines(profile: Profile): string[] {
  const lines: string[] = [];
  if (profile.mtnNumber?.trim()) {
    lines.push(
      `MTN MoMo ${profile.mtnNumber.trim()}${profile.mtnName?.trim() ? ` · ${profile.mtnName.trim()}` : ""}`,
    );
  }
  if (profile.airtelNumber?.trim()) {
    lines.push(
      `Airtel Money ${profile.airtelNumber.trim()}${profile.airtelName?.trim() ? ` · ${profile.airtelName.trim()}` : ""}`,
    );
  }
  const bank = [
    profile.bankName?.trim(),
    profile.bankAccountName?.trim(),
    profile.bankAccountNumber?.trim(),
    profile.bankBranch?.trim() ? `Branch ${profile.bankBranch.trim()}` : "",
    profile.bankSwift?.trim() ? `SWIFT ${profile.bankSwift.trim()}` : "",
  ].filter(Boolean);
  if (bank.length) lines.push(bank.join(" · "));
  if (!lines.length && profile.paymentNote?.trim()) lines.push(profile.paymentNote.trim());
  return lines;
}

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
    case "wht":
      return "WHT certificate";
    default:
      return "Other";
  }
}
