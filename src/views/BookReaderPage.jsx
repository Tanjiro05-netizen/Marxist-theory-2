import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader, AlertCircle, Download, BookOpen, Bookmark, ArrowLeft, FileText, BookMarked } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { recordBookDownload } from '../services/libraryStats';
import EpubReader from '../components/EpubReader/EpubReader';
import EditorialReader from '../components/EditorialReader/EditorialReader';
import TextEditionReader from '../components/TextEditionReader/TextEditionReader';
import BookReviewSection from '../components/Library/BookReviewSection';
import AddToListButton from '../components/Library/AddToListButton';
import * as s from './BookReaderPage.css.ts';

const BookReaderPage = () => {
    const { bookId } = useParams();
    // Deep link from library full-text search: ?q=<phrase>&section=<sN>
    const searchParams = useSearchParams();
    const highlightQuery = searchParams.get('q') || null;
    const highlightSectionId = searchParams.get('section') || null;
    const { user } = useAuth();
    const { t } = useTranslation();

    const [book, setBook] = useState(null);
    const [epubUrl, setEpubUrl] = useState(null);
    const [pdfDownloadUrl, setPdfDownloadUrl] = useState(null);
    const [coverUrl, setCoverUrl] = useState(null);
    const [coverError, setCoverError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // 'read' (editorial) | 'text' (indexed text edition, search deep links) | 'ebook' (paginated reader)
    const [view, setView] = useState('read');
    const [relatedBooks, setRelatedBooks] = useState([]);
    const progressTimerRef = useRef(null);

    const isAuthed = !!user && user.id !== 'dev-admin';

    useEffect(() => {
        const fetchBook = async () => {
            if (!bookId) {
                setError('No book ID provided.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const { data: bookData, error: dbError } = await supabase
                    .from('digital_library_books')
                    .select('id, title, author, year, pages, description, cover_image_url, epub_filename, pdf_filename, text_edition, category')
                    .eq('id', bookId)
                    .single();

                if (dbError) throw new Error(dbError.message || 'Book not found.');
                if (!bookData) throw new Error('Book not found.');

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
                if (bookData.epub_filename) {
                    const { data: epubData } = supabase.storage.from('library').getPublicUrl(bookData.epub_filename);
                    if (epubData?.publicUrl) setEpubUrl(epubData.publicUrl);
                }

                // Build PDF URL for inline reading + download
                if (bookData.pdf_filename) {
                    const { data: pdfData } = supabase.storage.from('library').getPublicUrl(bookData.pdf_filename);
                    if (pdfData?.publicUrl) setPdfDownloadUrl(pdfData.publicUrl);
                }

                if (bookData.cover_image_url) {
                    if (bookData.cover_image_url.includes('supabase')) {
                        setCoverUrl(bookData.cover_image_url);
                    } else if (bookData.cover_image_url.startsWith('/')) {
                        const filename = bookData.cover_image_url.split('/').pop();
                        const { data: coverData } = supabase.storage.from('covers').getPublicUrl(filename);
                        if (coverData?.publicUrl) setCoverUrl(coverData.publicUrl);
                    } else {
                        setCoverUrl(bookData.cover_image_url);
                    }
                }

                if (user && user.id !== 'dev-admin') {
                    const [bookmarkRes, progressRes] = await Promise.all([
                        supabase.from('user_book_bookmarks').select('id').eq('user_id', user.id).eq('book_id', bookId).maybeSingle(),
                        supabase.from('user_book_progress').select('progress_percentage').eq('user_id', user.id).eq('book_id', bookId).maybeSingle(),
                    ]);
                    setIsBookmarked(!!bookmarkRes.data);
                    if (progressRes.data) setProgress(progressRes.data.progress_percentage);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching book:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBook();
    }, [bookId, user, highlightQuery]);

    // Books proposed at the foot of the reading page — same shelf first.
    useEffect(() => {
        if (!bookId) return undefined;
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
                    let cover = null;
                    const raw = b.cover_image_url;
                    if (raw?.includes('supabase')) {
                        cover = raw;
                    } else if (raw?.startsWith('/')) {
                        const filename = raw.split('/').pop();
                        const { data: coverData } = supabase.storage.from('covers').getPublicUrl(filename);
                        cover = coverData?.publicUrl || null;
                    } else {
                        cover = raw || null;
                    }
                    return { ...b, cover };
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
    }, [bookId, book?.category]);

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

    if (isLoading) {
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
