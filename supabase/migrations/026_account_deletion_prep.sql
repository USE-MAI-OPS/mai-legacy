-- Session 1, Issues 1.1 and 1.3.
--
-- 1) Allow user deletion without destroying shared families.
--    families.created_by currently has NO ACTION on delete, so deleting
--    an auth.users row errors if the user ever created a family. Make it
--    nullable + ON DELETE SET NULL so deleteAccount() can complete even
--    when the user created a family that other members still belong to.
--    Remaining admins can reassign ownership later.
--
-- 2) Prevent duplicate family_members rows from the acceptInvite race.
--    Without a UNIQUE constraint on (family_id, user_id), two rapid
--    accept requests can each pass the "already a member" check and both
--    insert. The DB-level constraint makes this impossible and lets the
--    server action detect it via Postgres error code 23505.

-- 1. families.created_by ON DELETE SET NULL
alter table public.families
  drop constraint if exists families_created_by_fkey;

alter table public.families
  alter column created_by drop not null;

alter table public.families
  add constraint families_created_by_fkey
  foreign key (created_by)
  references auth.users (id)
  on delete set null;

-- 2. family_members uniqueness
alter table public.family_members
  add constraint family_members_family_user_unique
  unique (family_id, user_id);
