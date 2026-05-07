# Development Environment Setup

Local setup for the `sheigoldberg-monorepo`.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20.x (LTS) | [nodejs.org](https://nodejs.org) or via `nvm` |
| pnpm | 10.13.1 | `npm install -g pnpm@10.13.1` |

Verify:
```bash
node --version   # v20.x.x
pnpm --version   # 10.13.1
```

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file for the app you're working on
cp apps/sheigoldberg.com/.env.example apps/sheigoldberg.com/.env
# Edit .env — at minimum set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

# 3. Generate Prisma client
pnpm db:generate

# 4. Start dev server
pnpm dev:sheigoldberg.com
```

App runs at **http://localhost:3000**.

---

## Database

Production uses [Neon](https://neon.tech) serverless Postgres. For local development, use a Neon dev branch — it's free, instant to spin up, and avoids running Docker locally.

1. Create a free Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string into your app's `.env` as `DATABASE_URL`
3. Push the schema:
   ```bash
   pnpm db:push
   ```

> If you prefer a local Postgres instance, any Postgres 14+ server works. Just update `DATABASE_URL` accordingly.

---

## Environment Variables

Each app has a `.env.example` at `apps/<app-name>/.env.example`. Copy it to `.env` and fill in:

| Variable | How to get it |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — optional for local dev |

Analytics and CRM vars (`POSTHOG_KEY`, `HUBSPOT_ACCESS_TOKEN`, etc.) are optional for local development — features degrade gracefully when absent.

---

## Per-App Dev Commands

```bash
pnpm dev:sheigoldberg.com
pnpm dev:acmemortgagegroup.sheigoldberg.com
pnpm dev:dayspringgardens.co.za
```

> All apps use port 3000. Only run one at a time locally.

---

## Useful Commands

```bash
# Development
pnpm dev                                      # Run all apps (not recommended — use per-app commands)
pnpm dev:sheigoldberg.com                     # Run single app

# Build (verify before deploying)
pnpm build:sheigoldberg.com
pnpm build:acmemortgagegroup.sheigoldberg.com
pnpm build:dayspringgardens.co.za

# Lint + type-check
pnpm lint
pnpm type-check

# Database
pnpm db:generate       # Regenerate Prisma client after schema changes
pnpm db:push           # Push schema to database (dev only — use migrate for production)
pnpm db:migrate        # Create a migration file
pnpm db:studio         # Open Prisma Studio (database GUI)

# Cleanup
pnpm clean             # Clean build artifacts
```

---

## Verification Checklist

- [ ] `node --version` shows v20.x.x
- [ ] `pnpm --version` shows 10.13.1
- [ ] `pnpm install` completes without errors
- [ ] `.env` file exists for the app you're working on
- [ ] `pnpm db:generate` succeeds
- [ ] `pnpm db:push` succeeds
- [ ] Dev server starts and app loads at http://localhost:3000

---

## Troubleshooting

### "Cannot find module '@repo/...'"
Run `pnpm install` from the monorepo root. Workspace package links are set up during install.

### Prisma client errors after schema changes
Run `pnpm db:generate` to regenerate the Prisma client.

### Type errors in the build
Run `pnpm build:<app-name>` locally to see all type errors before pushing. Fix them before deploying — Vercel builds will fail the same way.
