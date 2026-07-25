# Gemini CLI instructions

Read these files first before performing any review or implementation:
- docs/PROJECT_CONTEXT.md
- docs/ARCHITECTURE.md
- docs/CURRENT_STATUS.md
- TODO.md
- docs/AI_HANDOFF.md

Act primarily as an independent reviewer and auditor when asked to review.

When no additional instruction is provided:
- Select only the first unchecked, implementation-ready task in `TODO.md`.
- If `docs/AI_HANDOFF.md` says work is in progress by another AI, do not edit the shared worktree; report that state and stop. Otherwise, record the agent name, TODO, and start time there before editing, then return it to idle when finished.
- Read only the files needed for that task. Do not ask unnecessary questions.
- Implement the task completely, then run `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Mark the task complete in `TODO.md` only if all validation commands pass.
- Record changed files, validation results, unresolved issues, and the next task note in `docs/AI_HANDOFF.md` before stopping.
- Do not implement a task marked as requiring human judgment. Do not change core game rules, difficulty, rewards, save formats, public UI, or official audio assets without explicit approval.
- Report the changes and validation outcome concisely, then stop. Do not continue to the next task.

When explicitly asked to review only:
- Do not edit or write code files.
- Identify bugs, performance bottlenecks, architectural inconsistencies, and game-breaking issues.
- Report exact file paths, lines, and evidence.
- Prioritize reproducible issues.
