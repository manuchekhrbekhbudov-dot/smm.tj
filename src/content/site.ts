/**
 * Structured (non-text) site data. All human-readable text lives in messages/*.json.
 * Contact values are placeholders — replace with the agency's real ones.
 */
export const contacts = {
  phone: "+992 900 00 00 00",
  phoneHref: "tel:+992900000000",
  email: "hello@smm.tj",
  telegram: "https://t.me/smmtj",
  whatsapp: "https://wa.me/992900000000",
  instagram: "https://instagram.com/smm.tj",
  tiktok: "https://tiktok.com/@smm.tj",
  // Dushanbe, Rudaki Ave — OpenStreetMap embed
  mapEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=68.7600%2C38.5550%2C68.7980%2C38.5830&layer=mapnik&marker=38.5690%2C68.7790",
  mapLink: "https://www.openstreetmap.org/?mlat=38.5690&mlon=68.7790#map=16/38.5690/68.7790",
};

export const serviceSlugs = ["smm", "reels", "design", "ads", "branding", "production"] as const;
export type ServiceSlug = (typeof serviceSlugs)[number];

/** Starting price per service, TJS / month (or per project). */
export const servicePrice: Record<ServiceSlug, number> = {
  smm: 1900,
  reels: 1500,
  design: 900,
  ads: 1200,
  branding: 4500,
  production: 800,
};

export const packageSlugs = ["start", "business", "premium"] as const;
export type PackageSlug = (typeof packageSlugs)[number];
export const packagePrice: Record<PackageSlug, number> = { start: 1900, business: 3900, premium: 7900 };
export const featuredPackage: PackageSlug = "business";
export const QUARTER_DISCOUNT = 0.1;

export const caseSlugs = ["nur-beauty", "sarvar-mebel", "lola-cafe", "dushanbe-fitness"] as const;
export type CaseSlug = (typeof caseSlugs)[number];

type Metric = { before: number; after: number; unit?: "%" };
export const cases: Record<
  CaseSlug,
  { client: string; hue: [string, string]; services: ServiceSlug[]; metrics: Record<"followers" | "reach" | "engagement" | "leads", Metric> }
> = {
  "nur-beauty": {
    client: "Nur Beauty",
    hue: ["#C026D3", "#F472B6"],
    services: ["smm", "reels", "ads"],
    metrics: { followers: { before: 3100, after: 18400 }, reach: { before: 12000, after: 240000 }, engagement: { before: 1.2, after: 6.8, unit: "%" }, leads: { before: 40, after: 96 } },
  },
  "sarvar-mebel": {
    client: "Sarvar Mebel",
    hue: ["#8B5CF6", "#38BDF8"],
    services: ["reels", "production", "ads"],
    metrics: { followers: { before: 5400, after: 41200 }, reach: { before: 20000, after: 1200000 }, engagement: { before: 0.9, after: 9.4, unit: "%" }, leads: { before: 25, after: 180 } },
  },
  "lola-cafe": {
    client: "Lola Café",
    hue: ["#A855F7", "#FB923C"],
    services: ["branding", "production", "smm"],
    metrics: { followers: { before: 0, after: 12800 }, reach: { before: 0, after: 310000 }, engagement: { before: 0, after: 7.5, unit: "%" }, leads: { before: 0, after: 450 } },
  },
  "dushanbe-fitness": {
    client: "Dushanbe Fitness",
    hue: ["#7C3AED", "#22D3EE"],
    services: ["ads", "design"],
    metrics: { followers: { before: 800, after: 9600 }, reach: { before: 3000, after: 410000 }, engagement: { before: 2.1, after: 5.9, unit: "%" }, leads: { before: 0, after: 312 } },
  },
};

export const clientWordmarks = [
  "Nur Beauty", "Sarvar Mebel", "Lola Café", "Dushanbe Fitness", "Pamir Tour", "Somon Market", "Navruz Kids", "Varzob Water", "Hisor Bakery", "Silk Road Hotel",
];
