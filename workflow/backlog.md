# nextjs-starter Backlog

Work is organised into sprints. Each sprint has a clear goal and numbered tasks.
Sprint IDs use type-prefixed notation — `F01` = Feature sprint 01, `I01` = Infrastructure sprint 01.
When a sprint is fully complete, move it to `workflow/complete.md`.

**Statuses:** `IN FLIGHT` | `READY` | `NOT STARTED` | `BLOCKED` | `PARKED`

**Sprint types:** `F` Feature | `I` Infrastructure | `B` Bug fix | `D` Documentation | `C` Client

**Sequencing:** Sprints run one at a time regardless of type. The next sprint to start is the lowest-ID unblocked sprint. Cross-type blocking is noted in the `**Blocked by:**` field.

**Timestamps:** `Created` = when the sprint was added to the backlog. `Updated` = last meaningful change to scope or tasks. `Completed` = when all tasks were signed off (empty if not yet complete).

**Slash commands:** `/sprint-plan` to create a detail doc | `/sprint-execute` to run one

**Current execution sequence:** I02

---

## Infrastructure Sprints

### I02 — Infrastructure Upgrade: Prisma 7 + NextAuth v5

**Status:** READY
**Created:** 2026-05-09
**Updated:** 2026-05-13
**Completed:**
**Goal:** Upgrade the starter from Prisma 5 → Prisma 7 and NextAuth v4 → NextAuth v5 (Auth.js) while the app is pre-production.
**Sprint detail:** [sprint-i02-prisma7-nextauth-v5.md](sprints/sprint-i02-prisma7-nextauth-v5.md)

- [ ] Bump Prisma packages to v7; add `prisma.config.ts`; migrate `src/lib/db.ts` to adapter pattern
- [ ] Upgrade `next-auth` to v5; swap adapter; pin `@auth/core` override
- [ ] Update auth config, route handler, middleware, and session helpers to v5 API
- [ ] Rename `NEXTAUTH_SECRET` → `AUTH_SECRET`
- [ ] Build passes with zero type errors; smoke test auth flow ✓

---

## Feature Sprints

_None planned._

---

## Client Sprints

_None planned._

---

## Bug Fix Sprints

_None yet._

---

## Documentation Sprints

_None yet._

---

## Recently Completed

Entries move here when done. Full history is in `workflow/complete.md`.
