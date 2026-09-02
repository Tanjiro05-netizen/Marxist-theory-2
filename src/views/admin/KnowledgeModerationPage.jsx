import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { knowledgeApiService } from '../../components/Knowledge/api';
import { CheckCircle, XCircle, Clock, MessageSquare, HelpCircle, User, Loader2, AlertTriangle, Tag } from 'lucide-react';
import Link from 'next/link';

const KnowledgeModerationPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('questions');
    const [pendingQuestions, setPendingQuestions] = useState([]);
    const [pendingAnswers, setPendingAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        const [questions, answers] = await Promise.all([
            knowledgeApiService.getPendingQuestions(),
            knowledgeApiService.getPendingAnswers(),
        ]);
        setPendingQuestions(questions);
        setPendingAnswers(answers);
        setLoading(false);
    };

    const handleApproveQuestion = async (questionId) => {
        setActionLoading(questionId);
        const result = await knowledgeApiService.approveQuestion(questionId, user.id);
        if (result.success) {
            setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        }
        setActionLoading(null);
    };

    const handleRejectQuestion = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        const result = await knowledgeApiService.rejectQuestion(rejectModal.id, rejectReason);
        if (result.success) {
            setPendingQuestions(prev => prev.filter(q => q.id !== rejectModal.id));
        }
        setRejectModal(null);
        setRejectReason('');
        setActionLoading(null);
    };

    const handleApproveAnswer = async (answerId) => {
        setActionLoading(answerId);
        const result = await knowledgeApiService.approveAnswer(answerId, user.id);
        if (result.success) {
            setPendingAnswers(prev => prev.filter(a => a.id !== answerId));
        }
        setActionLoading(null);
    };

    const handleRejectAnswer = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        const result = await knowledgeApiService.rejectAnswer(rejectModal.id, rejectReason);
        if (result.success) {
            setPendingAnswers(prev => prev.filter(a => a.id !== rejectModal.id));
        }
        setRejectModal(null);
        setRejectReason('');
        setActionLoading(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Knowledge Moderation</h1>
                        <p className="text-gray-400 mt-1">Review and approve questions and answers</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/knowledge/topics"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-none transition-colors text-sm"
                        >
                            <Tag size={16} /> Manage Topics
                        </Link>
                        <button
                            onClick={fetchPending}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-none transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6 border-b border-gray-700 pb-4">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-none transition-colors ${
                            activeTab === 'questions' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        <HelpCircle size={18} />
                        Questions ({pendingQuestions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('answers')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-none transition-colors ${
                            activeTab === 'answers' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        <MessageSquare size={18} />
                        Answers ({pendingAnswers.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin mr-2" size={24} />
                        <span className="text-gray-400">Loading pending items...</span>
                    </div>
                ) : (
                    <>
                        {/* Questions Tab */}
                        {activeTab === 'questions' && (
                            <div className="space-y-4">
                                {pendingQuestions.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-800/50 rounded-none">
                                        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                                        <p className="text-gray-400">No pending questions to review</p>
                                    </div>
                                ) : (
                                    pendingQuestions.map(question => (
                                        <div key={question.id} className="bg-gray-800/50 rounded-none p-6 border border-gray-700">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                                        {question.author?.avatar_url ? (
                                                            <img src={question.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <User size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{question.author?.username || 'Anonymous'}</span>
                                                            {question.author?.is_certified && (
                                                                <span className="px-2 py-0.5 bg-blue-600 text-xs rounded-full">Certified</span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(question.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {question.topic && (
                                                    <span className="px-3 py-1 bg-gray-700 text-sm rounded-full">
                                                        {question.topic.name}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-semibold mb-3">{question.title}</h3>
                                            <p className="text-gray-300 whitespace-pre-wrap mb-6">{question.content}</p>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApproveQuestion(question.id)}
                                                    disabled={actionLoading === question.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-none transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === question.id ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ type: 'question', id: question.id, title: question.title })}
                                                    disabled={actionLoading === question.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-none transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Answers Tab */}
                        {activeTab === 'answers' && (
                            <div className="space-y-4">
                                {pendingAnswers.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-800/50 rounded-none">
                                        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                                        <p className="text-gray-400">No pending answers to review</p>
                                    </div>
                                ) : (
                                    pendingAnswers.map(answer => (
                                        <div key={answer.id} className="bg-gray-800/50 rounded-none p-6 border border-gray-700">
                                            <div className="bg-gray-900/50 rounded-none p-3 mb-4">
                                                <span className="text-sm text-gray-500">Answer to:</span>
                                                <p className="text-red-400 font-medium">{answer.question?.title || 'Unknown question'}</p>
                                            </div>

                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                                        {answer.author?.avatar_url ? (
                                                            <img src={answer.author.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <User size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{answer.author?.username || 'Anonymous'}</span>
                                                            {answer.author?.is_certified && (
                                                                <span className="px-2 py-0.5 bg-blue-600 text-xs rounded-full">Certified</span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(answer.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-300 whitespace-pre-wrap mb-6">{answer.content}</p>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApproveAnswer(answer.id)}
                                                    disabled={actionLoading === answer.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-none transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === answer.id ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setRejectModal({ type: 'answer', id: answer.id, title: 'this answer' })}
                                                    disabled={actionLoading === answer.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-none transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={18} />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Reject Modal */}
                {rejectModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-none p-6 max-w-md w-full">
                            <div className="flex items-center gap-2 mb-4 text-red-400">
                                <AlertTriangle size={24} />
                                <h3 className="text-xl font-semibold">Reject {rejectModal.type}</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                You are rejecting: <span className="text-white">{rejectModal.title}</span>
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection (optional)..."
                                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-none text-white mb-4 min-h-[100px]"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={rejectModal.type === 'question' ? handleRejectQuestion : handleRejectAnswer}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-none transition-colors disabled:opacity-50"
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-none transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeModerationPage;
