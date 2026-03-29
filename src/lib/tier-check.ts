import { PLAN_TIERS, type PlanTierKey } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export interface TierCheckResult {
  allowed: boolean;
  currentTier: PlanTierKey;
  requiredTier: PlanTierKey | null;
  currentValue: number;
  limit: number;
}

type LimitKey = keyof (typeof PLAN_TIERS)["seedling"]["limits"];

/**
 * Check whether a family has capacity for a specific resource.
 *
 * @param familyId  - the family to check
 * @param resource  - which limit to check (entries, members, storageGb, griotMessages)
 * @param current   - the current usage count (optional — will be fetched if not provided)
 * @returns TierCheckResult with allowed flag and context
 */
export async function checkTierLimit(
  familyId: string,
  resource: LimitKey,
  current?: number
): Promise<TierCheckResult> {
  const admin = createAdminClient();

  const { data: family } = await admin
    .from("families")
    .select("plan_tier")
    .eq("id", familyId)
    .single();

  const tier = (family?.plan_tier ?? "seedling") as PlanTierKey;
  const limit = PLAN_TIERS[tier].limits[resource];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, currentTier: tier, requiredTier: null, currentValue: current ?? 0, limit };
  }

  // Fetch current count if not provided
  let currentValue = current ?? 0;
  if (current === undefined) {
    if (resource === "entries") {
      const { count } = await admin
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("family_id", familyId);
      currentValue = count ?? 0;
    } else if (resource === "members") {
      const { count } = await admin
        .from("family_members")
        .select("id", { count: "exact", head: true })
        .eq("family_id", familyId);
      currentValue = count ?? 0;
    }
  }

  const allowed = currentValue < limit;

  // Find the minimum tier that would allow this
  let requiredTier: PlanTierKey | null = null;
  if (!allowed) {
    for (const [key, plan] of Object.entries(PLAN_TIERS)) {
      const tierLimit = plan.limits[resource];
      if (tierLimit === -1 || currentValue < tierLimit) {
        requiredTier = key as PlanTierKey;
        break;
      }
    }
  }

  return { allowed, currentTier: tier, requiredTier, currentValue, limit };
}

/**
 * Quick check if a family's tier is at least the required tier.
 */
export async function requireTier(
  familyId: string,
  minimumTier: PlanTierKey
): Promise<{ allowed: boolean; currentTier: PlanTierKey }> {
  const tierOrder: PlanTierKey[] = ["seedling", "roots", "legacy"];

  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("plan_tier")
    .eq("id", familyId)
    .single();

  const current = (family?.plan_tier ?? "seedling") as PlanTierKey;
  const currentIndex = tierOrder.indexOf(current);
  const requiredIndex = tierOrder.indexOf(minimumTier);

  return { allowed: currentIndex >= requiredIndex, currentTier: current };
}
