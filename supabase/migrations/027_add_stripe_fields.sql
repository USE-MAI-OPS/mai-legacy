-- Add Stripe customer and subscription fields to families table.
--
-- This mirrors 017_stripe_fields.sql, which was never applied to production
-- because it shares migration number 017 with 017_fix_family_id_types.sql
-- (Supabase CLI applies only one file per number, alphabetically first wins).
-- Renumbered to 027 and made fully idempotent so it's safe to run against any
-- environment (prod, staging, freshly-seeded local).

alter table families
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'past_due', 'canceled', 'trialing'));

-- Index for Stripe webhook lookups by customer ID
create index if not exists idx_families_stripe_customer_id
  on families (stripe_customer_id) where stripe_customer_id is not null;
