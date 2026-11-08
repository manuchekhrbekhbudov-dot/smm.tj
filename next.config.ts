import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * STATIC_EXPORT=1 builds a plain-HTML copy for GitHub Pages (see scripts/build-pages.sh).
 * The normal build (Vercel / `npm start`) keeps middleware and server actions.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ["framer-motion", "gsap"] },
  ...(isStatic && {
    output: "export" as const,
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default withNextIntl(nextConfig);
