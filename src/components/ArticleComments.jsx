import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, CornerDownRight, Trash2, Quote, CheckCircle, Award } from 'lucide-react';
import QuoteSelectionModal from './QuoteSelectionModal';
import ConfirmationModal from './ConfirmationModal';



const Comment = ({ comment, onReply, userRole }) => {
    const { user } = useAuth();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const confirmDelete = async () => {
        console.log('🗑️ Starting comment deletion...');
        console.log('Comment ID to delete:', comment.id);
        console.log('Current user ID:', user?.id);
        console.log('Comment author ID:', comment.user_id);
        
        setIsDeleting(true);
        setIsConfirmModalOpen(false);
        
        try {
            const { data, error } = await supabase
                .from('theory_article_comments')
                .delete()
                .eq('id', comment.id);
            
            console.log('Delete operation result:', { data, error });
            
            if (error) {
                console.error('❌ Error deleting comment:', error);
                alert(`Failed to delete comment: ${error.message}`);
            } else {
                console.log('✅ Comment deleted successfully');
                onReply(); // Refreshes the comment list
            }
        } catch (err) {
            console.error('❌ Exception during delete:', err);
            alert(`Delete failed: ${err.message}`);
        }
        
        setIsDeleting(false);
    };

    return (
        <>
            <div className="flex flex-col space-y-2 p-4 bg-black/20 rounded-none">
                <div className="flex items-center space-x-3">
                    <img src={comment.author_avatar || `https://api.dicebear.com/8.x/identicon/svg?seed=${comment.user_id}`} alt="avatar" className="w-8 h-8 rounded-full bg-gray-700" />
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <span className="font-semibold text-white">{comment.author_name || 'Anonymous'}</span>
                            {comment.author_is_certified && (
                                <span className="ml-2 flex items-center bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    <CheckCircle size={12} className="mr-1" /> Certified
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <p className="text-gray-300 pl-11">{comment.content}</p>
                <div className="flex items-center space-x-4 pl-11 pt-1">
                    {user && (
                        <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-xs text-red-400 hover:text-red-300 flex items-center">
                            <CornerDownRight size={14} className="mr-1" />
                            Reply
                        </button>
                    )}
                    {user && (user.id === comment.user_id || userRole === 'admin') && (
                        <button onClick={() => setIsConfirmModalOpen(true)} disabled={isDeleting} className="text-xs text-gray-400 hover:text-red-500 flex items-center disabled:opacity-50">
                            <Trash2 size={14} className="mr-1" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    )}
                </div>
                {showReplyForm && (
                    <div className="pl-11 pt-2">
                        <CommentForm articleId={comment.article_id} parentId={comment.id} onCommentPosted={() => { onReply(); setShowReplyForm(false); }} />
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-6 border-l-2 border-gray-700/50 space-y-4">
                        {comment.replies.map(reply => <Comment key={reply.id} comment={reply} onReply={onReply} userRole={userRole} />)}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this comment? This action cannot be undone."
            />
        </> 
    );
};

const CommentForm = ({ articleId, parentId = null, onCommentPosted }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('theory_article_comments').insert({ 
                content: content,
                article_id: articleId,
                user_id: user.id,
                parent_comment_id: parentId
            });

            if (error) throw error;

            setContent('');
            if (onCommentPosted) {
                onCommentPosted();
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInsertQuote = (quote) => {
        const citation = `> ${quote.quote_text}\n> — *From [${quote.article.title}](/theory/article/${quote.article.slug})*\n\n`;
        setContent(prev => prev + citation);
        setIsQuoteModalOpen(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={parentId ? "Write a reply..." : "Join the discussion..."}
                    className="w-full bg-gray-800 border border-gray-700 rounded-none p-3 pr-28 text-white focus:ring-2 focus:ring-red-500 focus:outline-none resize-y min-h-[80px]"
                    rows="3"
                    required
                />
                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                     <button type="submit" disabled={isSubmitting} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 disabled:bg-gray-600">
                        <Send size={18} />
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="p-2 bg-gray-700 rounded-full text-white hover:bg-gray-600"
                        title="Cite a quote"
                    >
                        <Quote size={18} />
                    </button>
                </div>
            </div>
            {isQuoteModalOpen && 
                <QuoteSelectionModal 
                    onClose={() => setIsQuoteModalOpen(false)} 
                    onSelectQuote={handleInsertQuote} 
                />
            }
        </form>
    );
};

const ArticleComments = ({ articleId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [showOnlyCertified, setShowOnlyCertified] = useState(false);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user) {
                setUserRole(null);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore no-rows error
                    throw error;
                }
                
                if (data) {
                    setUserRole(data.is_admin ? 'admin' : null);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        fetchUserRole();
    }, [user]);

    const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('theory_article_comments')
            .select(`
                *,
                author:profiles!left(username, avatar_url, is_certified)
            `)
            .eq('article_id', articleId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            const processedComments = data.map(c => ({
                ...c,
                author_name: c.author?.username || null,
                author_avatar: c.author?.avatar_url,
                author_is_certified: c.author?.is_certified
            }));

            const commentsById = {};
            processedComments.forEach(c => commentsById[c.id] = { ...c, replies: [] });
            const nestedComments = [];
            processedComments.forEach(c => {
                if (c.parent_comment_id && commentsById[c.parent_comment_id]) {
                    commentsById[c.parent_comment_id].replies.push(commentsById[c.id]);
                } else {
                    nestedComments.push(commentsById[c.id]);
                }
            });
            setComments(nestedComments);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (articleId) fetchComments();
    }, [articleId]);

    const filteredComments = showOnlyCertified 
        ? comments.filter(comment => comment.author_is_certified)
        : comments;

    return (
        <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <MessageSquare className="w-8 h-8 mr-3 text-red-500" />
                Comments ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
            </h2>

            <div className="flex justify-between items-center mb-6">
                <CommentForm articleId={articleId} onCommentPosted={fetchComments} />
                <div className="flex items-center">
                    <label htmlFor="certified-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id="certified-toggle" className="sr-only" checked={showOnlyCertified} onChange={() => setShowOnlyCertified(!showOnlyCertified)} />
                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                        </div>
                        <div className="ml-3 text-gray-300 flex items-center">
                           <Award size={16} className="mr-2 text-blue-400"/> Show Certified Only
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                {loading ? (
                    <p className="text-gray-400">Loading comments...</p>
                ) : filteredComments.length > 0 ? (
                    filteredComments.map(comment => <Comment key={comment.id} comment={comment} onReply={fetchComments} userRole={userRole} />)
                ) : (
                    <p className="text-gray-400">Be the first to comment.</p>
                )}
            </div>
        </div>
    );
};

export default ArticleComments;
