# Architecture — sheigoldberg-monorepo

High-level architecture of the monorepo: package dependencies, layering, and data flow.

---

## Package Dependency Graph

```
INFRASTRUCTURE (no @repo/* deps)
══════════════════════════════════════════════════════════════

  @repo/typescript-config        @repo/tailwind-config
  (tsconfig presets)             (Tailwind base tokens)
       │                                │
       └──────────────────┬────────────┘
                          │ devDependency → all packages & apps


FOUNDATION
══════════════════════════════════════════════════════════════

  @repo/database
  ├── Prisma schema (single source of truth for all data models)
  ├── Tiptap serialization utilities
  └── Database feature flags
       │
       └── depended on by: auth, auth-config, api-core,
                           api-auth, api-rbac, features-*,
                           apps/sheigoldberg.com


SHARED LIBRARY
══════════════════════════════════════════════════════════════

  @repo/ui                       @repo/auth
  ├── Radix UI primitives        ├── NextAuth type augmentations
  ├── shadcn/ui components       ├── System-level RBAC utilities
  ├── Form wrappers              ├── Database-driven RBAC utilities
  └── cn(), slugify()            ├── Zod auth schemas
       │                         ├── usePermissions, useRoles hooks
       └── depended on by:       └── PermissionGate, AuthButton
           auth, features-*           │
                                      └── depended on by:
                                          auth-config, api-core,
                                          api-rbac, features-dashboard


API LAYER
══════════════════════════════════════════════════════════════

  @repo/api-core
  ├── tRPC instance + transformer
  ├── createTRPCRouter, procedures (public/protected/admin/superAdmin)
  ├── createTRPCContextFactory
  └── requireRole, requirePermission, requireAdminOrPermission middleware
       │
       └── depended on by: api-auth, api-rbac, features-posts,
                           features-lead-generation-assessment

  @repo/api-auth                 @repo/api-rbac
  └── profileRouter              ├── rolesRouter
      (get, update, delete)      ├── permissionsRouter
       │                         ├── roleRequestsRouter
       └── app uses              ├── invitationsRouter
                                 └── userRolesRouter
                                      │
                                      └── app uses


FEATURE LAYER
══════════════════════════════════════════════════════════════

  @repo/features-posts
  ├── PostForm (Tiptap editor)
  ├── ApprovalDialog, RejectionDialog
  ├── usePosts, useTags hooks
  ├── Zod schemas + types
  └── postsRouter (import via path — server only)
       │
       └── depends on: api-core, database, features-dashboard, ui

  @repo/features-dashboard
  ├── /ui  — DashboardLayout, AppSidebar, DataTable, TiptapEditor,
  │           ConfirmDialog, FormDialog, PageHeader, StatusBadge
  ├── /admin — UsersTable, RoleManagementTable, EditUserRolesDialog
  └── /profile — EditProfileForm, DeleteAccountButton, useProfile
       │
       └── depends on: auth, database, ui
       │
       └── depended on by: features-posts

  @repo/features-lead-generation-assessment
  ├── AssessmentFormWithCapture, LandingPage, ResultsPage
  ├── Scoring engine: runAssessment, calculateDiagnosticResult
  ├── Intent profiler, decision engine, view-model factories
  └── assessmentRouter + Resend email (import via path — server only)
       │
       └── depends on: api-core, database, ui


ANALYTICS / CRM LAYER (no @repo/* runtime deps)
══════════════════════════════════════════════════════════════

  @repo/analytics          @repo/posthog              @repo/ad-tags
  └── Constants only       ├── PostHogProvider        ├── AdTagScripts
      EVENTS,              ├── useAnalytics           ├── trackConversion()
      FORM_TYPES,          ├── TrackedLink            └── trackEvent()
      FORM_CATEGORIES,     ├── TrackPageView
      ENV_KEYS             └── TrackingParamsCapture

  @repo/hubspot
  └── createLead()   — creates HubSpot Contact + Deal on form submission


APPS
══════════════════════════════════════════════════════════════

  apps/sheigoldberg.com                 apps/acmemortgagegroup.sheigoldberg.com
  ├── Portfolio + personal site          ├── Mortgage broker demo site
  ├── Full backend stack                 ├── Full backend stack
  ├── tRPC root router (composes all)    ├── tRPC, auth, database, RBAC
  ├── NextAuth handler                   ├── Dashboard + admin panel
  ├── App-specific pages & routes        ├── Analytics + CRM packages
  └── Prisma client singleton            └── Canonical shadcn-first reference app

  apps/dayspringgardens.co.za
  ├── Marketing site (landscaping business)
  ├── ⚠️  Predates the unified stack — uses local UI primitive copies
  ├── Does NOT use @repo/ui, @repo/auth, @repo/database, or tRPC
  └── Pending migration to align with the unified app pattern
```

---

## Layer Summary

| Layer | Packages | Rule |
|---|---|---|
| Infrastructure | `typescript-config`, `tailwind-config` | devDependencies only — never in `dependencies` |
| Foundation | `database` | All data models live here. Apps instantiate their own `PrismaClient`. |
| Shared Library | `ui`, `auth` | No tRPC. UI primitives and auth logic. |
| API Layer | `api-core`, `api-auth`, `api-rbac` | tRPC procedures and middleware. No React. |
| Feature Layer | `features-*` | Full features: components + hooks + types + server router. |
| Apps | `apps/*` | Consume packages. Own pages, routes, and app-specific config. |

---

## Data Flow — Full-Stack App

```
Browser
  │
  ├─── React Component (app or feature package)
  │         │
  │         ├── imports hook from @repo/features-* or @repo/api-*
  │         │
  │         └── TanStack Query calls tRPC endpoint
  │
  └─── Next.js App Router
            │
            ├── src/app/api/trpc/[trpc]/route.ts (tRPC HTTP handler)
            │         │
            │         └── appRouter (src/server/api/root.ts)
            │                   │
            │                   ├── profileRouter    (@repo/api-auth)
            │                   ├── rolesRouter      (@repo/api-rbac)
            │                   ├── postsRouter      (@repo/features-posts)
            │                   ├── assessmentRouter (@repo/features-lead-generation-assessment)
            │                   └── ... (app-specific routers if any)
            │                             │
            │                             └── Prisma Client (app-local singleton)
            │                                       │
            │                                       └── Neon PostgreSQL
            │                                           (schema from @repo/database)
            │
            └── src/app/api/auth/[...nextauth]/route.ts
                      │
                      └── createAuthOptions() from @repo/auth-config
                                │
                                └── Google OAuth → PrismaAdapter → Neon PostgreSQL
```

---

## Shared vs App-Specific — At a Glance

```
packages/                          apps/your-app/src/
─────────────────────────────      ──────────────────────────────────
UI primitives    → @repo/ui        Pages & routes  → app/(general)/
Auth logic       → @repo/auth      App config      → lib/auth.ts
API procedures   → @repo/api-*                       lib/prisma.ts
Features         → @repo/features-*                  server/api/root.ts
Data models      → @repo/database  App components  → components/
Config presets   → typescript-config               (one-off, app-specific)
                   tailwind-config
```

See [`shared-vs-app-specific.md`](./shared-vs-app-specific.md) for the full decision guide.

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **tRPC over REST/GraphQL** | End-to-end type safety with no schema file or codegen step |
| **Feature packages over colocation** | Shared features (`posts`, `dashboard`) usable by multiple apps without duplication |
| **Single Prisma schema** | Prevents model drift — one source of truth in `packages/database/prisma/` |
| **No build step** | Packages export TypeScript source directly (`"main": "./src/index.ts"`) — faster dev loop |
| **`@repo/ui` as only UI source** | Prevents component fragmentation — no local `components/ui/` in any app |
| **Server router path imports** | Feature packages export server routers via direct path to prevent server code bundling into client |
