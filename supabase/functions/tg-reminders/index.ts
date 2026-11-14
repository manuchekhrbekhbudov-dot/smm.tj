// Daily Telegram messages, called once a day by GitHub Actions (.github/workflows/telegram-reminders.yml).
//  * Gentle reminder, once per person, 3–10 days after sign-up if they have not started yet:
//      client  → no order and no chat;   specialist → profile, price list or portfolio still empty.
//  * Launch announcement on 1–3 December 2026, once per person.
// Safe to call any number of times: every message is sent at most once per person
// (sent messages are logged in mp_ai_usage with keys "remind:<user>" / "launch2026:<user>").
import { admin, json, tg, SITE_URL, DIRECTOR_PHONE } from "../_shared/tg.ts";

const MAX_PER_RUN = 200;
const LAUNCH_FROM = "2026-12-01", LAUNCH_TO = "2026-12-03";

const T = {
  client:
    `Салом! 👋\n\nШумо чанд рӯз пеш дар <b>SMM.TJ</b> сабти ном кардед — ташаккур! 💜\n\n` +
    `Мутахассиси SMM ёфтан осон аст:\n🔎 самтро интихоб кунед\n📸 портфолио ва нархҳоро бинед\n💬 дар чат савол диҳед — ройгон\n\n` +
    `👉 ${SITE_URL}/tg/specialists/`,
  specialist:
    `Салом! 👋\n\nПрофили шумо дар <b>SMM.TJ</b> ҳанӯз пурра нест — мизоҷон онро намебинанд.\n\n` +
    `5 дақиқа вақт ҷудо кунед:\n✅ сурат ва тавсиф\n✅ нархнома\n✅ 3–9 намунаи кор дар портфолио\n\n` +
    `Баъд директор профилро месанҷад ва шумо дар каталог пайдо мешавед 🚀\n🎁 3 шарҳи хуб дар моҳи аввал — 1 ҳафта «Топ» ройгон.\n\n` +
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
  const { data: logs } = await db.from("mp_ai_usage").select("key").or("key.like.remind:%,key.like.launch2026:%").limit(10000);
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
    return age >= 3 && age <= 10 && !done.has(`remind:${p.id}`);
  });
  for (const p of due) {
    if (p.role === "specialist") {
      const [{ data: s }, { count: services }, { count: works }] = await Promise.all([
        db.from("mp_specialists").select("headline, bio").eq("id", p.id).maybeSingle(),
        db.from("mp_specialist_services").select("id", { count: "exact", head: true }).eq("specialist_id", p.id),
        db.from("mp_portfolio_items").select("id", { count: "exact", head: true }).eq("specialist_id", p.id),
      ]);
      const incomplete = !s || !s.headline || !s.bio || !services || !works;
      if (incomplete && await send(p.id, `remind:${p.id}`, T.specialist)) out.specialist++;
    } else {
      const [{ count: orders }, { count: chats }] = await Promise.all([
        db.from("mp_orders").select("id", { count: "exact", head: true }).eq("client_id", p.id),
        db.from("mp_conversations").select("id", { count: "exact", head: true }).eq("client_id", p.id),
      ]);
      if (!orders && !chats && await send(p.id, `remind:${p.id}`, T.client)) out.client++;
    }
  }
  return json({ ok: true, today, ...out });
});
