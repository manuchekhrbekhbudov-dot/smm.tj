import type { SVGProps } from "react";

type Name =
  | "smm" | "reels" | "design" | "ads" | "branding" | "production"
  | "instagram" | "tiktok" | "telegram" | "whatsapp" | "youtube" | "facebook"
  | "arrow" | "arrowUpRight" | "check" | "plus" | "phone" | "mail" | "pin" | "clock" | "star" | "quote";

/** Minimal line icon set (24px grid, currentColor). */
export function Icon({ name, ...props }: { name: Name } & SVGProps<SVGSVGElement>) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...props };
  switch (name) {
    case "smm": return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg>;
    case "reels": return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M3 8h18M8 3l3 5M14 3l3 5" /><path d="M10 12v5l4-2.5z" fill="currentColor" /></svg>;
    case "design": return <svg {...common}><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.3-1-1.6-1-2.6 0-.9.7-1.3 1.6-1.3H16a5 5 0 0 0 5-5c0-4.1-4-7.5-9-7.5Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10.5" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="8" r="1" fill="currentColor" /></svg>;
    case "ads": return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><path d="M21 3l-6.5 6.5" /></svg>;
    case "branding": return <svg {...common}><path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.6 6.5 20 8 13.4 3 9l6.4-.7z" /></svg>;
    case "production": return <svg {...common}><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="4" /></svg>;
    case "instagram": return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
    case "tiktok": return <svg {...common}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.5 2.8 2.4 4.6 5 5" /></svg>;
    case "telegram": return <svg {...common}><path d="M21 4 3 11l6 2 2 6 3-4 5 4z" /><path d="m9 13 8-6" /></svg>;
    case "whatsapp": return <svg {...common}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.4-1.6-1-2-2l1-1-1-2z" /></svg>;
    case "youtube": return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9v6l5-3z" fill="currentColor" /></svg>;
    case "facebook": return <svg {...common}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" /></svg>;
    case "arrow": return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "arrowUpRight": return <svg {...common}><path d="M7 17 17 7M8 7h9v9" /></svg>;
    case "check": return <svg {...common}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "phone": return <svg {...common}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;
    case "mail": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></svg>;
    case "pin": return <svg {...common}><path d="M12 21s7-5.7 7-11.5A7 7 0 0 0 5 9.5C5 15.3 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "star": return <svg {...common} fill="currentColor" stroke="none"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" /></svg>;
    case "quote": return <svg {...common} fill="currentColor" stroke="none"><path d="M4 17.5V13c0-4 2-6.6 6-7.5l.8 1.7C8.6 8 7.6 9.4 7.5 11.5H10v6zM13.5 17.5V13c0-4 2-6.6 6-7.5l.8 1.7c-2.2.8-3.2 2.2-3.3 4.3h2.5v6z" /></svg>;
  }
}
export type IconName = Name;
