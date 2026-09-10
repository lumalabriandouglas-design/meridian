export const CURRENCIES = ["UGX", "KES", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type EstimateKind = "website" | "auto" | "custom";

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
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
};

export type RateInputs = {
  monthlyTakeHome: number;
  weeksOff: number;
  hoursPerWeek: number;
  utilization: number;
  overheadMonthly: number;
  taxRate: number;
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
