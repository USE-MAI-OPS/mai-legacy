-- Track which drip onboarding emails have been sent per user
create table if not exists public.drip_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('welcome', 'day3', 'day7')),
  sent_at timestamptz not null default now(),
  unique(user_id, step)
);

create index idx_drip_email_log_user_id on public.drip_email_log(user_id);
create index idx_drip_email_log_step_sent_at on public.drip_email_log(step, sent_at);

-- RLS: no direct user access needed — only service role writes
alter table public.drip_email_log enable row level security;
