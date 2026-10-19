# CLAUDE.md

@AGENTS.md

The imported `AGENTS.md` is the single source of truth for project rules and for the `.ai/` structure. The points below are Claude-specific enforcement; they do not replace it.

## Non-negotiable checklist

Before starting a task:
- [ ] Read `.ai/lessons.md` and apply its standing rules.
- [ ] Find or create the governing spec in `.ai/specs/` (`YYYY-MM-DD-slug.md`) for any non-trivial change.
- [ ] For an autonomous run, create `.ai/runs/YYYY-MM-DD-slug.md` first.

Before declaring a task done:
- [ ] Run log finalized (status, result, verified vs. not verified).
- [ ] Implemented spec moved to `.ai/specs/implemented/` (or abandoned one to `.ai/specs/archive/`).
- [ ] New lesson added to `.ai/lessons/` and indexed in `.ai/lessons.md` if a bug was fixed or anything long-term-worthy was learned.

## Claude Code notes

- Use today's date from the session context for `YYYY-MM-DD`; never guess it.
- If you edit the `.ai/` structure or naming rules, update `AGENTS.md` (not this file) so both stay consistent.
- Keep this file thin: put shared rules in `AGENTS.md`.
