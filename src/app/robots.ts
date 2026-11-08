import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["cabinet", "admin", "login", "onboarding"].flatMap((p) => [`/tg/${p}`, `/ru/${p}`]);
  return { rules: [{ userAgent: "*", allow: "/", disallow: privatePaths }], sitemap: `${SITE_URL}/sitemap.xml` };
}
