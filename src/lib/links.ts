/** Safe outbound links built from user-entered values (never trust raw input as href). */
export function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
const handle = (v: string) => v.trim().replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "");
export const telegramUrl = (v: string) => (handle(v) ? `https://t.me/${handle(v)}` : null);
export const instagramUrl = (v: string) => (handle(v) ? `https://instagram.com/${handle(v)}` : null);
export const whatsappUrl = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length >= 9 ? `https://wa.me/${d.length === 9 ? "992" + d : d}` : null;
};
export const linkLabel = (url: string) => {
  try { const u = new URL(url); return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, ""); } catch { return url; }
};
