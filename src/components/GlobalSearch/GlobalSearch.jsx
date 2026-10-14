'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
    Search, BookOpen, FileText, FlaskConical, Rss, Headphones, CornerDownLeft, ArrowRight, LayoutGrid,
} from 'lucide-react';
import {
    searchSite,
    flattenSearchResults,
    SEARCH_GROUP_ORDER,
    SEARCH_GROUP_LABEL_KEYS,
} from '../../services/siteSearch';
import { renderSnippetHtml } from '../../utils/textSearch';
import { lockPageScroll } from '../../utils/scrollLock';
import * as s from './GlobalSearch.css.ts';

const GROUP_ICONS = {
    pages: LayoutGrid,
    books: BookOpen,
    passages: FileText,
    courses: FlaskConical,
    substack: Rss,
    audiobooks: Headphones,
};

const EMPTY_RESULT = { pages: [], books: [], passages: [], courses: [], substack: [], audiobooks: [] };

const sublineFor = (item) => {
    if (item.group === 'books' || item.group === 'audiobooks') {
        return [item.author, item.year, item.category].filter(Boolean).join(' · ');
    }
    if (item.group === 'courses') {
        return [item.science_subjects?.name, item.level].filter(Boolean).join(' · ');
    }
    if (item.group === 'substack') {
        return [item.author, item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : null]
            .filter(Boolean)
            .join(' · ');
    }
    return null;
};

/**
 * The site-wide search palette: header icon or Cmd/Ctrl+K opens it, one query
 * fans out to every live section, results are grouped with the library's
 * full-text passages inline. Arrow keys + Enter navigate; clicking the
 * "all library results" link carries the query to /digital-library.
 */
const GlobalSearch = ({ open, onClose }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(EMPTY_RESULT);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    /* Translator lives in a ref: react-i18next gives `t` a fresh identity per
       render, and the debounced search must not restart on every re-render. */
    const tRef = useRef(t);
    tRef.current = t;

    /* Debounced fan-out; opening the palette re-runs whatever is typed. */
    useEffect(() => {
        if (!open) return undefined;
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResult(EMPTY_RESULT);
            setActiveIndex(0);
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        const timer = setTimeout(() => {
            searchSite(trimmed, { labelTranslator: (key) => tRef.current(key) })
                .then((res) => {
                    if (cancelled) return;
                    setResult(res);
                    // Reset the highlight with the results, not in a deferred
                    // effect — a late effect flush would clobber an arrow-key
                    // move made in the same tick as the results landing.
                    setActiveIndex(0);
                })
                .catch(() => {
                    if (cancelled) return;
                    setResult(EMPTY_RESULT);
                    setActiveIndex(0);
                })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, query]);

    /* Focus, scroll-lock and Escape-to-close while open. */
    useEffect(() => {
        if (!open) return undefined;
        inputRef.current?.focus();
        const unlockPageScroll = lockPageScroll();
        const onWindowKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onWindowKey);
        return () => {
            unlockPageScroll();
            window.removeEventListener('keydown', onWindowKey);
        };
    }, [open, onClose]);

    const flat = useMemo(() => flattenSearchResults(result), [result]);

    const openItem = useCallback((href) => {
        onClose();
        router.push(href);
    }, [onClose, router]);

    const handleInputKeyDown = (e) => {
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && flat.length > 0) {
            e.preventDefault();
            setActiveIndex((prev) =>
                e.key === 'ArrowDown' ? (prev + 1) % flat.length : (prev - 1 + flat.length) % flat.length
            );
        } else if (e.key === 'Enter') {
            const item = flat[activeIndex];
            if (item) {
                e.preventDefault();
                openItem(item.href);
            }
        }
    };

    useEffect(() => {
        // jsdom has no scrollIntoView — the guard keeps tests running.
        listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
    }, [activeIndex]);

    if (!open) return null;

    const trimmed = query.trim();
    const hasSome = flat.length > 0;

    return (
        <>
            <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
            <div className={s.panel} role="dialog" aria-modal="true" aria-label={t('search.dialogLabel', { defaultValue: 'Search' })}>
                <div className={s.inputRow}>
                    <Search size={17} strokeWidth={1.8} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={s.input}
                        placeholder={t('search.placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        data-testid="global-search-input"
                        aria-label={t('search.placeholder')}
                    />
                </div>

                <div className={s.results} ref={listRef} data-testid="global-search-results">
                    {!loading && trimmed.length < 2 && (
                        <div className={s.statusRow}>{t('search.hint')}</div>
                    )}
                    {loading && !hasSome && (
                        <div className={s.statusRow}>{t('search.searching')}</div>
                    )}
                    {!loading && trimmed.length >= 2 && !hasSome && (
                        <div className={s.statusRow} data-testid="global-search-empty">
                            {t('search.noResults', { query: trimmed })}
                        </div>
                    )}
                    {SEARCH_GROUP_ORDER.map((group) => {
                        const items = result[group] || [];
                        if (!items.length) return null;
                        const Icon = GROUP_ICONS[group] || LayoutGrid;
                        return (
                            <div key={group} data-testid={`global-search-group-${group}`}>
                                <span className={s.groupLabel}>{t(SEARCH_GROUP_LABEL_KEYS[group])}</span>
                                {items.map((item) => {
                                    const flatIndex = flat.findIndex((f) => f.group === group && f.href === item.href);
                                    const isActive = flatIndex === activeIndex;
                                    return (
                                        <Link
                                            key={`${group}-${item.id ?? item.href}`}
                                            href={item.href}
                                            className={s.item}
                                            data-active={isActive ? 'true' : 'false'}
                                            data-testid="global-search-item"
                                            onMouseEnter={() => flatIndex >= 0 && setActiveIndex(flatIndex)}
                                            onClick={() => onClose()}
                                        >
                                            <span className={s.itemIcon}><Icon size={15} strokeWidth={1.7} /></span>
                                            <span className={s.itemBody}>
                                                <p className={s.itemTitle}>
                                                    {group === 'pages' ? t(item.labelKey) : item.title}
                                                </p>
                                                {group === 'passages' ? (
                                                    <>
                                                        <p className={s.itemSub}>
                                                            {item.section_title || item.section_id}
                                                            {item.is_exact ? '' : ` · ${t('search.allWords')}`}
                                                        </p>
                                                        <p
                                                            className={s.snippet}
                                                            dangerouslySetInnerHTML={{
                                                                __html: renderSnippetHtml(
                                                                    item.snippet,
                                                                    item.match_offset,
                                                                    item.match_len,
                                                                    item.snippet_cut_start,
                                                                    item.snippet_cut_end
                                                                ),
                                                            }}
                                                        />
                                                    </>
                                                ) : (
                                                    sublineFor({ ...item, group }) && (
                                                        <p className={s.itemSub}>{sublineFor({ ...item, group })}</p>
                                                    )
                                                )}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                <div className={s.footer}>
                    <span className={s.footerHint}>
                        ↑↓ {t('search.navigate')} · <CornerDownLeft size={10} style={{ display: 'inline' }} /> {t('search.open')} · esc {t('search.close')}
                    </span>
                    {trimmed.length >= 2 && (
                        <Link
                            href={`/digital-library?q=${encodeURIComponent(trimmed)}`}
                            className={s.allResultsLink}
                            onClick={() => onClose()}
                            data-testid="global-search-all-library"
                        >
                            {t('search.allInLibrary', { query: trimmed })}
                            <ArrowRight size={11} />
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default GlobalSearch;
