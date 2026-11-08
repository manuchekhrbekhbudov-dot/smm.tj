import { cn } from "@/lib/cn";

/** SMM.TJ mark: a rounded spark/orbit glyph. `draw` exposes path classes for the preloader stroke animation. */
export function LogoMark({ className, draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="lg-mark" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#A855F7" />
          <stop offset="1" stopColor="#C026D3" />
        </linearGradient>
      </defs>
      <rect
        className={draw ? "logo-path" : undefined}
        x="2" y="2" width="44" height="44" rx="14"
        stroke="url(#lg-mark)" strokeWidth="2.5" pathLength={1}
      />
      <path
        className={draw ? "logo-path" : undefined}
        d="M32 15.5c-2-2-4.9-3-8-3-4.7 0-8 2.6-8 6.2 0 8.3 16 4.5 16 12.4 0 3.7-3.4 6.4-8.2 6.4-3.4 0-6.4-1.2-8.3-3.3"
        stroke="url(#lg-mark)" strokeWidth="3.2" strokeLinecap="round" pathLength={1}
      />
      <circle className={draw ? "logo-dot" : undefined} cx="36" cy="36" r="2.6" fill="#C026D3" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">
        SMM<span className="text-gradient">.TJ</span>
      </span>
    </span>
  );
}
