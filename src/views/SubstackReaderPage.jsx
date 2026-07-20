import DOMPurify from 'dompurify';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, ExternalLink, Tag, User } from 'lucide-react';
import {
  SUBSTACK_AUTHOR_PROFILE_URL,
  cleanSubstackContentHtml,
  loadSubstackPosts,
} from '../services/substackApi';
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

const fallbackSanitizeArticleHtml = (html = '') =>
  cleanSubstackContentHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=(["']).*?\1/gi, '')
    .replace(/\son\w+=\S+/gi, '')
    .replace(/\s(href|src)=(["'])javascript:[\s\S]*?\2/gi, ' $1="#"')
    .trim();

export const sanitizeArticleHtml = (html = '') => {
  if (!html) return '';

  const purifier = typeof DOMPurify?.sanitize === 'function'
    ? DOMPurify
    : DOMPurify?.default;
  const clean = typeof purifier?.sanitize === 'function' ? purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  }) : fallbackSanitizeArticleHtml(html);

  if (typeof DOMParser === 'undefined') return clean;

  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('a[href]').forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  return doc.body.innerHTML;
};

const SubstackReaderPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPost = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await loadSubstackPosts();
        if (cancelled) return;

        const found = result.posts.find((item) => item.slug === slug);
        setSource(result.source);

        if (!found) {
          setError('This Substack article is not in the archive yet.');
          setPost(null);
        } else {
          setPost(found);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load this Substack article.');
        setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const safeHtml = useMemo(
    () => sanitizeArticleHtml(cleanSubstackContentHtml(post?.contentHtml || '')),
    [post?.contentHtml]
  );
  const primaryCategory = post?.categories?.[0] || 'Substack';

  if (loading) {
    return (
      <div className={s.page}>
        <main className={s.readerShell}>
          <Link href="/substack" className={s.backLink}>
            <ArrowLeft size={16} /> Back to Substack
          </Link>
          <div className={s.emptyState}>Loading article...</div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={s.page}>
        <main className={s.readerShell}>
          <Link href="/substack" className={s.backLink}>
            <ArrowLeft size={16} /> Back to Substack
          </Link>
          <div className={s.emptyState}>{error || 'This Substack article is unavailable.'}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <article className={s.readerShell}>
        <Link href="/substack" className={s.backLink}>
          <ArrowLeft size={16} /> Back to Substack
        </Link>

        <header className={s.articleHeader}>
          <span className={s.eyebrow}>
            <Tag size={14} />
            {primaryCategory}
          </span>
          <h1 className={s.articleTitle}>{post.title}</h1>
          {post.excerpt && <p className={s.articleExcerpt}>{post.excerpt}</p>}
          <div className={s.articleMeta}>
            <span className={s.metaItem}>
              <CalendarDays size={15} />
              {formatDate(post.publishedAt)}
            </span>
            <a
              href={source?.authorProfileUrl || SUBSTACK_AUTHOR_PROFILE_URL}
              className={s.metaItem}
              target="_blank"
              rel="noopener noreferrer"
            >
              <User size={15} />
              {post.author || source?.authorName || '☭/Acc'}
            </a>
          </div>
        </header>

        {post.imageUrl && <NextImage src={post.imageUrl} alt="" width={1200} height={800} className={s.articleImage} />}

        {safeHtml ? (
          <section
            className={s.readerContent}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className={s.fallbackBody}>
            {post.excerpt || 'This article preview is available in the archive.'}
          </div>
        )}

        <footer className={s.readerFooter}>
          <Link href="/substack" className={s.outlineLink}>
            <ArrowLeft size={15} /> Archive
          </Link>
          <a
            href={post.url}
            className={s.outlineLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read on Substack <ExternalLink size={15} />
          </a>
        </footer>
      </article>
    </div>
  );
};

export default SubstackReaderPage;
