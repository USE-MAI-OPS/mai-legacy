# Staging Environment Setup

MAI Legacy uses **Vercel Preview Deployments** backed by a **separate staging Supabase project** for pre-production testing.

## Architecture

```
PR to main → GitHub Actions CI (lint/test/typecheck)
                              ↓
                   staging.yml → Vercel Preview Deploy
                              ↓
                   Preview URL posted as PR comment
```

- **CI workflow** (`ci.yml`): runs lint, typecheck, unit tests, and E2E tests on every PR
- **Staging workflow** (`staging.yml`): deploys a Vercel preview with staging env vars on every PR
- **Production**: Vercel auto-deploys `main` branch pushes

## Prerequisites

### 1. Create a Staging Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project (e.g., `mai-legacy-staging`)
2. Run the same migrations against the staging project:
   ```bash
   supabase link --project-ref <staging-project-ref>
   supabase db push
   ```
3. Note the project URL, anon key, and service role key

### 2. Link Vercel Project

1. Install the Vercel CLI: `pnpm add -g vercel`
2. Link the project: `vercel link`
3. Note your **Org ID** and **Project ID** from `.vercel/project.json`

### 3. Configure GitHub Secrets

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token ([create here](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after linking |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after linking |
| `STAGING_SUPABASE_URL` | Staging Supabase project URL |
| `STAGING_SUPABASE_ANON_KEY` | Staging Supabase anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Staging Supabase service role key |
| `STAGING_STRIPE_PUBLISHABLE_KEY` | Stripe **test** publishable key |
| `STAGING_STRIPE_SECRET_KEY` | Stripe **test** secret key |
| `STAGING_STRIPE_WEBHOOK_SECRET` | Stripe staging webhook secret |

### 4. Set Vercel Environment Variables

In **Vercel → Project → Settings → Environment Variables**, add the staging Supabase and Stripe keys scoped to the **Preview** environment. This ensures preview deployments use staging credentials.

## How It Works

1. Open a PR targeting `main`
2. `ci.yml` runs lint, typecheck, unit tests, and E2E tests
3. `staging.yml` builds and deploys a Vercel preview
4. A comment is posted on the PR with the preview URL
5. The preview uses the staging Supabase project and Stripe test keys
6. After merging, Vercel auto-deploys to production from `main`

## Environment Separation

| Environment | Supabase Project | Stripe Mode | Deploy Trigger |
|------------|-----------------|-------------|----------------|
| Development | Local / dev project | Test | `pnpm dev` |
| Staging | `mai-legacy-staging` | Test | PR to `main` |
| Production | `mai-legacy` (prod) | Live | Push to `main` |

## Seed Data for Staging

To populate the staging database with test data:

```bash
# Point at staging Supabase
export NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

pnpm seed:fresh   # clean + seed + embed
```
