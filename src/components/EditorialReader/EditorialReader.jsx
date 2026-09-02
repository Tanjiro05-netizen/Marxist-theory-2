import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { Loader, AlertCircle, Minus, Plus } from 'lucide-react';
import * as s from './EditorialReader.css.ts';
import { sanitizeEpubHtml } from '../../lib/sanitize-html.js';

const TEXT_FAINT = '#6f6c61';

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

  return sanitizeEpubHtml(body?.innerHTML || '');
};

/**
 * The editorial reading surface — the whole book as one typeset column
 * with a chapter rail and a crimson progress rule. Companion to the
 * paginated EpubReader, which remains available as the ebook view.
 */
const EditorialReader = ({ url, onProgressChange, fallbackUrl }) => {
  const scrollRef = useRef(null);
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

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    setStatus('loading');
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
        }

        if (cancelled) return;
        setSections(rendered);
        setStatus('ready');
        if (rendered.length) setActiveHref(rendered[0].canonical);
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

  const handleScroll = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    const pct = maxScroll > 0 ? Math.round((scroller.scrollTop / maxScroll) * 100) : 0;
    setProgress(pct);
    if (onProgressRef.current) onProgressRef.current(pct);

    const nodes = Array.from(scroller.querySelectorAll('[data-section-canonical]'));
    const active = nodes.filter((n) => n.offsetTop <= scroller.scrollTop + 200).pop() || nodes[0];
    if (active) setActiveHref(active.getAttribute('data-section-canonical'));
  }, []);

  const scrollToHref = useCallback((href) => {
    const scroller = scrollRef.current;
    if (!scroller || !href) return;
    const [base, hash] = href.split('#');

    let target = null;
    if (hash) {
      target = scroller.querySelector(`[data-anchor-id="${hash}"], a[name="${hash}"], #${CSS.escape(hash)}`);
    }
    if (!target && base) {
      const canonicalBase = base;
      target = Array.from(scroller.querySelectorAll('[data-section-canonical]'))
        .find((n) => {
          const c = n.getAttribute('data-section-canonical');
          return c === canonicalBase || c.endsWith(base) || base.endsWith(c);
        });
    }
    if (target) {
      scroller.scrollTo({ top: Math.max(0, target.offsetTop - 24), behavior: 'smooth' });
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
        {/* Toolbar: current chapter + index + type controls */}
        <div className={s.toolbar}>
          <div className={s.chapterMeta}>
            <span className={s.chapterLabel}>{currentLabel || 'Reading'}</span>
            <span className={s.chapterIndex}>
              {activeIndex >= 0 ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}` : ''}
            </span>
          </div>
          <div className={s.sizeControls}>
            <button className={s.sizeBtn} onClick={() => adjustFont(-10)} aria-label="Smaller text" title="Smaller text">
              <Minus size={14} />
            </button>
            <span className={s.sizeValue}>{fontSize}%</span>
            <button className={s.sizeBtn} onClick={() => adjustFont(10)} aria-label="Larger text" title="Larger text">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Scroll shell with progress rule */}
        <div
          className={s.shell}
          ref={scrollRef}
          onScroll={handleScroll}
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
                      <span style={{ flex: 1, height: '1px', background: '#262a35' }} />
                      <span style={{ width: '6px', height: '6px', background: '#b3122e', transform: 'rotate(45deg)' }} />
                      <span style={{ flex: 1, height: '1px', background: '#262a35' }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
              <style>{editorialProseCss}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default EditorialReader;
