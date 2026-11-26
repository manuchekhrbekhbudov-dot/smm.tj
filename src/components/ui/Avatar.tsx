import { cn } from "@/lib/cn";

export function Avatar({ name, url, size = 56, className }: { name: string; url?: string | null; size?: number; className?: string }) {
  // First LETTER of the first two words (emoji, digits and symbols are skipped; works with any alphabet).
  const initials = (name || "").split(/\s+/).map((w) => w.match(/\p{L}/u)?.[0] ?? "").filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full orb font-display font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
