import { cn } from "@/lib/cn";

export function Avatar({ name, url, size = 56, className }: { name: string; url?: string | null; size?: number; className?: string }) {
  const initials = (name || "?").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary font-display font-bold text-white", className)}
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
