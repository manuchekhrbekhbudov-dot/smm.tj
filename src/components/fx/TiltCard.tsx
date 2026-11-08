import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Glass card with a light CSS hover lift (no JS, no 3D tilt). */
export function TiltCard({ children, className }: { children: ReactNode; className?: string; max?: number }) {
  return (
    <div className={cn("group relative h-full rounded-[var(--radius-lg)] glass glass-edge transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:glow-md active:scale-[0.99]", className)}>
      {children}
    </div>
  );
}
