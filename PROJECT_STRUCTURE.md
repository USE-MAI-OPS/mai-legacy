# MAI Legacy — Project Structure

> **GitHub:** https://github.com/USE-MAI-OPS/mai-legacy
> **Live:** https://mailegacy.com (VPS: `root@31.97.213.199`)
> **Last audit:** 2026-03-20

---

## Overview

MAI Legacy is a family knowledge SaaS platform — "NotebookLM for families." Families document stories, skills, recipes, lessons, and connections. The Griot (AI brain) synthesizes and answers questions via RAG.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| **Database** | Supabase (PostgreSQL) + pgvector extension |
| **Auth** | Supabase Auth (email + Google OAuth, magic links for invites) |
| **Embeddings** | OpenAI text-embedding-3-small (1536 dimensions) |
| **LLM** | MiniMax M2.5 via OpenRouter API |
| **Email** | Resend |
| **Storage** | Supabase Storage |
| **Hosting** | VPS (Ubuntu), PM2, nginx + Let's Encrypt SSL |
| **Package Manager** | pnpm |

---

## Architecture

### Request Flow
```
Browser → nginx (443/SSL) → PM2 (port 3002) → Next.js App Router
                                                  ├─ Middleware (session refresh, auth redirect)
                                                  ├─ Server Components (data fetching)
                                                  ├─ Server Actions (mutations)
                                                  └─ API Routes (streaming, embeddings)
```

### Multi-Tenant Model
- Every data table has a `family_id` column
- Supabase Row Level Security (RLS) policies enforce isolation
- `get_user_family_ids()` helper function prevents RLS recursion
- Connection chain further limits which family members' data the Griot can access

### RAG Pipeline
```
Entry Created → Chunk (~500 tokens) → OpenAI Embed → pgvector Store
                                                          ↓
User Question → Embed Query → Cosine Similarity Search → Top-K Chunks → LLM Context → Streaming Response
```

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (theme, fonts, Toaster)
│   ├── page.tsx                      # Landing page (public)
│   ├── not-found.tsx                 # 404 page
│   │
│   ├── (auth)/                       # Auth route group (no dashboard nav)
│   │   ├── layout.tsx
│   │   ├── actions.ts                # signup, login, forgotPassword, resetPassword, signOut
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── onboarding/page.tsx       # Create family + first members
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── invite/[id]/page.tsx      # Accept invite
│   │
│   ├── (dashboard)/                  # Protected route group (dashboard nav)
│   │   ├── layout.tsx                # Sidebar nav, family context
│   │   ├── dashboard/page.tsx        # Main dashboard (stats, carousel, traditions)
│   │   ├── entries/
│   │   │   ├── page.tsx              # Browse/filter entries
│   │   │   ├── new/page.tsx          # Create entry (5 type forms)
│   │   │   ├── [id]/page.tsx         # View entry
│   │   │   ├── [id]/edit/page.tsx    # Edit entry
│   │   │   └── import-interview/     # Interview transcript → entries
│   │   ├── family/
│   │   │   ├── page.tsx              # Family overview (cover photo, features, events)
│   │   │   ├── tree/page.tsx         # Legacy Hub (family tree canvas)
│   │   │   ├── invite/page.tsx       # Invite members
│   │   │   ├── settings/page.tsx     # Family settings
│   │   │   ├── member/[id]/page.tsx  # Member profile
│   │   │   └── components/           # Tree-specific components
│   │   ├── griot/page.tsx            # AI chat interface
│   │   ├── goals/page.tsx            # Family goals
│   │   ├── skills/page.tsx           # Skill browser
│   │   ├── profile/page.tsx          # User profile
│   │   ├── settings/page.tsx         # User settings
│   │   └── help/page.tsx             # Help/FAQ
│   │
│   ├── api/
│   │   ├── griot/route.ts            # POST: Streaming RAG chat
│   │   ├── entries/embed/route.ts    # POST: Embed single entry
│   │   ├── entries/re-embed-all/route.ts  # POST: Bulk re-embed (admin)
│   │   └── interview/extract/route.ts     # POST: Extract entries from transcript
│   │
│   ├── auth/callback/route.ts        # OAuth callback handler
│   ├── contact/page.tsx              # Contact (public)
│   ├── demo/page.tsx                 # Demo (public)
│   ├── privacy/page.tsx              # Privacy policy (public)
│   └── terms/page.tsx                # Terms of service (public)
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (25 components)
│   ├── entry-forms/                  # Story, skill, recipe, lesson, connection forms
│   ├── entry-views/                  # Type-specific entry renderers
│   ├── interview/                    # Interview import components
│   ├── tour/                         # Onboarding tour overlay
│   ├── dashboard-nav.tsx             # Sidebar navigation
│   ├── griot-widget.tsx              # Floating AI chat widget
│   ├── chat-message.tsx              # Chat message bubble
│   ├── entry-card.tsx                # Entry card for lists
│   ├── image-upload.tsx              # Image upload with Supabase Storage
│   └── ...                           # Other shared components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client (+ admin client)
│   │   ├── storage.ts                # Storage upload/delete helpers
│   │   └── middleware.ts             # Session refresh + auth redirects
│   ├── rag/
│   │   ├── chunker.ts                # Text chunking (~500 tokens)
│   │   ├── embeddings.ts             # OpenAI embedding generation
│   │   └── search.ts                 # pgvector similarity search
│   ├── interview/
│   │   ├── ai-client.ts              # LLM client for extraction
│   │   ├── chunker.ts                # Transcript chunking
│   │   ├── extract.ts                # Extraction pipeline
│   │   └── types.ts                  # Interview types
│   ├── rate-limit.ts                 # In-memory rate limiter
│   ├── connection-chain.ts           # Family member visibility chain
│   ├── email.ts                      # Resend email service
│   ├── griot.ts                      # Griot system prompt builder
│   ├── active-family.ts              # Client-side family context
│   ├── active-family-server.ts       # Server-side family context
│   ├── get-family-context.ts         # Family context helper
│   ├── entry-type-config.ts          # Entry type metadata
│   ├── entry-utils.ts                # Entry utilities
│   └── utils.ts                      # General utilities (cn, etc.)
│
├── types/
│   └── database.ts                   # Supabase-generated types
│
├── hooks/
│   └── use-mobile.ts                 # Mobile detection hook
│
├── scripts/
│   ├── seed.ts                       # Database seeding
│   ├── seed-data.ts                  # Seed data definitions
│   └── reembed-all.ts                # CLI re-embed script
│
└── middleware.ts                      # Root middleware entry point
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `families` | Family unit | id, name, created_by, plan_tier (seedling/roots/legacy) |
| `family_members` | User ↔ family membership | family_id, user_id, role (admin/member), display_name |
| `entries` | Knowledge entries | family_id, author_id, title, content, type, tags |
| `entry_embeddings` | pgvector embeddings for RAG | entry_id, family_id, chunk_text, embedding (vector 1536), chunk_index |
| `skill_tutorials` | Structured skill steps | entry_id, family_id, steps (JSONB), difficulty_level |
| `griot_conversations` | AI chat history | family_id, user_id, messages (JSONB) |
| `family_invites` | Email invitations | family_id, email, invited_by, role, accepted, expires_at |

### Family Tree Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `family_tree_members` | Genealogy nodes | family_id, display_name, parent_id, parent2_id, spouse_id, relationship_label, linked_member_id, position_x, position_y, connection_type |
| `family_events` | Family events | family_id, title, event_date, location, created_by |
| `event_rsvps` | Event RSVPs | event_id, user_id, status (going/maybe/not_going) |

### Other Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `family_traditions` | Family traditions | family_id, title, description, season |
| `family_goals` | Shared goals | family_id, title, target_date, status |
| `interview_transcripts` | Interview transcripts | family_id, transcript, status, extraction_result |

### RLS Policies
- All tables have RLS enabled
- Family-scoped: users can only access data for families they belong to
- `get_user_family_ids()` security-definer function prevents recursion
- Service role used for embedding writes (bypasses RLS)

---

## API Endpoints

| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|------------|---------|
| POST | `/api/griot` | Required | 20/min | Streaming RAG chat with the Griot |
| POST | `/api/entries/embed` | Required | 10/min | Generate embeddings for a single entry |
| POST | `/api/entries/re-embed-all` | Admin only | 2/min | Bulk re-embed all family entries |
| POST | `/api/interview/extract` | Required | 5/min | Extract entries from interview transcript |
| GET | `/api/auth/callback` | N/A | N/A | OAuth callback handler |

---

## Server Actions (8 files)

| File | Functions |
|------|-----------|
| `(auth)/actions.ts` | signup, login, loginWithGoogle, forgotPassword, resetPassword, signOut |
| `entries/new/actions.ts` | createEntry |
| `entries/[id]/actions.ts` | updateEntry, deleteEntry |
| `entries/import-interview/actions.ts` | saveExtractedEntries |
| `family/actions.ts` | saveNodePosition, addTreeMember, updateTreeMember, deleteTreeMember, createEvent, respondToEvent, deleteEvent |
| `family/settings/actions.ts` | updateFamilyName, sendInvite, removeMember |
| `goals/actions.ts` | createGoal, updateGoal, deleteGoal |
| `settings/actions.ts` | changePassword, updateProfile |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for LLM (MiniMax M2.5) |
| `RESEND_API_KEY` | Yes | Resend API key for email invites |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (e.g. https://mailegacy.com) |
| `GOOGLE_AI_API_KEY` | Optional | Google AI key for alternative embeddings |
| `TRANSCRIPT_AI_PROVIDER` | Optional | Interview extraction provider (openrouter/google) |

---

## Deployment

### Infrastructure
- **Domain:** mailegacy.com
- **VPS:** `root@31.97.213.199` (Ubuntu)
- **Process Manager:** PM2 (`mai-legacy`, port 3002)
- **Reverse Proxy:** nginx with SSL (Let's Encrypt / Certbot)
- **Other services on same VPS:**
  - `maiagentexec.com` (port 3000) — MAI Ops Dashboard
  - `usemai.com` (port 3005) — MAI Marketing Site
  - `dialer.maiagentexec.com` (port 3456) — MAI Dialer

### Deploy Process
```bash
# From local machine
git push origin main

# On VPS
ssh root@31.97.213.199
cd /var/www/mai-legacy
git pull origin main
pnpm install
pnpm build
pm2 restart mai-legacy

# One-liner
ssh root@31.97.213.199 "cd /var/www/mai-legacy && git pull origin main && pnpm install && pnpm build && pm2 restart mai-legacy"
```

### Supabase Migrations
Migrations are in `supabase/migrations/` (001–013). Apply manually via the Supabase Dashboard SQL editor.

---

## Feature Inventory

### P0 — Shipped (Core)
- Family onboarding (create family, set parents, add self to tree)
- Entry creation (5 types: story, skill, recipe, lesson, connection)
- Entry browsing with type filters and search
- The Griot — RAG-powered AI chat
- Family dashboard (stats, recent entries, traditions)
- Authentication (email + Google OAuth)
- Password reset flow

### P1 — Shipped (Extended)
- Legacy Hub (drag-to-place family tree canvas with DNA helix connectors)
- Multi-select + group drag for tree nodes
- Relationship auto-inference (grandparent's child → uncle, etc.)
- Interview import (transcript → structured entries via LLM)
- Family events with RSVP
- Family goals
- Skill tutorials
- Member profiles
- Invite via email + shareable link
- Connection chain (controls who sees what via the Griot)
- Mature content flag
- Image upload to Supabase Storage
- Onboarding tour overlay

### P2 — Planned
- Stripe payment integration (pricing tiers: Seedling/Roots/Legacy)
- Landing page CTAs and conversion optimization
- SEO (meta tags, OG images, sitemap.xml)
- Error monitoring (Sentry)
- Analytics (PostHog/Plausible)
- Onboarding email drip sequence
- Custom domain finalization

---

## Security Measures

- **Headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy
- **Auth:** All server actions verify `getUser()` before mutations
- **RLS:** Supabase Row Level Security on all tables
- **Rate Limiting:** In-memory sliding window on all API routes
- **Password Policy:** Minimum 8 characters, requires uppercase + lowercase + number
- **Secrets:** `.env.local` in `.gitignore`, never committed

---

## Key Files Reference

| Task | File(s) |
|------|---------|
| Add a new page | `src/app/(dashboard)/[feature]/page.tsx` |
| Add a server action | `src/app/(dashboard)/[feature]/actions.ts` |
| Add a UI component | `src/components/[name].tsx` or `npx shadcn add [component]` |
| Modify auth flow | `src/app/(auth)/actions.ts` + `src/lib/supabase/middleware.ts` |
| Modify Griot behavior | `src/app/api/griot/route.ts` + `src/lib/griot.ts` |
| Change RAG pipeline | `src/lib/rag/chunker.ts`, `embeddings.ts`, `search.ts` |
| Add database table | `supabase/migrations/[next_number].sql` + `src/types/database.ts` |
| Modify family tree | `src/app/(dashboard)/family/components/legacy-hub*.tsx` |
| Deploy | `git push` then SSH deploy command above |
