import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { knowledgeApiService } from '../components/Knowledge/api';
import { useTopics } from '../components/Knowledge/hooks/useTopics';
import { ArrowLeft, HelpCircle, Send, Loader2, AlertCircle, CheckCircle, Info, Edit3 } from 'lucide-react';

const inputCls = "w-full bg-[#0b0d12] border border-white/[0.06] rounded-none px-4 py-3 text-[13px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[rgba(179, 18, 46,0.4)] transition-all font-[Outfit,sans-serif]";
const labelCls = "block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/35 mb-2";

const KnowledgeAskPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { topics, loading: topicsLoading } = useTopics(knowledgeApiService);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [topicId, setTopicId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (title.length < 10) { setError('Title must be at least 10 characters'); return; }
        if (title.length > 300) { setError('Title must be less than 300 characters'); return; }
        if (content.length < 20) { setError('Description must be at least 20 characters'); return; }

        setSubmitting(true);
        const result = await knowledgeApiService.createQuestion({
            title: title.trim(), content: content.trim(), topic_id: topicId || null,
        }, user.id);

        if (result.success) { setSuccess(true); }
        else { setError(result.error?.message || 'Failed to submit question'); }
        setSubmitting(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center px-4">
                <div className="text-center">
                    <HelpCircle size={40} className="mx-auto text-white/15 mb-4" />
                    <h2 className="text-lg font-semibold text-white/60 mb-2 font-[Outfit,sans-serif]">Login Required</h2>
                    <p className="text-white/30 text-sm mb-6">You need to be logged in to ask a question.</p>
                    <Link href="/" className="text-[#b3122e] text-sm hover:underline">Go to login</Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
                    <h2 className="text-lg font-semibold text-white/80 mb-2 font-[Outfit,sans-serif]">Question Submitted!</h2>
                    <p className="text-white/40 text-sm mb-8 leading-relaxed">
                        Your question is awaiting admin approval. It will appear in the feed once approved.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link href="/knowledge" className="px-5 py-2 border border-white/[0.1] text-white/50 hover:text-white/80 hover:border-white/[0.2] rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all">
                            Back to Feed
                        </Link>
                        <button
                            onClick={() => { setSuccess(false); setTitle(''); setContent(''); setTopicId(''); }}
                            className="px-5 py-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all"
                        >
                            Ask Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0d12] text-white font-[Outfit,sans-serif]">
            <div className="max-w-2xl mx-auto px-4 py-8">

                <Link href="/knowledge" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-[12px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-colors mb-8">
                    <ArrowLeft size={14} /> Back to Questions
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.16em] text-[#b3122e] opacity-70 mb-2">
                        Knowledge Q&amp;A
                    </p>
                    <h1 className="font-[Cormorant_Garamond,Georgia,serif] text-[36px] font-[500] leading-none text-white mb-2 tracking-[-0.02em]">
                        Ask a Question
                    </h1>
                    <p className="text-white/35 text-[13px]">Get answers from certified comrades with expertise in Marxist theory.</p>
                </div>

                {/* Guidelines */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-none p-4 mb-6 flex items-start gap-3">
                    <Info size={15} className="text-white/30 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/30 mb-2">Before you ask</p>
                        <ul className="space-y-1.5 text-[12px] text-white/35 leading-relaxed">
                            <li>Search existing questions to avoid duplicates</li>
                            <li>Be specific and clear in your question</li>
                            <li>Provide context to help others understand</li>
                            <li>Questions are reviewed by admins before publishing</li>
                        </ul>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-[#10131b] border border-white/[0.06] rounded-none p-6 shadow-[0_2px_20px_rgba(0,0,0,0.3)]">

                    {error && (
                        <div className="flex items-center gap-2 bg-[rgba(179, 18, 46,0.1)] border border-[rgba(179, 18, 46,0.25)] text-[#b3122e] px-4 py-3 rounded-none text-[12px] mb-5">
                            <AlertCircle size={14} className="shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Topic */}
                        <div>
                            <label className={labelCls}>Topic <span className="text-white/20 normal-case tracking-normal">— optional</span></label>
                            <select
                                value={topicId}
                                onChange={e => setTopicId(e.target.value)}
                                disabled={topicsLoading}
                                className={`${inputCls} appearance-none cursor-pointer`}
                            >
                                <option value="">Select a topic…</option>
                                {topics.map(topic => (
                                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className={labelCls}>Question Title <span className="text-[#b3122e]">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What do you want to know?"
                                className={inputCls}
                                maxLength={300}
                                disabled={submitting}
                            />
                            <div className="flex items-center justify-between mt-1.5 px-0.5">
                                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">Be specific — imagine you're asking a person</span>
                                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${title.length > 280 ? 'text-[#b3122e]' : 'text-white/20'}`}>{title.length}/300</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>Description <span className="text-[#b3122e]">*</span></label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Provide more details about your question… Markdown is supported."
                                className={`${inputCls} min-h-[180px] resize-y`}
                                disabled={submitting}
                            />
                            <div className="flex items-center justify-between mt-1.5 px-0.5">
                                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">Minimum 20 characters</span>
                                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${content.length < 20 && content.length > 0 ? 'text-[#b3122e]' : 'text-white/20'}`}>
                                    {content.length}/20 min
                                </span>
                            </div>
                        </div>

                        {/* Submit row */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                            <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 uppercase tracking-wider">Reviewed before publishing</span>
                            <button
                                type="submit"
                                disabled={submitting || title.length < 10 || content.length < 20}
                                className="flex items-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white px-5 py-2.5 rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(179, 18, 46,0.2)] hover:shadow-[0_0_28px_rgba(179, 18, 46,0.35)]"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Submit Question
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeAskPage;
