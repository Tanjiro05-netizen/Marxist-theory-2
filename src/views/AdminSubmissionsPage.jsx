import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Download, Eye, CheckCircle, XCircle, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminSubmissionsPage = () => {
    const router = useRouter();
    const { user, isAdmin: isAdminUser } = useAuth();
    
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [categories, setCategories] = useState({});
    const [tags, setTags] = useState({});
    
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmItemId, setConfirmItemId] = useState(null);
    const [processingAction, setProcessingAction] = useState(false);
    
    // Check if user is admin and redirect if not
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                router.push('/login');
                return;
            }
            
            if (isAdminUser()) {
                setIsAdmin(true);
                fetchSubmissions();
                fetchCategories();
                fetchTags();
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();
                    
                if (error) throw error;
                
                if (data?.is_admin !== true) {
                    router.push('/');
                    return;
                }
                
                setIsAdmin(true);
                fetchSubmissions();
                fetchCategories();
                fetchTags();
                
            } catch (err) {
                console.error("Error checking admin status:", err);
                router.push('/');
            }
        };
        
        checkAdmin();
    }, [user, isAdminUser, router]);
    
    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('article_submissions')
                .select(`
                    *,
                    profiles:user_id (username)
                `)
                .order('submitted_at', { ascending: false });
                
            if (error) throw error;
            
            setSubmissions(data || []);
        } catch (err) {
            console.error("Error fetching submissions:", err);
            setError("Failed to load submissions");
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('theory_categories')
                .select('id, name');
                
            if (error) throw error;
            
            const categoryMap = {};
            data.forEach(cat => {
                categoryMap[cat.id] = cat.name;
            });
            
            setCategories(categoryMap);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };
    
    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('theory_tags')
                .select('id, name');
                
            if (error) throw error;
            
            const tagsMap = {};
            data.forEach(tag => {
                tagsMap[tag.id] = tag.name;
            });
            
            setTags(tagsMap);
        } catch (err) {
            console.error("Error fetching tags:", err);
        }
    };
    
    const handleDownload = async (submission) => {
        try {
            const { data, error } = await supabase.storage
                .from('manuscripts')
                .download(submission.file_path);
                
            if (error) throw error;
            
            // Create a download link
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = submission.file_path.split('/').pop() || 'manuscript';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading file:", err);
            alert("Failed to download file");
        }
    };
    
    const handlePreview = async (submission) => {
        try {
            const { data, error } = await supabase.storage
                .from('manuscripts')
                .createSignedUrl(submission.file_path, 60); // 60 seconds expiry
                
            if (error) throw error;
            
            window.open(data.signedUrl, '_blank');
        } catch (err) {
            console.error("Error creating preview URL:", err);
            alert("Failed to preview file");
        }
    };
    
    const confirmDelete = (submissionId) => {
        setConfirmItemId(submissionId);
        setConfirmAction('delete');
        setShowConfirmModal(true);
    };
    
    const confirmApprove = (submissionId) => {
        setConfirmItemId(submissionId);
        setConfirmAction('approve');
        setShowConfirmModal(true);
    };
    
    const confirmReject = (submissionId) => {
        setConfirmItemId(submissionId);
        setConfirmAction('reject');
        setShowConfirmModal(true);
    };
    
    const handleDelete = async () => {
        if (!confirmItemId) return;
        
        setProcessingAction(true);
        try {
            // Find the submission to get its file path
            const submission = submissions.find(s => s.id === confirmItemId);
            
            if (submission) {
                // Delete the file from storage
                await supabase.storage
                    .from('manuscripts')
                    .remove([submission.file_path]);
            }
            
            // Delete the submission record
            const { error } = await supabase
                .from('article_submissions')
                .delete()
                .eq('id', confirmItemId);
                
            if (error) throw error;
            
            // Update local state
            setSubmissions(submissions.filter(s => s.id !== confirmItemId));
            setShowConfirmModal(false);
        } catch (err) {
            console.error("Error deleting submission:", err);
            alert("Failed to delete submission");
        } finally {
            setProcessingAction(false);
            setConfirmItemId(null);
        }
    };
    
    const handleApprove = async () => {
        if (!confirmItemId) return;
        
        setProcessingAction(true);
        try {
            // Find the submission to get its details
            const submission = submissions.find(s => s.id === confirmItemId);
            
            if (!submission) return;
            
            // Create a new article in theory_articles
            const { error } = await supabase
                .from('theory_articles')
                .insert({
                    title: submission.title,
                    slug: createSlug(submission.title),
                    excerpt: submission.abstract,
                    content: '', // This would need to be extracted from the document
                    category_id: submission.category_id,
                    is_featured: false,
                    collection: null, // Could be added as a field in the submission form
                    estimated_time_min: estimateReadingTime(submission.abstract),
                    author_id: submission.user_id,
                    file_path: submission.file_path,
                    status: 'published',
                    description: submission.abstract // Adding this field as it's required
                });
                
            if (error) throw error;
            
            // Update the submission status
            await supabase
                .from('article_submissions')
                .update({ status: 'approved' })
                .eq('id', confirmItemId);
                
            // Update local state
            setSubmissions(submissions.map(s => 
                s.id === confirmItemId 
                    ? { ...s, status: 'approved' }
                    : s
            ));
            
            setShowConfirmModal(false);
        } catch (err) {
            console.error("Error approving submission:", err);
            alert("Failed to approve submission");
        } finally {
            setProcessingAction(false);
            setConfirmItemId(null);
        }
    };
    
    const handleReject = async () => {
        if (!confirmItemId) return;
        
        setProcessingAction(true);
        try {
            // Update the submission status
            const { error } = await supabase
                .from('article_submissions')
                .update({ status: 'rejected' })
                .eq('id', confirmItemId);
                
            if (error) throw error;
            
            // Update local state
            setSubmissions(submissions.map(s => 
                s.id === confirmItemId 
                    ? { ...s, status: 'rejected' }
                    : s
            ));
            
            setShowConfirmModal(false);
        } catch (err) {
            console.error("Error rejecting submission:", err);
            alert("Failed to reject submission");
        } finally {
            setProcessingAction(false);
            setConfirmItemId(null);
        }
    };
    
    // Helper function to create a URL-friendly slug
    const createSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };
    
    // Helper function to estimate reading time
    const estimateReadingTime = (text) => {
        const wordsPerMinute = 200;
        const wordCount = text?.split(/\s+/).length || 0;
        return Math.ceil(wordCount / wordsPerMinute) || 1;
    };
    
    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved':
                return <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs">Rejected</span>;
            default:
                return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-xs">Pending</span>;
        }
    };
    
    const handleConfirmAction = () => {
        switch(confirmAction) {
            case 'delete':
                handleDelete();
                break;
            case 'approve':
                handleApprove();
                break;
            case 'reject':
                handleReject();
                break;
            default:
                setShowConfirmModal(false);
        }
    };
    
    if (!isAdmin) return null;
    
    return (
        <div className="min-h-screen bg-[#12131A] text-white">
            <Header />
            <main className="pt-24 pb-16 max-w-7xl mx-auto px-4">
                <h1 className="text-4xl font-bold mb-8">Article Submissions</h1>
                
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <div className="bg-red-900/20 p-4 rounded-lg text-red-400 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span>{error}</span>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="bg-black/30 p-8 rounded-lg text-center">
                        <p className="text-gray-400">No submissions to review at this time.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800 text-left">
                                    <th className="p-4 text-gray-400 font-medium">Title</th>
                                    <th className="p-4 text-gray-400 font-medium">Author</th>
                                    <th className="p-4 text-gray-400 font-medium">Category</th>
                                    <th className="p-4 text-gray-400 font-medium">Tags</th>
                                    <th className="p-4 text-gray-400 font-medium">Submitted</th>
                                    <th className="p-4 text-gray-400 font-medium">Status</th>
                                    <th className="p-4 text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((submission) => (
                                    <tr key={submission.id} className="border-b border-gray-800 hover:bg-black/30">
                                        <td className="p-4">
                                            <div className="font-medium">{submission.title}</div>
                                            <div className="text-gray-400 text-sm mt-1 line-clamp-2">{submission.abstract}</div>
                                        </td>
                                        <td className="p-4">
                                            <div>{submission.profiles?.username || 'Unknown'}</div>
                                        </td>
                                        <td className="p-4">
                                            {categories[submission.category_id] || 'Unknown'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {submission.tag_ids?.map(tagId => (
                                                    <span key={tagId} className="px-2 py-1 bg-gray-800 rounded-full text-xs">
                                                        {tags[tagId] || 'Unknown'}
                                                    </span>
                                                )) || 'None'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {new Date(submission.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(submission.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleDownload(submission)}
                                                    className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-full"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handlePreview(submission)}
                                                    className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                
                                                {submission.status !== 'approved' && (
                                                    <button 
                                                        onClick={() => confirmApprove(submission.id)}
                                                        className="p-2 text-green-400 hover:bg-green-900/20 rounded-full"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                
                                                {submission.status !== 'rejected' && (
                                                    <button 
                                                        onClick={() => confirmReject(submission.id)}
                                                        className="p-2 text-yellow-500 hover:bg-yellow-900/20 rounded-full"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => confirmDelete(submission.id)}
                                                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-full"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
            
            <ConfirmationModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmAction}
                title={
                    confirmAction === 'delete' ? 'Delete Submission' :
                    confirmAction === 'approve' ? 'Approve Submission' :
                    'Reject Submission'
                }
                message={
                    confirmAction === 'delete' ? 'Are you sure you want to delete this submission? This action cannot be undone.' :
                    confirmAction === 'approve' ? 'Are you sure you want to approve this submission? This will publish the article to the site.' :
                    'Are you sure you want to reject this submission?'
                }
                confirmText={
                    confirmAction === 'delete' ? 'Delete' :
                    confirmAction === 'approve' ? 'Approve' :
                    'Reject'
                }
                confirmButtonClass={
                    confirmAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirmAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                }
                isProcessing={processingAction}
            />
        </div>
    );
};

export default AdminSubmissionsPage;
