-- MAI Legacy: Initial Schema
-- Enables pgvector extension for embedding storage and similarity search

create extension if not exists vector with schema extensions;

-- ============================================================================
-- STEP 1: CREATE ALL TABLES (no policies yet — avoids circular deps)
-- ============================================================================

-- FAMILIES
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  plan_tier text not null default 'seedling' check (plan_tier in ('seedling', 'roots', 'legacy')),
  created_at timestamptz not null default now()
);
alter table public.families enable row level security;

-- FAMILY MEMBERS
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null default 'member' check (role in ('admin', 'member')),
  display_name text not null,
  avatar_url text,
  joined_at timestamptz not null default now(),
  unique(family_id, user_id)
);
alter table public.family_members enable row level security;

-- ENTRIES
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  title text not null,
  content text not null,
  type text not null check (type in ('story', 'skill', 'recipe', 'lesson', 'connection', 'general')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.entries enable row level security;

-- Auto-update updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.handle_updated_at();

-- ENTRY EMBEDDINGS (pgvector for RAG)
create table public.entry_embeddings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536) not null,
  chunk_index integer not null default 0
);
alter table public.entry_embeddings enable row level security;

-- HNSW index for fast similarity search
create index on public.entry_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Index for filtering by family
create index idx_entry_embeddings_family on public.entry_embeddings(family_id);

-- Similarity search function used by the RAG pipeline
create or replace function public.match_entry_embeddings(
  query_embedding vector(1536),
  match_family_id uuid,
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  entry_id uuid,
  chunk_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ee.id,
    ee.entry_id,
    ee.chunk_text,
    1 - (ee.embedding <=> query_embedding) as similarity
  from public.entry_embeddings ee
  where ee.family_id = match_family_id
    and 1 - (ee.embedding <=> query_embedding) > match_threshold
  order by ee.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- SKILL TUTORIALS
create table public.skill_tutorials (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  steps jsonb not null default '[]',
  difficulty_level text not null default 'beginner',
  estimated_time text not null default '',
  created_at timestamptz not null default now()
);
alter table public.skill_tutorials enable row level security;

-- GRIOT CONVERSATIONS
create table public.griot_conversations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.griot_conversations enable row level security;

create trigger griot_conversations_updated_at
  before update on public.griot_conversations
  for each row execute function public.handle_updated_at();

-- FAMILY INVITES
create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id),
  role text not null default 'member' check (role in ('admin', 'member')),
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
alter table public.family_invites enable row level security;

-- ============================================================================
-- STEP 2: ADD ALL RLS POLICIES (all tables exist now, no circular deps)
-- ============================================================================

-- FAMILIES policies
create policy "Users can view their own family"
  on public.families for select
  using (
    id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create a family"
  on public.families for insert
  with check (created_by = auth.uid());

create policy "Family admins can update their family"
  on public.families for update
  using (
    id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- FAMILY MEMBERS policies
create policy "Members can view fellow family members"
  on public.family_members for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert themselves as members"
  on public.family_members for insert
  with check (user_id = auth.uid());

create policy "Users can update their own membership"
  on public.family_members for update
  using (user_id = auth.uid());

create policy "Family admins can manage members"
  on public.family_members for delete
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ENTRIES policies
create policy "Family members can view entries"
  on public.entries for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Family members can create entries"
  on public.entries for insert
  with check (
    author_id = auth.uid()
    and family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Authors can update their entries"
  on public.entries for update
  using (author_id = auth.uid());

create policy "Authors can delete their entries"
  on public.entries for delete
  using (author_id = auth.uid());

-- ENTRY EMBEDDINGS policies
create policy "Family members can view embeddings"
  on public.entry_embeddings for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Service role can manage embeddings"
  on public.entry_embeddings for all
  using (true)
  with check (true);

-- SKILL TUTORIALS policies
create policy "Family members can view tutorials"
  on public.skill_tutorials for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Family members can create tutorials"
  on public.skill_tutorials for insert
  with check (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Tutorial authors can update"
  on public.skill_tutorials for update
  using (
    entry_id in (
      select id from public.entries
      where author_id = auth.uid()
    )
  );

-- GRIOT CONVERSATIONS policies
create policy "Users can view their own conversations"
  on public.griot_conversations for select
  using (user_id = auth.uid());

create policy "Users can create conversations"
  on public.griot_conversations for insert
  with check (
    user_id = auth.uid()
    and family_id in (
      select family_id from public.family_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update their own conversations"
  on public.griot_conversations for update
  using (user_id = auth.uid());

-- FAMILY INVITES policies
create policy "Family admins can view invites"
  on public.family_invites for select
  using (
    family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Invited users can view their invites"
  on public.family_invites for select
  using (email = (select email from auth.users where id = auth.uid()));

create policy "Family admins can create invites"
  on public.family_invites for insert
  with check (
    invited_by = auth.uid()
    and family_id in (
      select family_id from public.family_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Invited users can accept invites"
  on public.family_invites for update
  using (email = (select email from auth.users where id = auth.uid()));
