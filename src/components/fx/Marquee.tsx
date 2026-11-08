import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Infinite CSS marquee. Content is duplicated once; hover slows it down. */
export function Marquee({ children, reverse = false, duration = 30, className }: {
  children: ReactNode; reverse?: boolean; duration?: number; className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]",
        className
      )}
    >
      <div
        className="flex w-max shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
