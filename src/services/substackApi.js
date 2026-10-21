export const SUBSTACK_PUBLICATION_URL = 'https://acc2049.substack.com';
export const SUBSTACK_FEED_URL = `${SUBSTACK_PUBLICATION_URL}/feed`;
export const SUBSTACK_AUTHOR_NAME = '☭/Acc';
export const SUBSTACK_AUTHOR_PROFILE_URL = 'https://substack.com/@leninistwarrior';
export const SUBSTACK_ARCHIVE_PATH = '/substack-archive.json';

const EXCERPT_LENGTH = 280;
const SUBSTACK_PROMO_PATTERN =
  /☭\/Acc(?:['’]|&rsquo;|&#8217;|&#x2019;)?s Substack is a reader-supported publication\.?\s*To receive new posts and support my work,?\s*consider becoming a free or paid subscriber\.?/i;

const envValues = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const getEnv = (key) => envValues[key] || '';

const decodeHtmlEntities = (value) => {
  if (!value || typeof document === 'undefined') return value || '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

const containsSubstackPromo = (value = '') =>
  SUBSTACK_PROMO_PATTERN.test(decodeHtmlEntities(String(value)).replace(/\s+/g, ' ').trim());

export const removeSubstackPromoText = (value = '') =>
  decodeHtmlEntities(String(value))
    .replace(SUBSTACK_PROMO_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();

const isSubscribeWidget = (element) => {
  if (!element?.querySelector) return false;
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hasEmailInput = Boolean(
    element.querySelector(
      'input[type="email"], input[placeholder*="email" i], input[aria-label*="email" i]'
    )
  );
  const hasSubscribeAction = Boolean(
    Array.from(element.querySelectorAll('button, input[type="submit"], a')).some((node) =>
      /subscribe/i.test(node.textContent || node.getAttribute('value') || '')
    )
  );
  const hasSubscribeClass = /subscribe|subscription|signup|email/i.test(
    `${element.getAttribute?.('class') || ''} ${element.getAttribute?.('id') || ''}`
  );

  return (hasEmailInput && (hasSubscribeAction || text.includes('subscribe'))) || hasSubscribeClass;
};

const removeAdjacentSubscribeWidgets = (element) => {
  let sibling = element.nextElementSibling;
  let inspected = 0;

  while (sibling && inspected < 4) {
    const next = sibling.nextElementSibling;
    const text = (sibling.textContent || '').replace(/\s+/g, ' ').trim();

    if (!text || isSubscribeWidget(sibling)) {
      sibling.remove();
      sibling = next;
      inspected += 1;
      continue;
    }

    break;
  }
};

export const cleanSubstackContentHtml = (html = '') => {
  const rawHtml = String(html || '');
  if (!rawHtml) return '';

  if (typeof DOMParser === 'undefined') {
    return rawHtml
      .replace(SUBSTACK_PROMO_PATTERN, '')
      .replace(/<form[\s\S]*?subscribe[\s\S]*?<\/form>/gi, '')
      .replace(/<(div|section|aside)[^>]*(subscribe|subscription|signup|email)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .trim();
  }

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const promoElements = Array.from(doc.body.querySelectorAll('*')).filter((element) => {
    if (!containsSubstackPromo(element.textContent || '')) return false;
    return !Array.from(element.children || []).some((child) =>
      containsSubstackPromo(child.textContent || '')
    );
  });

  promoElements.forEach((element) => {
    removeAdjacentSubscribeWidgets(element);
    element.remove();
  });

  Array.from(doc.body.querySelectorAll('form, div, section, aside')).forEach((element) => {
    if (isSubscribeWidget(element)) element.remove();
  });

  return doc.body.innerHTML.trim();
};

export const stripHtml = (html = '') =>
  decodeHtmlEntities(String(html))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

export const slugFromSubstackUrl = (url = '', fallbackTitle = '') => {
  try {
    const parsed = new URL(url);
    const postIndex = parsed.pathname.split('/').filter(Boolean).indexOf('p');
    if (postIndex >= 0) {
      const slug = parsed.pathname.split('/').filter(Boolean)[postIndex + 1];
      if (slug) return slug;
    }
  } catch (_error) {
    // Fall through to title slug.
  }

  return slugify(fallbackTitle);
};

export const inferSubstackCategories = ({ title = '', excerpt = '' } = {}) => {
  const haystack = [title, excerpt].join(' ').toLowerCase();

  if (/\bshort note\b/.test(haystack)) return ['Short Notes'];
  if (/science|dialectic|invariance|technical|prolegomena|mathematics|physics|stem/.test(haystack)) {
    return ['Foundations of Science'];
  }

  return ['Personal'];
};

const textFrom = (node, tagName) => {
  const matches = node?.getElementsByTagName?.(tagName);
  return matches?.[0]?.textContent?.trim() || '';
};

const attrFrom = (node, tagName, attrName) => {
  const matches = node?.getElementsByTagName?.(tagName);
  return matches?.[0]?.getAttribute?.(attrName) || '';
};

export const extractImageUrl = (itemNode, html = '') => {
  const mediaUrl =
    attrFrom(itemNode, 'media:content', 'url') ||
    attrFrom(itemNode, 'media:thumbnail', 'url');
  if (mediaUrl) return mediaUrl;

  const enclosures = Array.from(itemNode?.getElementsByTagName?.('enclosure') || []);
  const imageEnclosure = enclosures.find((node) =>
    (node.getAttribute('type') || '').toLowerCase().startsWith('image/')
  );
  if (imageEnclosure?.getAttribute('url')) return imageEnclosure.getAttribute('url');

  if (html && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector('img[src]')?.getAttribute('src') || '';
  }

  return '';
};

/**
 * Sanitize a Substack image URL. CDN wrapper URLs
 * (`substackcdn.com/image/fetch/…/https%3A%2F%2F…`) sometimes contain
 * corrupted transformation parameters (e.g. `$s_!N1DW!`). When that happens
 * the entire URL is broken. This helper extracts the underlying S3 URL from
 * the wrapper and returns it directly.
 */
export const sanitizeImageUrl = (imageUrl = '') => {
  const url = String(imageUrl || '').trim();
  if (!url) return '';

  // Only process substackcdn CDN wrapper URLs.
  if (url.includes('substackcdn.com/image/fetch/')) {
    try {
      // The raw S3 URL is the last path segment, percent-encoded.
      const marker = '/https';
      const idx = url.indexOf(marker);
      if (idx >= 0) {
        const encoded = url.slice(idx + 1); // "https%3A%2F%2F…"
        const decoded = decodeURIComponent(encoded);
        if (decoded.startsWith('https://')) return decoded;
      }
    } catch (_err) {
      // Fall through and return the original URL.
    }
  }

  return url;
};

export const normalizeSubstackPost = (raw = {}) => {
  const title = `${raw.title || ''}`.trim() || 'Untitled Substack post';
  const url = `${raw.url || raw.link || ''}`.trim();
  const contentHtml = cleanSubstackContentHtml(raw.contentHtml || raw.content || '');
  const description = cleanSubstackContentHtml(raw.description || raw.excerpt || '');
  const excerptSource = removeSubstackPromoText(stripHtml(description || contentHtml));
  const excerpt =
    excerptSource.length > EXCERPT_LENGTH
      ? `${excerptSource.slice(0, EXCERPT_LENGTH).trim()}...`
      : excerptSource;
  const publishedAt = raw.publishedAt || raw.pubDate || raw.isoDate || '';

  const categories = Array.isArray(raw.categories) ? raw.categories.filter(Boolean) : [];

  return {
    id: raw.id || raw.guid || slugFromSubstackUrl(url, title),
    title,
    slug: raw.slug || slugFromSubstackUrl(url, title),
    url,
    publishedAt,
    author: raw.author || SUBSTACK_AUTHOR_NAME,
    excerpt,
    contentHtml,
    imageUrl: sanitizeImageUrl(raw.imageUrl),
    categories: categories.length ? categories : inferSubstackCategories({ title, excerpt }),
  };
};

export const parseSubstackFeedXml = (xml = '') => {
  if (typeof DOMParser === 'undefined') {
    throw new Error('RSS parsing requires DOMParser.');
  }

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('Substack RSS feed could not be parsed.');
  }

  const channel = doc.getElementsByTagName('channel')[0];
  const items = Array.from(doc.getElementsByTagName('item'));
  const posts = items.map((item) => {
    const title = textFrom(item, 'title');
    const url = textFrom(item, 'link');
    const contentHtml = textFrom(item, 'content:encoded') || textFrom(item, 'description');
    const description = textFrom(item, 'description');
    const categories = Array.from(item.getElementsByTagName('category')).map((node) =>
      node.textContent?.trim()
    );

    return normalizeSubstackPost({
      id: textFrom(item, 'guid') || url,
      title,
      url,
      publishedAt: textFrom(item, 'pubDate'),
      author: textFrom(item, 'dc:creator') || SUBSTACK_AUTHOR_NAME,
      description,
      contentHtml,
      imageUrl: extractImageUrl(item, contentHtml),
      categories,
    });
  });

  return {
    source: {
      title: textFrom(channel, 'title') || '☭/Acc’s Substack',
      url: textFrom(channel, 'link') || SUBSTACK_PUBLICATION_URL,
      feedUrl: SUBSTACK_FEED_URL,
      authorName: SUBSTACK_AUTHOR_NAME,
      authorProfileUrl: SUBSTACK_AUTHOR_PROFILE_URL,
    },
    posts,
  };
};

export const mergeSubstackPosts = (feedPosts = [], archivePosts = []) => {
  const bySlug = new Map();

  archivePosts.map(normalizeSubstackPost).forEach((post) => {
    if (post.slug) bySlug.set(post.slug, post);
  });

  feedPosts.map(normalizeSubstackPost).forEach((post) => {
    if (!post.slug) return;
    const existing = bySlug.get(post.slug);
    if (existing) {
      // Feed posts take priority, but preserve fields the feed may lack.
      bySlug.set(post.slug, {
        ...existing,
        ...post,
        imageUrl: post.imageUrl || existing.imageUrl,
        contentHtml: post.contentHtml || existing.contentHtml,
      });
    } else {
      bySlug.set(post.slug, post);
    }
  });

  return Array.from(bySlug.values()).sort((left, right) => {
    const leftTime = new Date(left.publishedAt || 0).getTime();
    const rightTime = new Date(right.publishedAt || 0).getTime();
    return rightTime - leftTime;
  });
};

const getSubstackFunctionUrl = () => {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  return supabaseUrl ? `${supabaseUrl}/functions/v1/substack-feed` : '';
};

const getFunctionHeaders = () => {
  const anonKey =
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const headers = { 'Content-Type': 'application/json' };

  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  return headers;
};

export const fetchStaticSubstackArchive = async (fetchImpl = fetch) => {
  const response = await fetchImpl(SUBSTACK_ARCHIVE_PATH, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Static Substack archive could not be loaded.');

  const payload = await response.json();
  return {
    source: payload.source || null,
    posts: Array.isArray(payload) ? payload.map(normalizeSubstackPost) : (payload.posts || []).map(normalizeSubstackPost),
  };
};

export const fetchLiveSubstackFeed = async (fetchImpl = fetch) => {
  const functionUrl = getSubstackFunctionUrl();
  if (!functionUrl) throw new Error('Substack feed function is not configured.');

  const response = await fetchImpl(functionUrl, {
    method: 'GET',
    headers: getFunctionHeaders(),
  });

  if (!response.ok) throw new Error('Live Substack feed could not be loaded.');

  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);

  return {
    source: payload.source || null,
    posts: (payload.posts || []).map(normalizeSubstackPost),
  };
};

export const loadSubstackPosts = async ({ fetchImpl = fetch } = {}) => {
  const [archiveResult, liveResult] = await Promise.allSettled([
    fetchStaticSubstackArchive(fetchImpl),
    fetchLiveSubstackFeed(fetchImpl),
  ]);

  const archive = archiveResult.status === 'fulfilled' ? archiveResult.value : { posts: [] };
  const live = liveResult.status === 'fulfilled' ? liveResult.value : { posts: [] };
  const posts = mergeSubstackPosts(live.posts, archive.posts);

  return {
    source: live.source || archive.source || {
      title: '☭/Acc’s Substack',
      url: SUBSTACK_PUBLICATION_URL,
      feedUrl: SUBSTACK_FEED_URL,
      authorName: SUBSTACK_AUTHOR_NAME,
      authorProfileUrl: SUBSTACK_AUTHOR_PROFILE_URL,
    },
    posts,
    feedError: liveResult.status === 'rejected' ? liveResult.reason?.message : '',
    archiveError: archiveResult.status === 'rejected' ? archiveResult.reason?.message : '',
  };
};
