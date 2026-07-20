import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    Check,
    FileText,
    GitBranch,
    Headphones,
    Loader2,
    Pencil,
    Save,
    Trash2,
    Users,
    Video,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const withTimeout = (promise, ms = 15000) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out — server not responding.')), ms)),
    ]);

const RESOURCE_TYPES = ['text', 'video', 'audio', 'lecture'];

const ICON_OPTIONS = ['BookOpen', 'GitBranch', 'Users', 'FileText', 'Video', 'Headphones'];

const ICON_MAP = {
    BookOpen,
    GitBranch,
    Users,
    FileText,
    Video,
    Headphones,
};

const emptyResource = {
    id: null,
    title: '',
    type: 'text',
    excerpt: '',
    content_url: '',
    cover_image_url: '',
    author: '',
    category: '',
    sort_order: 0,
    is_featured: false,
    digital_library_book_id: '',
};

const emptyConcept = {
    id: null,
    term: '',
    chinese_term: '',
    icon_name: 'BookOpen',
    explanation: '',
    category: '',
    sort_order: 0,
};

const emptyMilestone = {
    id: null,
    title: '',
    chinese_title: '',
    description: '',
    sort_order: 0,
    resource_id: '',
};


const StudyAdminPage = () => {
    const router = useRouter();
    const { canManageStudy } = useAuth();
    const canEdit = canManageStudy();

    const [activeTab, setActiveTab] = useState('resources');

    const [resources, setResources] = useState([]);
    const [concepts, setConcepts] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [libraryBooks, setLibraryBooks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [resourceForm, setResourceForm] = useState(emptyResource);
    const [conceptForm, setConceptForm] = useState(emptyConcept);
    const [milestoneForm, setMilestoneForm] = useState(emptyMilestone);
    useEffect(() => {
        if (!canEdit) {
            router.replace('/coming-soon');
        }
    }, [canEdit, router]);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [resData, conData, milData, libData] = await withTimeout(Promise.all([
                    supabase.from('study_resources').select('*').order('sort_order'),
                    supabase.from('study_concepts').select('*').order('sort_order'),
                    supabase.from('study_milestones').select('*').order('sort_order'),
                    supabase.from('digital_library_books').select('id, title').order('title'),
                ]));

                if (resData.error) throw resData.error;
                if (conData.error) throw conData.error;
                if (milData.error) throw milData.error;

                setResources(resData.data || []);
                setConcepts(conData.data || []);
                setMilestones(milData.data || []);
                setLibraryBooks(libData.data || []);
            } catch (err) {
                console.error('Error loading study admin data:', err);
                setError(err.message || 'Failed to load study data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    const refreshResources = async () => {
        const { data } = await supabase.from('study_resources').select('*').order('sort_order');
        setResources(data || []);
    };

    const refreshConcepts = async () => {
        const { data } = await supabase.from('study_concepts').select('*').order('sort_order');
        setConcepts(data || []);
    };

    const refreshMilestones = async () => {
        const { data } = await supabase.from('study_milestones').select('*').order('sort_order');
        setMilestones(data || []);
    };
    const handleSaveResource = async (e) => {
        e.preventDefault();
        if (!resourceForm.title.trim()) {
            setError('Resource title is required.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: resourceForm.title.trim(),
                type: resourceForm.type,
                excerpt: resourceForm.excerpt.trim() || null,
                content_url: resourceForm.content_url.trim() || null,
                cover_image_url: resourceForm.cover_image_url.trim() || null,
                author: resourceForm.author.trim() || null,
                category: resourceForm.category.trim() || null,
                sort_order: parseInt(resourceForm.sort_order, 10) || 0,
                is_featured: resourceForm.is_featured === true,
                digital_library_book_id: resourceForm.digital_library_book_id || null,
            };

            if (resourceForm.id) {
                const { error: updateError } = await withTimeout(supabase
                    .from('study_resources')
                    .update(payload)
                    .eq('id', resourceForm.id));
                if (updateError) throw updateError;
                setSuccess('Resource updated.');
            } else {
                const { error: insertError } = await withTimeout(supabase
                    .from('study_resources')
                    .insert(payload));
                if (insertError) throw insertError;
                setSuccess('Resource created.');
            }

            await withTimeout(refreshResources());
            setResourceForm(emptyResource);
        } catch (err) {
            console.error('Error saving resource:', err);
            setError(err.message || 'Failed to save resource.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveConcept = async (e) => {
        e.preventDefault();
        if (!conceptForm.term.trim()) {
            setError('Concept term is required.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                term: conceptForm.term.trim(),
                chinese_term: conceptForm.chinese_term.trim() || null,
                icon_name: conceptForm.icon_name || 'BookOpen',
                explanation: conceptForm.explanation.trim(),
                category: conceptForm.category.trim() || null,
                sort_order: parseInt(conceptForm.sort_order, 10) || 0,
            };

            if (conceptForm.id) {
                const { error: updateError } = await withTimeout(supabase
                    .from('study_concepts')
                    .update(payload)
                    .eq('id', conceptForm.id));
                if (updateError) throw updateError;
                setSuccess('Concept updated.');
            } else {
                const { error: insertError } = await withTimeout(supabase
                    .from('study_concepts')
                    .insert(payload));
                if (insertError) throw insertError;
                setSuccess('Concept created.');
            }

            await withTimeout(refreshConcepts());
            setConceptForm(emptyConcept);
        } catch (err) {
            console.error('Error saving concept:', err);
            setError(err.message || 'Failed to save concept.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMilestone = async (e) => {
        e.preventDefault();
        if (!milestoneForm.title.trim()) {
            setError('Milestone title is required.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: milestoneForm.title.trim(),
                chinese_title: milestoneForm.chinese_title.trim() || null,
                description: milestoneForm.description.trim() || null,
                sort_order: parseInt(milestoneForm.sort_order, 10) || 0,
                resource_id: milestoneForm.resource_id || null,
            };

            if (milestoneForm.id) {
                const { error: updateError } = await withTimeout(supabase
                    .from('study_milestones')
                    .update(payload)
                    .eq('id', milestoneForm.id));
                if (updateError) throw updateError;
                setSuccess('Milestone updated.');
            } else {
                const { error: insertError } = await withTimeout(supabase
                    .from('study_milestones')
                    .insert(payload));
                if (insertError) throw insertError;
                setSuccess('Milestone created.');
            }

            await withTimeout(refreshMilestones());
            setMilestoneForm(emptyMilestone);
        } catch (err) {
            console.error('Error saving milestone:', err);
            setError(err.message || 'Failed to save milestone.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResource = async (id) => {
        if (!window.confirm('Delete this resource permanently?')) return;
        setDeleting(true);
        try {
            const { error: deleteError } = await withTimeout(supabase.from('study_resources').delete().eq('id', id));
            if (deleteError) throw deleteError;
            await withTimeout(refreshResources());
            if (resourceForm.id === id) setResourceForm(emptyResource);
            setSuccess('Resource deleted.');
        } catch (err) {
            setError(err.message || 'Failed to delete resource.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteConcept = async (id) => {
        if (!window.confirm('Delete this concept permanently?')) return;
        setDeleting(true);
        try {
            const { error: deleteError } = await withTimeout(supabase.from('study_concepts').delete().eq('id', id));
            if (deleteError) throw deleteError;
            await withTimeout(refreshConcepts());
            if (conceptForm.id === id) setConceptForm(emptyConcept);
            setSuccess('Concept deleted.');
        } catch (err) {
            setError(err.message || 'Failed to delete concept.');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteMilestone = async (id) => {
        if (!window.confirm('Delete this milestone permanently?')) return;
        setDeleting(true);
        try {
            const { error: deleteError } = await withTimeout(supabase.from('study_milestones').delete().eq('id', id));
            if (deleteError) throw deleteError;
            await withTimeout(refreshMilestones());
            if (milestoneForm.id === id) setMilestoneForm(emptyMilestone);
            setSuccess('Milestone deleted.');
        } catch (err) {
            setError(err.message || 'Failed to delete milestone.');
        } finally {
            setDeleting(false);
        }
    };

    const inputClass = 'w-full bg-[#0F1118] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm';
    const labelClass = 'block text-sm text-gray-400 mb-1';

    return (
        <div className="min-h-screen bg-[#12131A] text-white px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.push('/study')}
                        className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        aria-label="Back to study page"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Study Center Admin</h1>
                        <p className="text-gray-400 text-sm">Manage resources, concepts, and milestones for the Marxist theory study page.</p>
                    </div>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300 text-sm">
                        <Check size={16} /> {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-900/40 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
                    {['resources', 'concepts', 'milestones'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
                            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-red-600/20 text-red-400 border-b-2 border-red-500'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-[#181A23] border border-gray-800 rounded-2xl p-8 text-gray-400 flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" /> Loading study data...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <section className="lg:col-span-3 bg-[#181A23] border border-gray-800 rounded-2xl p-6">
                            {activeTab === 'resources' && (
                                <form onSubmit={handleSaveResource} className="space-y-4">
                                    <h2 className="text-lg font-semibold mb-2">{resourceForm.id ? 'Edit Resource' : 'New Resource'}</h2>

                                    <div>
                                        <label className={labelClass}>Title *</label>
                                        <input type="text" value={resourceForm.title} onChange={(e) => setResourceForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Type</label>
                                            <select value={resourceForm.type} onChange={(e) => setResourceForm((p) => ({ ...p, type: e.target.value }))} className={inputClass}>
                                                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Category</label>
                                            <input type="text" value={resourceForm.category} onChange={(e) => setResourceForm((p) => ({ ...p, category: e.target.value }))} className={inputClass} placeholder="e.g. Political Economy" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Excerpt</label>
                                        <textarea value={resourceForm.excerpt} onChange={(e) => setResourceForm((p) => ({ ...p, excerpt: e.target.value }))} rows={3} className={inputClass} />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Author</label>
                                        <input type="text" value={resourceForm.author} onChange={(e) => setResourceForm((p) => ({ ...p, author: e.target.value }))} className={inputClass} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Content URL</label>
                                            <input type="url" value={resourceForm.content_url} onChange={(e) => setResourceForm((p) => ({ ...p, content_url: e.target.value }))} className={inputClass} placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Cover Image URL</label>
                                            <input type="url" value={resourceForm.cover_image_url} onChange={(e) => setResourceForm((p) => ({ ...p, cover_image_url: e.target.value }))} className={inputClass} placeholder="https://..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Sort Order</label>
                                            <input type="number" value={resourceForm.sort_order} onChange={(e) => setResourceForm((p) => ({ ...p, sort_order: e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Digital Library Link</label>
                                            <select value={resourceForm.digital_library_book_id} onChange={(e) => setResourceForm((p) => ({ ...p, digital_library_book_id: e.target.value }))} className={inputClass}>
                                                <option value="">None</option>
                                                {libraryBooks.map((book) => (
                                                    <option key={book.id} value={book.id}>{book.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input type="checkbox" checked={resourceForm.is_featured} onChange={(e) => setResourceForm((p) => ({ ...p, is_featured: e.target.checked }))} className="rounded border-gray-600 bg-[#0F1118]" />
                                        Featured resource
                                    </label>

                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {resourceForm.id ? 'Update' : 'Create'}
                                        </button>
                                        {resourceForm.id && (
                                            <button type="button" onClick={() => setResourceForm(emptyResource)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {activeTab === 'concepts' && (
                                <form onSubmit={handleSaveConcept} className="space-y-4">
                                    <h2 className="text-lg font-semibold mb-2">{conceptForm.id ? 'Edit Concept' : 'New Concept'}</h2>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Term *</label>
                                            <input type="text" value={conceptForm.term} onChange={(e) => setConceptForm((p) => ({ ...p, term: e.target.value }))} className={inputClass} required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Chinese Term</label>
                                            <input type="text" value={conceptForm.chinese_term} onChange={(e) => setConceptForm((p) => ({ ...p, chinese_term: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Explanation *</label>
                                        <textarea value={conceptForm.explanation} onChange={(e) => setConceptForm((p) => ({ ...p, explanation: e.target.value }))} rows={4} className={inputClass} required />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelClass}>Icon</label>
                                            <select value={conceptForm.icon_name} onChange={(e) => setConceptForm((p) => ({ ...p, icon_name: e.target.value }))} className={inputClass}>
                                                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Category</label>
                                            <input type="text" value={conceptForm.category} onChange={(e) => setConceptForm((p) => ({ ...p, category: e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Sort Order</label>
                                            <input type="number" value={conceptForm.sort_order} onChange={(e) => setConceptForm((p) => ({ ...p, sort_order: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {conceptForm.id ? 'Update' : 'Create'}
                                        </button>
                                        {conceptForm.id && (
                                            <button type="button" onClick={() => setConceptForm(emptyConcept)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {activeTab === 'milestones' && (
                                <form onSubmit={handleSaveMilestone} className="space-y-4">
                                    <h2 className="text-lg font-semibold mb-2">{milestoneForm.id ? 'Edit Milestone' : 'New Milestone'}</h2>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Title *</label>
                                            <input type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Chinese Title</label>
                                            <input type="text" value={milestoneForm.chinese_title} onChange={(e) => setMilestoneForm((p) => ({ ...p, chinese_title: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={inputClass} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Linked Resource</label>
                                            <select value={milestoneForm.resource_id} onChange={(e) => setMilestoneForm((p) => ({ ...p, resource_id: e.target.value }))} className={inputClass}>
                                                <option value="">None</option>
                                                {resources.map((res) => (
                                                    <option key={res.id} value={res.id}>{res.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Sort Order</label>
                                            <input type="number" value={milestoneForm.sort_order} onChange={(e) => setMilestoneForm((p) => ({ ...p, sort_order: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {milestoneForm.id ? 'Update' : 'Create'}
                                        </button>
                                        {milestoneForm.id && (
                                            <button type="button" onClick={() => setMilestoneForm(emptyMilestone)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            )}

                        </section>

                        <aside className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-semibold">
                                {activeTab === 'resources' ? `Resources (${resources.length})` : activeTab === 'concepts' ? `Concepts (${concepts.length})` : `Milestones (${milestones.length})`}
                            </h2>

                            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                                {activeTab === 'resources' && resources.map((item) => (
                                    <div key={item.id} className="border border-gray-700 rounded-lg p-3 bg-[#0F1118]">
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{item.type}{item.is_featured ? ' • Featured' : ''}</p>
                                        <h3 className="font-medium text-sm text-white mb-1">{item.title}</h3>
                                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{item.excerpt || 'No excerpt'}</p>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setResourceForm({ ...item, digital_library_book_id: item.digital_library_book_id || '' })} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-md"><Pencil size={13} /> Edit</button>
                                            <button type="button" onClick={() => handleDeleteResource(item.id)} disabled={deleting} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-900/60 hover:bg-red-900 rounded-md disabled:opacity-60"><Trash2 size={13} /> Delete</button>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'concepts' && concepts.map((item) => {
                                    const IconComp = ICON_MAP[item.icon_name] || BookOpen;
                                    return (
                                        <div key={item.id} className="border border-gray-700 rounded-lg p-3 bg-[#0F1118]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <IconComp size={14} className="text-red-400" />
                                                <h3 className="font-medium text-sm text-white">{item.term}</h3>
                                                {item.chinese_term && <span className="text-xs text-gray-500">{item.chinese_term}</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-3">{item.explanation}</p>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setConceptForm(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-md"><Pencil size={13} /> Edit</button>
                                                <button type="button" onClick={() => handleDeleteConcept(item.id)} disabled={deleting} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-900/60 hover:bg-red-900 rounded-md disabled:opacity-60"><Trash2 size={13} /> Delete</button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {activeTab === 'milestones' && milestones.map((item) => {
                                    const linkedResource = resources.find((r) => r.id === item.resource_id);
                                    return (
                                        <div key={item.id} className="border border-gray-700 rounded-lg p-3 bg-[#0F1118]">
                                            <h3 className="font-medium text-sm text-white mb-1">{item.title}</h3>
                                            {item.chinese_title && <p className="text-xs text-gray-500 mb-1">{item.chinese_title}</p>}
                                            {linkedResource && <p className="text-xs text-sky-400 mb-1">Linked: {linkedResource.title}</p>}
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-3">{item.description || 'No description'}</p>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setMilestoneForm({ ...item, resource_id: item.resource_id || '' })} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-md"><Pencil size={13} /> Edit</button>
                                                <button type="button" onClick={() => handleDeleteMilestone(item.id)} disabled={deleting} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-900/60 hover:bg-red-900 rounded-md disabled:opacity-60"><Trash2 size={13} /> Delete</button>
                                            </div>
                                        </div>
                                    );
                                })}


                                {activeTab === 'resources' && resources.length === 0 && <p className="text-gray-400 text-sm">No resources yet.</p>}
                                {activeTab === 'concepts' && concepts.length === 0 && <p className="text-gray-400 text-sm">No concepts yet.</p>}
                                {activeTab === 'milestones' && milestones.length === 0 && <p className="text-gray-400 text-sm">No milestones yet.</p>}
                                </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyAdminPage;
