"use client";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after mount. Used for parts that read the URL query
 * (useSearchParams) so the static HTML and the first client render always match.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
