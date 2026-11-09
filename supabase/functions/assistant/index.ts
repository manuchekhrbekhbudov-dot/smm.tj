// SMM.TJ AI assistant for clients and specialists.
// POST { messages: [{ role: "user" | "assistant", content }], locale: "tg" | "ru" } (+ optional Authorization).
// Answers questions about the platform and recommends ONLY real, approved specialists from the database.
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { admin, cors, json, SITE_URL, DIRECTOR_PHONE } from "../_shared/tg.ts";

const PER_HOUR = 30;
const MAX_TURNS = 12;
const MAX_CHARS = 1500;

const PLATFORM = `
SMM.TJ is a marketplace of SMM specialists in Tajikistan (launch: December 1, 2026). Site: ${SITE_URL}/tg/
Facts you may use (do not invent others):
- Clients find a specialist in the catalog (${SITE_URL}/tg/specialists/), open the profile and press "order". Login is by phone number with a code from the Telegram bot @smmtj_login_bot — it takes about a minute.
- Only specialists approved by the director are shown. Prices are set by the specialists themselves.
- After a specialist accepts an order, the client must say whether they hired the specialist. If not, the client gives the reason; until then the client cannot order from another specialist.
- Only a client with a real order can leave a review or a complaint. A detailed honest review can earn the client a gift from the company.
- 2 complaints or 1★ ratings → the specialist is warned. 3 → the specialist is removed from the platform and blocked.
- Specialists register via "Become a specialist", fill the profile and price list, then wait for the director's approval.
- New specialists: 3 good reviews (4–5★) in the first 30 days → 7 days of the "Top" plan free.
- Paid plans for specialists, 30 days: Top 100 TJS, Standard 200 TJS, Premium 300 TJS (badge + higher place in the catalog; Premium also on the home page). Pay by transfer to Alif ${DIRECTOR_PHONE}, then upload the receipt in Cabinet → "Тариф".
- Director / support: ${DIRECTOR_PHONE}. Feedback and suggestions: ${SITE_URL}/tg/feedback/
`;

const system = (locale: string, role: string, catalog: string) => `You are the friendly assistant of SMM.TJ.
Reply in ${locale === "ru" ? "Russian" : "Tajik (Cyrillic)"} unless the user clearly writes in another language; then use theirs.
The user is a ${role}. Keep answers short and practical (a few sentences or a short list). Plain text with Markdown links only.
Help clients describe what they need and pick specialists; help specialists improve their profile, prices and service.
When recommending specialists, use ONLY the catalog below, link each as [Name](${SITE_URL}/tg/specialist/?id=ID), and never invent people, prices, ratings or reviews. If nobody fits, say so and suggest the catalog.
Never ask for passwords, codes or card numbers. For disputes, payments or blocks, refer to the director.
Stay on topic (SMM, marketing, this platform); politely decline unrelated requests.
<platform>${PLATFORM}</platform>
<catalog>
${catalog || "(no approved specialists yet)"}
</catalog>`;

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // GET: is the assistant switched on? (the site hides the chat button until a key is added)
  if (req.method === "GET") return json({ configured: !!Deno.env.get("ANTHROPIC_API_KEY") });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "not_configured" }, 503);

  const body = await req.json().catch(() => ({}));
  const locale = body.locale === "ru" ? "ru" : "tg";
  const raw: unknown[] = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === "object" && ((m as Msg).role === "user" || (m as Msg).role === "assistant") && typeof (m as Msg).content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .filter((m) => m.content.trim());
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "bad_request" }, 400);

  const db = admin();
  let role = "visitor";
  let who = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwt && jwt.split(".").length === 3) {
    const { data } = await db.auth.getUser(jwt);
    if (data?.user) {
      who = data.user.id;
      const { data: p } = await db.from("mp_profiles").select("role, blocked_at").eq("id", data.user.id).maybeSingle();
      if (p?.blocked_at) return json({ error: "blocked" }, 403);
      role = p?.role === "specialist" ? "SMM specialist" : p?.role === "admin" ? "platform director" : "client";
    }
  }

  // Rate limit per user / IP.
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("mp_ai_usage").select("id", { count: "exact", head: true }).eq("key", who).gte("created_at", since);
  if ((count ?? 0) >= PER_HOUR) return json({ error: "rate_limited" }, 429);
  await db.from("mp_ai_usage").insert({ key: who });

  // Real catalog: approved specialists only.
  const { data: specs } = await db.from("mp_specialists")
    .select("id, headline, specialties, experience_years, rating_avg, reviews_count, min_price, plan, plan_until, profiles:mp_profiles!mp_specialists_id_fkey(full_name, city)")
    .eq("status", "approved").order("rating_avg", { ascending: false }).limit(80);
  const catalog = (specs ?? []).map((s) => {
    const p = (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) as { full_name?: string; city?: string } | null;
    const plan = s.plan && s.plan_until && new Date(s.plan_until) > new Date() ? ` | plan: ${s.plan}` : "";
    return `- ID ${s.id} | ${p?.full_name || "—"} | ${p?.city || "-"} | ${(s.specialties ?? []).join(", ")} | ${s.experience_years}y | ` +
      `rating ${Number(s.rating_avg).toFixed(1)} (${s.reviews_count} reviews) | from ${s.min_price ?? "?"} TJS${plan} | ${String(s.headline ?? "").slice(0, 120)}`;
  }).join("\n");

  try {
    const client = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 60_000 });
    // Low-cost model for chat (~0.01 TJS per answer). Haiku 5.5 has no server-side fallback.
    const res = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: system(locale, role, catalog),
      messages,
    });
    if (res.stop_reason === "refusal") return json({ error: "refused" }, 200);
    const text = res.content.filter((b) => b.type === "text").map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    return json({ reply: text });
  } catch (e) {
    console.error("assistant", e instanceof Anthropic.APIError ? e.status : "", e instanceof Error ? e.message : e);
    return json({ error: "ai_error" }, 502);
  }
});
