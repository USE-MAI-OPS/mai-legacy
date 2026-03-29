import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily initialize Stripe so builds succeed without STRIPE_SECRET_KEY at compile time */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() — kept for backward compat during migration */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

/** Plan tier definitions with Stripe price IDs and feature limits */
export const PLAN_TIERS = {
  seedling: {
    name: "Seedling",
    description: "Start preserving your family's legacy",
    price: 0,
    priceLabel: "Free",
    limits: {
      entries: 25,
      members: 3,
      storageGb: 1,
      griotMessages: 50,
    },
    features: [
      "Up to 25 legacy entries",
      "3 family members",
      "1 GB storage",
      "50 Griot messages/month",
      "Basic family tree",
    ],
  },
  roots: {
    name: "Roots",
    description: "Grow your family's story together",
    price: 9,
    priceLabel: "$9/mo",
    stripePriceEnv: "STRIPE_PRICE_ROOTS",
    limits: {
      entries: 500,
      members: 15,
      storageGb: 10,
      griotMessages: 500,
    },
    features: [
      "Up to 500 legacy entries",
      "15 family members",
      "10 GB storage",
      "500 Griot messages/month",
      "Advanced family tree",
      "Interview imports",
      "Shared traditions & events",
    ],
  },
  legacy: {
    name: "Legacy",
    description: "The complete family legacy experience",
    price: 19,
    priceLabel: "$19/mo",
    stripePriceEnv: "STRIPE_PRICE_LEGACY",
    limits: {
      entries: -1, // unlimited
      members: -1,
      storageGb: 100,
      griotMessages: -1,
    },
    features: [
      "Unlimited legacy entries",
      "Unlimited family members",
      "100 GB storage",
      "Unlimited Griot messages",
      "Advanced family tree",
      "Interview imports",
      "Shared traditions & events",
      "Priority support",
      "Custom family branding",
    ],
  },
} as const;

export type PlanTierKey = keyof typeof PLAN_TIERS;

/** Get the Stripe price ID for a given tier */
export function getStripePriceId(tier: PlanTierKey): string | null {
  const plan = PLAN_TIERS[tier];
  if (!("stripePriceEnv" in plan)) return null;
  return process.env[plan.stripePriceEnv] ?? null;
}
