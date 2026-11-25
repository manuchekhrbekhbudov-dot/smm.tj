// Daily report for the director in Telegram, called every evening by GitHub Actions
// (.github/workflows/telegram-daily-report.yml). Sent at most once per day (logged in mp_ai_usage as
// "report:<date>"), and only after 20:00 Dushanbe so a stray early call cannot replace the evening report.
// Income = plan payments approved that day + income the director wrote down; expenses = the director's entries.
import { admin, cors, json, tg, SITE_URL } from "../_shared/tg.ts";

const DIRECTOR_PHONE_DIGITS = "992504440101";
const TZ = 5 * 3600_000; // Asia/Dushanbe, no daylight saving

const dushanbeDate = (ms = Date.now()) => new Date(ms + TZ).toISOString().slice(0, 10);
const startOf = (day: string) => new Date(`${day}T00:00:00+05:00`).toISOString();
const nextDay = (day: string) => dushanbeDate(new Date(`${day}T12:00:00+05:00`).getTime() + 86400_000);
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString("ru-RU").replace(/ /g, " ");
const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n));

/** The signed-in director (used for ?preview=1 and ?day=…, which reveal or resend figures). */
async function isDirector(req: Request, db: ReturnType<typeof admin>) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwt.split(".").length !== 3) return false;
  const { data } = await db.auth.getUser(jwt);
  if (!data?.user) return false;
  const { data: p } = await db.from("mp_profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const db = admin();
  const wantsDay = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day") ?? "");
  const preview = url.searchParams.get("preview") === "1"; // the director's "show today's report" button: text only, nothing sent
  if ((preview || wantsDay) && !(await isDirector(req, db))) return json({ error: "forbidden" }, 403);
  const today = wantsDay ? url.searchParams.get("day")! : dushanbeDate();
  const hour = new Date(Date.now() + TZ).getUTCHours();
  if (!preview && !wantsDay && hour < 20) return json({ ok: true, skipped: "too_early", hour });
  const key = `report:${today}`;
  if (!preview) {
    const { data: done } = await db.from("mp_ai_usage").select("id").eq("key", key).limit(1);
    if (done?.length) return json({ ok: true, skipped: "already_sent" });
  }

  const from = startOf(today), to = startOf(nextDay(today));
  const month = today.slice(0, 7), monthFrom = startOf(`${month}-01`);
  const count = async (table: string, f: (q: any) => any = (q) => q) => {
    const { count: c } = await f(db.from(table).select("id", { count: "exact", head: true }));
    return c ?? 0;
  };
  const between = (q: any, col = "created_at") => q.gte(col, from).lt(col, to);

  const [pays, monthPays, entries, monthEntries, profiles] = await Promise.all([
    db.from("mp_payments").select("amount_tjs, plan").eq("status", "approved").gte("decided_at", from).lt("decided_at", to),
    db.from("mp_payments").select("amount_tjs").eq("status", "approved").gte("decided_at", monthFrom).lt("decided_at", to),
    db.from("mp_finance_entries").select("kind, category, amount_tjs, note").eq("day", today),
    db.from("mp_finance_entries").select("kind, amount_tjs").gte("day", `${month}-01`).lte("day", today),
    db.from("mp_profiles").select("role").gte("created_at", from).lt("created_at", to),
  ]);
  const [orders, chats, complaints, feedback, visits, views, pendingSpecs, pendingPays, approvedSpecs] = await Promise.all([
    count("mp_orders", (q) => between(q)),
    count("mp_conversations", (q) => between(q)),
    count("mp_complaints", (q) => between(q)),
    count("mp_feedback", (q) => between(q)),
    count("mp_visits", (q) => q.eq("day", today)),
    count("mp_profile_views", (q) => q.eq("day", today)),
    count("mp_specialists", (q) => q.eq("status", "pending")),
    count("mp_payments", (q) => q.in("status", ["checking", "review"])),
    count("mp_specialists", (q) => q.eq("status", "approved").is("banned_at", null)),
  ]);

  const sum = (rows: { amount_tjs: number | string }[] | null) => (rows ?? []).reduce((a, r) => a + Number(r.amount_tjs), 0);
  const e = (entries.data ?? []) as { kind: string; category: string; amount_tjs: number; note: string }[];
  const me = (monthEntries.data ?? []) as { kind: string; amount_tjs: number }[];
  const planIncome = sum(pays.data), otherIncome = sum(e.filter((x) => x.kind === "income"));
  const expenses = sum(e.filter((x) => x.kind === "expense"));
  const mIncome = sum(monthPays.data) + sum(me.filter((x) => x.kind === "income"));
  const mExpenses = sum(me.filter((x) => x.kind === "expense"));
  const newClients = (profiles.data ?? []).filter((p) => p.role === "client").length;
  const newSpecs = (profiles.data ?? []).filter((p) => p.role === "specialist").length;
  const [y, m, d] = today.split("-");

  const lines = [
    `📊 <b>Ҳисоботи SMM.TJ — ${d}.${m}.${y}</b>`,
    "",
    `💰 Даромад: <b>${fmt(planIncome + otherIncome)} TJS</b>` +
      (pays.data?.length ? `\n   • тарифҳо: ${fmt(planIncome)} TJS (${pays.data.length} пардохт)` : "") +
      (otherIncome ? `\n   • дигар: ${fmt(otherIncome)} TJS` : ""),
    `💸 Хароҷот: <b>${fmt(expenses)} TJS</b>` +
      e.filter((x) => x.kind === "expense").slice(0, 5).map((x) => `\n   • ${fmt(Number(x.amount_tjs))} — ${x.note || x.category}`).join(""),
    `📈 Фоидаи рӯз: <b>${sign(planIncome + otherIncome - expenses)} TJS</b>`,
    "",
    `👥 Нав: ${newClients} мизоҷ, ${newSpecs} мутахассис`,
    `📦 Фармоиш: ${orders} · 💬 чати нав: ${chats}`,
    `👀 Ташриф ба сайт: ${visits} · дидани профилҳо: ${views}`,
    `⚠️ Шикоят: ${complaints} · 💡 фикр: ${feedback}`,
    "",
    `🕒 Интизори шумо: ${pendingSpecs} профил, ${pendingPays} пардохт`,
    `✅ Мутахассисони фаъол: ${approvedSpecs}`,
    "",
    `📅 <b>Моҳ (${m}.${y})</b>: даромад ${fmt(mIncome)} · хароҷот ${fmt(mExpenses)} · фоида <b>${sign(mIncome - mExpenses)} TJS</b>`,
    "",
    `👉 ${SITE_URL}/tg/admin/?tab=finance`,
  ];
  const text = lines.join("\n");
  if (preview) return json({ ok: true, today, text });

  // Director's Telegram: a linked admin account, otherwise the chat that last asked the bot for the director's code.
  const { data: admins } = await db.from("mp_profiles").select("id").eq("role", "admin");
  const ids = (admins ?? []).map((a) => a.id);
  const { data: links } = ids.length ? await db.from("mp_tg_links").select("chat_id").in("user_id", ids) : { data: [] };
  const chats2 = new Set<number>((links ?? []).map((l) => Number(l.chat_id)));
  if (!chats2.size) {
    const { data: code } = await db.from("mp_tg_codes").select("chat_id").eq("phone", DIRECTOR_PHONE_DIGITS).maybeSingle();
    if (code?.chat_id) chats2.add(Number(code.chat_id));
  }
  if (!chats2.size) return json({ ok: false, error: "director_not_in_telegram" });
  let sent = 0;
  for (const chat_id of chats2) {
    const r = await tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }).catch(() => null);
    if (r?.ok) sent++;
  }
  if (sent) await db.from("mp_ai_usage").insert({ key });
  return json({ ok: sent > 0, sent });
});
