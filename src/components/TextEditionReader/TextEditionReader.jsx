'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mark from 'mark.js';
import { AlertCircle, ChevronDown, ChevronUp, List, Minus, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { editorialProseCss } from '../EditorialReader/editorialProseCss';
import ReaderTocSheet from '../EditorialReader/ReaderTocSheet';
import * as chrome from '../EditorialReader/ReaderChrome.css.ts';
import { loadReaderPosition, usePositionSaver, useReaderChrome } from '../EditorialReader/readerChrome';
import { FRONT_MATTER_TITLE } from '../../utils/textEdition';
import { buildMarkCandidates } from '../../utils/textSearch';
import * as s from '../EditorialReader/EditorialReader.css.ts';

/* On /book/* the navband scrolls away, so the toolbar pins to the viewport
   top and is the only sticky chrome while reading. */
const STICKY_TOP = 0;
/* Room for the sticky toolbar when jumping to a section. */
const SECTION_JUMP_OFFSET = 84;

/**
 * The text-edition reading surface — one fullscreen editorial column with a
 * sticky chapter rail, in the manner of the communist-left.org text pages.
 * The page itself scrolls: progress and scroll-spy run on the document, so
 * keyboard scrolling, find-in-page and mobile behave natively. Sections come
 * from digital_library_books.text_edition.
 *
 * highlightQuery/initialSectionId carry the deep link from library full-text
 * search: the phrase gets marked across the whole text, the first hit inside
 * the target section is scrolled to and flashed, and a chip in the sticky
 * toolbar offers hit-to-hit navigation.
 */
const TextEditionReader = ({ edition, bookId, onProgressChange, fallbackUrl, fallbackLabel, highlightQuery, initialSectionId }) => {
    const rootRef = useRef(null);
    const onProgressRef = useRef(onProgressChange);
    onProgressRef.current = onProgressChange;
    const markRef = useRef(null);
    const [hitCount, setHitCount] = useState(0);
    const [activeHit, setActiveHit] = useState(0);
    const { t } = useTranslation();

    const { toolbarHidden, tocOpen, openToc, closeToc } = useReaderChrome();
    const savePosition = usePositionSaver(bookId);
    const tocBtnRef = useRef(null);
    const restoredRef = useRef(false);

    const sections = edition?.sections || [];
    const [activeId, setActiveId] = useState(sections[0]?.id ?? null);
    const [progress, setProgress] = useState(0);
    const [fontSize, setFontSize] = useState(() => {
        if (typeof window === 'undefined') return 100;
        const saved = localStorage.getItem('editorial-fontsize');
        return saved ? parseInt(saved, 10) : 100;
    });

    useEffect(() => {
        if (sections.length && !sections.some((sec) => sec.id === activeId)) {
            setActiveId(sections[0].id);
        }
    }, [sections, activeId]);

    /* The page is the scroller: progress and rail highlight follow the
       document, and the resting section is persisted for silent resume. */
    useEffect(() => {
        if (!sections.length) return undefined;

        const handleScroll = () => {
            const root = rootRef.current;
            if (!root) return;

            const rect = root.getBoundingClientRect();
            const scrollable = rect.height - window.innerHeight;
            const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 0));
            const pct = scrollable > 0 ? Math.round((scrolled / scrollable) * 100) : 0;
            setProgress(pct);
            if (onProgressRef.current) onProgressRef.current(pct);

            const nodes = Array.from(root.querySelectorAll('[data-section-canonical]'));
            if (!nodes.length) return;

            // At the very top the first section is always current, however
            // short it is — the lookahead below would otherwise flip early.
            let active;
            if (window.scrollY <= 2) {
                active = nodes[0];
            } else {
                const marker = 80;
                active = nodes.filter((n) => n.getBoundingClientRect().top <= marker).pop() || nodes[0];
            }
            const activeSectionId = active.getAttribute('data-section-canonical');
            setActiveId(activeSectionId);
            if (restoredRef.current) savePosition({ sectionId: activeSectionId, pct });
        };

        /* Resume where the reader left off — unless a search deep link is
           taking over, in which case its own jump wins. */
        if (!restoredRef.current) {
            restoredRef.current = true;
            if (!highlightQuery && !initialSectionId) {
                const saved = loadReaderPosition(bookId);
                const node = saved?.sectionId
                    ? rootRef.current?.querySelector(`[data-section-canonical="${saved.sectionId}"]`)
                    : null;
                if (node && node.getBoundingClientRect().top > window.innerHeight) {
                    const top = node.getBoundingClientRect().top + window.scrollY - SECTION_JUMP_OFFSET;
                    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
                }
            }
        }

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [sections.length, bookId, highlightQuery, initialSectionId, savePosition]);

    const scrollToSection = useCallback((id) => {
        const node = rootRef.current?.querySelector(`[data-section-canonical="${id}"]`);
        if (!node) return;
        const top = node.getBoundingClientRect().top + window.scrollY - SECTION_JUMP_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, []);

    const scrollToElement = useCallback((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY - SECTION_JUMP_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, []);

    /* Deep-link highlighting: mark every occurrence of the phrase, then jump
       to the first hit inside the target section (falling back to the first
       hit anywhere). Candidates cover typographic punctuation variants. */
    useEffect(() => {
        const root = rootRef.current;
        const candidates = highlightQuery ? buildMarkCandidates(highlightQuery) : [];
        if (!root || candidates.length === 0) return undefined;

        const instance = new Mark(root);
        markRef.current = instance;

        instance.unmark({
            done: () => {
                instance.mark(candidates, {
                    className: 'search-hit',
                    separateWordSearch: false,
                    accuracy: 'partially',
                    caseSensitive: false,
                    done: (count) => {
                        setHitCount(count);
                        setActiveHit(0);
                        const marks = root.querySelectorAll('mark.search-hit');
                        if (!marks.length) return;
                        let target = null;
                        if (initialSectionId) {
                            const section = root.querySelector(`[data-section-canonical="${initialSectionId}"]`);
                            target = section ? section.querySelector('mark.search-hit') : null;
                        }
                        target = target || marks[0];
                        const idx = Array.prototype.indexOf.call(marks, target);
                        setActiveHit(idx + 1);
                        scrollToElement(target);
                        target.classList.add('search-hit-flash');
                    },
                });
            },
        });

        return () => {
            try { instance.unmark(); } catch { /* root already unmounted */ }
            markRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections.length, highlightQuery, initialSectionId]);

    const jumpToHit = useCallback((direction) => {
        const marks = rootRef.current ? Array.from(rootRef.current.querySelectorAll('mark.search-hit')) : [];
        if (!marks.length) return;
        const next = (((activeHit - 1 + direction) % marks.length) + marks.length) % marks.length;
        setActiveHit(next + 1);
        scrollToElement(marks[next]);
    }, [activeHit, scrollToElement]);

    const clearHighlight = useCallback(() => {
        if (markRef.current) {
            try { markRef.current.unmark(); } catch { /* already gone */ }
        }
        markRef.current = null;
        setHitCount(0);
        setActiveHit(0);
        // Drop ?q=&section= so reloads/links don't re-trigger the highlight.
        if (typeof window !== 'undefined' && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            params.delete('q');
            params.delete('section');
            const qs = params.toString();
            window.history.replaceState(
                window.history.state,
                '',
                qs ? `${window.location.pathname}?${qs}` : window.location.pathname
            );
        }
    }, []);

    const adjustFont = (delta) => {
        setFontSize((prev) => {
            const next = Math.min(160, Math.max(80, prev + delta));
            localStorage.setItem('editorial-fontsize', String(next));
            return next;
        });
    };

    if (!sections.length) {
        return (
            <div className={s.root} data-testid="text-edition-reader-empty">
                <div className={s.errorBox}>
                    <AlertCircle size={26} style={{ color: '#d41f3d' }} />
                    <span className={s.errorText}>This text edition is empty.</span>
                    {fallbackUrl && (
                        <a className={s.fallbackLink} href={fallbackUrl} target="_blank" rel="noopener noreferrer">
                            {fallbackLabel || 'Open the file directly'}
                        </a>
                    )}
                </div>
            </div>
        );
    }

    const activeIndex = sections.findIndex((sec) => sec.id === activeId);
    const currentSection = activeIndex >= 0 ? sections[activeIndex] : null;
    const minutesLabel = edition?.reading_minutes ? `${edition.reading_minutes} min` : null;
    const proseSize = Math.round(18 * (fontSize / 100));

    return (
        <div className={s.root} ref={rootRef} data-testid="text-edition-reader">
            {/* Chapter rail */}
            <nav className={s.rail} aria-label="Contents">
                <div className={s.railHeader}>Contents</div>
                {sections.map((sec, idx) => (
                    <button
                        key={sec.id || idx}
                        className={`${s.railItem} ${sec.id === activeId ? s.railItemActive : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '8px',
                            ...(sec.level > 1 ? { paddingLeft: 'calc(16px + 12px)' } : {}),
                        }}
                        onClick={() => scrollToSection(sec.id)}
                    >
                        <span
                            style={{
                                fontFamily: "'Outfit', system-ui, sans-serif",
                                fontSize: '10px',
                                letterSpacing: '0.08em',
                                fontVariantNumeric: 'tabular-nums',
                                color: '#b3122e',
                                opacity: 0.75,
                                flexShrink: 0,
                            }}
                        >
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{sec.title || `Section ${idx + 1}`}</span>
                    </button>
                ))}
            </nav>

            <div>
                {/* Sticky reading header: chapter + index + contents + type
                    controls, with the crimson progress rule riding its top
                    edge. Slides away while scrolling into the text (mobile). */}
                <div
                    className={`${s.toolbar}${toolbarHidden ? ` ${chrome.toolbarHidden}` : ''}`}
                    style={{ position: 'sticky', top: STICKY_TOP, zIndex: 6 }}
                    data-testid="text-edition-reader-toolbar"
                >
                    <div className={s.progressTrack} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
                        <div className={s.progressFill} style={{ width: `${progress}%` }} />
                    </div>
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
                        <span className={s.chapterLabel}>{currentSection?.title || 'Reading'}</span>
                        <span className={s.chapterIndex}>
                            {activeIndex >= 0
                                ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`
                                : ''}
                            {minutesLabel ? ` · ${minutesLabel}` : ''}
                        </span>
                    </div>
                    {highlightQuery && hitCount > 0 && (
                        <div
                            data-testid="search-hits-chip"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginLeft: 'auto',
                                marginRight: '10px',
                                padding: '3px 6px 3px 10px',
                                border: '1px solid rgba(179, 18, 46, 0.45)',
                                background: 'rgba(179, 18, 46, 0.08)',
                                maxWidth: '46%',
                            }}
                        >
                            <span
                                title={highlightQuery}
                                style={{
                                    fontFamily: "'Outfit', system-ui, sans-serif",
                                    fontSize: '10px',
                                    letterSpacing: '0.06em',
                                    color: '#e8aeb7',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px',
                                }}
                            >
                                {t('book.searchHits', {
                                    defaultValue: '{{active}}/{{count}} hits',
                                    active: activeHit || 1,
                                    count: hitCount,
                                })}
                            </span>
                            <button
                                onClick={() => jumpToHit(-1)}
                                aria-label={t('book.prevHit', { defaultValue: 'Previous match' })}
                                title={t('book.prevHit', { defaultValue: 'Previous match' })}
                                style={{ background: 'transparent', border: 'none', color: '#e8aeb7', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                                <ChevronUp size={13} />
                            </button>
                            <button
                                onClick={() => jumpToHit(1)}
                                aria-label={t('book.nextHit', { defaultValue: 'Next match' })}
                                title={t('book.nextHit', { defaultValue: 'Next match' })}
                                style={{ background: 'transparent', border: 'none', color: '#e8aeb7', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                                <ChevronDown size={13} />
                            </button>
                            <button
                                onClick={clearHighlight}
                                aria-label={t('book.clearSearch', { defaultValue: 'Clear search highlighting' })}
                                title={t('book.clearSearch', { defaultValue: 'Clear search highlighting' })}
                                data-testid="clear-search-hits"
                                style={{ background: 'transparent', border: 'none', color: '#8f949f', cursor: 'pointer', padding: '2px', display: 'flex' }}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    )}
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

                {/* The fullscreen column — the document itself scrolls */}
                <div className={s.column} style={{ fontSize: `${proseSize}px` }} data-testid="text-edition-reader-column">
                    {sections.map((sec, i) => (
                        <React.Fragment key={sec.id || `sec-${i}`}>
                            <section
                                data-section-canonical={sec.id}
                                data-editorial-section="true"
                            >
                                {(i > 0 || sec.title !== FRONT_MATTER_TITLE) && sec.title && (
                                    sec.level >= 3 ? <h3>{sec.title}</h3> : <h2>{sec.title}</h2>
                                )}
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.md || ''}</ReactMarkdown>
                            </section>
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
            </div>

            {/* Mobile contents — the rail's chapter list as a bottom sheet */}
            <ReaderTocSheet
                open={tocOpen}
                onClose={closeToc}
                items={sections.map((sec, idx) => ({
                    key: sec.id || `sec-${idx}`,
                    label: sec.title || `Section ${idx + 1}`,
                    depth: sec.level > 1 ? 1 : 0,
                    active: sec.id === activeId,
                    id: sec.id,
                }))}
                onSelect={(item) => scrollToSection(item.id)}
                triggerRef={tocBtnRef}
            />
        </div>
    );
};

export default TextEditionReader;
