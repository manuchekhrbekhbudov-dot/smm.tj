"use client";
import { forwardRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "@/components/fx/Magnetic";
import { buttonClasses, type Variant, type Size } from "./buttonClasses";

export { buttonClasses };

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

type Ripple = { id: number; x: number; y: number };

/** Button with ripple, glow, optional magnetic pull and loading state. */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", magnetic = false, loading = false, icon, className, children, onClick, disabled, ...rest },
  ref
) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 700);
    onClick?.(e);
  };

  const btn = (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 40, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : icon}
      <span className="relative">{children}</span>
    </button>
  );

  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
});
