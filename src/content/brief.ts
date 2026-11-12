/** Structured order brief: lets specialists answer faster and more precisely. */
export const BRIEF = {
  business: ["shop", "food", "beauty", "education", "services", "personal", "other"],
  goal: ["sales", "followers", "brand", "ads", "content"],
  deadline: ["asap", "week", "month", "long"],
} as const;
export type Brief = { business?: string; goal?: string; deadline?: string; link?: string };

export function cleanBrief(f: FormData): Brief | null {
  const pick = (k: keyof typeof BRIEF) => { const v = String(f.get(`brief_${k}`) ?? ""); return (BRIEF[k] as readonly string[]).includes(v) ? v : undefined; };
  const raw = String(f.get("brief_link") ?? "").trim().slice(0, 200);
  const link = /^(https?:\/\/|@)[^\s]{2,}$/i.test(raw) ? raw : undefined;
  const b: Brief = { business: pick("business"), goal: pick("goal"), deadline: pick("deadline"), link };
  return Object.values(b).some(Boolean) ? b : null;
}
