import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Glass card. `glowBorder` adds the rotating conic gradient border. */
export function Card({ className, glowBorder = false, ...rest }: HTMLAttributes<HTMLDivElement> & { glowBorder?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--radius-lg)] glass p-6 md:p-8",
        glowBorder && "gradient-border",
        className
      )}
      {...rest}
    />
  );
}

export function Badge({ className, tone = "purple", ...rest }: HTMLAttributes<HTMLSpanElement> & {
  tone?: "purple" | "success" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    purple: "bg-purple/15 text-purple border-purple/30",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    neutral: "bg-ink-3 text-ink-1 border-ink-3",
  } as const;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", tones[tone], className)}
      {...rest}
    />
  );
}

/** Small uppercase label with a glowing dot, used above section headings. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-purple", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-magenta shadow-[0_0_10px_#c026d3]" />
      {children}
    </span>
  );
}
