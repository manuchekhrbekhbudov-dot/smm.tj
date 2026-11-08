import { cn } from "@/lib/cn";

export type Variant = "primary" | "outline" | "ghost";
export type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-[-0.01em] transition-[box-shadow,background-color,color,transform] duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-primary text-white glow-sm hover:glow-md hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_6px_rgb(46_16_101/0.35)]",
  outline: "glass glass-edge text-ink-0 hover:-translate-y-0.5 hover:glow-sm",
  ghost: "text-ink-1 hover:bg-ink-3 hover:text-ink-0",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

