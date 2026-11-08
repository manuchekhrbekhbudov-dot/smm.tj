"use client";
import { forwardRef, useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

const fieldBox =
  "peer w-full rounded-[var(--radius-sm)] border border-ink-3 bg-bg-2/60 px-4 pb-2.5 pt-6 text-ink-0 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-transparent focus:border-purple focus:shadow-[0_0_0_4px_rgb(168_85_247/0.15),var(--glow-sm)]";
const floatLabel =
  "pointer-events-none absolute left-4 top-4 origin-left text-ink-2 transition-all duration-300 peer-focus:top-2 peer-focus:text-xs peer-focus:text-purple peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs";

/** Input with floating label, glowing focus ring and animated error. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        id={fid}
        placeholder={label}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        className={cn(fieldBox, error && "border-danger focus:border-danger")}
        {...rest}
      />
      <label htmlFor={fid} className={floatLabel}>{label}</label>
      {(error || hint) && (
        <motion.p
          id={`${fid}-msg`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("mt-1.5 px-1 text-xs", error ? "text-danger" : "text-ink-2")}
        >
          {error ?? hint}
        </motion.p>
      )}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn("relative", className)}>
      <textarea ref={ref} id={fid} placeholder={label} rows={4} aria-invalid={!!error || undefined} className={cn(fieldBox, "resize-none", error && "border-danger")} {...rest} />
      <label htmlFor={fid} className={floatLabel}>{label}</label>
      {error && <p className="mt-1.5 px-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

/** Animated switch. */
export function Toggle({ checked, onChange, label }: { checked?: boolean; onChange?: (v: boolean) => void; label: string }) {
  const [inner, setInner] = useState(false);
  const on = checked ?? inner;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => { setInner(!on); onChange?.(!on); }}
      className="inline-flex items-center gap-3 text-sm text-ink-1"
    >
      <span className={cn("relative flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-300", on ? "bg-gradient-primary glow-sm" : "bg-ink-3")}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className="h-5 w-5 rounded-full bg-white shadow"
          style={{ marginLeft: on ? "auto" : 0 }}
        />
      </span>
      {label}
    </button>
  );
}
