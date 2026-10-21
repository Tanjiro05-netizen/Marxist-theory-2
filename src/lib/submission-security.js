import 'server-only';

import { createHash, createHmac, randomUUID } from 'crypto';

export const MAX_SUBMISSION_FILE_SIZE = 50 * 1024 * 1024;
export const SUBMISSION_MIME_TYPE = 'application/pdf';
export const SUBMISSION_EXTENSION = 'pdf';
export const MAX_SUBMISSION_TITLE_LENGTH = 180;
export const MAX_SUBMISSION_ABSTRACT_LENGTH = 5000;
export const MAX_SUBMISSION_TAGS = 12;

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEVELOPMENT_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';

const cleanHost = (value = '') => `${value}`.trim().toLowerCase().split(':')[0];

export const getRequestIp = (request) => {
  const candidates = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for'),
  ];

  for (const candidate of candidates) {
    const ip = `${candidate || ''}`.split(',')[0].trim();
    if (ip && ip.length <= 64) return ip;
  }

  return 'unknown';
};

export const hashRequestIp = (request) => {
  const configuredSecret = `${process.env.SUBMISSION_IP_HASH_SECRET || ''}`.trim();
  const developmentSecret = process.env.NODE_ENV !== 'production'
    ? 'local-development-submission-rate-limit'
    : '';
  const secret = configuredSecret || developmentSecret;

  if (!secret) {
    throw new Error('SUBMISSION_IP_HASH_SECRET is required in production.');
  }

  return createHmac('sha256', secret).update(getRequestIp(request)).digest('hex');
};

export const validateTurnstile = async ({ request, token }) => {
  const configuredSecret = `${process.env.TURNSTILE_SECRET_KEY || ''}`.trim();
  const secret = configuredSecret || (
    process.env.NODE_ENV !== 'production' ? DEVELOPMENT_TURNSTILE_SECRET : ''
  );

  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY is required in production.');
  }

  if (!token || typeof token !== 'string' || token.length > 4096) {
    return { success: false, reason: 'Complete the security check and try again.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: getRequestIp(request),
        idempotency_key: randomUUID(),
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: false, reason: 'The security check is temporarily unavailable.' };
    }

    const result = await response.json();
    const requestHost = cleanHost(request.headers.get('host'));
    const verifiedHost = cleanHost(result.hostname);
    const actionMatches = !result.action || result.action === 'submit_work';
    const hostMatches = !verifiedHost || !requestHost || verifiedHost === requestHost || (
      process.env.NODE_ENV !== 'production' && verifiedHost === 'localhost'
    );

    if (!result.success || !actionMatches || !hostMatches) {
      return { success: false, reason: 'The security check could not be verified.' };
    }

    return { success: true, hostname: verifiedHost || null };
  } catch (_error) {
    return { success: false, reason: 'The security check is temporarily unavailable.' };
  } finally {
    clearTimeout(timeout);
  }
};

export const inspectPdfBytes = (bytes) => {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

  if (buffer.length < 8 || buffer.length > MAX_SUBMISSION_FILE_SIZE) {
    return { valid: false, reason: 'The PDF must be between 1 byte and 50 MB.' };
  }

  if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    return { valid: false, reason: 'The uploaded file is not a valid PDF.' };
  }

  const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
  if (!tail.includes('%%EOF')) {
    return { valid: false, reason: 'The PDF appears incomplete or malformed.' };
  }

  return {
    valid: true,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    size: buffer.length,
  };
};

export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(`${value || ''}`);
