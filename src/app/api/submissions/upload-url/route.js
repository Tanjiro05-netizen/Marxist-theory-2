import { randomUUID } from 'crypto';

import { getServerAuthState } from '@/src/lib/server-auth.js';
import { isDocumentScannerConfigured } from '@/src/lib/document-scanner.js';
import { isSafeStoragePath } from '@/src/lib/storage-path.js';
import {
  hashRequestIp,
  MAX_SUBMISSION_FILE_SIZE,
  SUBMISSION_EXTENSION,
  SUBMISSION_MIME_TYPE,
  validateTurnstile,
} from '@/src/lib/submission-security.js';
import {
  buildStoredSubmissionPath,
  createR2UploadUrl,
  isR2Configured,
} from '@/src/lib/submission-storage.js';
import { createAdminClient } from '@/src/lib/supabase/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_SESSIONS_PER_HOUR = 5;

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const safeFileStem = (fileName) => {
  const stem = `${fileName || ''}`.replace(/\.[^.]+$/, '');
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'manuscript';
};

export async function POST(request) {
  if (process.env.SUBMISSIONS_ENABLED === 'false') {
    return json({ message: 'Submissions are temporarily unavailable.' }, 503);
  }
  const allowsQuarantineOnly = process.env.ALLOW_QUARANTINED_SUBMISSIONS === 'true';
  if (
    process.env.NODE_ENV === 'production'
    && !isDocumentScannerConfigured()
    && !allowsQuarantineOnly
  ) {
    return json({ message: 'Secure manuscript intake is not configured yet.' }, 503);
  }

  const { user: authenticatedUser } = await getServerAuthState();
  const user = authenticatedUser?.id === 'dev-admin' ? null : authenticatedUser;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const fileName = `${body?.fileName || ''}`.trim();
  const contentType = `${body?.contentType || ''}`.trim().toLowerCase();
  const fileSize = Number(body?.fileSize);

  if (
    !fileName
    || fileName.length > 255
    || !fileName.toLowerCase().endsWith(`.${SUBMISSION_EXTENSION}`)
    || contentType !== SUBMISSION_MIME_TYPE
  ) {
    return json({ message: 'Upload a PDF manuscript.' }, 400);
  }

  if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_SUBMISSION_FILE_SIZE) {
    return json({ message: 'The PDF must be no larger than 50 MB.' }, 400);
  }

  const turnstile = await validateTurnstile({ request, token: body?.turnstileToken });
  if (!turnstile.success) return json({ message: turnstile.reason }, 403);

  let supabase;
  let ipHash;
  try {
    supabase = createAdminClient();
    ipHash = hashRequestIp(request);
  } catch (error) {
    console.error('Secure submission configuration error:', error?.message);
    return json({ message: 'Secure manuscript intake is not configured yet.' }, 503);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: rateError } = await supabase
    .from('submission_upload_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if (rateError) {
    console.error('Submission rate limit lookup failed:', rateError.message);
    return json({ message: 'Could not prepare the secure upload.' }, 503);
  }
  if ((count || 0) >= MAX_UPLOAD_SESSIONS_PER_HOUR) {
    return json({ message: 'Too many upload attempts. Please wait an hour and try again.' }, 429);
  }

  const provider = isR2Configured() ? 'r2' : 'supabase';
  const date = new Date().toISOString().slice(0, 10);
  const folder = user?.id || 'anonymous';
  const objectKey = `quarantine/${folder}/${date}/${randomUUID()}-${safeFileStem(fileName)}.pdf`;
  if (!isSafeStoragePath(objectKey)) {
    return json({ message: 'Could not create a safe upload path.' }, 400);
  }

  const { data: session, error: sessionError } = await supabase
    .from('submission_upload_sessions')
    .insert({
      user_id: user?.id || null,
      provider,
      object_key: objectKey,
      original_filename: fileName,
      expected_size: fileSize,
      expected_mime: SUBMISSION_MIME_TYPE,
      ip_hash: ipHash,
      turnstile_hostname: turnstile.hostname,
    })
    .select('id, expires_at')
    .single();

  if (sessionError) {
    console.error('Upload session creation failed:', sessionError.message);
    return json({ message: 'Could not prepare the secure upload.' }, 503);
  }

  try {
    if (provider === 'r2') {
      const uploadUrl = await createR2UploadUrl({ objectKey, contentType: SUBMISSION_MIME_TYPE });
      return json({
        provider,
        objectKey,
        filePath: buildStoredSubmissionPath(provider, objectKey),
        uploadUrl,
        uploadSessionId: session.id,
        expiresAt: session.expires_at,
      });
    }

    const { data, error } = await supabase.storage
      .from('manuscripts')
      .createSignedUploadUrl(objectKey, { upsert: false });

    if (error) throw error;

    return json({
      provider,
      bucket: 'manuscripts',
      objectKey,
      filePath: objectKey,
      token: data.token,
      uploadSessionId: session.id,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    await supabase.from('submission_upload_sessions').delete().eq('id', session.id);
    console.error('Signed upload creation failed:', error?.message);
    return json({ message: 'Could not prepare the secure upload.' }, 503);
  }
}
