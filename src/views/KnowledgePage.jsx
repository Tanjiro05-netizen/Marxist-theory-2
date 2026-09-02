import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { knowledgeApiService } from '../components/Knowledge/api';
import { useTopicFollows } from '../components/Knowledge/hooks/useTopics';

// Zhihu Future UI Components
import KnowledgeLayout from '../components/Knowledge/FutureUI/KnowledgeLayout';
import DenseSidebar from '../components/Knowledge/FutureUI/DenseSidebar';
import FeedStream from '../components/Knowledge/FutureUI/FeedStream';
import { Widgets } from '../components/Knowledge/FutureUI/Widgets';
import DailyChallenge from '../components/Knowledge/Study/DailyChallenge';

const PAGE_SIZE = 20;

const KnowledgePage = () => {
    const { user, profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState('feed');

    // ── Search ──────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const searchTimeout = useRef(null);

    // ── Feed questions (append-paginated) ───────────────────
    const [questions, setQuestions] = useState([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedPage, setFeedPage] = useState(1);
    const [feedHasMore, setFeedHasMore] = useState(false);

    // ── Following feed ──────────────────────────────────────
    const [followingQuestions, setFollowingQuestions] = useState([]);
    const [followingLoading, setFollowingLoading] = useState(false);
    const [followingPage, setFollowingPage] = useState(1);
    const [followingHasMore, setFollowingHasMore] = useState(false);

    // ── Favorites ───────────────────────────────────────────
    const [favorites, setFavorites] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());

    const { isFollowing, toggleFollow } = useTopicFollows(knowledgeApiService, user?.id);

    const topicSlug = searchParams.get('topic');
    const sortBy = searchParams.get('sort') || 'recent';

    const activeTab = useMemo(() => {
        if (viewMode === 'hot') return 'hot';
        if (viewMode === 'following') return 'follow';
        return 'recommend';
    }, [viewMode]);

    // ── Load main feed ──────────────────────────────────────
    const loadFeed = useCallback(async (page, append = false, search = searchQuery) => {
        setFeedLoading(true);
        const result = await knowledgeApiService.getQuestions({
            topicSlug,
            page,
            limit: PAGE_SIZE,
            sortBy: viewMode === 'hot' ? 'popular' : sortBy,
            status: 'approved',
            search,
        });
        setQuestions(prev => append ? [...prev, ...result.data] : result.data);
        setFeedHasMore(page < result.totalPages);
        setFeedLoading(false);
    }, [topicSlug, sortBy, viewMode, searchQuery]);

    // Reset and reload when mode/sort/topic changes
    useEffect(() => {
        if (viewMode === 'following' || viewMode === 'favorites') return;
        setFeedPage(1);
        loadFeed(1, false);
    }, [viewMode, topicSlug, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

    // Search debounce
    const handleSearchChange = useCallback((val) => {
        setSearchQuery(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setFeedPage(1);
            loadFeed(1, false, val);
        }, 350);
    }, [loadFeed]);

    const handleLoadMore = () => {
        const next = feedPage + 1;
        setFeedPage(next);
        loadFeed(next, true);
    };

    // ── Load following feed ─────────────────────────────────
    const loadFollowing = useCallback(async (page, append = false) => {
        if (!user?.id) return;
        setFollowingLoading(true);
        const result = await knowledgeApiService.getQuestionsFromFollowedTopics(user.id, { page, limit: PAGE_SIZE });
        setFollowingQuestions(prev => append ? [...prev, ...result.data] : result.data);
        setFollowingHasMore(page < result.totalPages);
        setFollowingLoading(false);
    }, [user?.id]);

    useEffect(() => {
        if (viewMode === 'following') {
            setFollowingPage(1);
            loadFollowing(1, false);
        }
    }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLoadMoreFollowing = () => {
        const next = followingPage + 1;
        setFollowingPage(next);
        loadFollowing(next, true);
    };

    // ── Load favorites ──────────────────────────────────────
    useEffect(() => {
        if (viewMode === 'favorites' && user?.id) {
            knowledgeApiService.getFavorites(user.id).then(setFavorites);
        }
    }, [viewMode, user?.id]);

    // Load favorite IDs for the save button indicator
    useEffect(() => {
        if (user?.id) {
            knowledgeApiService.getUserFavoriteIds(user.id).then(ids => {
                setFavoriteIds(new Set(ids));
            });
        }
    }, [user?.id]);

    // ── Vote handler ────────────────────────────────────────
    const handleVote = useCallback(async (questionId) => {
        if (!user) return;
        const result = await knowledgeApiService.vote('question', questionId, 'up');
        if (result.success) {
            const delta = result.action === 'added' ? 1 : result.action === 'removed' ? -1 : 0;
            const applyDelta = list => list.map(q =>
                q.id === questionId ? { ...q, upvote_count: (q.upvote_count || 0) + delta } : q
            );
            setQuestions(applyDelta);
            setFollowingQuestions(applyDelta);
            setFavorites(applyDelta);
        }
    }, [user]);

    // ── Favorite toggle handler ─────────────────────────────
    const handleToggleFavorite = useCallback(async (questionId) => {
        if (!user) return;
        const result = await knowledgeApiService.toggleFavorite(questionId);
        if (result.success) {
            setFavoriteIds(prev => {
                const next = new Set(prev);
                result.action === 'added' ? next.add(questionId) : next.delete(questionId);
                return next;
            });
            if (viewMode === 'favorites') {
                knowledgeApiService.getFavorites(user.id).then(setFavorites);
            }
        }
    }, [user, viewMode]);

    const isFavorited = useCallback((questionId) => favoriteIds.has(questionId), [favoriteIds]);

    // ── Navigation ──────────────────────────────────────────
    const handleTabChange = (tab) => {
        if (tab === 'follow') { setViewMode('following'); return; }
        const newMode = tab === 'hot' ? 'hot' : 'feed';
        setViewMode(newMode);
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', tab === 'hot' ? 'popular' : 'recent');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSidebarNavigate = (key) => {
        setViewMode(key);
        if (key === 'feed' || key === 'hot') {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', key === 'hot' ? 'popular' : 'recent');
            params.delete('page');
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    // ── Derived display state ───────────────────────────────
    const displayQuestions =
        viewMode === 'favorites'  ? favorites :
        viewMode === 'following'  ? followingQuestions :
        questions;

    const loading =
        viewMode === 'following' ? followingLoading :
        viewMode === 'favorites' ? false :
        feedLoading;

    const hasMore =
        viewMode === 'following' ? followingHasMore :
        viewMode === 'favorites' ? false :
        feedHasMore;

    const handleLoadMoreCombined =
        viewMode === 'following' ? handleLoadMoreFollowing : handleLoadMore;

    return (
        <KnowledgeLayout
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sidebar={
                <>
                    <DenseSidebar
                        activeItem={viewMode}
                        onNavigate={handleSidebarNavigate}
                        userId={user?.id}
                    />
                    <div className="mt-4">
                        <DailyChallenge userId={user?.id} />
                    </div>
                </>
            }
            widgets={<Widgets userId={user?.id} />}
        >
            <FeedStream
                questions={displayQuestions}
                loading={loading}
                user={user}
                profile={profile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                viewMode={viewMode}
                isFollowing={isFollowing}
                onToggleFollow={toggleFollow}
                onVote={handleVote}
                isFavorited={isFavorited}
                onToggleFavorite={handleToggleFavorite}
                hasMore={hasMore}
                onLoadMore={handleLoadMoreCombined}
            />
        </KnowledgeLayout>
    );
};

export default KnowledgePage;
