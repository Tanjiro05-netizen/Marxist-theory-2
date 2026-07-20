import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Award, Cpu, Eye, Heart, Users, MessageSquare, TrendingUp, Star, Loader2, GraduationCap, Zap, BarChart2, User, Image as ImageIcon, Shield, CheckCircle, FileText, Repeat2, Bookmark, Camera, Pencil, X } from 'lucide-react';
import { knowledgeApiService } from '../components/Knowledge/api';
import { forumApiService } from '../components/Forum/api';
import * as s from './ProfilePage.css.ts';

// Level thresholds (same as Widgets.jsx)
const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, title: 'Newcomer' },
  { level: 2, min: 50, title: 'Contributor' },
  { level: 3, min: 200, title: 'Active' },
  { level: 4, min: 500, title: 'Established' },
  { level: 5, min: 1000, title: 'Influencer' },
  { level: 6, min: 2500, title: 'Expert' },
  { level: 7, min: 5000, title: 'Authority' },
  { level: 8, min: 10000, title: 'Master' },
  { level: 9, min: 25000, title: 'Legend' },
  { level: 10, min: 50000, title: 'Icon' },
];

const calculateLevel = (stats) => {
  const engagement = (stats.views || 0) + (stats.likes || 0) * 2 + (stats.follows || 0) * 5;
  let currentLevel = LEVEL_THRESHOLDS[0];
  
  for (const threshold of LEVEL_THRESHOLDS) {
    if (engagement >= threshold.min) {
      currentLevel = threshold;
    } else {
      break;
    }
  }
  
  const nextLevel = LEVEL_THRESHOLDS.find(t => t.min > engagement);
  const progress = nextLevel 
    ? Math.round(((engagement - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;
  
  return { ...currentLevel, engagement, progress, nextLevel };
};

const formatCount = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const ProfilePage = () => {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // Tab state
    const activeTab = searchParams.get('tab') || 'overview';
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [creatorStats, setCreatorStats] = useState({ views: 0, likes: 0, follows: 0, growth: 0 });
    const [contentCounts, setContentCounts] = useState({ questions: 0, answers: 0 });
    const [userQuestions, setUserQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [userFavorites, setUserFavorites] = useState([]);
    
    // Learning state
    const [learningLoading, setLearningLoading] = useState(false);
    const [enrollments, setEnrollments] = useState([]);
    const [stemXP, setStemXP] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [courseProgressMap, setCourseProgressMap] = useState({});

    // Profile header state
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileData, setProfileData] = useState({
        username: '', bio: '', ideology: '', avatar_url: null, banner_url: null,
        is_certified: false, role: 'user', follower_count: 0, following_count: 0,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', ideology: '' });
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [bannerUploading, setBannerUploading] = useState(false);
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    // Overview (posts/replies/reposts) state
    const [activitySubTab, setActivitySubTab] = useState('posts');
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [forumPosts, setForumPosts] = useState([]);
    const [forumReplies, setForumReplies] = useState([]);
    const [forumReposts, setForumReposts] = useState([]);

    // Bookmarks state
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);

    const setActiveTab = (tab) => {
        router.push(`${pathname}?tab=${encodeURIComponent(tab)}`);
    };

    // Fetch own profile (banner/avatar/bio/ideology/stats)
    useEffect(() => {
        const fetchOwnProfile = async () => {
            if (!user) { setProfileLoading(false); return; }
            setProfileLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, bio, ideology, avatar_url, banner_url, is_certified, role, follower_count, following_count')
                    .eq('id', user.id)
                    .single();
                if (!error && data) setProfileData(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchOwnProfile();
    }, [user]);

    // Fetch posts/replies/reposts for Overview tab
    useEffect(() => {
        const fetchActivity = async () => {
            if (activeTab !== 'overview' || !user) return;
            setLoadingActivity(true);
            try {
                const [posts, replies, reposts] = await Promise.all([
                    forumApiService.getUserThreads(user.id),
                    forumApiService.getUserComments(user.id),
                    forumApiService.getUserReposts(user.id),
                ]);
                setForumPosts(posts || []);
                setForumReplies(replies || []);
                setForumReposts(reposts || []);
            } catch (error) {
                console.error('Error fetching activity:', error);
            } finally {
                setLoadingActivity(false);
            }
        };
        fetchActivity();
    }, [activeTab, user]);

    // Fetch bookmarks for Bookmarks tab
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (activeTab !== 'bookmarks' || !user) return;
            setLoadingBookmarks(true);
            try {
                const data = await forumApiService.getBookmarks(user.id);
                setBookmarks(data);
            } catch (error) {
                console.error('Error fetching bookmarks:', error);
            } finally {
                setLoadingBookmarks(false);
            }
        };
        fetchBookmarks();
    }, [activeTab, user]);

    const startEditing = () => {
        setEditForm({
            username: profileData.username || '',
            bio: profileData.bio || '',
            ideology: profileData.ideology || '',
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        if (editForm.username.trim().length < 3) {
            alert('Username must be at least 3 characters.');
            return;
        }
        setSaving(true);
        try {
            const updates = {
                username: editForm.username.trim(),
                bio: editForm.bio.trim(),
                ideology: editForm.ideology.trim(),
            };
            const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
            if (error) throw error;
            setProfileData((prev) => ({ ...prev, ...updates }));
            refreshProfile?.();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile: ' + (error.message || 'unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file, kind) => {
        if (!file || !user) return;
        const setUploading = kind === 'avatar' ? setAvatarUploading : setBannerUploading;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            const column = kind === 'avatar' ? 'avatar_url' : 'banner_url';
            const { error: updateError } = await supabase.from('profiles').update({ [column]: urlData.publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;
            setProfileData((prev) => ({ ...prev, [column]: urlData.publicUrl }));
            refreshProfile?.();
        } catch (error) {
            console.error(`Error uploading ${kind}:`, error);
            alert(`Failed to upload ${kind === 'avatar' ? 'profile picture' : 'banner'}: ` + (error.message || 'unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveBookmark = async (threadId) => {
        if (!threadId) return;
        try {
            await forumApiService.removeBookmark(threadId);
            setBookmarks((prev) => prev.filter((b) => b.thread?.id !== threadId));
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };
    
    // Fetch learning data when tab changes
    useEffect(() => {
        const fetchLearningData = async () => {
            if (activeTab !== 'learning' || !user) return;
            setLearningLoading(true);
            try {
                // Fetch enrollments with course data
                const { data: enrollData } = await supabase
                    .from('stem_enrollments')
                    .select('*, stem_courses(id, title, slug, estimated_hours, stem_subjects(name, color), stem_chapters(id, stem_lessons(id)))')
                    .eq('user_id', user.id)
                    .order('enrolled_at', { ascending: false });
                setEnrollments(enrollData || []);

                // Fetch XP
                const { data: xpData } = await supabase
                    .from('stem_user_xp')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                setStemXP(xpData);

                // Fetch certificates
                const { data: certData } = await supabase
                    .from('stem_certificates')
                    .select('*, stem_courses(title, slug, stem_subjects(name, color))')
                    .eq('user_id', user.id)
                    .order('issued_at', { ascending: false });
                setCertificates(certData || []);

                // Fetch lesson progress for all enrolled courses
                if (enrollData && enrollData.length > 0) {
                    const allLessonIds = enrollData.flatMap(e =>
                        (e.stem_courses?.stem_chapters || []).flatMap(ch =>
                            (ch.stem_lessons || []).map(l => l.id)
                        )
                    );
                    if (allLessonIds.length > 0) {
                        const { data: progressData } = await supabase
                            .from('stem_lesson_progress')
                            .select('lesson_id, completed_at')
                            .eq('user_id', user.id)
                            .in('lesson_id', allLessonIds)
                            .not('completed_at', 'is', null);
                        const completedSet = new Set((progressData || []).map(p => p.lesson_id));

                        const progressMap = {};
                        enrollData.forEach(e => {
                            const allIds = (e.stem_courses?.stem_chapters || []).flatMap(ch =>
                                (ch.stem_lessons || []).map(l => l.id)
                            );
                            const completed = allIds.filter(id => completedSet.has(id)).length;
                            progressMap[e.stem_courses?.id] = allIds.length > 0 ? Math.round((completed / allIds.length) * 100) : 0;
                        });
                        setCourseProgressMap(progressMap);
                    }
                }
            } catch (error) {
                console.error('Error fetching learning data:', error);
            } finally {
                setLearningLoading(false);
            }
        };
        fetchLearningData();
    }, [activeTab, user]);

    // Fetch dashboard data when tab changes
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (activeTab !== 'dashboard' || !user) return;
            
            setDashboardLoading(true);
            try {
                const [stats, counts, questions, answers, favorites] = await Promise.all([
                    knowledgeApiService.getUserStatsWithGrowth(user.id),
                    knowledgeApiService.getUserContentCounts(user.id),
                    knowledgeApiService.getUserQuestions(user.id, 5),
                    knowledgeApiService.getUserAnswers(user.id, 5),
                    knowledgeApiService.getFavorites(user.id)
                ]);
                
                setCreatorStats(stats);
                setContentCounts(counts);
                setUserQuestions(questions);
                setUserAnswers(answers);
                setUserFavorites(favorites.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setDashboardLoading(false);
            }
        };
        
        fetchDashboardData();
    }, [activeTab, user]);
    
    const levelInfo = calculateLevel(creatorStats);



    // Learning Tab Content
    const renderLearning = () => (
        <div className="space-y-6">
            {learningLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : (
                <>
                    {/* XP Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-5 border border-yellow-600/30">
                            <div className="flex items-center gap-2 text-yellow-500 mb-2">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-medium">Total XP</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stemXP?.total_xp || 0}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-5 border border-orange-600/30">
                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                                <BarChart2 className="w-5 h-5" />
                                <span className="text-sm font-medium">Current Streak</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stemXP?.current_streak || 0} <span className="text-lg text-gray-500">days</span></p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-5 border border-green-600/30">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Award className="w-5 h-5" />
                                <span className="text-sm font-medium">Certificates</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{certificates.length}</p>
                        </div>
                    </div>

                    {/* Enrolled Courses */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-red-400" /> My Courses
                            </h3>
                            <Link href="/science-tech" className="text-sm text-red-400 hover:text-red-300">Browse Courses →</Link>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {enrollments.length > 0 ? enrollments.map(e => {
                                const course = e.stem_courses;
                                const progress = courseProgressMap[course?.id] || 0;
                                return (
                                    <Link key={e.id} href={`/science-tech/courses/${course?.slug}`} className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (course?.stem_subjects?.color || '#ef4444') + '20' }}>
                                            <GraduationCap className="w-5 h-5" style={{ color: course?.stem_subjects?.color || '#ef4444' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{course?.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-[200px]">
                                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{progress}%</span>
                                            </div>
                                        </div>
                                        {progress === 100 && (
                                            <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">Completed</span>
                                        )}
                                    </Link>
                                );
                            }) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No courses enrolled yet.</p>
                                    <Link href="/science-tech" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">Browse courses →</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Certificates */}
                    {certificates.length > 0 && (
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Award className="w-4 h-4 text-yellow-500" /> My Certificates
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-700">
                                {certificates.map(cert => (
                                    <div key={cert.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="text-white font-medium">{cert.stem_courses?.title}</p>
                                            <p className="text-gray-500 text-xs font-mono">{cert.certificate_number}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 text-xs">
                                                {new Date(cert.issued_at).toLocaleDateString()}
                                            </span>
                                            <Link href={`/verify/${cert.certificate_number}`}
                                                className="text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                Verify
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // Dashboard Tab Content
    const renderDashboard = () => (
        <div className="space-y-6">
            {dashboardLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : (
                <>
                    {/* Level Header */}
                    <div className="bg-gray-800/50 border border-red-600/30 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                                    <Cpu className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Creator Lvl {levelInfo.level}</h2>
                                    <p className="text-gray-400">{levelInfo.title}</p>
                                </div>
                            </div>
                            {creatorStats.growth !== 0 && (
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    creatorStats.growth > 0 
                                        ? 'bg-green-900/30 text-green-400' 
                                        : 'bg-red-900/30 text-red-400'
                                }`}>
                                    <TrendingUp className="w-4 h-4 inline mr-1" />
                                    {creatorStats.growth > 0 ? '+' : ''}{creatorStats.growth}% this week
                                </div>
                            )}
                        </div>
                        
                        {/* Progress Bar */}
                        {levelInfo.nextLevel && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>{formatCount(levelInfo.engagement)} XP</span>
                                    <span>{levelInfo.progress}% to Level {levelInfo.nextLevel.level} ({levelInfo.nextLevel.title})</span>
                                </div>
                                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                                        style={{ width: `${levelInfo.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formatCount(levelInfo.nextLevel.min - levelInfo.engagement)} XP needed for next level
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">Views</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCount(creatorStats.views)}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">Likes</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCount(creatorStats.likes)}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Follows</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCount(creatorStats.follows)}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">Content</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{contentCounts.questions + contentCounts.answers}</p>
                            <p className="text-xs text-gray-500">{contentCounts.questions} Q / {contentCounts.answers} A</p>
                        </div>
                    </div>
                    
                    {/* My Questions */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-semibold text-white">My Questions</h3>
                            <Link href="/knowledge" className="text-sm text-red-400 hover:text-red-300">View All →</Link>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {userQuestions.length > 0 ? userQuestions.map(q => (
                                <Link key={q.id} href={`/knowledge/question/${q.id}`} className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white truncate">{q.title}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            {q.topic?.name && <span className="bg-gray-700 px-2 py-0.5 rounded">{q.topic.name}</span>}
                                            <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 ml-4">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{q.view_count || 0}</span>
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{q.upvote_count || 0}</span>
                                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{q.answer_count || 0}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No questions yet.</p>
                                    <Link href="/knowledge/ask" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">Ask your first question →</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* My Answers */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-semibold text-white">My Answers</h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {userAnswers.length > 0 ? userAnswers.map(a => (
                                <Link key={a.id} href={`/knowledge/question/${a.question?.id}`} className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-400 text-sm truncate">Answer to: <span className="text-white">{a.question?.title}</span></p>
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">{a.content?.substring(0, 100)}...</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        {a.is_accepted && <span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Accepted</span>}
                                        <span className="flex items-center gap-1 text-sm text-gray-400"><Heart className="w-3 h-3" />{a.upvote_count || 0}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No answers yet.</p>
                                    <Link href="/knowledge" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">Browse questions to answer →</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* My Favorites */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" /> My Favorites
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {userFavorites.length > 0 ? userFavorites.map(q => (
                                <Link key={q.id} href={`/knowledge/question/${q.id}`} className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white truncate">{q.title}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            {q.topic?.name && <span className="bg-gray-700 px-2 py-0.5 rounded">{q.topic.name}</span>}
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No favorites yet.</p>
                                    <Link href="/knowledge" className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block">Browse questions to save →</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    // Overview Tab Content (posts / replies / reposts)
    const renderOverview = () => (
        <div>
            <div className={s.subTabRow}>
                <button onClick={() => setActivitySubTab('posts')} className={`${s.tabBtn} ${activitySubTab === 'posts' ? s.tabBtnActive : ''}`}>
                    <FileText size={14} style={{marginRight:6}} />Posts ({forumPosts.length})
                </button>
                <button onClick={() => setActivitySubTab('replies')} className={`${s.tabBtn} ${activitySubTab === 'replies' ? s.tabBtnActive : ''}`}>
                    <MessageSquare size={14} style={{marginRight:6}} />Replies ({forumReplies.length})
                </button>
                <button onClick={() => setActivitySubTab('reposts')} className={`${s.tabBtn} ${activitySubTab === 'reposts' ? s.tabBtnActive : ''}`}>
                    <Repeat2 size={14} style={{marginRight:6}} />Reposts ({forumReposts.length})
                </button>
            </div>

            {loadingActivity ? (
                <div className={s.loadingCenter}><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
            ) : (
                <>
                    {activitySubTab === 'posts' && (
                        forumPosts.length > 0 ? (
                            <div className={s.cardGrid}>
                                {forumPosts.map((post) => (
                                    <Link key={post.id} href="/feed?section=boards" className={s.card}>
                                        <h3 className={s.cardTitle}>{post.title}</h3>
                                        <p className={s.cardExcerpt}>{post.content}</p>
                                        <div className={s.cardMeta}>
                                            <span>/{post.category_slug}/</span>
                                            <span>{post.comment_count} replies</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : <div className={s.emptyCard}>No posts yet.</div>
                    )}

                    {activitySubTab === 'replies' && (
                        forumReplies.length > 0 ? (
                            <div className={s.cardGrid}>
                                {forumReplies.map((reply) => (
                                    <Link key={reply.id} href="/feed?section=boards" className={s.card}>
                                        <h3 className={s.cardTitle}>{reply.thread?.title || 'Unknown thread'}</h3>
                                        <p className={s.cardExcerpt}>{reply.content}</p>
                                        <div className={s.cardMeta}>
                                            <span>♥ {reply.like_count || 0}</span>
                                            <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : <div className={s.emptyCard}>No replies yet.</div>
                    )}

                    {activitySubTab === 'reposts' && (
                        forumReposts.length > 0 ? (
                            <div className={s.dashStack}>
                                {forumReposts.map((repost) => (
                                    <div key={repost.id} className={s.quoteBlock}>
                                        {repost.quote_content && (
                                            <p className={s.quoteText}>&ldquo;{repost.quote_content}&rdquo;</p>
                                        )}
                                        <div className={s.quoteFooter}>
                                            <span>Reposted: {repost.thread?.title}</span>
                                            <span>{new Date(repost.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <div className={s.emptyCard}>No reposts yet.</div>
                    )}
                </>
            )}
        </div>
    );

    // Bookmarks Tab Content
    const renderBookmarks = () => (
        <div>
            {loadingBookmarks ? (
                <div className={s.loadingCenter}><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
            ) : bookmarks.length > 0 ? (
                <div className={s.cardGrid}>
                    {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className={s.card}>
                            <div className={s.cardHeaderRow}>
                                <Link href="/feed?section=boards" style={{ flex: 1, minWidth: 0 }}>
                                    <h3 className={s.cardTitle}>{bookmark.thread?.title}</h3>
                                </Link>
                                <button
                                    className={s.cardRemoveBtn}
                                    onClick={() => handleRemoveBookmark(bookmark.thread?.id)}
                                    title="Remove bookmark"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <p className={s.cardExcerpt}>{bookmark.thread?.content}</p>
                            <div className={s.cardMeta}>
                                <span>/{bookmark.thread?.category_slug}/</span>
                                <span>{bookmark.thread?.comment_count || 0} replies</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={s.emptyCard}>No bookmarks yet. Save threads from the forum to see them here.</div>
            )}
        </div>
    );

    return (
        <div className={s.page}>
            <main className={s.main}>
                {profileLoading ? (
                    <div className={s.loadingCenter}><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>
                ) : (
                    <>
                        {/* Banner */}
                        <div className={s.banner}>
                            {profileData.banner_url ? (
                                <img src={profileData.banner_url} alt="Profile banner" className={s.bannerImg} />
                            ) : (
                                <div className={s.bannerPlaceholder}><ImageIcon size={40} /></div>
                            )}
                            {isEditing && (
                                <button
                                    type="button"
                                    className={s.bannerUploadBtn}
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={bannerUploading}
                                >
                                    <Camera size={14} />{bannerUploading ? 'Uploading…' : 'Change banner'}
                                </button>
                            )}
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => { handleImageUpload(e.target.files?.[0], 'banner'); e.target.value = ''; }}
                            />
                        </div>

                        <div className={s.profileCard}>
                            <div className={s.avatarWrap}>
                                {profileData.avatar_url ? (
                                    <img src={profileData.avatar_url} alt={profileData.username} className={s.avatarImg} />
                                ) : (
                                    <User size={40} />
                                )}
                                {isEditing && (
                                    <div className={s.uploadOverlay} onClick={() => avatarInputRef.current?.click()}>
                                        {avatarUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                                    </div>
                                )}
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => { handleImageUpload(e.target.files?.[0], 'avatar'); e.target.value = ''; }}
                            />

                            <div className={s.editRow}>
                                {!isEditing && (
                                    <button type="button" className={s.editBtn} onClick={startEditing}>
                                        <Pencil size={14} style={{marginRight:6}} />Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className={s.profileBody}>
                                {!isEditing ? (
                                    <>
                                        <h1 className={s.profileName}>
                                            {profileData.username || 'Unnamed'}
                                            {profileData.is_certified && (
                                                <span className={s.certBadge}><CheckCircle size={12} />Certified</span>
                                            )}
                                            {profileData.role === 'admin' && (
                                                <span className={s.certBadge}><Shield size={12} />Admin</span>
                                            )}
                                        </h1>
                                        <div className={s.statsRow}>
                                            <span><span className={s.statsCount}>{profileData.follower_count || 0}</span> followers</span>
                                            <span><span className={s.statsCount}>{profileData.following_count || 0}</span> following</span>
                                        </div>
                                        {profileData.ideology && (
                                            <p className={s.ideologyText}>{profileData.ideology}</p>
                                        )}
                                        {profileData.bio ? (
                                            <p className={s.bioText}>{profileData.bio}</p>
                                        ) : (
                                            <p className={s.emptyBioText}>Add a bio to tell others about yourself.</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className={s.fieldBlock}>
                                            <label className={s.fieldLabel}>Username</label>
                                            <input
                                                className={s.textInput}
                                                value={editForm.username}
                                                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                                                minLength={3}
                                            />
                                        </div>
                                        <div className={s.fieldBlock}>
                                            <label className={s.fieldLabel}>Ideology</label>
                                            <input
                                                className={s.textInput}
                                                value={editForm.ideology}
                                                onChange={(e) => setEditForm((f) => ({ ...f, ideology: e.target.value }))}
                                                placeholder="e.g. Marxist-Leninist"
                                            />
                                        </div>
                                        <div className={s.fieldBlock}>
                                            <label className={s.fieldLabel}>Bio</label>
                                            <textarea
                                                className={s.textArea}
                                                rows={4}
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                                                placeholder="Tell others about yourself…"
                                            />
                                        </div>
                                        <div className={s.saveRow}>
                                            <button type="button" className={s.cancelBtn} onClick={() => setIsEditing(false)} disabled={saving}>
                                                Cancel
                                            </button>
                                            <button type="button" className={s.saveBtn} onClick={handleSaveProfile} disabled={saving}>
                                                {saving ? 'Saving…' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className={`${s.tabRow} ${s.sectionBlock}`}>
                            <button onClick={() => setActiveTab('overview')} className={`${s.tabBtn} ${activeTab === 'overview' ? s.tabBtnActive : ''}`}>
                                <User size={16} style={{marginRight:8}} />Overview
                            </button>
                            <button onClick={() => setActiveTab('bookmarks')} className={`${s.tabBtn} ${activeTab === 'bookmarks' ? s.tabBtnActive : ''}`}>
                                <Bookmark size={16} style={{marginRight:8}} />Bookmarks
                            </button>
                            <button onClick={() => setActiveTab('learning')} className={`${s.tabBtn} ${activeTab === 'learning' ? s.tabBtnActive : ''}`}>
                                <GraduationCap size={16} style={{marginRight:8}} />Learning
                            </button>
                            <button onClick={() => setActiveTab('dashboard')} className={`${s.tabBtn} ${activeTab === 'dashboard' ? s.tabBtnActive : ''}`}>
                                <Cpu size={16} style={{marginRight:8}} />Creator Dashboard
                            </button>
                        </div>

                        {activeTab === 'bookmarks' && renderBookmarks()}
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'learning' && renderLearning()}
                        {activeTab === 'overview' && renderOverview()}
                    </>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;
