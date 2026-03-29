import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type { PlanTier, SubscriptionStatus } from "@/types/database";
import Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep subscription state in sync.
 * Verifies the webhook signature, then updates the family's plan_tier
 * and subscription_status based on the event type.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.family_id) {
        const tier = (session.metadata.tier as PlanTier) || "roots";
        await admin
          .from("families")
          .update({
            plan_tier: tier,
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
          })
          .eq("id", session.metadata.family_id);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const status = mapStripeStatus(subscription.status);
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const tier = tierFromPriceId(priceId);

      await admin
        .from("families")
        .update({
          plan_tier: tier,
          stripe_price_id: priceId,
          subscription_status: status,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await admin
        .from("families")
        .update({
          plan_tier: "seedling",
          stripe_subscription_id: null,
          stripe_price_id: null,
          subscription_status: "canceled",
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "trialing":
      return "trialing";
    default:
      return "none";
  }
}

function tierFromPriceId(priceId: string | null): PlanTier {
  if (!priceId) return "seedling";
  if (priceId === process.env.STRIPE_PRICE_LEGACY) return "legacy";
  if (priceId === process.env.STRIPE_PRICE_ROOTS) return "roots";
  return "seedling";
}
