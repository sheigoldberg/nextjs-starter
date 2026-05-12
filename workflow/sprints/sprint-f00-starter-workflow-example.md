# F00 — Example: “Hello workflow” (template only)

> **Template example:** This file demonstrates the sprint detail format described in [`commands/sprint-plan.md`](../commands/sprint-plan.md). It is not a mandate to build a specific feature — copy the **structure** for your own sprints.

**Status:** DONE  
**Created:** 2026-05-12  
**Updated:** 2026-05-12  
**Completed:** 2026-05-12  
**Goal:** Show how specification, files, and numbered tasks come together in one place.  
**Type:** Documentation (worked example)  
**Execution mode:** Hotfix  

---

## Specification

### Overview

New contributors should see how a sprint detail document ties a one-line backlog goal to a concrete spec and a checkbox task list. This example uses a fictional “greeting” setting to mirror a tiny feature sprint without prescribing real product decisions.

### Goals

1. Demonstrate the sections a real sprint might include: overview, requirements, out of scope, definition of done.
2. Show **task numbering** using the sprint id (`F00.1`, `F00.1.1`, …) as in [`commands/sprint-plan.md`](../commands/sprint-plan.md).
3. List **relevant files** as hints for implementers (your paths will differ).

### User Stories

1. As a developer onboarding to this repo, I can read one file and understand what “done” means for a sprint.
2. As a maintainer, I can duplicate this file, rename it, and replace the content without fighting the format.

### Functional Requirements

1. **FR-01** — The sprint document must include Specification, Relevant Files, and Tasks sections.
2. **FR-02** — Tasks must use the `F00.N` and `F00.N.M` pattern for traceability to this sprint id.
3. **FR-03** — Out-of-scope items must be explicit so scope creep is visible.

### Non-Goals (Out of Scope)

- Changing application code in this template repository (this doc is illustrative).
- Choosing real UX copy or persistence for a “greeting” — substitute your own feature when you copy the file.

### Technical Considerations

- Real feature sprints should link to Prisma models, tRPC routers, and UI routes under `src/` as in `CLAUDE.md`.
- If a sprint is large, prefer **Standard** execution mode (branch + review) over **Hotfix** — see the table in [`commands/sprint-plan.md`](../commands/sprint-plan.md).

### Definition of Done

- [x] A reader can answer: What is delivered? What is excluded? How do tasks map to the goal?
- [x] Task list is complete enough that another developer could execute without re-deriving the plan.

---

## Relevant Files

- `workflow/backlog.md` — High-level sprint list; add `**Sprint detail:**` pointing here for real sprints.
- `workflow/commands/sprint-plan.md` — Instructions the AI (or you) follow to generate this format.
- `workflow/commands/sprint-execute.md` — How to run through tasks sequentially.
- `src/app/(dashboard)/dashboard/page.tsx` — Example area where a real “first feature” might surface UI (replace with your paths).

---

## Tasks

- [x] F00.1 Prepare the sprint shell
  - [x] F00.1.1 Copy this file to `workflow/sprints/sprint-<id>-<slug>.md` for a real sprint.
  - [x] F00.1.2 Add a matching entry to `workflow/backlog.md` with status, goal, and `**Sprint detail:**` link.
- [x] F00.2 Write the real specification
  - [x] F00.2.1 Replace the Overview and Goals with your problem statement and outcomes.
  - [x] F00.2.2 Fill Functional Requirements and Non-Goals for your scope.
  - [x] F00.2.3 Update Definition of Done to match how your team validates work.
- [x] F00.3 Break down execution
  - [x] F00.3.1 Replace task titles with actionable steps for your stack (e.g. schema, API, UI).
  - [x] F00.3.2 Reconcile task IDs with your sprint id (e.g. `F01.1` if the sprint is `F01`).
- [x] F00.4 Close the loop
  - [x] F00.4.1 When finished, set sprint status to `DONE` in `workflow/backlog.md` and fill `**Completed:**` if you use that field.
  - [x] F00.4.2 Archive or delete obsolete draft detail docs so the backlog stays trustworthy.
