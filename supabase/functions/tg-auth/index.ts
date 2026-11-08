// POST { phone, code } → verifies the Telegram code and returns a one-time token_hash.
// The browser exchanges it with supabase.auth.verifyOtp({ type: "magiclink", token_hash }) for a session.
// Works for new accounts (created here) and existing ones (= password recovery).
import { admin, cors, json, normPhone, sha256, PHONE_EMAIL_DOMAIN } from "../_shared/tg.ts";

const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const body = await req.json().catch(() => ({}));
  const phone = normPhone(body.phone);
  const code = String(body.code ?? "").replace(/\D/g, "");
  if (!phone || code.length !== 6) return json({ error: "invalid_input" }, 400);

  const db = admin();
  const { data: row } = await db.from("mp_tg_codes").select("*").eq("phone", phone).maybeSingle();
  if (!row) return json({ error: "no_code" }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.from("mp_tg_codes").delete().eq("phone", phone);
    return json({ error: "expired" }, 400);
  }
  if (row.attempts >= MAX_ATTEMPTS) return json({ error: "too_many_attempts" }, 429);
  if ((await sha256(`${phone}:${code}`)) !== row.code_hash) {
    await db.from("mp_tg_codes").update({ attempts: row.attempts + 1 }).eq("phone", phone);
    return json({ error: "wrong_code" }, 400);
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
  return json({ token_hash: link.data.properties.hashed_token, is_new: !created.error });
});
