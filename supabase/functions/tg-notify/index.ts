// POST { order_id } with the user's Authorization header.
// - client just placed the order (status "new")     → tells the specialist
// - specialist accepted / declined / finished it    → tells the client
// Each status is announced once (mp_orders.tg_notified_status).
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { admin, cors, escapeHtml, json, tg, SITE_URL } from "../_shared/tg.ts";

const statusText: Record<string, string> = {
  accepted: "✅ Мутахассис фармоиши шуморо қабул кард / Специалист принял ваш заказ",
  declined: "❌ Мутахассис фармоишро рад кард / Специалист отклонил заказ",
  done: "🎉 Фармоиш анҷом ёфт! Акнун шарҳ навишта метавонед / Заказ выполнен! Оставьте отзыв",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization") ?? "";
  const { order_id } = await req.json().catch(() => ({}));
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
