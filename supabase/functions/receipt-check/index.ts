// SMM.TJ — checks an Alif payment receipt for a specialist plan.
// POST { payment_id } with the specialist's (or director's) access token.
// Reads the screenshot with Claude, applies strict rules and either approves the plan
// automatically or hands the payment to the director ("review"). Never trusts the client.
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { admin, cors, json, tg, escapeHtml, SITE_URL } from "../_shared/tg.ts";
import { decide, ALIF_NUMBER, type Reading } from "./rules.ts";

const PLAN_NAMES: Record<string, string> = { top: "Топ", standard: "Стандарт", premium: "Премиум" };

const SCHEMA = {
  type: "object",
  properties: {
    is_payment_receipt: { type: "boolean", description: "True only if the image is a money-transfer receipt / payment confirmation screen from a banking or wallet app." },
    payment_successful: { type: "boolean", description: "True only if the receipt clearly shows the transfer succeeded (e.g. 'Успешно', 'Иҷро шуд', 'Пардохт шуд', green check)." },
    recipient_phone_digits: { type: "string", description: "Recipient phone / account / card number exactly as printed, digits only. Use * for each masked digit. Empty string if not shown." },
    recipient_name: { type: "string", description: "Recipient name as printed, or empty string." },
    amount: { type: "number", description: "Transferred amount (without commission). 0 if not readable." },
    currency: { type: "string", description: "Currency as printed, e.g. TJS, сомонӣ, сомони, USD, RUB. Empty if not shown." },
    date: { type: "string", description: "Payment date as YYYY-MM-DD, or empty string if not shown." },
    transaction_id: { type: "string", description: "Transaction / operation / receipt number, or empty string." },
    signs_of_editing: { type: "boolean", description: "True if anything looks edited or inconsistent: mismatched fonts, misaligned digits, artifacts around numbers, contradictory values." },
    notes: { type: "string", description: "One short sentence about anything unusual. Empty if nothing." },
  },
  required: ["is_payment_receipt", "payment_successful", "recipient_phone_digits", "recipient_name", "amount", "currency", "date", "transaction_id", "signs_of_editing", "notes"],
  additionalProperties: false,
} as const;

const PROMPT = `This image was uploaded as proof of a money transfer to the Alif account ${ALIF_NUMBER} (Tajikistan, phone +992 ${ALIF_NUMBER}).
Read the receipt and fill in the fields exactly as they appear on it. Do not guess values that are not visible.
The receipt text may be in Tajik, Russian or English. Amounts are usually in TJS (сомонӣ).
If the image is not a payment receipt at all, set is_payment_receipt to false and leave the other fields empty/0/false.
Write the notes field in Russian.`;

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>) {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function mediaType(path: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
}

async function readReceipt(apiKey: string, b64: string, type: "image/jpeg" | "image/png" | "image/webp"): Promise<Reading> {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 90_000 });
  const res = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: type, data: b64 } },
        { type: "text", text: PROMPT },
      ],
    }],
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no_text");
  return JSON.parse(text.text) as Reading;
}

async function notifyUser(db: ReturnType<typeof admin>, userId: string, text: string) {
  if (!Deno.env.get("TG_BOT_TOKEN")) return;
  const { data } = await db.from("mp_tg_links").select("chat_id").eq("user_id", userId).maybeSingle();
  if (data?.chat_id) await tg("sendMessage", { chat_id: data.chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }).catch(() => {});
}

async function notifyDirector(db: ReturnType<typeof admin>, text: string) {
  const { data } = await db.from("mp_profiles").select("id").eq("role", "admin");
  for (const a of data ?? []) await notifyUser(db, a.id, text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const db = admin();

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await db.auth.getUser(jwt);
  if (!auth?.user) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const id = String(body.payment_id ?? "");

  const { data: pay } = await db.from("mp_payments").select("*").eq("id", id).maybeSingle();
  if (!pay) return json({ error: "not_found" }, 404);
  const { data: me } = await db.from("mp_profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (pay.specialist_id !== auth.user.id && me?.role !== "admin") return json({ error: "forbidden" }, 403);
  if (pay.status !== "checking") return json({ status: pay.status, reason: pay.reason });

  const finish = async (status: string, reason: string, extra: Record<string, unknown> = {}) => {
    const { error } = await db.from("mp_payments").update({ status, reason: reason || null, ...extra }).eq("id", id).eq("status", "checking");
    if (error) {
      // e.g. the transaction id was already used by an approved payment
      if (String(error.message).includes("mp_payments_tx_uniq")) {
        await db.from("mp_payments").update({ status: "rejected", reason: "duplicate", ai_result: extra.ai_result ?? null }).eq("id", id).eq("status", "checking");
        status = "rejected"; reason = "duplicate";
      } else {
        await db.from("mp_payments").update({ status: "review", reason: "db_error" }).eq("id", id).eq("status", "checking");
        status = "review"; reason = "db_error";
      }
    }
    const { data: prof } = await db.from("mp_profiles").select("full_name").eq("id", pay.specialist_id).maybeSingle();
    const who = escapeHtml(prof?.full_name || "—");
    const planName = PLAN_NAMES[pay.plan];
    if (status === "approved") {
      await notifyUser(db, pay.specialist_id, `✅ Тарифи <b>${planName}</b> фаъол шуд (30 рӯз).\nТариф <b>${planName}</b> активирован на 30 дней.`);
      await notifyDirector(db, `💰 Пардохт қабул шуд: ${who} — ${planName}, ${pay.amount_tjs} TJS (AI).`);
    } else if (status === "review") {
      await notifyUser(db, pay.specialist_id, `🕒 Чеки шумо ба директор барои санҷиш фиристода шуд.\nЧек отправлен директору на проверку.`);
      await notifyDirector(db, `🧾 Чек барои санҷиш: ${who} — ${planName}, ${pay.amount_tjs} TJS.\nСабаб: ${reason}\n${SITE_URL}/tg/admin/`);
    } else {
      await notifyUser(db, pay.specialist_id, `❌ Чек қабул нашуд (${reason}). Лутфан чеки дурустро бор кунед.\nЧек не принят.`);
    }
    return json({ status, reason });
  };

  const file = await db.storage.from("mp-receipts").download(pay.receipt_path);
  if (file.error || !file.data) return finish("rejected", "file_missing");
  const bytes = new Uint8Array(await file.data.arrayBuffer());
  const hash = await sha256Hex(bytes);

  // The same screenshot cannot be used twice.
  const { data: same } = await db.from("mp_payments").select("id").eq("receipt_hash", hash).neq("id", id).neq("status", "rejected").limit(1);
  if (same?.length) return finish("rejected", "duplicate", { receipt_hash: hash });

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return finish("review", "manual", { receipt_hash: hash });

  let reading: Reading;
  try {
    reading = await readReceipt(key, toBase64(bytes), mediaType(pay.receipt_path));
  } catch (e) {
    const msg = e instanceof Anthropic.APIError ? `ai_${e.status ?? "error"}` : "ai_error";
    console.error("receipt-check", msg, e instanceof Error ? e.message : e);
    return finish("review", msg, { receipt_hash: hash });
  }

  const d = decide(reading, pay.plan);
  const tx = reading.transaction_id.trim().slice(0, 100) || null;
  if (tx) {
    const { data: used } = await db.from("mp_payments").select("id").eq("transaction_id", tx).neq("id", id).neq("status", "rejected").limit(1);
    if (used?.length) return finish("rejected", "duplicate", { receipt_hash: hash, ai_result: reading });
  }
  return finish(d.status, d.reason, { receipt_hash: hash, ai_result: reading, transaction_id: tx });
});
