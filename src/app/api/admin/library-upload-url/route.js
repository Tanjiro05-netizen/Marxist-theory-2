import { isAdminProfile, isAdminUser } from '@/src/lib/auth.js';
import { getServerAuthState } from '@/src/lib/server-auth.js';
import { isSafeStoragePath } from '@/src/lib/storage-path.js';
import { createClient } from '@/src/lib/supabase/server.js';

export const runtime = 'nodejs';

const ALLOWED_BUCKETS = new Set(['library', 'covers']);

const json = (body, status = 200) => Response.json(body, { status });

const requireAdmin = async () => {
  const { user, profile } = await getServerAuthState();

  if (!user) {
    return { error: json({ message: 'Not authenticated.' }, 401) };
  }

  if (!isAdminProfile(profile) && !isAdminUser(user)) {
    return { error: json({ message: 'Not authorized.' }, 403) };
  }

  return { user, profile };
};

export async function POST(request) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const bucket = `${body?.bucket || ''}`.trim();
  const path = `${body?.path || ''}`.trim();

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return json({ message: 'Invalid upload bucket.' }, 400);
  }

  if (!isSafeStoragePath(path)) {
    return json({ message: `Invalid upload filename: ${path || '(empty)'}` }, 400);
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });

  if (error) {
    return json({ message: error.message || 'Could not create upload URL.' }, 500);
  }

  return json({
    bucket,
    path: data.path,
    signedUrl: data.signedUrl,
    token: data.token,
  });
}
