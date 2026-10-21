# Private document scanner

This service receives a PDF (up to 50 MB by default) from the application backend, scans it with
ClamAV, validates its structure with qpdf, and rewrites it with Ghostscript.
Only the rewritten copy is made available to editors.

Build and run it on a private container host:

```bash
docker build -t marxist-document-scanner services/document-scanner
docker run --rm -p 8080:8080 \
  -e SCANNER_TOKEN='use-a-long-random-secret' \
  -e MAX_FILE_BYTES=52428800 \
  marxist-document-scanner
```

Configure the website with `DOCUMENT_SCANNER_URL` and the matching
`DOCUMENT_SCANNER_TOKEN`. Put the service behind HTTPS and restrict inbound
traffic to the website host where the platform supports network allowlists.
The raw quarantine file is deleted after a clean sanitized copy is stored, or
after malware is detected. Production intake refuses new uploads until the
scanner is configured; if a configured scanner goes offline, the submission
remains locked in the queue and cannot be previewed or approved.

ClamAV signatures are refreshed at container start. For long-lived containers,
also schedule `freshclam` or run the `clamav-freshclam` daemon.
