import type { LineItem } from "./types";
import { ADMIN_EMAIL } from "./admin";

export { ADMIN_EMAIL };

export type ShippedWork = {
  id: string;
  name: string;
  client: string;
  kind: "website" | "shop" | "app";
  blurb: string;
  does: string[];
  price: number;
  href?: string;
  year: string;
  image: string;
  quoteTo: "/estimate/website" | "/estimate/custom";
  siteTypeId?: string;
  featureIds?: string[];
};

export const SHIPPED_WORK: ShippedWork[] = [
  {
    id: "binti",
    name: "BINTI DESIGNS",
    client: "Binti Designs",
    kind: "website",
    blurb:
      "Luxury editorial showroom for a Kampala atelier — story, looks, a quiet public floor.",
    does: [
      "Editorial showroom — story, looks, contact",
      "WhatsApp so a client can ask for a look",
      "Private atelier floor (not linked on the public site)",
    ],
    price: 5_150_000,
    href: "https://binti-designs.vercel.app",
    year: "2026",
    image: "/work/binti.jpg",
    quoteTo: "/estimate/website",
    siteTypeId: "business",
    featureIds: ["cms", "copy", "photos"],
  },
  {
    id: "drape",
    name: "Drapé Collective",
    client: "Drapé Collective",
    kind: "shop",
    blurb:
      "Premium marketplace for Kampala ateliers — catalogue, designer showrooms, shop.",
    does: [
      "Marketplace — ateliers, pieces, journal",
      "Designer showrooms they can keep current",
      "Collector accounts and a bag",
    ],
    price: 12_000_000,
    href: "https://odrapecollective.com",
    year: "2026",
    image: "/work/drape.jpg",
    quoteTo: "/estimate/website",
    siteTypeId: "shop",
    featureIds: ["accounts", "payments", "momo", "cms"],
  },
  {
    id: "stock",
    name: "Cloud Stock Manager",
    client: "Shop floor",
    kind: "app",
    blurb:
      "A shop that can sell: inventory, today’s numbers, team, billing, import.",
    does: [
      "Inventory and sell on the floor",
      "Today + last 7 days",
      "Team invites and reports",
    ],
    price: 9_500_000,
    year: "2026",
    image: "/work/stock.jpg",
    quoteTo: "/estimate/custom",
  },
  {
    id: "hymns",
    name: "Anglican Hymn Sync",
    client: "Anglican hymnal",
    kind: "app",
    blurb:
      "Luganda and English hymns on web and phone — search, setlists, audio.",
    does: [
      "Hymnal in Luganda and English",
      "Search, favourites, service setlists",
      "Audio player with a persistent mini deck",
    ],
    price: 6_800_000,
    href: "https://anglicanhymn-sync.vercel.app",
    year: "2026",
    image: "/work/hymns.jpg",
    quoteTo: "/estimate/custom",
  },
];

export function workById(id: string | undefined): ShippedWork | undefined {
  if (!id) return undefined;
  return SHIPPED_WORK.find((w) => w.id === id);
}

export function workLines(work: ShippedWork): Omit<LineItem, "id">[] {
  const head = work.does[0] ?? work.blurb;
  const extras = work.does.slice(1);
  if (!extras.length) {
    return [{ description: `${work.name} — ${head}`, quantity: 1, rate: work.price }];
  }
  const base = Math.round(work.price * 0.72);
  const rest = work.price - base;
  const each = Math.round(rest / extras.length);
  const lines: Omit<LineItem, "id">[] = [
    { description: `${work.name} — ${head}`, quantity: 1, rate: base },
    ...extras.map((d, i) => ({
      description: d,
      quantity: 1,
      rate: i === extras.length - 1 ? rest - each * (extras.length - 1) : each,
    })),
  ];
  return lines;
}
