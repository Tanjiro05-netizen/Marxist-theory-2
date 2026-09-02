#!/bin/sh
set -eu

if [ -z "${SCANNER_TOKEN:-}" ]; then
  echo "SCANNER_TOKEN is required" >&2
  exit 1
fi

freshclam || echo "freshclam could not update signatures; using the packaged database" >&2
clamd --foreground=true &

attempt=0
while ! clamdscan --ping=1 >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 90 ]; then
    echo "clamd did not become ready" >&2
    exit 1
  fi
  sleep 1
done

exec python3 /app/scanner.py
