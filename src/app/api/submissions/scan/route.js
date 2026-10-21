import { isAdminProfile, isAdminUser } from '@/src/lib/auth.js';
import { getServerAuthState } from '@/src/lib/server-auth.js';
import { processSubmissionScan } from '@/src/lib/submission-scan.js';
import { inspectPdfBytes, isUuid } from '@/src/lib/submission-security.js';
import {
  downloadSubmissionObject,
  inferSubmissionProvider,
  normalizeSubmissionObjectKey,
} from '@/src/lib/submission-storage.js';
import { createAdminClient } from '@/src/lib/supabase/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

export async function POST(request) {
  const { user, profile } = await getServerAuthState();
  if (!user) return json({ message: 'Not authenticated.' }, 401);
  if (!isAdminProfile(profile) && !isAdminUser(user)) {
    return json({ message: 'Not authorized.' }, 403);
  }

  const body = await request.json().catch(() => null);
  const submissionId = `${body?.submissionId || ''}`.trim();
  if (!isUuid(submissionId)) return json({ message: 'Invalid submission.' }, 400);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error('Secure submission configuration error:', error?.message);
    return json({ message: 'The document scanner is not configured.' }, 503);
  }

  const { data: submission, error } = await supabase
    .from('article_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  if (error || !submission) return json({ message: 'Submission not found.' }, 404);
  if (submission.scan_status === 'clean') return json({ scanStatus: 'clean' });
  if (submission.scan_status === 'infected') {
    return json({ message: 'This submission was rejected by the safety scanner.' }, 409);
  }

  const provider = inferSubmissionProvider(submission.storage_provider, submission.file_path);
  const objectKey = normalizeSubmissionObjectKey(submission.file_path);

  try {
    const uploaded = await downloadSubmissionObject({ provider, objectKey, supabase });
    const inspection = inspectPdfBytes(uploaded.bytes);
    if (!inspection.valid) return json({ message: inspection.reason }, 400);

    await supabase.from('submission_scan_jobs').upsert({
      submission_id: submission.id,
      status: 'pending',
      available_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'submission_id' });

    const result = await processSubmissionScan({
      submission,
      bytes: uploaded.bytes,
      inspection,
    });

    return json({
      scanStatus: result.status,
      message: result.status === 'clean'
        ? 'The sanitized PDF is ready for review.'
        : result.status === 'infected'
          ? 'The PDF was rejected by the safety scanner.'
          : 'The PDF could not be scanned yet.',
    });
  } catch (scanError) {
    console.error('Manual submission scan failed:', scanError?.message);
    return json({ message: 'The PDF could not be scanned.' }, 500);
  }
}
