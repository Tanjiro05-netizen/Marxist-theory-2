'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader, AlertCircle, Download, BookOpen, Bookmark, ArrowLeft, FileText, BookMarked } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { prefetchQuery } from '../lib/queryCache';
import { bookQueryKey, fetchBook } from '../lib/libraryQueries';
import { coverImageSrc } from '../lib/coverImage';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { recordBookDownload } from '../services/libraryStats';
import BookReviewSection from '../components/Library/BookReviewSection';
import AddToListButton from '../components/Library/AddToListButton';
import * as s from './BookReaderPage.css.ts';

/* A book opens in exactly one of these. Loading all three put epub.js and
   mark.js in the route's first-load bundle for every reader, including the
   majority whose book is a plain text edition and needs neither. Each is
   fetched when the view that uses it is actually shown. */
/* The title page draws its cover up to 340px tall — about 227px wide at the
   usual 2:3 — and the suggested shelf at thumbnail size. */
const TITLE_COVER_WIDTH = 640;
const SUGGESTED_COVER_WIDTH = 256;

const storageUrl = (bucket, filename) => {
    if (!filename) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data?.publicUrl || null;
};

const readerLoading = () => (
    <div className={s.readerLoadingWrap}>
        <div className={s.loadingInner}>
            <Loader size={28} className="animate-spin text-red-500" />
        </div>
    </div>
);
const EditorialReader = dynamic(() => import('../components/EditorialReader/EditorialReader'), {
    ssr: false,
    loading: readerLoading,
});
const TextEditionReader = dynamic(() => import('../components/TextEditionReader/TextEditionReader'), {
    ssr: false,
    loading: readerLoading,
});
const EpubReader = dynamic(() => import('../components/EpubReader/EpubReader'), {
    ssr: false,
    loading: readerLoading,
});

const BookReaderPage = ({ initialBook = null }) => {
    const { bookId } = useParams();
    // Deep link from library full-text search: ?q=<phrase>&section=<sN>
    const searchParams = useSearchParams();
    const highlightQuery = searchParams.get('q') || null;
    const highlightSectionId = searchParams.get('section') || null;
    const { user } = useAuth();
    const { t } = useTranslation();

    /* The server already rendered the title page from this; the client fetch
       below replaces it with the full row (text edition included). */
    const [book, setBook] = useState(initialBook);
    const [epubUrl, setEpubUrl] = useState(() => storageUrl('library', initialBook?.epub_filename));
    const [pdfDownloadUrl, setPdfDownloadUrl] = useState(() => storageUrl('library', initialBook?.pdf_filename));
    const [coverUrl, setCoverUrl] = useState(() => coverImageSrc(initialBook?.cover_image_url, TITLE_COVER_WIDTH));
    const [coverError, setCoverError] = useState(false);
    const [isLoading, setIsLoading] = useState(!initialBook);
    const [error, setError] = useState(null);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // 'read' (editorial) | 'text' (indexed text edition, search deep links) | 'ebook' (paginated reader)
    const [view, setView] = useState('read');
    const [relatedBooks, setRelatedBooks] = useState([]);
    /* The suggested shelf is only fetched once it comes into reach. */
    const [suggestedNear, setSuggestedNear] = useState(false);
    const suggestedRef = useRef(null);
    const progressTimerRef = useRef(null);

    const isAuthed = !!user && user.id !== 'dev-admin';

    useEffect(() => {
        let cancelled = false;

        /* Moving between books keeps this component mounted, so adopt the
           new book's server-rendered metadata before anything is fetched —
           otherwise the previous book stays on screen while the next loads. */
        const seed = initialBook && initialBook.id === bookId ? initialBook : null;
        if (seed) {
            setBook(seed);
            setEpubUrl(storageUrl('library', seed.epub_filename));
            setPdfDownloadUrl(storageUrl('library', seed.pdf_filename));
            setCoverUrl(coverImageSrc(seed.cover_image_url, TITLE_COVER_WIDTH));
            setCoverError(false);
        }

        const loadBook = async () => {
            if (!bookId) {
                setError('No book ID provided.');
                setIsLoading(false);
                return;
            }

            /* Coming back to a book already read in this session costs no
               network: prefetchQuery hands back the cached row, so the
               spinner is gone within a tick instead of a round trip. */
            setIsLoading(!seed);
            try {
                const bookData = await prefetchQuery(bookQueryKey(bookId), () => fetchBook(bookId));
                if (cancelled) return;

                setBook(bookData);

                // A text-search hit lands on the indexed text edition (the
                // section ids only exist there), even when an EPUB exists.
                if (
                    highlightQuery &&
                    bookData.epub_filename &&
                    Array.isArray(bookData.text_edition?.sections) &&
                    bookData.text_edition.sections.length > 0
                ) {
                    setView('text');
                }

                // Build EPUB URL for the reader (primary reading format)
                if (bookData.epub_filename) setEpubUrl(storageUrl('library', bookData.epub_filename));

                // Build PDF URL for inline reading + download
                if (bookData.pdf_filename) setPdfDownloadUrl(storageUrl('library', bookData.pdf_filename));

                if (bookData.cover_image_url) {
                    const raw = bookData.cover_image_url;
                    const resolved = raw.startsWith('/') && !raw.includes('supabase')
                        ? storageUrl('covers', raw.split('/').pop())
                        : raw;
                    if (resolved) setCoverUrl(coverImageSrc(resolved, TITLE_COVER_WIDTH));
                }

                setError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('Error fetching book:', err);
                setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadBook();
        return () => { cancelled = true; };
        /* Deliberately not keyed on `user`: the book's own text is the same
           for everyone, and re-running when the session resolves meant
           downloading the whole text edition a second time. The reader's
           own bookmark and progress are fetched separately below. */
    }, [bookId, highlightQuery, initialBook]);

    /* Where this reader left off, and whether they kept the book. */
    useEffect(() => {
        if (!bookId || !isAuthed) {
            setIsBookmarked(false);
            setProgress(0);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            try {
                const [bookmarkRes, progressRes] = await Promise.all([
                    supabase.from('user_book_bookmarks').select('id').eq('user_id', user.id).eq('book_id', bookId).maybeSingle(),
                    supabase.from('user_book_progress').select('progress_percentage').eq('user_id', user.id).eq('book_id', bookId).maybeSingle(),
                ]);
                if (cancelled) return;
                setIsBookmarked(!!bookmarkRes.data);
                if (progressRes.data) setProgress(progressRes.data.progress_percentage);
            } catch (err) {
                console.error('Error loading reading state:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [bookId, isAuthed, user?.id]);

    /* Books proposed at the foot of the reading page — same shelf first.
       They sit below the whole text, so they wait until the reader is on
       their way down: fetching them on mount put a query and four cover
       images on the wire beside the book itself, which is the one thing
       the reader is waiting for. */
    useEffect(() => {
        const target = suggestedRef.current;
        if (!target || suggestedNear || typeof IntersectionObserver !== 'function') return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setSuggestedNear(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px 0px' }
        );
        observer.observe(target);
        return () => observer.disconnect();
        /* `book` is a dependency because the sentinel only exists once the
           reader has rendered — before that there is nothing to observe. */
    }, [suggestedNear, book]);

    useEffect(() => {
        if (!bookId || !suggestedNear) return undefined;
        let cancelled = false;
        const fetchRelated = async () => {
            try {
                const { data } = await supabase
                    .from('digital_library_books')
                    .select('id, title, author, year, cover_image_url, category')
                    .neq('id', bookId)
                    .limit(8);
                if (cancelled || !Array.isArray(data)) return;
                const withCovers = data.map((b) => {
                    let cover = b.cover_image_url || null;
                    if (cover && cover.startsWith('/') && !cover.includes('supabase')) {
                        const filename = cover.split('/').pop();
                        const { data: coverData } = supabase.storage.from('covers').getPublicUrl(filename);
                        cover = coverData?.publicUrl || null;
                    }
                    return { ...b, cover: coverImageSrc(cover, SUGGESTED_COVER_WIDTH) };
                });
                const shelf = book?.category;
                withCovers.sort((a, b) => {
                    const aMatch = shelf && a.category === shelf ? 0 : 1;
                    const bMatch = shelf && b.category === shelf ? 0 : 1;
                    return aMatch - bMatch;
                });
                if (!cancelled) setRelatedBooks(withCovers.slice(0, 4));
            } catch (err) {
                console.error('Error fetching suggested books:', err);
            }
        };
        fetchRelated();
        return () => { cancelled = true; };
    }, [bookId, suggestedNear, book?.category]);

    const handleToggleBookmark = useCallback(async () => {
        if (!isAuthed) return;
        try {
            if (isBookmarked) {
                const { error } = await supabase.from('user_book_bookmarks').delete().eq('user_id', user.id).eq('book_id', bookId);
                if (error) throw error;
                setIsBookmarked(false);
            } else {
                const { error } = await supabase.from('user_book_bookmarks').insert({ user_id: user.id, book_id: bookId });
                if (error) throw error;
                setIsBookmarked(true);
            }
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    }, [isAuthed, isBookmarked, user, bookId]);

    const handleProgressChange = useCallback(async (newProgress) => {
        if (!isAuthed) return;
        setProgress(newProgress);
        setIsSavingProgress(true);
        try {
            await supabase.from('user_book_progress').upsert(
                { user_id: user.id, book_id: bookId, progress_percentage: newProgress, last_read_at: new Date().toISOString() },
                { onConflict: 'user_id, book_id' }
            );
        } catch (err) {
            console.error('Error saving progress:', err);
        } finally {
            setIsSavingProgress(false);
        }
    }, [isAuthed, user, bookId]);

    // Debounced auto-progress callback from both readers
    const handleAutoProgress = useCallback((pct) => {
        if (!isAuthed) return;
        setProgress(pct);
        if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
        progressTimerRef.current = setTimeout(() => handleProgressChange(pct), 5000);
    }, [isAuthed, handleProgressChange]);

    useEffect(() => {
        return () => { if (progressTimerRef.current) clearTimeout(progressTimerRef.current); };
    }, []);

    if (error) {
        return (
            <div className={s.page}>
                <div className={s.errorWrap}>
                    <div className={s.errorBox} data-testid="book-reader-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || !book) {
        return (
            <div className={s.page}>
                <div className={s.loadingWrap}>
                    <div className={s.loadingInner}>
                        <Loader size={32} className="animate-spin text-red-500" />
                        <span className={s.loadingText}>Loading book…</span>
                    </div>
                </div>
            </div>
        );
    }

    const metaParts = [
        book.author,
        book.year,
        book.pages ? `${book.pages} pp.` : null,
    ].filter(Boolean);

    // PDF-only books with a stored text edition still get a reading surface
    const textEdition =
        book.text_edition && Array.isArray(book.text_edition.sections) && book.text_edition.sections.length > 0
            ? book.text_edition
            : null;

    return (
        <div className={s.page}>
            <div className={s.inner}>
                <Link href="/digital-library" className={s.backLink}>
                    <ArrowLeft size={13} />
                    Digital Library
                </Link>

                {/* ── Title page ── */}
                <header className={s.titlePage}>
                    {coverUrl && !coverError ? (
                        <div className={s.coverFrame}>
                            <img
                                src={coverUrl}
                                alt={book.title}
                                className={s.coverImg}
                                onError={() => setCoverError(true)}
                            />
                        </div>
                    ) : (
                        <div className={s.coverFallback}>
                            <BookOpen size={36} className={s.coverFallbackIcon} />
                            <p className={s.coverFallbackText}>{book.title}</p>
                        </div>
                    )}

                    <p className={s.kicker}>{book.category || 'Digital Library'}</p>
                    <h1 className={s.title}>{book.title}</h1>
                    <div className={s.rule} aria-hidden="true" />
                    {metaParts.length > 0 && <p className={s.metaLine}>{metaParts.join('  ·  ')}</p>}
                    {book.description && <p className={s.standfirst}>{book.description}</p>}

                    {isAuthed && (
                        <div className={s.progressRow}>
                            <span className={s.progressLabel}>
                                {isSavingProgress ? 'Saving…' : `Reading — ${progress}%`}
                            </span>
                            <div className={s.progressTrack}>
                                <div className={s.progressFill} style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Toolbar: view toggle + actions ── */}
                <div className={s.toolbar}>
                    {(epubUrl || textEdition) && (
                        <div className={s.viewTabs} role="tablist" aria-label="Reading view">
                            {epubUrl && (
                                <button
                                    className={`${s.viewTab} ${view === 'read' ? s.viewTabActive : ''}`}
                                    onClick={() => setView('read')}
                                    role="tab"
                                    aria-selected={view === 'read'}
                                >
                                    Read
                                </button>
                            )}
                            {epubUrl && textEdition && highlightQuery && (
                                <button
                                    className={`${s.viewTab} ${view === 'text' ? s.viewTabActive : ''}`}
                                    onClick={() => setView('text')}
                                    role="tab"
                                    aria-selected={view === 'text'}
                                    data-testid="text-view-tab"
                                >
                                    {t('book.textView', { defaultValue: 'Text' })}
                                </button>
                            )}
                            {(epubUrl || pdfDownloadUrl) && (
                                <button
                                    className={`${s.viewTab} ${view === (epubUrl ? 'ebook' : 'pdf') ? s.viewTabActive : ''}`}
                                    onClick={() => setView(epubUrl ? 'ebook' : 'pdf')}
                                    role="tab"
                                    aria-selected={view === (epubUrl ? 'ebook' : 'pdf')}
                                >
                                    {epubUrl ? 'Ebook' : 'PDF'}
                                </button>
                            )}
                        </div>
                    )}

                    <div className={s.actions}>
                        {pdfDownloadUrl && (
                            <a
                                href={pdfDownloadUrl}
                                download={`${book.title}.pdf`}
                                className={s.toolBtn}
                                onClick={(e) => {
                                    // Let modifier-clicks and middle clicks behave natively
                                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                                    // Hold the navigation until the counter request is sent —
                                    // navigating first would abort the in-flight fetch.
                                    e.preventDefault();
                                    recordBookDownload(book.id).finally(() => {
                                        window.location.href = pdfDownloadUrl;
                                    });
                                }}
                            >
                                <Download size={14} />
                                {t('book.downloadPDF')}
                            </a>
                        )}
                        {isAuthed && (
                            <button onClick={handleToggleBookmark} className={s.toolBtn}>
                                {isBookmarked ? (
                                    <>
                                        <BookMarked size={14} style={{ color: '#d41f3d' }} />
                                        {t('common.bookmarked')}
                                    </>
                                ) : (
                                    <>
                                        <Bookmark size={14} />
                                        {t('common.bookmark')}
                                    </>
                                )}
                            </button>
                        )}
                        <AddToListButton bookId={bookId} />
                    </div>
                </div>

                {/* ── Reader surface ── */}
                <div className={s.readerSection} data-testid="book-reader">
                    {view === 'text' && textEdition ? (
                        <div data-testid="book-reader-text-edition">
                            <TextEditionReader
                                edition={textEdition}
                                bookId={bookId}
                                onProgressChange={handleAutoProgress}
                                fallbackUrl={pdfDownloadUrl}
                                fallbackLabel="Open the PDF directly"
                                highlightQuery={highlightQuery}
                                initialSectionId={highlightSectionId}
                            />
                        </div>
                    ) : epubUrl ? (
                        view === 'read' ? (
                            <div data-testid="book-reader-editorial">
                                <EditorialReader
                                    url={epubUrl}
                                    bookId={bookId}
                                    onProgressChange={handleAutoProgress}
                                    fallbackUrl={pdfDownloadUrl}
                                />
                            </div>
                        ) : (
                            <div data-testid="book-reader-epub" className={s.iframeWrap} style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 100, height: '100vh', minHeight: '100vh', border: 'none' } : undefined}>
                                <EpubReader
                                    url={epubUrl}
                                    title={book.title}
                                    onProgressChange={handleAutoProgress}
                                    onToggleFullscreen={() => setIsFullscreen(f => !f)}
                                    isFullscreen={isFullscreen}
                                    fallbackUrl={pdfDownloadUrl}
                                />
                            </div>
                        )
                    ) : textEdition ? (
                        view === 'read' || !pdfDownloadUrl ? (
                            <div data-testid="book-reader-text-edition">
                                <TextEditionReader
                                    edition={textEdition}
                                    bookId={bookId}
                                    onProgressChange={handleAutoProgress}
                                    fallbackUrl={pdfDownloadUrl}
                                    fallbackLabel="Open the PDF directly"
                                    highlightQuery={highlightQuery}
                                    initialSectionId={highlightSectionId}
                                />
                            </div>
                        ) : (
                            <div data-testid="book-reader-pdf" className={s.iframeWrap} style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 100, height: '100vh', minHeight: '100vh', border: 'none' } : undefined}>
                                <iframe
                                    src={pdfDownloadUrl}
                                    className={s.iframe}
                                    title={book.title}
                                    allowFullScreen
                                />
                            </div>
                        )
                    ) : pdfDownloadUrl ? (
                        <div data-testid="book-reader-pdf" className={s.iframeWrap} style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 100, height: '100vh', minHeight: '100vh', border: 'none' } : undefined}>
                            <iframe
                                src={pdfDownloadUrl}
                                className={s.iframe}
                                title={book.title}
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        <div className={s.noPdfWrap} data-testid="book-reader-no-file">
                            <div className={s.noPdfBox}>
                                <AlertCircle size={16} />
                                <span>{t('book.noFile')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Book Reviews */}
                <BookReviewSection bookId={bookId} canWrite={isAuthed} />

                {/* ── Suggested reading ── */}
                <div ref={suggestedRef} aria-hidden="true" />
                {relatedBooks.length > 0 && (
                    <section className={s.suggested} data-testid="suggested-books">
                        <h2 className={s.suggestedTitle}>{t('book.suggestedReading')}</h2>
                        <div className={s.suggestedGrid}>
                            {relatedBooks.map((b) => (
                                <Link key={b.id} href={`/book/${b.id}`} className={s.suggestedCard}>
                                    <div className={s.suggestedCover}>
                                        {b.cover ? (
                                            <img src={b.cover} alt="" loading="lazy" className={s.suggestedCoverImg} />
                                        ) : (
                                            <BookOpen size={22} className={s.suggestedCoverIcon} />
                                        )}
                                    </div>
                                    <p className={s.suggestedBookTitle}>{b.title}</p>
                                    <p className={s.suggestedMeta}>{[b.author, b.year].filter(Boolean).join(' · ')}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default BookReaderPage;
