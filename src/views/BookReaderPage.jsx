import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader, AlertCircle, Download, BookOpen, Bookmark, ArrowLeft, FileText, BookMarked } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import EpubReader from '../components/EpubReader/EpubReader';
import EditorialReader from '../components/EditorialReader/EditorialReader';
import TextEditionReader from '../components/TextEditionReader/TextEditionReader';
import BookReviewSection from '../components/Library/BookReviewSection';
import AddToListButton from '../components/Library/AddToListButton';
import * as s from './BookReaderPage.css.ts';

const BookReaderPage = () => {
    const { bookId } = useParams();
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
    const [view, setView] = useState('read'); // 'read' (editorial) | 'ebook' (paginated reader)
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
    }, [bookId, user]);

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
                            <button
                                className={`${s.viewTab} ${view === 'read' ? s.viewTabActive : ''}`}
                                onClick={() => setView('read')}
                                role="tab"
                                aria-selected={view === 'read'}
                            >
                                Read
                            </button>
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
                            <a href={pdfDownloadUrl} download={`${book.title}.pdf`} className={s.toolBtn}>
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
                    {epubUrl ? (
                        view === 'read' ? (
                            <div data-testid="book-reader-editorial">
                                <EditorialReader
                                    url={epubUrl}
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
                                    onProgressChange={handleAutoProgress}
                                    fallbackUrl={pdfDownloadUrl}
                                    fallbackLabel="Open the PDF directly"
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
            </div>
        </div>
    );
};

export default BookReaderPage;
