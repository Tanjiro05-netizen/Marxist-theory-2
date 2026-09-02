import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { User, Image, Shield, CheckCircle, ArrowLeft, FileText, MessageSquare, Repeat2, Loader2, Users } from 'lucide-react';
import { forumApiService } from '../components/Forum/api';
import { formatDate } from '../components/Forum/utils/formatters';
import FollowButton from '../components/Social/FollowButton';
import * as s from './PublicProfilePage.css.ts';

const PublicProfilePage = () => {
    const { t } = useTranslation();
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
                    <div className={s.loadingText}>{t('profile.loadingProfile')}</div>
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
                        <h1 className={s.notFoundTitle}>{t('profile.userNotFound')}</h1>
                        <p className={s.notFoundText}>
                            {t('profile.userUnavailable', { username })}
                        </p>
                        <Link href="/" className={s.backBtn}>
                            <ArrowLeft size={18} style={{marginRight:8}} />
                            {t('profile.goBackHome')}
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
                            alt={t('profile.profileBanner')}
                            className="w-full h-full object-cover rounded-t-lg"
                        />
                    ) : (
                        <div className="text-center text-gray-600">
                            <Image size={48} className="mx-auto opacity-50" />
                        </div>
                    )}
                </div>

                <div className="relative bg-gray-800/50 backdrop-blur-sm p-8 rounded-b-lg shadow-none">
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
                                        <CheckCircle size={14} className="mr-1"/> {t('profile.certified')}
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
                                <strong className="text-white">{profile.follower_count || 0}</strong> {t('profile.followerLabel', { count: profile.follower_count || 0 })}
                            </span>
                            <span>
                                <strong className="text-white">{profile.following_count || 0}</strong> {t('profile.followingLabel', { count: profile.following_count || 0 })}
                            </span>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">{t('profile.bio')}</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}

                        {/* Ideology */}
                        {profile.ideology && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                                    <Shield size={16} className="mr-2" /> {t('profile.ideology')}
                                </h3>
                                <p className="text-gray-300">{profile.ideology}</p>
                            </div>
                        )}

                        {/* Empty state if no bio or ideology */}
                        {!profile.bio && !profile.ideology && (
                            <p className="text-gray-500 italic">{t('profile.noPublicInfo')}</p>
                        )}
                    </div>
                </div>

                {/* Public Activity Tabs */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6">{t('profile.activity')}</h2>
                    
                    {/* Tab Navigation - Only public tabs (no likes/bookmarks) */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-none transition-colors ${activeTab === 'posts' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <FileText size={16} />
                            {t('profile.postsCount', { count: forumPosts.length })}
                        </button>
                        <button
                            onClick={() => setActiveTab('replies')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-none transition-colors ${activeTab === 'replies' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <MessageSquare size={16} />
                            {t('profile.repliesCount', { count: forumReplies.length })}
                        </button>
                        <button
                            onClick={() => setActiveTab('reposts')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-none transition-colors ${activeTab === 'reposts' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <Repeat2 size={16} />
                            {t('profile.repostsCount', { count: forumReposts.length })}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {loadingActivity ? (
                        <div className="text-center py-12 bg-gray-800/50 rounded-none">
                            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                            <p className="text-gray-400">{t('profile.loadingActivity')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Posts Tab */}
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {forumPosts.length > 0 ? forumPosts.map(post => (
                                        <Link href="/feed?section=boards" key={post.id} className="block bg-gray-800/50 rounded-none p-4 hover:bg-gray-800/80 transition-colors">
                                            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-2">{post.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>/{post.category_slug}/</span>
                                                <span>{t('forum.replyCount', { count: post.comment_count || 0 })}</span>
                                                <span>♥ {post.like_count}</span>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-none">
                                            <p className="text-gray-400">{t('profile.noPosts')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Replies Tab */}
                            {activeTab === 'replies' && (
                                <div className="space-y-4">
                                    {forumReplies.length > 0 ? forumReplies.map(reply => (
                                        <Link href="/feed?section=boards" key={reply.id} className="block bg-gray-800/50 rounded-none p-4 hover:bg-gray-800/80 transition-colors">
                                            <div className="text-xs text-gray-500 mb-2">
                                                {t('profile.replyIn')} <span className="text-red-400">{reply.thread?.title || t('profile.unknownThread')}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm line-clamp-3">{reply.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                <span>♥ {reply.like_count}</span>
                                                <span>{formatDate(reply.created_at, false)}</span>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-none">
                                            <p className="text-gray-400">{t('profile.noReplies')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reposts Tab */}
                            {activeTab === 'reposts' && (
                                <div className="space-y-4">
                                    {forumReposts.length > 0 ? forumReposts.map(repost => (
                                        <Link href="/feed?section=boards" key={repost.id} className="block bg-gray-800/50 rounded-none p-4 hover:bg-gray-800/80 transition-colors">
                                            {repost.quote_content && (
                                                <div className="border-l-4 border-red-500 pl-3 mb-3 italic text-gray-400 text-sm">
                                                    "{repost.quote_content}"
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mb-1">{t('profile.repostedFrom', { username: repost.thread?.author?.username || t('social.anonymousHandle') })}</div>
                                            <h3 className="text-lg font-semibold text-white mb-2">{repost.thread?.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2">{repost.thread?.content}</p>
                                        </Link>
                                    )) : (
                                        <div className="text-center py-12 bg-gray-800/50 rounded-none">
                                            <p className="text-gray-400">{t('profile.noReposts')}</p>
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
                        {t('profile.goBack')}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PublicProfilePage;
