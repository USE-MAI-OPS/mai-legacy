import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe, getStripePriceId } from "@/lib/stripe";
import type { PlanTier } from "@/types/database";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for upgrading to a paid plan.
 * Body: { tier: "roots" | "legacy" }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tier = body.tier as PlanTier;

  if (tier !== "roots" && tier !== "legacy") {
    return NextResponse.json(
      { error: "Invalid tier. Must be 'roots' or 'legacy'." },
      { status: 400 }
    );
  }

  const priceId = getStripePriceId(tier);
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for this tier." },
      { status: 500 }
    );
  }

  // Get the user's family (must be admin)
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "No family found" }, { status: 404 });
  }
  if (membership.role !== "admin") {
    return NextResponse.json(
      { error: "Only family admins can manage billing" },
      { status: 403 }
    );
  }

  // Get or create Stripe customer
  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("id, name, stripe_customer_id")
    .eq("id", membership.family_id)
    .single();

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  let customerId = family.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: family.name,
      metadata: { family_id: family.id, user_id: user.id },
    });
    customerId = customer.id;

    await admin
      .from("families")
      .update({ stripe_customer_id: customerId })
      .eq("id", family.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/family/settings?billing=success`,
    cancel_url: `${appUrl}/pricing?billing=canceled`,
    metadata: { family_id: family.id, tier },
  });

  return NextResponse.json({ url: session.url });
}
