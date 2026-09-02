import 'server-only';

import { inspectPdfBytes, SUBMISSION_MIME_TYPE } from './submission-security.js';

export const getDocumentScannerUrl = () => {
  const rawUrl = `${process.env.DOCUMENT_SCANNER_URL || ''}`.trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

export const isDocumentScannerConfigured = () =>
  Boolean(
    getDocumentScannerUrl()
    && `${process.env.DOCUMENT_SCANNER_TOKEN || ''}`.trim()
  );

export const scanAndSanitizePdf = async ({ bytes, fileName, sha256 }) => {
  if (!isDocumentScannerConfigured()) {
    return { status: 'pending', reason: 'scanner_not_configured' };
  }

  const scannerUrl = getDocumentScannerUrl();
  if (!scannerUrl) return { status: 'pending', reason: 'scanner_not_configured' };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.DOCUMENT_SCANNER_TIMEOUT_MS) || 45000
  );

  try {
    const response = await fetch(
      `${scannerUrl}/scan`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DOCUMENT_SCANNER_TOKEN}`,
          'Content-Type': SUBMISSION_MIME_TYPE,
          'X-Document-Name': encodeURIComponent(`${fileName || 'manuscript.pdf'}`.slice(0, 255)),
          'X-Document-Sha256': sha256,
        },
        body: bytes,
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    if (response.status === 422) {
      const result = await response.json().catch(() => ({}));
      return {
        status: 'infected',
        reason: `${result.reason || 'The file was rejected by the malware scanner.'}`.slice(0, 500),
        engine: response.headers.get('x-scan-engine') || 'clamav',
      };
    }

    if (!response.ok) {
      throw new Error(`Scanner returned HTTP ${response.status}.`);
    }

    const sanitizedBytes = Buffer.from(await response.arrayBuffer());
    const inspection = inspectPdfBytes(sanitizedBytes);
    if (!inspection.valid) {
      throw new Error('Scanner returned an invalid sanitized PDF.');
    }

    return {
      status: 'clean',
      bytes: sanitizedBytes,
      sha256: inspection.sha256,
      engine: response.headers.get('x-scan-engine') || 'clamav+ghostscript',
    };
  } finally {
    clearTimeout(timeout);
  }
};
