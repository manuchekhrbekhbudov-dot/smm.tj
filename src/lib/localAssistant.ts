"use client";
/**
 * Free built-in helper used while no AI key is configured: answers common questions from the
 * site's own texts (FAQ, guide, plans, rules) and finds REAL approved specialists in the catalog.
 * It never invents people, prices or ratings.
 */
import { getSupabase } from "./supabase/client";
import { SITE_URL } from "./site-url";
import { SPECIALIST_SELECT, type Specialist } from "./supabase/types";
import { sortByPlan, withPlans } from "./plans";

type Faq = { q: string; a: string };
type T = (key: string, values?: Record<string, string | number>) => string;

const SPEC_WORDS: Record<string, string[]> = {
  smm: ["instagram", "инстаграм", "tiktok", "тикток", "smm", "смм", "саҳифа", "страниц", "ведение", "идора"],
  reels: ["reels", "рилс", "видео", "video", "монтаж"],
  design: ["дизайн", "design", "логотип", "баннер", "графи"],
  ads: ["реклама", "рекла", "таргет", "target", "ads"],
  branding: ["бренд", "brand"],
  production: ["акс", "фото", "photo", "съёмк", "съемк", "сурат"],
  copywriting: ["матн", "текст", "копирайт", "пост"],
  consulting: ["машварат", "консульт", "аудит", "омӯз", "обуч", "курс", "стратег"],
};
const CITY_WORDS: Record<string, string[]> = {
  dushanbe: ["душанбе", "dushanbe"], khujand: ["хуҷанд", "худжанд", "khujand"], bokhtar: ["бохтар"], kulob: ["кӯлоб", "куляб", "кулоб"],
  istaravshan: ["истаравшан"], tursunzoda: ["турсунзода"], vahdat: ["ваҳдат", "вахдат"], panjakent: ["панҷакент", "пенджикент"],
  khorog: ["хоруғ", "хорог"], isfara: ["исфара"], konibodom: ["конибодом", "канибадам"], guliston: ["гулистон"],
};
const FIND_WORDS = ["мутахассис", "специалист", "кӣ ", "кто", "ёб", "найд", "найти", "лозим", "нужен", "нужна", "тавсия", "посовет", "мешавад?", "смм", "smm"];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[.,!?;:«»"()]/g, " ");
const has = (q: string, words: string[]) => words.some((w) => q.includes(w.replace(/ё/g, "е")));

export async function localAnswer(question: string, locale: string, t: T, faq: Faq[], isSpecialist: boolean): Promise<string> {
  const q = ` ${norm(question)} `;
  const link = (path: string) => `${SITE_URL}/${locale}${path}`;

  // 1) Finding a specialist in the real catalog
  const specs = Object.keys(SPEC_WORDS).filter((k) => has(q, SPEC_WORDS[k]));
  const city = Object.keys(CITY_WORDS).find((k) => has(q, CITY_WORDS[k]));
  const budget = Number((q.match(/(\d[\d\s]{1,7})\s*(сомон|смн|tjs|сом|\$)?/) ?? [])[1]?.replace(/\s/g, "") || 0);
  const wantsFind = !isSpecialist && (has(q, FIND_WORDS) || specs.length > 0) && !has(q, ["тариф", "парол", "пароль", "код ", "шикоят", "жалоб"]);
  if (wantsFind) {
    const sb = getSupabase();
    let list: Specialist[] = [];
    if (sb) {
      let query = sb.from("mp_specialists").select(SPECIALIST_SELECT).eq("status", "approved");
      if (specs.length) query = query.overlaps("specialties", specs);
      if (budget >= 50) query = query.lte("min_price", budget);
      const { data } = await query.order("rating_avg", { ascending: false }).limit(50);
      list = sortByPlan(await withPlans(sb, (data as unknown as Specialist[]) ?? []));
      if (city) list = list.filter((s) => s.profiles?.city === city);
    }
    const catalog = link(`/specialists/${specs[0] ? `?s=${specs[0]}` : ""}`);
    if (!list.length) return t("local.noneFound", { catalog });
    const lines = list.slice(0, 3).map((s) => {
      const rating = s.reviews_count > 0 ? ` · ★ ${Number(s.rating_avg).toFixed(1)} (${s.reviews_count})` : "";
      const price = s.min_price != null ? ` · ${t("local.from")} ${s.min_price} TJS` : "";
      return `• [${s.profiles?.full_name || "—"}](${link(`/specialist/?id=${s.id}`)})${price}${rating}`;
    });
    return `${t("local.found")}\n${lines.join("\n")}\n\n${t("local.more", { catalog })}`;
  }

  // 2) Topic answers
  const topics: [string[], string][] = [
    [["тариф", "топ", "премиум", "стандарт", "болотар", "выше", "plan"], t("local.plans", { cabinet: link("/cabinet/") })],
    [["парол", "пароль", "код", "ворид", "вход", "войти", "даромад", "сабти ном", "регистр", "telegram", "телеграм"], t("local.login", { login: link("/login/") })],
    [["шикоят", "жалоб", "бад кор", "плохо", "блок", "хориҷ", "удал"], t("local.complaints")],
    [["тамос", "контакт", "директор", "телефон", "рақам", "номер", "связ"], t("local.contacts")],
    [["профил", "нарх", "цен", "мизоҷ бештар", "больше клиент", "беҳтар"], isSpecialist ? t("local.profileTips", { cabinet: link("/cabinet/") }) : ""],
    [["тӯҳфа", "подар", "шарҳ", "отзыв"], t("local.reviews")],
  ];
  for (const [words, answer] of topics) if (answer && has(q, words)) return answer;

  // 3) Closest FAQ entry by shared words
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  let best: Faq | null = null, score = 0;
  for (const f of faq) {
    const hay = norm(`${f.q} ${f.a}`);
    const sc = words.filter((w) => hay.includes(w)).length;
    if (sc > score) { score = sc; best = f; }
  }
  if (best && score >= 2) return `${best.a}`;

  return t("local.fallback", { guide: link("/guide/"), about: link("/about/") });
}
