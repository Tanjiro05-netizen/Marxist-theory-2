# Integration handoff

## Current deliverable

`site/index.html` is the authoritative latest Digital Twin reader. Do not substitute `source/inputs/original.html`, which is an older build input.

The reader has Sections, Skim, and Full text modes; paragraph expansion; footnotes; light/dark appearance; two generated illustrations; and three inline interactive diagrams. The header has small links to the three diagrams. The old mirror sidebar is hidden and inert, and some dormant code is still present. That code is not the current user-facing design.

## Editorial requirements

- Preserve the original essay wording, footnotes, and curated skim selections. Skim uses selections from source sentences, not rewritten prose.
- Two overview summaries were previously corrected; preserve the current versions in the delivered HTML.
- Keep responses concise. No onboarding prose, function explanations, edition badges, generic “In short” blocks, or unsolicited explanatory notes in the reader UI.
- Keep substantive labels needed to understand the diagrams (axes, predicted/observed distinctions, actions). Do not add visible captions or generation labels to the two generated illustrations.
- Use visuals selectively; do not restore the six removed mirrors or force a diagram into every chapter.

## Current diagrams

1. **Test an action before taking it** (`#mirror-engine`, after paragraph index 92). One timeline with measured history and two forecasts branching from the same point. The reader chooses Continue operating or Inspect & repair, then checks the prediction. Subsequent illustrative measurements differ from the forecast. Controls support pause/resume/replay and comparing both choices. All data is authored, unitless, illustrative data; no real engineering simulation or live measurement runs here.
2. **Test the failure on the copy** (`#mirror-security`, after index 120). Copy, attack, retest, and deploy states. The live system remains separate from the test environment.
3. **From a trace to a decision** (`#mirror-profile`, after index 130). Observed events, inferred interest, ranked recommendations, and feedback are distinguished.

The engine example received the latest redesign after the previous box-and-arrow animation proved insufficiently explanatory. Keep this decision-based version. The other two are still the earlier step-based designs.

Both generated images remain: engine at paragraph 92 and city at paragraph 97. Images open in a larger dialog. Paragraph indices refer to the reader's non-heading paragraph array, not the raw input array that includes headings.

## Integration approach

Prefer a static dedicated route first. The website framework and hosting provider have not been supplied. Inspect the destination repository before choosing paths. Do not rebuild this as a React component merely to serve one page; a reusable component/content separation can be a later task if a larger library is requested.

The HTML is self-contained except for Google Fonts. The build needs Python 3 and no third-party packages. It now uses portable relative paths. It does not require the original Downloads folder, a model subscription, an API key, or a backend.

After integration, verify reading modes, skim paragraph expansion, footnotes, header diagram links, both engine choices and playback, security/profile steps, image dialog, dark mode, and narrow-screen layout. Confirm that essay/skim/notes match `source/work/original-data.json`. Existing checks passed at 1440, 390, and 320 pixel widths before packaging; the destination site's routing, CSP, and styles still need checking.

## Conversation reference

Original local Codex chat ID: `01a0e017-1c5d-7663-84e8-bca2d385c74c`.
If the destination chat has Codex app thread-reading tools, it can be asked to read this chat for additional context. This file is a curated handoff, not a full transcript. No message has been sent to another chat, and no website has been published as part of packaging.

The user also discussed a future Mac app for preparing books and optional Veo-generated video. Neither is part of this package or required to publish the reader.
