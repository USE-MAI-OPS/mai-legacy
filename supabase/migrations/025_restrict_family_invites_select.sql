-- Restrict family_invites SELECT policy (Session 4, Issue 4.1).
-- Previously (009_fix_invite_rls.sql): USING (true) allowed any authenticated
-- user to read every invite in the system.
-- Unauthenticated reads by id for the invite page are now handled server-side
-- via the admin client in src/app/(auth)/invite/[id]/actions.ts.
--
-- Note: migration numbers 002, 017, 018, 019, 020, 021 each have duplicate
-- prefixes in this directory for historical reasons; new migrations use
-- sequential numbers starting at 025.

drop policy if exists "Anyone can view invite by id" on public.family_invites;

create policy "Members can view their family invites"
  on public.family_invites for select
  using (
    -- Members of the inviting family can see all invites for that family
    family_id in (select public.get_user_family_ids())
    -- Invited user (matched by auth email) can see their own invite
    or email = (select email from auth.users where id = auth.uid())
  );
