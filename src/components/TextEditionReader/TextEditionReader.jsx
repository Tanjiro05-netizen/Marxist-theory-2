'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Minus, Plus } from 'lucide-react';
import { editorialProseCss } from '../EditorialReader/editorialProseCss';
import { FRONT_MATTER_TITLE } from '../../utils/textEdition';
import * as s from '../EditorialReader/EditorialReader.css.ts';

/* The sticky chrome sits directly under the app navband (46px + hairlines). */
const STICKY_TOP = 47;
/* Room for navband + sticky toolbar when jumping to a section. */
const SECTION_JUMP_OFFSET = 110;

/**
 * The text-edition reading surface — one fullscreen editorial column with a
 * sticky chapter rail, in the manner of the communist-left.org text pages.
 * The page itself scrolls: progress and scroll-spy run on the document, so
 * keyboard scrolling, find-in-page and mobile behave natively. Sections come
 * from digital_library_books.text_edition.
 */
const TextEditionReader = ({ edition, onProgressChange, fallbackUrl, fallbackLabel }) => {
    const rootRef = useRef(null);
    const onProgressRef = useRef(onProgressChange);
    onProgressRef.current = onProgressChange;

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

    /* The page is the scroller: progress and rail highlight follow the document. */
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
                const marker = STICKY_TOP + 60;
                active = nodes.filter((n) => n.getBoundingClientRect().top <= marker).pop() || nodes[0];
            }
            setActiveId(active.getAttribute('data-section-canonical'));
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [sections.length]);

    const scrollToSection = useCallback((id) => {
        const node = rootRef.current?.querySelector(`[data-section-canonical="${id}"]`);
        if (!node) return;
        const top = node.getBoundingClientRect().top + window.scrollY - SECTION_JUMP_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
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
                {/* Sticky reading header: current chapter + index + type controls,
                    with the crimson progress rule riding its top edge. */}
                <div
                    className={s.toolbar}
                    style={{ position: 'sticky', top: STICKY_TOP, zIndex: 6, background: '#0b0d12' }}
                    data-testid="text-edition-reader-toolbar"
                >
                    <div className={s.progressTrack} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
                        <div className={s.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <div className={s.chapterMeta}>
                        <span className={s.chapterLabel}>{currentSection?.title || 'Reading'}</span>
                        <span className={s.chapterIndex}>
                            {activeIndex >= 0
                                ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`
                                : ''}
                            {minutesLabel ? ` · ${minutesLabel}` : ''}
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
                                    <span style={{ flex: 1, height: '1px', background: '#262a35' }} />
                                    <span style={{ width: '6px', height: '6px', background: '#b3122e', transform: 'rotate(45deg)' }} />
                                    <span style={{ flex: 1, height: '1px', background: '#262a35' }} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    <style>{editorialProseCss}</style>
                </div>
            </div>
        </div>
    );
};

export default TextEditionReader;
