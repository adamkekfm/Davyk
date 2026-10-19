# AGENTS.md

Instructions for AI coding agents working in this repository. Read fully before acting.

## Project

Platform for distributing, installing, and updating software for thousands of facilities (see `README.MD`). Product and architecture documents live in `docs/` (mostly in Polish — keep documents in the language of the surrounding files; code, identifiers, and `.ai/` metadata in English).

## The `.ai/` metadata structure (mandatory)

All AI working metadata lives in `.ai/`. Using it is **required**, not optional.

```
.ai/
├── specs/                  # Specifications for spec-driven development (SDD)
│   ├── YYYY-MM-DD-slug.md  #   active specs (draft / approved / in progress)
│   ├── implemented/        #   specs that are fully implemented and verified
│   └── archive/            #   abandoned, rejected, or superseded specs
├── runs/                   # Logs of autonomous AI runs
│   └── YYYY-MM-DD-slug.md  #   one file per run
├── lessons.md              # Index + standing rules distilled from lessons
└── lessons/                # Detailed lessons learned
    └── YYYY-MM-DD-slug.md  #   one file per lesson
```

**Naming:** every file in `specs/`, `runs/`, and `lessons/` is `YYYY-MM-DD-slug.md` — date is today's date (the day the file is created), slug is lowercase-kebab-case ASCII (no Polish diacritics, no spaces). On collision append `-2`, `-3`. Templates are in `.ai/specs/README.md`, `.ai/runs/README.md`, and `.ai/lessons.md`.

### Rules

1. **Start of every task:** read `.ai/lessons.md` (and any lesson it links that is relevant). Apply the standing rules.
2. **Specs (SDD):**
   - Non-trivial features/changes are driven by a spec in `.ai/specs/`. If none exists, write one (or ask the user) before implementing.
   - Implement what the spec says; if the spec is wrong or incomplete, update the spec first, then the code.
   - When fully implemented and verified, move the spec to `.ai/specs/implemented/`. When abandoned or superseded, move it to `.ai/specs/archive/` with the reason at the top. Keep the filename unchanged.
3. **Runs:** every autonomous run (work done without step-by-step user supervision) creates `.ai/runs/YYYY-MM-DD-slug.md` at the start, updates it as work progresses, and finalizes it (status, result, what was and was not verified) before finishing. Reference the spec it implements.
4. **Lessons:** after fixing a bug, hitting a surprising failure, discovering a better approach, or learning anything worth remembering long-term, add `.ai/lessons/YYYY-MM-DD-slug.md` and a line in the index in `.ai/lessons.md`. Deduplicate: update an existing lesson rather than adding a near-copy. Keep entries factual and short.
5. **Never** delete or rewrite history in `runs/` or `lessons/`; correct by adding a new entry or an explicit amendment.
6. Do not store secrets, credentials, or personal data in `.ai/`.
7. Keep `.gitkeep` files in otherwise empty folders; do not remove the folder structure.

## General working rules

- Prefer small, reviewable changes; state assumptions explicitly and mark proposals as proposals.
- Report honestly: say what was verified and what was not.
- Ask before destructive or hard-to-reverse actions.
- Do not commit unless asked.

## Checklist

Before starting a task:
- [ ] Read `.ai/lessons.md` and apply its standing rules.
- [ ] Find or create the governing spec in `.ai/specs/` for any non-trivial change.
- [ ] For an autonomous run, create `.ai/runs/YYYY-MM-DD-slug.md` first.

Before declaring a task done:
- [ ] Run log finalized (status, result, verified vs. not verified).
- [ ] Implemented spec moved to `.ai/specs/implemented/` (or abandoned one to `.ai/specs/archive/`).
- [ ] New lesson added to `.ai/lessons/` and indexed in `.ai/lessons.md` if a bug was fixed or anything long-term-worthy was learned.
- [ ] Used today's date from the session context for `YYYY-MM-DD` — never guessed.
