// Telegram webhook: /start → ask to share contact → verify it is the sender's own number → send a login code.
// GET ?setup=1 registers this function as the bot's webhook (call once after setting TG_BOT_TOKEN).
import { admin, json, normPhone, sha256, tg, TOKEN, webhookSecret, SITE_URL } from "../_shared/tg.ts";

const CODE_TTL_MIN = 10;

const T = {
  welcome:
    "👋 Салом! Ин боти расмии <b>SMM.TJ</b> аст.\n\nБарои гирифтани коди воридшавӣ тугмаи <b>«📱 Фиристодани рақами ман»</b>-ро пахш кунед.\n\n" +
    "Здравствуйте! Чтобы получить код входа, нажмите <b>«📱 Отправить мой номер»</b>.",
  button: "📱 Фиристодани рақами ман / Отправить мой номер",
  notOwn: "⚠️ Лутфан рақами <b>худатонро</b> бо тугмаи поён фиристед.\nПожалуйста, отправьте <b>свой</b> номер кнопкой ниже.",
  code: (c: string) =>
    `🔐 Коди воридшавӣ / Код входа:\n\n<code>${c}</code>\n\nОнро дар сайт ворид кунед. Мӯҳлат: ${CODE_TTL_MIN} дақиқа.\nВведите его на сайте. Действует ${CODE_TTL_MIN} минут.\n\n${SITE_URL}/tg/login/\n\n` +
    "Агар шумо код нахостаед, ин паёмро нодида гиред. / Если вы не запрашивали код — просто игнорируйте.",
};

const contactKeyboard = { keyboard: [[{ text: T.button, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (!TOKEN) return json({ error: "TG_BOT_TOKEN secret is not set" }, 500);

  if (req.method === "GET" && url.searchParams.get("setup") === "1") {
    const hook = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tg-bot`;
    const set = await tg("setWebhook", { url: hook, secret_token: await webhookSecret(), allowed_updates: ["message"] });
    const me = await tg("getMe", {});
    await tg("setMyCommands", { commands: [{ command: "start", description: "Гирифтани код / Получить код" }] });
    return json({ webhook: set, bot: me?.result?.username ?? null });
  }
  if (req.method === "GET") {
    const me = await tg("getMe", {});
    return json({ bot: me?.result?.username ?? null });
  }

  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret())) return json({ ok: false }, 401);

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.chat?.id || msg.chat.type !== "private") return json({ ok: true });
  const chatId = msg.chat.id as number;

  if (msg.contact) {
    // Telegram only lets a user share THEIR OWN number via request_contact; a forwarded card has another user_id.
    if (msg.contact.user_id !== msg.from?.id) {
      await tg("sendMessage", { chat_id: chatId, text: T.notOwn, parse_mode: "HTML", reply_markup: contactKeyboard });
      return json({ ok: true });
    }
    const phone = normPhone(msg.contact.phone_number);
    if (!phone) return json({ ok: true });
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    await admin().from("mp_tg_codes").upsert({
      phone,
      chat_id: chatId,
      code_hash: await sha256(`${phone}:${code}`),
      attempts: 0,
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60000).toISOString(),
      created_at: new Date().toISOString(),
    });
    await tg("sendMessage", { chat_id: chatId, text: T.code(code), parse_mode: "HTML", reply_markup: { remove_keyboard: true }, disable_web_page_preview: true });
    return json({ ok: true });
  }

  // /start or anything else → ask for the contact
  await tg("sendMessage", { chat_id: chatId, text: T.welcome, parse_mode: "HTML", reply_markup: contactKeyboard });
  return json({ ok: true });
});
