# CLAUDE.md

AI entry point for this project. Read this file first. Deep-dive docs live in [`workflow/docs/`](workflow/docs/README.md).

---

## Stack

**Framework:** Next.js 14 (App Router) | **API:** tRPC v11 + TanStack Query v5 | **Database:** Prisma 5 + Postgres | **Auth:** NextAuth v4 (JWT + Google OAuth) | **UI:** Radix UI + shadcn/ui + Tailwind CSS v3 | **Forms:** React Hook Form + Zod

---

## Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/login/        # Public auth pages
│   ├── (dashboard)/         # Protected routes (middleware-guarded)
│   │   ├── dashboard/       # Main dashboard
│   │   ├── admin/           # Admin panel (ADMIN/SUPER_ADMIN only)
│   │   └── profile/         # User profile
│   ├── api/auth/            # NextAuth handler
│   ├── api/trpc/            # tRPC handler
│   ├── layout.tsx           # Root layout (Providers, Toaster)
│   └── providers.tsx        # Client providers (tRPC, QueryClient, Session, Theme)
│
├── components/
│   ├── ui/                  # All shadcn/Radix primitives — add new components here
│   ├── dashboard/           # AppSidebar, DataTable, PageHeader, EmptyState, dialogs
│   ├── admin/               # RoleManagementTable, UsersTable, RoleRequestsTable
│   └── profile/             # EditProfileForm, DeleteAccountButton
│
├── lib/
│   ├── auth/                # Auth types, hooks, permission helpers, auth-options.ts
│   ├── db.ts                # Prisma singleton client
│   └── utils.ts             # cn(), slugify()
│
├── server/api/
│   ├── trpc.ts              # tRPC init, context, procedures (public/protected/admin)
│   ├── root.ts              # AppRouter — add new routers here
│   └── routers/             # profile, roles, permissions, user-roles, role-requests, invitations
│
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type declarations
├── utils/api.ts             # tRPC React client (api.xxx.useQuery / useMutation)
└── middleware.ts            # Route protection + role enforcement
```

---

## Quick Decision Guide

| I need… | Go to… |
|---|---|
| A button, input, dialog, select, table, toast | `src/components/ui/` |
| Sidebar, DataTable, PageHeader, EmptyState | `src/components/dashboard/` |
| Admin panel tables (users, roles, requests) | `src/components/admin/` |
| User profile form / delete account | `src/components/profile/` |
| Auth session, permission checks, role gates | `src/lib/auth/` |
| Prisma client for DB queries | `src/lib/db.ts` |
| New tRPC API endpoint | `src/server/api/routers/` + register in `root.ts` |
| Custom hook | `src/hooks/` |
| New protected page | `src/app/(dashboard)/` |
| New public page | `src/app/` (outside route groups) |

---

## Adding a New Feature

1. **Add a Prisma model** in `prisma/schema.prisma`, run `npm run db:push`
2. **Create a tRPC router** in `src/server/api/routers/your-feature.ts`
3. **Register it** in `src/server/api/root.ts`
4. **Build UI** using components from `src/components/ui/` (never create new primitives in pages)
5. **Add a route** under `src/app/(dashboard)/your-feature/page.tsx`
6. **Update the sidebar nav** in `src/app/(dashboard)/layout.tsx`

---

## Anti-Patterns — Never Do These

- **Do NOT** create buttons, inputs, dialogs from scratch in a page — add them to `src/components/ui/` first
- **Do NOT** write raw `fetch()` calls for internal data — use tRPC procedures
- **Do NOT** use `prisma` directly in a client component — query through tRPC
- **Do NOT** define auth logic or session handling outside `src/lib/auth/`
- **Do NOT** use `any` for session or permission types — extend the types in `src/lib/auth/types/`

---

## Environment Variables

```bash
# App identity
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_DISPLAY_NAME=
NEXT_PUBLIC_SITE_URL=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Seed (local only)
SEED_ADMIN_EMAIL=
```

---

## Workflow

Work is organised into sprints tracked in [`workflow/backlog.md`](workflow/backlog.md).

### Two-tier structure

| Level | Lives in | Contains |
|---|---|---|
| **Sprint** | `workflow/backlog.md` | Goal, status, 5–10 milestone tasks |
| **Sprint detail** | `workflow/sprints/sprint-NN-name.md` | Full spec + granular `[x]` task list |

### Slash commands

| Command | Purpose |
|---|---|
| `/sprint-plan` | Takes a backlog sprint and produces a detail doc in `workflow/sprints/` |
| `/sprint-execute` | Executes a sprint detail doc task-by-task |

### Sprint rules

- Sprints run sequentially — don't start N+1 until N is DONE
- `IN FLIGHT` → only show remaining tasks
- When a detail doc exists, it is the single source of truth for tasks
- Do not create, delete, or restructure sprints unless explicitly asked

---

## Deep-Dive Docs

| Doc | Purpose |
|---|---|
| [architecture.md](workflow/docs/architecture.md) | File structure and data flow |
| [auth-patterns.md](workflow/docs/auth-patterns.md) | Session types, JWT, protected routes |
| [rbac-patterns.md](workflow/docs/rbac-patterns.md) | Role/permission system, UI gates |
| [ui-patterns.md](workflow/docs/ui-patterns.md) | Component usage, forms, DataTable |
| [data-patterns.md](workflow/docs/data-patterns.md) | Prisma queries, pagination |
| [type-patterns.md](workflow/docs/type-patterns.md) | tRPC types, RouterOutputs |
| [deployment.md](workflow/docs/deployment.md) | Vercel deployment checklist |
