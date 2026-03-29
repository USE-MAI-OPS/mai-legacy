-- Waitlist table for pre-launch email capture
create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  source      text not null default 'landing',
  created_at  timestamptz not null default now()
);

-- Only service role can read/write; no public RLS needed (server-side only)
alter table waitlist enable row level security;
