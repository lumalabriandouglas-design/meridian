import type { MoneyState, Profile, RateInputs } from "./types";

export const DEFAULT_TERMS =
  "50% to start, balance before launch. Estimate valid 14 days. Prices in UGX.";

export const DEFAULT_RATE: RateInputs = {
  monthlyTakeHome: 4_000_000,
  weeksOff: 6,
  hoursPerWeek: 40,
  utilization: 0.6,
  overheadMonthly: 1_000_000,
  taxRate: 0.28,
  taxManual: false,
  profitMargin: 0.15,
  currentRate: 80_000,
};

export const RATE_PRESETS = [
  { id: "junior", label: "Junior", monthlyTakeHome: 2_000_000, overheadMonthly: 700_000 },
  { id: "mid", label: "Mid", monthlyTakeHome: 4_000_000, overheadMonthly: 1_000_000 },
  { id: "senior", label: "Senior", monthlyTakeHome: 7_000_000, overheadMonthly: 1_300_000 },
] as const;

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
    paymentTerms: DEFAULT_TERMS,
    paymentNote: "",
    taxId: "",
    depositPercent: 50,
    vatRegistered: false,
    mtnNumber: "",
    mtnName: "",
    airtelNumber: "",
    airtelName: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankBranch: "",
    bankSwift: "",
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
