import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowUpRight,
  AtSign,
  BadgeCheck,
  Flame,
  Hash,
  Heart,
  Lock,
  MessageCircle,
  Radio,
  RefreshCw,
  RotateCw,
  Search,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BOARDS, getBoardBySlug } from '../components/Forum/constants'
import { formatRelativeTime, truncateText } from '../components/Forum/utils/formatters'
import SocialComposer from '../components/Social/SocialComposer'
import SocialPostCard from '../components/Social/SocialPostCard'
import { getSocialIdentity } from '../components/Social/SocialAvatar'
import WhoToFollow from '../components/Social/WhoToFollow'
import { useSocialFeed } from '../components/Social/hooks/useSocialFeed'
import { useSocialInteractions } from '../components/Social/hooks/useSocialInteractions'
import * as s from '../components/Social/Social.css.ts'

const SOCIAL_TABS = [
  { key: 'home', label: 'For You' },
  { key: 'following', label: 'Following', icon: UserRoundCheck },
  { key: 'hot', label: 'Hot', icon: Flame },
]

const DISCOVERY_CATEGORIES = [
  { key: 'hot', label: 'Rising', meta: 'Now' },
  { key: 'theory', label: 'Theory', meta: 'Concepts' },
  { key: 'reading', label: 'Reading', meta: 'Notes' },
  { key: 'praxis', label: 'Organizing', meta: 'Praxis' },
  { key: 'history', label: 'History', meta: 'Archive' },
  { key: 'meta', label: 'Meta', meta: 'Platform' },
]

const TOPIC_DETAILS = {
  t: {
    category: 'Theory',
    description: 'Political economy, ideology, and long-form theoretical arguments.',
    host: 'Study Center',
    reads: '1.1M',
    index: '98.6',
  },
  r: {
    category: 'Reading',
    description: 'Reading groups, notes, passages, and shared study plans.',
    host: 'Digital Library',
    reads: '577K',
    index: '87.4',
  },
  o: {
    category: 'Organizing',
    description: 'Organizing reports, strategy notes, local work, and campaign debriefs.',
    host: 'Community Desk',
    reads: '491K',
    index: '81.2',
  },
  h: {
    category: 'History',
    description: 'Historical debates, anniversaries, archives, and materialist analysis.',
    host: 'History Circle',
    reads: '433K',
    index: '76.8',
  },
  c: {
    category: 'Rising',
    description: 'Current events, fast-moving news analysis, and public controversy.',
    host: 'News Watch',
    reads: '386K',
    index: '72.5',
  },
  m: {
    category: 'Meta',
    description: 'Site feedback, moderation notes, feature requests, and release discussion.',
    host: 'Marxist.info',
    reads: '214K',
    index: '65.1',
  },
  x: {
    category: 'Rising',
    description: 'Loose discussion, miscellany, and unexpected public chatter.',
    host: 'Open Floor',
    reads: '188K',
    index: '58.9',
  },
}

const SOCIAL_HOT_TOPICS = BOARDS.map((board, index) => {
  const details = TOPIC_DETAILS[board.slug] || TOPIC_DETAILS.x
  const key = board.name.replace(/\s+/g, '')
  return {
    key,
    rank: index + 1,
    topLabel: index < 3 ? `TOP${index + 1}` : `${index + 1}`,
    label: `#${key}`,
    boardSlug: board.slug,
    meta: board.fullName,
    category: details.category,
    description: details.description,
    host: details.host,
    reads: details.reads,
    index: details.index,
    href: `/feed/social?topic=${encodeURIComponent(key)}`,
    boardHref: `/feed/boards?board=${encodeURIComponent(board.slug)}`,
    heat: `${Math.max(18, 92 - index * 9)}K`,
  }
})


const WEIBO_LEFT_ITEMS = [
  { key: 'rank', label: 'Momentum', icon: TrendingUp },
  { key: 'search', label: 'Topic scan', icon: Search },
]

const normalizeTopic = (value) => `${value || ''}`.trim().replace(/^#/, '').replace(/\s+/g, '')
const getInitialTopic = (searchParams) => normalizeTopic(searchParams.get('topic'))
const getTopicByKey = (key) => SOCIAL_HOT_TOPICS.find((topic) => topic.key.toLowerCase() === normalizeTopic(key).toLowerCase()) || null
const getTopicsForDiscoveryCategory = (category) => {
  const activeCategory = DISCOVERY_CATEGORIES.find((item) => item.key === category)?.label
  if (!activeCategory || category === 'hot') return SOCIAL_HOT_TOPICS
  const topics = SOCIAL_HOT_TOPICS.filter((topic) => topic.category === activeCategory)
  return topics.length ? topics : SOCIAL_HOT_TOPICS
}

const getInitialSection = (searchParams, initialSurface = null) => {
  if (initialSurface === 'boards' || initialSurface === 'social') return initialSurface

  const section = searchParams.get('section')
  if (section === 'boards' || section === 'imageboard') return 'boards'
  if (section === 'social') return 'social'

  const legacyTab = searchParams.get('tab')
  if (legacyTab === 'forum' || legacyTab === 'boards') return 'boards'
  if (searchParams.get('board')) return 'boards'
  return 'social'
}

const getInitialSocialTab = (searchParams) => {
  const tab = searchParams.get('tab')
  return SOCIAL_TABS.some((item) => item.key === tab) ? tab : 'home'
}

const getPageTitle = (section, tab, boardSlug) => {
  if (section === 'boards') {
    return boardSlug ? `/${boardSlug}/ ${getBoardBySlug(boardSlug)?.name || 'Board'}` : 'Imageboard'
  }
  if (tab === 'following') return 'Following'
  if (tab === 'hot') return 'Hot'
  return 'Home'
}

const getPageSubtitle = (section, tab, boardSlug) => {
  if (section === 'boards') {
    return boardSlug ? getBoardBySlug(boardSlug)?.fullName || 'Board feed' : 'Anonymous board threads'
  }
  return ''
}

function FeedTab({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button className={`${s.tab} ${active ? s.tabActive : ''}`} onClick={onClick}>
      {Icon && <Icon size={16} />}
      <span>{tab.label}</span>
    </button>
  )
}

function SocialTopicDock({ selectedTopic }) {
  return (
    <div className={s.socialTopicDock} aria-label="Super topics">
      <Link href="/feed/social" className={`${s.socialTopicPill} ${!selectedTopic ? s.socialTopicPillActive : ''}`}>
        All
      </Link>
      {SOCIAL_HOT_TOPICS.slice(0, 6).map((topic) => (
        <Link
          key={topic.key}
          href={topic.href}
          className={`${s.socialTopicPill} ${selectedTopic === topic.key ? s.socialTopicPillActive : ''}`}
        >
          {topic.label}
        </Link>
      ))}
    </div>
  )
}

function TopicSpotlight({ topic }) {
  if (!topic) return null

  return (
    <section className={s.topicSpotlight}>
      <div>
        <span>Topic circle · {topic.category}</span>
        <h2>{topic.label}</h2>
        <p>{topic.description}</p>
        <div className={s.topicStats}>
          <strong>{topic.reads} reads</strong>
          <strong>steward {topic.host}</strong>
          <strong>signal {topic.index}</strong>
        </div>
      </div>
      <div className={s.topicSpotlightActions}>
        <Link href={topic.boardHref}>Board</Link>
        <Link href="/feed/social">Clear</Link>
      </div>
    </section>
  )
}


function WeiboLeftRail({ activeItem, category, onCategoryChange, onPrimarySelect }) {
  const categoryItems = DISCOVERY_CATEGORIES.filter((item) => item.key !== 'hot')

  return (
    <aside className={s.weiboLeftRail}>
      <div className={s.weiboLeftNavGroup}>
        {WEIBO_LEFT_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              className={`${s.weiboLeftNavItem} ${item.key === activeItem ? s.weiboLeftNavItemActive : ''}`}
              onClick={() => onPrimarySelect(item.key)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className={s.weiboLeftCategoryList}>
        {categoryItems.map((item) => (
          <button
            key={item.key}
            className={`${s.weiboLeftCategoryItem} ${category === item.key ? s.weiboLeftCategoryItemActive : ''}`}
            onClick={() => onCategoryChange(item.key)}
          >
            <span>•</span>
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  )
}

function WeiboHotSearchPanel({ selectedTopic, category, refreshSeed, onRefresh }) {
  const filteredTopics = getTopicsForDiscoveryCategory(category)
  const rotatedTopics = filteredTopics.length
    ? filteredTopics.map((_, index) => filteredTopics[(index + refreshSeed) % filteredTopics.length])
    : []

  return (
    <section className={s.weiboHotPanel}>
      <div className={s.weiboHotHeader}>
        <button type="button" onClick={onRefresh}>
          <RotateCw size={15} />
          <span>Refresh</span>
        </button>
      </div>
      <div className={s.weiboHotTabs}>
        <button type="button">Mine</button>
        <button type="button" className={s.weiboHotTabActive}>Network</button>
      </div>
      <div className={s.weiboHotRankList}>
        {rotatedTopics.slice(0, 10).map((topic, index) => (
          <Link
            key={`${topic.key}-${index}`}
            href={topic.href}
            className={`${s.weiboHotRankItem} ${selectedTopic === topic.key ? s.weiboHotRankItemActive : ''}`}
          >
            <span>{index + 1}</span>
            <strong>{topic.label.replace(/#/g, '')}</strong>
            <em>{topic.reads.replace(/[^\d.]/g, '') || topic.heat}</em>
            {index === 3 && <b>new</b>}
            {index === 5 && <b>up</b>}
            {index === 6 && <b>hot</b>}
          </Link>
        ))}
      </div>
      <Link href="/feed/social?tab=hot" className={s.weiboFullHotLink}>
        Open signal map
        <ArrowUpRight size={14} />
      </Link>
    </section>
  )
}

function WeiboUtilityLinks() {
  return (
    <div className={s.weiboUtilityLinks}>
      <span>Help</span>
      <span>Moderation</span>
      <span>Community notes</span>
      <span>About Commons</span>
    </div>
  )
}

function SocialDiscoveryRail({ selectedTopic }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('hot')
  const normalizedQuery = query.trim().toLowerCase()
  const topics = normalizedQuery
    ? SOCIAL_HOT_TOPICS.filter((topic) => `${topic.label} ${topic.meta} ${topic.category} ${topic.description} ${topic.host}`.toLowerCase().includes(normalizedQuery))
    : SOCIAL_HOT_TOPICS
  const visibleTopics = category === 'hot'
    ? topics
    : topics.filter((topic) => topic.category === DISCOVERY_CATEGORIES.find((item) => item.key === category)?.label)

  return (
    <section className={s.railSection}>
      <form className={s.socialSearchBox} onSubmit={(event) => event.preventDefault()}>
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topics"
          aria-label="Search topics"
        />
      </form>
      <div className={s.discoveryCategoryGrid} aria-label="Discovery categories">
        {DISCOVERY_CATEGORIES.map((item) => (
          <button
            key={item.key}
            className={`${s.discoveryCategoryButton} ${category === item.key ? s.discoveryCategoryButtonActive : ''}`}
            onClick={() => setCategory(item.key)}
          >
            <strong>{item.label}</strong>
            <span>{item.meta}</span>
          </button>
        ))}
      </div>
      <div className={s.railHeader}>
        <span>Hot Search</span>
        <TrendingUp size={16} />
      </div>
      <div className={s.hotSearchList}>
        {visibleTopics.length > 0 ? visibleTopics.map((topic) => (
          <Link
            key={topic.label}
            href={topic.href}
            className={`${s.hotSearchItem} ${selectedTopic === topic.key ? s.hotSearchItemActive : ''}`}
          >
            <span>{topic.topLabel}</span>
            <strong>{topic.label}</strong>
            <small>{topic.category} · {topic.description}</small>
            <em>{topic.reads}</em>
            <b>steward: {topic.host}</b>
          </Link>
        )) : (
          <div className={s.hotSearchEmpty}>No matching topics.</div>
        )}
      </div>
    </section>
  )
}

function SuperTopicRail({ selectedTopic }) {
  return (
    <section className={s.railSection}>
      <div className={s.railHeader}>
        <span>Topic Circles</span>
        <BadgeCheck size={16} />
      </div>
      <div className={s.superTopicList}>
        {SOCIAL_HOT_TOPICS.slice(0, 5).map((topic) => (
          <div key={topic.key} className={`${s.superTopicItem} ${selectedTopic === topic.key ? s.superTopicItemActive : ''}`}>
            <Link href={topic.href}>
              <strong>{topic.label}</strong>
              <span>{topic.category} · {topic.reads} reads · steward {topic.host}</span>
            </Link>
            <Link href={topic.boardHref} className={s.superTopicBoardLink}>
              board
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function WeiboPulseRail({ selectedTopic }) {
  const topic = getTopicByKey(selectedTopic) || SOCIAL_HOT_TOPICS[0]

  return (
    <section className={s.railSection}>
      <div className={s.pulsePanel}>
        <strong>{topic.label}</strong>
        <p>{topic.description}</p>
        <div>
          <span>signal {topic.index}</span>
          <span>{topic.heat} heat</span>
        </div>
      </div>
    </section>
  )
}

function BoardStrip({ activeBoardSlug, onAllBoards, onSelectBoard }) {
  return (
    <div className={s.boardStrip} aria-label="Boards">
      <button
        className={`${s.boardStripChip} ${!activeBoardSlug ? s.boardStripChipActive : ''}`}
        onClick={onAllBoards}
      >
        All
      </button>
      {BOARDS.map((board) => (
        <button
          key={board.slug}
          className={`${s.boardStripChip} ${activeBoardSlug === board.slug ? s.boardStripChipActive : ''}`}
          onClick={() => onSelectBoard(board.slug)}
        >
          /{board.slug}/
          <span>{board.name}</span>
        </button>
      ))}
    </div>
  )
}

function BoardThreadCard({ post, liked, onLike, onOpen, onBoardSelect }) {
  if (!post) return null

  const displayedPost = post.reposted_post || post
  const identity = getSocialIdentity(displayedPost)
  const board = getBoardBySlug(displayedPost.board_slug)
  const shortId = `${displayedPost.id || ''}`.replace(/-/g, '').slice(0, 8) || 'thread'
  const title = displayedPost.title || truncateText(displayedPost.content || 'Untitled thread', 64)
  const excerpt = truncateText(displayedPost.content || '', 190)

  return (
    <article className={s.threadCard}>
      <div className={s.threadCardHeader}>
        <button
          className={s.threadBoardTag}
          onClick={() => displayedPost.board_slug && onBoardSelect?.(displayedPost.board_slug)}
        >
          /{displayedPost.board_slug || board?.slug || 'x'}/
        </button>
        <span>No.{shortId}</span>
      </div>

      <button className={s.threadTitleButton} onClick={() => onOpen?.(displayedPost)}>
        <strong>{title}</strong>
        <ArrowUpRight size={15} />
      </button>

      {excerpt && <p className={s.threadExcerpt}>{excerpt}</p>}

      <div className={s.threadMetaGrid}>
        <span>{identity.anonymous ? identity.name : 'Registered user'}</span>
        <span>bump {formatRelativeTime(displayedPost.bump_at || displayedPost.created_at)}</span>
        <span>{board?.name || 'Board'}</span>
      </div>

      <div className={s.threadFooter}>
        <button className={s.threadStatButton} onClick={() => onOpen?.(displayedPost)}>
          <MessageCircle size={14} />
          <span>{displayedPost.reply_count || 0}</span>
        </button>
        <button className={`${s.threadStatButton} ${liked ? s.actionActive : ''}`} onClick={() => onLike?.(displayedPost.id)}>
          <Heart size={14} />
          <span>{displayedPost.like_count || 0}</span>
        </button>
      </div>
    </article>
  )
}

function SurfaceReference({ activeSection }) {
  const target = activeSection === 'social'
    ? { label: 'Imageboard', meta: 'Open the anonymous board catalog', href: '/feed/boards', icon: Hash }
    : { label: 'Social', meta: 'Open the account timeline', href: '/feed/social', icon: AtSign }
  const Icon = target.icon

  return (
    <section className={s.railSection}>
      <Link href={target.href} className={s.surfaceReferenceLink}>
        <span>
          <Icon size={16} />
          {target.label}
        </span>
        <small>{target.meta}</small>
      </Link>
    </section>
  )
}

function BoardRail({ activeBoardSlug, onAllBoards, onSelectBoard }) {
  return (
    <section className={s.railSection}>
      <div className={s.railHeader}>
        <span>Boards</span>
        <Hash size={16} />
      </div>
      <div className={s.boardList}>
        <button
          className={`${s.boardChip} ${!activeBoardSlug ? s.boardChipActive : ''}`}
          onClick={onAllBoards}
        >
          <span>All</span>
          <span>boards</span>
        </button>
        {BOARDS.map((board) => (
          <button
            key={board.slug}
            className={`${s.boardChip} ${activeBoardSlug === board.slug ? s.boardChipActive : ''}`}
            onClick={() => onSelectBoard(board.slug)}
          >
            <span>/{board.slug}/</span>
            <span>{board.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function FeedPage({ initialSurface = null }) {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const explicitSection = Boolean(initialSurface) || searchParams.has('section') || searchParams.has('tab') || searchParams.has('board') || searchParams.has('topic')
  const [section, setSection] = useState(() => getInitialSection(searchParams, initialSurface))
  const [socialTab, setSocialTab] = useState(() => getInitialSocialTab(searchParams))
  const [selectedTopic, setSelectedTopic] = useState(() => getInitialTopic(searchParams))
  const [boardSlug, setBoardSlug] = useState(searchParams.get('board') || '')
  const [page, setPage] = useState(1)
  const [quoteTarget, setQuoteTarget] = useState(null)
  const [guestDefaultApplied, setGuestDefaultApplied] = useState(false)
  const [weiboSearch, setWeiboSearch] = useState('')
  const [weiboRailMode, setWeiboRailMode] = useState('hot')
  const [weiboCategory, setWeiboCategory] = useState('hot')
  const [hotRefreshSeed, setHotRefreshSeed] = useState(0)

  const isBoards = section === 'boards'
  const socialLocked = section === 'social' && !authLoading && !user?.id
  const mode = isBoards ? 'boards' : socialTab
  const defaultComposerBoard = isBoards ? (boardSlug || BOARDS[0].slug) : ''
  const selectedBoard = useMemo(() => getBoardBySlug(boardSlug), [boardSlug])
  const selectedTopicInfo = useMemo(() => getTopicByKey(selectedTopic), [selectedTopic])
  const pageTitle = selectedTopicInfo && !isBoards ? selectedTopicInfo.label : getPageTitle(section, socialTab, boardSlug)
  const pageSubtitle = selectedTopicInfo && !isBoards ? selectedTopicInfo.meta : getPageSubtitle(section, socialTab, boardSlug)

  const { posts, pagination, loading, error, refetch } = useSocialFeed({
    mode,
    boardSlug: isBoards ? boardSlug : null,
    userId: user?.id,
    page,
    limit: 20,
    topic: isBoards ? null : selectedTopic,
    enabled: isBoards || Boolean(user?.id),
  })

  const interactions = useSocialInteractions(posts, user?.id)

  useEffect(() => {
    const nextSection = getInitialSection(searchParams, initialSurface)
    setSection(nextSection)
    setSocialTab(getInitialSocialTab(searchParams))
    setSelectedTopic(nextSection === 'social' ? getInitialTopic(searchParams) : '')
    setBoardSlug(nextSection === 'boards' ? (searchParams.get('board') || '') : '')
  }, [initialSurface, pathname, searchKey, searchParams])

  useEffect(() => {
    if (!authLoading && !user?.id && !explicitSection && !guestDefaultApplied) {
      setSection('boards')
      setGuestDefaultApplied(true)
    }
  }, [authLoading, explicitSection, guestDefaultApplied, user?.id])

  useEffect(() => {
    if (authLoading && !explicitSection) return

    const params = new URLSearchParams()
    if (section === 'boards') {
      if (boardSlug) params.set('board', boardSlug)
    } else {
      if (socialTab !== 'home') params.set('tab', socialTab)
      if (selectedTopic) params.set('topic', selectedTopic)
    }
    const query = params.toString()
    const targetPath = section === 'boards' ? '/feed/boards' : '/feed/social'
    const target = query ? `${targetPath}?${query}` : targetPath
    const current = searchKey ? `${pathname}?${searchKey}` : pathname
    if (current !== target) {
      router.replace(target, { scroll: false })
    }
  }, [authLoading, boardSlug, explicitSection, pathname, router, searchKey, section, selectedTopic, socialTab])

  useEffect(() => {
    setPage(1)
    setQuoteTarget(null)
  }, [boardSlug, section, selectedTopic, socialTab])

  const handleBoardSelect = (slug) => {
    setSection('boards')
    setBoardSlug(slug)
  }

  const handleCreated = () => {
    setQuoteTarget(null)
    refetch()
    interactions.refresh()
  }

  const requireLogin = () => {
    router.push('/login')
  }

  const handleWeiboSearch = (event) => {
    event.preventDefault()
    const topic = normalizeTopic(weiboSearch)
    if (!topic) return
    router.push(`/feed/social?topic=${encodeURIComponent(topic)}`)
  }

  const handleWeiboPrimarySelect = (key) => {
    setWeiboRailMode(key)
    if (key === 'hot') {
      setSocialTab('home')
      setWeiboCategory('hot')
      return
    }
    if (key === 'rank') {
      setSocialTab('hot')
      setWeiboCategory('hot')
      return
    }
    setHotRefreshSeed((value) => value + 1)
  }

  const renderContent = () => {
    if (loading) {
      return <div className={s.stateBlock}>Loading...</div>
    }

    if (error) {
      return (
        <div className={s.stateBlock}>
          <div>
            <p>{error}</p>
            <button className={s.retryButton} onClick={refetch}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className={s.stateBlock}>
          {socialLocked ? 'Log in to use the social timeline.' : selectedTopicInfo && !isBoards ? `No posts for ${selectedTopicInfo.label} yet.` : socialTab === 'following' ? 'Follow people to build this feed.' : isBoards ? 'No board threads yet.' : 'No posts yet.'}
        </div>
      )
    }

    if (isBoards) {
      return (
        <div className={s.boardCatalog}>
          {posts.map((post) => {
            const actionPost = post.reposted_post || post
            return (
              <BoardThreadCard
                key={post.id}
                post={post}
                liked={interactions.isLiked(actionPost.id)}
                onLike={user?.id ? interactions.toggleLike : requireLogin}
                onOpen={(target) => router.push(`/feed/post/${target.id}`)}
                onBoardSelect={handleBoardSelect}
              />
            )
          })}
        </div>
      )
    }

    return (
      <div className={s.feedList}>
        {posts.map((post) => {
          const actionPost = post.reposted_post || post
          return (
            <SocialPostCard
              key={post.id}
              post={post}
              liked={interactions.isLiked(actionPost.id)}
              reposted={interactions.isReposted(actionPost.id)}
              onLike={user?.id ? interactions.toggleLike : requireLogin}
              onRepost={user?.id ? interactions.toggleRepost : requireLogin}
              onQuote={user?.id ? (target) => setQuoteTarget(target) : requireLogin}
              onReply={(target) => router.push(`/feed/post/${target.id}`)}
              onBoardSelect={handleBoardSelect}
              variant="social"
            />
          )
        })}
      </div>
    )
  }

  if (!isBoards) {
    return (
      <div className={`${s.page} ${s.weiboPage}`}>
        <div className={s.weiboShell}>
          <WeiboLeftRail
            activeItem={weiboRailMode}
            category={weiboCategory}
            onPrimarySelect={handleWeiboPrimarySelect}
            onCategoryChange={(category) => {
              setWeiboRailMode('search')
              setWeiboCategory(category)
            }}
          />

          <main className={s.weiboMainFeed}>
            <div className={s.weiboFeedTabs}>
              {SOCIAL_TABS.map((feedTab) => (
                <FeedTab
                  key={feedTab.key}
                  tab={feedTab}
                  active={socialTab === feedTab.key}
                  onClick={() => setSocialTab(feedTab.key)}
                />
              ))}
            </div>
            <SocialTopicDock selectedTopic={selectedTopic} />
            <Link href="/feed/boards" className={s.mobileSurfaceLink}>Open Imageboard</Link>

            <SocialComposer
              composerId="social-composer"
              user={user}
              profile={profile}
              mode="social"
              quotedPost={quoteTarget}
              suggestedTopics={selectedTopicInfo ? [selectedTopicInfo.label] : undefined}
              onCancelQuote={() => setQuoteTarget(null)}
              onCreated={handleCreated}
            />

            {selectedTopicInfo && <TopicSpotlight topic={selectedTopicInfo} />}
            {renderContent()}

            {pagination.totalPages > 1 && (
              <div className={s.pagination}>
                <button className={s.pageButton} disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </button>
                <span className={s.monoMeta}>{page} / {pagination.totalPages}</span>
                <button className={s.pageButton} disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                  Next
                </button>
              </div>
            )}
          </main>

          <aside className={s.weiboRightRail}>
            <WeiboHotSearchPanel
              selectedTopic={selectedTopic}
              category={weiboCategory}
              refreshSeed={hotRefreshSeed}
              onRefresh={() => setHotRefreshSeed((value) => value + 1)}
            />
            <SuperTopicRail selectedTopic={selectedTopic} />
            <WeiboPulseRail selectedTopic={selectedTopic} />
            {user?.id && <WhoToFollow userId={user.id} />}
            <SurfaceReference activeSection={section} />
            <WeiboUtilityLinks />
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={`${s.shell} ${s.shellBoards}`}>
        <main className={`${s.mainColumn} ${s.mainColumnBoards}`}>
          <header className={`${s.timelineHeader} ${s.timelineHeaderBoards}`}>
            <div className={s.headerTop}>
              <div className={s.titleBlock}>
                <h1>{pageTitle}</h1>
                {pageSubtitle && <p>{pageSubtitle}</p>}
              </div>
              <div className={s.boardPicker}>
                {socialLocked ? <Lock size={15} /> : <Radio size={15} />}
                <span>{isBoards ? (selectedBoard ? `/${selectedBoard.slug}/` : 'all boards') : 'account social'}</span>
              </div>
            </div>

            <BoardStrip
              activeBoardSlug={boardSlug}
              onAllBoards={() => setBoardSlug('')}
              onSelectBoard={handleBoardSelect}
            />

            <Link href="/feed/social" className={s.mobileSurfaceLink}>Open Social</Link>
          </header>

          <SocialComposer
            user={user}
            profile={profile}
            mode={isBoards ? 'board' : 'social'}
            defaultBoardSlug={defaultComposerBoard}
            quotedPost={quoteTarget}
            suggestedTopics={selectedTopicInfo ? [selectedTopicInfo.label] : undefined}
            onCancelQuote={() => setQuoteTarget(null)}
            onCreated={handleCreated}
          />

          {renderContent()}

          {pagination.totalPages > 1 && (
            <div className={s.pagination}>
              <button className={s.pageButton} disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Previous
              </button>
              <span className={s.monoMeta}>{page} / {pagination.totalPages}</span>
              <button className={s.pageButton} disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </div>
          )}
        </main>

        <aside className={s.rail}>
          <SurfaceReference activeSection={section} />
          <BoardRail
            activeBoardSlug={boardSlug}
            onAllBoards={() => {
              setSection('boards')
              setBoardSlug('')
            }}
            onSelectBoard={handleBoardSelect}
          />
        </aside>
      </div>
    </div>
  )
}

export default FeedPage
