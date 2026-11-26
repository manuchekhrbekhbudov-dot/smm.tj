// Daily Telegram messages, called once a day by GitHub Actions (.github/workflows/telegram-reminders.yml).
//  * Gentle reminder, once per person, if they have not started yet:
//      client (3–10 days after sign-up) → no order and no chat;
//      specialist (2–10 days) → profile not complete: the message lists exactly what is missing.
//  * Review request: 3–10 days after an order was finished without a review, once per order.
//  * Launch announcement on 1–3 December 2026, once per person.
//  * Mondays: approved specialists hear how many people viewed their profile in the last 7 days (only if > 0),
//    and the specialist of the week (real reviews only) gets a congratulation.
// Safe to call any number of times: every message is sent at most once per person
// (sent messages are logged in mp_ai_usage with keys "remind:<user>" / "launch2026:<user>").
import { admin, escapeHtml, json, tg, SITE_URL, DIRECTOR_PHONE } from "../_shared/tg.ts";

const MAX_PER_RUN = 200;
const LAUNCH_FROM = "2026-12-01", LAUNCH_TO = "2026-12-03";

const T = {
  client:
    `Салом! 👋\n\nШумо чанд рӯз пеш дар <b>SMM.TJ</b> сабти ном кардед — ташаккур! 💜\n\n` +
    `Мутахассиси SMM ёфтан осон аст:\n🔎 самтро интихоб кунед\n📸 портфолио ва нархҳоро бинед\n💬 дар чат савол диҳед — ройгон\n\n` +
    `👉 ${SITE_URL}/tg/specialists/`,
  specialist: (missing: string[]) =>
    `Салом! 👋\n\nПрофили шумо дар <b>SMM.TJ</b> ҳанӯз пурра нест, бинобар ин мизоҷон онро намебинанд.\n\n` +
    `<b>Намерасад:</b>\n${missing.map((m) => `⬜ ${m}`).join("\n")}\n\n` +
    `5 дақиқа вақт ҷудо кунед. Баъд директор профилро месанҷад ва шумо дар каталог пайдо мешавед 🚀\n🎁 3 шарҳи хуб дар моҳи аввал: 1 ҳафта «Топ» ройгон.\n\n` +
    `👉 ${SITE_URL}/tg/cabinet/`,
  review: (name: string) =>
    `Салом! 👋\n\nФармоиши шумо бо <b>${name}</b> анҷом ёфт. Кор чӣ тавр буд?\n\n` +
    `⭐ Шарҳи кӯтоҳ нависед: ба мизоҷони дигар дар интихоб кумак мекунад. Барои шарҳи муфассал ва ростқавлона ширкат тӯҳфа медиҳад 🎁\n\n` +
    `👉 ${SITE_URL}/tg/cabinet/`,
  launch:
    `🚀 <b>SMM.TJ оғоз шуд!</b>\n\nИмрӯз бозори мутахассисони SMM дар Тоҷикистон ба кор даромад. Раҳмат, ки аз рӯзҳои аввал бо мо ҳастед! 💜\n\n` +
    `🛍️ Мизоҷон — мутахассиси худро ёбед ва фармоиш диҳед.\n🚀 Мутахассисон — профилро пурра кунед ва аввалин фармоишҳоро гиред.\n\n` +
    `👉 ${SITE_URL}/tg/\n📞 ${DIRECTOR_PHONE} · Instagram: @smm.tjj`,
};

Deno.serve(async () => {
  const db = admin();
  const today = new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10); // Dushanbe date
  const { data: links } = await db.from("mp_tg_links").select("user_id, chat_id");
  if (!links?.length) return json({ ok: true, sent: 0 });
  const ids = links.map((l) => l.user_id);
  const { data: profs } = await db.from("mp_profiles").select("id, role, created_at, blocked_at").in("id", ids);
  const people = (profs ?? []).filter((p) => p.role !== "admin" && !p.blocked_at);
  const { data: logs } = await db.from("mp_ai_usage").select("key").or(`key.like.remind:%,key.like.launch2026:%,key.like.views:%:${today},key.like.sotw:%:${today},key.like.review:%`).limit(10000);
  const done = new Set((logs ?? []).map((l) => l.key));
  const chatOf = new Map(links.map((l) => [l.user_id, l.chat_id]));
  const out = { launch: 0, client: 0, specialist: 0, failed: 0 };
  let budget = MAX_PER_RUN;

  const send = async (userId: string, key: string, text: string) => {
    if (budget <= 0 || done.has(key)) return false;
    budget--;
    const r = await tg("sendMessage", { chat_id: chatOf.get(userId), text, parse_mode: "HTML", disable_web_page_preview: true }).catch(() => null);
    await db.from("mp_ai_usage").insert({ key }); // logged even on failure (e.g. bot blocked) so it is never retried
    done.add(key);
    if (!r?.ok) out.failed++;
    return !!r?.ok;
  };

  // 1) Launch announcement
  if (today >= LAUNCH_FROM && today <= LAUNCH_TO) {
    for (const p of people) if (await send(p.id, `launch2026:${p.id}`, T.launch)) out.launch++;
  }

  // 2) One gentle reminder, 3–10 days after sign-up, only if they have not started
  const now = Date.now();
  const due = people.filter((p) => {
    const age = (now - new Date(p.created_at).getTime()) / 86400000;
    return age >= (p.role === "specialist" ? 2 : 3) && age <= 10 && !done.has(`remind:${p.id}`);
  });
  for (const p of due) {
    if (p.role === "specialist") {
      const { data: check } = await db.rpc("mp_profile_check", { sid: p.id });
      const c = (check ?? {}) as Record<string, boolean>;
      const LABEL: Record<string, string> = { photo: "Сурати профил", name: "Ном", headline: "Сарлавҳа (кӣ ҳастед)", about: "«Дар бораи худ»", directions: "Самтҳо", prices: "Нархнома ё баста", video: "Ақаллан 1 видеои кор" };
      const missing = Object.keys(LABEL).filter((k) => c[k] === false).map((k) => LABEL[k]);
      if (missing.length && await send(p.id, `remind:${p.id}`, T.specialist(missing))) out.specialist++;
    } else {
      const [{ count: orders }, { count: chats }] = await Promise.all([
        db.from("mp_orders").select("id", { count: "exact", head: true }).eq("client_id", p.id),
        db.from("mp_conversations").select("id", { count: "exact", head: true }).eq("client_id", p.id),
      ]);
      if (!orders && !chats && await send(p.id, `remind:${p.id}`, T.client)) out.client++;
    }
  }
  // 2b) Ask for a review 3–10 days after an order was finished without one (once per order)
  let reviews = 0;
  const from = new Date(now - 10 * 86400000).toISOString(), to = new Date(now - 3 * 86400000).toISOString();
  const { data: doneOrders } = await db.from("mp_orders").select("id, client_id, specialist_id").eq("status", "done").gte("updated_at", from).lte("updated_at", to).limit(300);
  for (const o of doneOrders ?? []) {
    if (done.has(`review:${o.id}`) || !chatOf.has(o.client_id)) continue;
    const { count } = await db.from("mp_reviews").select("id", { count: "exact", head: true }).eq("order_id", o.id);
    if (count) continue;
    const { data: sp } = await db.from("mp_profiles").select("full_name").eq("id", o.specialist_id).maybeSingle();
    if (await send(o.client_id, `review:${o.id}`, T.review(escapeHtml(sp?.full_name || "мутахассис")))) reviews++;
  }

  // 3) Monday: weekly profile views for approved specialists
  let views = 0;
  if (new Date(`${today}T12:00:00+05:00`).getUTCDay() === 1) {
    const specs = people.filter((p) => p.role === "specialist").map((p) => p.id);
    const weekAgo = new Date(new Date(`${today}T00:00:00+05:00`).getTime() - 7 * 86400_000).toISOString().slice(0, 10);
    const { data: approved } = specs.length
      ? await db.from("mp_specialists").select("id").in("id", specs).eq("status", "approved").is("banned_at", null)
      : { data: [] };
    for (const s of approved ?? []) {
      const { count } = await db.from("mp_profile_views").select("id", { count: "exact", head: true })
        .eq("specialist_id", s.id).gte("day", weekAgo).lt("day", today);
      if (!count) continue;
      const text = `👀 Дар 7 рӯзи охир профили шуморо дар <b>SMM.TJ</b> <b>${count}</b> нафар дид.\n\n` +
        `Портфолио ва нархномаро нав нигоҳ доред — мизоҷон бештар менависанд.\n👉 ${SITE_URL}/tg/cabinet/?tab=stats`;
      if (await send(s.id, `views:${s.id}:${today}`, text)) views++;
    }
  }
  // 4) Monday: specialist of the week
  let sotw = 0;
  if (new Date(`${today}T12:00:00+05:00`).getUTCDay() === 1) {
    const { data: best } = await db.rpc("mp_specialist_of_week");
    if (best && chatOf.has(best as string)) {
      const text = `🏆 <b>Табрик! Шумо «Мутахассиси ҳафта» дар SMM.TJ ҳастед.</b>\n\n` +
        `Шумо аз рӯи шарҳҳои воқеии мизоҷон беҳтарин шудед. Тамоми ҳафта профили шумо дар саҳифаи асосӣ нишон дода мешавад. 💜\n\n👉 ${SITE_URL}/tg/`;
      if (await send(best as string, `sotw:${best}:${today}`, text)) sotw++;
    }
  }
  return json({ ok: true, today, ...out, reviews, views, sotw });
});
