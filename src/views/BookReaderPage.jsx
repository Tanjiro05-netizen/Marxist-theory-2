import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader, AlertCircle, Download, BookOpen, Bookmark, ArrowLeft, FileText, Calendar, BookMarked } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import EpubReader from '../components/EpubReader/EpubReader';
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
                    .select('id, title, author, year, pages, description, cover_image_url, epub_filename, pdf_filename, category')
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

    // Debounced auto-progress callback from EpubReader
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

    return (
        <div className={s.page}>
            <div className={s.inner}>
                <Link href="/digital-library" className={s.backLink}>
                    <ArrowLeft size={14} />
                    Digital Library
                </Link>

                <div className={s.grid}>
                    {/* ── Sidebar ── */}
                    <aside className={s.sidebar}>
                        <div className={s.coverWrap}>
                            {coverUrl && !coverError ? (
                                <img
                                    src={coverUrl}
                                    alt={book.title}
                                    className={s.coverImg}
                                    onError={() => setCoverError(true)}
                                />
                            ) : (
                                <div className={s.coverFallback}>
                                    <BookOpen size={48} className={s.coverFallbackIcon} />
                                    <p className={s.coverFallbackText}>{book.title}</p>
                                </div>
                            )}
                        </div>

                        <h1 className={s.bookTitle}>{book.title}</h1>
                        {book.author && <p className={s.bookAuthor}>{book.author}</p>}
                        {book.description && <p className={s.bookDesc}>{book.description}</p>}

                        <div className={s.metaStack}>
                            {book.year && (
                                <div className={s.metaRow}>
                                    <span className={s.metaLabel}>Year</span>
                                    <span className={s.metaValue}>
                                        <Calendar size={12} />
                                        {book.year}
                                    </span>
                                </div>
                            )}
                            {book.pages && (
                                <div className={s.metaRow}>
                                    <span className={s.metaLabel}>Pages</span>
                                    <span className={s.metaValue}>
                                        <FileText size={12} />
                                        {book.pages}
                                    </span>
                                </div>
                            )}
                            {book.category && (
                                <div className={s.metaRow}>
                                    <span className={s.metaLabel}>Category</span>
                                    <span className={s.metaValue}>{book.category}</span>
                                </div>
                            )}
                        </div>

                        {/* Auto-tracked reading progress */}
                        {isAuthed && (
                            <div className={s.metaStack}>
                                <div className={s.metaRow}>
                                    <span className={s.metaLabel}>
                                        Reading progress
                                        {isSavingProgress && <Loader size={10} className="inline ml-1 animate-spin" />}
                                    </span>
                                    <span className={s.metaValue}>{progress}%</span>
                                </div>
                                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, background: '#ef4444', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                </div>
                            </div>
                        )}

                        <div className={s.actionStack}>
                            {pdfDownloadUrl && (
                                <a href={pdfDownloadUrl} download={`${book.title}.pdf`} className={s.downloadBtn}>
                                    <Download size={15} style={{ marginRight: '6px' }} />
                                    {t('book.downloadPDF')}
                                </a>
                            )}
                            {isAuthed && (
                                <button onClick={handleToggleBookmark} className={s.extBtn}>
                                    {isBookmarked ? (
                                        <>
                                            <BookMarked size={15} style={{ marginRight: '6px', color: '#ef4444' }} />
                                            {t('common.bookmarked')}
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark size={15} style={{ marginRight: '6px' }} />
                                            {t('common.bookmark')}
                                        </>
                                    )}
                                </button>
                            )}
                            <AddToListButton bookId={bookId} />
                        </div>
                    </aside>

                    {/* ── Reader ── */}
                    <div className={s.readerSection} data-testid="book-reader">
                        <div className={s.readerHeader}>
                            <div>
                                <p className={s.readerTitle}>{book.title}</p>
                                {book.author && <p className={s.readerDesc}>{book.author}</p>}
                            </div>
                        </div>

                        {epubUrl ? (
                            <div data-testid="book-reader-epub" className={s.iframeWrap} style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 100, height: '100vh', minHeight: '100vh', borderRadius: 0 } : undefined}>
                                <EpubReader
                                    url={epubUrl}
                                    title={book.title}
                                    onProgressChange={handleAutoProgress}
                                    onToggleFullscreen={() => setIsFullscreen(f => !f)}
                                    isFullscreen={isFullscreen}
                                    fallbackUrl={pdfDownloadUrl}
                                />
                            </div>
                        ) : pdfDownloadUrl ? (
                            <div data-testid="book-reader-pdf" className={s.iframeWrap} style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 100, height: '100vh', minHeight: '100vh', borderRadius: 0 } : undefined}>
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

                        {/* Book Reviews */}
                        <BookReviewSection bookId={bookId} canWrite={isAuthed} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookReaderPage;
