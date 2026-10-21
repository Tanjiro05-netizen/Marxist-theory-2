import 'server-only';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENV_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_SUBMISSIONS_BUCKET',
];

let r2Client;

export const isR2Configured = () =>
  R2_ENV_KEYS.every((key) => `${process.env[key] || ''}`.trim());

export const inferSubmissionProvider = (provider, filePath = '') => {
  if (provider === 'r2' || `${filePath}`.startsWith('r2://')) return 'r2';
  return 'supabase';
};

export const normalizeSubmissionObjectKey = (filePath = '') =>
  `${filePath}`.replace(/^r2:\/\//, '').replace(/^supabase:\/\//, '');

export const buildStoredSubmissionPath = (provider, objectKey) =>
  provider === 'r2' ? `r2://${objectKey}` : objectKey;

const getR2Client = () => {
  if (!isR2Configured()) {
    throw new Error('R2 submission storage is not configured.');
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
};

export const createR2UploadUrl = async ({ objectKey, contentType }) =>
  getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: process.env.R2_SUBMISSIONS_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: 10 * 60 }
  );

export const createR2ReadUrl = async ({ objectKey, fileName, download = false }) =>
  getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: process.env.R2_SUBMISSIONS_BUCKET,
      Key: objectKey,
      ResponseContentDisposition: `${download ? 'attachment' : 'inline'}; filename="${fileName || 'manuscript.pdf'}"`,
    }),
    { expiresIn: 5 * 60 }
  );

export const deleteR2Submission = async (objectKey) =>
  getR2Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_SUBMISSIONS_BUCKET,
      Key: objectKey,
    })
  );

export const downloadSubmissionObject = async ({ provider, objectKey, supabase }) => {
  if (provider === 'r2') {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: process.env.R2_SUBMISSIONS_BUCKET,
        Key: objectKey,
      })
    );

    if (!response.Body) throw new Error('The uploaded manuscript could not be read.');
    const bytes = await response.Body.transformToByteArray();
    return {
      bytes: Buffer.from(bytes),
      contentType: response.ContentType || null,
      contentLength: response.ContentLength ?? bytes.length,
    };
  }

  const { data, error } = await supabase.storage.from('manuscripts').download(objectKey);
  if (error || !data) {
    throw new Error(error?.message || 'The uploaded manuscript could not be read.');
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  return {
    bytes,
    contentType: data.type || null,
    contentLength: data.size || bytes.length,
  };
};

export const uploadSubmissionObject = async ({ provider, objectKey, bytes, supabase }) => {
  if (provider === 'r2') {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_SUBMISSIONS_BUCKET,
        Key: objectKey,
        Body: bytes,
        ContentType: 'application/pdf',
        CacheControl: 'private, no-store',
      })
    );
    return buildStoredSubmissionPath('r2', objectKey);
  }

  const { error } = await supabase.storage.from('manuscripts').upload(objectKey, bytes, {
    contentType: 'application/pdf',
    cacheControl: '0',
    upsert: false,
  });
  if (error) throw new Error(error.message || 'Could not store the sanitized manuscript.');
  return objectKey;
};

export const deleteSubmissionObject = async ({ provider, objectKey, supabase }) => {
  if (!objectKey) return;
  if (provider === 'r2') {
    await deleteR2Submission(objectKey);
    return;
  }

  const { error } = await supabase.storage.from('manuscripts').remove([objectKey]);
  if (error) throw new Error(error.message || 'Could not remove the manuscript.');
};
