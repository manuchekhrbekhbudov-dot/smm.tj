// Pure rules for accepting an Alif receipt (no I/O) — shared by the Edge Function and tests.
export const ALIF_NUMBER = "504440101";
export const PRICES: Record<string, number> = { top: 100, standard: 200, premium: 300 };
const MAX_AGE_DAYS = 3;

export type Reading = {
  is_payment_receipt: boolean;
  payment_successful: boolean;
  recipient_phone_digits: string;
  recipient_name: string;
  amount: number;
  currency: string;
  date: string;
  transaction_id: string;
  signs_of_editing: boolean;
  notes: string;
};

/** Today's date in Dushanbe (UTC+5) as YYYY-MM-DD. */
const todayTj = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

export function decide(r: Reading, plan: string): { status: "approved" | "review" | "rejected"; reason: string } {
  const price = PRICES[plan];
  if (!r.is_payment_receipt) return { status: "rejected", reason: "not_receipt" };
  if (!r.payment_successful) return { status: "rejected", reason: "not_successful" };
  const cur = r.currency.toLowerCase();
  const tjs = cur === "" || /tjs|сомон|somon|смн/.test(cur);
  if (!tjs) return { status: "rejected", reason: "wrong_currency" };
  if (!(r.amount >= price)) return { status: "rejected", reason: "amount_low" };

  const digits = r.recipient_phone_digits.replace(/[^\d*]/g, "");
  const plain = digits.replace(/\*/g, "");
  const exact = plain.endsWith(ALIF_NUMBER);
  if (!exact) {
    // A fully printed number that is not ours → wrong recipient. Masked/missing → director decides.
    if (!digits.includes("*") && plain.length >= 9) return { status: "rejected", reason: "wrong_recipient" };
    return { status: "review", reason: "recipient_unclear" };
  }
  if (r.signs_of_editing) return { status: "review", reason: "looks_edited" };
  if (!r.transaction_id.trim()) return { status: "review", reason: "no_transaction_id" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return { status: "review", reason: "no_date" };
  const age = dayDiff(todayTj(), r.date);
  if (age > MAX_AGE_DAYS || age < -1) return { status: "review", reason: "old_date" };
  return { status: "approved", reason: "" };
}

