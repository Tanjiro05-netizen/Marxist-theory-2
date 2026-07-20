import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { User, Image, Shield, CheckCircle, ArrowLeft, FileText, MessageSquare, Repeat2, Loader2, Users } from 'lucide-react';
import { forumApiService } from '../components/Forum/api';
import FollowButton from '../components/Social/FollowButton';
import * as s from './PublicProfilePage.css.ts';

const PublicProfilePage = () => {
    const { username } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [forumPosts, setForumPosts] = useState([]);
    const [forumReplies, setForumReplies] = useState([]);
    const [forumReposts, setForumReposts] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, bio, ideology, avatar_url, banner_url, is_certified, role, follower_count, following_count')
                    .eq('username', username)
                    .single();

                if (error || !data) {
                    setNotFound(true);
                } else {
                    // If viewing own profile, redirect to editable profile page
                    if (user && data.id === user.id) {
                        router.replace('/profile');
                        return;
                    }
                    setProfile(data);
                    
                    // Fetch public forum activity
                    setLoadingActivity(true);
                    try {
                        const [posts, replies, reposts] = await Promise.all([
                            forumApiService.getUserThreads(data.id),
                            forumApiService.getUserComments(data.id),
                            forumApiService.getUserReposts(data.id),
                        ]);
                        setForumPosts(posts || []);
                        setForumReplies(replies || []);
                        setForumReposts(reposts || []);
                    } catch (err) {
                        console.error('Error fetching forum activity:', err);
                    } finally {
                        setLoadingActivity(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, user, router]);

    const handleFollowChange = (following) => {
        setProfile((current) => {
            if (!current) return current;
            const followerCount = Math.max(0, (current.follower_count || 0) + (following ? 1 : -1));
            return { ...current, follower_count: followerCount };
        });
    };

    if (loading) {
        return (
            <div className={s.page}>
                <div className={s.loadingWrap}>
                    <div className={s.loadingText}>Loading profile...</div>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className={s.page}>
                <main className={s.main}>
                    <div className={s.notFoundWrap}>
                        <User size={64} className={s.notFoundIcon} />
                        <h1 className={s.notFoundTitle}>User Not Found</h1>
                        <p className={s.notFoundText}>
                            The user "{username}" doesn't exist or their profile is not available.
                        </p>
                        <Link href="/" className={s.backBtn}>
                            <ArrowLeft size={18} style={{marginRight:8}} />
                            Go Back Home
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <main className={s.main}>
                {/* Banner */}
                <div className="relative h-48 bg-gray-800 rounded-t-lg flex items-center justify-center">
                    {profile.banner_url ? (
                        <img 
                            src={profile.banner_url} 
                            alt="Profile Banner" 
                            className="w-full h-full object-cover rounded-t-lg"
                        />
                    ) : (
                        <div className="text-center text-gray-600">
                            <Image size={48} className="mx-auto opacity-50" />
                        </div>
                    )}
                </div>

                <div className="relative bg-gray-800/50 backdrop-blur-sm p-8 rounded-b-lg shadow-lg">
                    {/* Profile Picture */}
                    <div className="absolute -top-16 left-8 w-32 h-32 bg-gray-700 rounded-full border-4 border-gray-900 flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                            <img 
                                src={profile.avatar_url} 
                                alt={profile.username} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User size={40} className="text-gray-500" />
                        )}
                    </div>

                    <div className="mt-16">
                        {/* Username and badges */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
                                {profile.is_certified && (
                                    <span className="flex items-center bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                        <CheckCircle size={14} className="mr-1"/> Certified
                                    </span>
                                )}
                                {profile.role === 'admin' && (
                                    <span className="flex items-center bg-red-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                        <Shield size={14} className="mr-1"/> Admin
                                    </span>
                                )}
                            </div>
                            <FollowButton
                                targetUserId={profile.id}
                                currentUserId={user?.id}
                                onChange={handleFollowChange}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
                            <span className="inline-flex items-center gap-2">
                                <Users size={16} />
                                <strong className="text-white">{profile.follower_count || 0}</strong> followers
                            </span>
                            <span>
                                <strong className="text-white">{profile.following_count || 0}</strong> following
                            </span>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Bio</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}

                        {/* Ideology */}
                        {profile.ideology && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                                    <Shield size={16} className="mr-2" /> Ideology
                                </h3>
                                <p className="text-gray-300">{profile.ideology}</p>
                            </div>
                        )}

                        {/* Empty state if no bio or ideology */}
                        {!profile.bio && !profile.ideology && (
                            <p className="text-gray-500 italic">This user hasn't added any profile information yet.</p>
                        )}
                    </div>
                </div>

                {/* Public Activity Tabs */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Activity</h2>
                    
                    {/* Tab Navigation - Only public tabs (no likes/bookmarks) */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'posts' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <FileText size={16} />
                            Posts ({forumPosts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('replies')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'replies' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <MessageSquare size={16} />
                            Replies ({forumReplies.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('reposts')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'reposts' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <Repeat2 size={16} />
                            Reposts ({forumReposts.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    {loadingActivity ? (
                        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                            <p className="text-gray-400">Loading activity...</p>
                        </div>
                    ) : (
                        <>
                            {/* Posts Tab */}
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {forumPosts.length > 0 ? forumPosts.map(post => (
                                        <Link href="/feed?section=boards" key={post.id} className="block bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
                                            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-2">{post.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>/{post.category_slug}/</span>
                                                <span>{post.comment_count} replies</span>
                                                <span>♥ {post.like_count}</span>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                                            <p className="text-gray-400">No posts yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Replies Tab */}
                            {activeTab === 'replies' && (
                                <div className="space-y-4">
                                    {forumReplies.length > 0 ? forumReplies.map(reply => (
                                        <Link href="/feed?section=boards" key={reply.id} className="block bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
                                            <div className="text-xs text-gray-500 mb-2">
                                                Reply in: <span className="text-red-400">{reply.thread?.title || 'Unknown thread'}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm line-clamp-3">{reply.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                <span>♥ {reply.like_count}</span>
                                                <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                                            <p className="text-gray-400">No replies yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reposts Tab */}
                            {activeTab === 'reposts' && (
                                <div className="space-y-4">
                                    {forumReposts.length > 0 ? forumReposts.map(repost => (
                                        <Link href="/feed?section=boards" key={repost.id} className="block bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
                                            {repost.quote_content && (
                                                <div className="border-l-4 border-red-500 pl-3 mb-3 italic text-gray-400 text-sm">
                                                    "{repost.quote_content}"
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mb-1">Reposted from @{repost.thread?.author?.username || 'Anonymous'}</div>
                                            <h3 className="text-lg font-semibold text-white mb-2">{repost.thread?.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{repost.thread?.content}</p>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                                            <p className="text-gray-400">No reposts yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Back button */}
                <div className="mt-6">
                    <button 
                        onClick={() => router.back()}
                        className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Go Back
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PublicProfilePage;
