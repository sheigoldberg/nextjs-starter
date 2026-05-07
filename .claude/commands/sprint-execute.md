Execute a sprint detail document task-by-task.

## Required Input

Check if a sprint detail file path was provided via $ARGUMENTS or in the message. If not provided, ask:

> "What is the path to the sprint detail document you want to execute? (e.g. `workflow/sprints/sprint-07-leads-management.md`)"

---

## Initial Steps

1. **Read the sprint detail file** from the path provided.
2. **Read the source specification** — the spec is in the top half of the same file. Consult it whenever you need requirements, acceptance criteria, or context for a task.
3. **Identify next incomplete task** — find the first `[ ]` sub-task that is not yet `[x]`.
4. **Announce the branch** — confirm you are on the correct feature branch, or create one:
   - Feature sprints: `feature/sprint-NN-slug`
   - Bug fix sprints: `issue/sprint-NN-slug`
   - Infrastructure sprints: `feature/sprint-NN-slug`

---

## Execution Modes

Ask the user which mode to use before starting:

### Interactive Mode (default)
- Execute **one sub-task at a time**.
- After each sub-task: mark it `[x]`, commit, update the file, then **stop and ask for approval** before proceeding.
- Phrase: "Sub-task NN.N complete. Ready to continue?"

### YOLO Mode
- Execute all tasks continuously without stopping for approval.
- Mark each sub-task `[x]` and commit immediately after completion.
- After ALL tasks: run `pnpm turbo build` until it passes, then ask for permission before creating a PR.

---

## Task Completion Protocol

1. When you finish a **sub-task**: immediately mark it `[x]` in the sprint detail file.
2. If **all sub-tasks** under a parent task are `[x]`: mark the parent `[x]` too.
3. Commit after each sub-task with a message referencing the task number:
   ```
   feat(sprint-NN): task NN.N — brief description
   ```

---

## Relevant Files

Maintain the `## Relevant Files` section in the sprint detail document:
- Add every file created or modified.
- Keep descriptions accurate and up to date.

---

## Git Workflow

### Branch creation (first step, before any work)
```bash
# Feature / infra
git checkout -b feature/sprint-NN-slug

# Bug fix
git checkout -b issue/sprint-NN-slug
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
- In YOLO mode: when all tasks are done and build passes, prompt — "All tasks complete and build passing. Would you like me to create a PR?"
- Only create the PR after the user confirms.
- User reviews, merges, and deletes the branch on GitHub — the AI does not do this.
