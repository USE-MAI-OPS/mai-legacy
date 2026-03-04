-- Fix infinite recursion in family_members RLS policies.
-- A security-definer function bypasses RLS, breaking the cycle.

create or replace function public.get_user_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

-- Drop the recursive policies
drop policy if exists "Members can view fellow family members" on public.family_members;
drop policy if exists "Family admins can manage members" on public.family_members;

-- Recreate without recursion
create policy "Members can view fellow family members"
  on public.family_members for select
  using (family_id in (select public.get_user_family_ids()));

create policy "Family admins can manage members"
  on public.family_members for delete
  using (
    family_id in (select public.get_user_family_ids())
    and exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.role = 'admin'
    )
  );
