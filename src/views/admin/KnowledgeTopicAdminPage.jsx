import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { knowledgeApiService } from '../../components/Knowledge/api';
import {
    Plus, Pencil, Trash2, Check, X, Loader2, Tag, ArrowLeft, AlertCircle
} from 'lucide-react';

const inputCls = "w-full bg-[#0b0d12] border border-white/[0.06] rounded-none px-4 py-2.5 text-[13px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[rgba(179, 18, 46,0.4)] transition-all font-[Outfit,sans-serif]";
const labelCls = "block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/35 mb-1.5";

const slugify = (str) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const KnowledgeTopicAdminPage = () => {
    const { user } = useAuth();

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const emptyForm = { name: '', slug: '', description: '' };
    const [form, setForm] = useState(emptyForm);

    const fetchTopics = async () => {
        setLoading(true);
        const data = await knowledgeApiService.getTopics();
        setTopics(data);
        setLoading(false);
    };

    useEffect(() => { fetchTopics(); }, []);

    const flash = (msg, isError = false) => {
        if (isError) setError(msg);
        else setSuccess(msg);
        setTimeout(() => { setError(null); setSuccess(null); }, 3000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        const { error: err } = await knowledgeApiService.createTopic({
            name: form.name.trim(),
            slug: form.slug.trim() || slugify(form.name),
            description: form.description.trim() || null,
        });
        if (err) { flash(err.message || 'Failed to create topic', true); }
        else { flash('Topic created'); setShowCreate(false); setForm(emptyForm); fetchTopics(); }
        setSaving(false);
    };

    const handleUpdate = async (topicId) => {
        setSaving(true);
        const { error: err } = await knowledgeApiService.updateTopic(topicId, {
            name: form.name.trim(),
            slug: form.slug.trim() || slugify(form.name),
            description: form.description.trim() || null,
        });
        if (err) { flash(err.message || 'Failed to update topic', true); }
        else { flash('Topic updated'); setEditingId(null); setForm(emptyForm); fetchTopics(); }
        setSaving(false);
    };

    const handleDelete = async (topicId) => {
        setSaving(true);
        const { error: err } = await knowledgeApiService.deleteTopic(topicId);
        if (err) { flash(err.message || 'Failed to delete topic', true); }
        else { flash('Topic deleted'); setDeletingId(null); fetchTopics(); }
        setSaving(false);
    };

    const startEdit = (topic) => {
        setEditingId(topic.id);
        setShowCreate(false);
        setForm({ name: topic.name, slug: topic.slug, description: topic.description || '' });
    };

    const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

    return (
        <div className="min-h-screen bg-[#0b0d12] text-white font-[Outfit,sans-serif]">
            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Back */}
                <Link href="/admin/knowledge"
                    className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-[12px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-colors mb-8"
                >
                    <ArrowLeft size={14} /> Admin · Knowledge
                </Link>

                {/* Header */}
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.16em] text-[#b3122e] opacity-70 mb-1">
                            Admin · Knowledge Q&amp;A
                        </p>
                        <h1 className="font-[Cormorant_Garamond,Georgia,serif] text-[32px] font-[500] leading-none text-white tracking-[-0.02em]">
                            Topic Management
                        </h1>
                    </div>
                    {!showCreate && (
                        <button
                            onClick={() => { setShowCreate(true); setEditingId(null); setForm(emptyForm); }}
                            className="flex items-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white px-4 py-2 rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all shrink-0"
                        >
                            <Plus size={14} /> New Topic
                        </button>
                    )}
                </div>

                {/* Flash messages */}
                {error && (
                    <div className="flex items-center gap-2 bg-[rgba(179, 18, 46,0.1)] border border-[rgba(179, 18, 46,0.25)] text-[#b3122e] px-4 py-3 rounded-none text-[12px] mb-4">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 px-4 py-3 rounded-none text-[12px] mb-4">
                        <Check size={14} /> {success}
                    </div>
                )}

                {/* Create form */}
                {showCreate && (
                    <div className="bg-[#10131b] border border-[rgba(179, 18, 46,0.22)] rounded-none p-5 mb-4 shadow-[0_0_24px_rgba(179, 18, 46,0.06)]">
                        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-[#b3122e] mb-4">
                            New Topic
                        </p>
                        <TopicForm
                            form={form}
                            setForm={setForm}
                            onSubmit={handleCreate}
                            onCancel={() => { setShowCreate(false); setForm(emptyForm); }}
                            saving={saving}
                            inputCls={inputCls}
                            labelCls={labelCls}
                            slugify={slugify}
                            submitLabel="Create Topic"
                        />
                    </div>
                )}

                {/* Topics list */}
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-white/[0.12] border-t-[#b3122e] animate-spin" />
                    </div>
                ) : topics.length === 0 ? (
                    <div className="py-16 text-center bg-[#10131b] border border-white/[0.06] rounded-none">
                        <Tag size={28} className="mx-auto text-white/15 mb-3" />
                        <p className="text-white/30 text-sm">No topics yet. Create one above.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {topics.map(topic => (
                            <div
                                key={topic.id}
                                className={`bg-[#10131b] border rounded-none transition-all ${
                                    editingId === topic.id
                                        ? 'border-[rgba(179, 18, 46,0.22)] p-5'
                                        : 'border-white/[0.06] px-5 py-3.5 hover:border-white/[0.12]'
                                }`}
                            >
                                {editingId === topic.id ? (
                                    <>
                                        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-[#b3122e] mb-4">
                                            Editing — {topic.name}
                                        </p>
                                        <TopicForm
                                            form={form}
                                            setForm={setForm}
                                            onSubmit={(e) => { e.preventDefault(); handleUpdate(topic.id); }}
                                            onCancel={cancelEdit}
                                            saving={saving}
                                            inputCls={inputCls}
                                            labelCls={labelCls}
                                            slugify={slugify}
                                            submitLabel="Save Changes"
                                        />
                                    </>
                                ) : deletingId === topic.id ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-[13px] text-white/60">
                                            Delete <span className="text-white/90 font-semibold">{topic.name}</span>? This cannot be undone.
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleDelete(topic.id)}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(179, 18, 46,0.15)] hover:bg-[rgba(179, 18, 46,0.25)] border border-[rgba(179, 18, 46,0.3)] text-[#b3122e] rounded-none text-[10px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-colors disabled:opacity-40"
                                            >
                                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Tag size={13} className="text-[#b3122e] shrink-0" />
                                            <div className="min-w-0">
                                                <span className="text-[14px] font-medium text-white/80 truncate block">{topic.name}</span>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/25">/{topic.slug}</span>
                                                    <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
                                                        {topic.question_count || 0} questions
                                                    </span>
                                                    {topic.description && (
                                                        <span className="text-[11px] text-white/25 truncate max-w-[200px]">{topic.description}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => startEdit(topic)}
                                                className="p-1.5 text-white/25 hover:text-white/70 hover:bg-white/[0.04] rounded-none transition-all"
                                                title="Edit"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(topic.id)}
                                                className="p-1.5 text-white/25 hover:text-[#b3122e] hover:bg-[rgba(179, 18, 46,0.08)] rounded-none transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TopicForm = ({ form, setForm, onSubmit, onCancel, saving, inputCls, labelCls, slugify, submitLabel }) => {
    const handleNameChange = (val) => {
        setForm(prev => ({
            ...prev,
            name: val,
            slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(val) : prev.slug,
        }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Name <span className="text-[#b3122e]">*</span></label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => handleNameChange(e.target.value)}
                        placeholder="e.g. Marxist Theory"
                        className={inputCls}
                        required
                    />
                </div>
                <div>
                    <label className={labelCls}>Slug <span className="text-[#b3122e]">*</span></label>
                    <input
                        type="text"
                        value={form.slug}
                        onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="e.g. marxist-theory"
                        className={inputCls}
                        required
                    />
                </div>
            </div>
            <div>
                <label className={labelCls}>Description <span className="text-white/20 normal-case tracking-normal">— optional</span></label>
                <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of this topic…"
                    className={inputCls}
                />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.16] rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving || !form.name.trim()}
                    className="flex items-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white px-4 py-2 rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};

export default KnowledgeTopicAdminPage;
