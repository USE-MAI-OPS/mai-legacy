import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session so the user can
 * manage their subscription, update payment method, or cancel.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Must be family admin
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      { error: "Only family admins can manage billing" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: family } = await admin
    .from("families")
    .select("stripe_customer_id")
    .eq("id", membership.family_id)
    .single();

  if (!family?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe to a plan first." },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: family.stripe_customer_id,
    return_url: `${appUrl}/family/settings`,
  });

  return NextResponse.json({ url: session.url });
}
