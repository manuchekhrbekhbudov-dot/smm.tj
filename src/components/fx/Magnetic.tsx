import type { ReactNode } from "react";

/** Plain wrapper (the magnetic effect was removed: it made taps feel unreliable on touch screens). */
export function Magnetic({ children, className }: { children: ReactNode; strength?: number; className?: string }) {
  return <div className={className ?? "inline-block"}>{children}</div>;
}
