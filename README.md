# nextjs-starter

A production-ready Next.js 14 starter with auth, RBAC, tRPC, Prisma, and a full Claude Code workflow system baked in.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sheigoldberg/nextjs-starter)

---

## What's Included

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| API | tRPC v11 + TanStack Query v5 |
| Database | Prisma 5 + Postgres (Neon in production) |
| Auth | NextAuth v4 — Google OAuth, JWT sessions |
| RBAC | Database-driven roles + permissions + role requests |
| UI | Radix UI + shadcn/ui + Tailwind CSS v3 |
| Forms | React Hook Form + Zod |
| Workflow | Sprint/backlog system + Claude Code slash commands |

### Out-of-the-box pages

- `/` — Landing page
- `/login` — Google sign-in
- `/dashboard` — Protected dashboard shell with sidebar navigation
- `/admin/users` — User management + role assignment
- `/admin/roles` — Role + permission management
- `/admin/role-requests` — Approve/reject role requests
- `/profile/edit` — Edit name, avatar, delete account

---

## Local Setup (5 steps)

**Prerequisites:** Node 20+, npm/pnpm, Docker (for local Postgres)

```bash
# 1. Clone and install
git clone https://github.com/sheigoldberg/nextjs-starter.git my-app
cd my-app
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — fill in NEXTAUTH_SECRET and Google OAuth credentials

# 3. Start local Postgres
npm run db:up

# 4. Push schema + seed
npm run db:push
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Click the **Deploy with Vercel** button above
2. Set environment variables in Vercel dashboard (see `.env.example`)
3. Use [Neon](https://neon.tech) for a free serverless Postgres — paste the connection string as `DATABASE_URL`
4. After first deploy, run `prisma migrate deploy` via Vercel CLI or set up a post-deploy hook

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret into your environment variables

---

## Adding Features

See [CLAUDE.md](CLAUDE.md) for the full quick-decision guide. In short:

1. Add a Prisma model → `prisma/schema.prisma` + `npm run db:push`
2. Add a tRPC router → `src/server/api/routers/` + register in `root.ts`
3. Build UI using `src/components/ui/` primitives
4. Add a route under `src/app/(dashboard)/`

---

## Workflow System

This starter ships with a sprint-based workflow designed for use with [Claude Code](https://claude.ai/code).

- **[`workflow/backlog.md`](workflow/backlog.md)** — Your sprint board
- **`/sprint-plan`** — Claude command to plan a sprint from the backlog
- **`/sprint-execute`** — Claude command to execute a sprint detail doc
- **[`workflow/docs/`](workflow/docs/README.md)** — Architecture and pattern docs

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/
│   ├── ui/           # All shadcn/Radix primitives
│   ├── dashboard/    # Sidebar, DataTable, PageHeader, dialogs
│   ├── admin/        # Admin panel tables and dialogs
│   └── profile/      # Profile form and account management
├── lib/
│   ├── auth/         # NextAuth config, session types, RBAC helpers
│   └── db.ts         # Prisma singleton
├── server/api/       # tRPC routers and root router
└── middleware.ts     # Route protection
```

---

## License

MIT
