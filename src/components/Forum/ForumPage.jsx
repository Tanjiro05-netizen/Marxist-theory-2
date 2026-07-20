import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Flame,
  Hash,
  Heart,
  Home,
  Lock,
  MessageCircle,
  MessageSquarePlus,
  Pin,
  Repeat2,
  Send,
  TrendingUp,
  Users,
  Wifi,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { forumApiService } from './api'
import { BOARDS, getBoardBySlug } from './constants'
import { formatPostNumber, formatRelativeTime, truncateText } from './utils/formatters'
import { parseContent } from './utils/helpers'
import { sanitizeInput } from './utils/sanitize'
import { useBookmarks } from './hooks/useBookmarks'
import { useComments } from './hooks/useComments'
import { useForumPresence } from './hooks/useForumPresence'
import { useLikes } from './hooks/useLikes'
import { useRateLimit } from './hooks/useRateLimit'
import { useReposts } from './hooks/useReposts'
import { useThreads } from './hooks/useThreads'
import * as s from './ForumPage.css.ts'
import {
  actionButton,
  emptyState,
  loadingSpinner,
  loadingState,
  monoMeta,
} from '../../styles/obsidianTheme.css.ts'

const FEED_TABS = [
  { key: 'latest', label: 'Latest', icon: Clock3, sortBy: 'created_at' },
  { key: 'hot', label: 'Hot', icon: Flame, sortBy: 'like_count' },
  { key: 'discussed', label: 'Discussed', icon: TrendingUp, sortBy: 'comment_count' },
]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseForumPath(pathname) {
  const parts = pathname.replace(/^\/forum\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'thread' && parts[1]) return { view: 'thread', threadId: parts[1] }
  if (parts[0]) return { view: 'feed', boardSlug: parts[0] }
  return { view: 'feed', boardSlug: null }
}

function getForumUserId(user) {
  return UUID_PATTERN.test(user?.id || '') ? user.id : null
}

function cleanAnonymousName(name) {
  const trimmed = `${name || ''}`.trim()
  if (!trimmed || ['undefined', 'null'].includes(trimmed.toLowerCase())) return ''
  return trimmed
}

function getDisplayIdentity(item) {
  const anonymousName = cleanAnonymousName(item?.anonymous_name)
  if (anonymousName) {
    return {
      name: anonymousName,
      handle: 'anonymous',
      avatarUrl: null,
      anonymous: true,
    }
  }

  return {
    name: item?.author?.username || 'Anonymous',
    handle: item?.author?.username ? `@${item.author.username}` : 'anonymous',
    avatarUrl: item?.author?.avatar_url || null,
    anonymous: !item?.author?.username,
  }
}

function InitialAvatar({ item, large = false }) {
  const identity = getDisplayIdentity(item)
  const initials = identity.name
    .split(/[\s_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?'

  if (identity.avatarUrl) {
    return (
      <img
        className={`${s.avatar} ${large ? s.avatarLarge : ''}`}
        src={identity.avatarUrl}
        alt={identity.name}
      />
    )
  }

  return (
    <div className={`${s.avatar} ${large ? s.avatarLarge : ''} ${identity.anonymous ? s.avatarAnon : ''}`}>
      {initials}
    </div>
  )
}

function ContentSegments({ content, preview = false }) {
  const segments = parseContent(content)
  const visibleSegments = preview ? segments.slice(0, 5) : segments

  return (
    <>
      {visibleSegments.map((segment) => {
        if (segment.type === 'greentext') {
          return <div key={segment.key} className={s.greentext}>{segment.text}</div>
        }
        if (segment.type === 'quote-link') {
          return (
            <div key={segment.key}>
              <a href={`#post-${segment.postId}`} className={s.quoteLink}>{segment.text}</a>
            </div>
          )
        }
        return <div key={segment.key}>{segment.text || <br />}</div>
      })}
      {preview && segments.length > visibleSegments.length && (
        <div className={s.previewFade}>...</div>
      )}
    </>
  )
}

function BoardRail({ currentBoard, stats, onlineCounts, totalOnline, onAllBoards, onSelectBoard }) {
  return (
    <aside className={s.leftRail} id="boards">
      <div className={s.railHeader}>
        <button className={s.brandButton} onClick={onAllBoards}>
          <span className={s.brandMark}><Hash size={17} /></span>
          <span>
            <span className={s.brandTitle}>Forum</span>
            <span className={s.brandMeta}>{totalOnline} online</span>
          </span>
        </button>
      </div>

      <nav className={s.boardNav} aria-label="Forum boards">
        <button
          className={`${s.boardNavItem} ${!currentBoard ? s.boardNavItemActive : ''}`}
          onClick={onAllBoards}
        >
          <span className={s.boardNavIcon}><Home size={16} /></span>
          <span className={s.boardNavText}>
            <span>Home Feed</span>
            <span>all boards</span>
          </span>
          <ChevronRight size={15} />
        </button>

        {BOARDS.map((board) => {
          const boardStats = stats[board.slug] || { threadCount: 0, uniquePostersWeek: 0 }
          const online = onlineCounts[board.slug] || 0
          return (
            <button
              key={board.slug}
              className={`${s.boardNavItem} ${currentBoard === board.slug ? s.boardNavItemActive : ''}`}
              onClick={() => onSelectBoard(board.slug)}
            >
              <span className={s.boardSlug}>/{board.slug}/</span>
              <span className={s.boardNavText}>
                <span>{board.name}</span>
                <span>{boardStats.threadCount} threads · {online} online</span>
              </span>
              <ChevronRight size={15} />
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function MobileBoardStrip({ currentBoard, onAllBoards, onSelectBoard }) {
  return (
    <div className={s.mobileBoardStrip}>
      <button
        className={`${s.mobileBoardChip} ${!currentBoard ? s.mobileBoardChipActive : ''}`}
        onClick={onAllBoards}
      >
        Home
      </button>
      {BOARDS.map((board) => (
        <button
          key={board.slug}
          className={`${s.mobileBoardChip} ${currentBoard === board.slug ? s.mobileBoardChipActive : ''}`}
          onClick={() => onSelectBoard(board.slug)}
        >
          /{board.slug}/
        </button>
      ))}
    </div>
  )
}

function ThreadComposer({ user, userId, initialBoardSlug, onCreated }) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(initialBoardSlug || BOARDS[0].slug)
  const [anonymousName, setAnonymousName] = useState('')
  const [useAnonymousName, setUseAnonymousName] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const mountTime = useRef(Date.now())
  const { checkLimit } = useRateLimit()

  useEffect(() => {
    setSelectedBoard(initialBoardSlug || BOARDS[0].slug)
  }, [initialBoardSlug])

  useEffect(() => {
    if (expanded) mountTime.current = Date.now()
  }, [expanded])

  const reset = useCallback(() => {
    setTitle('')
    setContent('')
    setAnonymousName('')
    setUseAnonymousName(false)
    setError('')
    setExpanded(false)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!userId || honeypot) return
    if (Date.now() - mountTime.current < 1200) {
      setError('Give the post one more second.')
      return
    }
    const rate = checkLimit('thread')
    if (!rate.ok) {
      setError(`Too many posts. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.`)
      return
    }
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.')
      return
    }
    if (content.trim().length < 10) {
      setError('Post must be at least 10 characters.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const thread = await forumApiService.createThread(
        {
          title: sanitizeInput(title.trim()),
          content: sanitizeInput(content.trim()),
          category_slug: selectedBoard,
          anonymous_name: useAnonymousName ? sanitizeInput(anonymousName.trim() || 'Anonymous') : null,
        },
        userId,
      )
      reset()
      onCreated?.(thread)
    } catch (err) {
      setError(err.message || 'Failed to post thread.')
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button className={s.composerCollapsed} onClick={() => setExpanded(true)}>
        <InitialAvatar item={{ author: { username: user?.email || 'You' } }} />
        <span>Start a thread...</span>
        <MessageSquarePlus size={18} />
      </button>
    )
  }

  return (
    <form className={s.composer} onSubmit={handleSubmit}>
      <div className={s.composerTop}>
        <InitialAvatar item={{ anonymous_name: useAnonymousName ? anonymousName : '', author: { username: user?.email || 'You' } }} />
        <div className={s.composerFields}>
          <input
            className={s.composerTitleInput}
            value={title}
            onChange={(event) => { setTitle(event.target.value); setError('') }}
            placeholder="Thread title"
            maxLength={200}
            disabled={loading}
          />
          <textarea
            className={s.composerTextarea}
            value={content}
            onChange={(event) => { setContent(event.target.value); setError('') }}
            placeholder="Post body"
            disabled={loading}
          />
        </div>
      </div>

      <div className={s.honeypot} aria-hidden="true">
        <label htmlFor="forum_website">Website</label>
        <input
          id="forum_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className={s.composerMeta}>
        <label className={s.selectWrap}>
          <span>Board</span>
          <select value={selectedBoard} onChange={(event) => setSelectedBoard(event.target.value)} disabled={loading}>
            {BOARDS.map((board) => (
              <option key={board.slug} value={board.slug}>/{board.slug}/ {board.name}</option>
            ))}
          </select>
        </label>

        <label className={s.identityToggle}>
          <input
            type="checkbox"
            checked={useAnonymousName}
            onChange={(event) => setUseAnonymousName(event.target.checked)}
            disabled={loading}
          />
          <span>Anonymous display</span>
        </label>

        {useAnonymousName && (
          <input
            className={s.anonInput}
            value={anonymousName}
            onChange={(event) => setAnonymousName(event.target.value)}
            placeholder="Anonymous"
            maxLength={50}
            disabled={loading}
          />
        )}
      </div>

      {error && <div className={s.formError}>{error}</div>}

      <div className={s.composerActions}>
        <span className={monoMeta}>{content.length} chars</span>
        <div className={s.composerActionButtons}>
          <button type="button" className={actionButton({ tone: 'ghost', size: 'sm' })} onClick={reset} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className={actionButton({ tone: 'accent', size: 'sm' })} disabled={loading || !title.trim() || !content.trim()}>
            <Send size={14} /> {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}

function FeedTabButton({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button className={`${s.feedTab} ${active ? s.feedTabActive : ''}`} onClick={onClick}>
      <Icon size={15} />
      <span>{tab.label}</span>
    </button>
  )
}

function FeedAction({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      className={`${s.feedAction} ${active ? s.feedActionActive : ''}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
    >
      <Icon size={16} />
      <span>{count ?? label}</span>
    </button>
  )
}

function ThreadFeedCard({
  thread,
  onOpen,
  onLike,
  onRepost,
  onBookmark,
  liked,
  reposted,
  bookmarked,
}) {
  const identity = getDisplayIdentity(thread)

  return (
    <article className={s.feedCard}>
      <div className={s.feedCardAvatar}>
        <InitialAvatar item={thread} />
      </div>

      <div className={s.feedCardBody}>
        <div className={s.feedCardHeader}>
          <div className={s.identityLine}>
            <span className={s.displayName}>{identity.name}</span>
            <span className={s.handle}>{identity.handle}</span>
            <span className={s.dot}>·</span>
            <span>{formatRelativeTime(thread.created_at)}</span>
            <button className={s.boardBadge} onClick={() => onOpen?.(thread, { boardOnly: true })}>
              /{thread.category_slug}/
            </button>
          </div>
          <div className={s.stateBadges}>
            {thread.is_pinned && <span className={s.stateBadge}><Pin size={12} /> pinned</span>}
            {thread.is_locked && <span className={s.stateBadge}><Lock size={12} /> locked</span>}
          </div>
        </div>

        <button className={s.feedTitleButton} onClick={() => onOpen?.(thread)}>
          {thread.title}
        </button>

        <div className={s.feedExcerpt}>
          <ContentSegments content={truncateText(thread.content, 520)} preview />
        </div>

        <div className={s.feedActions}>
          <FeedAction icon={MessageCircle} count={thread.comment_count || 0} label="Replies" onClick={() => onOpen?.(thread)} />
          <FeedAction icon={Heart} count={thread.like_count || 0} label="Likes" active={liked} onClick={() => onLike?.(thread.id)} />
          <FeedAction icon={Repeat2} count={thread.repost_count || 0} label="Reposts" active={reposted} onClick={() => onRepost?.(thread.id)} />
          <FeedAction icon={Bookmark} label={bookmarked ? 'Saved' : 'Save'} active={bookmarked} onClick={() => onBookmark?.(thread.id)} />
        </div>
      </div>
    </article>
  )
}

function ActivityRail({ threads, boardStats, totalOnline, unreadCount, bookmarkCount, onOpenThread }) {
  const trending = useMemo(() => {
    return [...(threads || [])]
      .sort((a, b) => ((b.like_count || 0) * 2 + (b.comment_count || 0)) - ((a.like_count || 0) * 2 + (a.comment_count || 0)))
      .slice(0, 5)
  }, [threads])

  const totalThreads = useMemo(() => {
    return Object.values(boardStats || {}).reduce((sum, stat) => sum + (stat.threadCount || 0), 0)
  }, [boardStats])

  return (
    <aside className={s.rightRail}>
      <section className={s.sidePanel}>
        <div className={s.sidePanelHeader}>
          <span>Live</span>
          <Wifi size={15} />
        </div>
        <div className={s.statGrid}>
          <div>
            <strong>{totalOnline}</strong>
            <span>online</span>
          </div>
          <div>
            <strong>{totalThreads}</strong>
            <span>threads</span>
          </div>
          <div>
            <strong>{unreadCount}</strong>
            <span>alerts</span>
          </div>
          <div>
            <strong>{bookmarkCount}</strong>
            <span>saved</span>
          </div>
        </div>
      </section>

      <section className={s.sidePanel}>
        <div className={s.sidePanelHeader}>
          <span>Trending</span>
          <Flame size={15} />
        </div>
        <div className={s.trendingList}>
          {trending.length > 0 ? trending.map((thread) => (
            <button key={thread.id} className={s.trendingItem} onClick={() => onOpenThread?.(thread)}>
              <span className={s.trendingTitle}>{thread.title}</span>
              <span>{thread.comment_count || 0} replies · {thread.like_count || 0} likes</span>
            </button>
          )) : (
            <p className={s.mutedText}>No trending threads yet.</p>
          )}
        </div>
      </section>
    </aside>
  )
}

function FeedSurface({
  boardSlug,
  boardStats,
  onlineCounts,
  totalOnline,
  user,
  userId,
  onAllBoards,
  onSelectBoard,
  onOpenThread,
}) {
  const board = boardSlug ? getBoardBySlug(boardSlug) : null
  const [activeTab, setActiveTab] = useState('latest')
  const [page, setPage] = useState(1)
  const activeTabConfig = FEED_TABS.find((tab) => tab.key === activeTab) || FEED_TABS[0]
  const { threads, loading, error, pagination, refetch } = useThreads(
    forumApiService,
    {
      category: boardSlug || undefined,
      page,
      limit: 20,
      sortBy: activeTabConfig.sortBy,
    },
    userId,
  )
  const { isLiked, toggleLike, fetchUserLikes } = useLikes(forumApiService, userId)
  const { isBookmarked, toggleBookmark, bookmarkCount } = useBookmarks(forumApiService, userId)
  const { isReposted, toggleRepost } = useReposts(forumApiService, userId)
  const unreadCount = 0

  useEffect(() => {
    setPage(1)
  }, [boardSlug, activeTab])

  useEffect(() => {
    if (userId) fetchUserLikes()
  }, [userId, fetchUserLikes])

  const handleCreated = useCallback((thread) => {
    refetch()
    if (thread?.id) onOpenThread(thread)
  }, [onOpenThread, refetch])

  const title = board ? board.name : 'Home Feed'
  const subtitle = board ? board.fullName : 'Latest threads from every board'

  return (
    <>
      <BoardRail
        currentBoard={boardSlug}
        stats={boardStats}
        onlineCounts={onlineCounts}
        totalOnline={totalOnline}
        onAllBoards={onAllBoards}
        onSelectBoard={onSelectBoard}
      />

      <main className={s.mainColumn}>
        <MobileBoardStrip currentBoard={boardSlug} onAllBoards={onAllBoards} onSelectBoard={onSelectBoard} />

        <header className={s.feedHeader}>
          <div>
            <p className={s.kicker}>Community</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className={s.feedHeaderMeta}>
            <span><Users size={14} /> {boardStats[boardSlug]?.uniquePostersWeek || 0} this week</span>
            <span><Wifi size={14} /> {boardSlug ? (onlineCounts[boardSlug] || 0) : totalOnline} online</span>
          </div>
        </header>

        <ThreadComposer user={user} userId={userId} initialBoardSlug={boardSlug} onCreated={handleCreated} />

        <div className={s.feedTabs}>
          {FEED_TABS.map((tab) => (
            <FeedTabButton
              key={tab.key}
              tab={tab}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>

        {loading ? (
          <div className={loadingState}><div className={loadingSpinner} /></div>
        ) : error ? (
          <div className={emptyState}>
            Feed unavailable right now.
            <br />
            <button className={actionButton({ tone: 'ghost', size: 'sm' })} onClick={refetch} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div className={emptyState}>No threads yet.</div>
        ) : (
          <div className={s.feedList}>
            {threads.map((thread) => (
              <ThreadFeedCard
                key={thread.id}
                thread={thread}
                onOpen={(selectedThread, options) => {
                  if (options?.boardOnly) onSelectBoard(selectedThread.category_slug)
                  else onOpenThread(selectedThread)
                }}
                liked={isLiked('thread', thread.id)}
                reposted={isReposted(thread.id)}
                bookmarked={isBookmarked(thread.id)}
                onLike={(threadId) => toggleLike('thread', threadId)}
                onRepost={(threadId) => toggleRepost(threadId)}
                onBookmark={(threadId) => toggleBookmark(threadId)}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className={s.paginationRow}>
            <button className={actionButton({ tone: 'ghost', size: 'sm' })} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </button>
            <span className={monoMeta}>{page} / {pagination.totalPages}</span>
            <button className={actionButton({ tone: 'ghost', size: 'sm' })} disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        )}
      </main>

      <ActivityRail
        threads={threads}
        boardStats={boardStats}
        totalOnline={totalOnline}
        unreadCount={unreadCount}
        bookmarkCount={bookmarkCount}
        onOpenThread={onOpenThread}
      />
    </>
  )
}

function ReplyComposer({ user, loading, error, onSubmit }) {
  const [content, setContent] = useState('')
  const [useAnonymousName, setUseAnonymousName] = useState(false)
  const [anonymousName, setAnonymousName] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!content.trim()) return
    const success = await onSubmit(content, useAnonymousName ? anonymousName.trim() || 'Anonymous' : null)
    if (success) {
      setContent('')
      setAnonymousName('')
      setUseAnonymousName(false)
    }
  }

  return (
    <form className={s.replyComposer} onSubmit={handleSubmit}>
      <InitialAvatar item={{ anonymous_name: useAnonymousName ? anonymousName : '', author: { username: user?.email || 'You' } }} />
      <div className={s.replyComposerBody}>
        <textarea
          className={s.replyTextarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a reply..."
          disabled={loading}
        />
        <div className={s.replyComposerMeta}>
          <label className={s.identityToggle}>
            <input
              type="checkbox"
              checked={useAnonymousName}
              onChange={(event) => setUseAnonymousName(event.target.checked)}
              disabled={loading}
            />
            <span>Anonymous display</span>
          </label>
          {useAnonymousName && (
            <input
              className={s.anonInput}
              value={anonymousName}
              onChange={(event) => setAnonymousName(event.target.value)}
              placeholder="Anonymous"
              maxLength={50}
              disabled={loading}
            />
          )}
          <button type="submit" className={actionButton({ tone: 'accent', size: 'sm' })} disabled={loading || !content.trim()}>
            <Send size={14} /> {loading ? 'Posting...' : 'Reply'}
          </button>
        </div>
        {error && <div className={s.formError}>{error}</div>}
      </div>
    </form>
  )
}

function CommentCard({ comment, liked, onLike }) {
  const identity = getDisplayIdentity(comment)
  const postNumber = formatPostNumber(comment.id)

  return (
    <article id={`post-${postNumber}`} className={`${s.commentCard} ${comment.parent_id ? s.commentCardNested : ''}`}>
      <InitialAvatar item={comment} />
      <div className={s.commentBodyWrap}>
        <div className={s.commentHeader}>
          <span className={s.displayName}>{identity.name}</span>
          <span className={s.handle}>{identity.handle}</span>
          <span className={s.dot}>·</span>
          <span>{formatRelativeTime(comment.created_at)}</span>
          <span>No.{postNumber}</span>
        </div>
        <div className={s.commentText}>
          {comment.is_deleted ? '[deleted]' : <ContentSegments content={comment.content} />}
        </div>
        <div className={s.feedActions}>
          <FeedAction icon={Heart} count={comment.like_count || 0} label="Likes" active={liked} onClick={() => onLike?.(comment.id)} />
        </div>
      </div>
    </article>
  )
}

function ThreadDetailSurface({
  threadId,
  boardStats,
  onlineCounts,
  totalOnline,
  user,
  userId,
  onAllBoards,
  onSelectBoard,
}) {
  const [thread, setThread] = useState(null)
  const [threadLoading, setThreadLoading] = useState(true)
  const [threadError, setThreadError] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('')
  const { checkLimit } = useRateLimit()
  const { flatComments, loading: commentsLoading, createComment } = useComments(forumApiService, threadId, userId)
  const { isLiked, toggleLike, fetchUserLikes } = useLikes(forumApiService, userId)
  const { isBookmarked, toggleBookmark, bookmarkCount } = useBookmarks(forumApiService, userId)
  const { isReposted, toggleRepost } = useReposts(forumApiService, userId)
  const unreadCount = 0

  useEffect(() => {
    let cancelled = false
    async function loadThread() {
      setThreadLoading(true)
      setThreadError('')
      try {
        const data = await forumApiService.getThread(threadId)
        if (!cancelled) setThread(data)
      } catch (err) {
        if (!cancelled) setThreadError(err.message || 'Thread not found.')
      } finally {
        if (!cancelled) setThreadLoading(false)
      }
    }
    loadThread()
    return () => { cancelled = true }
  }, [threadId])

  useEffect(() => {
    if (userId) fetchUserLikes()
  }, [userId, fetchUserLikes])

  const handleReply = async (content, anonymousName) => {
    const rate = checkLimit('comment')
    if (!rate.ok) {
      setReplyError(`Too many replies. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.`)
      return false
    }
    setReplyLoading(true)
    setReplyError('')
    const result = await createComment(sanitizeInput(content.trim()), null, anonymousName ? sanitizeInput(anonymousName) : null)
    setReplyLoading(false)
    if (!result.success) {
      setReplyError(result.error?.message || 'Failed to post reply.')
      return false
    }
    return true
  }

  const currentBoard = thread?.category_slug || null
  const identity = getDisplayIdentity(thread)

  return (
    <>
      <BoardRail
        currentBoard={currentBoard}
        stats={boardStats}
        onlineCounts={onlineCounts}
        totalOnline={totalOnline}
        onAllBoards={onAllBoards}
        onSelectBoard={onSelectBoard}
      />

      <main className={s.mainColumn}>
        <MobileBoardStrip currentBoard={currentBoard} onAllBoards={onAllBoards} onSelectBoard={onSelectBoard} />

        {threadLoading ? (
          <div className={loadingState}><div className={loadingSpinner} /></div>
        ) : threadError || !thread ? (
          <div className={emptyState}>{threadError || 'Thread not found.'}</div>
        ) : (
          <>
            <button className={s.backButton} onClick={() => onSelectBoard(thread.category_slug)}>
              <ArrowLeft size={16} /> /{thread.category_slug}/
            </button>

            <article className={s.threadDetailPost}>
              <div className={s.threadDetailTop}>
                <InitialAvatar item={thread} large />
                <div className={s.threadDetailMeta}>
                  <div className={s.identityLine}>
                    <span className={s.displayName}>{identity.name}</span>
                    <span className={s.handle}>{identity.handle}</span>
                    <span className={s.dot}>·</span>
                    <span>{formatRelativeTime(thread.created_at)}</span>
                    <span className={s.boardBadge}>/{thread.category_slug}/</span>
                  </div>
                  <h1>{thread.title}</h1>
                </div>
              </div>

              <div className={s.threadDetailContent}>
                <ContentSegments content={thread.content} />
              </div>

              <div className={s.threadDetailActions}>
                <FeedAction icon={MessageCircle} count={flatComments?.length || 0} label="Replies" />
                <FeedAction icon={Heart} count={thread.like_count || 0} label="Likes" active={isLiked('thread', thread.id)} onClick={() => toggleLike('thread', thread.id)} />
                <FeedAction icon={Repeat2} count={thread.repost_count || 0} label="Reposts" active={isReposted(thread.id)} onClick={() => toggleRepost(thread.id)} />
                <FeedAction icon={Bookmark} label={isBookmarked(thread.id) ? 'Saved' : 'Save'} active={isBookmarked(thread.id)} onClick={() => toggleBookmark(thread.id)} />
              </div>
            </article>

            {!thread.is_locked && (
              <ReplyComposer user={user} loading={replyLoading} error={replyError} onSubmit={handleReply} />
            )}

            {thread.is_locked && (
              <div className={s.lockedNotice}><Lock size={15} /> This thread is locked.</div>
            )}

            <section className={s.commentsSection}>
              <div className={s.commentsHeader}>
                <h2>Replies</h2>
                <span>{flatComments?.length || 0}</span>
              </div>

              {commentsLoading ? (
                <div className={loadingState}><div className={loadingSpinner} /></div>
              ) : flatComments?.length ? (
                <div className={s.commentsList}>
                  {flatComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      liked={isLiked('comment', comment.id)}
                      onLike={(commentId) => toggleLike('comment', commentId)}
                    />
                  ))}
                </div>
              ) : (
                <div className={emptyState}>No replies yet.</div>
              )}
            </section>
          </>
        )}
      </main>

      <ActivityRail
        threads={thread ? [thread] : []}
        boardStats={boardStats}
        totalOnline={totalOnline}
        unreadCount={unreadCount}
        bookmarkCount={bookmarkCount}
        onOpenThread={() => {}}
      />
    </>
  )
}

function BottomNav({ onHome }) {
  return (
    <nav className={s.bottomNav} aria-label="Forum navigation">
      <button onClick={onHome}><Home size={18} /><span>Home</span></button>
      <a href="#boards"><Hash size={18} /><span>Boards</span></a>
      <button type="button"><Bell size={18} /><span>Alerts</span></button>
      <a href="/profile"><Bookmark size={18} /><span>Saved</span></a>
    </nav>
  )
}

function ForumPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { view, boardSlug, threadId } = useMemo(() => parseForumPath(pathname), [pathname])
  const forumUserId = useMemo(() => getForumUserId(user), [user])
  const [boardStats, setBoardStats] = useState({})
  const { onlineCounts, totalOnline } = useForumPresence(user?.id, boardSlug || null)

  useEffect(() => {
    forumApiService.getBoardStats().then(setBoardStats).catch(() => {})
  }, [])

  const goHome = useCallback(() => {
    router.push('/forum')
  }, [router])

  const goToBoard = useCallback((slug) => {
    router.push(`/forum/${slug}`)
  }, [router])

  const goToThread = useCallback((thread) => {
    if (thread?.id) router.push(`/forum/thread/${thread.id}`)
  }, [router])

  return (
    <div className={s.page}>
      <div className={s.appShell}>
        {view === 'thread' ? (
          <ThreadDetailSurface
            threadId={threadId}
            boardStats={boardStats}
            onlineCounts={onlineCounts}
            totalOnline={totalOnline}
            user={user}
            userId={forumUserId}
            onAllBoards={goHome}
            onSelectBoard={goToBoard}
          />
        ) : (
          <FeedSurface
            boardSlug={boardSlug}
            boardStats={boardStats}
            onlineCounts={onlineCounts}
            totalOnline={totalOnline}
            user={user}
            userId={forumUserId}
            onAllBoards={goHome}
            onSelectBoard={goToBoard}
            onOpenThread={goToThread}
          />
        )}
      </div>
      <BottomNav onHome={goHome} />
    </div>
  )
}

export default ForumPage
