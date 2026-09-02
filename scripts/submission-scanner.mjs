#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'manuscripts';
const MAX_BYTES = 50 * 1024 * 1024;
const COMMAND_TIMEOUT_MS = 120_000;
const POLL_MS = Math.max(10_000, Number(process.env.SUBMISSION_SCANNER_POLL_MS) || 60_000);
const MAX_ATTEMPTS = Math.max(1, Number(process.env.SUBMISSION_SCANNER_MAX_ATTEMPTS) || 5);
const args = new Set(process.argv.slice(2));

const timestamp = () => new Date().toISOString();
const log = (message) => process.stdout.write(`[${timestamp()}] ${message}\n`);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const objectKey = (filePath = '') => `${filePath}`.replace(/^supabase:\/\//, '');

const required = (name, fallback) => {
  const value = `${process.env[name] || fallback || ''}`.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const run = (command, commandArgs, { accepted = [0] } = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, commandArgs, {
    env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const collect = (chunk) => {
    if (output.length < 16_000) output += chunk.toString();
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  const timeout = setTimeout(() => {
    child.kill('SIGKILL');
    reject(new Error(`${command} timed out.`));
  }, COMMAND_TIMEOUT_MS);
  child.on('error', (error) => {
    clearTimeout(timeout);
    reject(new Error(`${command} could not start: ${error.message}`));
  });
  child.on('close', (code) => {
    clearTimeout(timeout);
    const result = { code, output: output.trim() };
    if (accepted.includes(code)) resolve(result);
    else reject(Object.assign(new Error(`${command} exited with status ${code}.`), { result }));
  });
});

const verifyTools = async () => {
  for (const tool of ['clamscan', 'qpdf', 'gs']) {
    await run('which', [tool]);
  }
  const [clamav, qpdf, ghostscript] = await Promise.all([
    run('clamscan', ['--version']),
    run('qpdf', ['--version']),
    run('gs', ['--version']),
  ]);
  log(`Ready: ${clamav.output}; ${qpdf.output.split('\n')[0]}; Ghostscript ${ghostscript.output}.`);
};

const inspectPdf = (bytes, expectedSize, expectedHash) => {
  if (bytes.length < 8 || bytes.length > MAX_BYTES) throw new Error('PDF size is invalid.');
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('PDF signature is invalid.');
  if (!bytes.subarray(Math.max(0, bytes.length - 4096)).includes(Buffer.from('%%EOF'))) {
    throw new Error('PDF end marker is missing.');
  }
  if (expectedSize && Number(expectedSize) !== bytes.length) throw new Error('PDF size changed after upload.');
  const digest = sha256(bytes);
  if (expectedHash && expectedHash !== digest) throw new Error('PDF digest changed after upload.');
  return digest;
};

const scanAndSanitize = async (rawPath, safePath) => {
  const firstScan = await run('clamscan', ['--no-summary', '--infected', rawPath], { accepted: [0, 1] });
  if (firstScan.code === 1) return { infected: true, reason: firstScan.output || 'Malware signature detected.' };

  await run('qpdf', ['--check', rawPath], { accepted: [0, 3] });
  await run('gs', [
    '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dPDFSTOPONERROR',
    '-dPreserveAnnots=false', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.7',
    `-sOutputFile=${safePath}`, rawPath,
  ]);
  await run('qpdf', ['--check', safePath], { accepted: [0, 3] });
  const secondScan = await run('clamscan', ['--no-summary', '--infected', safePath], { accepted: [0, 1] });
  if (secondScan.code === 1) return { infected: true, reason: secondScan.output || 'Sanitized PDF triggered a malware signature.' };
  return { infected: false };
};

const report = (values) => ({ ...values, processedAt: timestamp() });

const updateFailure = async (job, submissionId, error) => {
  const message = `${error?.message || 'Local scanner failed.'}`.slice(0, 500);
  const delayMinutes = Math.min(60, 2 ** Math.min(job.attempts || 1, 5));
  const availableAt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
  const scanReport = report({ engine: 'local-clamav+qpdf+ghostscript', reason: message });
  await Promise.all([
    supabase.from('article_submissions').update({ scan_status: 'failed', scan_report: scanReport }).eq('id', submissionId),
    supabase.from('submission_scan_jobs').update({
      status: 'failed', locked_at: null, last_error: message, report: scanReport,
      available_at: availableAt, updated_at: timestamp(),
    }).eq('id', job.id),
  ]);
  log(`Scan failed for ${submissionId}: ${message}`);
};

const nextJob = async () => {
  const { data, error } = await supabase
    .from('submission_scan_jobs')
    .select('id, submission_id, status, attempts, available_at')
    .in('status', ['pending', 'failed'])
    .lte('available_at', timestamp())
    .lt('attempts', MAX_ATTEMPTS)
    .order('available_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: claimed, error: claimError } = await supabase
    .from('submission_scan_jobs')
    .update({
      status: 'processing', locked_at: timestamp(), attempts: data.attempts + 1,
      last_error: null, updated_at: timestamp(),
    })
    .eq('id', data.id)
    .in('status', ['pending', 'failed'])
    .select('id, submission_id, attempts')
    .maybeSingle();
  if (claimError) throw claimError;
  return claimed;
};

const processJob = async (job) => {
  const { data: submission, error } = await supabase
    .from('article_submissions')
    .select('id, file_path, storage_provider, original_filename, file_size_bytes, file_sha256, scan_status')
    .eq('id', job.submission_id)
    .maybeSingle();
  if (error || !submission) throw error || new Error('Submission record was not found.');
  if (submission.scan_status === 'clean' || submission.scan_status === 'infected') {
    await supabase.from('submission_scan_jobs').update({
      status: submission.scan_status, locked_at: null, updated_at: timestamp(),
    }).eq('id', job.id);
    return;
  }
  if ((submission.storage_provider || 'supabase') !== 'supabase') {
    throw new Error('The local scanner currently supports Supabase Storage submissions only.');
  }

  await supabase.from('article_submissions').update({ scan_status: 'scanning' }).eq('id', submission.id);
  const rawObjectKey = objectKey(submission.file_path);
  const tempDirectory = await mkdtemp(join(tmpdir(), 'marxist-pdf-scan-'));
  const rawPath = join(tempDirectory, 'quarantine.pdf');
  const safePath = join(tempDirectory, 'sanitized.pdf');
  let uploadedSafeKey = null;

  try {
    const { data: rawBlob, error: downloadError } = await supabase.storage.from(BUCKET).download(rawObjectKey);
    if (downloadError || !rawBlob) throw downloadError || new Error('Could not download quarantined PDF.');
    const rawBytes = Buffer.from(await rawBlob.arrayBuffer());
    const sourceDigest = inspectPdf(rawBytes, submission.file_size_bytes, submission.file_sha256);
    await writeFile(rawPath, rawBytes, { mode: 0o600 });

    const result = await scanAndSanitize(rawPath, safePath);
    if (result.infected) {
      const scanReport = report({ engine: 'local-clamav', reason: result.reason });
      await supabase.storage.from(BUCKET).remove([rawObjectKey]);
      await Promise.all([
        supabase.from('article_submissions').update({
          status: 'rejected', scan_status: 'infected', scan_report: scanReport, scanned_at: timestamp(),
        }).eq('id', submission.id),
        supabase.from('submission_scan_jobs').update({
          status: 'infected', locked_at: null, last_error: result.reason,
          report: scanReport, updated_at: timestamp(),
        }).eq('id', job.id),
      ]);
      log(`Rejected infected submission ${submission.id}.`);
      return;
    }

    const safeBytes = await readFile(safePath);
    await stat(safePath);
    const safeDigest = inspectPdf(safeBytes);
    uploadedSafeKey = `safe/${timestamp().slice(0, 10)}/${submission.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedSafeKey, safeBytes, {
      contentType: 'application/pdf', cacheControl: '0', upsert: false,
    });
    if (uploadError) throw uploadError;

    const scanReport = report({
      engine: 'local-clamav+qpdf+ghostscript', sourceSha256: sourceDigest, sanitizedSha256: safeDigest,
    });
    const { error: cleanError } = await supabase.from('article_submissions').update({
      file_path: uploadedSafeKey, safe_file_path: uploadedSafeKey,
      file_size_bytes: safeBytes.length, file_sha256: safeDigest,
      scan_status: 'clean', scan_report: scanReport, scanned_at: timestamp(),
    }).eq('id', submission.id);
    if (cleanError) throw cleanError;

    await supabase.from('submission_scan_jobs').update({
      status: 'clean', locked_at: null, last_error: null, report: scanReport, updated_at: timestamp(),
    }).eq('id', job.id);
    if (rawObjectKey !== uploadedSafeKey) await supabase.storage.from(BUCKET).remove([rawObjectKey]);
    log(`Cleaned and unlocked submission ${submission.id}.`);
  } catch (scanError) {
    if (uploadedSafeKey) await supabase.storage.from(BUCKET).remove([uploadedSafeKey]).catch(() => {});
    await updateFailure(job, submission.id, scanError);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
};

const processAvailableJobs = async () => {
  let processed = 0;
  while (true) {
    const job = await nextJob();
    if (!job) break;
    await processJob(job);
    processed += 1;
  }
  return processed;
};

await verifyTools();
if (args.has('--check')) {
  const { error } = await supabase.from('submission_scan_jobs').select('id', { head: true, count: 'exact' });
  if (error) throw error;
  log('Supabase queue connection verified.');
  process.exit(0);
}

if (args.has('--self-test')) {
  const directory = await mkdtemp(join(tmpdir(), 'marxist-scanner-self-test-'));
  try {
    const cleanInput = join(directory, 'clean-input.pdf');
    const cleanOutput = join(directory, 'clean-output.pdf');
    await run('gs', [
      '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite',
      `-sOutputFile=${cleanInput}`,
      '-c', '/Helvetica findfont 18 scalefont setfont 72 720 moveto (Scanner self-test) show showpage',
    ]);
    const cleanResult = await scanAndSanitize(cleanInput, cleanOutput);
    if (cleanResult.infected) throw new Error('Clean self-test PDF was rejected.');
    inspectPdf(await readFile(cleanOutput));

    const infectedInput = join(directory, 'eicar-test.txt');
    const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    await writeFile(infectedInput, Buffer.from(eicar), { mode: 0o600 });
    const infectedResult = await run(
      'clamscan', ['--no-summary', '--infected', infectedInput], { accepted: [0, 1] }
    );
    if (infectedResult.code !== 1) throw new Error('EICAR self-test signature was not detected.');
    log('Self-test passed: clean PDF sanitized; EICAR test file rejected.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  process.exit(0);
}

if (args.has('--once')) {
  const processed = await processAvailableJobs();
  log(`Finished. Processed ${processed} submission(s).`);
  process.exit(0);
}

log(`Watching for quarantined submissions every ${Math.round(POLL_MS / 1000)} seconds.`);
while (true) {
  try {
    await processAvailableJobs();
  } catch (error) {
    log(`Queue error: ${error?.message || error}`);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
