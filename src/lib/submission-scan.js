import 'server-only';

import { scanAndSanitizePdf } from './document-scanner.js';
import {
  deleteSubmissionObject,
  inferSubmissionProvider,
  normalizeSubmissionObjectKey,
  uploadSubmissionObject,
} from './submission-storage.js';
import { createAdminClient } from './supabase/admin.js';

const scanReport = (values) => ({
  ...values,
  processedAt: new Date().toISOString(),
});

export const processSubmissionScan = async ({ submission, bytes, inspection }) => {
  const supabase = createAdminClient();
  const provider = inferSubmissionProvider(submission.storage_provider, submission.file_path);
  const rawObjectKey = normalizeSubmissionObjectKey(submission.file_path);
  const { data: scanJob } = await supabase
    .from('submission_scan_jobs')
    .select('attempts')
    .eq('submission_id', submission.id)
    .maybeSingle();

  const { error: startSubmissionError } = await supabase
    .from('article_submissions')
    .update({ scan_status: 'scanning' })
    .eq('id', submission.id);
  if (startSubmissionError) throw startSubmissionError;

  await supabase
    .from('submission_scan_jobs')
    .update({
      status: 'processing',
      locked_at: new Date().toISOString(),
      attempts: (scanJob?.attempts || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('submission_id', submission.id);

  try {
    const result = await scanAndSanitizePdf({
      bytes,
      fileName: submission.original_filename,
      sha256: inspection.sha256,
    });

    if (result.status === 'pending') {
      const report = scanReport({ reason: result.reason });
      await supabase
        .from('article_submissions')
        .update({ scan_status: 'pending', scan_report: report })
        .eq('id', submission.id);
      await supabase
        .from('submission_scan_jobs')
        .update({
          status: 'pending',
          locked_at: null,
          last_error: 'Document scanner is not configured.',
          report,
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', submission.id);
      return { status: 'pending' };
    }

    if (result.status === 'infected') {
      const report = scanReport({ reason: result.reason, engine: result.engine });
      await deleteSubmissionObject({ provider, objectKey: rawObjectKey, supabase }).catch(() => {});
      await supabase
        .from('article_submissions')
        .update({
          status: 'rejected',
          scan_status: 'infected',
          scan_report: report,
          scanned_at: new Date().toISOString(),
        })
        .eq('id', submission.id);
      await supabase
        .from('submission_scan_jobs')
        .update({
          status: 'infected',
          locked_at: null,
          last_error: result.reason,
          report,
          updated_at: new Date().toISOString(),
        })
        .eq('submission_id', submission.id);
      return { status: 'infected', reason: result.reason };
    }

    const safeObjectKey = `safe/${new Date().toISOString().slice(0, 10)}/${submission.id}.pdf`;
    const safeFilePath = await uploadSubmissionObject({
      provider,
      objectKey: safeObjectKey,
      bytes: result.bytes,
      supabase,
    });
    const report = scanReport({
      engine: result.engine,
      sourceSha256: inspection.sha256,
      sanitizedSha256: result.sha256,
    });

    const { error: cleanError } = await supabase
      .from('article_submissions')
      .update({
        file_path: safeFilePath,
        safe_file_path: safeFilePath,
        file_size_bytes: result.bytes.length,
        file_sha256: result.sha256,
        scan_status: 'clean',
        scan_report: report,
        scanned_at: new Date().toISOString(),
      })
      .eq('id', submission.id);
    if (cleanError) throw cleanError;

    await supabase
      .from('submission_scan_jobs')
      .update({
        status: 'clean',
        locked_at: null,
        last_error: null,
        report,
        updated_at: new Date().toISOString(),
      })
      .eq('submission_id', submission.id);

    if (rawObjectKey !== safeObjectKey) {
      await deleteSubmissionObject({ provider, objectKey: rawObjectKey, supabase }).catch(() => {});
    }

    return { status: 'clean' };
  } catch (error) {
    const message = `${error?.message || 'Document scanner failed.'}`.slice(0, 500);
    const report = scanReport({ reason: message });
    await supabase
      .from('article_submissions')
      .update({ scan_status: 'failed', scan_report: report })
      .eq('id', submission.id);
    await supabase
      .from('submission_scan_jobs')
      .update({
        status: 'failed',
        locked_at: null,
        last_error: message,
        report,
        updated_at: new Date().toISOString(),
      })
      .eq('submission_id', submission.id);
    return { status: 'failed', reason: message };
  }
};
