Take an existing sprint from `workflow/backlog.md` and produce a detailed sprint document in `workflow/sprints/`.

The sprint document combines the full specification (the *why* and *what*) with the granular task list (the *how*) in one file. Once created, the backlog entry is updated with a `**Sprint detail:**` pointer to the new file.

---

## Step 1 — Identify the sprint

Ask the user:

1. **Which sprint?** "Which sprint ID are we planning? (e.g. C01, F02, I01)"
2. **Is this new or existing?** "Does a detail document already exist for this sprint, or are we creating one from scratch?"
   - If a detail doc already exists: read it, ask what needs to change, and update it in place.
   - If not: continue to Step 2.

Read `workflow/backlog.md` to confirm the sprint exists and capture its current goal, status, and any existing task list.

If the user doesn't know the sprint ID yet, read `workflow/backlog.md` to find the next available number for the relevant type (e.g. if C01 and C02 exist, the next client sprint is C03).

---

## Step 2 — Identify the sprint type

The sprint type is encoded in the ID prefix:

| Prefix | Type |
|---|---|
| `F` | Feature — building new user-facing functionality |
| `I` | Infrastructure — upgrades, migrations, refactors, tooling |
| `B` | Bug fix — diagnosing and resolving a specific problem |
| `D` | Documentation / ADR — writing specs, guides, decision records |
| `C` | Client — delivery work for one or more clients (site updates, new pages, new app scaffolds) |

If the user hasn't specified a prefix, confirm the type before proceeding — the prefix must be set before the file is named.

The type drives which clarifying questions are asked in Step 3.

---

## Step 3 — Ask clarifying questions

Adapt questions to the sprint type. Always ask enough to write a complete spec. Do not proceed until you have sufficient detail.

### Feature sprints
- What problem does this solve? Who experiences it?
- What are the core user actions this enables?
- What does "done" look like — what can a user do that they couldn't before?
- What is explicitly out of scope for this sprint?
- Any design constraints, existing components, or packages to use?
- Any dependencies on other sprints or external systems?

### Bug fix / issue sprints
- What is the unexpected behaviour? What should happen instead?
- How do you reproduce it? (step by step)
- Who is affected, and how severely?
- Are there any error messages or logs?
- Any recent changes that might have caused this?
- What does "fixed" look like — how will you verify it's resolved?

### Infrastructure sprints
- What is being upgraded/replaced/refactored, and why now?
- What is the risk if something goes wrong?
- What does a successful migration look like?
- Are there breaking changes? What needs to be updated downstream?
- Any rollback plan needed?

### Documentation / ADR sprints
- What decision or knowledge is being captured?
- Who is the audience?
- What triggered this — a conversation, a completed sprint, a recurring confusion?

### Client sprints
- Which client(s) is this work for? List each one.
- For each client: what changes are needed? (new pages, content updates, UI changes, new app scaffold, etc.)
- Are any changes to shared packages, or is all work app-specific?
- What does "done" look like for each client — what can they see or use that they couldn't before?
- Are there any client deadlines or commitments driving this sprint?
- Any dependencies on foundational sprints that must land first?
- What is explicitly out of scope (deferred to a later client sprint)?

---

## Step 4 — Confirm the execution mode

Based on the sprint type, suggest a default execution mode and ask the user to confirm:

| Sprint type | Default mode | Rationale |
|---|---|---|
| F (Feature) | Standard | Requires review and incremental approval |
| C (Client) — new app scaffold | Background | Long-running, autonomous build |
| C (Client) — content / page updates | Standard | Straightforward but benefits from review |
| I (Infrastructure) | Standard | Risk warrants step-by-step oversight |
| B (Bug fix) — small / obvious | Hotfix | No branch needed, commit straight to main |
| B (Bug fix) — complex / uncertain | Standard | Needs isolation and review |
| D (Documentation) | Hotfix | Writing only, no branch needed |

Ask: **"This looks like a [suggested mode] sprint. Does that sound right, or would you like a different mode?"**

The three modes are:
- **Hotfix** — commit directly to `main`, no branch, no worktree, no PR
- **Background** — worktree + autonomous YOLO execution, PR at the end
- **Standard** — worktree + interactive step-by-step execution, PR at the end

Record the confirmed mode in the sprint document as `**Execution mode:** [Hotfix / Background / Standard]`.

---

## Step 5 — Confirm the sprint name slug

Ask: **"What should the slug be for this sprint's filename?"**

The file will be created at: `workflow/sprints/sprint-[id]-[slug].md`

Examples:
- Sprint ID `C01`, slug `orangerehomers-site-build` → `workflow/sprints/sprint-c01-orangerehomers-site-build.md`
- Sprint ID `I01`, slug `prisma-nextauth-upgrade` → `workflow/sprints/sprint-i01-prisma-nextauth-upgrade.md`
- Sprint ID `F02`, slug `automation-sequences` → `workflow/sprints/sprint-f02-automation-sequences.md`

The ID prefix in the filename is always lowercase.

---

## Step 6 — Generate the sprint document

### Phase 1: Write the specification

Draft the full specification section and present it to the user. Ask: "Does this spec look correct? Reply with 'Go' to proceed to the task breakdown."

Wait for confirmation before continuing.

### Phase 2: Generate the task breakdown

Once the spec is approved, generate the task list in two steps:

1. **Parent tasks first** (5–10 high-level phases). Present these and ask: "Do these phases look right? Reply with 'Go' to generate the sub-tasks."
2. **Sub-tasks second** — break each parent task into granular, numbered, actionable sub-tasks once the user confirms.

---

## Sprint document format

Save to `workflow/sprints/sprint-[id]-[slug].md` using this structure:

```markdown
# [ID] — [Sprint Title]

**Status:** [IN FLIGHT / READY / NOT STARTED / BLOCKED / PARKED]
**Created:** YYYY-MM-DD
**Updated:** YYYY-MM-DD
**Completed:**
**Goal:** [One sentence from backlog.md]
**Type:** [Feature / Bug fix / Infrastructure / Documentation / Client]
**Execution mode:** [Hotfix / Background / Standard]
**Blocked by:** [ID]  ← omit if not blocked
**Deadline:** [date]  ← omit if none

---

## Specification

### Overview
[1–2 paragraphs describing the problem and the outcome this sprint delivers]

### Goals
[Numbered list of specific, measurable objectives]

### [Type-specific sections — use whichever apply:]

#### User Stories  ← Feature sprints
#### Problem Description / Expected vs Actual  ← Bug fix sprints
#### Migration Plan / Risk Assessment  ← Infrastructure sprints
#### Decisions Captured  ← Documentation sprints
#### Client Deliverables  ← Client sprints — one sub-section per client listing their specific changes

### Functional Requirements
[Numbered FR-NN list — explicit enough for a developer to implement without asking questions]

### Non-Goals (Out of Scope)
[Bullet list of what this sprint explicitly does not include]

### Technical Considerations
[Dependencies, constraints, packages involved, env vars, migration notes]

### Definition of Done
[Clear criteria — how will you know this sprint is complete?]

---

## Relevant Files

- `path/to/file.ts` — brief description of what changes or gets created

---

## Tasks

- [ ] [ID].1 First task
  - [ ] [ID].1.1 Sub-task
  - [ ] [ID].1.2 Sub-task
- [ ] [ID].2 Second task
  - [ ] [ID].2.1 Sub-task
```

Task numbers use `[ID].[N]` notation — e.g. `C01.3`, `F02.7`, `I01.12`.

---

## Step 7 — Update backlog.md

After the file is saved, update the sprint's entry in `workflow/backlog.md`:

1. Add a `**Sprint detail:**` line immediately after the `**Goal:**` line (or after `**Deadline:**` if present):

```markdown
**Sprint detail:** [sprint-c01-orangerehomers-site-build.md](sprints/sprint-c01-orangerehomers-site-build.md)
```

2. Add or update the timestamp fields immediately after `**Status:**`:

```markdown
**Created:** YYYY-MM-DD
**Updated:** YYYY-MM-DD
**Completed:**
```

Use today's date for `Created` and `Updated` when first creating the sprint entry. Leave `Completed` empty. If the sprint entry already exists in the backlog without timestamps, add all three fields now.

Only modify these two fields. Do not change the sprint's task list, status, or any other content in `backlog.md`.

---

## Step 8 — Confirm

Tell the user:
- The file that was created (`workflow/sprints/sprint-[id]-[slug].md`)
- That `backlog.md` has been updated with the pointer
- That the sprint is ready to execute with `/sprint-execute workflow/sprints/sprint-[id]-[slug].md`
