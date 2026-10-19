# Run logs

One file per autonomous AI run: `YYYY-MM-DD-slug.md` (date = day the run started, slug = lowercase-kebab-case; on collision append `-2`, `-3`).

Create the file at the **start** of the run and keep it updated; finish it before ending the run.

```markdown
# <Run title>

- Date: YYYY-MM-DD
- Agent/model: <name>
- Spec: <.ai/specs/... or "none">
- Status: in-progress | completed | blocked | aborted

## Goal
## Plan
## Actions
Chronological, concise: what was done, files touched, commands run.
## Decisions & assumptions
## Result
What is verified (tests, checks) and what is not.
## Follow-ups
## Lessons
Links to entries added in `.ai/lessons/`, if any.
```
