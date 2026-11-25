// Finding REAL approved specialists from a short free-text request ("дизайнер Хуҷанд", "reels 500 сомонӣ").
// Used by the Telegram bot. Never invents anyone: results come straight from the catalog.
import { admin, escapeHtml, SITE_URL } from "./tg.ts";

export const SPEC_LABELS: Record<string, string> = {
  smm: "Идоракунии Instagram ва TikTok", reels: "Истеҳсоли Reels", design: "Дизайни графикӣ", ads: "Рекламаи таргетӣ",
  branding: "Брендинг", production: "Аксбардорӣ ва видео", copywriting: "Копирайтинг", consulting: "Машварат ва омӯзиш",
};
export const CITY_LABELS: Record<string, string> = {
  dushanbe: "Душанбе", khujand: "Хуҷанд", bokhtar: "Бохтар", kulob: "Кӯлоб", istaravshan: "Истаравшан", tursunzoda: "Турсунзода",
  vahdat: "Ваҳдат", panjakent: "Панҷакент", khorog: "Хоруғ", isfara: "Исфара", konibodom: "Конибодом", guliston: "Гулистон",
  hisor: "Ҳисор", norak: "Норак", online: "Онлайн",
};

const SPEC_WORDS: Record<string, string[]> = {
  smm: ["instagram", "инстаграм", "insta", "tiktok", "тикток", "smm", "смм", "саҳифа", "страниц", "ведение", "идора", "таргетолог"],
  reels: ["reels", "рилс", "рилз", "видео", "video", "монтаж", "мобилограф"],
  design: ["дизайн", "design", "логотип", "лого", "баннер", "графи"],
  ads: ["реклама", "рекла", "таргет", "target", "ads"],
  branding: ["бренд", "brand"],
  production: ["акс", "фото", "photo", "съёмк", "съемк", "сурат", "видеограф", "оператор"],
  copywriting: ["матн", "текст", "копирайт", "пост"],
  consulting: ["машварат", "консульт", "аудит", "омӯз", "обуч", "курс", "стратег", "ментор"],
};
const CITY_WORDS: Record<string, string[]> = {
  dushanbe: ["душанбе", "dushanbe"], khujand: ["хуҷанд", "худжанд", "khujand", "ленинобод"], bokhtar: ["бохтар", "bokhtar"],
  kulob: ["кӯлоб", "куляб", "kulob"], istaravshan: ["истаравшан", "ура-тюбе"], tursunzoda: ["турсунзода"], vahdat: ["ваҳдат"],
  panjakent: ["панҷакент", "пенджикент"], khorog: ["хоруғ", "хорог"], isfara: ["исфара"], konibodom: ["конибодом", "канибадам"],
  guliston: ["гулистон"], hisor: ["ҳисор", "гиссар"], norak: ["норак", "нурек"], online: ["онлайн", "online", "дистанц", "удален"],
};
const FIND_WORDS = ["мутахассис", "специалист", "ёфтан", "ёбед", "найти", "найди", "лозим", "нужен", "нужна", "кто нужен", "фрилансер"];

/** Lower-case, and Tajik letters → their Russian look-alikes, so "хучанд" matches "хуҷанд". */
const norm = (s: string) => s.toLowerCase()
  .replace(/ё/g, "е").replace(/ҷ/g, "ч").replace(/ӣ/g, "и").replace(/ӯ/g, "у").replace(/ғ/g, "г").replace(/қ/g, "к").replace(/ҳ/g, "х")
  .replace(/[.,!?;:«»"()]/g, " ");
const has = (q: string, words: string[]) => words.some((w) => q.includes(norm(w)));

export type Parsed = { specs: string[]; city: string | null; budget: number };

/** null when the text does not look like a search at all. */
export function parseQuery(text: string): Parsed | null {
  const q = ` ${norm(text)} `;
  const specs = Object.keys(SPEC_WORDS).filter((k) => has(q, SPEC_WORDS[k]));
  const city = Object.keys(CITY_WORDS).find((k) => has(q, CITY_WORDS[k])) ?? null;
  const m = q.match(/(\d[\d\s]{1,7})\s*(сомон|смн|tjs|сом)?/);
  const budget = m ? Number(m[1].replace(/\s/g, "")) : 0;
  if (!specs.length && !city && !has(q, FIND_WORDS)) return null;
  return { specs, city, budget: budget >= 50 ? budget : 0 };
}

type Row = {
  id: string; specialties: string[]; rating_avg: number; reviews_count: number; min_price: number | null;
  plan: string | null; plan_until: string | null; verified_at: string | null;
  profiles: { full_name: string; city: string | null } | { full_name: string; city: string | null }[] | null;
};
const RANK: Record<string, number> = { top: 1, standard: 2, premium: 3 };

export async function searchSpecialists(p: Parsed, limit = 3) {
  let query = admin().from("mp_specialists")
    .select("id, specialties, rating_avg, reviews_count, min_price, plan, plan_until, verified_at, profiles:mp_profiles!mp_specialists_id_fkey(full_name, city)")
    .eq("status", "approved").is("banned_at", null);
  if (p.specs.length) query = query.overlaps("specialties", p.specs);
  if (p.budget) query = query.lte("min_price", p.budget);
  const { data, error } = await query.order("rating_avg", { ascending: false }).limit(100);
  if (error) throw error;
  const now = Date.now();
  const prof = (r: Row) => (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) ?? null;
  let rows = ((data ?? []) as Row[]).map((r) => ({ r, city: prof(r)?.city ?? null }));
  if (p.city) {
    // the city's own specialists first, then those who work online across the country
    rows = rows.filter((x) => x.city === p.city || x.city === "online")
      .sort((a, b) => Number(b.city === p.city) - Number(a.city === p.city));
  }
  const rank = (r: Row) => (r.plan && r.plan_until && new Date(r.plan_until).getTime() > now ? RANK[r.plan] ?? 0 : 0);
  rows = rows.map((x, i) => ({ ...x, i })).sort((a, b) =>
    (p.city ? Number(b.city === p.city) - Number(a.city === p.city) : 0) || rank(b.r) - rank(a.r) || a.i - b.i);
  return { total: rows.length, list: rows.slice(0, limit).map(({ r, city }) => ({ ...r, name: prof(r)?.full_name || "—", city })) };
}

export function catalogUrl(p: Parsed) {
  const qs = new URLSearchParams();
  if (p.specs[0]) qs.set("s", p.specs[0]);
  if (p.city && p.city !== "online") qs.set("city", p.city);
  if (p.budget) qs.set("max", String(p.budget));
  const s = qs.toString();
  return `${SITE_URL}/tg/specialists/${s ? `?${s}` : ""}`;
}

/** Telegram (HTML) answer for a search. */
export async function searchReply(p: Parsed): Promise<string> {
  const { total, list } = await searchSpecialists(p);
  const what = [p.specs.map((s) => SPEC_LABELS[s]).join(", "), p.city ? CITY_LABELS[p.city] : "", p.budget ? `то ${p.budget} TJS` : ""]
    .filter(Boolean).join(" · ");
  if (!list.length) {
    return `🔎 ${what ? `<b>${escapeHtml(what)}</b>\n\n` : ""}Ҳоло мутахассиси мувофиқ нест. Каталоги пурраро бинед ё дертар бори дигар нависед.\n` +
      `Сейчас подходящих специалистов нет — посмотрите весь каталог.\n\n👉 ${SITE_URL}/tg/specialists/`;
  }
  const lines = list.map((s, i) => {
    const spec = s.specialties.map((x) => SPEC_LABELS[x]).filter(Boolean).slice(0, 2).join(", ");
    const meta = [s.city ? CITY_LABELS[s.city] ?? "" : "", s.min_price != null ? `аз ${s.min_price} TJS` : "",
      s.reviews_count > 0 ? `★ ${Number(s.rating_avg).toFixed(1)} (${s.reviews_count})` : "нав"].filter(Boolean).join(" · ");
    return `${i + 1}. <b>${escapeHtml(s.name)}</b>${s.verified_at ? " ✅" : ""}\n${escapeHtml(spec)}\n${meta}\n👉 ${SITE_URL}/tg/specialist/?id=${s.id}`;
  });
  return `🔎 ${what ? `<b>${escapeHtml(what)}</b> — ` : ""}ёфт шуд: ${total}\n\n${lines.join("\n\n")}` +
    (total > list.length ? `\n\nҲамааш (${total}) / Все:\n👉 ${catalogUrl(p)}` : "");
}

export const SEARCH_HELP =
  "🔎 <b>Ҷустуҷӯи мутахассис</b>\n\nКӣ лозим аст ва дар кадом шаҳр — нависед, масалан:\n" +
  "• <code>дизайнер Хуҷанд</code>\n• <code>reels Душанбе</code>\n• <code>реклама то 500 сомонӣ</code>\n\n" +
  "Напишите, кто нужен и в каком городе — например: <code>таргет Душанбе</code>";
