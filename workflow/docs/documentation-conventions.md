# Documentation Conventions

Rules for keeping documentation accurate as the monorepo evolves.

---

## When to Update Documentation

### Rule: Same commit as any public API change

Whenever you modify a package's public API (exports, function signatures, component props, router procedures), the package's `README.md` changelog must be updated in the same commit.

**What counts as a public API change:**
- Adding, removing, or renaming an export in `src/index.ts`
- Changing the signature of an exported function, component, or hook
- Adding or removing a tRPC procedure from a router
- Adding, removing, or renaming a required prop on an exported component
- Adding or removing a Prisma model or field that changes the exported types

**What does NOT require a doc update:**
- Internal refactors (code changes with no API surface change)
- Bug fixes that don't change the API
- Style or formatting changes
- Adding tests

### Rule: Update `CLAUDE.md` when packages or apps are added

When a new package or app is added to the monorepo:
1. Add it to the monorepo map table in `/CLAUDE.md`
2. Add it to the package dependency graph in `workflow/docs/architecture.md`
3. Add links to its new README in `workflow/docs/README.md` (if applicable)
4. Add it to the package summary table in `workflow/docs/package-quick-reference.md`

---

## Changelog Format

Every package README has a `## Changelog` section. Use simple dated bullets.

```markdown
## Changelog

- 2026-06-15: Added `useCreatePost` hook export
- 2026-05-01: `PostForm` now accepts `onCancel` prop (optional)
- 2026-03-10: Removed deprecated `PostEditor` component — use `PostForm` instead
- 2026-02-28: Initial documentation
```

**Format rules:**
- `YYYY-MM-DD: Description of change`
- One bullet per meaningful change
- For breaking changes, prefix with `BREAKING:` — e.g., `2026-06-15: BREAKING: renamed PostEditor to PostForm`
- Most recent entry at the top
- No need to record every minor internal change — only changes that affect consumers

### Last Updated field

Every package README also has a `## Last Updated` field. Update this to today's date whenever you update the README.

```markdown
## Last Updated

2026-06-15
```

---

## Ownership

**Solo project rule:** The developer who changes the package is responsible for updating its documentation in the same PR or commit. There is no separate doc ownership — whoever touches the code touches the docs.

This applies to:
- Package READMEs (`packages/*/README.md`)
- App READMEs (`apps/*/README.md`)
- Root `CLAUDE.md` (for monorepo-level changes)
- `workflow/docs/architecture.md` (for structural changes)

---

## Document Structure Rules

### Package READMEs must follow this section order:

1. `# @repo/package-name`
2. `## Purpose`
3. `## What It Exports`
4. `## Installation`
5. `## Basic Usage`
6. `## When to Use`
7. `## When NOT to Use`
8. `## Dependencies`
9. `## Changelog`
10. `## Last Updated`

Use these exact headings so AI agents can reliably find specific sections.

### All links must be relative paths

```markdown
<!-- CORRECT -->
[architecture.md](./architecture.md)
[deployment.md](./deployment.md)

<!-- WRONG — breaks when files move -->
[architecture.md](https://github.com/user/repo/blob/main/workflow/docs/architecture.md)
```

### Code examples must be complete

No ellipsis (`...`) or placeholder snippets in code blocks. Every example must be copy-pasteable and runnable without modification (substituting only env-specific values like secrets or URLs).

---

## What NOT to Document

- Implementation details that are visible from reading the source — document the "why" not the "what"
- Temporary workarounds — fix them instead of documenting them
- Anything already covered in linked external docs (tRPC, Prisma, NextAuth) — link out instead of duplicating

---

## Adding a New Doc File

1. Create the file in `workflow/docs/`
2. Add it to the navigation table in `workflow/docs/README.md`
3. If it's a key reference (architecture, quick reference, etc.), add a link from `CLAUDE.md`'s deep-dive section
