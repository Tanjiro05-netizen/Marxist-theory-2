import {
  cleanSubstackContentHtml,
  loadSubstackPosts,
  mergeSubstackPosts,
  normalizeSubstackPost,
  parseSubstackFeedXml,
  slugFromSubstackUrl,
} from './substackApi';

const rssFixture = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>☭/Acc’s Substack</title>
    <link>https://acc2049.substack.com</link>
    <item>
      <title>The Realm of Freedom</title>
      <link>https://acc2049.substack.com/p/the-realm-of-freedom?utm_source=feed</link>
      <guid>post-1</guid>
      <pubDate>Wed, 29 Apr 2026 18:15:00 GMT</pubDate>
      <dc:creator>☭/Acc</dc:creator>
      <category>Personal</category>
      <description><![CDATA[What do we do when the struggle for survival ends?]]></description>
      <content:encoded><![CDATA[<p>What do we do?</p><img src="https://example.com/freedom.jpg" /><script>alert('x')</script>]]></content:encoded>
    </item>
  </channel>
</rss>`;

describe('substackApi', () => {
  test('extracts stable slugs from Substack post URLs', () => {
    expect(slugFromSubstackUrl('https://acc2049.substack.com/p/the-realm-of-freedom?utm=1')).toBe(
      'the-realm-of-freedom'
    );
    expect(slugFromSubstackUrl('not-a-url', 'A Short Note on Fascism II')).toBe(
      'a-short-note-on-fascism-ii'
    );
  });

  test('normalizes RSS XML into the site post shape', () => {
    const result = parseSubstackFeedXml(rssFixture);

    expect(result.source.title).toBe('☭/Acc’s Substack');
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      title: 'The Realm of Freedom',
      slug: 'the-realm-of-freedom',
      author: '☭/Acc',
      imageUrl: 'https://example.com/freedom.jpg',
      categories: ['Personal'],
    });
    expect(result.posts[0].excerpt).toBe('What do we do when the struggle for survival ends?');
  });

  test('removes Substack subscribe prompts and adjacent widgets from article content', () => {
    const dirtyHtml = `
      <p>Keep this opening paragraph.</p>
      <p>☭/Acc’s Substack is a reader-supported publication. To receive new posts and support my work, consider becoming a free or paid subscriber.</p>
      <div class="subscription-widget-wrap">
        <input type="email" placeholder="Type your email…" />
        <button>Subscribe</button>
      </div>
      <p>Keep this closing paragraph.</p>
    `;

    const cleaned = cleanSubstackContentHtml(dirtyHtml);
    const normalized = normalizeSubstackPost({
      title: 'Prompt Test',
      url: 'https://acc2049.substack.com/p/prompt-test',
      contentHtml: dirtyHtml,
    });

    expect(cleaned).toContain('Keep this opening paragraph.');
    expect(cleaned).toContain('Keep this closing paragraph.');
    expect(cleaned).not.toContain('reader-supported publication');
    expect(cleaned).not.toContain('Type your email');
    expect(cleaned).not.toContain('Subscribe</button>');
    expect(normalized.contentHtml).not.toContain('reader-supported publication');
    expect(normalized.excerpt).not.toContain('reader-supported publication');
  });

  test('keeps feed posts over backfill duplicates and sorts newest first', () => {
    const merged = mergeSubstackPosts(
      [
        normalizeSubstackPost({
          title: 'Live version',
          url: 'https://acc2049.substack.com/p/shared',
          publishedAt: '2026-04-29T18:15:00.000Z',
        }),
      ],
      [
        normalizeSubstackPost({
          title: 'Older static post',
          url: 'https://acc2049.substack.com/p/older',
          publishedAt: '2025-03-01T00:00:00.000Z',
        }),
        normalizeSubstackPost({
          title: 'Static version',
          url: 'https://acc2049.substack.com/p/shared',
          publishedAt: '2024-01-01T00:00:00.000Z',
        }),
      ]
    );

    expect(merged.map((post) => post.slug)).toEqual(['shared', 'older']);
    expect(merged[0].title).toBe('Live version');
  });

  test('loads static archive when live feed is unavailable', async () => {
    const fetchImpl = jest.fn(async (url) => {
      if (url === '/substack-archive.json') {
        return {
          ok: true,
          json: async () => ({
            posts: [
              {
                title: 'Archived Post',
                url: 'https://acc2049.substack.com/p/archived-post',
                publishedAt: '2026-02-01T00:00:00.000Z',
              },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({ posts: [] }) };
    });

    const result = await loadSubstackPosts({ fetchImpl });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].slug).toBe('archived-post');
    expect(result.feedError).toBeTruthy();
  });

  test('returns an empty list when feed and archive are both empty or unavailable', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, json: async () => ({}) }));

    const result = await loadSubstackPosts({ fetchImpl });

    expect(result.posts).toEqual([]);
    expect(result.feedError).toBeTruthy();
    expect(result.archiveError).toBeTruthy();
  });
});
