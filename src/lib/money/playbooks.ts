export type SiteType = {
  id: string;
  name: string;
  blurb: string;
  pagesIncluded: number;
  hours: number;
  listPrice: number;
};

export type FeatureToggle = {
  id: string;
  name: string;
  blurb: string;
  hours: number;
  listPrice: number;
  kind?: "add" | "rush";
};

export type StackOption = {
  id: string;
  name: string;
  factor: number;
  clientLabel: string;
};

export type AutoJob = {
  id: string;
  name: string;
  blurb: string;
  hours: number;
  laborList: number;
  parts: { name: string; cost: number }[];
};

export const SITE_TYPES: SiteType[] = [
  {
    id: "landing",
    name: "One-page landing",
    blurb: "A single sharp page for a launch, offer, or event.",
    pagesIncluded: 1,
    hours: 14,
    listPrice: 800_000,
  },
  {
    id: "business",
    name: "Business website",
    blurb: "The Binti kind: story, pages, contact — a real firm online.",
    pagesIncluded: 6,
    hours: 36,
    listPrice: 3_500_000,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    blurb: "Work on display. Built to get you hired or booked.",
    pagesIncluded: 5,
    hours: 24,
    listPrice: 2_200_000,
  },
  {
    id: "shop",
    name: "Online shop",
    blurb: "Catalogue, cart, checkout. Sell without sitting in the store.",
    pagesIncluded: 8,
    hours: 64,
    listPrice: 7_500_000,
  },
  {
    id: "booking",
    name: "Booking site",
    blurb: "Services, calendar, appointments. For salons, clinics, studios.",
    pagesIncluded: 6,
    hours: 48,
    listPrice: 5_000_000,
  },
  {
    id: "membership",
    name: "Membership",
    blurb: "Accounts, gated content, or a client portal.",
    pagesIncluded: 8,
    hours: 72,
    listPrice: 8_500_000,
  },
  {
    id: "custom",
    name: "Custom web app",
    blurb: "Something that does not fit a template. Quote with care.",
    pagesIncluded: 10,
    hours: 96,
    listPrice: 12_000_000,
  },
];

export const SITE_FEATURES: FeatureToggle[] = [
  {
    id: "cms",
    name: "They can edit content",
    blurb: "A simple CMS so they are not calling you for every typo.",
    hours: 8,
    listPrice: 400_000,
  },
  {
    id: "payments",
    name: "Card payments",
    blurb: "Visa / Mastercard checkout.",
    hours: 12,
    listPrice: 800_000,
  },
  {
    id: "momo",
    name: "Mobile money checkout",
    blurb: "MTN / Airtel money — how Kampala actually pays.",
    hours: 6,
    listPrice: 350_000,
  },
  {
    id: "booking",
    name: "Booking / appointments",
    blurb: "Calendar and confirmations.",
    hours: 10,
    listPrice: 700_000,
  },
  {
    id: "blog",
    name: "Blog / news",
    blurb: "A writing space they can keep alive.",
    hours: 8,
    listPrice: 400_000,
  },
  {
    id: "accounts",
    name: "Customer logins",
    blurb: "Sign-in, profiles, private pages.",
    hours: 16,
    listPrice: 1_200_000,
  },
  {
    id: "language",
    name: "Extra language",
    blurb: "A second language for the site itself — not the code you write in.",
    hours: 10,
    listPrice: 600_000,
  },
  {
    id: "copy",
    name: "You write the copy",
    blurb: "Words included, not just layout.",
    hours: 12,
    listPrice: 500_000,
  },
  {
    id: "photos",
    name: "Photo direction",
    blurb: "You guide or source images.",
    hours: 6,
    listPrice: 300_000,
  },
  {
    id: "seo",
    name: "SEO setup",
    blurb: "Titles, sitemap, the boring things Google wants.",
    hours: 6,
    listPrice: 250_000,
  },
  {
    id: "whatsapp",
    name: "WhatsApp button",
    blurb: "Chat that actually gets used.",
    hours: 2,
    listPrice: 80_000,
  },
  {
    id: "rush",
    name: "Rush — under 2 weeks",
    blurb: "Their panic, your premium.",
    hours: 0,
    listPrice: 0,
    kind: "rush",
  },
];

export const STACKS: StackOption[] = [
  {
    id: "wordpress",
    name: "WordPress",
    factor: 0.9,
    clientLabel: "WordPress",
  },
  {
    id: "webflow",
    name: "Webflow",
    factor: 0.85,
    clientLabel: "Webflow",
  },
  {
    id: "custom",
    name: "Custom (React)",
    factor: 1.1,
    clientLabel: "Custom build",
  },
  {
    id: "shopify",
    name: "Shopify",
    factor: 0.95,
    clientLabel: "Shopify",
  },
];

export const AUTO_JOBS: AutoJob[] = [
  {
    id: "diag",
    name: "Full diagnostic",
    blurb: "Scan, test drive, written findings.",
    hours: 1,
    laborList: 50_000,
    parts: [],
  },
  {
    id: "oil",
    name: "Oil & filter",
    blurb: "Service interval job. Fast, honest.",
    hours: 0.8,
    laborList: 40_000,
    parts: [
      { name: "Oil filter", cost: 35_000 },
      { name: "Engine oil 5L", cost: 90_000 },
    ],
  },
  {
    id: "brakes-f",
    name: "Front brake pads",
    blurb: "Pads off, discs checked, torque to spec.",
    hours: 1.5,
    laborList: 120_000,
    parts: [{ name: "Front pad set", cost: 180_000 }],
  },
  {
    id: "brakes-r",
    name: "Rear brake pads",
    blurb: "Same job, the other axle.",
    hours: 1.5,
    laborList: 120_000,
    parts: [{ name: "Rear pad set", cost: 160_000 }],
  },
  {
    id: "battery",
    name: "Battery replacement",
    blurb: "Test the charging system, fit a new battery.",
    hours: 0.5,
    laborList: 40_000,
    parts: [{ name: "Battery", cost: 280_000 }],
  },
  {
    id: "timing",
    name: "Timing belt",
    blurb: "Do not guess this one. Hours assume a typical 4-cyl.",
    hours: 5,
    laborList: 450_000,
    parts: [{ name: "Timing belt kit", cost: 380_000 }],
  },
  {
    id: "shocks",
    name: "Shocks / suspension",
    blurb: "Pair of shocks, inspection of bushes.",
    hours: 3,
    laborList: 250_000,
    parts: [{ name: "Shock pair", cost: 420_000 }],
  },
  {
    id: "ac",
    name: "AC service",
    blurb: "Regas, leak check, cabin filter.",
    hours: 1.2,
    laborList: 80_000,
    parts: [
      { name: "Refrigerant", cost: 70_000 },
      { name: "Cabin filter", cost: 35_000 },
    ],
  },
  {
    id: "tune",
    name: "Engine tune-up",
    blurb: "Plugs, filters, idle, a car that starts like it used to.",
    hours: 2,
    laborList: 150_000,
    parts: [
      { name: "Spark plugs", cost: 80_000 },
      { name: "Air filter", cost: 45_000 },
    ],
  },
  {
    id: "custom",
    name: "Custom repair",
    blurb: "Write what you found. Price the hours and the parts.",
    hours: 2,
    laborList: 160_000,
    parts: [],
  },
];

export const EXTRA_PAGE_HOURS = 3;
export const EXTRA_PAGE_PRICE = 150_000;
export const RUSH_FACTOR = 1.28;

export type WebsiteQuoteInput = {
  typeId: string;
  pages: number;
  featureIds: string[];
  stackId: string;
  hourlyRate: number;
};

export type WebsiteQuoteResult = {
  type: SiteType;
  stack: StackOption;
  hours: number;
  cost: number;
  listPrice: number;
  features: FeatureToggle[];
  extraPages: number;
  rush: boolean;
};

export function quoteWebsite(input: WebsiteQuoteInput): WebsiteQuoteResult {
  const type = SITE_TYPES.find((t) => t.id === input.typeId) ?? SITE_TYPES[1];
  const stack = STACKS.find((s) => s.id === input.stackId) ?? STACKS[2];
  const selected = SITE_FEATURES.filter((f) => input.featureIds.includes(f.id));
  const rush = selected.some((f) => f.kind === "rush");
  const extras = selected.filter((f) => f.kind !== "rush");
  const extraPages = Math.max(0, input.pages - type.pagesIncluded);

  let hours =
    type.hours +
    extras.reduce((s, f) => s + f.hours, 0) +
    extraPages * EXTRA_PAGE_HOURS;
  hours *= stack.factor;
  if (rush) hours *= 1.08;

  let listPrice =
    type.listPrice +
    extras.reduce((s, f) => s + f.listPrice, 0) +
    extraPages * EXTRA_PAGE_PRICE;
  if (rush) listPrice *= RUSH_FACTOR;

  const cost = hours * input.hourlyRate;

  return {
    type,
    stack,
    hours,
    cost,
    listPrice,
    features: extras,
    extraPages,
    rush,
  };
}
