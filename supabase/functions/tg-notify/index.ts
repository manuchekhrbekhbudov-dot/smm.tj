// POST { order_id } with the user's Authorization header.
// - client just placed the order (status "new")     → tells the specialist
// - specialist accepted / declined / finished it    → tells the client
// Each status is announced once (mp_orders.tg_notified_status).
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { admin, cors, escapeHtml, json, tg, SITE_URL, DIRECTOR_PHONE } from "../_shared/tg.ts";

const statusText: Record<string, string> = {
  accepted: "✅ Мутахассис фармоиши шуморо қабул кард / Специалист принял ваш заказ",
  declined: "❌ Мутахассис фармоишро рад кард / Специалист отклонил заказ",
  done: "🎉 Фармоиш анҷом ёфт! Акнун шарҳ навишта метавонед / Заказ выполнен! Оставьте отзыв",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") ?? "";
  const body = await req.json().catch(() => ({}));
  const { order_id } = body;
  if (auth.startsWith("Bearer ") && typeof body.trust_specialist === "string") return trustEvent(body.trust_specialist);
  if (!auth.startsWith("Bearer ") || !order_id) return json({ error: "bad_request" }, 400);

  // Read the order AS THE CALLER: RLS guarantees they are its client or specialist.
  const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: me } = await asUser.auth.getUser();
  const { data: order } = await asUser.from("mp_orders").select("id, client_id, specialist_id, status, message, budget_tjs, tg_notified_status").eq("id", order_id).maybeSingle();
  if (!me?.user || !order) return json({ error: "not_found" }, 404);
  if (order.tg_notified_status === order.status) return json({ ok: true, skipped: "already" });

  const db = admin();
  let target: string | null = null;
  let text = "";
  if (order.status === "new" && me.user.id === order.client_id) {
    target = order.specialist_id;
    const { data: c } = await db.from("mp_profiles").select("full_name").eq("id", order.client_id).maybeSingle();
    text =
      `🆕 <b>Фармоиши нав / Новый заказ</b>\n\n👤 ${escapeHtml(c?.full_name || "—")}` +
      (order.budget_tjs ? `\n💰 ${order.budget_tjs} TJS` : "") +
      `\n\n${escapeHtml(String(order.message).slice(0, 600))}\n\n👉 ${SITE_URL}/tg/cabinet/`;
  } else if (statusText[order.status] && me.user.id === order.specialist_id) {
    target = order.client_id;
    text = `${statusText[order.status]}\n\n👉 ${SITE_URL}/tg/cabinet/`;
  } else {
    return json({ ok: true, skipped: "no_event" });
  }

  const { data: link } = await db.from("mp_tg_links").select("chat_id").eq("user_id", target).maybeSingle();
  await db.from("mp_orders").update({ tg_notified_status: order.status }).eq("id", order.id);
  if (!link) return json({ ok: true, skipped: "no_telegram" });
  await tg("sendMessage", { chat_id: link.chat_id, text, parse_mode: "HTML", disable_web_page_preview: true });
  return json({ ok: true, sent: true });
});

/**
 * After a complaint or a 1★ review: tells the specialist once about the warning (2 strikes)
 * or the removal (3 strikes), and the director about both. State is read from the database,
 * so calling this repeatedly never sends duplicates or anything that did not happen.
 */
async function trustEvent(specialistId: string) {
  const db = admin();
  const { data: s } = await db.from("mp_specialists").select("id, strikes, warned_at, banned_at, tg_strike_notified").eq("id", specialistId).maybeSingle();
  if (!s) return json({ ok: true, skipped: "not_found" });
  const state = s.banned_at ? "banned" : s.warned_at ? "warned" : null;
  if (!state || s.tg_strike_notified === state) return json({ ok: true, skipped: "no_change" });
  await db.from("mp_specialists").update({ tg_strike_notified: state }).eq("id", s.id);

  const text = state === "banned"
    ? `⛔ Шумо аз платформаи SMM.TJ хориҷ шудед (3 шикоят / баҳои паст). Лутфан ба директор муроҷиат кунед: ${DIRECTOR_PHONE}
` +
      `Вы удалены с платформы SMM.TJ (3 жалобы / низкие оценки). Обратитесь к директору: ${DIRECTOR_PHONE}`
    : `⚠️ Эҳтиёт бошед! Шумо 2 шикоят / баҳои паст доред. Агар боз як шикоят ё баҳои паст ояд, аз платформа хориҷ мешавед.
` +
      `Будьте внимательны! У вас 2 жалобы / низкие оценки. Ещё одна — и вы будете удалены с платформы.`;
  const send = async (userId: string, t: string) => {
    const { data: link } = await db.from("mp_tg_links").select("chat_id").eq("user_id", userId).maybeSingle();
    if (link) await tg("sendMessage", { chat_id: link.chat_id, text: t, parse_mode: "HTML", disable_web_page_preview: true });
  };
  await send(s.id, text);
  const { data: p } = await db.from("mp_profiles").select("full_name").eq("id", s.id).maybeSingle();
  const { data: admins } = await db.from("mp_profiles").select("id").eq("role", "admin");
  const who = escapeHtml(p?.full_name || "—");
  for (const a of admins ?? []) {
    await send(a.id, state === "banned"
      ? `⛔ ${who} худкор аз платформа хориҷ шуд (3 шикоят).\n${SITE_URL}/tg/admin/`
      : `⚠️ ${who}: 2 шикоят / баҳои паст — огоҳӣ фиристода шуд.\n${SITE_URL}/tg/admin/`);
  }
  return json({ ok: true, sent: state });
}
