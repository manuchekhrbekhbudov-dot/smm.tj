export type Role = "client" | "specialist" | "admin";
export type SpecialistStatus = "pending" | "approved" | "rejected";
export type OrderStatus = "new" | "accepted" | "declined" | "done" | "cancelled";
export type PriceUnit = "project" | "month" | "item" | "hour";

export type Profile = { id: string; role: Role; full_name: string; city: string | null; avatar_url: string | null; created_at: string };

export type Specialist = {
  id: string;
  headline: string;
  bio: string;
  experience_years: number;
  specialties: string[];
  portfolio_links: string[];
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  status: SpecialistStatus;
  reject_reason: string | null;
  rating_avg: number;
  reviews_count: number;
  min_price: number | null;
  created_at: string;
  updated_at: string;
  /** Paid plan (top | standard | premium) and its end; loaded via withPlans(). */
  plan?: string | null;
  plan_until?: string | null;
  profiles?: Pick<Profile, "full_name" | "city" | "avatar_url"> | null;
};

export type Service = { id: string; specialist_id: string; title: string; description: string; price_tjs: number; unit: PriceUnit; created_at: string };

export type Order = {
  id: string; client_id: string; specialist_id: string; service_id: string | null;
  message: string; contact_phone: string; budget_tjs: number | null; status: OrderStatus;
  created_at: string; updated_at: string;
};

export type Review = {
  id: string; order_id: string; client_id: string; specialist_id: string;
  rating: number; text: string; hidden: boolean; created_at: string;
  profiles?: Pick<Profile, "full_name"> | null;
};

/** Public specialist row with joined profile, used by catalog and profile pages. */
export const SPECIALIST_SELECT =
  "id, headline, bio, experience_years, specialties, portfolio_links, telegram, whatsapp, instagram, status, reject_reason, rating_avg, reviews_count, min_price, created_at, updated_at, profiles:mp_profiles!mp_specialists_id_fkey(full_name, city, avatar_url)";

export type PaymentStatus = "checking" | "review" | "approved" | "rejected";
export type Payment = {
  id: string; specialist_id: string; plan: string; amount_tjs: number; receipt_path: string;
  status: PaymentStatus; reason: string | null; transaction_id: string | null;
  ai_result: { amount?: number; currency?: string; recipient_phone_digits?: string; recipient_name?: string; date?: string; transaction_id?: string; notes?: string; signs_of_editing?: boolean } | null;
  created_at: string; decided_at: string | null;
};
