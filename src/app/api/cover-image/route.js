const ALLOWED_STORAGE_BUCKETS = new Set(['covers', 'audiobooks']);

const isAllowedStorageImageUrl = (imageUrl) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  const supabaseOrigin = new URL(supabaseUrl).origin;
  const pathParts = imageUrl.pathname.split('/').filter(Boolean);

  return (
    imageUrl.protocol === 'https:' &&
    imageUrl.origin === supabaseOrigin &&
    pathParts[0] === 'storage' &&
    pathParts[1] === 'v1' &&
    pathParts[2] === 'object' &&
    pathParts[3] === 'public' &&
    ALLOWED_STORAGE_BUCKETS.has(pathParts[4]) &&
    pathParts.length > 5
  );
};

export async function GET(request) {
  const rawUrl = new URL(request.url).searchParams.get('url');
  let imageUrl;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return new Response('Invalid image URL', { status: 400 });
  }

  if (!isAllowedStorageImageUrl(imageUrl)) {
    return new Response('Image URL is not allowed', { status: 400 });
  }

  const upstream = await fetch(imageUrl.toString(), {
    next: { revalidate: 86400 },
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  if (!upstream.ok) {
    return new Response('Image not found', {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    return new Response('Invalid image response', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': contentType,
    },
  });
}
