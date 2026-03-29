# Staging Environment Setup

MAI Legacy deploys to a **VPS** with a **separate staging Supabase project** for pre-production testing.

## Architecture

```
PR to main → GitHub Actions CI (lint/test/typecheck)
                              ↓
                   Merge to main → VPS production deploy
```

- **CI workflow** (`ci.yml`): runs lint, typecheck, unit tests, and E2E tests on every PR
- **Production**: deploy `main` branch to the VPS

## Prerequisites

### 1. Create a Staging Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project (e.g., `mai-legacy-staging`)
2. Run the same migrations against the staging project:
   ```bash
   supabase link --project-ref <staging-project-ref>
   supabase db push
   ```
3. Note the project URL, anon key, and service role key

### 2. Configure GitHub Secrets

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `STAGING_SUPABASE_URL` | Staging Supabase project URL |
| `STAGING_SUPABASE_ANON_KEY` | Staging Supabase anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Staging Supabase service role key |
| `STAGING_STRIPE_PUBLISHABLE_KEY` | Stripe **test** publishable key |
| `STAGING_STRIPE_SECRET_KEY` | Stripe **test** secret key |
| `STAGING_STRIPE_WEBHOOK_SECRET` | Stripe staging webhook secret |

### 3. Set VPS Environment Variables

On the VPS, configure the staging environment variables (see `.env.staging.example`). Ensure `NEXT_PUBLIC_APP_URL` matches your staging domain.

## Environment Separation

| Environment | Supabase Project | Stripe Mode | Deploy Trigger |
|------------|-----------------|-------------|----------------|
| Development | Local / dev project | Test | `pnpm dev` |
| Staging | `mai-legacy-staging` | Test | Manual / staging branch |
| Production | `mai-legacy` (prod) | Live | Push to `main` |

## Seed Data for Staging

To populate the staging database with test data:

```bash
# Point at staging Supabase
export NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

pnpm seed:fresh   # clean + seed + embed
```

## Cron Jobs

The following cron endpoints must be called on schedule (configure via system crontab or a process manager on the VPS):

| Schedule | Endpoint | Method |
|----------|----------|--------|
| Every minute | `/api/cron/process-embedding-jobs` | GET |
| Daily 14:00 UTC | `/api/drip/send` | POST |
| Sundays 20:00 UTC | `/api/digest/send` | POST |

All cron endpoints require the `CRON_SECRET` header for authentication.
