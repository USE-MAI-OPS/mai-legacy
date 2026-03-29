-- Add Stripe customer and subscription fields to families table
alter table families
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'past_due', 'canceled', 'trialing'));

-- Index for webhook lookups by customer ID
create index if not exists idx_families_stripe_customer_id
  on families (stripe_customer_id) where stripe_customer_id is not null;
