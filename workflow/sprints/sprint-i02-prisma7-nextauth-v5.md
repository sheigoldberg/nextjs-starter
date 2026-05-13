# I02 — Infrastructure Upgrade: Prisma 7 + NextAuth v5

**Status:** READY
**Created:** 2026-05-09
**Updated:** 2026-05-13
**Completed:**
**Goal:** Upgrade the starter from Prisma 5 → Prisma 7 and NextAuth v4 → NextAuth v5 (Auth.js) while the app is pre-production.
**Type:** Infrastructure
**Execution mode:** Standard

---

## Specification

### Overview

The starter ships with Prisma 5 and NextAuth v4. Both have major version upgrades with breaking changes that are cheapest to absorb before any live users or production data exist. Prisma 7 introduces `prisma.config.ts` for datasource configuration and a new adapter-based client setup. NextAuth v5 (Auth.js) renames the package entrypoints, changes the config type, and aligns the route handler export pattern.

### Goals

1. Bump `prisma` and `@prisma/client` to `^7.0.0`
2. Introduce `prisma.config.ts` for datasource URL override
3. Migrate `src/lib/db.ts` to use `PrismaNeon` adapter (`@prisma/adapter-neon@^7.0.0`)
4. Bump `next-auth` to `^5.0.0` and swap `@next-auth/prisma-adapter` → `@auth/prisma-adapter@^2.0.0`
5. Update auth config, route handler, middleware, and session helpers to v5 API
6. Rename `NEXTAUTH_SECRET` → `AUTH_SECRET`
7. Verify the app builds cleanly and auth flow works end-to-end

### Migration Plan

#### Prisma 5 → 7

- Add `prisma.config.ts` at root using `defineConfig` to override `DATABASE_URL` at runtime
- `datasource db { }` block stays in `prisma/schema.prisma` — `@prisma/config`'s `Datasource` type has no `provider` field; provider must stay in schema for native type resolution (`@db.Text`). `prisma.config.ts` overrides the URL at runtime; schema.prisma retains the full block as IDE/LSP source of truth.
- Update `src/lib/db.ts` to use `PrismaNeon` adapter
- Remove `output` directive from the generator block; Prisma 7 generates to `node_modules` by default

#### NextAuth v4 → v5

- Replace `@next-auth/prisma-adapter` with `@auth/prisma-adapter@^2.0.0`
- Update `src/lib/auth/auth-options.ts`: adapter import, `NextAuthOptions` → `NextAuthConfig`, JWT callback signatures
- Update `src/app/api/auth/[...nextauth]/route.ts` to v5 `handlers` export pattern
- Update `src/middleware.ts`: pass `secret` to `getToken()`; typed `UserRole[]` role checks
- Update `src/lib/auth/` session helpers to `NextAuth(config)` init pattern; `getSession()` wrapper; `getCurrentUser()`
- Rename env var `NEXTAUTH_SECRET` → `AUTH_SECRET`

### Risk Assessment

- Breaking change in Prisma 7: `url` moved from schema → `prisma.config.ts`; native type annotations (`@db.Text`) require `provider` to stay in schema
- NextAuth v5 is still beta (`5.0.0-beta.31`); pinned `@auth/core@0.41.2` override needed to resolve peer conflicts
- Low risk overall since app is pre-production with no live users

### Non-Goals

- No schema changes (adding/removing models)
- No OAuth provider changes
- No changes to RBAC or permission logic

### Technical Considerations

- Peer conflict: pin `@auth/core@0.41.2` override in `package.json`
- `prisma.config.ts` uses `@prisma/config`'s `defineConfig` — no `Datasource.provider` field; provider must stay in `schema.prisma`
- Generator `output` directive removed; Prisma 7 generates to `node_modules` by default
- `next-auth` resolved to `5.0.0-beta.31`

### Definition of Done

- `npm run build` completes with zero type errors
- Sign-in flow works; session persists; dashboard protected route accessible
- `NEXTAUTH_SECRET` renamed to `AUTH_SECRET` in `.env.example` and docs

---

## Relevant Files

- `package.json` — bump prisma, next-auth packages; add `@auth/core` override
- `prisma.config.ts` — new file: `defineConfig` with `DATABASE_URL` datasource override
- `prisma/schema.prisma` — remove `output` directive from generator block; remove `url` from datasource block (Prisma 7 requires URL via `prisma.config.ts` only); keep `provider`
- `src/lib/db.ts` — migrate to `PrismaNeon` adapter pattern
- `src/auth.ts` — new file: `NextAuth(authOptions)` init; exports `handlers`, `auth`, `signIn`, `signOut`
- `src/lib/auth/auth-options.ts` — `NextAuthOptions` → `NextAuthConfig`; adapter import; JWT callback signatures
- `src/app/api/auth/[...nextauth]/route.ts` — v5 `handlers` export pattern
- `src/middleware.ts` — pass `secret` to `getToken()`; typed `UserRole[]` role checks
- `src/types/next-auth.d.ts` — verify module augmentation paths unchanged in v5
- `.env.example` — rename `NEXTAUTH_SECRET` → `AUTH_SECRET`
- `CLAUDE.md` — update stack reference from NextAuth v4 → v5, Prisma 5 → 7

---

## Tasks

- [x] I02.1 Upgrade Prisma packages to v7
  - [x] I02.1.1 Bump `prisma` and `@prisma/client` to `^7.0.0` in `package.json`
  - [x] I02.1.2 Add `@prisma/adapter-neon@^7.0.0` to `package.json` dependencies
- [x] I02.2 Add `prisma.config.ts` and update `prisma/schema.prisma`
  - [x] I02.2.1 Create `prisma.config.ts` at project root using `defineConfig` with `DATABASE_URL` datasource override
  - [x] I02.2.2 Remove `output` directive from the `generator client` block in `prisma/schema.prisma`
  - [x] I02.2.3 Retain `datasource db { }` block in `schema.prisma` (provider required for native type resolution)
- [x] I02.3 Update `src/lib/db.ts` for Prisma 7 adapter pattern
  - [x] I02.3.1 Import `PrismaNeon` from `@prisma/adapter-neon` and `neon` from `@neondatabase/serverless`
  - [x] I02.3.2 Replace direct `new PrismaClient()` with adapter-based instantiation using `PrismaNeon`
  - [x] I02.3.3 Verify `log` array and singleton pattern are unchanged
- [x] I02.4 Verify Prisma generates and pushes cleanly
  - [x] I02.4.1 Run `npm run db:generate` and confirm client generates with no errors
  - [x] I02.4.2 Run `npm run db:push` against a dev database and confirm schema applies correctly — N/A: starter template uses placeholder DATABASE_URL; skipped
- [x] I02.5 Upgrade NextAuth packages to v5
  - [x] I02.5.1 Bump `next-auth` to `^5.0.0` in `package.json` (resolves to `5.0.0-beta.31`)
  - [x] I02.5.2 Replace `@next-auth/prisma-adapter` with `@auth/prisma-adapter@^2.0.0`
  - [x] I02.5.3 Pin `@auth/core@0.41.2` override in `package.json` to resolve peer conflicts
  - [x] I02.5.4 Run `npm install` and confirm no unresolved peer dependency errors
- [x] I02.6 Update auth config (`src/lib/auth/auth-options.ts`)
  - [x] I02.6.1 Update adapter import from `@next-auth/prisma-adapter` → `@auth/prisma-adapter`
  - [x] I02.6.2 Replace `NextAuthOptions` type with `NextAuthConfig`
  - [x] I02.6.3 Update JWT callback signatures to match v5 API
- [x] I02.7 Update route handler and middleware
  - [x] I02.7.1 Rewrite `src/app/api/auth/[...nextauth]/route.ts` to use v5 `handlers` export pattern
  - [x] I02.7.2 Update `src/middleware.ts` — pass `secret` to `getToken()`
  - [x] I02.7.3 Update `src/middleware.ts` — typed `UserRole[]` role checks
- [x] I02.8 Update session helpers and type declarations
  - [x] I02.8.1 Update `src/lib/auth/` session helpers to `NextAuth(config)` init pattern
  - [x] I02.8.2 Ensure `getSession()` wrapper and `getCurrentUser()` are compatible with v5
  - [x] I02.8.3 Verify `src/types/next-auth.d.ts` module augmentation paths are unchanged in v5
- [x] I02.9 Update env vars and `.env.example`
  - [x] I02.9.1 Rename `NEXTAUTH_SECRET` → `AUTH_SECRET` in `.env.example`
  - [x] I02.9.2 Update `CLAUDE.md` stack reference (Prisma 5 → 7, NextAuth v4 → v5)
- [ ] I02.10 Build verification and smoke test
  - [ ] I02.10.1 Run `npm run build` — confirm zero type errors
  - [ ] I02.10.2 Smoke test: sign in, session persists, dashboard protected route accessible
