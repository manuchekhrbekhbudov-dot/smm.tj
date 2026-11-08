import { cn } from "@/lib/cn";

export function Notice({ tone = "info", children, className }: { tone?: "info" | "success" | "warning" | "danger"; children: React.ReactNode; className?: string }) {
  const tones = {
    info: "border-purple/30 bg-purple/10",
    success: "border-success/30 bg-success/10",
    warning: "border-warning/30 bg-warning/10",
    danger: "border-danger/30 bg-danger/10",
  };
  return <div role="status" className={cn("rounded-[var(--radius-md)] border px-5 py-4 text-sm text-ink-0", tones[tone], className)}>{children}</div>;
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple border-t-transparent", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-[var(--radius-md)] bg-ink-3", className)} />;
}
