---
trigger: always
---

# Goal
Maintain a living backlog in `todo.md` by capturing deferred work and missing implementation as soon as it appears.

# When to capture (must append a backlog note)
Add an entry to `todo.md` immediately if ANY occurs:
- User says: "later", "next", "on hold", "eventually", "after this", "we still need to", "remind me", "not now".
- Assistant proposes a next step that is not executed in the current response/session.
- You detect a gap: requirement not implemented, stub/placeholder, TODO/FIXME comment, missing doc/tests, broken behavior.
- A decision is deferred (library/model choice, architecture decision, data format, UI approach, etc.).

# Capture style: LIGHT, not detailed
Do NOT write full specs here. Write a short, structured note so nothing is lost.

# File policy
- Only use repo-root `todo.md`.
- Never create other backlog files.
- Append new items under "## Inbox (Auto-captured)".
- Avoid duplicates:
  - If a similar item already exists in Inbox, add a short “+ note” under it instead of creating a new item.

# Required structure in todo.md
If `todo.md` does not exist, create it with:

# TODO

## Inbox (Auto-captured)
- [ ] <one-line item>  (source: <user|assistant|repo-scan>, date: YYYY-MM-DD)
  - context: <1–2 lines>
  - tags: <comma-separated: feature|bug|docs|refactor|decision|research|test>
  - hint: <optional next tiny step>

## Backlog (Groomed)
<!-- Groomed items live here. Inbox items get promoted here during grooming. -->

## Changelog
- YYYY-MM-DD: created todo.md

# Rules for writing Inbox entries
- Use markdown checkboxes: `- [ ]`
- One idea per checkbox line.
- Always include `(source: ..., date: YYYY-MM-DD)`.
- Keep it short: title <= 12 words, context <= 2 lines.
- Never mark as done automatically.

# Response behavior
- Do not announce every capture unless the user asks.
- If you changed todo.md, keep the mention minimal: “Captured in todo.md.”