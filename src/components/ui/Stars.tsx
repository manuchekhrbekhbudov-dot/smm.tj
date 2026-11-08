"use client";
import { cn } from "@/lib/cn";

/** Read-only stars, or an input when `onChange` is given. */
export function Stars({ value, onChange, size = 18, label }: { value: number; onChange?: (v: number) => void; size?: number; label?: string }) {
  const full = Math.round(value);
  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" role="img" aria-label={`${value.toFixed(1)} / 5`}>
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} on={i <= full} size={size} />)}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i}`} onClick={() => onChange(i)}
          className="transition-transform hover:scale-125 active:scale-95">
          <Star on={i <= value} size={size} />
        </button>
      ))}
    </span>
  );
}

function Star({ on, size }: { on: boolean; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={cn(on ? "text-warning" : "text-ink-3")} fill="currentColor">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}
