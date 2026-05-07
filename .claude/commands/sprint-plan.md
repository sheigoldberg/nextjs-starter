Take an existing sprint from `workflow/backlog.md` and produce a detailed sprint document in `workflow/sprints/`.

The sprint document combines the full specification (the *why* and *what*) with the granular task list (the *how*) in one file. Once created, the backlog entry is updated with a `**Sprint detail:**` pointer to the new file.

---

## Step 1 — Identify the sprint

Ask the user:

1. **Which sprint?** "Which sprint number are we planning? (e.g. 08)"
2. **Is this new or existing?** "Does a detail document already exist for this sprint, or are we creating one from scratch?"
   - If a detail doc already exists: read it, ask what needs to change, and update it in place.
   - If not: continue to Step 2.

Read `workflow/backlog.md` to confirm the sprint exists and capture its current goal, status, and any existing task list.

---

## Step 2 — Identify the sprint type

Ask: **"What kind of sprint is this?"**

- **Feature** — building new user-facing functionality
- **Bug fix / issue** — diagnosing and resolving a specific problem
- **Infrastructure** — upgrades, migrations, refactors, tooling
- **Documentation / ADR** — writing specs, guides, decision records
- **Client** — delivery work for one or more clients (site updates, new pages, content changes, new client apps); interleaved in the sprint sequence and executed in series like any other sprint

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
- Are any changes to shared packages (`@repo/ui`, `@repo/database`, etc.), or is all work app-specific?
- What does "done" look like for each client — what can they see or use that they couldn't before?
- Are there any client deadlines or commitments driving this sprint?
- Any dependencies on foundational sprints that must land first?
- What is explicitly out of scope (deferred to a later client sprint)?

---

## Step 4 — Confirm the sprint name slug

Ask: **"What should the slug be for this sprint's filename?"**

The file will be created at: `workflow/sprints/sprint-NN-[slug].md`

Example: sprint number `08`, slug `prisma-nextauth-upgrade` → `workflow/sprints/sprint-08-prisma-nextauth-upgrade.md`

---

## Step 5 — Generate the sprint document

### Phase 1: Write the specification

Draft the full specification section and present it to the user. Ask: "Does this spec look correct? Reply with 'Go' to proceed to the task breakdown."

Wait for confirmation before continuing.

### Phase 2: Generate the task breakdown

Once the spec is approved, generate the task list in two steps:

1. **Parent tasks first** (5–10 high-level phases). Present these and ask: "Do these phases look right? Reply with 'Go' to generate the sub-tasks."
2. **Sub-tasks second** — break each parent task into granular, numbered, actionable sub-tasks once the user confirms.

---

## Sprint document format

Save to `workflow/sprints/sprint-NN-[slug].md` using this structure:

```markdown
# Sprint NN — [Sprint Title]

**Status:** [IN FLIGHT / READY / BLOCKED / NOT STARTED]
**Goal:** [One sentence from backlog.md]
**Type:** [Feature / Bug fix / Infrastructure / Documentation]
**Blocked by:** Sprint NN-1  ← omit if not blocked
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

- [ ] 1.0 Parent task title
  - [ ] 1.1 Sub-task description
  - [ ] 1.2 Sub-task description
- [ ] 2.0 Parent task title
  - [ ] 2.1 Sub-task description
```

---

## Step 6 — Update backlog.md

After the file is saved, add a `**Sprint detail:**` line to the sprint's entry in `workflow/backlog.md`, immediately after the `**Goal:**` line (or after `**Deadline:**` if present):

```markdown
**Sprint detail:** `workflow/sprints/sprint-NN-[slug].md`
```

Only add this line. Do not modify the sprint's task list, status, or any other content in `backlog.md`.

---

## Step 7 — Confirm

Tell the user:
- The file that was created (`workflow/sprints/sprint-NN-[slug].md`)
- That `backlog.md` has been updated with the pointer
- That the sprint is ready to execute with `/sprint-execute workflow/sprints/sprint-NN-[slug].md`
