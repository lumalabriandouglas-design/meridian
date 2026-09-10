import { addDaysISO, todayISO, uid } from "@/lib/utils";
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
  const profile: Profile = {
    name: hints?.name?.trim() || "",
    company: "",
    email: hints?.email?.trim() || "",
    phone: "",
    address: "",
    city: "Kampala, Uganda",
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

export function createSeed(): MoneyState {
  const bintiId = uid();
  const palomaId = uid();
  const kisaasiId = uid();
  const estBinti = uid();
  const invBinti = uid();
  const invPaloma = uid();
  const invKisaasi = uid();
  const estAuto = uid();
  const estOpen = uid();

  return {
    profile: {
      name: "Apio N.",
      company: "Apio Studio",
      email: "hello@apiostudio.ug",
      phone: "+256 700 418 220",
      address: "Plot 14, Kira Road",
      city: "Kampala, Uganda",
      currency: "UGX",
      paymentTerms: "40% to start, remainder on launch. Estimates valid 14 days.",
      paymentNote:
        "MTN MoMo 0700 418 220 (Apio N.) · Stanbic Bank Uganda, Apio Studio, 9030012345678",
      taxId: "",
      depositPercent: 40,
    },
    rate: { ...DEFAULT_RATE },
    clients: [
      {
        id: bintiId,
        name: "Binti Nakato",
        company: "Binti",
        email: "studio@binti.ug",
        phone: "+256 772 110 440",
        notes: "Beauty & booking. The site everyone asks for a copy of.",
        createdAt: addDaysISO(-48),
      },
      {
        id: palomaId,
        name: "Sam Okello",
        company: "Paloma Coffee",
        email: "sam@paloma.coffee",
        phone: "+256 701 882 119",
        notes: "Kololo café. Wants a shop next.",
        createdAt: addDaysISO(-20),
      },
      {
        id: kisaasiId,
        name: "Musa Kintu",
        company: "Kisaasi Motors",
        email: "musa@kisaasimotors.ug",
        phone: "+256 759 300 012",
        notes: "Independent garage. Website + they may use estimates in the bay.",
        createdAt: addDaysISO(-12),
      },
    ],
    estimates: [
      {
        id: estBinti,
        number: "EST-0108",
        kind: "website",
        clientId: bintiId,
        clientName: "Binti Nakato",
        clientCompany: "Binti",
        clientEmail: "studio@binti.ug",
        issueDate: addDaysISO(-40),
        validUntil: addDaysISO(-26),
        status: "accepted",
        items: [
          {
            id: uid(),
            description: "Business website — 6 pages, booking, blog",
            quantity: 1,
            rate: 4_800_000,
          },
          {
            id: uid(),
            description: "Mobile money checkout",
            quantity: 1,
            rate: 350_000,
          },
        ],
        notes:
          "Site like the one we shipped: story, services, booking, blog. Copy and photo direction included. 40% to start.",
        taxPercent: 0,
        depositPercent: 40,
        stackLabel: "Custom build",
        showStack: false,
        hours: 48,
        createdAt: addDaysISO(-40),
      },
      {
        id: estOpen,
        number: "EST-0112",
        kind: "website",
        clientId: palomaId,
        clientName: "Sam Okello",
        clientCompany: "Paloma Coffee",
        clientEmail: "sam@paloma.coffee",
        issueDate: addDaysISO(-4),
        validUntil: addDaysISO(10),
        status: "sent",
        items: [
          {
            id: uid(),
            description: "Online shop — catalogue, cart, checkout",
            quantity: 1,
            rate: 7_500_000,
          },
          {
            id: uid(),
            description: "Mobile money + card payments",
            quantity: 1,
            rate: 1_150_000,
          },
        ],
        notes:
          "Shop for beans and drip kits. They keep editing products. Estimate valid 14 days.",
        taxPercent: 0,
        depositPercent: 40,
        stackLabel: "Shopify",
        showStack: true,
        hours: 70,
        createdAt: addDaysISO(-4),
      },
      {
        id: estAuto,
        number: "EST-0113",
        kind: "auto",
        clientId: kisaasiId,
        clientName: "Grace Atim",
        clientCompany: "Toyota Premio 2016",
        clientEmail: "grace@mail.com",
        issueDate: todayISO(),
        validUntil: addDaysISO(7),
        status: "draft",
        items: [
          {
            id: uid(),
            description: "Front brake pads — labour",
            quantity: 1,
            rate: 120_000,
          },
          {
            id: uid(),
            description: "Front pad set",
            quantity: 1,
            rate: 180_000,
          },
          {
            id: uid(),
            description: "Disc skim (pair)",
            quantity: 1,
            rate: 80_000,
          },
        ],
        notes:
          "Pads are done. Discs have a lip — skim recommended. Parts are genuine-spec, not the cheapest in Kisekka.",
        taxPercent: 0,
        depositPercent: 0,
        stackLabel: "",
        showStack: false,
        hours: 2,
        createdAt: todayISO(),
      },
    ],
    invoices: [
      {
        id: invBinti,
        number: "INV-0041",
        estimateId: estBinti,
        clientId: bintiId,
        clientName: "Binti Nakato",
        clientCompany: "Binti",
        clientEmail: "studio@binti.ug",
        issueDate: addDaysISO(-30),
        dueDate: addDaysISO(-16),
        status: "paid",
        items: [
          {
            id: uid(),
            description: "Business website — 6 pages, booking, blog",
            quantity: 1,
            rate: 4_800_000,
          },
          {
            id: uid(),
            description: "Mobile money checkout",
            quantity: 1,
            rate: 350_000,
          },
        ],
        notes: "Thank you for trusting us with Binti. Final balance on launch.",
        taxPercent: 0,
        createdAt: addDaysISO(-30),
      },
      {
        id: invPaloma,
        number: "INV-0044",
        estimateId: null,
        clientId: palomaId,
        clientName: "Sam Okello",
        clientCompany: "Paloma Coffee",
        clientEmail: "sam@paloma.coffee",
        issueDate: addDaysISO(-9),
        dueDate: addDaysISO(5),
        status: "sent",
        items: [
          {
            id: uid(),
            description: "Brochure site — 5 pages + WhatsApp",
            quantity: 1,
            rate: 2_400_000,
          },
        ],
        notes: "Phase one. Shop is a separate estimate.",
        taxPercent: 0,
        createdAt: addDaysISO(-9),
      },
      {
        id: invKisaasi,
        number: "INV-0043",
        estimateId: null,
        clientId: kisaasiId,
        clientName: "Musa Kintu",
        clientCompany: "Kisaasi Motors",
        clientEmail: "musa@kisaasimotors.ug",
        issueDate: addDaysISO(-21),
        dueDate: addDaysISO(-7),
        status: "overdue",
        items: [
          {
            id: uid(),
            description: "Garage website — services, location, WhatsApp booking",
            quantity: 1,
            rate: 3_200_000,
          },
        ],
        notes: "Balance due. Site is live.",
        taxPercent: 0,
        createdAt: addDaysISO(-21),
      },
    ],
    timeEntries: [
      {
        id: uid(),
        clientName: "Paloma Coffee",
        project: "Shop product templates",
        seconds: 3 * 3600 + 24 * 60,
        runningSince: null,
        rate: 80_000,
        createdAt: addDaysISO(-1),
      },
    ],
  };
}
