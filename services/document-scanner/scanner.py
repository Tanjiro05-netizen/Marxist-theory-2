#!/usr/bin/env python3
"""Small authenticated PDF CDR service for the manuscript intake route."""

import hashlib
import hmac
import json
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


MAX_BYTES = int(os.environ.get("MAX_FILE_BYTES", str(50 * 1024 * 1024)))
SCANNER_TOKEN = os.environ["SCANNER_TOKEN"].encode("utf-8")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))
COMMAND_TIMEOUT = int(os.environ.get("COMMAND_TIMEOUT_SECONDS", "40"))


def run(command):
    return subprocess.run(
        command,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=COMMAND_TIMEOUT,
        check=False,
        text=True,
    )


class ScannerHandler(BaseHTTPRequestHandler):
    server_version = "DocumentScanner/1.0"

    def _headers(self, status, content_type, content_length=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Scan-Engine", "clamav+qpdf+ghostscript")
        if content_length is not None:
            self.send_header("Content-Length", str(content_length))
        self.end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self._headers(status, "application/json", len(body))
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/health":
            self._json(404, {"status": "not_found"})
            return

        ping = run(["clamdscan", "--ping=1"])
        if ping.returncode == 0:
            self._json(200, {"status": "ok"})
        else:
            self._json(503, {"status": "clamav_unavailable"})

    def do_POST(self):
        if self.path != "/scan":
            self._json(404, {"status": "not_found"})
            return

        supplied = self.headers.get("Authorization", "")
        expected = b"Bearer " + SCANNER_TOKEN
        if not hmac.compare_digest(supplied.encode("utf-8"), expected):
            self._json(401, {"status": "unauthorized"})
            return

        if self.headers.get_content_type() != "application/pdf":
            self._json(415, {"status": "rejected", "reason": "PDF files only"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        if content_length < 8 or content_length > MAX_BYTES:
            self._json(413, {"status": "rejected", "reason": "Invalid PDF size"})
            return

        data = self.rfile.read(content_length)
        if len(data) != content_length or not data.startswith(b"%PDF-"):
            self._json(422, {"status": "rejected", "reason": "Malformed PDF"})
            return

        expected_hash = self.headers.get("X-Document-Sha256", "").lower()
        actual_hash = hashlib.sha256(data).hexdigest()
        if expected_hash and not hmac.compare_digest(expected_hash, actual_hash):
            self._json(422, {"status": "rejected", "reason": "Digest mismatch"})
            return

        try:
            with tempfile.TemporaryDirectory(prefix="pdf-scan-") as temp_dir:
                raw_path = Path(temp_dir) / "quarantine.pdf"
                safe_path = Path(temp_dir) / "sanitized.pdf"
                raw_path.write_bytes(data)

                malware = run(["clamdscan", "--fdpass", "--no-summary", str(raw_path)])
                if malware.returncode == 1:
                    self._json(422, {
                        "status": "infected",
                        "reason": "Malware signature detected",
                    })
                    return
                if malware.returncode != 0:
                    self._json(503, {"status": "error", "reason": "Malware scanner error"})
                    return

                structure = run(["qpdf", "--check", str(raw_path)])
                if structure.returncode not in (0, 3):
                    self._json(422, {"status": "rejected", "reason": "Invalid PDF structure"})
                    return

                rewrite = run([
                    "gs",
                    "-q",
                    "-dSAFER",
                    "-dBATCH",
                    "-dNOPAUSE",
                    "-dPDFSTOPONERROR",
                    "-dPreserveAnnots=false",
                    "-sDEVICE=pdfwrite",
                    "-dCompatibilityLevel=1.7",
                    f"-sOutputFile={safe_path}",
                    str(raw_path),
                ])
                if rewrite.returncode != 0 or not safe_path.exists():
                    self._json(422, {"status": "rejected", "reason": "PDF sanitization failed"})
                    return

                safe_structure = run(["qpdf", "--check", str(safe_path)])
                safe_malware = run(["clamdscan", "--fdpass", "--no-summary", str(safe_path)])
                if safe_structure.returncode not in (0, 3) or safe_malware.returncode != 0:
                    self._json(422, {"status": "rejected", "reason": "Sanitized PDF failed verification"})
                    return

                result = safe_path.read_bytes()
                if len(result) > MAX_BYTES or not result.startswith(b"%PDF-"):
                    self._json(422, {"status": "rejected", "reason": "Sanitized PDF is invalid"})
                    return

                self._headers(200, "application/pdf", len(result))
                self.wfile.write(result)
        except subprocess.TimeoutExpired:
            self._json(503, {"status": "error", "reason": "Scan timed out"})
        except Exception:
            self._json(500, {"status": "error", "reason": "Scanner failure"})

    def log_message(self, format_string, *args):
        print(f"{self.client_address[0]} - {format_string % args}")


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), ScannerHandler).serve_forever()
