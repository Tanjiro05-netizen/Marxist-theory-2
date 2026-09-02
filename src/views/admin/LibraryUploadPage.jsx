import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { 
    Upload, FileText, Image, Check, AlertTriangle, 
    ArrowLeft, Save, X, Loader2, BookOpen, Download,
    Trash2, Headphones, ChevronDown, ChevronUp, Pencil
} from 'lucide-react';
import AudiobookUploadForm from './AudiobookUploadForm';
import TextEditionPanel from './TextEditionPanel';
import { buildEdition } from '../../utils/textEdition';

const CATEGORIES = [
    'Political Economy',
    'Philosophy',
    'History',
    'Sociology',
    'Strategy & Tactics',
    'Other',
];

const ERAS = [
    '19th Century',
    '20th Century',
    '21st Century',
];

const LANGUAGES = [
    'English',
    'German',
    'French',
    'Russian',
    'Spanish',
    'Chinese',
];

const getFilenameFromStoragePath = (path) => {
    if (!path) return '';
    return decodeURIComponent(`${path}`.split('?')[0].split('/').pop() || path);
};

const getCoverStoragePath = (coverUrl) => {
    if (!coverUrl) return null;
    const cleanUrl = `${coverUrl}`.split('?')[0];

    if (cleanUrl.includes('/covers/')) {
        return decodeURIComponent(cleanUrl.split('/covers/').pop());
    }

    if (!cleanUrl.startsWith('http')) {
        return getFilenameFromStoragePath(cleanUrl);
    }

    return null;
};

const readApiError = async (response, fallbackMessage) => {
    const body = await response.json().catch(() => ({}));
    return body.message || body.error || fallbackMessage;
};

const requestSignedUploadUrl = async (bucket, path) => {
    const response = await fetch('/api/admin/library-upload-url', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
        const message = await readApiError(response, 'Could not prepare upload.');
        throw new Error(`${message} (${bucket}/${path})`);
    }

    return response.json();
};

const uploadWithSignedUrl = async (bucket, path, file) => {
    const { token } = await requestSignedUploadUrl(bucket, path);
    const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, {
            cacheControl: '3600',
            contentType: file.type || 'application/octet-stream',
            upsert: false,
        });

    if (error) {
        throw new Error(error.message || 'Upload failed.');
    }

    return { error: null };
};

const saveLibraryBook = async ({ isEditingBook, editId, book, removeExistingPdf, removeExistingCover }) => {
    const response = await fetch('/api/admin/library-books', {
        method: isEditingBook ? 'PATCH' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookId: editId,
            book,
            removeExistingPdf,
            removeExistingCover,
        }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, isEditingBook ? 'Could not update book.' : 'Could not save book.'));
    }

    return response.json();
};

const sanitizeStorageSlug = (value, fallback = 'book') => {
    const slug = `${value || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-')
        .substring(0, 50)
        .replace(/-+$/g, '');

    return slug || fallback;
};

const getSafeFileExtension = (fileName, fallback = 'bin') => {
    const rawExtension = `${fileName || ''}`.split('.').pop() || '';
    const extension = rawExtension
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    return extension || fallback;
};

const LibraryUploadPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const editType = searchParams.get('edit');
    const isEditingBook = editType === 'book' && !!editId;
    const requestedFormat = `${searchParams.get('format') || searchParams.get('type') || searchParams.get('section') || ''}`.toLowerCase();
    const shouldStartInPdfMode = ['pdf', 'pdfs', 'downloads', 'download-pdfs'].includes(requestedFormat);
    const [uploadType, setUploadType] = useState(editType === 'audiobook' ? 'audiobook' : 'book'); // 'book' | 'audiobook'
    const [bookFormat, setBookFormat] = useState(shouldStartInPdfMode ? 'pdf' : 'epub'); // 'epub' | 'pdf'

    useEffect(() => {
        if (editType === 'audiobook' && editId) {
            setUploadType('audiobook');
        } else if (editType === 'book' && editId) {
            setUploadType('book');
        }
    }, [editType, editId]);

    useEffect(() => {
        if (editId || !shouldStartInPdfMode) return;
        setUploadType('book');
        setBookFormat('pdf');
    }, [editId, shouldStartInPdfMode]);
    
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        year: '',
        description: '',
        category: '',
        era: '',
        language: 'English',
        pages: '',
        is_official: true,
    });
    
    const [epubFile, setEpubFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [epubPreview, setEpubPreview] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    
    const [saving, setSaving] = useState(false);
    const [uploadStep, setUploadStep] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loadingBook, setLoadingBook] = useState(false);
    const [existingBook, setExistingBook] = useState(null);
    const [removeExistingPdf, setRemoveExistingPdf] = useState(false);
    const [removeExistingCover, setRemoveExistingCover] = useState(false);

    // Text edition (markdown sections for the PDF-less reader). Dirty flag
    // guards the PATCH so an untouched edition is never overwritten.
    const [textSections, setTextSections] = useState([]);
    const [textSource, setTextSource] = useState('manual');
    const [textEditionDirty, setTextEditionDirty] = useState(false);
    const isPdfOnlyUpload = !isEditingBook && uploadType === 'book' && !!pdfFile && !epubFile;
    const isPdfBookForm = uploadType === 'book' && (bookFormat === 'pdf' || isPdfOnlyUpload);
    const hasEpubAttachment = !!epubFile || (isEditingBook && !!existingBook?.epub_filename);
    const hasPdfAttachment = !!pdfFile || (isEditingBook && !!existingBook?.pdf_filename && !removeExistingPdf);
    const hasTextEdition =
        (isEditingBook && !!existingBook?.text_edition?.sections?.length) ||
        (textEditionDirty && textSections.length > 0);
    const hasReadableFile = hasEpubAttachment || hasPdfAttachment || hasTextEdition;
    const shouldShowPages = isPdfBookForm || hasPdfAttachment;
    const canSubmitBook = !!formData.title.trim() && (
        isEditingBook
            ? hasReadableFile
            : isPdfBookForm
                ? !!pdfFile
                : !!epubFile
    );

    // Manage existing books
    const [existingBooks, setExistingBooks] = useState([]);
    const [existingAudiobooks, setExistingAudiobooks] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const fetchExistingItems = useCallback(async () => {
        setLoadingExisting(true);
        try {
            const [booksRes, audiobooksRes] = await Promise.all([
                supabase.from('digital_library_books').select('id, title, author, year, epub_filename, pdf_filename, cover_image_url').order('title'),
                supabase.from('audiobooks').select('id, title, author, audio_url, cover_url').order('title'),
            ]);
            if (booksRes.error) throw booksRes.error;
            if (audiobooksRes.error) throw audiobooksRes.error;
            setExistingBooks(booksRes.data || []);
            setExistingAudiobooks(audiobooksRes.data || []);
        } catch (err) {
            console.error('[Manage] Error fetching existing items:', err);
        } finally {
            setLoadingExisting(false);
        }
    }, []);

    useEffect(() => {
        if (showManage) fetchExistingItems();
    }, [showManage, fetchExistingItems]);

    useEffect(() => {
        if (!isEditingBook) return;

        const fetchBookForEditing = async () => {
            setLoadingBook(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('digital_library_books')
                    .select('id, title, author, year, description, category, era, language, pages, is_official, epub_filename, pdf_filename, cover_image_url, text_edition')
                    .eq('id', editId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error('Book not found.');

                setExistingBook(data);
                setBookFormat(data.epub_filename ? 'epub' : 'pdf');
                setTextSections(data.text_edition?.sections || []);
                setTextSource(data.text_edition?.source || 'manual');
                setTextEditionDirty(false);
                setFormData({
                    title: data.title || '',
                    author: data.author || '',
                    year: data.year || '',
                    description: data.description || '',
                    category: data.category || '',
                    era: data.era || '',
                    language: data.language || 'English',
                    pages: data.pages || '',
                    is_official: data.is_official !== false,
                });
                setEpubPreview(data.epub_filename ? getFilenameFromStoragePath(data.epub_filename) : null);
                setPdfPreview(data.pdf_filename ? getFilenameFromStoragePath(data.pdf_filename) : null);
                setCoverPreview(data.cover_image_url || null);
                setRemoveExistingPdf(false);
                setRemoveExistingCover(false);
            } catch (err) {
                console.error('[Edit] Error fetching book:', err);
                setError(err.message || 'Failed to load book for editing.');
            } finally {
                setLoadingBook(false);
            }
        };

        fetchBookForEditing();
    }, [isEditingBook, editId]);

    const handleDeleteBook = async (book) => {
        if (!window.confirm(`Delete "${book.title}"? This will remove the database entry and all associated files. This cannot be undone.`)) return;
        setDeleting(book.id);
        try {
            const filesToRemove = [book.epub_filename, book.pdf_filename].filter(Boolean);
            if (filesToRemove.length > 0) {
                await supabase.storage.from('library').remove(filesToRemove);
            }
            if (book.cover_image_url) {
                const coverPath = getCoverStoragePath(book.cover_image_url);
                if (coverPath) await supabase.storage.from('covers').remove([coverPath]);
            }
            const { error: dbErr } = await supabase.from('digital_library_books').delete().eq('id', book.id);
            if (dbErr) throw dbErr;
            setExistingBooks(prev => prev.filter(b => b.id !== book.id));
        } catch (err) {
            console.error('[Manage] Delete error:', err);
            setError(`Failed to delete "${book.title}": ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    const handleDeleteAudiobook = async (ab) => {
        if (!window.confirm(`Delete audiobook "${ab.title}"? This cannot be undone.`)) return;
        setDeleting(ab.id);
        try {
            if (ab.audio_url && ab.audio_url.includes('/audiobooks/')) {
                const audioPath = ab.audio_url.split('/audiobooks/').pop();
                if (audioPath) await supabase.storage.from('audiobooks').remove([decodeURIComponent(audioPath)]);
            }
            if (ab.cover_url && ab.cover_url.includes('/audiobooks/')) {
                const coverPath = ab.cover_url.split('/audiobooks/').pop();
                if (coverPath) await supabase.storage.from('audiobooks').remove([decodeURIComponent(coverPath)]);
            }
            const { error: dbErr } = await supabase.from('audiobooks').delete().eq('id', ab.id);
            if (dbErr) throw dbErr;
            setExistingAudiobooks(prev => prev.filter(a => a.id !== ab.id));
        } catch (err) {
            console.error('[Manage] Audiobook delete error:', err);
            setError(`Failed to delete "${ab.title}": ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUploadChoice = (choice) => {
        if (choice === 'audiobook') {
            setUploadType('audiobook');
            setError(null);
            return;
        }

        setUploadType('book');
        setBookFormat(choice);
        if (choice === 'pdf') {
            setEpubFile(null);
            setEpubPreview(null);
        }
        setError(null);
    };

    const handleEpubUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.name.endsWith('.epub') && file.type !== 'application/epub+zip') {
            setError('Please upload an EPUB file');
            return;
        }
        
        setEpubFile(file);
        setEpubPreview(file.name);
        setError(null);
    }, []);

    const handlePdfUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }
        
        setPdfFile(file);
        setPdfPreview(file.name);
        setRemoveExistingPdf(false);
        if (!isEditingBook && uploadType === 'book' && bookFormat !== 'pdf' && !epubFile) {
            setBookFormat('pdf');
        }
        setError(null);
    }, [bookFormat, epubFile, isEditingBook, uploadType]);

    const handleCoverUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }
        
        setCoverFile(file);
        setRemoveExistingCover(false);
        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverPreview(event.target?.result);
        };
        reader.readAsDataURL(file);
        setError(null);
    }, []);

    const removeEpub = () => {
        if (isEditingBook) return;
        setEpubFile(null);
        setEpubPreview(null);
    };

    const removePdf = () => {
        if (pdfFile) {
            setPdfFile(null);
            setPdfPreview(existingBook?.pdf_filename && !removeExistingPdf ? getFilenameFromStoragePath(existingBook.pdf_filename) : null);
            if (!existingBook?.pdf_filename || removeExistingPdf) {
                setFormData(prev => ({ ...prev, pages: '' }));
            }
            return;
        }

        if (isEditingBook && existingBook?.pdf_filename && !removeExistingPdf) {
            setRemoveExistingPdf(true);
            setPdfPreview(null);
            setFormData(prev => ({ ...prev, pages: '' }));
            return;
        }

        setPdfFile(null);
        setPdfPreview(null);
        setFormData(prev => ({ ...prev, pages: '' }));
    };

    const removeCover = () => {
        if (coverFile) {
            setCoverFile(null);
            setCoverPreview(existingBook?.cover_image_url && !removeExistingCover ? existingBook.cover_image_url : null);
            return;
        }

        if (isEditingBook && existingBook?.cover_image_url && !removeExistingCover) {
            setRemoveExistingCover(true);
            setCoverPreview(null);
            return;
        }

        setCoverFile(null);
        setCoverPreview(null);
    };

    const generateFilename = (file, prefix) => {
        const timestamp = Date.now();
        const sanitizedTitle = sanitizeStorageSlug(formData.title);
        const extension = getSafeFileExtension(file.name);
        return `${prefix}-${sanitizedTitle}-${timestamp}.${extension}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        
        if (!isEditingBook && isPdfBookForm && !pdfFile) {
            setError('PDF file is required for PDF books');
            return;
        }

        if (!isEditingBook && !isPdfBookForm && !epubFile) {
            setError('EPUB file is required');
            return;
        }

        if (isEditingBook && !hasReadableFile) {
            setError('A readable EPUB, PDF or text edition is required');
            return;
        }

        setSaving(true);
        setError(null);
        setUploadStep('');

        const withTimeout = (promise, ms, label) =>
            Promise.race([
                promise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — try refreshing the page and re-uploading`)), ms)
                ),
            ]);

        const timeoutForFile = (file, base = 60000) => {
            if (!file) return base;
            const sizeMB = file.size / (1024 * 1024);
            return Math.max(base, sizeMB * 5000);
        };

        try {
            setUploadStep('Preparing upload...');

            // Upload EPUB to library bucket for new EPUB books. Existing books keep their reader file.
            let epubFilename = existingBook?.epub_filename || null;
            if (!isEditingBook && epubFile) {
                const sizeMB = (epubFile.size / (1024 * 1024)).toFixed(1);
                setUploadStep(`Uploading EPUB (${sizeMB} MB)...`);
                console.log('[Upload] Starting EPUB upload...', sizeMB, 'MB');
                epubFilename = generateFilename(epubFile, 'epub');
                const { error: epubError } = await withTimeout(
                    uploadWithSignedUrl('library', epubFilename, epubFile),
                    timeoutForFile(epubFile, 120000),
                    'EPUB upload'
                );

                if (epubError) throw new Error(`EPUB upload failed: ${epubError.message}`);
                console.log('[Upload] EPUB uploaded:', epubFilename);
            }

            // Upload PDF to library bucket. EPUB books can use it as a download; PDF books use it as the reader file.
            let pdfFilename = existingBook?.pdf_filename || null;
            let oldPdfToRemove = null;
            if (pdfFile) {
                const pdfSizeMB = (pdfFile.size / (1024 * 1024)).toFixed(1);
                setUploadStep(`Uploading PDF (${pdfSizeMB} MB)...`);
                console.log('[Upload] Starting PDF upload...', pdfSizeMB, 'MB');
                pdfFilename = generateFilename(pdfFile, 'pdf');
                const { error: pdfError } = await withTimeout(
                    uploadWithSignedUrl('library', pdfFilename, pdfFile),
                    timeoutForFile(pdfFile, 120000),
                    'PDF upload'
                );
                
                if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`);
                console.log('[Upload] PDF uploaded:', pdfFilename);
                if (isEditingBook && existingBook?.pdf_filename) {
                    oldPdfToRemove = existingBook.pdf_filename;
                }
            } else if (isEditingBook && removeExistingPdf && existingBook?.pdf_filename) {
                oldPdfToRemove = existingBook.pdf_filename;
                pdfFilename = null;
            }

            // Upload cover image if provided
            let coverImageUrl = existingBook?.cover_image_url || null;
            let oldCoverToRemove = null;
            if (coverFile) {
                setUploadStep('Uploading cover image...');
                console.log('[Upload] Starting cover upload...');
                const coverFilename = generateFilename(coverFile, 'cover');
                const { error: coverError } = await withTimeout(
                    uploadWithSignedUrl('covers', coverFilename, coverFile),
                    60000,
                    'Cover upload'
                );
                
                if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`);
                
                // Build public URL for cover directly
                coverImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${encodeURIComponent(coverFilename)}`;
                console.log('[Upload] Cover uploaded:', coverFilename);
                if (isEditingBook && existingBook?.cover_image_url) {
                    oldCoverToRemove = getCoverStoragePath(existingBook.cover_image_url);
                }
            } else if (isEditingBook && removeExistingCover && existingBook?.cover_image_url) {
                oldCoverToRemove = getCoverStoragePath(existingBook.cover_image_url);
                coverImageUrl = null;
            }

            const payload = {
                title: formData.title.trim(),
                author: formData.author.trim() || null,
                year: formData.year ? parseInt(formData.year) : null,
                description: formData.description.trim() || null,
                category: formData.category || null,
                era: formData.era || null,
                language: formData.language || null,
                pages: hasPdfAttachment && formData.pages ? parseInt(formData.pages) : null,
                pdf_filename: pdfFilename,
                cover_image_url: coverImageUrl,
                is_official: formData.is_official,
            };

            if (!isEditingBook) {
                payload.epub_filename = epubFilename;
            }

            if (isEditingBook && textEditionDirty) {
                payload.text_edition = textSections.length > 0 ? buildEdition(textSections, textSource) : null;
            }

            setUploadStep('Saving to database...');
            console.log(isEditingBook ? '[Edit] Updating database record...' : '[Upload] Inserting database record...');

            await withTimeout(
                saveLibraryBook({
                    isEditingBook,
                    editId,
                    book: payload,
                    removeExistingPdf: isEditingBook && !!oldPdfToRemove,
                    removeExistingCover: isEditingBook && !!oldCoverToRemove,
                }),
                15000,
                isEditingBook ? 'Database update' : 'Database insert'
            );
            console.log(isEditingBook ? '[Edit] Database record updated successfully' : '[Upload] Database record inserted successfully');

            setSuccess(true);
            setTimeout(() => {
                router.push('/digital-library');
            }, 1500);

        } catch (err) {
            console.error(isEditingBook ? '[Edit] Error:' : '[Upload] Error:', err);
            setError(err.message || (isEditingBook ? 'Failed to update book' : 'Failed to upload book'));
        } finally {
            setSaving(false);
            setUploadStep('');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/digital-library')}
                        className="p-2 hover:bg-gray-800 rounded-none transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{isEditingBook ? `Edit ${isPdfBookForm ? 'PDF Book' : 'Digital Book'}` : isPdfBookForm ? 'Upload to Downloads' : 'Upload to Digital Library'}</h1>
                        <p className="text-gray-400 text-sm">
                            {isEditingBook ? 'Update book information and reader files' : isPdfBookForm ? 'Add a PDF-only title to the Downloads library section' : 'Add a new EPUB book, PDF book, or audiobook to the library'}
                        </p>
                    </div>
                </div>

                {/* Upload Type Toggle */}
                {!editId && (
                    <div className="grid grid-cols-3 bg-gray-900 rounded-none p-1 mb-8 max-w-2xl mx-auto md:mx-0">
                        <button
                            type="button"
                            onClick={() => handleUploadChoice('epub')}
                            className={`py-2 px-3 text-sm font-medium rounded-none transition-colors flex items-center justify-center gap-2 ${uploadType === 'book' && bookFormat === 'epub' && !isPdfBookForm ? 'bg-gray-800 text-white border border-gray-700/50' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <BookOpen size={16} />
                            EPUB Book
                        </button>
                        <button
                            type="button"
                            onClick={() => handleUploadChoice('pdf')}
                            className={`py-2 px-3 text-sm font-medium rounded-none transition-colors flex items-center justify-center gap-2 ${uploadType === 'book' && isPdfBookForm ? 'bg-gray-800 text-white border border-gray-700/50' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <FileText size={16} />
                            Downloads
                        </button>
                        <button
                            type="button"
                            onClick={() => handleUploadChoice('audiobook')}
                            className={`py-2 px-3 text-sm font-medium rounded-none transition-colors flex items-center justify-center gap-2 ${uploadType === 'audiobook' ? 'bg-gray-800 text-white border border-gray-700/50' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Headphones size={16} />
                            Audiobook
                        </button>
                    </div>
                )}

                {uploadType === 'audiobook' ? (
                    <AudiobookUploadForm editId={editId} />
                ) : (
                    <>
                        {loadingBook && (
                            <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700/50 rounded-none flex items-center gap-3 text-gray-300">
                                <Loader2 className="animate-spin" size={18} />
                                <span>Loading book data...</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                    <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-none flex items-center gap-3">
                        <Check className="text-green-400" />
                        <span className="text-green-300">{isEditingBook ? 'Book updated successfully!' : 'Book uploaded successfully!'} Redirecting...</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-none flex items-center gap-3">
                        <AlertTriangle className="text-red-400" />
                        <span className="text-red-300">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Uploads */}
                    <div className={`grid grid-cols-1 ${isPdfBookForm ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                        {/* EPUB Upload (Required) */}
                        {!isPdfBookForm && (
                        <div className="bg-gray-900/50 rounded-none p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="text-red-500" size={20} />
                                EPUB File {!isEditingBook && '*'}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">
                                {isEditingBook ? 'Reader file is preserved when editing' : 'Required — this is what readers see in the app'}
                            </p>
                            
                            {epubPreview ? (
                                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-none">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <BookOpen size={18} className="text-red-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-300 truncate">{epubPreview}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeEpub}
                                        disabled={isEditingBook}
                                        className="p-1 text-gray-400 hover:text-red-400 disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                        title={isEditingBook ? 'EPUB replacement is not supported in edit mode' : 'Remove EPUB'}
                                        aria-label="Remove EPUB"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-700 rounded-none p-6 text-center hover:border-red-500/50 transition-colors">
                                    <input
                                        type="file"
                                        accept=".epub,application/epub+zip"
                                        onChange={handleEpubUpload}
                                        className="hidden"
                                        id="epub-upload"
                                    />
                                    <label htmlFor="epub-upload" className="cursor-pointer">
                                        <Upload className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                                        <p className="text-gray-400 text-sm">Click to upload EPUB</p>
                                    </label>
                                </div>
                            )}
                        </div>
                        )}

                        {/* PDF Upload */}
                        <div className="bg-gray-900/50 rounded-none p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                {isPdfBookForm ? (
                                    <FileText className="text-red-500" size={20} />
                                ) : (
                                    <Download className="text-gray-400" size={20} />
                                )}
                                {isPdfBookForm ? `PDF File ${!isEditingBook ? '*' : ''}` : 'PDF Download'}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">
                                {isPdfBookForm ? 'Required — this is the reader and download file for the Downloads section' : 'Optional — available as a download for users'}
                            </p>
                            
                            {pdfPreview ? (
                                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-none">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={18} className="text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-300 truncate">{pdfPreview}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removePdf}
                                        className="p-1 text-gray-400 hover:text-red-400"
                                        aria-label="Remove PDF"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-700 rounded-none p-6 text-center hover:border-gray-600 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handlePdfUpload}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label htmlFor="pdf-upload" className="cursor-pointer">
                                        <Upload className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                                        <p className="text-gray-500 text-sm">Click to upload PDF</p>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Cover Image Upload */}
                        <div className="bg-gray-900/50 rounded-none p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Image className="text-red-500" size={20} />
                                Cover Image
                            </h3>
                            
                            {coverPreview ? (
                                <div className="relative">
                                    <img 
                                        src={coverPreview} 
                                        alt="Cover preview" 
                                        className="w-full h-48 object-contain bg-gray-800 rounded-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeCover}
                                        className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full text-gray-400 hover:text-red-400"
                                        aria-label="Remove cover"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-700 rounded-none p-6 text-center hover:border-red-500/50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <label htmlFor="cover-upload" className="cursor-pointer">
                                        <Upload className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                                        <p className="text-gray-400 text-sm">Click to upload cover</p>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Form */}
                    <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Book Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Capital Volume I"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Author</label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Karl Marx"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    min="1400"
                                    max="2100"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    placeholder="e.g., 1867"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Select category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Era</label>
                                <select
                                    name="era"
                                    value={formData.era}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Select era</option>
                                    {ERAS.map(era => (
                                        <option key={era} value={era}>{era}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Language</label>
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {shouldShowPages && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">PDF Pages</label>
                                    <input
                                        type="number"
                                        name="pages"
                                        value={formData.pages}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                        placeholder="e.g., 500"
                                    />
                                </div>
                            )}
                            
                            <div className="md:col-span-2 flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_official"
                                        checked={formData.is_official}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_official: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                                </label>
                                <span className="text-sm text-gray-300">Official Library Book</span>
                                <span className="text-xs text-gray-500">(uncheck for community uploads)</span>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-y"
                                    placeholder="Brief description of the book..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text Edition (markdown sections for the reader) */}
                    {isEditingBook && !existingBook?.epub_filename && (
                        <TextEditionPanel
                            sections={textSections}
                            source={textSource}
                            onSectionsChange={setTextSections}
                            onSourceChange={setTextSource}
                            onDirty={setTextEditionDirty}
                            pdfFile={pdfFile}
                            pdfUrl={
                                existingBook?.pdf_filename
                                    ? supabase.storage.from('library').getPublicUrl(existingBook.pdf_filename).data?.publicUrl
                                    : null
                            }
                        />
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={saving || loadingBook || !canSubmitBook}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-none font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                {uploadStep || (isEditingBook ? 'Saving...' : 'Uploading...')}
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditingBook ? 'Save Changes' : isPdfBookForm ? 'Upload PDF' : 'Upload Book'}
                            </>
                        )}
                    </button>
                    {isEditingBook && (
                        <button
                            type="button"
                            onClick={() => router.push('/digital-library')}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-none font-medium transition-colors text-gray-300"
                        >
                            Cancel
                        </button>
                    )}
                </form>
                </>
                )}

                {/* ===== Manage Existing Library Items ===== */}
                <div className="mt-12 border-t border-gray-800 pt-8">
                    <button
                        onClick={() => setShowManage(prev => !prev)}
                        className="flex items-center gap-3 text-lg font-semibold text-gray-300 hover:text-white transition-colors w-full"
                    >
                        <Trash2 size={20} className="text-red-500" />
                        Manage Library
                        {showManage ? <ChevronUp size={18} className="ml-auto" /> : <ChevronDown size={18} className="ml-auto" />}
                    </button>

                    {showManage && (
                        <div className="mt-6 space-y-8">
                            {loadingExisting && (
                                <div className="flex items-center gap-3 text-gray-400 py-4">
                                    <Loader2 className="animate-spin" size={18} />
                                    Loading library items...
                                </div>
                            )}

                            {/* Books */}
                            {!loadingExisting && (
                                <div>
                                    <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                        <BookOpen size={18} className="text-red-500" />
                                        Digital Books ({existingBooks.length})
                                    </h3>
                                    {existingBooks.length === 0 ? (
                                        <p className="text-sm text-gray-500 py-3">No books in library.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {existingBooks.map(book => (
                                                <div
                                                    key={book.id}
                                                    className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-none px-4 py-3 group"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-white truncate">{book.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {book.epub_filename ? 'EPUB book' : book.pdf_filename ? 'PDF book' : 'No reader file'} - {book.author || 'Unknown author'}{book.year ? ` • ${book.year}` : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(`/admin/library/upload?edit=book&id=${book.id}`)}
                                                        className="ml-4 flex items-center gap-2 px-3 py-1.5 text-sm rounded-none text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors flex-shrink-0"
                                                    >
                                                        <Pencil size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBook(book)}
                                                        disabled={deleting === book.id}
                                                        className="ml-4 flex items-center gap-2 px-3 py-1.5 text-sm rounded-none text-gray-400 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors flex-shrink-0"
                                                    >
                                                        {deleting === book.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audiobooks */}
                            {!loadingExisting && (
                                <div>
                                    <h3 className="text-md font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                        <Headphones size={18} className="text-purple-400" />
                                        Audiobooks ({existingAudiobooks.length})
                                    </h3>
                                    {existingAudiobooks.length === 0 ? (
                                        <p className="text-sm text-gray-500 py-3">No audiobooks in library.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {existingAudiobooks.map(ab => (
                                                <div
                                                    key={ab.id}
                                                    className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-none px-4 py-3 group"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-white truncate">{ab.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {ab.author || 'Unknown author'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAudiobook(ab)}
                                                        disabled={deleting === ab.id}
                                                        className="ml-4 flex items-center gap-2 px-3 py-1.5 text-sm rounded-none text-gray-400 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors flex-shrink-0"
                                                    >
                                                        {deleting === ab.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryUploadPage;
