---
trigger: manual
---

# Goal
Convert "Inbox (Auto-captured)" items in `todo.md` into actionable, detailed backlog specs.

# Workflow (must follow)
1) Open/read `todo.md`.
2) Deduplicate Inbox items (merge similar ones).
3) Prioritize and promote items from Inbox → Backlog.
4) Expand each promoted item into a full spec using the template below.
5) Add a Changelog entry for each item promoted/updated.
6) Leave remaining items in Inbox if they’re too vague; mark them as needing info.

# Prioritization
- P0: blocks core functionality / security / data integrity / crashes
- P1: required for MVP or current milestone
- P2: important improvements / UX polish / refactors
- P3: nice-to-have / long-term

# Groomed item template (Backlog)
Each promoted item MUST use this exact structure:

### [P0|P1|P2|P3] <Short Title>
- **Status:** TODO | BLOCKED | IN-PROGRESS | DONE
- **Origin:** (date + source from Inbox)
- **Problem / Context:** (why it matters, what prompted it)
- **Acceptance Criteria:**
  - ...
- **Implementation Plan:**
  1. ...
  2. ...
- **Files / Areas (expected):**
  - `path/to/file.ext`
- **Tests / Verification:**
  - ...
- **Dependencies / Blockers:**
  - ...
- **Notes / Edge cases:**
  - ...

# Handling vague items
If an item is unclear, promote it as BLOCKED and specify EXACTLY what info is needed.
Example:
- **Status:** BLOCKED
- **Dependencies / Blockers:** need: API endpoint, UI mock, data schema

# Inbox hygiene
After promotion:
- remove promoted items from Inbox
- if merged, leave one canonical Inbox entry (or none if fully promoted)

# Response behavior
After grooming, respond with:
- number promoted
- top 3 priorities
- explicit blockers
(No long commentary.)