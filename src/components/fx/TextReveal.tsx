import { cn } from "@/lib/cn";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "mount" | "inView";
  /** Words from this index on get the gradient. Negative counts from the end. */
  highlightFrom?: number;
};

/**
 * Heading with optional gradient tail. On "mount" the words rise in with a pure-CSS animation
 * (runs without JavaScript, so the text is never stuck invisible on slow phones).
 */
export function TextReveal({ text, as: Tag = "h1", className, delay = 0, stagger = 0.05, trigger = "inView", highlightFrom }: Props) {
  const words = text.split(" ");
  const hl = highlightFrom === undefined ? Infinity : highlightFrom < 0 ? words.length + highlightFrom : highlightFrom;
  const animate = trigger === "mount";
  return (
    <Tag className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span
            className={cn(animate && "word-in", i >= hl && "text-gradient")}
            style={animate ? { animationDelay: `${delay + i * stagger}s` } : undefined}
          >
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
