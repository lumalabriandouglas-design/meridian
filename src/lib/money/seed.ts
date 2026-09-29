import { addDaysISO } from "@/lib/utils";
import type { MoneyState, Profile, RateInputs } from "./types";
import { ADMIN_EMAIL, SHIPPED_WORK, workLines } from "./works";

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

function seededLines(work: (typeof SHIPPED_WORK)[number], prefix: string) {
  return workLines(work).map((i, n) => ({ ...i, id: `${prefix}-line-${n}` }));
}

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

export function deskForAccount(hints?: { name?: string; email?: string }): MoneyState {
  const email = hints?.email?.trim() || "";
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const seed = createSeed();
    return {
      ...seed,
      profile: {
        ...seed.profile,
        name: hints?.name?.trim() || seed.profile.name,
        email: email || seed.profile.email,
      },
    };
  }
  return emptyDesk(hints);
}

export function createSeed(): MoneyState {
  const binti = SHIPPED_WORK[0];
  const drape = SHIPPED_WORK[1];
  const stock = SHIPPED_WORK[2];
  const hymns = SHIPPED_WORK[3];

  const bintiId = "client-binti";
  const drapeId = "client-drape";
  const stockId = "client-stock";
  const hymnsId = "client-hymns";
  const estBinti = "est-binti";
  const estDrape = "est-drape";
  const invBinti = "inv-binti";
  const invDrape = "inv-drape";
  const invStock = "inv-stock";
  const estHymns = "est-hymns";

  return {
    profile: {
      name: "Lumala Brian",
      company: "Lumala Brian",
      email: ADMIN_EMAIL,
      phone: "",
      address: "",
      city: "Kampala, Uganda",
      currency: "UGX",
      paymentTerms: "40% to start, remainder on launch. Estimates valid 14 days.",
      paymentNote: "",
      taxId: "",
      depositPercent: 40,
    },
    rate: { ...DEFAULT_RATE },
    clients: [
      {
        id: bintiId,
        name: "Binti Designs",
        company: "BINTI DESIGNS",
        email: "bintidesigns442@gmail.com",
        phone: "+256 740 711 344",
        notes: "Kampala atelier. Live: binti-designs.vercel.app",
        createdAt: addDaysISO(-48),
      },
      {
        id: drapeId,
        name: "Drapé Collective",
        company: "Drapé Collective",
        email: "",
        phone: "",
        notes: "Kampala atelier marketplace. Live: odrapecollective.com",
        createdAt: addDaysISO(-80),
      },
      {
        id: stockId,
        name: "Shop floor",
        company: "Cloud Stock Manager",
        email: "",
        phone: "",
        notes: "Inventory, sell, reports, team — the shop app.",
        createdAt: addDaysISO(-30),
      },
      {
        id: hymnsId,
        name: "Anglican hymnal",
        company: "Anglican Hymn Sync",
        email: "",
        phone: "",
        notes: "Luganda + English. Live: anglicanhymn-sync.vercel.app",
        createdAt: addDaysISO(-20),
      },
    ],
    estimates: [
      {
        id: estBinti,
        number: "EST-0108",
        kind: "website",
        clientId: bintiId,
        clientName: "Binti Designs",
        clientCompany: "BINTI DESIGNS",
        clientEmail: "bintidesigns442@gmail.com",
        issueDate: addDaysISO(-40),
        validUntil: addDaysISO(-26),
        status: "accepted",
        items: seededLines(binti, "est-binti"),
        notes:
          "Site like the one we shipped: story, looks, WhatsApp. Public floor stays quiet. 40% to start.",
        taxPercent: 0,
        depositPercent: 40,
        stackLabel: "",
        showStack: false,
        hours: 48,
        createdAt: addDaysISO(-40),
      },
      {
        id: estDrape,
        number: "EST-0102",
        kind: "website",
        clientId: drapeId,
        clientName: "Drapé Collective",
        clientCompany: "Drapé Collective",
        clientEmail: "",
        issueDate: addDaysISO(-70),
        validUntil: addDaysISO(-56),
        status: "accepted",
        items: seededLines(drape, "est-drape"),
        notes:
          "Marketplace for Kampala ateliers. Catalogue, showrooms, a bag. Remainder on launch.",
        taxPercent: 0,
        depositPercent: 40,
        stackLabel: "",
        showStack: false,
        hours: 96,
        createdAt: addDaysISO(-70),
      },
      {
        id: estHymns,
        number: "EST-0114",
        kind: "custom",
        clientId: hymnsId,
        clientName: "Anglican hymnal",
        clientCompany: "Anglican Hymn Sync",
        clientEmail: "",
        issueDate: addDaysISO(-12),
        validUntil: addDaysISO(2),
        status: "sent",
        items: seededLines(hymns, "est-hymns"),
        notes:
          "Luganda and English from one codebase. Audio and setlists. Extra language is the hymnal itself.",
        taxPercent: 0,
        depositPercent: 40,
        stackLabel: "",
        showStack: false,
        hours: 70,
        createdAt: addDaysISO(-12),
      },
    ],
    invoices: [
      {
        id: invBinti,
        number: "INV-0041",
        estimateId: estBinti,
        clientId: bintiId,
        clientName: "Binti Designs",
        clientCompany: "BINTI DESIGNS",
        clientEmail: "bintidesigns442@gmail.com",
        issueDate: addDaysISO(-30),
        dueDate: addDaysISO(-16),
        status: "paid",
        items: seededLines(binti, "inv-binti"),
        notes: "Live at binti-designs.vercel.app. Thank you.",
        taxPercent: 0,
        payments: [
          {
            id: "pay-binti-1",
            number: "RCP-0101",
            date: addDaysISO(-30),
            amount: 2_060_000,
            method: "momo",
            note: "40% to start.",
          },
          {
            id: "pay-binti-2",
            number: "RCP-0102",
            date: addDaysISO(-16),
            amount: 3_090_000,
            method: "bank",
            note: "Remainder on launch.",
          },
        ],
        createdAt: addDaysISO(-30),
      },
      {
        id: invDrape,
        number: "INV-0038",
        estimateId: estDrape,
        clientId: drapeId,
        clientName: "Drapé Collective",
        clientCompany: "Drapé Collective",
        clientEmail: "",
        issueDate: addDaysISO(-55),
        dueDate: addDaysISO(-41),
        status: "paid",
        items: seededLines(drape, "inv-drape"),
        notes: "Live at odrapecollective.com.",
        taxPercent: 0,
        payments: [
          {
            id: "pay-drape-1",
            number: "RCP-0094",
            date: addDaysISO(-55),
            amount: 4_800_000,
            method: "momo",
            note: "40% to start.",
          },
          {
            id: "pay-drape-2",
            number: "RCP-0095",
            date: addDaysISO(-41),
            amount: 7_200_000,
            method: "bank",
            note: "Remainder on launch.",
          },
        ],
        createdAt: addDaysISO(-55),
      },
      {
        id: invStock,
        number: "INV-0044",
        estimateId: null,
        clientId: stockId,
        clientName: "Shop floor",
        clientCompany: "Cloud Stock Manager",
        clientEmail: "",
        issueDate: addDaysISO(-9),
        dueDate: addDaysISO(5),
        status: "partial",
        items: seededLines(stock, "inv-stock"),
        notes: "Phase one on the floor. Deposit in. Remainder when reports ship.",
        taxPercent: 0,
        payments: [
          {
            id: "pay-stock-1",
            number: "RCP-0103",
            date: addDaysISO(-9),
            amount: 3_800_000,
            method: "momo",
            note: "40% deposit.",
          },
        ],
        createdAt: addDaysISO(-9),
      },
    ],
    timeEntries: [
      {
        id: "time-hymns-1",
        clientName: "Anglican Hymn Sync",
        project: "Now-playing deck",
        seconds: 3 * 3600 + 24 * 60,
        runningSince: null,
        rate: 80_000,
        createdAt: addDaysISO(-1),
      },
    ],
  };
}
