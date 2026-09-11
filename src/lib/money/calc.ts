import type { Invoice, LineItem, Payment, RateInputs } from "./types";

export type RateResult = {
  billableWeeks: number;
  billableHours: number;
  annualTakeHome: number;
  annualOverhead: number;
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

export function computeRates(input: RateInputs): RateResult {
  const billableWeeks = Math.max(1, 52 - input.weeksOff);
  const utilization = clamp(input.utilization, 0.2, 1);
  const billableHours = Math.max(
    1,
    billableWeeks * input.hoursPerWeek * utilization,
  );
  const annualTakeHome = input.monthlyTakeHome * 12;
  const annualOverhead = input.overheadMonthly * 12;
  const tax = clamp(input.taxRate, 0, 0.6);
  const grossNeeded = (annualTakeHome + annualOverhead) / Math.max(0.2, 1 - tax);
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

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
