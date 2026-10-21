import { isAdminProfile, isAdminUser } from '@/src/lib/auth.js';
import { getServerAuthState } from '@/src/lib/server-auth.js';
import { hashRequestIp, isUuid } from '@/src/lib/submission-security.js';
import {
  createR2ReadUrl,
  deleteSubmissionObject,
  inferSubmissionProvider,
  normalizeSubmissionObjectKey,
} from '@/src/lib/submission-storage.js';
import { createAdminClient } from '@/src/lib/supabase/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const isAdmin = (user, profile) => Boolean(
  user && (isAdminProfile(profile) || isAdminUser(user))
);

export async function POST(request) {
  const { user, profile } = await getServerAuthState();
  if (!user) return json({ message: 'Not authenticated.' }, 401);
  if (!isAdmin(user, profile)) return json({ message: 'Not authorized.' }, 403);

  const body = await readJson(request);
  const submissionId = `${body?.submissionId || ''}`.trim();
  if (!isUuid(submissionId)) return json({ message: 'Invalid submission.' }, 400);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error('Secure submission configuration error:', error?.message);
    return json({ message: 'Secure manuscript access is not configured.' }, 503);
  }

  const { data: submission, error } = await supabase
    .from('article_submissions')
    .select('id, scan_status, safe_file_path, storage_provider, original_filename')
    .eq('id', submissionId)
    .maybeSingle();

  if (error || !submission) return json({ message: 'Submission not found.' }, 404);
  if (submission.scan_status !== 'clean' || !submission.safe_file_path) {
    return json({ message: 'Preview is locked until the PDF passes its safety scan.' }, 423);
  }

  const provider = inferSubmissionProvider(submission.storage_provider, submission.safe_file_path);
  const objectKey = normalizeSubmissionObjectKey(submission.safe_file_path);
  const fileName = `${submission.original_filename || 'manuscript.pdf'}`.replace(/["\r\n]/g, '');
  const download = body?.download === true;

  if (provider === 'r2') {
    const url = await createR2ReadUrl({ objectKey, fileName, download });
    return json({ url });
  }

  const options = download ? { download: fileName } : undefined;
  const { data, error: signError } = await supabase.storage
    .from('manuscripts')
    .createSignedUrl(objectKey, 5 * 60, options);

  if (signError) return json({ message: 'Could not open the sanitized manuscript.' }, 500);
  return json({ url: data.signedUrl });
}

export async function DELETE(request) {
  const { user: authenticatedUser, profile } = await getServerAuthState();
  const user = authenticatedUser?.id === 'dev-admin' ? null : authenticatedUser;
  const body = await readJson(request);
  if (!body) return json({ message: 'Invalid JSON body.' }, 400);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error('Secure submission configuration error:', error?.message);
    return json({ message: 'Secure manuscript access is not configured.' }, 503);
  }

  const submissionId = `${body?.submissionId || ''}`.trim();
  if (isUuid(submissionId)) {
    if (!isAdmin(authenticatedUser, profile)) return json({ message: 'Not authorized.' }, 403);

    const { data: submission } = await supabase
      .from('article_submissions')
      .select('file_path, safe_file_path, storage_provider')
      .eq('id', submissionId)
      .maybeSingle();
    if (!submission) return json({ message: 'Submission not found.' }, 404);

    const paths = [...new Set([submission.file_path, submission.safe_file_path].filter(Boolean))];
    for (const path of paths) {
      const provider = inferSubmissionProvider(submission.storage_provider, path);
      await deleteSubmissionObject({
        provider,
        objectKey: normalizeSubmissionObjectKey(path),
        supabase,
      });
    }
    return json({ removed: true });
  }

  const uploadSessionId = `${body?.uploadSessionId || ''}`.trim();
  if (!isUuid(uploadSessionId)) return json({ message: 'Invalid upload session.' }, 400);

  const { data: session } = await supabase
    .from('submission_upload_sessions')
    .select('user_id, provider, object_key, ip_hash')
    .eq('id', uploadSessionId)
    .maybeSingle();
  if (!session) return json({ removed: true });

  let requestIpHash;
  try {
    requestIpHash = hashRequestIp(request);
  } catch {
    return json({ message: 'Secure manuscript access is not configured.' }, 503);
  }

  if ((session.user_id || null) !== (user?.id || null) || session.ip_hash !== requestIpHash) {
    return json({ message: 'Not authorized.' }, 403);
  }

  await deleteSubmissionObject({
    provider: session.provider,
    objectKey: session.object_key,
    supabase,
  }).catch(() => {});

  return json({ removed: true });
}
