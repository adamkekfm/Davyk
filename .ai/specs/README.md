# Specifications (SDD)

Spec-driven development: the spec comes first, code follows.

- Naming: `YYYY-MM-DD-slug.md` (date = creation day, slug = lowercase-kebab-case).
- `.ai/specs/` (this folder) — active specs: draft, approved, or being implemented.
- `.ai/specs/implemented/` — specs fully implemented and verified (move, keep the filename).
- `.ai/specs/archive/` — abandoned, rejected, or superseded specs (move, keep the filename; note the reason at the top).

Suggested header for each spec:

```markdown
# <Title>

- Status: draft | approved | in-progress | implemented | archived
- Created: YYYY-MM-DD
- Supersedes / Superseded by: <spec file or "none">

## Problem
## Requirements
## Design
## Acceptance criteria
## Out of scope
```
