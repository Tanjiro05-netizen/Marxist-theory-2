import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Send, CornerDownRight, Trash2, Edit2, X, Check, CheckCircle } from 'lucide-react';

const CommentItem = ({ comment, onReply, onDelete, onUpdate, currentUserId, isAdmin }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canModify = currentUserId === comment.user_id || isAdmin;

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        const result = await onReply(replyContent, comment.section_id, comment.id);
        setIsSubmitting(false);

        if (!result.error) {
            setReplyContent('');
            setShowReplyForm(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }

        setIsSubmitting(true);
        const result = await onUpdate(comment.id, editContent);
        setIsSubmitting(false);

        if (!result.error) {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Delete this comment?')) {
            await onDelete(comment.id);
        }
    };

    return (
        <div className="group">
            <div className="flex gap-3">
                <img
                    src={comment.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${comment.user_id}`}
                    alt=""
                    className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                            {comment.author?.username || 'Anonymous'}
                        </span>
                        {comment.author?.is_certified && (
                            <span className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                                <CheckCircle size={10} />
                                Certified
                            </span>
                        )}
                        <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-none p-2 text-sm text-white resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={isSubmitting}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs flex items-center gap-1"
                                >
                                    <Check size={12} />
                                    Save
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
                                >
                                    <X size={12} />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                <CornerDownRight size={12} />
                                Reply
                            </button>
                            {canModify && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        <Edit2 size={12} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
                                    >
                                        <Trash2 size={12} />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm && (
                        <form onSubmit={handleReplySubmit} className="mt-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !replyContent.trim()}
                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-none"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Nested Replies */}
                    {comment.replies?.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-700/50 space-y-4">
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    onReply={onReply}
                                    onDelete={onDelete}
                                    onUpdate={onUpdate}
                                    currentUserId={currentUserId}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SectionComments = ({
    comments,
    loading,
    sectionId,
    onAddComment,
    onDeleteComment,
    onUpdateComment,
}) => {
    const { user, isAdmin } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredComments = sectionId
        ? comments.filter(c => c.section_id === sectionId)
        : comments;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsSubmitting(true);
        const result = await onAddComment(newComment, sectionId);
        setIsSubmitting(false);

        if (!result.error) {
            setNewComment('');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-white flex items-center gap-2">
                    <MessageSquare size={16} className="text-red-500" />
                    Comments
                    {sectionId && <span className="text-xs text-gray-500">§{sectionId}</span>}
                </h4>
                <span className="text-xs text-gray-500">
                    {filteredComments.length} {filteredComments.length === 1 ? 'comment' : 'comments'}
                </span>
            </div>

            {/* New Comment Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-none p-3 text-sm text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-none text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Send size={14} />
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            ) : (
                <p className="text-gray-500 text-sm py-4 text-center bg-gray-800/30 rounded-none">
                    Log in to join the discussion
                </p>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading comments...</div>
            ) : filteredComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to share your thoughts!
                </div>
            ) : (
                <div className="space-y-6 mt-4">
                    {filteredComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={onAddComment}
                            onDelete={onDeleteComment}
                            onUpdate={onUpdateComment}
                            currentUserId={user?.id}
                            isAdmin={isAdmin?.()}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SectionComments;
