import type { ReactNode } from "react";

/** Kept for API compatibility. Content is always visible (no JS-gated opacity). */
export function Reveal({ children, className }: { children: ReactNode; dir?: string; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}
