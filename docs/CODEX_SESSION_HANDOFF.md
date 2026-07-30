# Codex Session Handoff

Updated: 2026-07-28

## Resume instructions

Start the next Codex session in `/Users/takuro/surviver` and send:

> `AGENTS.md`、`TODO.md`、`docs/AI_HANDOFF.md`、`docs/CODEX_SESSION_HANDOFF.md` を読んで、`git status --short` を確認してください。既存の未コミット変更はCursorの作業なので変更・削除・巻き戻しをせず、現在の状態と次に行うべき作業だけを報告してください。

Do not ask the next session to implement anything until Cursor has finished its
current work and the user has identified the next task.

## Current situation

- Repository: `/Users/takuro/surviver`
- Cursor is currently editing the same repository.
- The worktree contains extensive uncommitted Cursor changes, especially audio
  archival/SFX preview restructuring and related documentation/code.
- Do not restore, reset, clean, stash, overwrite, commit, or include those
  changes without an explicit new user instruction.

## Last completed Codex implementation

- Unified Wind / Water / Fire / Earth / Speed / Power / Range icons.
- Source: Game-icons.net, author Lorc, CC BY 3.0.
- Shared definition: `src/games/survivor/constants/skillIcons.ts`.
- Runtime assets: `public/assets/icons/skills/unified/`.
- Commit: `1e31e4b Unify elemental and core upgrade skill icons`.
- Typecheck, 223 tests, build, browser display, and license records passed at
  completion.

## Last read-only verification

- Seven icon colors are defined in `CORE_SKILL_ICONS`.
- Wind: `#2DD4BF` (turquoise/blue-green; greener color may be preferred).
- Water: `#38BDF8`.
- Fire: `#F97316` (orange rather than red).
- Earth: `#B88952`.
- Speed: `#67E8F9`.
- Power: `#FBBF24`.
- Range: `#C084FC`.
- HUD and Level Up share `createSkillIcon()` and the same color SSoT.
- SVG paths are white; the symbol is tinted dark `#0F172A`, while the
  identifying category color is applied to the common frame/background.
- Verification verdict: `PASS_WITH_NOTES`; no files were changed.

## Codex approval setting

`/Users/takuro/.codex/config.toml` currently contains:

```toml
approval_policy = "never"
sandbox_mode = "workspace-write"
```

Restarting Codex is required for a new process/session to reliably use these
settings. This keeps workspace writes enabled while commands outside the
sandbox fail instead of prompting for approval.

## Previously identified next task

The next planned game task after the icon work was `Full Game Verification`.
However, do not start it automatically: first reconcile this handoff with the
latest `TODO.md`, `docs/AI_HANDOFF.md`, and Cursor's completed work.
