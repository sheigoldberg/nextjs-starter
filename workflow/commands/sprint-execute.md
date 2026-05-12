Execute a sprint detail document task-by-task.

## Required Input

Check if a sprint detail file path was provided via $ARGUMENTS or in the message. If not provided, ask:

> "What is the path to the sprint detail document you want to execute? (e.g. `workflow/sprints/sprint-07-leads-management.md`)"

---

## Initial Steps

1. **Read the sprint detail file** from the path provided.
2. **Read the source specification** — the spec is in the top half of the same file. Consult it whenever you need requirements, acceptance criteria, or context for a task.
3. **Identify next incomplete task** — find the first `[ ]` sub-task that is not yet `[x]`.
4. **Determine execution mode** — see the Execution Mode section below.

---

## Execution Mode

Check the `**Execution mode:**` field in the sprint document. If set, present it to the user and ask them to confirm. If not set, ask:

> **How should this sprint be executed?**
>
> - **Hotfix** — Small change (< 15 min). Commit directly to `main`. No branch, no worktree, no PR.
> - **Background** — Long-running or autonomous work (e.g. scaffolding a new app). Create a worktree, run all tasks autonomously. PR when done.
> - **Standard** — Feature work, bug fixes, anything requiring review. Create a worktree, step through tasks one at a time. PR when done.

### Hotfix
- Work directly on `main` — no branch, no worktree.
- Commit after completion.
- No PR.

### Background
- Create a worktree (see Git Workflow below) before any work begins.
- Run all tasks autonomously without stopping for approval between sub-tasks.
- Mark each sub-task `[x]` and commit immediately after completion.
- After ALL tasks: run `pnpm turbo build` until it passes.
- Prompt: "All tasks complete and build passing. Would you like me to create a PR?"

### Standard
- Create a worktree (see Git Workflow below) before any work begins.
- Execute **one sub-task at a time**.
- After each sub-task: mark it `[x]`, commit, update the file, then **stop and ask for approval** before proceeding.
- Phrase: "Sub-task NN.N complete. Ready to continue?"
- After ALL tasks: run `pnpm turbo build` until it passes, then ask permission before creating PR.

---

## Task Completion Protocol

1. When you finish a **sub-task**: immediately mark it `[x]` in the sprint detail file.
2. If **all sub-tasks** under a parent task are `[x]`: mark the parent `[x]` too.
3. Commit after each sub-task with a message referencing the task number:
   ```
   feat(sprint-NN): task NN.N — brief description
   ```

## Timestamp Protocol

Each sprint entry in `workflow/backlog.md` has three timestamp fields immediately after `**Status:**`:

```
**Created:** YYYY-MM-DD
**Updated:** YYYY-MM-DD
**Completed:**
```

- **On first task start:** set `Updated` to today's date in `backlog.md`.
- **On all tasks complete:** set `Completed` to today's date in `backlog.md`, then move the entire sprint entry to `workflow/complete.md` (append at the bottom, preserve all content including all three timestamp fields). Remove it from `backlog.md`. Update the `**Current execution sequence:**` line in `backlog.md` to remove the completed sprint ID.

---

## Relevant Files

Maintain the `## Relevant Files` section in the sprint detail document:
- Add every file created or modified.
- Keep descriptions accurate and up to date.

---

## Git Workflow

### Worktree creation (Background and Standard modes only)

Derive the branch prefix from the sprint type ID:

| Sprint type | Prefix |
|---|---|
| F (Feature) | `feature/` |
| C (Client) | `client/` |
| I (Infrastructure) | `infrastructure/` |
| B (Bug fix) | `bug-fix/` |
| D (Documentation) | `documentation/` |

```bash
# Create the worktree on a new branch
git worktree add ../[repo-name]-[slug] [prefix]/sprint-NN-slug

# Bootstrap the worktree
cd ../[repo-name]-[slug]
pnpm install
# Copy .env files for any apps being worked on
```

### Incremental commits (after each sub-task)
```bash
git add [specific files]
git commit -m "feat(sprint-NN): task NN.N — description"
```

### Before PR creation
1. Run `pnpm turbo build` — fix all errors before proceeding.
2. Manually verify the critical user flows affected by this sprint.
3. **Ask user for permission** before creating the PR — never auto-create.

### PR format
```bash
gh pr create --title "feat: Sprint NN — [Sprint Title]" --body "$(cat <<'EOF'
## Summary
- [bullet point summary of what was done]

## Tasks completed
- [x] NN.1 Description
- [x] NN.2 Description

## Test plan
- [ ] [manual verification step]
- [ ] [manual verification step]

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

---

## Interactive Commands Policy

**NEVER** run commands that require interactive prompts:
- `pnpm prisma migrate dev` → ask the user to run this manually
- `npm init`, `pnpm create`, or any wizard-style commands

Safe alternatives:
- `pnpm prisma generate` — non-interactive client generation
- `pnpm prisma migrate deploy` — non-interactive migration apply
- Use the MCP PostgreSQL tool for database verification instead of interactive CLI

---

## MCP Tool Preferences

When available, prefer MCP tools over CLI equivalents:
- **`mcp__postgres__query`** — database verification, constraint checks, data integrity
- **`mcp__filesystem-server__*`** — file operations

---

## PR and Merge Policy

- **NEVER** automatically create a PR without explicit user consent.
- **NEVER** push to main/master directly.
- In Background and Standard modes: when all tasks are done and build passes, prompt — "All tasks complete and build passing. Would you like me to create a PR?"
- Only create the PR after the user confirms.
- User reviews, merges, and deletes the branch on GitHub — the AI does not do this.
