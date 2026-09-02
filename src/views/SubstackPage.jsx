import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ChevronRight, ExternalLink, Image as ImageIcon, Search } from 'lucide-react';
import {
  SUBSTACK_AUTHOR_PROFILE_URL,
  SUBSTACK_PUBLICATION_URL,
  loadSubstackPosts,
} from '../services/substackApi';
import PageHeader from '../components/PageHeader';
import * as s from './SubstackPage.css.ts';

const formatDate = (value) => {
  if (!value) return 'Undated';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Undated';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getPostCategory = (post) => post.categories?.[0] || 'Substack';

const formatMeta = (post) => `${formatDate(post.publishedAt).toUpperCase()} · ${post.author || '☭/Acc'}`;

const SubstackPage = () => {
  const [posts, setPosts] = useState([]);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await loadSubstackPosts();
        if (cancelled) return;

        setPosts(result.posts);
        setSource(result.source);
        if (!result.posts.length && (result.feedError || result.archiveError)) {
          setError('Substack articles are unavailable right now.');
        } else if (result.posts.length > 0 && result.feedError) {
          setError('Showing cached articles. Live feed is temporarily unavailable.');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load Substack articles.');
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const values = new Set();
    posts.forEach((post) => {
      (post.categories || []).forEach((category) => {
        if (category) values.add(category);
      });
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === 'all' || (post.categories || []).includes(activeCategory);
      if (!matchesCategory) return false;

      if (!query) return true;

      return [post.title, post.excerpt, post.author, ...(post.categories || [])]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeCategory, posts, searchQuery]);

  const featuredPost = filteredPosts[0] || null;
  const sidePosts = filteredPosts.slice(1, 5);
  const popularPosts = posts.slice(2, 7);
  const archivePosts = filteredPosts.slice(5);

  return (
    <div className={s.page}>
      <main className={s.main}>
        <PageHeader
          kicker="Periodical"
          title="The Journal"
          note="Essays and dispatches syndicated from our Substack publication."
        />
        <section className={s.editorialNav} aria-label="Substack sections">
          <div className={s.sectionTabs}>
            <button
              type="button"
              className={`${s.sectionTab} ${activeCategory === 'all' ? s.sectionTabActive : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Home
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${s.sectionTab} ${activeCategory === category ? s.sectionTabActive : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
            <a href="#archive" className={s.sectionTab}>
              Archive
            </a>
          </div>
          <div className={s.navActions}>
            <a
              href={source?.url || SUBSTACK_PUBLICATION_URL}
              className={s.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Publication <ExternalLink size={13} />
            </a>
            <a
              href={source?.authorProfileUrl || SUBSTACK_AUTHOR_PROFILE_URL}
              className={s.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Author <ExternalLink size={13} />
            </a>
          </div>
        </section>

        <section className={s.searchBand} aria-label="Substack search">
          <div className={s.searchWrap}>
            <Search size={18} className={s.searchIcon} />
            <input
              className={s.searchInput}
              type="search"
              placeholder="Search Substack articles..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <span className={s.statusBar}>
            {loading ? 'Loading articles...' : `${filteredPosts.length} of ${posts.length} articles`}
          </span>
        </section>

        {error && !loading && filteredPosts.length === 0 ? (
          <div className={s.emptyState}>{error}</div>
        ) : featuredPost ? (
          <>
            <section className={s.heroGrid} aria-label="Featured Substack article">
              <Link href={`/substack/${featuredPost.slug}`} className={s.featuredStory}>
                {featuredPost.imageUrl ? (
                  <NextImage src={featuredPost.imageUrl} alt="" width={1200} height={800} className={s.featuredImage} />
                ) : (
                  <div className={s.featuredImageFallback}>
                    <ImageIcon size={44} />
                  </div>
                )}
                <div className={s.featuredCopy}>
                  <h1 className={s.featuredTitle}>{featuredPost.title}</h1>
                  {featuredPost.excerpt && (
                    <p className={s.featuredExcerpt}>{featuredPost.excerpt}</p>
                  )}
                  <p className={s.storyMeta}>{formatMeta(featuredPost)}</p>
                </div>
              </Link>

              <aside className={s.sideRail} aria-label="Recent Substack articles">
                {sidePosts.map((post) => (
                  <Link key={post.slug} href={`/substack/${post.slug}`} className={s.sideStory}>
                    <div className={s.sideStoryText}>
                      <h2 className={s.sideTitle}>{post.title}</h2>
                      {post.excerpt && <p className={s.sideExcerpt}>{post.excerpt}</p>}
                      <p className={s.storyMeta}>{formatMeta(post)}</p>
                    </div>
                    {post.imageUrl && <NextImage src={post.imageUrl} alt="" width={400} height={320} className={s.sideThumb} />}
                  </Link>
                ))}
              </aside>
            </section>

            {popularPosts.length > 0 && (
              <section className={s.popularSection} aria-label="Most Popular">
                <div className={s.sectionHeader}>
                  <h2 className={s.sectionTitle}>Most Popular</h2>
                  <a href="#archive" className={s.viewAllLink}>
                    View all
                  </a>
                </div>
                <div className={s.popularRail}>
                  {popularPosts.map((post) => (
                    <Link key={post.slug} href={`/substack/${post.slug}`} className={s.popularItem}>
                      <div className={s.popularText}>
                        <h3 className={s.popularTitle}>{post.title}</h3>
                        <p className={s.storyMeta}>{formatMeta(post)}</p>
                      </div>
                      {post.imageUrl ? (
                        <NextImage src={post.imageUrl} alt="" width={150} height={150} className={s.popularThumb} />
                      ) : (
                        <div className={s.popularThumbFallback} />
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section id="archive" className={s.archiveSection} aria-label="Substack archive">
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>Archive</h2>
                <span className={s.archiveCount}>{filteredPosts.length} posts</span>
              </div>
              {archivePosts.length > 0 ? (
                <div className={s.archiveGrid}>
                  {archivePosts.map((post) => (
                    <Link key={post.slug} href={`/substack/${post.slug}`} className={s.archiveCard}>
                      {post.imageUrl ? (
                        <NextImage src={post.imageUrl} alt="" width={600} height={338} className={s.archiveImage} />
                      ) : (
                        <div className={s.archiveImageFallback}>
                          <ImageIcon size={28} />
                        </div>
                      )}
                      <span className={s.category}>{getPostCategory(post)}</span>
                      <h3 className={s.archiveTitle}>{post.title}</h3>
                      {post.excerpt && <p className={s.archiveExcerpt}>{post.excerpt}</p>}
                      <span className={s.readCue}>
                        Read <ChevronRight size={14} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyState}>No additional Substack articles in this view.</div>
              )}
            </section>
          </>
        ) : !loading ? (
          <div className={s.emptyState}>No Substack articles match your search.</div>
        ) : null}
      </main>
    </div>
  );
};

export default SubstackPage;

