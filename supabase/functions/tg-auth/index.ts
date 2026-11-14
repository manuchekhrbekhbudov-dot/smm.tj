// POST { phone, code } → verifies the Telegram code and returns a one-time token_hash.
// The browser exchanges it with supabase.auth.verifyOtp({ type: "magiclink", token_hash }) for a session.
// Works for new accounts (created here) and existing ones (= password recovery).
import { admin, cors, json, normPhone, sha256, PHONE_EMAIL_DOMAIN, isBlocked, tg, SITE_URL } from "../_shared/tg.ts";

const MAX_ATTEMPTS = 5;

const WELCOME =
  `🎉 <b>Табрик!</b> Шумо бомуваффақият ба платформаи <b>SMM.TJ</b> илова шудед.\n\n` +
  `Раҳмат, ки бо мо ҳастед! 💜 SMM.TJ — бозори мутахассисони SMM дар Тоҷикистон: профилҳои санҷидашуда, нархҳои ошкоро ва шарҳҳои воқеӣ.\n\n` +
  `🛍️ <b>Мизоҷ ҳастед?</b> Мутахассиси SMM-и худро ёбед:\n${SITE_URL}/tg/specialists/\n\n` +
  `🚀 <b>Мутахассиси SMM ҳастед?</b> Профил, портфолио ва нархномаи худро пур кунед:\n${SITE_URL}/tg/cabinet/\n\n` +
  `📖 Роҳнамо: ${SITE_URL}/tg/guide/\n` +
  `📞 Савол доред? Директор: +992 50 444 01 01\n` +
  `📸 Instagram: @smm.tjj`;
const LOCK_HOURS = 24;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const body = await req.json().catch(() => ({}));
  const phone = normPhone(body.phone);
  if (!phone) return json({ error: "invalid_input" }, 400);

  const db = admin();
  const { data: row } = await db.from("mp_tg_codes").select("*").eq("phone", phone).maybeSingle();
  const now = Date.now();
  if (await isBlocked(db, phone, row?.chat_id ?? null)) return json({ error: "account_blocked", blocked_account: true }, 403);
  const lockedUntil = row && row.attempts >= MAX_ATTEMPTS && new Date(row.expires_at).getTime() > now ? row.expires_at : null;

  // Status check (no code needed): has the bot sent a code to this number yet? Never reveals the code.
  if (body.check === true) {
    if (lockedUntil) return json({ blocked: true, until: lockedUntil });
    const pending = !!row && row.attempts < MAX_ATTEMPTS && new Date(row.expires_at).getTime() > now;
    return json({ pending, attempts_left: pending ? MAX_ATTEMPTS - row.attempts : MAX_ATTEMPTS });
  }

  const code = String(body.code ?? "").replace(/\D/g, "");
  if (code.length !== 6) return json({ error: "invalid_input" }, 400);
  if (lockedUntil) return json({ error: "blocked", until: lockedUntil }, 429);
  if (!row) return json({ error: "no_code" }, 400);
  if (new Date(row.expires_at).getTime() < now) {
    await db.from("mp_tg_codes").delete().eq("phone", phone);
    return json({ error: "expired" }, 400);
  }
  if ((await sha256(`${phone}:${code}`)) !== row.code_hash) {
    const attempts = row.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      // Lock the number: keep the row as a lock marker until expires_at.
      const until = new Date(now + LOCK_HOURS * 3600000).toISOString();
      await db.from("mp_tg_codes").update({ attempts, expires_at: until, code_hash: "locked" }).eq("phone", phone);
      return json({ error: "blocked", until }, 429);
    }
    await db.from("mp_tg_codes").update({ attempts }).eq("phone", phone);
    return json({ error: "wrong_code", attempts_left: MAX_ATTEMPTS - attempts }, 400);
  }
  await db.from("mp_tg_codes").delete().eq("phone", phone);

  // Link mode: a signed-in user connects Telegram for notifications (no new session).
  if (body.link === true) {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who } = await db.auth.getUser(jwt);
    if (!who?.user) return json({ error: "unauthorized" }, 401);
    await db.from("mp_tg_links").delete().eq("chat_id", row.chat_id).neq("user_id", who.user.id);
    await db.from("mp_tg_links").upsert({ user_id: who.user.id, chat_id: row.chat_id, phone });
    return json({ linked: true });
  }

  const email = `${phone}@${PHONE_EMAIL_DOMAIN}`;
  // Create the account if it does not exist yet (ignore "already registered").
  const created = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) return json({ error: "create_failed" }, 500);

  const link = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error || !link.data?.properties?.hashed_token) return json({ error: "link_failed" }, 500);
  const userId = link.data.user?.id;
  if (userId) {
    await db.from("mp_tg_links").delete().eq("chat_id", row.chat_id).neq("user_id", userId);
    await db.from("mp_tg_links").upsert({ user_id: userId, chat_id: row.chat_id, phone });
  }
  // Brand-new account → welcome + thank-you message in Telegram (Tajik). Never blocks the sign-in.
  if (!created.error && row.chat_id) {
    await tg("sendMessage", { chat_id: row.chat_id, text: WELCOME, parse_mode: "HTML", disable_web_page_preview: true }).catch(() => {});
  }
  return json({ token_hash: link.data.properties.hashed_token, is_new: !created.error });
});
