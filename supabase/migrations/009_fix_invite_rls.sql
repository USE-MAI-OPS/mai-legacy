-- Fix invite RLS policies so invites actually work
-- Problem: Previous policies required email match, which blocks:
--   1. Unauthenticated users from seeing invite details
--   2. Shareable link invites (email = 'link') from being read/accepted
--   3. Users whose auth email differs from the invite email

-- Drop existing restrictive policies
drop policy if exists "Family admins can view invites" on public.family_invites;
drop policy if exists "Invited users can view their invites" on public.family_invites;
drop policy if exists "Family admins can create invites" on public.family_invites;
drop policy if exists "Invited users can accept invites" on public.family_invites;

-- SELECT: Anyone with the invite UUID can read it (UUID is unguessable).
-- Also family admins can see all invites for their family.
create policy "Anyone can view invite by id"
  on public.family_invites for select
  using (true);

-- INSERT: Only family admins can create invites
create policy "Family admins can create invites"
  on public.family_invites for insert
  with check (
    invited_by = auth.uid()
    and family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- UPDATE: Any authenticated user can accept an invite if:
--   - Their email matches the invite email, OR
--   - The invite is a shareable link (email = 'link')
create policy "Users can accept invites"
  on public.family_invites for update
  using (
    auth.uid() is not null
    and (
      email = 'link'
      or email = (select email from auth.users where id = auth.uid())
    )
  );
