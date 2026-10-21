import React, { useState, useRef, useEffect } from 'react';
import { Edit3, MessageSquare, HelpCircle, Send, Loader2, AlertCircle, CheckCircle, ChevronDown, X } from 'lucide-react';
import FeedCard from './FeedCard';
import Link from 'next/link';
import { knowledgeApiService } from '../api';
import { useTopics } from '../hooks/useTopics';

const TABS = [
  { key: 'recommend', label: 'Recommended' },
  { key: 'follow',    label: 'Following' },
  { key: 'hot',       label: 'Hot' },
];

const inputCls = "w-full bg-[#0b0d12] border border-white/[0.06] rounded-none px-4 py-3 text-[13px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[rgba(179, 18, 46,0.4)] transition-all font-[Outfit,sans-serif]";
const labelCls = "block font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/35 mb-2";

const FeedStream = ({ questions, loading, user, profile, activeTab, onTabChange, viewMode, isFollowing, onToggleFollow, onVote, isFavorited, onToggleFavorite, hasMore, onLoadMore }) => {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicId, setTopicId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { topics, loading: topicsLoading } = useTopics(knowledgeApiService);
  const titleRef = useRef(null);

  useEffect(() => {
    if (expanded && titleRef.current) titleRef.current.focus();
  }, [expanded]);

  const resetForm = () => {
    setTitle(''); setContent(''); setTopicId('');
    setError(null); setSuccess(false); setExpanded(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (title.length < 10) { setError('Title must be at least 10 characters'); return; }
    if (title.length > 300) { setError('Title must be less than 300 characters'); return; }
    if (content.length < 20) { setError('Description must be at least 20 characters'); return; }
    setSubmitting(true);
    const result = await knowledgeApiService.createQuestion(
      { title: title.trim(), content: content.trim(), topic_id: topicId || null },
      user.id
    );
    if (result.success) { setSuccess(true); }
    else { setError(result.error?.message || 'Failed to submit question'); }
    setSubmitting(false);
  };

  return (
    <>
      {/* ── Page Header ── */}
      <div className="relative mb-6 pb-5 border-b border-white/[0.06] overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 rounded-full bg-[rgba(179, 18, 46,0.06)] blur-3xl" />
        <p className="relative font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.16em] text-[#b3122e] opacity-70 mb-2">
          Community · Knowledge Q&amp;A
        </p>
        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-[Cormorant_Garamond,Georgia,serif] text-[40px] font-[500] leading-none tracking-[-0.03em] text-white">
            Knowledge Base
          </h1>
          <Link href="/knowledge/ask"
            className="flex items-center gap-2 bg-[rgba(179, 18, 46,0.12)] hover:bg-[rgba(179, 18, 46,0.2)] border border-[rgba(179, 18, 46,0.28)] text-[#b3122e] px-4 py-2 rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Ask a Question
          </Link>
        </div>
        <p className="relative mt-2 text-[13px] text-white/40 font-[300] leading-relaxed max-w-xl">
          Ask, answer, and explore questions on Marxist theory, history, economics, and practice.
        </p>
      </div>

      {/* ── Post Creator ── */}
      <div className="bg-[#10131b] border border-white/[0.06] rounded-none p-4">
        {success ? (
          <div className="flex items-center gap-3 py-2">
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            <p className="text-white/60 text-[13px] font-[Outfit,sans-serif] flex-1">
              Question submitted! It will appear once approved.
            </p>
            <button onClick={resetForm} className="text-white/30 hover:text-white/60 text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.06em] transition-colors">
              Dismiss
            </button>
          </div>
        ) : !expanded ? (
          <>
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-full bg-white/[0.06] shrink-0 overflow-hidden border border-white/[0.08]">
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'User'}`}
                  className="w-full h-full object-cover"
                  alt="avatar"
                />
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 bg-white/[0.03] rounded-none border border-white/[0.06] px-4 py-2.5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left"
              >
                <span className="text-white/30 text-xs font-[Outfit,sans-serif]">
                  Share your insights or ask a question…
                </span>
              </button>
            </div>
            <div className="flex items-center gap-4 pt-2.5 mt-2.5 border-t border-white/[0.04]">
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 text-white/40 hover:text-[#b3122e] text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.06em] transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Answer
              </button>
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 text-white/40 hover:text-[#b3122e] text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.06em] transition-colors"
              >
                <HelpCircle className="w-3 h-3" /> Question
              </button>
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 text-white/40 hover:text-[#b3122e] text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.06em] transition-colors"
              >
                <MessageSquare className="w-3 h-3" /> Discuss
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-[#b3122e] opacity-70">Ask a Question</span>
              <button type="button" onClick={resetForm} className="text-white/25 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[rgba(179, 18, 46,0.1)] border border-[rgba(179, 18, 46,0.25)] text-[#b3122e] px-3 py-2 rounded-none text-[12px]">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            {/* Topic */}
            <div>
              <label className={labelCls}>Topic <span className="text-white/20 normal-case tracking-normal">— optional</span></label>
              <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={topicsLoading} className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">Select a topic…</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className={labelCls}>Question Title <span className="text-[#b3122e]">*</span></label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What do you want to know?"
                className={inputCls}
                maxLength={300}
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${title.length > 0 && title.length < 10 ? 'text-[#b3122e]' : 'text-white/20'}`}>
                  {title.length > 0 && title.length < 10 ? `${10 - title.length} more characters needed` : 'Min 10 characters'}
                </span>
                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${title.length > 280 ? 'text-[#b3122e]' : 'text-white/20'}`}>{title.length}/300</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description <span className="text-[#b3122e]">*</span></label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Provide more details… Markdown is supported."
                className={`${inputCls} min-h-[120px] resize-y`}
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${content.length > 0 && content.length < 20 ? 'text-[#b3122e]' : 'text-white/20'}`}>
                  {content.length > 0 && content.length < 20 ? `${20 - content.length} more characters needed` : 'Min 20 characters'}
                </span>
                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${content.length < 20 && content.length > 0 ? 'text-[#b3122e]' : 'text-white/20'}`}>{content.length}/20 min</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
              <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 uppercase tracking-wider">Reviewed before publishing</span>
              <button
                type="submit"
                disabled={submitting || title.length < 10 || content.length < 20}
                className="flex items-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white px-4 py-2 rounded-none text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-[#b3122e] shadow-[0_0_20px_rgba(179, 18, 46,0.2)] hover:shadow-[0_0_28px_rgba(179, 18, 46,0.35)]"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="bg-[#0b0d12]/95 backdrop-blur z-30 sticky top-[104px]">
        <div className="flex items-center gap-1.5 py-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all ${
                activeTab === tab.key
                  ? 'bg-[rgba(179, 18, 46,0.15)] text-[#b3122e] border border-[rgba(179, 18, 46,0.3)]'
                  : 'text-white/30 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* ── Feed List ── */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-white/[0.12] border-t-[#b3122e] animate-spin" />
          </div>
        ) : questions && questions.length > 0 ? (
          questions.map((item) => (
            <FeedCard
              key={item.id}
              item={{ ...item, type: 'question' }}
              isFollowing={isFollowing}
              onToggleFollow={onToggleFollow}
              onVote={onVote}
              isFavorited={isFavorited}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        ) : viewMode === 'following' ? (
          <div className="py-16 text-center space-y-2 bg-[#10131b] border border-white/[0.06] rounded-none">
            <p className="text-white/50 text-sm font-medium font-[Outfit,sans-serif]">No questions from followed topics yet.</p>
            <p className="text-white/25 text-xs">Click a topic tag on any question to follow it.</p>
          </div>
        ) : (
          <div className="py-16 text-center bg-[#10131b] border border-white/[0.06] rounded-none">
            <p className="text-white/30 text-sm font-[Outfit,sans-serif]">No questions found. Be the first to ask!</p>
          </div>
        )}

        {hasMore && (
          <button
            onClick={onLoadMore}
            className="w-full py-2.5 bg-[#10131b] border border-white/[0.06] text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] text-white/25 hover:text-white/60 hover:bg-white/[0.04] rounded-none transition-all"
          >
            Load More
          </button>
        )}
      </div>
    </>
  );
};

export default FeedStream;
