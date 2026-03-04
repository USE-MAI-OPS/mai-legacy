-- Add life_story JSONB column to family_members
-- Stores career, places, education, skills, hobbies, military, milestones
alter table public.family_members
  add column if not exists life_story jsonb default '{}'::jsonb;

-- Add a comment for documentation
comment on column public.family_members.life_story is
  'JSON object containing life resume data: career[], places[], education[], skills[], hobbies[], military, milestones[]';
