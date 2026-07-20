import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Eye,
    FileText,
    Image as ImageIcon,
    Loader2,
    Pencil,
    Save,
    Trash2,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_OPTIONS = ['analysis', 'movements', 'international', 'theory', 'economy', 'culture'];
const DIGEST_OPTIONS = ['world', 'floral'];
const PLACEMENT_OPTIONS = ['lead', 'side', 'bulletin', 'late_edition'];
const STATUS_OPTIONS = ['draft', 'published', 'archived'];
const AUTOSAVE_STORAGE_PREFIX = 'politics-upload';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const slugify = (input) =>
    `${input || ''}`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 96);

const buildSlugSuggestion = (candidateSlug) => `${candidateSlug}-${Date.now().toString().slice(-4)}`;

const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 16);
};

const toIsoDateTime = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
};

const formatAutosaveTime = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const hasDraftContent = (formValue) =>
    Boolean(
        `${formValue?.title || ''}`.trim() ||
            `${formValue?.excerpt || ''}`.trim() ||
            `${formValue?.content || ''}`.trim() ||
            `${formValue?.slug || ''}`.trim()
    );

const buildAutosaveKey = (articleId = null) => `${AUTOSAVE_STORAGE_PREFIX}:${articleId || 'new'}`;

const readAutosaveDraft = (autosaveKey) => {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
        const raw = window.localStorage.getItem(autosaveKey);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.formData) {
            return null;
        }

        return parsed;
    } catch (_error) {
        return null;
    }
};

const isValidCalendarDate = (value) => {
    if (!value || !validDatePattern.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === value;
};

const writeAutosaveDraft = (autosaveKey, payload) => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
        window.localStorage.setItem(autosaveKey, JSON.stringify(payload));
    } catch (_error) {
        // Silent fail for storage quota/privacy mode restrictions.
    }
};

const clearAutosaveDraft = (autosaveKey) => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
        window.localStorage.removeItem(autosaveKey);
    } catch (_error) {
        // Silent fail for restricted storage environments.
    }
};

const createFormSnapshot = (formValue = {}) => ({
    id: formValue.id || null,
    title: formValue.title || '',
    slug: formValue.slug || '',
    excerpt: formValue.excerpt || '',
    content: formValue.content || '',
    category: formValue.category || 'analysis',
    digest_type: formValue.digest_type || 'world',
    source: formValue.source || '',
    image_url: formValue.image_url || '',
    placement: formValue.placement || 'side',
    edition_date: formValue.edition_date || '',
    status: formValue.status || 'draft',
    published_at: toDateTimeLocalValue(formValue.published_at),
});

const emptyForm = {
    id: null,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'analysis',
    digest_type: 'world',
    source: 'Editorial Desk',
    image_url: '',
    placement: 'side',
    edition_date: new Date().toISOString().slice(0, 10),
    status: 'draft',
    published_at: '',
};

const getFitInfo = (value, ideal, warningCeiling) => {
    const length = `${value || ''}`.trim().length;

    if (!length) {
        return {
            tone: 'neutral',
            text: `0 characters (target up to ${ideal})`,
        };
    }

    if (length <= ideal) {
        return {
            tone: 'good',
            text: `${length} characters (fits well)`,
        };
    }

    if (length <= warningCeiling) {
        return {
            tone: 'warn',
            text: `${length} characters (may wrap in newspaper cards)`,
        };
    }

    return {
        tone: 'danger',
        text: `${length} characters (likely overflow, shorten recommended)`,
    };
};

const fitToneClassName = {
    neutral: 'text-gray-400',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    danger: 'text-red-400',
};

const getDispatchStatusMeta = (article) => {
    const normalizedStatus = `${article?.status || 'draft'}`.toLowerCase();

    if (normalizedStatus === 'published') {
        const parsedPublishTime = new Date(article?.published_at || '');
        const isFutureScheduled =
            !Number.isNaN(parsedPublishTime.getTime()) && parsedPublishTime.getTime() > Date.now();

        if (isFutureScheduled) {
            return {
                label: 'scheduled',
                detail: formatDateTime(article.published_at),
                className: 'text-amber-300',
            };
        }

        return {
            label: 'published',
            detail: article?.published_at ? formatDateTime(article.published_at) : '',
            className: 'text-emerald-300',
        };
    }

    if (normalizedStatus === 'archived') {
        return {
            label: 'archived',
            detail: '',
            className: 'text-gray-300',
        };
    }

    return {
        label: 'draft',
        detail: '',
        className: 'text-sky-300',
    };
};

const PoliticsUploadPage = () => {
    const router = useRouter();
    const { user, canManagePolitics } = useAuth();
    const canEditPolitics = canManagePolitics();

    const [formData, setFormData] = useState(emptyForm);
    const [slugTouched, setSlugTouched] = useState(false);
    const [savedFormSnapshot, setSavedFormSnapshot] = useState(createFormSnapshot(emptyForm));

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [articles, setArticles] = useState([]);
    const [isLoadingArticles, setIsLoadingArticles] = useState(true);

    const [saving, setSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [listSearchQuery, setListSearchQuery] = useState('');
    const [listStatusFilter, setListStatusFilter] = useState('all');
    const [listPlacementFilter, setListPlacementFilter] = useState('all');

    const [slugCheckStatus, setSlugCheckStatus] = useState('idle');
    const [slugCheckMessage, setSlugCheckMessage] = useState('');
    const [slugSuggestion, setSlugSuggestion] = useState('');
    const [autosaveRecovery, setAutosaveRecovery] = useState(null);
    const [lastAutosaveAt, setLastAutosaveAt] = useState('');

    const slugCheckRequestRef = useRef(0);

    const titleFit = useMemo(() => getFitInfo(formData.title, 72, 96), [formData.title]);
    const excerptFit = useMemo(() => getFitInfo(formData.excerpt, 180, 260), [formData.excerpt]);

    const filteredArticles = useMemo(() => {
        const query = listSearchQuery.trim().toLowerCase();

        return (articles || []).filter((article) => {
            if (listStatusFilter !== 'all' && (article.status || 'draft') !== listStatusFilter) {
                return false;
            }

            if (listPlacementFilter !== 'all' && (article.placement || 'side') !== listPlacementFilter) {
                return false;
            }

            if (!query) return true;

            const haystack = [article.title, article.slug, article.excerpt, article.category, article.source]
                .map((value) => `${value || ''}`.toLowerCase())
                .join(' ');

            return haystack.includes(query);
        });
    }, [articles, listPlacementFilter, listSearchQuery, listStatusFilter]);

    const hasUnsavedFormChanges = useMemo(() => {
        const currentSnapshot = createFormSnapshot(formData);
        const savedSnapshot = savedFormSnapshot;
        return JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot) || Boolean(imageFile);
    }, [formData, imageFile, savedFormSnapshot]);

    const currentAutosaveKey = useMemo(() => buildAutosaveKey(formData.id), [formData.id]);

    const normalizedPublishedAt = useMemo(() => toIsoDateTime(formData.published_at), [formData.published_at]);
    const hasInvalidPublishDate = Boolean(formData.published_at) && !normalizedPublishedAt;
    const isFutureScheduledPublish =
        formData.status === 'published' &&
        Boolean(normalizedPublishedAt) &&
        new Date(normalizedPublishedAt).getTime() > Date.now();

    useEffect(() => {
        if (canEditPolitics) {
            return;
        }
        router.replace('/coming-soon');
    }, [canEditPolitics, router]);

    useEffect(() => {
        if (slugTouched) return;
        setFormData((prev) => ({
            ...prev,
            slug: slugify(prev.title),
        }));
    }, [formData.title, slugTouched]);

    useEffect(() => {
        if (!hasUnsavedFormChanges) return undefined;

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedFormChanges]);

    useEffect(() => {
        const fetchArticles = async () => {
            setIsLoadingArticles(true);

            try {
                const { data, error: fetchError } = await supabase
                    .from('politics_articles')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (fetchError) throw fetchError;
                setArticles(data || []);
            } catch (err) {
                console.error('Error fetching politics articles:', err);
                setError(err.message || 'Failed to load recent dispatches.');
                setArticles([]);
            } finally {
                setIsLoadingArticles(false);
            }
        };

        fetchArticles();
    }, []);

    useEffect(() => {
        const persistedDraft = readAutosaveDraft(currentAutosaveKey);
        if (!persistedDraft?.formData) {
            setAutosaveRecovery(null);
            return;
        }

        const recoveredSnapshot = createFormSnapshot(persistedDraft.formData);
        const hasMeaningfulDraft = hasDraftContent(recoveredSnapshot);
        const isSameAsSaved = JSON.stringify(recoveredSnapshot) === JSON.stringify(savedFormSnapshot);

        if (!hasMeaningfulDraft || isSameAsSaved) {
            clearAutosaveDraft(currentAutosaveKey);
            setAutosaveRecovery(null);
            return;
        }

        setAutosaveRecovery({
            formData: recoveredSnapshot,
            savedAt: persistedDraft.savedAt || '',
        });
    }, [currentAutosaveKey, savedFormSnapshot]);

    useEffect(() => {
        if (!hasUnsavedFormChanges || !hasDraftContent(formData)) {
            return undefined;
        }

        if (typeof window === 'undefined') {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            const savedAt = new Date().toISOString();
            writeAutosaveDraft(currentAutosaveKey, {
                formData: createFormSnapshot(formData),
                savedAt,
            });
            setLastAutosaveAt(savedAt);
        }, 900);

        return () => window.clearTimeout(timeoutId);
    }, [currentAutosaveKey, formData, hasUnsavedFormChanges]);

    useEffect(() => {
        const canonicalSlug = slugify(formData.slug || formData.title);

        if (!canonicalSlug) {
            setSlugCheckStatus('idle');
            setSlugCheckMessage('');
            setSlugSuggestion('');
            return undefined;
        }

        const requestId = slugCheckRequestRef.current + 1;
        slugCheckRequestRef.current = requestId;

        setSlugCheckStatus('checking');
        setSlugCheckMessage('Checking slug availability...');
        setSlugSuggestion('');

        const timeoutId = window.setTimeout(async () => {
            let query = supabase
                .from('politics_articles')
                .select('id')
                .eq('slug', canonicalSlug)
                .limit(1);

            if (formData.id) {
                query = query.neq('id', formData.id);
            }

            const { data, error: slugLookupError } = await query.maybeSingle();

            if (requestId !== slugCheckRequestRef.current) {
                return;
            }

            if (slugLookupError && slugLookupError.code !== 'PGRST116') {
                setSlugCheckStatus('error');
                setSlugCheckMessage('Could not validate slug right now. Save will still re-check.');
                return;
            }

            if (data) {
                const suggestion = buildSlugSuggestion(canonicalSlug);
                setSlugCheckStatus('taken');
                setSlugCheckMessage('Slug already exists. Use the suggested one or edit manually.');
                setSlugSuggestion(suggestion);
                return;
            }

            setSlugCheckStatus('available');
            setSlugCheckMessage('Slug is available.');
        }, 500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [formData.id, formData.slug, formData.title]);

    const resetForm = () => {
        const clearedForm = {
            ...emptyForm,
            edition_date: new Date().toISOString().slice(0, 10),
        };

        clearAutosaveDraft(currentAutosaveKey);

        setFormData(clearedForm);
        setSavedFormSnapshot(createFormSnapshot(clearedForm));
        setSlugTouched(false);
        setImageFile(null);
        setImagePreview('');
        setAutosaveRecovery(null);
        setLastAutosaveAt('');
        setSlugCheckStatus('idle');
        setSlugCheckMessage('');
        setSlugSuggestion('');
    };

    const restoreAutosavedDraft = () => {
        if (!autosaveRecovery?.formData) return;

        setFormData(autosaveRecovery.formData);
        setSlugTouched(Boolean(autosaveRecovery.formData.slug));
        setAutosaveRecovery(null);
        setLastAutosaveAt(autosaveRecovery.savedAt || '');
    };

    const dismissAutosavedDraft = () => {
        clearAutosaveDraft(currentAutosaveKey);
        setAutosaveRecovery(null);
    };

    const useSuggestedSlug = () => {
        if (!slugSuggestion) return;
        setSlugTouched(true);
        setFormData((prev) => ({
            ...prev,
            slug: slugSuggestion,
        }));
    };

    const navigateBackToPolitics = () => {
        if (hasUnsavedFormChanges) {
            const shouldLeave = window.confirm('You have unsaved editor changes. Leave this page anyway?');
            if (!shouldLeave) return;
        }
        router.push('/politics');
    };

    const refreshArticles = async () => {
        const { data, error: fetchError } = await supabase
            .from('politics_articles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (fetchError) throw fetchError;
        setArticles(data || []);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSlugChange = (event) => {
        setSlugTouched(true);
        setFormData((prev) => ({
            ...prev,
            slug: slugify(event.target.value),
        }));
        setSlugCheckStatus('idle');
        setSlugCheckMessage('');
        setSlugSuggestion('');
    };

    const handleImageSelection = (event) => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        if (!selected.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            return;
        }

        setImageFile(selected);
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setImagePreview(loadEvent.target?.result || '');
        };
        reader.readAsDataURL(selected);
        setError('');
    };

    const uploadImageIfNeeded = async () => {
        if (!imageFile) return formData.image_url || null;

        const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const baseSlug = slugify(formData.slug || formData.title || `dispatch-${Date.now()}`) || `dispatch-${Date.now()}`;
        const filename = `${baseSlug}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
            .from('politics-images')
            .upload(filename, imageFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('politics-images')
            .getPublicUrl(filename);

        return urlData?.publicUrl || null;
    };

    const buildPayload = (resolvedImageUrl) => {
        const editorId = uuidRegex.test(user?.id || '') ? user.id : null;
        const nextStatus = formData.status;
        const normalizedPublishedAt = toIsoDateTime(formData.published_at);

        return {
            slug: slugify(formData.slug || formData.title),
            title: formData.title.trim(),
            excerpt: formData.excerpt.trim() || null,
            content: formData.content.trim() || null,
            category: formData.category || null,
            digest_type: formData.digest_type || null,
            source: formData.source.trim() || null,
            image_url: resolvedImageUrl || null,
            placement: formData.placement || null,
            edition_date: formData.edition_date || null,
            status: nextStatus,
            published_at:
                nextStatus === 'published'
                    ? normalizedPublishedAt || new Date().toISOString()
                    : null,
            updated_by: editorId,
        };
    };

    const ensureUniqueSlug = async (candidateSlug) => {
        let query = supabase
            .from('politics_articles')
            .select('id')
            .eq('slug', candidateSlug)
            .limit(1);

        if (formData.id) {
            query = query.neq('id', formData.id);
        }

        const { data, error: slugLookupError } = await query.maybeSingle();

        if (slugLookupError && slugLookupError.code !== 'PGRST116') {
            throw slugLookupError;
        }

        if (!data) return candidateSlug;

        const suggestedSlug = buildSlugSuggestion(candidateSlug);
        setFormData((prev) => ({
            ...prev,
            slug: suggestedSlug,
        }));

        const slugExistsError = new Error('This slug is already in use. We suggested a new slug; please review and save again.');
        slugExistsError.code = 'SLUG_EXISTS';
        throw slugExistsError;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title.trim()) {
            setError('Title is required.');
            return;
        }

        if (!slugify(formData.slug || formData.title)) {
            setError('A valid slug is required.');
            return;
        }

        if (formData.edition_date && !isValidCalendarDate(formData.edition_date)) {
            setError('Edition date must be a valid calendar date.');
            return;
        }

        if (hasInvalidPublishDate) {
            setError('Publish datetime is invalid. Please use a valid date and time.');
            return;
        }

        setSaving(true);

        try {
            const canonicalSlug = slugify(formData.slug || formData.title);
            await ensureUniqueSlug(canonicalSlug);

            const imageUrl = await uploadImageIfNeeded();
            const payload = buildPayload(imageUrl);

            if (formData.id) {
                const { error: updateError } = await supabase
                    .from('politics_articles')
                    .update(payload)
                    .eq('id', formData.id);

                if (updateError) throw updateError;
                setSuccess('Dispatch updated successfully.');
            } else {
                const editorId = uuidRegex.test(user?.id || '') ? user.id : null;
                const { error: insertError } = await supabase
                    .from('politics_articles')
                    .insert({
                        ...payload,
                        created_by: editorId,
                    });

                if (insertError) throw insertError;
                setSuccess('Dispatch created successfully.');
            }

            await refreshArticles();
            resetForm();
        } catch (err) {
            const duplicateSlugFromDatabase =
                err?.code === '23505' || `${err?.message || ''}`.toLowerCase().includes('duplicate key value');

            if (err?.code === 'SLUG_EXISTS') {
                setError(err.message);
            } else if (duplicateSlugFromDatabase) {
                setError('This slug is already in use. Please choose a unique slug.');
            } else {
                console.error('Error saving dispatch:', err);
                setError(err.message || 'Failed to save dispatch.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (article) => {
        const nextForm = {
            id: article.id,
            title: article.title || '',
            slug: article.slug || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            category: article.category || 'analysis',
            digest_type: article.digest_type || 'world',
            source: article.source || 'Editorial Desk',
            image_url: article.image_url || '',
            placement: article.placement || 'side',
            edition_date: article.edition_date || new Date().toISOString().slice(0, 10),
            status: article.status || 'draft',
            published_at: toDateTimeLocalValue(article.published_at),
        };

        setFormData(nextForm);
        setSavedFormSnapshot(createFormSnapshot(nextForm));

        setSlugTouched(true);
        setImageFile(null);
        setImagePreview(article.image_url || '');
        setSuccess('');
        setError('');
        setAutosaveRecovery(null);
        setLastAutosaveAt('');
        setSlugCheckStatus('idle');
        setSlugCheckMessage('');
        setSlugSuggestion('');

        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (_scrollError) {
            // No-op for non-browser environments (e.g., jsdom tests).
        }
    };

    const handleDelete = async (articleId) => {
        if (!window.confirm('Delete this dispatch permanently?')) return;

        setIsDeleting(true);
        setError('');
        setSuccess('');

        try {
            const { error: deleteError } = await supabase
                .from('politics_articles')
                .delete()
                .eq('id', articleId);

            if (deleteError) throw deleteError;

            clearAutosaveDraft(buildAutosaveKey(articleId));

            if (formData.id === articleId) {
                resetForm();
            }

            await refreshArticles();
            setSuccess('Dispatch deleted successfully.');
        } catch (err) {
            console.error('Error deleting dispatch:', err);
            setError(err.message || 'Failed to delete dispatch.');
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePublishStatus = async (article) => {
        const nextStatus = article.status === 'published' ? 'draft' : 'published';

        setError('');
        setSuccess('');

        try {
            const { error: updateError } = await supabase
                .from('politics_articles')
                .update({
                    status: nextStatus,
                    published_at: nextStatus === 'published' ? new Date().toISOString() : null,
                })
                .eq('id', article.id);

            if (updateError) throw updateError;

            await refreshArticles();
            setSuccess(`Dispatch moved to ${nextStatus}.`);
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.message || 'Failed to update dispatch status.');
        }
    };

    return (
        <div className="min-h-screen bg-[#12131A] text-white px-4 py-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
                <section className="lg:col-span-3 bg-[#181A23] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={navigateBackToPolitics}
                            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                            aria-label="Back to politics page"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Politics Dispatch Editor</h1>
                            <p className="text-gray-400 text-sm">Create, edit, publish, and delete daily newspaper stories.</p>
                        </div>
                    </div>

                    {success && (
                        <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300 text-sm">
                            <Check size={16} />
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/40 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {autosaveRecovery && (
                        <div className="mb-4 p-3 bg-sky-900/30 border border-sky-500/30 rounded-lg text-sky-200 text-sm">
                            <p>
                                Found an autosaved draft
                                {autosaveRecovery.savedAt ? ` from ${formatAutosaveTime(autosaveRecovery.savedAt)}` : ''}.
                            </p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={restoreAutosavedDraft}
                                    className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs"
                                >
                                    Restore draft
                                </button>
                                <button
                                    type="button"
                                    onClick={dismissAutosavedDraft}
                                    className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-xs"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                placeholder="Front-page headline"
                                required
                            />
                            <p className={`text-xs mt-1 ${fitToneClassName[titleFit.tone]}`}>{titleFit.text}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Slug *</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleSlugChange}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                                placeholder="headline-slug"
                                required
                            />

                            {slugCheckMessage && (
                                <p
                                    className={`text-xs mt-1 ${
                                        slugCheckStatus === 'taken'
                                            ? 'text-amber-300'
                                            : slugCheckStatus === 'available'
                                                ? 'text-emerald-300'
                                                : slugCheckStatus === 'error'
                                                    ? 'text-red-300'
                                                    : 'text-gray-400'
                                    }`}
                                >
                                    {slugCheckMessage}
                                </p>
                            )}

                            {slugCheckStatus === 'taken' && slugSuggestion && (
                                <button
                                    type="button"
                                    onClick={useSuggestedSlug}
                                    className="mt-1 inline-flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100"
                                >
                                    Use suggested slug: <span className="font-mono">{slugSuggestion}</span>
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Excerpt</label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white resize-y"
                                placeholder="Short summary used in the newspaper cards"
                            />
                            <p className={`text-xs mt-1 ${fitToneClassName[excerptFit.tone]}`}>{excerptFit.text}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Body</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={12}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white resize-y"
                                placeholder="Full dispatch text (Markdown supported in reader page)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Digest Type</label>
                                <select
                                    name="digest_type"
                                    value={formData.digest_type}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {DIGEST_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Placement</label>
                                <select
                                    name="placement"
                                    value={formData.placement}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {PLACEMENT_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Publish At (optional)</label>
                                <input
                                    type="datetime-local"
                                    name="published_at"
                                    value={formData.published_at || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />

                                {hasInvalidPublishDate && (
                                    <p className="text-xs mt-1 text-red-300">Publish datetime is invalid.</p>
                                )}

                                {!hasInvalidPublishDate && isFutureScheduledPublish && (
                                    <p className="text-xs mt-1 text-amber-300">
                                        Scheduled for publication at {formatDateTime(normalizedPublishedAt)}.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Edition Date</label>
                                <input
                                    type="date"
                                    name="edition_date"
                                    value={formData.edition_date || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Source</label>
                                <input
                                    type="text"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Image URL (optional)</label>
                            <input
                                type="url"
                                name="image_url"
                                value={formData.image_url || ''}
                                onChange={handleInputChange}
                                className="w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Upload image to politics-images bucket</label>
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 hover:border-red-500/60 cursor-pointer text-sm text-gray-300">
                                <ImageIcon size={16} />
                                {imageFile ? imageFile.name : 'Choose image file'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelection}
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {formData.id ? 'Update dispatch' : 'Create dispatch'}
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                            >
                                Clear editor
                            </button>
                        </div>

                        {hasUnsavedFormChanges && (
                            <p className="text-xs text-amber-300">Unsaved changes in editor.</p>
                        )}

                        {lastAutosaveAt && (
                            <p className="text-xs text-gray-400">Autosaved at {formatAutosaveTime(lastAutosaveAt)}.</p>
                        )}
                    </form>
                </section>

                <aside className="lg:col-span-2 space-y-6">
                    <section className="bg-[#181A23] border border-gray-800 rounded-2xl p-5">
                        <h2 className="text-lg font-semibold mb-4 inline-flex items-center gap-2">
                            <Eye size={18} /> Live Newspaper Card Preview
                        </h2>

                        <article className="border border-gray-700 rounded-xl overflow-hidden bg-[#0F1118]">
                            {(imagePreview || formData.image_url) && (
                                <img
                                    src={imagePreview || formData.image_url}
                                    alt="Preview"
                                    className="w-full h-40 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <p className="text-[11px] uppercase tracking-wide text-red-300 mb-2">
                                    {formData.category || 'analysis'} • {formData.digest_type || 'world'}
                                </p>
                                <h3 className="text-lg font-semibold leading-snug mb-2">
                                    {formData.title || 'Headline preview'}
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed min-h-[3.5rem]">
                                    {formData.excerpt || 'Excerpt preview will appear here.'}
                                </p>
                                <p className="text-xs text-gray-500 mt-3">By {formData.source || 'Editorial Desk'}</p>
                            </div>
                        </article>
                    </section>

                    <section className="bg-[#181A23] border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                                <FileText size={18} /> Recent Dispatches
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                            <input
                                type="text"
                                value={listSearchQuery}
                                onChange={(event) => setListSearchQuery(event.target.value)}
                                placeholder="Search title or slug"
                                className="bg-[#0F1118] border border-gray-700 rounded-md px-2.5 py-2 text-xs text-white"
                            />

                            <select
                                value={listStatusFilter}
                                onChange={(event) => setListStatusFilter(event.target.value)}
                                className="bg-[#0F1118] border border-gray-700 rounded-md px-2.5 py-2 text-xs text-white"
                            >
                                <option value="all">All statuses</option>
                                {STATUS_OPTIONS.map((statusOption) => (
                                    <option key={`status-filter-${statusOption}`} value={statusOption}>
                                        {statusOption}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={listPlacementFilter}
                                onChange={(event) => setListPlacementFilter(event.target.value)}
                                className="bg-[#0F1118] border border-gray-700 rounded-md px-2.5 py-2 text-xs text-white"
                            >
                                <option value="all">All placements</option>
                                {PLACEMENT_OPTIONS.map((placementOption) => (
                                    <option key={`placement-filter-${placementOption}`} value={placementOption}>
                                        {placementOption}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isLoadingArticles ? (
                            <p className="text-gray-400 text-sm">Loading dispatches...</p>
                        ) : articles.length === 0 ? (
                            <p className="text-gray-400 text-sm">No politics dispatches yet.</p>
                        ) : filteredArticles.length === 0 ? (
                            <p className="text-gray-400 text-sm">No dispatches match your filters.</p>
                        ) : (
                            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                                {filteredArticles.map((article) => {
                                    const statusMeta = getDispatchStatusMeta(article);

                                    return (
                                    <div key={article.id} className="border border-gray-700 rounded-lg p-3 bg-[#0F1118]">
                                        <p className={`text-xs uppercase tracking-wide mb-1 ${statusMeta.className}`}>
                                            {statusMeta.label}
                                            {statusMeta.detail ? ` • ${statusMeta.detail}` : ''}
                                        </p>
                                        <h3 className="font-medium text-sm text-white line-clamp-2 mb-2">
                                            {article.title || 'Untitled'}
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                                            {article.excerpt || 'No excerpt'}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(article)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => togglePublishStatus(article)}
                                                className="px-2.5 py-1.5 text-xs bg-red-600/80 hover:bg-red-600 rounded-md transition-colors"
                                            >
                                                {article.status === 'published' ? 'Move to draft' : 'Publish'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(article.id)}
                                                disabled={isDeleting}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-900/60 hover:bg-red-900 rounded-md transition-colors disabled:opacity-60"
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default PoliticsUploadPage;
