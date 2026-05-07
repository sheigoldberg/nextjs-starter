# Deployment Guide

Deploying apps in this monorepo to Vercel. Each app is a separate Vercel project pointed at the same GitHub repo.

---

## Required: `vercel.json` in every app

Every app **must** have its own `vercel.json` at `apps/<app-name>/vercel.json`. Without it, Vercel falls back to the root `vercel.json` (which has no `buildCommand`) and auto-detects `turbo run build` — building every app in the monorepo on every deploy.

The `buildCommand` must use the app-specific root script so Turborepo only builds that app:

```json
{
  "buildCommand": "cd ../.. && pnpm build:<app-name>",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "PRISMA_SKIP_POSTINSTALL_GENERATE": "true"
  }
}
```

> Omit `PRISMA_SKIP_POSTINSTALL_GENERATE` for apps that don't use Prisma.

The corresponding root script must exist in the root `package.json`:
```json
"build:<app-name>": "turbo run build --filter=<app-name>"
```

---

## Apps

### `apps/sheigoldberg.com`

Portfolio and personal site. Full backend stack: auth, database, tRPC, all feature packages.

**Vercel project settings:**
- Root directory: `apps/sheigoldberg.com`
- Build command: (set via `vercel.json`)

**Environment variables:**
```bash
# App identity
NEXT_PUBLIC_APP_NAME=sheigoldberg.com
NEXT_PUBLIC_SITE_URL=https://sheigoldberg.com

# Database (Neon)
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require

# Auth
AUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=https://sheigoldberg.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GOOGLE_ADS_ID=
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=
NEXT_PUBLIC_META_PIXEL_ID=
```

---

### `apps/acmemortgagegroup.sheigoldberg.com`

Mortgage broker demo site. Full backend stack: auth, database, tRPC, RBAC, dashboard. Canonical reference for a shadcn-first app.

**Vercel project settings:**
- Root directory: `apps/acmemortgagegroup.sheigoldberg.com`
- Build command: (set via `vercel.json`)

**Environment variables:**
```bash
# App identity
NEXT_PUBLIC_APP_NAME=acmemortgagegroup.sheigoldberg.com
NEXT_PUBLIC_SITE_URL=https://acmemortgagegroup.sheigoldberg.com

# Database (Neon)
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require

# Auth
AUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=https://acmemortgagegroup.sheigoldberg.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GOOGLE_ADS_ID=
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=
NEXT_PUBLIC_META_PIXEL_ID=

# CRM
HUBSPOT_ACCESS_TOKEN=
HUBSPOT_PIPELINE_ID=
HUBSPOT_PIPELINE_STAGE_NEW_LEAD=
```

---

### `apps/dayspringgardens.co.za`

Marketing site for a landscaping business.

> ⚠️ **Legacy exception.** This app predates the unified stack and uses local UI primitive copies rather than `@repo/ui`. It also does not use `@repo/auth`, `@repo/database`, or tRPC. It will need to be migrated to align with the unified app pattern in the future. For now, treat it as a standalone Next.js app that happens to live in the monorepo.

**Vercel project settings:**
- Root directory: `apps/dayspringgardens.co.za`
- Build command: (set via `vercel.json`)

**Environment variables:**
```bash
# App identity
NEXT_PUBLIC_APP_NAME=dayspringgardens.co.za
NEXT_PUBLIC_SITE_URL=https://dayspringgardens.co.za

# Analytics (if configured)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Database Setup (Neon)

All full-stack apps use [Neon](https://neon.tech) serverless Postgres in production. Each app gets its own Neon database.

1. Create a new Neon project (or branch) per app
2. Copy the connection string to `DATABASE_URL` in Vercel
3. Run migrations from local after first deploy:
   ```bash
   DATABASE_URL=<production-url> pnpm db:migrate:deploy
   ```

---

## Google OAuth Setup

Create separate OAuth credentials per app in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

For each app:
```
Authorized JavaScript origins:
  https://your-app-domain.com

Authorized redirect URIs:
  https://your-app-domain.com/api/auth/callback/google
```

Copy Client ID and Client Secret to Vercel environment variables.

---

## Deployment Workflow

### Automatic (recommended)

1. Each app is a separate Vercel project connected to the same GitHub repo
2. Vercel uses `vercel.json` in the app directory to scope the build to that app only
3. Push to `main` → Vercel triggers a build only for projects that have changes (via `ignoreBuildStep` or Vercel's monorepo detection)

### Manual

```bash
vercel --prod --cwd apps/sheigoldberg.com
vercel --prod --cwd apps/acmemortgagegroup.sheigoldberg.com
vercel --prod --cwd apps/dayspringgardens.co.za
```

---

## Post-Deployment Checklist

- [ ] `vercel.json` exists in the app directory with a filtered `buildCommand`
- [ ] All required environment variables are set in the Vercel project
- [ ] `DATABASE_URL` points to the correct Neon database
- [ ] `NEXTAUTH_URL` is set to the production domain
- [ ] Google OAuth redirect URIs are configured for the production domain
- [ ] Build succeeds: run `pnpm build:<app-name>` locally first
- [ ] App loads and auth works on the deployed URL

---

## Useful Commands

```bash
# Build a specific app locally before deploying
pnpm build:sheigoldberg.com
pnpm build:acmemortgagegroup.sheigoldberg.com
pnpm build:dayspringgardens.co.za

# Database
pnpm db:generate     # Regenerate Prisma client
pnpm db:push         # Push schema changes (dev only)

# Lint all packages
pnpm lint
```

---

## Troubleshooting

### Build fails: "Invalid environment variables"

The app's env validation (via `@t3-oss/env-nextjs`) runs at build time. Set all required env vars in Vercel **before** deploying.

### Build fails: All apps rebuild on every deploy

Check that the app has a `vercel.json` with a scoped `buildCommand`. Without it Vercel runs `turbo run build` and builds everything. See the [required `vercel.json` section](#required-vercel-json-in-every-app) above.

### Build fails: "Cannot find module '@repo/...'"

Ensure `installCommand` in `vercel.json` is `cd ../.. && pnpm install` (from the monorepo root, not the app directory).
