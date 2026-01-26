import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";

export type Entitlement = {
  user_id: string;
  plan: string | null;
  premium_until: string | null;
  is_lifetime: boolean | null;
  updated_at: string | null;
  source: string | null;
};

export async function getEntitlements(userId: string) {
  const supabase = await createSupabaseServerClientReadOnly();
  const { data } = await supabase
    .from("entitlements")
    .select("user_id, plan, premium_until, is_lifetime, updated_at, source")
    .eq("user_id", userId)
    .maybeSingle();

  return data as Entitlement | null;
}

export function isPremium(entitlement: Entitlement | null) {
  if (!entitlement) return false;
  if (entitlement.is_lifetime) return true;
  if (!entitlement.premium_until) return false;
  return new Date(entitlement.premium_until) > new Date();
}
