-- Add weekly digest opt-out and unsubscribe token fields to family_members
alter table public.family_members
  add column if not exists digest_opt_out boolean not null default false,
  add column if not exists digest_unsubscribe_token text;

-- Generate unique unsubscribe tokens for existing rows
update public.family_members
set digest_unsubscribe_token = encode(gen_random_bytes(24), 'hex')
where digest_unsubscribe_token is null;

-- Make token required going forward
alter table public.family_members
  alter column digest_unsubscribe_token set not null;

-- Index for fast token lookups on unsubscribe
create index idx_family_members_unsubscribe_token on public.family_members(digest_unsubscribe_token);
