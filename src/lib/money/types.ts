export const CURRENCIES = ["UGX", "KES", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type EstimateKind = "website" | "auto" | "custom";

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined";
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue";

export const PAYMENT_METHODS = [
  { id: "momo", label: "Mobile money" },
  { id: "bank", label: "Bank transfer" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "wht", label: "WHT certificate" },
  { id: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export type Payment = {
  id: string;
  number: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
};

export type Profile = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  currency: Currency;
  paymentTerms: string;
  paymentNote: string;
  taxId: string;
  depositPercent: number;
  /** Off unless the studio is VAT-registered. */
  vatRegistered: boolean;
  mtnNumber: string;
  mtnName: string;
  airtelNumber: string;
  airtelName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankSwift: string;
};

export type RateInputs = {
  monthlyTakeHome: number;
  weeksOff: number;
  hoursPerWeek: number;
  utilization: number;
  overheadMonthly: number;
  /** Used only when taxManual is on. Otherwise URA bands decide the rate. */
  taxRate: number;
  taxManual: boolean;
  profitMargin: number;
  currentRate: number;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
};

export type Estimate = {
  id: string;
  number: string;
  kind: EstimateKind;
  clientId: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  validUntil: string;
  status: EstimateStatus;
  items: LineItem[];
  notes: string;
  taxPercent: number;
  depositPercent: number;
  stackLabel: string;
  showStack: boolean;
  hours: number;
  showUsd?: boolean;
  usdRate?: number;
  usdAsOf?: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  number: string;
  estimateId: string | null;
  clientId: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: LineItem[];
  notes: string;
  taxPercent: number;
  /** Client remits 6% withholding tax and should send a certificate. */
  withholdTax?: boolean;
  showUsd?: boolean;
  usdRate?: number;
  usdAsOf?: string;
  payments: Payment[];
  createdAt: string;
};

export type TimeEntry = {
  id: string;
  clientName: string;
  project: string;
  seconds: number;
  runningSince: string | null;
  rate: number;
  createdAt: string;
};

export type MoneyState = {
  profile: Profile;
  rate: RateInputs;
  clients: Client[];
  estimates: Estimate[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
};

export type ClientDraft = {
  clientId: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
};
