# Digital Twin reader test integration

URL: `/readers/digital-twin/index.html`, linked from the digital library.

The public HTML is the authoritative packaged reader, preserved byte for byte.
It runs independently of the React reader and needs no database record.
Existing site security headers apply; Google Fonts fall back to system fonts if unavailable.

Rebuild from the repository root:

```sh
python3 experiments/digital-twin-reader/source/build.py
```

This updates `public/readers/digital-twin/index.html`. Generated intermediate HTML
is ignored. Original text, skim selections and notes are in
`source/work/original-data.json`. `SHA256SUMS.txt` records the original ZIP paths
and checksums; the build wrapper was adapted to this repository's public folder.

See `INTEGRATION-HANDOFF.md` for the original editorial and interaction requirements.

Browser checks (reading modes, expansion, notes, diagrams, illustrations,
appearance persistence and overflow at 1440, 390 and 320 px):

```sh
PORT=3002 npx playwright test tests/e2e/digital-twin-reader.spec.js
```
