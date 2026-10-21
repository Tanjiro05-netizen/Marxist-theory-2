import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { Loader, AlertCircle, List, Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as s from './EditorialReader.css.ts';
import * as chrome from './ReaderChrome.css.ts';
import ReaderTocSheet from './ReaderTocSheet';
import { loadReaderPosition, usePositionSaver, useReaderChrome } from './readerChrome';
import { sanitizeEpubHtml } from '../../lib/sanitize-html.js';

const TEXT_FAINT = 'var(--paper-faint)';

/* How much of the book to typeset before handing it to the reader, and how
   many sections to add per update after that. Small enough that the opening
   appears at once; large enough that appending is not a render per chapter. */
const FIRST_PAINT_SECTIONS = 2;
const FLUSH_EVERY = 6;

import { editorialProseCss } from './editorialProseCss';

const flattenToc = (items, depth = 0) =>
  (items || []).flatMap(item => [
    { ...item, depth },
    ...(item.subitems?.length ? flattenToc(item.subitems, depth + 1) : []),
  ]);

const isResolvableAsset = (url) => {
  const value = `${url || ''}`.trim();
  return value && !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value);
};

const resolveRelativePath = (section, assetPath) => {
  const [pathWithoutHash, hash = ''] = `${assetPath || ''}`.split('#');
  const [pathWithoutSearch, search = ''] = pathWithoutHash.split('?');
  const basePath = section?.url || section?.href || '/';
  const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const resolved = new URL(pathWithoutSearch, `https://epub.local${normalizedBase}`).pathname;
  return `${decodeURIComponent(resolved)}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
};

/* Extract a section's body HTML with archive assets resolved to blob URLs. */
const extractSectionBody = async (html, section, book) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  body?.querySelectorAll('script, style, link, iframe, object, embed, form, input, button, textarea, select, svg, math, audio, video, base, meta').forEach((el) => el.remove());

  const resolveAsset = async (element, attrName) => {
    const value = element.getAttribute(attrName);
    if (!isResolvableAsset(value) || !book?.archive?.createUrl) return;
    try {
      const resolved = await book.archive.createUrl(resolveRelativePath(section, value));
      if (resolved) element.setAttribute(attrName, resolved);
    } catch {
      /* leave the original attribute if the asset can't be resolved */
    }
  };

  const tasks = [];
  body?.querySelectorAll('img[src]').forEach((el) => tasks.push(resolveAsset(el, 'src')));
  await Promise.all(tasks);

  /* The page already carries the book title as its h1 — embedded title-page
     headings step down one level so the document keeps a single h1. */
  body?.querySelectorAll('h1').forEach((h1) => {
    const h2 = document.createElement('h2');
    h2.innerHTML = h1.innerHTML;
    [...h1.attributes].forEach((attr) => h2.setAttribute(attr.name, attr.value));
    h1.replaceWith(h2);
  });

  return sanitizeEpubHtml(body?.innerHTML || '');
};

/**
 * The editorial reading surface — the whole book as one typeset column
 * with a chapter rail and a crimson progress rule. Companion to the
 * paginated EpubReader, which remains available as the ebook view.
 */
const EditorialReader = ({ url, bookId, onProgressChange, fallbackUrl }) => {
  const { t } = useTranslation();
  const onProgressRef = useRef(onProgressChange);
  onProgressRef.current = onProgressChange;

  const [sections, setSections] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeHref, setActiveHref] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return 100;
    const saved = localStorage.getItem('editorial-fontsize');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  /* True once the last section is in the DOM — the point at which a saved
     reading position can be found and scrolled to. */
  const [fullyLoaded, setFullyLoaded] = useState(false);

  const { toolbarHidden, tocOpen, openToc, closeToc } = useReaderChrome();
  const savePosition = usePositionSaver(bookId);
  const tocBtnRef = useRef(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    setStatus('loading');
    setFullyLoaded(false);
    restoredRef.current = false;
    setSections([]);
    setToc([]);

    const book = ePub(url, { openAs: 'epub' });

    const load = async () => {
      try {
        await book.ready;

        let flatToc = [];
        try {
          const nav = await book.loaded.navigation;
          flatToc = flattenToc(nav.toc || []);
        } catch { /* some books ship without a nav doc */ }
        if (cancelled) return;
        setToc(flatToc);

        const spineItems = (book.spine?.spineItems || []).filter((sec) => sec.linear !== 'no');
        const rendered = [];

        /* Typesetting a whole book takes seconds on anything the length of
           Capital, and the reader only ever sees the top of it first. So
           publish the opening sections as soon as they exist and let the
           rest arrive underneath, while the reader is already reading. */
        for (const section of spineItems) {
          if (cancelled) return;
          const output = await section.render(book.load.bind(book));
          const html = await extractSectionBody(output, section, book);
          let canonical = section.href;
          try {
            canonical = book.canonical(section.href);
          } catch { /* keep raw href */ }
          rendered.push({ index: section.index, href: section.href, canonical, html });
          section.unload();

          const atFirstPaint = rendered.length === FIRST_PAINT_SECTIONS;
          const atFlushBoundary = rendered.length > FIRST_PAINT_SECTIONS
            && (rendered.length - FIRST_PAINT_SECTIONS) % FLUSH_EVERY === 0;

          if (atFirstPaint || atFlushBoundary) {
            if (cancelled) return;
            setSections(rendered.slice());
            if (atFirstPaint) {
              setStatus('ready');
              setActiveHref(rendered[0].canonical);
            }
          }
        }

        if (cancelled) return;
        setSections(rendered);
        setStatus('ready');
        setFullyLoaded(true);
        if (rendered.length) setActiveHref((current) => current || rendered[0].canonical);
      } catch (err) {
        if (cancelled) return;
        console.error('[EditorialReader] failed to load book:', err);
        setStatus('error');
      }
    };

    load();

    return () => {
      cancelled = true;
      if (book.isOpen) {
        book.destroy();
        return;
      }
      book.opened?.finally(() => book.destroy());
    };
  }, [url]);

  const labelForSection = useCallback((canonical) => {
    const base = canonical.split('#')[0];
    const match = toc.find((item) => {
      const itemBase = item.href.split('#')[0];
      try {
        return itemBase === base || itemBase.endsWith(base) || base.endsWith(itemBase);
      } catch {
        return false;
      }
    });
    return match?.label || null;
  }, [toc]);

  /* The page (window) is the scroller — progress and active chapter are
     derived from document scroll, not from any contained panel. The resting
     place is persisted (throttled) so the book resumes where it was left. */
  const handleScroll = useCallback(() => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
    setProgress(pct);
    if (onProgressRef.current) onProgressRef.current(pct);

    const nodes = Array.from(document.querySelectorAll('[data-section-canonical]'));
    const active = nodes.filter((n) => n.getBoundingClientRect().top <= 220).pop() || nodes[0];
    if (active) {
      const canonical = active.getAttribute('data-section-canonical');
      setActiveHref(canonical);
      if (restoredRef.current) savePosition({ canonical, pct });
    }
  }, [savePosition]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    /* Resume: jump straight back to the last resting section, silently.
       Only once the whole book is in — a section further down does not
       exist yet while the rest is still arriving — and only if the reader
       has not already moved, since pulling the page out from under someone
       who has started reading is worse than not resuming at all. */
    if (!restoredRef.current && fullyLoaded) {
      restoredRef.current = true;
      const saved = loadReaderPosition(bookId);
      if (saved?.canonical && window.scrollY < 4) {
        const target = Array.from(document.querySelectorAll('[data-section-canonical]'))
          .find((n) => {
            const c = n.getAttribute('data-section-canonical');
            return c === saved.canonical || c.endsWith(saved.canonical) || saved.canonical.endsWith(c);
          });
        if (target && target.getBoundingClientRect().top > window.innerHeight) {
          const top = target.getBoundingClientRect().top + window.scrollY - 84;
          window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        }
      }
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [status, fullyLoaded, handleScroll, bookId]);

  const scrollToHref = useCallback((href) => {
    if (!href) return;
    const [base, hash] = href.split('#');

    let target = null;
    if (hash) {
      target = document.querySelector(`[data-anchor-id="${hash}"], a[name="${hash}"], #${CSS.escape(hash)}`);
    }
    if (!target && base) {
      const canonicalBase = base;
      target = Array.from(document.querySelectorAll('[data-section-canonical]'))
        .find((n) => {
          const c = n.getAttribute('data-section-canonical');
          return c === canonicalBase || c.endsWith(base) || base.endsWith(c);
        });
    }
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, []);

  const handleColumnClick = useCallback((event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/i.test(href)) return;
    event.preventDefault();
    scrollToHref(href);
  }, [scrollToHref]);

  const activeIndex = sections.findIndex((sec) => sec.canonical === activeHref);
  const currentLabel = activeIndex >= 0 ? labelForSection(sections[activeIndex].canonical) : null;

  const adjustFont = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(160, Math.max(80, prev + delta));
      localStorage.setItem('editorial-fontsize', String(next));
      return next;
    });
  };

  const proseSize = Math.round(18 * (fontSize / 100));

  const tocSheetItems = toc.map((item, idx) => {
    const base = item.href.split('#')[0];
    return {
      key: `${item.href}-${idx}`,
      label: item.label,
      depth: item.depth,
      active: activeHref === base || activeHref?.endsWith(base) || base.endsWith(activeHref || ''),
      href: item.href,
    };
  });

  return (
    <div className={s.root} data-testid="editorial-reader">
      {/* Chapter rail */}
      <nav className={s.rail} aria-label="Contents">
        <div className={s.railHeader}>Contents</div>
        {toc.map((item, idx) => {
          const base = item.href.split('#')[0];
          const isActive = activeHref === base || activeHref?.endsWith(base) || base.endsWith(activeHref || '');
          return (
            <button
              key={`${item.href}-${idx}`}
              className={`${s.railItem} ${isActive ? s.railItemActive : ''}`}
              style={item.depth ? { paddingLeft: 'calc(16px + 12px)' } : undefined}
              onClick={() => scrollToHref(item.href)}
            >
              {item.label}
            </button>
          );
        })}
        {toc.length === 0 && status === 'ready' && (
          <div style={{ fontSize: 12, color: TEXT_FAINT, padding: '8px 0' }}>
            No table of contents in this edition.
          </div>
        )}
      </nav>

      <div>
        {/* Toolbar: chapter + index + contents + type controls. Slides away
            while the reader scrolls into the text (mobile). */}
        <div className={`${s.toolbar}${toolbarHidden ? ` ${chrome.toolbarHidden}` : ''}`}>
          <div className={s.chapterMeta}>
            <button
              type="button"
              ref={tocBtnRef}
              className={chrome.tocBtn}
              onClick={openToc}
              aria-label={t('book.tableOfContents', { defaultValue: 'Table of Contents' })}
              aria-haspopup="dialog"
              aria-expanded={tocOpen}
            >
              <List size={15} />
            </button>
            <span className={s.chapterLabel}>{currentLabel || 'Reading'}</span>
            <span className={s.chapterIndex}>
              {activeIndex >= 0 ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}` : ''}
            </span>
          </div>
          <div className={s.sizeControls}>
            <span className={chrome.progressPct} aria-label={t('book.readingProgress', { defaultValue: 'Reading progress' })}>
              {progress}%
            </span>
            <button className={s.sizeBtn} onClick={() => adjustFont(-10)} aria-label="Smaller text" title="Smaller text">
              <Minus size={15} />
            </button>
            <span className={s.sizeValue}>{fontSize}%</span>
            <button className={s.sizeBtn} onClick={() => adjustFont(10)} aria-label="Larger text" title="Larger text">
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Reading stage — flows with the page; progress rule rides the viewport top */}
        <div
          className={s.shell}
          onClick={handleColumnClick}
          data-testid="editorial-reader-scroll"
        >
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {status === 'loading' && (
            <div className={s.loading}>
              <Loader size={24} className="animate-spin" style={{ color: '#d41f3d' }} />
              Setting the type…
            </div>
          )}

          {status === 'error' && (
            <div className={s.errorBox}>
              <AlertCircle size={26} style={{ color: '#d41f3d' }} />
              <span className={s.errorText}>This edition could not be opened in the reading view.</span>
              {fallbackUrl && (
                <a className={s.fallbackLink} href={fallbackUrl} target="_blank" rel="noopener noreferrer">
                  Open the file directly
                </a>
              )}
            </div>
          )}

          {status === 'ready' && (
            <div
              className={s.column}
              style={{ fontSize: `${proseSize}px` }}
              data-testid="editorial-reader-column"
            >
              {sections.map((sec, i) => (
                <React.Fragment key={`${sec.index}-${sec.href}`}>
                  <section
                    data-section-canonical={sec.canonical}
                    data-editorial-section="true"
                    dangerouslySetInnerHTML={{ __html: sec.html }}
                  />
                  {i < sections.length - 1 && (
                    <div className={s.sectionRule} aria-hidden="true">
                      <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                      <span style={{ width: '6px', height: '6px', background: 'var(--red)', transform: 'rotate(45deg)' }} />
                      <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
              <style>{editorialProseCss}</style>
            </div>
          )}
        </div>
      </div>

      {/* Mobile contents — the rail's chapter list as a bottom sheet */}
      <ReaderTocSheet
        open={tocOpen}
        onClose={closeToc}
        items={tocSheetItems}
        onSelect={(item) => scrollToHref(item.href)}
        triggerRef={tocBtnRef}
      />
    </div>
  );
};


export default EditorialReader;
