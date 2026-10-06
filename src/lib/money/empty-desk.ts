import type { MoneyState, Profile, RateInputs } from "./types";

export const DEFAULT_RATE: RateInputs = {
  monthlyTakeHome: 8_000_000,
  weeksOff: 4,
  hoursPerWeek: 30,
  utilization: 0.65,
  overheadMonthly: 1_500_000,
  taxRate: 0.3,
  profitMargin: 0.2,
  currentRate: 80_000,
};

export function emptyDesk(hints?: { name?: string; email?: string }): MoneyState {
  const name = hints?.name?.trim() || "";
  const email = hints?.email?.trim() || "";
  const profile: Profile = {
    name,
    company: name,
    email,
    phone: "",
    address: "",
    city: "",
    currency: "UGX",
    paymentTerms: "40% to start, remainder on launch. Estimates valid 14 days.",
    paymentNote: "",
    taxId: "",
    depositPercent: 40,
  };
  return {
    profile,
    rate: { ...DEFAULT_RATE },
    clients: [],
    estimates: [],
    invoices: [],
    timeEntries: [],
  };
}
