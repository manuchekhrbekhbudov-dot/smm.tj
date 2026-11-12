import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

const pages = ["", "/specialists", "/prices", "/guide", "/about", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((p) => (["tg", "ru"] as const).map((l) => ({
    url: `${SITE_URL}/${l}${p}/`,
    changeFrequency: p === "/specialists" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.8,
    alternates: { languages: { tg: `${SITE_URL}/tg${p}/`, ru: `${SITE_URL}/ru${p}/` } },
  })));
}
