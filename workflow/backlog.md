# Project Backlog

Track planned work as **sprints** — milestone-sized slices of work. Simple sprints can live entirely in this file. When a sprint needs a full spec plus a Granular checklist, add a **sprint detail** document under `workflow/sprints/` (often by running `/sprint-plan` per [`commands/sprint-plan.md`](commands/sprint-plan.md)). Execute detail docs with `/sprint-execute` per [`commands/sprint-execute.md`](commands/sprint-execute.md).

---

## How to use this workflow (starter template)

1. **Add or edit sprints** in the [Current sprints](#current-sprints) section below. Each sprint has a **Goal** and optional milestone checkboxes.
2. **Pick a sprint ID** when you want structured naming and filenames. Prefix letters group the kind of work (see [Sprint ID prefixes](#sprint-id-prefixes)).
3. **Optional detail doc** — For non-trivial work, create `workflow/sprints/sprint-<id>-<slug>.md` using the format in [`commands/sprint-plan.md`](commands/sprint-plan.md). Link it from the backlog with `**Sprint detail:**`.
4. **Execute** — Work through tasks in order. If you use a detail doc, it is the single source of truth for the granular task list.
5. **Finish** — Mark the sprint `DONE` in the backlog when the goal and definition of done are met.

**Rule:** Sprints are meant to run **in order**. Do not start the next sprint until the current one is `DONE` (unless you consciously parallelize — this template assumes one track).

---

## Status values

| Status | Meaning |
|--------|---------|
| `NOT STARTED` | Captured but not begun. |
| `READY` | Unblocked; can be picked up next. |
| `IN FLIGHT` | Active work — prefer showing **remaining** tasks only in summaries. |
| `BLOCKED` | Waiting on a dependency — say what. |
| `PARKED` | Intentionally deferred. |
| `DONE` | Completed and accepted. |

---

## Sprint ID prefixes

Use these prefixes in sprint IDs when you want filenames and task numbering to reflect type (see [`commands/sprint-plan.md`](commands/sprint-plan.md)).

| Prefix | Type | Examples |
|--------|------|----------|
| `F` | Feature — new user-facing functionality | F01, F02 |
| `I` | Infrastructure — upgrades, tooling, refactors | I01 |
| `B` | Bug fix | B01 |
| `D` | Documentation / ADRs | D01 |
| `C` | Client-specific delivery | C01 |

---

## Worked example (read-only)

The repo ships with a filled **example** detail document so you can see the full layout (spec + tasks + task IDs) without affecting your real backlog counts:

- **Sprint detail:** [sprint-f00-starter-workflow-example.md](sprints/sprint-f00-starter-workflow-example.md)

Treat **F00** as documentation only — copy the structure, not the product requirements.

---

## Current sprints

### 01 — Your first real sprint

**Status:** READY  
**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Completed:**  
**Goal:** Ship one small, end-to-end change so the team agrees on how backlog → code → done works.

- [ ] Replace this goal and the tasks below with your actual scope.
- [ ] Optionally run `/sprint-plan` to generate `workflow/sprints/sprint-…-….md` and add a `**Sprint detail:**` line here.
- [ ] Implement and verify.
- [ ] Mark this sprint `DONE` when finished.

---

### F00 — Example detail doc (template only)

**Status:** DONE  
**Created:** 2026-05-12  
**Updated:** 2026-05-12  
**Completed:** 2026-05-12  
**Goal:** Illustrate what a sprint detail file looks like for this repository (not real product work).  
**Sprint detail:** [sprint-f00-starter-workflow-example.md](sprints/sprint-f00-starter-workflow-example.md)

- [x] Example tasks — see the linked file for the full checklist.
