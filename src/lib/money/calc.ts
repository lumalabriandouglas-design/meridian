import type { Invoice, LineItem, Payment, RateInputs } from "./types";

export type RateResult = {
  billableWeeks: number;
  billableHours: number;
  annualTakeHome: number;
  annualOverhead: number;
  preTaxIncome: number;
  annualTax: number;
  effectiveTax: number;
  grossNeeded: number;
  withProfit: number;
  floor: number;
  recommended: number;
  premium: number;
  currentAnnual: number;
  gapAnnual: number;
  hoursIfCurrent: number;
  multiplier: number;
};

/** Uganda resident PAYE, year of income 2026/27 (from 1 July 2026). Guidance only. */
export function ugandaAnnualTax(gross: number): number {
  const income = Math.max(0, gross);
  let tax = 0;
  if (income <= 4_020_000) tax = 0;
  else if (income <= 4_920_000) tax = (income - 4_020_000) * 0.2;
  else if (income <= 5_820_000) tax = 180_000 + (income - 4_920_000) * 0.25;
  else tax = 405_000 + (income - 5_820_000) * 0.3;
  if (income > 120_000_000) tax += (income - 120_000_000) * 0.1;
  return tax;
}

/** Gross income whose tax leaves exactly `takeHome` in the pocket. */
export function grossFromTakeHome(takeHome: number): number {
  const target = Math.max(0, takeHome);
  if (target === 0) return 0;
  let lo = target;
  let hi = target / 0.55 + 4_020_000;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    const net = mid - ugandaAnnualTax(mid);
    if (net < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function computeRates(input: RateInputs): RateResult {
  const billableWeeks = Math.max(1, 52 - input.weeksOff);
  const utilization = clamp(input.utilization, 0.2, 1);
  const billableHours = Math.max(
    1,
    billableWeeks * input.hoursPerWeek * utilization,
  );
  const annualTakeHome = input.monthlyTakeHome * 12;
  const annualOverhead = input.overheadMonthly * 12;
  const manual = Boolean(input.taxManual);
  const manualRate = clamp(input.taxRate, 0, 0.6);
  const preTaxIncome = manual
    ? annualTakeHome / Math.max(0.05, 1 - manualRate)
    : grossFromTakeHome(annualTakeHome);
  const annualTax = manual
    ? preTaxIncome * manualRate
    : ugandaAnnualTax(preTaxIncome);
  const effectiveTax = preTaxIncome > 0 ? annualTax / preTaxIncome : 0;
  // Overhead is deductible. Do not gross it up with the income tax.
  const grossNeeded = preTaxIncome + annualOverhead;
  const withProfit = grossNeeded * (1 + Math.max(0, input.profitMargin));
  const floor = grossNeeded / billableHours;
  const recommended = withProfit / billableHours;
  const premium = recommended * 1.25;
  const current = Math.max(0, input.currentRate);
  const currentAnnual = current * billableHours;
  const gapAnnual = withProfit - currentAnnual;
  const hoursIfCurrent = current > 0 ? withProfit / current : Infinity;
  const multiplier = current > 0 ? hoursIfCurrent / billableHours : Infinity;

  return {
    billableWeeks,
    billableHours,
    annualTakeHome,
    annualOverhead,
    preTaxIncome,
    annualTax,
    effectiveTax,
    grossNeeded,
    withProfit,
    floor,
    recommended,
    premium,
    currentAnnual,
    gapAnnual,
    hoursIfCurrent,
    multiplier,
  };
}

export function lineTotal(item: LineItem): number {
  return item.quantity * item.rate;
}

export function itemsSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function taxAmount(subtotal: number, taxPercent: number): number {
  return subtotal * (Math.max(0, taxPercent) / 100);
}

export function grandTotal(items: LineItem[], taxPercent: number): number {
  const sub = itemsSubtotal(items);
  return sub + taxAmount(sub, taxPercent);
}

export function depositDue(
  total: number,
  depositPercent: number,
): number {
  return total * (Math.max(0, depositPercent) / 100);
}

export function amountPaid(payments: Payment[] | undefined): number {
  if (!payments?.length) return 0;
  return payments.reduce((sum, p) => sum + Math.max(0, p.amount), 0);
}

export function invoiceTotal(inv: Pick<Invoice, "items" | "taxPercent">): number {
  return grandTotal(inv.items, inv.taxPercent);
}

export function invoiceBalance(inv: Pick<Invoice, "items" | "taxPercent" | "payments">): number {
  return Math.max(0, invoiceTotal(inv) - amountPaid(inv.payments));
}

export const WHT_RATE = 0.06;
export const VAT_PERCENT = 18;
export const MOMO_TX_MAX = 5_000_000;

export function withholdingAmount(subtotal: number, enabled: boolean | undefined): number {
  if (!enabled) return 0;
  return Math.round(Math.max(0, subtotal) * WHT_RATE);
}

export function netPayable(total: number, withheld: number): number {
  return Math.max(0, total - withheld);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
