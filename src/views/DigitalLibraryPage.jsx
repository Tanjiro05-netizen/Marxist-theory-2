import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { prefetchQuery } from '../lib/queryCache';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

import {
    Search, List, Grid, ExternalLink, FileText, Upload,
    Database, BookOpen, Landmark, Users, Target, BookmarkPlus, Download,
    Trash2, Headphones, Pencil, ChevronDown, ChevronLeft, ChevronRight,
    SlidersHorizontal, ArrowRight, X, Check
} from 'lucide-react';
import ReadingListPanel from '../components/Library/ReadingListPanel';
import AddToListButton from '../components/Library/AddToListButton';
import PassagesResults from '../components/Library/PassagesResults';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { normalizeSearchQuery } from '../utils/textSearch';
import * as s from './DigitalLibraryPage.css.ts';

const categoryIcons = {
    'Political Economy': Database,
    'Philosophy': BookOpen,
    'History': Landmark,
    'Sociology': Users,
    'Strategy & Tactics': Target,
    'Downloads': FileText,
    'Audiobooks': Headphones,
    'default': Database
};

const PDF_DOWNLOADS_SECTION = 'Downloads';
const LEGACY_PDF_DOWNLOADS_SECTION = 'Download PDFs';
const AUDIOBOOKS_SECTION = 'Audiobooks';
const PDF_UPLOAD_URL = '/admin/library/upload?format=pdf';

/* Search modes for the toolbar. Text modes hit the search_library_text()
   RPC; field modes filter the already-loaded metadata client-side. */
const SEARCH_MODES = {
    everything: 'library.modeEverything',
    exact: 'library.modeExact',
    title: 'library.modeTitle',
    author: 'library.modeAuthor',
    year: 'library.modeYear',
};
const TEXT_SEARCH_MODES = new Set(['everything', 'exact']);
/* The RPC trigram-matches from three characters up. */
const MIN_TEXT_QUERY_LENGTH = 3;

const isPurePdfBook = (book) => !!book?.pdf_filename && !book?.epub_filename && !book?.isAudiobook;

/* Every item resolves to exactly one format bucket; the sidebar checkboxes
   and the cover tags both derive from it. */
const fmtOf = (book) => {
    if (book?.isAudiobook) return 'audio';
    return isPurePdfBook(book) ? 'pdf' : 'text';
};
const FORMAT_LABELS = {
    text: 'library.formatText',
    pdf: 'library.formatPdf',
    audio: 'library.audio',
};
const FORMAT_SECTIONS = [
    { id: 'text', labelKey: 'library.formatText' },
    { id: 'pdf', labelKey: 'library.formatPdf' },
    { id: 'audio', labelKey: 'library.formatAudio' },
];

const SORT_MODES = {
    newest: 'library.sortNewest',
    oldest: 'library.sortOldest',
    title: 'library.sortTitle',
};
const byYearDesc = (a, b) => ((b.year ?? -Infinity) - (a.year ?? -Infinity)) || (a.title || '').localeCompare(b.title || '');
const byYearAsc = (a, b) => ((a.year ?? Infinity) - (b.year ?? Infinity)) || (a.title || '').localeCompare(b.title || '');
const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
const SORT_COMPARATORS = { newest: byYearDesc, oldest: byYearAsc, title: byTitle };

const PAGE_SIZE = 12;
const MOBILE_BREAKPOINT = '(max-width: 780px)';

/* DB categories and synthetic sections get translated display names;
   the raw string stays the section id and React key. */
const CATEGORY_KEYS = {
    'Political Economy': 'politicalEconomy',
    'Philosophy': 'philosophy',
    'History': 'history',
    'Sociology': 'sociology',
    'Strategy & Tactics': 'strategyTactics',
    [PDF_DOWNLOADS_SECTION]: 'downloads',
    [AUDIOBOOKS_SECTION]: 'audiobooks',
    'Uncategorized': 'uncategorized',
};

const translateCategory = (name, t) => {
    if (name === 'All Categories') return t('library.allCategories');
    const key = CATEGORY_KEYS[name];
    return key ? t(`library.categories.${key}`) : name;
};

const getBookSectionName = (book) => {
    if (book?.isAudiobook) return AUDIOBOOKS_SECTION;
    if (isPurePdfBook(book)) return PDF_DOWNLOADS_SECTION;
    return book.category || 'Uncategorized';
};

/* Compact page list with ellipses for long catalogs. */
const pageList = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out = [1];
    if (current > 3) out.push('…');
    for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n++) out.push(n);
    if (current < total - 2) out.push('…');
    out.push(total);
    return out;
};

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return undefined;
        const mq = window.matchMedia(MOBILE_BREAKPOINT);
        const update = () => setIsMobile(mq.matches);
        update();
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', update);
            return () => mq.removeEventListener('change', update);
        }
        mq.addListener(update);
        return () => mq.removeListener(update);
    }, []);
    return isMobile;
};

// A custom hook for debouncing input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const PdfUploadAction = () => (
    <Link href={PDF_UPLOAD_URL} className={s.uploadAction}>
        <Upload size={13} />
        Upload PDF
    </Link>
);

const getCoverImageSrc = (coverUrl) => {
    if (!coverUrl) return coverUrl;

    try {
        const parsedCoverUrl = new URL(coverUrl);
        const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
            ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
            : null;

        if (
            supabaseOrigin &&
            parsedCoverUrl.origin === supabaseOrigin &&
            parsedCoverUrl.pathname.startsWith('/storage/v1/object/public/')
        ) {
            return `/api/cover-image?url=${encodeURIComponent(parsedCoverUrl.toString())}`;
        }
    } catch {
        return coverUrl;
    }

    return coverUrl;
};

/* ── Cover character ──
   A plain grid of identical plates reads as templated, so every cover picks
   its engraved mark, stamp angle, ring set and paper tint from a stable hash
   of the book id — the way a real card catalogue was hand-set, not printed. */
const seedFromString = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
};

const EMBLEMS = [
    // astrolabe
    <g key="astrolabe">
        <circle cx="20" cy="20" r="17" />
        <path d="M20 3v34M3 20h34M8 8l24 24M32 8L8 32" />
        <circle cx="20" cy="20" r="4" />
    </g>,
    // five-point star
    <g key="star">
        <path d="M20 4 24.1 14.3 35.2 15.1 26.7 22.2 29.4 32.9 20 27 10.6 32.9 13.3 22.2 4.8 15.1 15.9 14.3Z" />
        <circle cx="20" cy="20" r="2.5" />
    </g>,
    // open codex
    <g key="codex">
        <path d="M6 10c4.7-2.2 9.3-2.2 14 0 4.7-2.2 9.3-2.2 14 0v20c-4.7-2.2-9.3-2.2-14 0-4.7-2.2-9.3-2.2-14 0z" />
        <path d="M20 10v20" />
    </g>,
    // classical column
    <g key="column">
        <path d="M6 34h28M8 30h24M12 30V16M20 30V16M28 30V16M8 14l12-8 12 8z" />
    </g>,
    // seal with registration ticks
    <g key="seal">
        <circle cx="20" cy="20" r="16" />
        <circle cx="20" cy="20" r="8" />
        <path d="M20 1v5M20 34v5M1 20h5M34 20h5M6.7 6.7l3.5 3.5M29.8 29.8l3.5 3.5M33.3 6.7l-3.5 3.5M10.2 29.8l-3.5 3.5" />
    </g>,
];

const STAMP_ANGLES = [-12, -6, -3, 0, 5, 9, 15];
const STAMP_SCALES = [0.92, 0.96, 1, 1.05];
const CARD_TILTS = ['-0.5deg', '0deg', '0.35deg', '-0.2deg', '0.55deg'];
const CARD_LIFTS = ['-3px', '-1px', '0px', '2px', '3px'];

const EmblemMark = ({ children }) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" focusable="false">
        {children}
    </svg>
);

const useCoverUrl = (book) => {
    const isAudiobook = book.isAudiobook;
    const initialCover = getCoverImageSrc(isAudiobook ? book.cover_url : book.cover_image_url);
    const [coverUrl, setCoverUrl] = useState(initialCover);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const cover = isAudiobook ? book.cover_url : book.cover_image_url;
        if (!cover) {
            setCoverUrl(null);
            return;
        }
        // Reset error state whenever cover source changes
        setImageError(false);
        // If the URL is already from Supabase storage or an external URL
        if (cover.includes('supabase') || cover.startsWith('http')) {
            setCoverUrl(getCoverImageSrc(cover));
            return;
        }

        // Otherwise try to get it from the covers bucket
        if (cover.startsWith('/')) {
            const filename = cover.split('/').pop();
            const { data } = supabase.storage.from('covers').getPublicUrl(filename);
            if (data?.publicUrl) {
                setCoverUrl(getCoverImageSrc(data.publicUrl));
            }
        }
    }, [book.cover_image_url, book.cover_url, isAudiobook]);

    return { coverUrl, imageError, handleImageError: () => setImageError(true) };
};

const AdminCardActions = ({ book, isAudiobook, isPdfBook, router, onDelete }) => (
    <div className={s.adminActions}>
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/admin/library/upload?edit=${isAudiobook ? 'audiobook' : 'book'}&id=${book.id}`);
            }}
            className={s.adminBtn}
            title={isAudiobook ? 'Edit audiobook' : isPdfBook ? 'Edit PDF book' : 'Edit book'}
            aria-label={isAudiobook ? 'Edit audiobook' : isPdfBook ? 'Edit PDF book' : 'Edit book'}
        >
            <Pencil size={13} />
        </button>
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(book.id, isAudiobook); }}
            className={s.adminBtn}
            title="Delete book"
            aria-label="Delete book"
        >
            <Trash2 size={13} />
        </button>
    </div>
);

/* ── Catalog card — emblem cover, format tag, quiet caption. Restyles into a
      thumbnail row on mobile; one DOM, two presentations. ── */
const BookCard = ({ book, isAdminUser, onDelete, onPlay }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const isAudiobook = book.isAudiobook;
    const isPdfBook = isPurePdfBook(book);
    const formatId = fmtOf(book);
    const formatTag = t(FORMAT_LABELS[formatId], { defaultValue: formatId.toUpperCase() });

    // Get the public URL for the book's PDF file (if not audiobook)
    const externalViewerUrl = !isAudiobook && book.pdf_filename ? supabase
        .storage
        .from('library')
        .getPublicUrl(book.pdf_filename)?.data?.publicUrl : null;
    const pdfFileActionLabel = isPdfBook ? t('book.downloadPDF') : t('library.openExternal');
    const readLabel = isPdfBook && !(book.text_edition?.sections?.length) ? t('library.open') : t('library.read');

    const { coverUrl, imageError, handleImageError } = useCoverUrl(book);

    // Stable per-book character — same book always gets the same treatment.
    const seed = seedFromString(book.id || book.title || 'book');
    const emblem = EMBLEMS[seed % EMBLEMS.length];
    const stampAngle = STAMP_ANGLES[(seed >> 2) % STAMP_ANGLES.length];
    const stampScale = STAMP_SCALES[(seed >> 4) % STAMP_SCALES.length];
    const ringCount = 1 + ((seed >> 6) % 3); // 1–3 engraved rings
    const dashedRing = ((seed >> 3) & 1) === 1;
    const tintClass = s[['coverTintA', 'coverTintB', 'coverTintC'][(seed >> 8) % 3]];

    const formatTagContent = (
        <>
            {formatId === 'audio' && <Headphones size={8} aria-hidden="true" />}
            {formatTag}
        </>
    );

    const coverMarkup = (
        <div className={`${s.cover} ${tintClass}`}>
            {!imageError && coverUrl ? (
                <img
                    src={coverUrl}
                    onError={handleImageError}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={144}
                    height={216}
                    className={s.coverImg}
                />
            ) : (
                <>
                    <span className={s.coverRing} aria-hidden="true" />
                    {ringCount >= 2 && (
                        <span className={`${s.coverRing2}${dashedRing ? ` ${s.ringDashed}` : ''}`} aria-hidden="true" />
                    )}
                    {ringCount >= 3 && <span className={s.coverRing3} aria-hidden="true" />}
                    <span
                        className={s.emblem}
                        aria-hidden="true"
                        style={{ transform: `rotate(${stampAngle}deg) scale(${stampScale})` }}
                    >
                        <EmblemMark>{emblem}</EmblemMark>
                    </span>
                </>
            )}
            <span className={s.fmtTag}>{formatTagContent}</span>
        </div>
    );

    const bodyMarkup = (
        <div className={s.cardBody}>
            <h3 className={s.cardTitle}>{book.title}</h3>
            <p className={s.cardAuth}>{book.author || t('library.unknownAuthor')}</p>
            <div className={s.cardMeta}>
                <span className={s.cardEra}>{book.year || '—'}</span>
                <span className={s.fmtChipMobile}>{formatTagContent}</span>
            </div>
        </div>
    );

    return (
        <article
            className={s.card}
            style={{
                '--dl-tilt': CARD_TILTS[(seed >> 10) % CARD_TILTS.length],
                '--dl-lift': CARD_LIFTS[(seed >> 12) % CARD_LIFTS.length],
            }}
            data-testid={isAudiobook ? 'audiobook-card' : isPdfBook ? 'pdf-book-card' : 'ebook-card'}
        >
            {isAdminUser && (
                <AdminCardActions book={book} isAudiobook={isAudiobook} isPdfBook={isPdfBook} router={router} onDelete={onDelete} />
            )}
            {isAudiobook ? (
                <button type="button" onClick={() => onPlay(book)} className={s.cardLink}>
                    {coverMarkup}
                    {bodyMarkup}
                    <span className={s.rowChevron} aria-hidden="true"><ChevronRight size={14} /></span>
                </button>
            ) : (
                <Link href={`/book/${book.id}`} className={s.cardLink}>
                    {coverMarkup}
                    {bodyMarkup}
                    <span className={s.rowChevron} aria-hidden="true"><ChevronRight size={14} /></span>
                </Link>
            )}
            <div className={s.cardActions}>
                {isAudiobook ? (
                    <button type="button" onClick={() => onPlay(book)} className={s.actionRead}>
                        <Headphones size={11} /> {t('library.listenNow')}
                    </button>
                ) : (
                    <>
                        <Link href={`/book/${book.id}`} data-testid="ebook-read-link" className={s.actionRead}>
                            {readLabel}
                        </Link>
                        {externalViewerUrl && (
                            <a
                                href={externalViewerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={isPdfBook ? `${book.title}.pdf` : undefined}
                                data-testid="ebook-external-pdf-link"
                                title={pdfFileActionLabel}
                                aria-label={pdfFileActionLabel}
                                className={s.actionPdf}
                            >
                                {isPdfBook ? <Download size={11} /> : <ExternalLink size={11} />}
                                PDF
                            </a>
                        )}
                        <AddToListButton bookId={book.id} />
                    </>
                )}
            </div>
        </article>
    );
};

/* ── Dense index row — metadata table view for the catalog. ── */
const BookRow = ({ book, isAdminUser, onDelete, onPlay }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const isAudiobook = book.isAudiobook;
    const isPdfBook = isPurePdfBook(book);
    const formatTag = t(FORMAT_LABELS[fmtOf(book)], { defaultValue: '' });
    const sectionName = translateCategory(getBookSectionName(book), t);
    const testId = isAudiobook ? 'audiobook-card' : isPdfBook ? 'pdf-book-card' : 'ebook-card';

    const cells = (
        <>
            <div>
                <div className={s.lvTitle}>{book.title}</div>
                <div className={s.lvAuth}>{book.author || t('library.unknownAuthor')}</div>
            </div>
            <div className={`${s.lvCat} ${s.lvCatCol}`}>{sectionName}</div>
            <div className={s.lvEra}>{book.year || '—'}</div>
            <div className={s.lvCat}>{formatTag}</div>
            <ArrowRight size={11} className={s.lvArrow} aria-hidden="true" />
            {isAdminUser && (
                <AdminCardActions book={book} isAudiobook={isAudiobook} isPdfBook={isPdfBook} router={router} onDelete={onDelete} />
            )}
        </>
    );

    if (isAudiobook) {
        return (
            <div
                className={s.lvRow}
                data-testid={testId}
                role="button"
                tabIndex={0}
                onClick={() => onPlay(book)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPlay(book); }}
            >
                {cells}
            </div>
        );
    }
    return (
        <Link href={`/book/${book.id}`} className={s.lvRow} data-testid={testId}>
            {cells}
        </Link>
    );
};

/* True while the scroller has clipped content — drives the edge fade. */
const useOverflowing = (ref, deps) => {
    const [overflowing, setOverflowing] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 2);
        check();
        if (typeof ResizeObserver === 'function') {
            const ro = new ResizeObserver(check);
            ro.observe(el);
            return () => ro.disconnect();
        }
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return overflowing;
};

const KNOWN_FORMATS = new Set(FORMAT_SECTIONS.map(f => f.id));
const KNOWN_SORTS = new Set(Object.keys(SORT_MODES));
const KNOWN_MODES = new Set(Object.keys(SEARCH_MODES));

const DigitalLibraryPage = () => {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const isAdminUser = isAdmin && isAdmin();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const asideRef = useRef(null);
    const filterBtnRef = useRef(null);
    const catChipsRef = useRef(null);
    const activeChipsRef = useRef(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay
    const [searchMode, setSearchMode] = useState('everything');
    const [passageRows, setPassageRows] = useState(null); // null = no search active
    const [passagesLoading, setPassagesLoading] = useState(false);
    const [passagesUnavailable, setPassagesUnavailable] = useState(false); // RPC missing / errored
    const [activeCategory, setActiveCategory] = useState('all');
    const [formats, setFormats] = useState(() => new Set()); // empty = all formats
    const [yearRange, setYearRange] = useState(null); // [min, max] while filtering
    const [activeLanguage, setActiveLanguage] = useState('all');
    const [sortMode, setSortMode] = useState('newest');
    const [page, setPage] = useState(1);
    const [mobileVisible, setMobileVisible] = useState(PAGE_SIZE);
    const [allBooks, setAllBooks] = useState([]);
    const [audiobooks, setAudiobooks] = useState([]);
    const { playAudiobook } = useAudioPlayer();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReadingLists, setShowReadingLists] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    /* Era bounds from the URL wait here until the year domain arrives. */
    const pendingUrlEra = useRef(null);

    // Fetch once (cached across visits). Filtering is derived client-side
    // so search/filters never re-trigger network round-trips.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { allData, categoriesData, audiobooksData } = await prefetchQuery('library:all', async () => {
                    const [booksResponse, categoriesResponse, audiobooksResponse] = await Promise.all([
                        supabase.from('digital_library_books').select('*'),
                        supabase.from('digital_library_books').select('category'),
                        supabase.from('audiobooks').select('*')
                    ]);
                    if (booksResponse.error) throw booksResponse.error;
                    if (categoriesResponse.error) throw categoriesResponse.error;
                    if (audiobooksResponse.error) throw audiobooksResponse.error;
                    return {
                        allData: booksResponse.data || [],
                        categoriesData: categoriesResponse.data || [],
                        audiobooksData: audiobooksResponse.data || [],
                    };
                });
                if (cancelled) return;

                setAllBooks(allData);
                setAudiobooks(audiobooksData.map(ab => ({ ...ab, isAudiobook: true, category: AUDIOBOOKS_SECTION })));

                // Generate dynamic categories
                const distinctCategories = [...new Set(categoriesData
                    .map(item => item.category)
                    .filter(category => category && ![PDF_DOWNLOADS_SECTION, LEGACY_PDF_DOWNLOADS_SECTION, AUDIOBOOKS_SECTION].includes(category)))];
                const dynamicCategories = distinctCategories.map(name => ({
                    id: name,
                    name,
                    icon: categoryIcons[name] || categoryIcons.default
                }));
                setCategories([
                    { id: 'all', name: 'All Categories', icon: categoryIcons.default },
                    ...dynamicCategories,
                    { id: PDF_DOWNLOADS_SECTION, name: PDF_DOWNLOADS_SECTION, icon: categoryIcons[PDF_DOWNLOADS_SECTION] },
                    { id: AUDIOBOOKS_SECTION, name: AUDIOBOOKS_SECTION, icon: categoryIcons[AUDIOBOOKS_SECTION] }
                ]);
            } catch (error) {
                setError('Error fetching data: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    /* Keep the catalog — and the hero stats derived from it — live. Realtime
       postgres_changes apply row edits the moment they happen (needs the
       table in the supabase_realtime publication, see migrations); a slow
       poll plus refetch-on-focus covers projects where that isn't enabled
       yet, and catches audiobook/category changes realtime doesn't. */
    useEffect(() => {
        const channel = supabase.channel('library-live');
        channel
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'digital_library_books' },
                (payload) => {
                    setAllBooks((prev) => {
                        if (payload.eventType === 'INSERT' && payload.new && !prev.some((b) => b.id === payload.new.id)) {
                            return [payload.new, ...prev];
                        }
                        if (payload.eventType === 'UPDATE' && payload.new) {
                            return prev.map((b) => (b.id === payload.new.id ? payload.new : b));
                        }
                        if (payload.eventType === 'DELETE' && payload.old) {
                            return prev.filter((b) => b.id !== payload.old.id);
                        }
                        return prev;
                    });
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        let inFlight = false;
        const refetch = async () => {
            if (inFlight || document.hidden) return;
            inFlight = true;
            try {
                const { data } = await supabase.from('digital_library_books').select('*');
                if (data) setAllBooks(data);
            } catch { /* keep showing current data */ }
            finally { inFlight = false; }
        };
        const onVisibility = () => { if (!document.hidden) refetch(); };
        window.addEventListener('focus', refetch);
        document.addEventListener('visibilitychange', onVisibility);
        const intervalId = setInterval(refetch, 60_000);
        return () => {
            window.removeEventListener('focus', refetch);
            document.removeEventListener('visibilitychange', onVisibility);
            clearInterval(intervalId);
        };
    }, []);

    /* Shareable catalog URLs: prefill the search box and every filter from
       the query string on arrival (?q= &cat= &fmt= &lang= &sort= &yMin= &yMax=). */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) setSearchQuery(q);
        const cat = params.get('cat');
        if (cat) setActiveCategory(cat);
        const fmt = params.get('fmt');
        if (fmt) {
            const ids = fmt.split(',').filter(id => KNOWN_FORMATS.has(id));
            if (ids.length) setFormats(new Set(ids));
        }
        const lang = params.get('lang');
        if (lang) setActiveLanguage(lang);
        const sort = params.get('sort');
        if (sort && KNOWN_SORTS.has(sort)) setSortMode(sort);
        const mode = params.get('mode');
        if (mode && KNOWN_MODES.has(mode)) setSearchMode(mode);
        const yMin = Number(params.get('yMin'));
        const yMax = Number(params.get('yMax'));
        if (Number.isFinite(yMin) && yMin > 0 && Number.isFinite(yMax) && yMax > 0) {
            pendingUrlEra.current = [Math.min(yMin, yMax), Math.max(yMin, yMax)];
        }
    }, []);

    const normalizedQuery = useMemo(() => normalizeSearchQuery(debouncedSearchQuery), [debouncedSearchQuery]);
    const textSearchActive = TEXT_SEARCH_MODES.has(searchMode) && normalizedQuery.length >= MIN_TEXT_QUERY_LENGTH;

    /* Keep the URL in sync with the active catalog state so Back and share
       links restore it. Defaults are omitted to keep URLs short. (Runs after
       yearDomain is derived — see below.) */

    // Full-text passage search runs server-side through the search RPC and
    // is cached per mode+query, so retyping a recent query is instant.
    useEffect(() => {
        if (!textSearchActive) {
            setPassageRows(null);
            setPassagesLoading(false);
            setPassagesUnavailable(false);
            return undefined;
        }
        let cancelled = false;
        setPassagesLoading(true);
        prefetchQuery(`library:search:${searchMode}:${normalizedQuery}`, async () => {
            const { data, error } = await supabase.rpc('search_library_text', {
                p_query: normalizedQuery,
                p_mode: searchMode === 'exact' ? 'exact' : 'auto',
                p_limit_per_book: 3,
                p_max_books: 20,
            });
            if (error) throw error;
            return data || [];
        })
            .then((rows) => { if (!cancelled) setPassageRows(rows); })
            .catch(() => {
                /* Migration not applied or RPC unavailable — metadata search
                   still works, so fail quietly. */
                if (!cancelled) {
                    setPassageRows(null);
                    setPassagesUnavailable(true);
                }
            })
            .finally(() => { if (!cancelled) setPassagesLoading(false); });
        return () => { cancelled = true; };
    }, [textSearchActive, searchMode, normalizedQuery]);

    /* ── Derived catalog ── */

    const catalog = useMemo(
        () => [...allBooks, ...audiobooks],
        [allBooks, audiobooks]
    );

    const yearDomain = useMemo(() => {
        // year 0 marks "unknown" in some records — keep it out of the scale
        const years = allBooks.map(b => Number(b.year)).filter(y => Number.isFinite(y) && y > 0);
        if (years.length === 0) return null;
        return [Math.min(...years), Math.max(...years)];
    }, [allBooks]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
        if (activeCategory !== 'all') params.set('cat', activeCategory);
        if (formats.size > 0) params.set('fmt', [...formats].join(','));
        if (activeLanguage !== 'all') params.set('lang', activeLanguage);
        if (sortMode !== 'newest') params.set('sort', sortMode);
        if (searchMode !== 'everything') params.set('mode', searchMode);
        if (yearDomain && yearRange && (yearRange[0] !== yearDomain[0] || yearRange[1] !== yearDomain[1])) {
            params.set('yMin', String(yearRange[0]));
            params.set('yMax', String(yearRange[1]));
        }
        const qs = params.toString();
        const currentQs = window.location.search.startsWith('?') ? window.location.search.slice(1) : '';
        if (currentQs === qs) return;
        const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(window.history.state, '', url);
    }, [debouncedSearchQuery, activeCategory, formats, activeLanguage, sortMode, searchMode, yearRange, yearDomain]);

    useEffect(() => {
        if (!yearDomain || yearRange) return;
        if (pendingUrlEra.current) {
            const [lo, hi] = pendingUrlEra.current;
            setYearRange([Math.max(lo, yearDomain[0]), Math.min(hi, yearDomain[1])]);
            pendingUrlEra.current = null;
            return;
        }
        setYearRange(yearDomain);
    }, [yearDomain, yearRange]);

    const eraNarrowed = !!(yearDomain && yearRange && (yearRange[0] > yearDomain[0] || yearRange[1] < yearDomain[1]));

    const formatCounts = useMemo(() => {
        const counts = { text: 0, pdf: 0, audio: 0 };
        catalog.forEach((book) => { counts[fmtOf(book)] += 1; });
        return counts;
    }, [catalog]);

    const sectionCounts = useMemo(() => {
        const counts = new Map();
        catalog.forEach((book) => {
            const section = getBookSectionName(book);
            counts.set(section, (counts.get(section) || 0) + 1);
        });
        return counts;
    }, [catalog]);

    const languages = useMemo(() => {
        const set = new Set();
        catalog.forEach((book) => { if (book.language) set.add(book.language); });
        return [...set].sort();
    }, [catalog]);

    // Derive the visible list from filters client-side — instant
    const filteredBooks = useMemo(() => {
        let list = catalog;
        if (activeCategory !== 'all') {
            list = list.filter(book => getBookSectionName(book) === activeCategory);
        }
        if (formats.size > 0) {
            list = list.filter(book => formats.has(fmtOf(book)));
        }
        if (eraNarrowed) {
            list = list.filter((book) => {
                // Audiobooks carry no year — exempt them within their own section
                if (book.isAudiobook && activeCategory === AUDIOBOOKS_SECTION) return true;
                const year = Number(book.year);
                return Number.isFinite(year) && year >= yearRange[0] && year <= yearRange[1];
            });
        }
        if (activeLanguage !== 'all') {
            list = list.filter(book => (book.language || '') === activeLanguage);
        }

        if (debouncedSearchQuery) {
            const q = debouncedSearchQuery.toLowerCase();
            if (searchMode === 'exact') {
                // Phrase mode is carried by the passages block alone.
                list = [];
            } else {
                list = list.filter((book) => {
                    const inTitle = book.title && book.title.toLowerCase().includes(q);
                    const inAuthor = book.author && book.author.toLowerCase().includes(q);
                    if (searchMode === 'title') return !!inTitle;
                    if (searchMode === 'author') return !!inAuthor;
                    if (searchMode === 'year') return String(book.year ?? '').includes(q);
                    return !!(inTitle || inAuthor);
                });
            }
        }

        return [...list].sort(SORT_COMPARATORS[sortMode]);
    }, [catalog, activeCategory, formats, eraNarrowed, yearRange, activeLanguage, debouncedSearchQuery, searchMode, sortMode]);

    // Any filter/sort change puts the user back on the first page.
    useEffect(() => {
        setPage(1);
        setMobileVisible(PAGE_SIZE);
    }, [debouncedSearchQuery, searchMode, activeCategory, formats, eraNarrowed, activeLanguage, sortMode]);

    /* Passage results respect the same chips/checkboxes as the grid — they are
       book-level attributes, so whole books drop in or out. */
    const visiblePassageRows = useMemo(() => {
        if (!passageRows || passageRows.length === 0) return passageRows;
        if (activeCategory === PDF_DOWNLOADS_SECTION || activeCategory === AUDIOBOOKS_SECTION) return [];
        if (formats.size > 0 && !formats.has('text')) return [];
        if (activeCategory === 'all' && !eraNarrowed && activeLanguage === 'all') return passageRows;
        return passageRows.filter(row =>
            (activeCategory === 'all' || row.category === activeCategory) &&
            (!eraNarrowed || !Number.isFinite(Number(row.year)) || (Number(row.year) >= yearRange[0] && Number(row.year) <= yearRange[1])) &&
            (activeLanguage === 'all' || row.language === activeLanguage)
        );
    }, [passageRows, activeCategory, formats, eraNarrowed, yearRange, activeLanguage]);

    /* ── Filter state helpers ── */

    const clearAllFilters = useCallback(() => {
        setActiveCategory('all');
        setFormats(new Set());
        setYearRange(yearDomain);
        setActiveLanguage('all');
    }, [yearDomain]);

    const toggleFormat = (formatId) => {
        setFormats(prev => {
            const next = new Set(prev);
            if (next.has(formatId)) next.delete(formatId);
            else next.add(formatId);
            return next;
        });
    };

    const activeChips = useMemo(() => {
        const chips = [];
        if (activeCategory !== 'all') {
            const cat = categories.find(c => c.id === activeCategory);
            chips.push({
                key: 'category',
                label: cat ? translateCategory(cat.name, t) : activeCategory,
                clear: () => setActiveCategory('all'),
            });
        }
        formats.forEach((formatId) => {
            chips.push({
                key: `format-${formatId}`,
                label: t(FORMAT_LABELS[formatId]),
                clear: () => toggleFormat(formatId),
            });
        });
        if (eraNarrowed) {
            chips.push({
                key: 'era',
                label: `${yearRange[0]}–${yearRange[1]}`,
                clear: () => setYearRange(yearDomain),
            });
        }
        if (activeLanguage !== 'all') {
            chips.push({
                key: 'language',
                label: activeLanguage,
                clear: () => setActiveLanguage('all'),
            });
        }
        return chips;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory, categories, formats, eraNarrowed, yearRange, yearDomain, activeLanguage, t]);

    /* ── Pagination ── */

    const catChipsOverflow = useOverflowing(catChipsRef, [categories, isMobile]);
    const activeChipsOverflow = useOverflowing(activeChipsRef, [activeChips]);

    const totalResults = filteredBooks.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const shownBooks = isMobile
        ? filteredBooks.slice(0, mobileVisible)
        : filteredBooks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const countLine = activeCategory === 'all'
        ? t('library.showingOf', { count: shownBooks.length, total: totalResults })
        : t('library.showingIn', {
            count: shownBooks.length,
            total: totalResults,
            category: translateCategory(
                (categories.find(c => c.id === activeCategory) || { name: activeCategory }).name,
                t
            ),
        });

    const handleDeleteBook = async (id, isAudiobook) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const table = isAudiobook ? 'audiobooks' : 'digital_library_books';
            const { error } = await supabase.from(table).delete().eq('id', id);

            if (error) throw error;

            if (isAudiobook) {
                setAudiobooks(prev => prev.filter(b => b.id !== id));
            } else {
                setAllBooks(prev => prev.filter(b => b.id !== id));
            }
        } catch (err) {
            console.error("Error deleting book:", err);
            alert("Failed to delete: " + err.message);
        }
    };

    const libraryStats = useMemo(() => {
        const languageSet = new Set(catalog.map(b => b.language).filter(Boolean));
        const totalDownloads = catalog.reduce((sum, b) => sum + (b.downloads || 0), 0);
        return {
            documents: catalog.length,
            languages: languageSet.size,
            downloads: totalDownloads > 1000000 ? `${(totalDownloads / 1000000).toFixed(1)}M` : totalDownloads > 1000 ? `${(totalDownloads / 1000).toFixed(1)}K` : totalDownloads,
        };
    }, [catalog]);

    /* Mobile filter sheet: lock background scroll, close on Escape, and
       behave like a modal dialog — focus lands inside, Tab wraps within,
       focus returns to the Filters button on close. */
    const wasSheetOpen = useRef(false);
    useEffect(() => {
        if (!isMobile) return;
        if (sheetOpen) {
            document.body.classList.add('dl-sheet-open');
            const sheet = asideRef.current;
            if (sheet) {
                const first = sheet.querySelector('button, select, input, a[href]');
                (first || sheet).focus?.();
            }
            const focusablesIn = () => [...(asideRef.current?.querySelectorAll('button, select, input, a[href]') || [])]
                .filter(el => !el.disabled && el.getClientRects().length > 0);
            const onKey = (e) => {
                if (e.key === 'Escape') { setSheetOpen(false); return; }
                if (e.key !== 'Tab') return;
                const items = focusablesIn();
                if (items.length === 0) return;
                const firstEl = items[0];
                const lastEl = items[items.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
                else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
            };
            window.addEventListener('keydown', onKey);
            wasSheetOpen.current = true;
            return () => {
                document.body.classList.remove('dl-sheet-open');
                window.removeEventListener('keydown', onKey);
            };
        }
        if (wasSheetOpen.current) {
            wasSheetOpen.current = false;
            filterBtnRef.current?.focus?.();
        }
        return undefined;
    }, [sheetOpen, isMobile]);

    const rangePct = (value) => {
        if (!yearDomain || yearDomain[1] === yearDomain[0]) return 0;
        return ((value - yearDomain[0]) / (yearDomain[1] - yearDomain[0])) * 100;
    };
    const minPct = yearRange ? rangePct(yearRange[0]) : 0;
    const maxPct = yearRange ? rangePct(yearRange[1]) : 100;

    const rangeTicks = useMemo(() => {
        if (!yearDomain) return [];
        const [lo, hi] = yearDomain;
        const round5 = (v) => Math.round(v / 5) * 5;
        return [lo, round5(lo + (hi - lo) * 0.25), round5(lo + (hi - lo) * 0.5), hi];
    }, [yearDomain]);

    /* The sidebar and the mobile bottom sheet share this filter rail. */
    const filterRail = (
        <>
            <div className={s.sheetHandle} aria-hidden="true" />
            <div className={s.sheetHead}>
                <h3 className={s.sheetTitle} id="dl-filter-sheet-title">{t('library.filtersLabel')}</h3>
                <button type="button" className={s.sheetClose} onClick={() => setSheetOpen(false)} aria-label={t('common.close')}>
                    <X size={11} />
                </button>
            </div>
            <div className={s.sideScroll}>
                {/* Sort + search mode live in the sheet on mobile (16px select
                    text avoids the iOS focus zoom); hidden on desktop. */}
                <div className={s.mobileOnly}>
                    <div className={s.sheetSortBlock}>
                        <h4 className={s.sideHeading}>{t('library.sortLabel')}</h4>
                        <div className={s.sheetSortChips}>
                            {Object.entries(SORT_MODES).map(([value, labelKey]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSortMode(value)}
                                    className={`${s.sortChip}${sortMode === value ? ` ${s.sortChipOn}` : ''}`}
                                    aria-pressed={sortMode === value}
                                >
                                    {t(labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={s.sheetModeRow}>
                        <label className={s.sideHeading} htmlFor="dl-search-mode-sheet">{t('library.searchModeLabel')}</label>
                        <select
                            id="dl-search-mode-sheet"
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value)}
                            className={`${s.selectControl} ${s.sheetModeSelect}`}
                        >
                            {Object.entries(SEARCH_MODES).map(([value, labelKey]) => (
                                <option key={value} value={value}>{t(labelKey)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <h4 className={s.sideHeading}>{t('library.categoriesLabel')}</h4>
                {categories.map((category) => {
                    const Icon = category.icon;
                    const on = activeCategory === category.id;
                    const count = category.id === 'all' ? catalog.length : (sectionCounts.get(category.id) || 0);
                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCategory(category.id)}
                            className={`${s.catRow}${on ? ` ${s.catRowOn}` : ''}`}
                            aria-pressed={on}
                        >
                            <Icon size={14} className={s.catIcon} />
                            <span className={s.catLabel}>{translateCategory(category.name, t)}</span>
                            <span className={s.catCount}>{count}</span>
                        </button>
                    );
                })}

                {yearDomain && yearRange && (
                    <>
                        <div className={s.divider} />
                        <h4 className={s.sideHeading}>{t('library.eraLabel')}</h4>
                        <div className={s.rangeValues}>
                            <span>{yearRange[0]}</span>
                            <span>{yearRange[1]}</span>
                        </div>
                        <div className={s.rangeField}>
                            <div className={s.rangeTrack}>
                                <div className={s.rangeFill} style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
                            </div>
                            <span className={s.rangeHandle} style={{ left: `${minPct}%` }} aria-hidden="true" />
                            <span className={s.rangeHandle} style={{ left: `${maxPct}%` }} aria-hidden="true" />
                            <input
                                type="range"
                                className={s.rangeInput}
                                min={yearDomain[0]}
                                max={yearDomain[1]}
                                step={1}
                                value={yearRange[0]}
                                aria-label={t('library.minYearLabel')}
                                onChange={(e) => setYearRange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])}
                            />
                            <input
                                type="range"
                                className={s.rangeInput}
                                min={yearDomain[0]}
                                max={yearDomain[1]}
                                step={1}
                                value={yearRange[1]}
                                aria-label={t('library.maxYearLabel')}
                                onChange={(e) => setYearRange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])}
                            />
                        </div>
                        <div className={s.rangeTicks}>
                            {rangeTicks.map((tick, idx) => <span key={`${tick}-${idx}`}>{tick}</span>)}
                        </div>
                    </>
                )}

                <div className={s.divider} />
                <h4 className={s.sideHeading}>{t('library.formatLabel')}</h4>
                {FORMAT_SECTIONS.map(({ id, labelKey }) => {
                    const on = formats.has(id);
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => toggleFormat(id)}
                            className={`${s.fmtRow}${on ? ` ${s.fmtRowOn}` : ''}`}
                            aria-pressed={on}
                        >
                            <span className={s.fmtLabelText}>
                                <span className={`${s.fmtBox}${on ? ` ${s.fmtBoxOn}` : ''}`}>
                                    {on && <Check size={9} strokeWidth={2.6} />}
                                </span>
                                {t(labelKey)}
                            </span>
                            <span className={s.fmtCount}>{formatCounts[id] || 0}</span>
                        </button>
                    );
                })}

                {languages.length > 1 && (
                    <>
                        <div className={s.divider} />
                        <h4 className={s.sideHeading}>{t('library.languageLabel')}</h4>
                        {languages.map((lang) => {
                            const on = activeLanguage === lang;
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setActiveLanguage(on ? 'all' : lang)}
                                    className={`${s.fmtRow}${on ? ` ${s.fmtRowOn}` : ''}`}
                                    aria-pressed={on}
                                >
                                    <span className={s.fmtLabelText}>
                                        <span className={`${s.fmtBox}${on ? ` ${s.fmtBoxOn}` : ''}`}>
                                            {on && <Check size={9} strokeWidth={2.6} />}
                                        </span>
                                        {lang}
                                    </span>
                                </button>
                            );
                        })}
                    </>
                )}
            </div>
            <button type="button" className={s.clearLink} onClick={clearAllFilters}>
                {t('library.clearFilters')}
            </button>
            <div className={s.sheetFooter}>
                <button type="button" className={s.sheetClear} onClick={clearAllFilters}>
                    {t('library.clearAll')}
                </button>
                <button type="button" className={s.sheetCta} onClick={() => setSheetOpen(false)}>
                    {t('library.showResults', { count: totalResults })}
                </button>
            </div>
        </>
    );

    const sortSelect = (extraClass) => (
        <span className={`${s.selectWrap} ${extraClass || ''}`}>
            <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                aria-label={t('library.sortLabel')}
                className={s.selectControl}
                data-testid="sort-select"
            >
                {Object.entries(SORT_MODES).map(([value, labelKey]) => (
                    <option key={value} value={value}>{t(labelKey)}</option>
                ))}
            </select>
            <ChevronDown size={10} className={s.selectChevron} aria-hidden="true" />
        </span>
    );

    const effectiveViewMode = isMobile ? 'grid' : viewMode;

    return (
        <div className={s.page}>

            {/* Hero — archive band with the catalog stats as one quiet meta line */}
            <header className={s.hero}>
                <div className={s.heroInner}>
                    <p className={s.eyebrow}>{t('library.archive')}</p>
                    <div className={s.heroRow}>
                        <div>
                            <h1 className={s.heroTitle}>{t('library.title')}</h1>
                            <div className={s.heroUnderline} aria-hidden="true" />
                            <p className={s.heroMeta}>
                                {libraryStats.documents} {t('library.documents')}
                                <span aria-hidden="true"> · </span>
                                {libraryStats.languages} {t('library.languages')}
                                <span aria-hidden="true"> · </span>
                                {libraryStats.downloads} {t('library.downloads')}
                            </p>
                            <a href="/readers/digital-twin/index.html" className={s.experimentalReaderLink}>
                                <BookOpen size={13} aria-hidden="true" />
                                Experimental reader
                                <ArrowRight size={13} aria-hidden="true" />
                            </a>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowReadingLists(true)}
                            className={s.localLists}
                        >
                            <BookmarkPlus size={12} />
                            <span className={s.localListsLabel}>{t('library.myLists')}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className={s.layout}>
                <div
                    className={`${s.sheetOverlay}${sheetOpen ? ' open' : ''}`}
                    onClick={() => setSheetOpen(false)}
                    aria-hidden="true"
                />
                <aside
                    ref={asideRef}
                    className={`${s.side}${sheetOpen ? ` ${s.sideOpen}` : ''}`}
                    aria-label={t('library.filtersLabel')}
                    role={isMobile ? 'dialog' : undefined}
                    aria-modal={isMobile && sheetOpen ? 'true' : undefined}
                    aria-labelledby={isMobile ? 'dl-filter-sheet-title' : undefined}
                    tabIndex={-1}
                >
                    {filterRail}
                </aside>

                <div className={s.main}>
                    {/* Toolbar — search, mode, view toggle, sort */}
                    <div className={s.topbarRow}>
                        <div className={s.searchBox}>
                            <span className={s.searchIcon}><Search size={13} /></span>
                            <input
                                type="text"
                                placeholder={t('library.searchPlaceholder')}
                                className={s.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label={t('nav.searchLibrary')}
                            />
                        </div>
                        <span className={`${s.selectWrap} ${s.desktopOnly}`}>
                            <select
                                value={searchMode}
                                onChange={(e) => setSearchMode(e.target.value)}
                                aria-label={t('library.searchModeLabel')}
                                data-testid="search-mode-select"
                                className={s.selectControl}
                            >
                                {Object.entries(SEARCH_MODES).map(([value, labelKey]) => (
                                    <option key={value} value={value}>{t(labelKey)}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className={s.selectChevron} aria-hidden="true" />
                        </span>
                        <div className={`${s.viewToggle} ${s.desktopOnly}`}>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                aria-label={t('library.gridView')}
                                aria-pressed={viewMode === 'grid'}
                                className={`${s.viewBtn}${viewMode === 'grid' ? ` ${s.viewBtnActive}` : ''}`}
                            >
                                <Grid size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                aria-label={t('library.listView')}
                                aria-pressed={viewMode === 'list'}
                                className={`${s.viewBtn}${viewMode === 'list' ? ` ${s.viewBtnActive}` : ''}`}
                            >
                                <List size={14} />
                            </button>
                        </div>
                        {!isMobile && sortSelect()}
                    </div>

                    {isMobile && (
                        <div className={s.mobileBtnRow}>
                            <button
                                type="button"
                                ref={filterBtnRef}
                                className={s.mobileFilterBtn}
                                onClick={() => setSheetOpen(true)}
                                aria-haspopup="dialog"
                                aria-expanded={sheetOpen}
                            >
                                <SlidersHorizontal size={13} />
                                {t('library.filtersLabel')}
                                {activeChips.length > 0 && (
                                    <span className={s.mobileBadge}>{activeChips.length}</span>
                                )}
                            </button>
                            {/* Libby-style quick chips: the categories ride
                                directly under the search, one thumb-flick away. */}
                            <div ref={catChipsRef} className={`${s.catChips}${catChipsOverflow ? ` ${s.chipsFade}` : ''}`} role="group" aria-label={t('library.categoriesLabel')}>
                                {categories.map((category) => {
                                    const on = activeCategory === category.id;
                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`${s.catChip}${on ? ` ${s.catChipOn}` : ''}`}
                                            aria-pressed={on}
                                        >
                                            {translateCategory(category.name, t)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Active filters as removable chips */}
                    <div className={s.breadRow}>
                        <div ref={activeChipsRef} className={`${s.chips}${activeChipsOverflow ? ` ${s.chipsFade}` : ''}`}>
                            {activeChips.map((chip) => (
                                <span key={chip.key} className={s.chip}>
                                    {chip.label}
                                    <button type="button" className={s.chipX} onClick={chip.clear} aria-label={`${t('common.close')}: ${chip.label}`}>
                                        <X size={9} strokeWidth={2} />
                                    </button>
                                </span>
                            ))}
                            {activeChips.length > 0 && (
                                <button type="button" className={s.chipClear} onClick={clearAllFilters}>
                                    {t('library.clearAll')}
                                </button>
                            )}
                            {isAdminUser && activeCategory === PDF_DOWNLOADS_SECTION && <PdfUploadAction />}
                        </div>
                        <div className={s.countTxt}>{countLine}</div>
                    </div>

                    {/* Full-text passage results sit above the grid — the primary
                        answer to a quote/sentence lookup, with the grid below
                        still surfacing metadata matches. */}
                    {textSearchActive && (passagesLoading || (visiblePassageRows && visiblePassageRows.length > 0)) && (
                        <div style={{ marginBottom: '40px' }} data-testid="passages-block">
                            {passagesLoading && !visiblePassageRows ? (
                                <div className={s.stateLine}>{t('library.searchingTexts')}</div>
                            ) : (
                                <PassagesResults query={normalizedQuery} rows={visiblePassageRows} />
                            )}
                        </div>
                    )}

                    {isLoading ? (
                        <div className={s.stateLine}>{t('common.loading')}</div>
                    ) : error ? (
                        <div className={s.stateLineError}>{error}</div>
                    ) : searchMode === 'exact' && debouncedSearchQuery ? (
                        passagesLoading || (visiblePassageRows && visiblePassageRows.length > 0) ? null : (
                            <div className={s.stateLine} data-testid="no-passage-results">
                                {passagesUnavailable ? t('library.noBooks') : t('library.noPassages')}
                            </div>
                        )
                    ) : filteredBooks.length === 0 && !passagesLoading && !(visiblePassageRows && visiblePassageRows.length > 0) ? (
                        <div className={s.stateLine}>{t('library.noBooks')}</div>
                    ) : filteredBooks.length === 0 ? null : effectiveViewMode === 'grid' ? (
                        <div className={s.grid}>
                            {shownBooks.map(book => (
                                <BookCard key={book.id} book={book} isAdminUser={isAdminUser} onDelete={handleDeleteBook} onPlay={playAudiobook} />
                            ))}
                        </div>
                    ) : (
                        <div className={s.listview}>
                            <div className={s.lvHead}>
                                <div>{t('library.listTitle')}</div>
                                <div className={s.lvCatCol}>{t('library.listCategory')}</div>
                                <div>{t('library.listYear')}</div>
                                <div>{t('library.listFormat')}</div>
                                <div />
                            </div>
                            {shownBooks.map(book => (
                                <BookRow key={book.id} book={book} isAdminUser={isAdminUser} onDelete={handleDeleteBook} onPlay={playAudiobook} />
                            ))}
                        </div>
                    )}

                    {/* Pagination — numbered pages on desktop, load-more on mobile */}
                    {!isLoading && !error && totalResults > 0 && (
                        isMobile ? (
                            mobileVisible < totalResults && (
                                <button type="button" className={s.loadMore} onClick={() => setMobileVisible(v => v + PAGE_SIZE)}>
                                    {t('library.loadMoreWithCount', { count: totalResults - mobileVisible })}
                                </button>
                            )
                        ) : (
                            <div className={s.pagerow}>
                                <div className={s.pageInfo}>
                                    {t('library.pageRange', {
                                        from: totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1,
                                        to: Math.min(currentPage * PAGE_SIZE, totalResults),
                                        total: totalResults,
                                    })}
                                </div>
                                {totalPages > 1 && (
                                    <div className={s.pages}>
                                        <button
                                            type="button"
                                            className={s.pageBtn}
                                            disabled={currentPage === 1}
                                            onClick={() => setPage(currentPage - 1)}
                                            aria-label={t('library.prevPage')}
                                        >
                                            <ChevronLeft size={11} />
                                        </button>
                                        {pageList(currentPage, totalPages).map((n, idx) => (
                                            n === '…'
                                                ? <span key={`ellipsis-${idx}`} className={s.pageEllipsis}>…</span>
                                                : (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setPage(n)}
                                                        aria-current={n === currentPage ? 'page' : undefined}
                                                        className={`${s.pageBtn}${n === currentPage ? ` ${s.pageBtnActive}` : ''}`}
                                                    >
                                                        {n}
                                                    </button>
                                                )
                                        ))}
                                        <button
                                            type="button"
                                            className={s.pageBtn}
                                            disabled={currentPage === totalPages}
                                            onClick={() => setPage(currentPage + 1)}
                                            aria-label={t('library.nextPage')}
                                        >
                                            <ChevronRight size={11} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Reading List Panel */}
            {showReadingLists && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
                        onClick={() => setShowReadingLists(false)}
                    />
                    <ReadingListPanel
                        onClose={() => setShowReadingLists(false)}
                        onNavigateToBook={(bookId) => {
                            setShowReadingLists(false);
                            router.push(`/book/${bookId}`);
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default DigitalLibraryPage;
