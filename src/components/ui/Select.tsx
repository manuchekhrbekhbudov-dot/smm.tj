import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Native select styled like the other fields (accessible + mobile-friendly). */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string }>(function Select(
  { label, className, children, ...rest }, ref
) {
  return (
    <label className={cn("relative block", className)}>
      <span className="pointer-events-none absolute left-4 top-2 text-xs text-ink-2">{label}</span>
      <select
        ref={ref}
        className="w-full appearance-none rounded-[var(--radius-sm)] border border-ink-3 bg-bg-2/60 px-4 pb-2.5 pt-6 pr-10 text-ink-0 outline-none transition-[border-color,box-shadow] focus:border-purple focus:shadow-[0_0_0_4px_rgb(168_85_247/0.15)]"
        {...rest}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
    </label>
  );
});
