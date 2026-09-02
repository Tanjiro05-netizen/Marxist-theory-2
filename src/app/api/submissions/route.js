import { getServerAuthState } from '@/src/lib/server-auth.js';
import { processSubmissionScan } from '@/src/lib/submission-scan.js';
import {
  inspectPdfBytes,
  isUuid,
  MAX_SUBMISSION_ABSTRACT_LENGTH,
  MAX_SUBMISSION_TAGS,
  MAX_SUBMISSION_TITLE_LENGTH,
  SUBMISSION_MIME_TYPE,
} from '@/src/lib/submission-security.js';
import {
  buildStoredSubmissionPath,
  deleteSubmissionObject,
  downloadSubmissionObject,
} from '@/src/lib/submission-storage.js';
import { createAdminClient } from '@/src/lib/supabase/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const cleanText = (value, maxLength) => `${value || ''}`.trim().slice(0, maxLength + 1);

export async function POST(request) {
  if (process.env.SUBMISSIONS_ENABLED === 'false') {
    return json({ message: 'Submissions are temporarily unavailable.' }, 503);
  }

  const { user: authenticatedUser } = await getServerAuthState();
  const user = authenticatedUser?.id === 'dev-admin' ? null : authenticatedUser;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid submission data.' }, 400);
  }

  const title = cleanText(body?.title, MAX_SUBMISSION_TITLE_LENGTH);
  const abstract = cleanText(body?.abstract, MAX_SUBMISSION_ABSTRACT_LENGTH);
  const categoryId = `${body?.categoryId || ''}`.trim();
  const uploadSessionId = `${body?.uploadSessionId || ''}`.trim();
  const tagIds = [...new Set(
    (Array.isArray(body?.tagIds) ? body.tagIds : [])
      .map((id) => `${id}`.trim())
      .filter(isUuid)
  )].slice(0, MAX_SUBMISSION_TAGS + 1);

  if (
    !title
    || title.length > MAX_SUBMISSION_TITLE_LENGTH
    || abstract.length < 10
    || abstract.length > MAX_SUBMISSION_ABSTRACT_LENGTH
    || !isUuid(categoryId)
    || !isUuid(uploadSessionId)
    || tagIds.length === 0
    || tagIds.length > MAX_SUBMISSION_TAGS
  ) {
    return json({ message: 'Complete the title, abstract, category, tags, and PDF fields.' }, 400);
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error('Secure submission configuration error:', error?.message);
    return json({ message: 'Secure manuscript intake is not configured yet.' }, 503);
  }

  const { data: pendingSession, error: sessionLookupError } = await supabase
    .from('submission_upload_sessions')
    .select('*')
    .eq('id', uploadSessionId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sessionLookupError || !pendingSession) {
    return json({ message: 'The upload session expired or was already used. Please upload the PDF again.' }, 409);
  }

  const sessionUserId = pendingSession.user_id || null;
  const currentUserId = user?.id || null;
  if (sessionUserId !== currentUserId) {
    return json({ message: 'This upload session does not belong to the current visitor.' }, 403);
  }

  const { data: claimedSession, error: claimError } = await supabase
    .from('submission_upload_sessions')
    .update({ status: 'consumed', consumed_at: new Date().toISOString() })
    .eq('id', uploadSessionId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (claimError || !claimedSession) {
    return json({ message: 'The upload session was already used. Please upload the PDF again.' }, 409);
  }

  const provider = claimedSession.provider;
  const objectKey = claimedSession.object_key;

  let uploaded;
  let inspection;
  try {
    uploaded = await downloadSubmissionObject({ provider, objectKey, supabase });
    inspection = inspectPdfBytes(uploaded.bytes);

    if (!inspection.valid) throw new Error(inspection.reason);
    if (inspection.size !== Number(claimedSession.expected_size)) {
      throw new Error('The uploaded PDF size does not match the upload request.');
    }
    if (uploaded.contentType && uploaded.contentType !== SUBMISSION_MIME_TYPE) {
      throw new Error('The uploaded object is not marked as a PDF.');
    }
  } catch (error) {
    await deleteSubmissionObject({ provider, objectKey, supabase }).catch(() => {});
    return json({ message: error?.message || 'The uploaded PDF could not be verified.' }, 400);
  }

  const [{ data: category }, { data: validTags, error: tagsError }] = await Promise.all([
    supabase.from('theory_categories').select('id').eq('id', categoryId).maybeSingle(),
    supabase.from('theory_tags').select('id').in('id', tagIds),
  ]);

  if (!category || tagsError || validTags?.length !== tagIds.length) {
    await deleteSubmissionObject({ provider, objectKey, supabase }).catch(() => {});
    return json({ message: 'Choose a valid category and tags.' }, 400);
  }

  const filePath = buildStoredSubmissionPath(provider, objectKey);
  const { data: submission, error: insertError } = await supabase
    .from('article_submissions')
    .insert({
      user_id: currentUserId,
      title,
      abstract,
      category_id: categoryId,
      tag_ids: tagIds,
      file_path: filePath,
      storage_provider: provider,
      original_filename: claimedSession.original_filename,
      file_size_bytes: inspection.size,
      mime_type: SUBMISSION_MIME_TYPE,
      file_sha256: inspection.sha256,
      scan_status: 'pending',
    })
    .select('*')
    .single();

  if (insertError) {
    await deleteSubmissionObject({ provider, objectKey, supabase }).catch(() => {});
    console.error('Submission insert failed:', insertError.message);
    return json({ message: 'Could not save the submission.' }, 500);
  }

  const { error: jobError } = await supabase.from('submission_scan_jobs').insert({
    submission_id: submission.id,
    status: 'pending',
  });
  if (jobError) {
    console.error('Submission scan job creation failed:', jobError.message);
  }

  const scan = await processSubmissionScan({ submission, bytes: uploaded.bytes, inspection });

  return json({
    submitted: true,
    submissionId: submission.id,
    scanStatus: scan.status,
    message: scan.status === 'clean'
      ? 'Your PDF passed the safety scan and is ready for editorial review.'
      : scan.status === 'infected'
        ? 'The PDF was rejected by the safety scanner.'
        : 'Your PDF was received and is waiting for its safety scan.',
  }, 201);
}
