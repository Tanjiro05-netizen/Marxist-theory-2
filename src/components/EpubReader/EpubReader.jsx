import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, ChevronRight, List, Minus, Plus, X, 
  Settings2, MoveHorizontal, MoveVertical, Type, Loader, AlertCircle,
  Maximize2, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  findFullBookAnchorTarget,
  getHrefParts,
  getScrollTopForTarget,
} from './epubNavigation.js';
import { sanitizeEpubHtml } from '../../lib/sanitize-html.js';

const ToolbarBtn = ({ icon: Icon, active, onClick, title }) => (
  <motion.button
    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    aria-label={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: active ? 'rgba(179, 18, 46, 0.18)' : 'transparent',
      color: active ? '#d41f3d' : 'rgba(255,255,255,0.6)',
      border: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s',
    }}
  >
    <Icon size={18} />
  </motion.button>
);

const NavButtonArea = ({ direction, onClick, disabled }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: disabled ? 0 : 1 }}
    style={{
      position: 'absolute', 
      [direction === 'left' ? 'left' : 'right']: 0, 
      top: 0, bottom: 0, width: '15%', minWidth: '60px',
      zIndex: 10,
      display: 'flex', alignItems: 'center', 
      justifyContent: direction === 'left' ? 'flex-start' : 'flex-end', 
      padding: direction === 'left' ? '0 0 0 30px' : '0 30px 0 0',
      cursor: disabled ? 'default' : 'pointer',
      pointerEvents: disabled ? 'none' : 'auto',
    }}
    onClick={disabled ? null : onClick}
  >
    <motion.div 
      whileHover={{ scale: 1.1, background: 'rgba(40,40,42,0.9)' }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        width: '56px', height: '56px', 
        borderRadius: '50%', 
        background: 'rgba(11,13,18,0.6)', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        color: '#fff', border: '1px solid #262a35',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        transition: 'background 0.2s'
      }}
    >
      {direction === 'left' ? <ChevronLeft size={28} /> : <ChevronRight size={28} />}
    </motion.div>
  </motion.div>
);

const flattenToc = (items, depth = 0) =>
  (items || []).flatMap(item => [
    { ...item, depth },
    ...(item.subitems?.length ? flattenToc(item.subitems, depth + 1) : []),
  ]);

const SCROLLED_VIEW_MODE = 'scrolled-continuous';

const normalizeViewMode = (mode) => {
  if (mode === 'paginated') return 'paginated';
  return SCROLLED_VIEW_MODE;
};

const isResolvableEpubAsset = (url) => {
  const value = `${url || ''}`.trim();
  return value && !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value);
};

const resolveRelativeEpubPath = (section, assetPath) => {
  const [pathWithoutHash, hash = ''] = `${assetPath || ''}`.split('#');
  const [pathWithoutSearch, search = ''] = pathWithoutHash.split('?');
  const basePath = section?.url || section?.href || '/';
  const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const resolved = new URL(pathWithoutSearch, `https://epub.local${normalizedBase}`).pathname;

  return `${decodeURIComponent(resolved)}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
};

const EpubReader = ({ url, title, onProgressChange, onToggleFullscreen, isFullscreen, fallbackUrl }) => {
  const { t } = useTranslation();
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const locationRef = useRef(null);
  const fullScrollRef = useRef(null);
  const tocRef = useRef([]);
  const touchStartXRef = useRef(null);
  const hideTimerRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const onProgressRef = useRef(onProgressChange);
  onProgressRef.current = onProgressChange;

  const storageKey = url ? `epub-cfi::${url.split('?')[0].split('/').pop()}` : null;
  const scrollStorageKey = storageKey ? `${storageKey}::scroll` : null;

  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('epub-fontsize');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('epub-viewmode');
    return normalizeViewMode(saved);
  });
  const [showUI, setShowUI] = useState(true);
  const [currentChapter, setCurrentChapter] = useState('');
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isFullBookRendered, setIsFullBookRendered] = useState(false);
  const [fullBookSections, setFullBookSections] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);
  const isScrolledMode = viewMode === SCROLLED_VIEW_MODE;

  // Auto-hide UI after 3s of inactivity
  const resetIdleTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [resetIdleTimer]);

  // Initialize book structure only once on load
  useEffect(() => {
    if (!url) return;
    setLoadError(null);

    // Restore saved reading position
    const savedCfi = storageKey ? localStorage.getItem(storageKey) : null;
    if (savedCfi) locationRef.current = savedCfi;

    // Create new book instance
    const book = ePub(url, { openAs: 'epub' });
    bookRef.current = book;

    book.loaded.navigation.then((nav) => {
      const flat = flattenToc(nav.toc || []);
      setToc(flat);
      tocRef.current = flat;
    }).catch(() => setLoadError('Failed to load table of contents.'));

    book.loaded.spine.catch(() => setLoadError('Failed to load book content.'));

    return () => {
      if (bookRef.current === book) {
        bookRef.current = null;
      }

      if (book.isOpen) {
        book.destroy();
        return;
      }

      book.opened?.finally(() => book.destroy());
    };
  }, [url, reloadNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (renditionRef.current && viewMode === 'paginated') renditionRef.current.next();
  }, [viewMode]);

  const goPrev = useCallback(() => {
    if (renditionRef.current && viewMode === 'paginated') renditionRef.current.prev();
  }, [viewMode]);

  // Handle keys for top-level window
  useEffect(() => {
    const handleKey = (e) => {
      resetIdleTimer();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowToc(false);
      }
    };
    const handleMove = () => resetIdleTimer();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMove, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMove);
    };
  }, [goNext, goPrev, resetIdleTimer]);

  const getCanonicalHref = useCallback((href) => {
    const base = `${href || ''}`.split('#')[0];
    if (!base) return '';
    try {
      return bookRef.current?.canonical(base) || base;
    } catch {
      return base;
    }
  }, []);

  const extractSectionBody = useCallback(async (html, section, book) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    body?.querySelectorAll('[id]').forEach((element) => {
      element.setAttribute('data-epub-anchor-id', element.id);
    });
    body?.querySelectorAll('[name]').forEach((element) => {
      element.setAttribute('data-epub-anchor-name', element.getAttribute('name') || '');
    });

    const resolveAsset = async (element, attrName, namespace = null) => {
      const value = namespace
        ? element.getAttributeNS(namespace, attrName) || element.getAttribute(`xlink:${attrName}`)
        : element.getAttribute(attrName);

      if (!isResolvableEpubAsset(value) || !book?.archive?.createUrl) return;

      try {
        const resolvedPath = resolveRelativeEpubPath(section, value);
        const resolvedUrl = await book.archive.createUrl(resolvedPath);
        if (resolvedUrl) {
          if (namespace) {
            element.setAttributeNS(namespace, attrName, resolvedUrl);
            element.setAttribute(`xlink:${attrName}`, resolvedUrl);
          }
          element.setAttribute(attrName, resolvedUrl);
        }
      } catch (error) {
        console.warn('[EPUB] Could not resolve embedded asset:', value, error);
      }
    };

    const assetTasks = [];
    body?.querySelectorAll('img[src]').forEach((element) => {
      assetTasks.push(resolveAsset(element, 'src'));
    });
    body?.querySelectorAll('svg image').forEach((element) => {
      assetTasks.push(resolveAsset(element, 'href', 'http://www.w3.org/1999/xlink'));
      assetTasks.push(resolveAsset(element, 'href'));
    });

    await Promise.all(assetTasks);

    return sanitizeEpubHtml(body?.innerHTML || html);
  }, []);

  useEffect(() => {
    if (!bookRef.current || !isScrolledMode) {
      setIsFullBookRendered(false);
      setFullBookSections([]);
      return;
    }

    let cancelled = false;
    const book = bookRef.current;
    setIsRendered(false);
    setIsFullBookRendered(false);
    setLoadError(null);

    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      setLoadError(t('book.epubRenderTimeout'));
    }, 20000);

    const loadFullBook = async () => {
      try {
        await book.ready;
        const sections = (book.spine?.spineItems || []).filter((section) => section.linear !== 'no');
        const renderedSections = [];

        for (const section of sections) {
          if (cancelled) return;
          const output = await section.render(book.load.bind(book));
          renderedSections.push({
            index: section.index,
            href: section.href,
            canonical: (() => {
              try {
                return book.canonical(section.href);
              } catch {
                return section.href;
              }
            })(),
            html: await extractSectionBody(output, section, book),
          });
          section.unload();
        }

        if (cancelled) return;
        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        setFullBookSections(renderedSections);
        setIsFullBookRendered(true);
        setIsRendered(true);

        requestAnimationFrame(() => {
          const scroller = fullScrollRef.current;
          if (!scroller) return;
          const savedScroll = scrollStorageKey ? Number(localStorage.getItem(scrollStorageKey)) : 0;
          scroller.scrollTop = Number.isFinite(savedScroll) && savedScroll > 0 ? savedScroll : 0;
          const firstTocItem = tocRef.current[0];
          setCurrentChapter(firstTocItem?.label || title || '');
        });
      } catch (err) {
        if (cancelled) return;
        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        console.error('[EPUB] Full-book render failed:', err);
        setLoadError('Failed to render book.');
      }
    };

    loadFullBook();

    return () => {
      cancelled = true;
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [extractSectionBody, isScrolledMode, t, title, url, reloadNonce, scrollStorageKey]);

  const handleFullBookScroll = useCallback(() => {
    const scroller = fullScrollRef.current;
    if (!scroller) return;
    resetIdleTimer();

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    const pct = maxScroll > 0 ? Math.round((scroller.scrollTop / maxScroll) * 100) : 0;
    setReadingProgress(pct);
    if (onProgressRef.current) onProgressRef.current(pct);
    if (scrollStorageKey) {
      localStorage.setItem(scrollStorageKey, String(Math.max(0, Math.round(scroller.scrollTop))));
    }

    const sectionNodes = Array.from(scroller.querySelectorAll('[data-epub-section="true"]'));
    const activeNode = sectionNodes
      .filter((node) => node.offsetTop <= scroller.scrollTop + 160)
      .pop() || sectionNodes[0];

    if (activeNode && bookRef.current && tocRef.current.length) {
      const canonical = activeNode.getAttribute('data-canonical');
      const match = tocRef.current.find((item) => {
        const base = item.href.split('#')[0];
        try {
          return bookRef.current.canonical(base) === canonical;
        } catch {
          return base === canonical;
        }
      });
      if (match) setCurrentChapter(match.label);
    }
  }, [resetIdleTimer, scrollStorageKey]);

  const scrollToFullBookHref = useCallback((href, behavior = 'smooth', { sourceAnchor } = {}) => {
    const scroller = fullScrollRef.current;
    if (!scroller || !href) return false;

    const { base, hash } = getHrefParts(href);
    const targetCanonical = base ? getCanonicalHref(base) : null;
    let targetSection = null;

    if (targetCanonical) {
      const sections = Array.from(scroller.querySelectorAll('[data-epub-section="true"]'));
      targetSection = sections.find((section) => section.getAttribute('data-canonical') === targetCanonical);
    }

    let targetNode = null;
    if (hash) {
      targetNode = findFullBookAnchorTarget(scroller, {
        hash,
        preferredSection: targetSection,
        sourceAnchor,
      });
    }

    if (!targetNode && targetSection && base) {
      targetNode = targetSection;
    }

    if (!targetNode) return false;

    const top = Math.max(0, getScrollTopForTarget(scroller, targetNode));
    scroller.scrollTo({ top, behavior });
    return true;
  }, [getCanonicalHref]);

  const handleFullBookClick = useCallback((event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    const isExternal = /^(https?:|mailto:|tel:)/i.test(href);
    if (isExternal) return;

    event.preventDefault();
    event.stopPropagation();

    if (!scrollToFullBookHref(href, 'smooth', { sourceAnchor: anchor })) {
      resetIdleTimer();
    }
  }, [resetIdleTimer, scrollToFullBookHref]);

  useEffect(() => {
    if (!url) return undefined;

    let restoreTimer;
    const restoreReader = () => {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (document.visibilityState && document.visibilityState !== 'visible') return;

        if (isScrolledMode) {
          const hasSections = !!fullScrollRef.current?.querySelector('[data-epub-section="true"]');
          if (loadError || !isFullBookRendered || !hasSections) {
            setReloadNonce((value) => value + 1);
          }
          return;
        }

        if (renditionRef.current && locationRef.current) {
          renditionRef.current.display(locationRef.current).catch(() => {
            setReloadNonce((value) => value + 1);
          });
        } else if (loadError || !isRendered) {
          setReloadNonce((value) => value + 1);
        }
      }, 150);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') restoreReader();
    };

    window.addEventListener('pageshow', restoreReader);
    window.addEventListener('focus', restoreReader);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(restoreTimer);
      window.removeEventListener('pageshow', restoreReader);
      window.removeEventListener('focus', restoreReader);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullBookRendered, isRendered, isScrolledMode, loadError, url]);

  // Re-render rendition whenever view mode changes
  useEffect(() => {
    if (!viewerRef.current || !bookRef.current || isScrolledMode) return;
    
    setIsRendered(false);
    setLoadError(null);

    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      setLoadError(t('book.epubRenderTimeout'));
    }, 12000);

    if (renditionRef.current) {
      try {
        renditionRef.current.destroy();
      } catch (e) {} // Ignore destroy errors on cleanup
    }

    const options = {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: viewMode,
    };
    
    if (isScrolledMode) {
      options.manager = 'continuous';
    }

    const rendition = bookRef.current.renderTo(viewerRef.current, options);
    renditionRef.current = rendition;

    const bodyStyles = {
      'background': '#08090d !important',
      'color': '#c9c5b8 !important',
      'font-family': 'Newsreader, Georgia, "Times New Roman", serif !important',
      'line-height': '1.9 !important',
    };

    if (isScrolledMode) {
      bodyStyles['padding'] = '80px 8% 100px 8% !important';
      bodyStyles['max-width'] = '680px !important';
      bodyStyles['margin'] = '0 auto !important';
      bodyStyles['overflow-x'] = 'hidden !important';
    } else {
      // In paginated mode, avoid !important overrides on margin, max-width, or overflow
      // so epub.js column calculations work correctly without glitching.
      bodyStyles['padding'] = '40px 5% !important';
    }

    rendition.themes.default({
      'html': {
        'background': '#08090d !important',
      },
      'body': bodyStyles,

      // Chapter/section headings — .calibre7, .H, .H1, etc. all use color:windowtext
      'h1, h2, h3, h4, h5, h6': {
        'color': '#ece9e0 !important',
        'font-family': 'Cormorant Garamond, Georgia, serif !important',
        'font-weight': '500 !important',
        'margin-top': '2em !important',
        'margin-bottom': '0.8em !important',
        'line-height': '1.3 !important',
      },
      '.H, .H1, .calibre7, .calibre28, .calibre35': {
        'color': '#ece9e0 !important',
      },

      // Body paragraphs
      'p, .MsoNormal': {
        'color': '#c9c5b8 !important',
        'line-height': '1.9 !important',
        'margin-bottom': '1.1em !important',
        'margin-top': '0 !important',
        'text-align': 'left !important',
      },

      // Table of contents entries
      '.MsoToc, .MsoToc1, .MsoToc2': {
        'color': '#c9c5b8 !important',
      },

      // Block-indented quotes (.indentb) and quotations (.quoteb)
      '.indentb': {
        'color': '#c9c5b8 !important',
        'border-left': '2px solid #b3122e !important',
        'padding-left': '1.4em !important',
        'margin-left': '0 !important',
        'margin-right': '0 !important',
        'font-style': 'italic !important',
      },
      '.quoteb': {
        'color': '#c9c5b8 !important',
        'border-left': '2px solid #b3122e !important',
        'padding-left': '1.4em !important',
        'margin-left': '0 !important',
        'margin-right': '0 !important',
      },

      // Links
      'a': {
        'color': '#d41f3d !important',
        'text-decoration': 'none !important',
        'border-bottom': '1px solid rgba(212, 31, 61, 0.3) !important',
      },

      // Italic spans used heavily throughout Marx's text
      'em, i, .calibre6, .calibre27': {
        'font-style': 'italic !important',
        'color': 'inherit !important',
      },

      // Translator / editor inline notes (e.g. [aufheben])
      '.inote': {
        'color': 'rgba(255,255,255,0.38) !important',
        'font-size': '0.88em !important',
      },

      // Endnote superscript references
      '.enote': {
        'color': '#d41f3d !important',
        'font-size': '0.78em !important',
        'font-weight': 'bold !important',
        'font-family': 'inherit !important',
      },

      // Editorial context annotations
      '.context': {
        'color': 'rgba(255,255,255,0.42) !important',
        'font-style': 'italic !important',
      },

      // Defined terms
      '.term': {
        'color': '#4a7fb5 !important',
        'font-weight': 'bold !important',
        'font-family': 'inherit !important',
      },

      // Calibre utility color classes — all use dark/navy/gray colors invisible on dark bg
      '.calibre10': { 'color': 'rgba(255,255,255,0.38) !important' },
      '.calibre11': { 'color': 'rgba(255,255,255,0.5) !important' },
      '.calibre12': { 'color': '#c9c5b8 !important' },
      '.calibre17': { 'color': 'rgba(255,255,255,0.38) !important' },
      '.calibre19': { 'color': '#7ba3c9 !important' },
      '.calibre20': { 'color': '#c9c5b8 !important' },
      '.calibre21': { 'color': 'rgba(255,255,255,0.5) !important' },
      '.calibre22': { 'color': 'rgba(255,255,255,0.5) !important' },
      '.calibre23': { 'color': '#7ba3c9 !important' },
      '.calibre25': { 'color': '#c9c5b8 !important' },
      '.calibre26': { 'color': 'rgba(255,255,255,0.5) !important', 'font-size': '0.75em !important' },

      '::selection': {
        'background': 'rgba(179, 18, 46, 0.55) !important',
      },

      'hr': {
        'border': 'none !important',
        'border-top': '1px solid rgba(255,255,255,0.08) !important',
        'margin': '3em 0 !important',
      },

      'img': {
        'max-width': '100% !important',
        'height': 'auto !important',
        'border-radius': '0px',
        'margin': '2em auto !important',
        'display': 'block !important',
        'box-shadow': 'none !important',
        'border': '1px solid #262a35 !important',
        'padding': '6px !important',
        'background': '#10131b !important',
      },
    });

    rendition.themes.fontSize(`${fontSize}%`);
    
    // Restore previous location if available
    const startLoc = locationRef.current || undefined;
    rendition.display(startLoc).then(() => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
      setIsRendered(true);
    }).catch(() => {
      rendition.display().then(() => {
        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        setIsRendered(true);
      })
        .catch(() => {
          if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
          setLoadError('Failed to render book.');
        });
    });

    rendition.on('locationChanged', (loc) => {
      locationRef.current = loc.start.cfi;
      if (storageKey) localStorage.setItem(storageKey, loc.start.cfi);
      setAtStart(loc.atStart || false);
      setAtEnd(loc.atEnd || false);

      if (bookRef.current && tocRef.current.length) {
        const match = tocRef.current.find(item => {
          const base = item.href.split('#')[0];
          try {
            return bookRef.current.canonical(base) === bookRef.current.canonical(loc.start.href);
          } catch { return false; }
        });
        if (match) setCurrentChapter(match.label);
      }

      if (bookRef.current?.spine?.spineItems) {
        const items = bookRef.current.spine.spineItems;
        const idx = items.findIndex(item => {
          try {
            return bookRef.current.canonical(item.href) === bookRef.current.canonical(loc.start.href);
          } catch { return false; }
        });
        if (idx >= 0) {
          const pct = Math.round(((idx + 1) / items.length) * 100);
          setReadingProgress(pct);
          if (onProgressRef.current) onProgressRef.current(pct);
        }
      }
    });

    // Bubble up key events from inside the epub iframe
    rendition.on("keyup", (e) => {
      resetIdleTimer();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowToc(false);
      }
    });

    // Allow clicking the epub iframe to close modals
    rendition.on("click", () => {
      resetIdleTimer();
      setShowSettings(false);
      setShowToc(false);
    });

    // Register touch / mouse / swipe handlers inside each rendered iframe
    rendition.on('rendered', (section, view) => {
      if (!view?.window) return;
      const win = view.window;
      win.addEventListener('mousemove', () => resetIdleTimer(), { passive: true });
      win.addEventListener('touchstart', (e) => {
        resetIdleTimer();
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }, { passive: true });
      win.addEventListener('touchend', (e) => {
        if (touchStartXRef.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
        touchStartXRef.current = null;
        if (Math.abs(dx) > 50 && viewMode === 'paginated') {
          if (dx < 0) goNext(); else goPrev();
        }
      }, { passive: true });
    });

    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };

  }, [url, viewMode, isScrolledMode, goNext, goPrev, resetIdleTimer, t, fontSize, storageKey, reloadNonce]);

  // Handle dynamic font size updates
  useEffect(() => {
    if (renditionRef.current && isRendered) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize, isRendered]);

  const goToChapter = useCallback((href) => {
    if (isScrolledMode && fullScrollRef.current && bookRef.current) {
      scrollToFullBookHref(href);
      setShowToc(false);
      return;
    }

    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  }, [isScrolledMode, scrollToFullBookHref]);

  return (
    <div data-testid="epub-reader-root" style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#08090d',
      borderRadius: '0px',
      overflow: isScrolledMode ? 'auto' : 'hidden',
      fontFamily: 'Outfit, Inter, system-ui, sans-serif'
    }}>
      {/* Floating Toolbar Header */}
      <motion.div
        initial={{ y: -50, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: (showUI || showToc || showSettings) ? 1 : 0, x: '-50%' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          background: 'rgba(11, 13, 18, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #262a35',
          borderRadius: '2px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          pointerEvents: (showUI || showToc || showSettings) ? 'auto' : 'none',
        }}
      >
        <ToolbarBtn 
          icon={List} 
          active={showToc} 
          onClick={() => { setShowToc(!showToc); setShowSettings(false); }} 
          title={t('book.tableOfContents')}
        />
        
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        
        <span style={{ 
          fontSize: '13px', 
          fontWeight: 500, 
          color: 'rgba(255,255,255,0.85)', 
          maxWidth: '220px', 
          textAlign: 'center',
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          padding: '0 6px',
          letterSpacing: '-0.01em'
        }}>
          {currentChapter || title || t('book.reading')}
        </span>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <ToolbarBtn 
          icon={Settings2} 
          active={showSettings} 
          onClick={() => { setShowSettings(!showSettings); setShowToc(false); }} 
          title="Reader settings"
        />

        {onToggleFullscreen && (
          <>
            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            <ToolbarBtn
              icon={isFullscreen ? Minimize2 : Maximize2}
              active={isFullscreen}
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            />
          </>
        )}
      </motion.div>

      {/* Settings backdrop + panel */}
      <AnimatePresence>
        {showSettings && (
          <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'transparent' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -10, scale: 0.95, x: '-50%' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '84px',
              left: '50%',
              zIndex: 51,
              background: 'rgba(16, 19, 27, 0.94)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '280px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Reading Mode Segment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{t('book.readingMode')}</span>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setViewMode('paginated'); localStorage.setItem('epub-viewmode', 'paginated'); }}
                  style={{ flex: 1, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: viewMode === 'paginated' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode === 'paginated' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '0px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 500 }}
                >
                  <MoveHorizontal size={16} /> {t('book.pagesLayout')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setViewMode(SCROLLED_VIEW_MODE); localStorage.setItem('epub-viewmode', SCROLLED_VIEW_MODE); }}
                  style={{ flex: 1, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: isScrolledMode ? 'rgba(255,255,255,0.1)' : 'transparent', color: isScrolledMode ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '0px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 500 }}
                >
                  <MoveVertical size={16} /> {t('book.scrollLayout')}
                </motion.button>
              </div>
            </div>

            {/* Typography Segment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{t('book.typography')}</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '0px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => setFontSize(s => { const n = Math.max(60, s - 10); localStorage.setItem('epub-fontsize', String(n)); return n; })}
                  style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '0px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
                >
                  <Minus size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Type size={14} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500, minWidth: '44px', textAlign: 'center' }}>{fontSize}%</span>
                </div>
                <button
                  onClick={() => setFontSize(s => { const n = Math.min(200, s + 10); localStorage.setItem('epub-fontsize', String(n)); return n; })}
                  style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '0px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main reading area */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        
        {/* TOC sidebar overlaid via Framer Motion */}
        <AnimatePresence>
          {showToc && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowToc(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 60 }}
              />
              {/* Sidebar */}
              <motion.div
                data-testid="epub-toc-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: '320px',
                  maxWidth: '85vw',
                  background: 'rgba(11, 13, 18, 0.97)',
                  backdropFilter: 'blur(30px)',
                  borderRight: '1px solid #262a35',
                  zIndex: 61,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '20px 0 60px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ padding: '24px', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#ece9e0', letterSpacing: '-0.01em' }}>
                    {t('book.tableOfContents')}
                  </span>
                  <button onClick={() => setShowToc(false)} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '50%', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 24px' }}>
                  {toc.map((item, idx) => {
                    const isActive = currentChapter === item.label;
                    const depth = item.depth || 0;
                    return (
                      <motion.button
                        key={idx}
                        data-testid="epub-toc-item"
                        whileHover={{ x: 4, background: 'rgba(255,255,255,0.04)' }}
                        onClick={() => goToChapter(item.href)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: `10px 16px 10px ${16 + depth * 14}px`,
                          background: isActive ? 'rgba(179, 18, 46, 0.12)' : 'transparent',
                          border: 'none', borderRadius: '0px',
                          color: isActive ? '#d41f3d' : depth === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)',
                          fontWeight: isActive ? 600 : depth === 0 ? 500 : 400,
                          fontSize: depth === 0 ? '14px' : '12.5px',
                          lineHeight: '1.5', cursor: 'pointer',
                          transition: 'color 0.2s, background 0.2s',
                          marginBottom: '2px',
                        }}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                  {toc.length === 0 && (
                    <div style={{ padding: '24px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center' }}>
                      {t('book.noToc')}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        {!isRendered && !loadError && (
          <div data-testid="epub-loading" style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: '#08090d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
          }}>
            <Loader size={26} className="animate-spin" style={{ color: '#d41f3d' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontFamily: 'Outfit, Inter, system-ui, sans-serif' }}>Loading…</span>
          </div>
        )}

        {/* Error overlay */}
        {loadError && (
          <div data-testid="epub-error" style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: '#08090d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
          }}>
            <AlertCircle size={26} style={{ color: '#d41f3d' }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontFamily: 'Outfit, Inter, system-ui, sans-serif', textAlign: 'center', maxWidth: '240px' }}>
              {loadError}
            </span>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '4px',
                  padding: '8px 12px',
                  borderRadius: '0px',
                  background: 'rgba(179, 18, 46, 0.16)',
                  border: '1px solid rgba(179, 18, 46, 0.45)',
                  color: '#e8354f',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {t('book.openFallback')}
              </a>
            )}
          </div>
        )}

        {/* EPUB viewer frame wrapper */}
        {isScrolledMode ? (
          <div
            data-testid="epub-full-scroll"
            ref={fullScrollRef}
            onScroll={handleFullBookScroll}
            onClick={handleFullBookClick}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: '#08090d',
              padding: '80px 8% 120px',
            }}
          >
            {isFullBookRendered && fullBookSections.map((section) => (
              <section
                key={`${section.index}-${section.href}`}
                data-epub-section="true"
                data-testid="epub-full-section"
                data-canonical={section.canonical}
                className="epub-full-section"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            ))}
            <style>{`
              .epub-full-section {
                max-width: 680px;
                margin: 0 auto;
                color: #c9c5b8;
                font-family: 'Newsreader', Georgia, "Times New Roman", serif;
                line-height: 1.95;
              }
              .epub-full-section + .epub-full-section {
                margin-top: 3.5rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(255,255,255,0.08);
              }
              .epub-full-section h1,
              .epub-full-section h2,
              .epub-full-section h3,
              .epub-full-section h4,
              .epub-full-section h5,
              .epub-full-section h6 {
                color: #ece9e0;
                font-family: 'Cormorant Garamond', Georgia, serif;
                font-weight: 500;
                margin-top: 2em;
                margin-bottom: 0.8em;
                line-height: 1.3;
              }
              .epub-full-section p,
              .epub-full-section .MsoNormal {
                color: #c9c5b8;
                line-height: 1.9;
                margin-top: 0;
                margin-bottom: 1.1em;
                text-align: left;
              }
              .epub-full-section a {
                color: #d41f3d;
                text-decoration: none;
                border-bottom: 1px solid rgba(212,31,61,0.3);
              }
              .epub-full-section img {
                max-width: 100%;
                height: auto;
                border-radius: 0;
                margin: 2em auto;
                display: block;
                border: 1px solid #262a35;
                padding: 6px;
                background: #10131b;
                box-shadow: none;
              }
              .epub-full-section svg {
                display: block;
                width: min(100%, 460px);
                height: auto;
                max-height: 70vh;
                margin: 2em auto;
              }
              .epub-full-section .indentb,
              .epub-full-section .quoteb {
                color: #c9c5b8;
                border-left: 2px solid #b3122e;
                padding-left: 1.4em;
                margin-left: 0;
                margin-right: 0;
              }
              .epub-full-section .indentb {
                font-style: italic;
              }
              .epub-full-section .H,
              .epub-full-section .H1,
              .epub-full-section .calibre7,
              .epub-full-section .calibre28,
              .epub-full-section .calibre35 {
                color: #ece9e0;
              }
              .epub-full-section .calibre10,
              .epub-full-section .calibre17,
              .epub-full-section .inote {
                color: rgba(255,255,255,0.38);
              }
              .epub-full-section .calibre11,
              .epub-full-section .calibre21,
              .epub-full-section .calibre22,
              .epub-full-section .calibre26 {
                color: rgba(255,255,255,0.5);
              }
              .epub-full-section .calibre19,
              .epub-full-section .calibre23,
              .epub-full-section .term {
                color: #4a7fb5;
              }
              .epub-full-section .calibre12,
              .epub-full-section .calibre20,
              .epub-full-section .calibre25 {
                color: #c9c5b8;
              }
              .epub-full-section em,
              .epub-full-section i,
              .epub-full-section .calibre6,
              .epub-full-section .calibre27 {
                font-style: italic;
                color: inherit;
              }
              .epub-full-section .enote {
                color: #d41f3d;
                font-size: 0.78em;
                font-weight: bold;
                font-family: inherit;
              }
              .epub-full-section hr {
                border: none;
                border-top: 1px solid rgba(255,255,255,0.08);
                margin: 3em 0;
              }
              .epub-full-section ::selection {
                background: rgba(179,18,46,0.55);
              }
            `}</style>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
              <div ref={viewerRef} style={{ width: '100%', height: '100%', minHeight: '100%' }} />
          </div>
        )}

        {/* Navigation Overlays (Only in Paginated Mode) */}
        {viewMode === 'paginated' && (showUI || showToc || showSettings) && (
          <>
            <NavButtonArea direction="left" onClick={goPrev} disabled={atStart} />
            <NavButtonArea direction="right" onClick={goNext} disabled={atEnd} />
          </>
        )}
      </div>

      {/* Reading progress bar */}
      {readingProgress > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.04)', zIndex: 30 }}>
          <div style={{ height: '100%', width: `${readingProgress}%`, background: '#b3122e', transition: 'width 0.5s ease' }} />
        </div>
      )}
    </div>
  );
};

export default EpubReader;
