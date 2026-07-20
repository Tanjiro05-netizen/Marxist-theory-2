import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { knowledgeApiService } from '../components/Knowledge/api';
import { useQuestion } from '../components/Knowledge/hooks/useQuestions';
import { useAnswers } from '../components/Knowledge/hooks/useAnswers';
import { useVotes } from '../components/Knowledge/hooks/useVotes';
import { 
    ArrowLeft, ChevronUp, ChevronDown, Eye, Clock, CheckCircle, 
    User, Award, MessageSquare, Loader2, AlertCircle, Send, Star
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const KnowledgeQuestionPage = () => {
    const { questionId } = useParams();
    const { user, profile } = useAuth();
    
    const { question, loading: questionLoading } = useQuestion(knowledgeApiService, questionId);
    const { answers, loading: answersLoading, createAnswer, refetch: refetchAnswers } = useAnswers(knowledgeApiService, questionId);
    const { getVote: getAnswerVote, vote: voteAnswer } = useVotes(knowledgeApiService, user?.id, 'answer');
    const { getVote: getQuestionVote, vote: voteQuestion } = useVotes(knowledgeApiService, user?.id, 'question');

    const [answerContent, setAnswerContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const isCertified = profile?.is_certified || profile?.role === 'admin';
    const isQuestionAuthor = user?.id === question?.author_id;

    const handleSubmitAnswer = async (e) => {
        e.preventDefault();
        if (!answerContent.trim() || answerContent.length < 50) {
            setSubmitError('Answer must be at least 50 characters');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        
        const result = await createAnswer(answerContent);
        
        if (result.success) {
            setAnswerContent('');
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 5000);
        } else {
            setSubmitError(result.error?.message || 'Failed to submit answer');
        }
        setSubmitting(false);
    };

    const handleAcceptAnswer = async (answerId) => {
        const result = await knowledgeApiService.acceptAnswer(questionId, answerId, user.id);
        if (result.success) {
            refetchAnswers();
        }
    };

    const handleVoteQuestion = async (voteType) => {
        if (!user) return;
        await voteQuestion(questionId, voteType);
    };

    const handleVoteAnswer = async (answerId, voteType) => {
        if (!user) return;
        await voteAnswer(answerId, voteType);
    };

    const mdComponents = {
        p: ({ children }) => <p className="text-[14px] text-white/70 leading-relaxed mb-3 font-[Hanken_Grotesk,sans-serif]">{children}</p>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white/90 mb-2 mt-4 font-[Hanken_Grotesk,sans-serif]">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold text-white/80 mb-2 mt-3 font-[Hanken_Grotesk,sans-serif]">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-white/70 mb-1.5 mt-2 font-[Hanken_Grotesk,sans-serif]">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-white/60 text-[13px]">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-white/60 text-[13px]">{children}</ol>,
        li: ({ children }) => <li className="text-[13px] text-white/65">{children}</li>,
        code: ({ inline, children }) => inline
            ? <code className="font-[JetBrains_Mono,monospace] text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded text-[#c81e1e]">{children}</code>
            : <pre className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 overflow-x-auto mb-3"><code className="font-[JetBrains_Mono,monospace] text-[11px] text-white/60">{children}</code></pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-[#c81e1e] pl-4 my-3 text-white/40 italic">{children}</blockquote>,
        a: ({ href, children }) => <a href={href} className="text-[#c81e1e] hover:underline">{children}</a>,
        strong: ({ children }) => <strong className="font-semibold text-white/85">{children}</strong>,
        em: ({ children }) => <em className="italic text-white/65">{children}</em>,
        hr: () => <hr className="border-white/[0.06] my-4" />,
    };

    if (questionLoading) {
        return (
            <div className="min-h-screen bg-[#090909] text-white">
                <div className="max-w-3xl mx-auto px-4 py-12 flex items-center justify-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-white/[0.12] border-t-[#c81e1e] animate-spin" />
                    <span className="text-white/40 text-sm font-[Hanken_Grotesk,sans-serif]">Loading question…</span>
                </div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-[#090909] text-white">
                <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                    <AlertCircle size={40} className="mx-auto text-white/20 mb-4" />
                    <h2 className="text-lg font-semibold text-white/60 mb-2 font-[Hanken_Grotesk,sans-serif]">Question not found</h2>
                    <p className="text-white/30 text-sm mb-6">This question may have been removed or is pending approval.</p>
                    <Link href="/knowledge" className="text-[#c81e1e] text-sm hover:underline">← Back to Knowledge Q&amp;A</Link>
                </div>
            </div>
        );
    }

    const questionVote = getQuestionVote(questionId);

    return (
        <div className="min-h-screen bg-[#090909] text-white font-[Hanken_Grotesk,sans-serif]">
            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Back link */}
                <Link href="/knowledge" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-[12px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-colors mb-6">
                    <ArrowLeft size={14} /> Back to Questions
                </Link>

                {/* ── Question card ── */}
                <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 mb-4 shadow-[0_2px_20px_rgba(0,0,0,0.3)]">

                    {question.status === 'pending' && (
                        <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-[JetBrains_Mono,monospace] mb-4">
                            <Clock size={13} /> Awaiting admin approval
                        </div>
                    )}

                    {/* Topic + answered badge */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border text-[#c81e1e] border-[rgba(200,30,30,0.28)] bg-[rgba(200,30,30,0.08)]">Q</span>
                        {question.is_answered && (
                            <span className="flex items-center gap-1 font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-emerald-400 border border-emerald-800/40 bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <CheckCircle size={9} /> Answered
                            </span>
                        )}
                        {question.topic && (
                            <Link href={`/knowledge?topic=${question.topic.slug}`}
                                className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-white/30 border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 rounded-full hover:text-[#c81e1e] hover:border-[rgba(200,30,30,0.2)] transition-colors">
                                {question.topic.name}
                            </Link>
                        )}
                    </div>

                    <h1 className="text-xl md:text-2xl font-semibold text-white/90 leading-snug mb-4">
                        {question.title}
                    </h1>

                    <div className="mb-6">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {question.content}
                        </ReactMarkdown>
                    </div>

                    {/* Meta + vote row */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] flex-wrap gap-3">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            {question.author?.avatar_url ? (
                                <img src={question.author.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                                    <User size={11} className="text-white/30" />
                                </div>
                            )}
                            <Link href={`/profile/${question.author?.username}`} className="text-[12px] text-white/50 hover:text-[#c81e1e] transition-colors">
                                {question.author?.username || 'Anonymous'}
                            </Link>
                            {question.author?.is_certified && (
                                <span className="font-[JetBrains_Mono,monospace] text-[9px] bg-[rgba(200,30,30,0.1)] text-[#c81e1e] px-1.5 py-0.5 rounded-full border border-[rgba(200,30,30,0.2)] flex items-center gap-0.5">
                                    <Award size={8} /> Certified
                                </span>
                            )}
                            <span className="text-white/20 font-[JetBrains_Mono,monospace] text-[9px]">
                                {new Date(question.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                            </span>
                        </div>

                        {/* Vote + stats */}
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-white/20 font-[JetBrains_Mono,monospace] text-[10px]">
                                <Eye size={12} /> {question.view_count || 0}
                            </span>
                            <button
                                onClick={() => handleVoteQuestion('up')}
                                disabled={!user}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-[JetBrains_Mono,monospace] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    questionVote === 'up'
                                        ? 'bg-[rgba(200,30,30,0.2)] text-[#c81e1e] border-[rgba(200,30,30,0.4)]'
                                        : 'bg-[rgba(200,30,30,0.08)] text-[#c81e1e] border-[rgba(200,30,30,0.2)] hover:bg-[rgba(200,30,30,0.16)]'
                                }`}
                            >
                                <ChevronUp size={13} /> {question.upvote_count || 0}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Answers header ── */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.12em] text-white/40 flex items-center gap-2">
                        <MessageSquare size={13} className="text-[#c81e1e]" />
                        {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                    </h2>
                    <Link href="/t"
                        className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/25 hover:text-white/50 border border-white/[0.06] hover:border-white/[0.12] px-2.5 py-1 rounded-full transition-colors"
                    >
                        Discuss on /t/ →
                    </Link>
                </div>

                {/* ── Answers list ── */}
                {answersLoading ? (
                    <div className="py-10 flex justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-white/[0.12] border-t-[#c81e1e] animate-spin" />
                    </div>
                ) : answers.length === 0 ? (
                    <div className="py-10 text-center bg-[#0f0f0f] border border-white/[0.06] rounded-2xl mb-4">
                        <MessageSquare size={28} className="mx-auto text-white/15 mb-3" />
                        <p className="text-white/30 text-sm">No answers yet. Be the first to answer!</p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-4">
                        {answers.map(answer => (
                            <AnswerCard
                                key={answer.id}
                                answer={answer}
                                vote={getAnswerVote(answer.id)}
                                onVote={(voteType) => handleVoteAnswer(answer.id, voteType)}
                                canAccept={isQuestionAuthor && !answer.is_accepted}
                                onAccept={() => handleAcceptAnswer(answer.id)}
                                isLoggedIn={!!user}
                                mdComponents={mdComponents}
                            />
                        ))}
                    </div>
                )}

                {/* ── Answer form ── */}
                {user && isCertified ? (
                    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-5">
                        <h3 className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.12em] text-white/40 mb-4 flex items-center gap-2">
                            <Send size={12} className="text-[#c81e1e]" /> Your Answer
                        </h3>

                        {submitSuccess && (
                            <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 px-3 py-2 rounded-xl text-xs font-[JetBrains_Mono,monospace] mb-4">
                                <CheckCircle size={13} /> Submitted — will appear after admin approval.
                            </div>
                        )}
                        {submitError && (
                            <div className="flex items-center gap-2 bg-[rgba(200,30,30,0.1)] border border-[rgba(200,30,30,0.25)] text-[#c81e1e] px-3 py-2 rounded-xl text-xs mb-4">
                                <AlertCircle size={13} /> {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitAnswer}>
                            <textarea
                                value={answerContent}
                                onChange={e => setAnswerContent(e.target.value)}
                                placeholder="Write your answer… Markdown is supported."
                                className="w-full bg-[#090909] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white/80 placeholder-white/20 min-h-[180px] mb-3 focus:outline-none focus:border-[rgba(200,30,30,0.4)] transition-all resize-y font-[Hanken_Grotesk,sans-serif]"
                                disabled={submitting}
                            />
                            <div className="flex items-center justify-between">
                                <span className={`font-[JetBrains_Mono,monospace] text-[9px] ${answerContent.length < 50 ? 'text-[#c81e1e]' : 'text-white/20'}`}>
                                    {answerContent.length}/50 min
                                </span>
                                <button
                                    type="submit"
                                    disabled={submitting || answerContent.length < 50}
                                    className="flex items-center gap-2 bg-[#c81e1e] hover:bg-[#e02424] text-white px-5 py-2 rounded-xl text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Submit Answer
                                </button>
                            </div>
                        </form>
                    </div>
                ) : user ? (
                    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 text-center">
                        <Award size={28} className="mx-auto text-white/15 mb-3" />
                        <p className="text-white/40 text-sm mb-1">Only certified users can answer questions.</p>
                        <p className="text-white/20 text-xs">Contact an admin to get certified.</p>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 text-center">
                        <User size={28} className="mx-auto text-white/15 mb-3" />
                        <p className="text-white/40 text-sm">Log in to answer this question.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AnswerCard = ({ answer, vote, onVote, canAccept, onAccept, isLoggedIn, mdComponents }) => (
    <div className={`bg-[#0f0f0f] border rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.2)] ${
        answer.is_accepted
            ? 'border-emerald-800/40 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
            : 'border-white/[0.06]'
    }`}>
        {answer.is_accepted && (
            <div className="flex items-center gap-2 text-emerald-400 font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-wider mb-3 pb-3 border-b border-emerald-900/30">
                <CheckCircle size={12} /> Accepted Answer
            </div>
        )}
        {answer.status === 'pending' && (
            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/30 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-[JetBrains_Mono,monospace] mb-3">
                <Clock size={11} /> Awaiting approval
            </div>
        )}

        <div className="flex gap-4">
            {/* Vote column */}
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <button
                    onClick={() => onVote('up')}
                    disabled={!isLoggedIn}
                    className={`p-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        vote === 'up' ? 'bg-[rgba(200,30,30,0.2)] text-[#c81e1e]' : 'text-white/25 hover:text-[#c81e1e] hover:bg-[rgba(200,30,30,0.08)]'
                    }`}
                >
                    <ChevronUp size={16} />
                </button>
                <span className="font-[JetBrains_Mono,monospace] text-[11px] text-white/50 font-medium">
                    {(answer.upvote_count || 0) - (answer.downvote_count || 0)}
                </span>
                <button
                    onClick={() => onVote('down')}
                    disabled={!isLoggedIn}
                    className={`p-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        vote === 'down' ? 'bg-[rgba(200,30,30,0.2)] text-[#c81e1e]' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]'
                    }`}
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {answer.content}
                    </ReactMarkdown>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        {answer.author?.avatar_url ? (
                            <img src={answer.author.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
                                <User size={9} className="text-white/30" />
                            </div>
                        )}
                        <Link href={`/profile/${answer.author?.username}`} className="text-[12px] text-white/50 hover:text-[#c81e1e] transition-colors">
                            {answer.author?.username || 'Anonymous'}
                        </Link>
                        {answer.is_expert_answer && (
                            <span className="flex items-center gap-0.5 font-[JetBrains_Mono,monospace] text-[9px] bg-[rgba(200,30,30,0.1)] text-[#c81e1e] px-1.5 py-0.5 rounded-full border border-[rgba(200,30,30,0.2)]">
                                <Award size={8} /> Certified
                            </span>
                        )}
                        <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
                            {new Date(answer.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                        </span>
                    </div>
                    {canAccept && (
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-400 rounded-xl text-[10px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-colors"
                        >
                            <CheckCircle size={11} /> Accept
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default KnowledgeQuestionPage;
