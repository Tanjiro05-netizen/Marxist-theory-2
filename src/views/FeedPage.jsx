import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { BOARDS, getBoardBySlug, getLocalizedBoardName } from '../components/Forum/constants'
import { formatRelativeTime, truncateText } from '../components/Forum/utils/formatters'
import SocialComposer from '../components/Social/SocialComposer'
import SocialPostCard from '../components/Social/SocialPostCard'
import { getSocialIdentity } from '../components/Social/SocialAvatar'
import WhoToFollow from '../components/Social/WhoToFollow'
import { useSocialFeed } from '../components/Social/hooks/useSocialFeed'
import { useSocialInteractions } from '../components/Social/hooks/useSocialInteractions'
import * as s from '../components/Social/Social.css.ts'

const SOCIAL_TABS = [
  { key: 'home', labelKey: 'feed.forYou' },
  { key: 'following', labelKey: 'feed.following', icon: UserRoundCheck },
  { key: 'hot', labelKey: 'feed.hot', icon: Flame },
]

const DISCOVERY_CATEGORIES = [
  { key: 'hot', label: 'Rising', labelKey: 'feed.rising', metaKey: 'feed.now' },
  { key: 'theory', label: 'Theory', labelKey: 'feed.theory', metaKey: 'feed.concepts' },
  { key: 'reading', label: 'Reading', labelKey: 'feed.reading', metaKey: 'feed.notes' },
  { key: 'praxis', label: 'Organizing', labelKey: 'feed.organizing', metaKey: 'feed.praxis' },
  { key: 'history', label: 'History', labelKey: 'feed.history', metaKey: 'feed.archive' },
  { key: 'meta', label: 'Meta', labelKey: 'feed.meta', metaKey: 'feed.platform' },
]

const TOPIC_DETAILS = {
  t: {
    category: 'Theory',
    categoryKey: 'feed.theory',
    description: 'Political economy, ideology, and long-form theoretical arguments.',
    descriptionKey: 'feed.topicTheoryDesc',
    host: 'Study Center',
    hostKey: 'feed.studyCenter',
    reads: '1.1M',
    index: '98.6',
  },
  r: {
    category: 'Reading',
    categoryKey: 'feed.reading',
    description: 'Reading groups, notes, passages, and shared study plans.',
    descriptionKey: 'feed.topicReadingDesc',
    host: 'Digital Library',
    hostKey: 'feed.digitalLibrary',
    reads: '577K',
    index: '87.4',
  },
  o: {
    category: 'Organizing',
    categoryKey: 'feed.organizing',
    description: 'Organizing reports, strategy notes, local work, and campaign debriefs.',
    descriptionKey: 'feed.topicOrganizingDesc',
    host: 'Community Desk',
    hostKey: 'feed.communityDesk',
    reads: '491K',
    index: '81.2',
  },
  h: {
    category: 'History',
    categoryKey: 'feed.history',
    description: 'Historical debates, anniversaries, archives, and materialist analysis.',
    descriptionKey: 'feed.topicHistoryDesc',
    host: 'History Circle',
    hostKey: 'feed.historyCircle',
    reads: '433K',
    index: '76.8',
  },
  c: {
    category: 'Rising',
    categoryKey: 'feed.rising',
    description: 'Current events, fast-moving news analysis, and public controversy.',
    descriptionKey: 'feed.topicCurrentDesc',
    host: 'News Watch',
    hostKey: 'feed.newsWatch',
    reads: '386K',
    index: '72.5',
  },
  m: {
    category: 'Meta',
    categoryKey: 'feed.meta',
    description: 'Site feedback, moderation notes, feature requests, and release discussion.',
    descriptionKey: 'feed.topicMetaDesc',
    host: 'Marxist.info',
    hostKey: 'feed.marxistInfo',
    reads: '214K',
    index: '65.1',
  },
  x: {
    category: 'Rising',
    categoryKey: 'feed.rising',
    description: 'Loose discussion, miscellany, and unexpected public chatter.',
    descriptionKey: 'feed.topicRandomDesc',
    host: 'Open Floor',
    hostKey: 'feed.openFloor',
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
    categoryKey: details.categoryKey,
    description: details.description,
    descriptionKey: details.descriptionKey,
    host: details.host,
    hostKey: details.hostKey,
    reads: details.reads,
    index: details.index,
    href: `/feed/social?topic=${encodeURIComponent(key)}`,
    boardHref: `/feed/boards?board=${encodeURIComponent(board.slug)}`,
    heat: `${Math.max(18, 92 - index * 9)}K`,
  }
})


const WEIBO_LEFT_ITEMS = [
  { key: 'rank', labelKey: 'feed.momentum', icon: TrendingUp },
  { key: 'search', labelKey: 'feed.topicScan', icon: Search },
]

const normalizeTopic = (value) => `${value || ''}`.trim().replace(/^#/, '').replace(/\s+/g, '')
const getInitialTopic = (searchParams) => normalizeTopic(searchParams.get('topic'))
const getTopicByKey = (key) => SOCIAL_HOT_TOPICS.find((topic) => topic.key.toLowerCase() === normalizeTopic(key).toLowerCase()) || null
const getTopicLabel = (t, topic) => `#${getLocalizedBoardName(t, topic.boardSlug).replace(/\s+/g, '')}`
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

const getPageTitle = (t, section, tab, boardSlug) => {
  if (section === 'boards') {
    return boardSlug ? `/${boardSlug}/ ${getLocalizedBoardName(t, boardSlug)}` : t('feed.imageboard')
  }
  if (tab === 'following') return t('feed.following')
  if (tab === 'hot') return t('feed.hot')
  return t('feed.home')
}

const getPageSubtitle = (t, section, tab, boardSlug) => {
  if (section === 'boards') {
    return boardSlug ? getLocalizedBoardName(t, boardSlug, true) : t('feed.anonymousBoardThreads')
  }
  return ''
}

function FeedTab({ tab, active, onClick }) {
  const { t } = useTranslation()
  const Icon = tab.icon
  return (
    <button className={`${s.tab} ${active ? s.tabActive : ''}`} onClick={onClick}>
      {Icon && <Icon size={16} />}
      <span>{t(tab.labelKey)}</span>
    </button>
  )
}

function SocialTopicDock({ selectedTopic }) {
  const { t } = useTranslation()
  return (
    <div className={s.socialTopicDock} aria-label={t('feed.superTopics')}>
      <Link href="/feed/social" className={`${s.socialTopicPill} ${!selectedTopic ? s.socialTopicPillActive : ''}`}>
        {t('common.all')}
      </Link>
      {SOCIAL_HOT_TOPICS.slice(0, 6).map((topic) => (
        <Link
          key={topic.key}
          href={topic.href}
          className={`${s.socialTopicPill} ${selectedTopic === topic.key ? s.socialTopicPillActive : ''}`}
        >
          {getTopicLabel(t, topic)}
        </Link>
      ))}
    </div>
  )
}

function TopicSpotlight({ topic }) {
  const { t } = useTranslation()
  if (!topic) return null

  return (
    <section className={s.topicSpotlight}>
      <div>
        <span>{t('feed.topicCircle')} · {t(topic.categoryKey)}</span>
        <h2>{getTopicLabel(t, topic)}</h2>
        <p>{t(topic.descriptionKey)}</p>
        <div className={s.topicStats}>
          <strong>{t('feed.readsLabel', { count: topic.reads })}</strong>
          <strong>{t('feed.stewardLabel')} {t(topic.hostKey)}</strong>
          <strong>{t('feed.signalLabel')} {topic.index}</strong>
        </div>
      </div>
      <div className={s.topicSpotlightActions}>
        <Link href={topic.boardHref}>{t('forum.boardsLabel')}</Link>
        <Link href="/feed/social">{t('common.clear')}</Link>
      </div>
    </section>
  )
}


function WeiboLeftRail({ activeItem, category, onCategoryChange, onPrimarySelect }) {
  const { t } = useTranslation()
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
              <span>{t(item.labelKey)}</span>
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
            {t(item.labelKey)}
          </button>
        ))}
      </div>
    </aside>
  )
}

function WeiboHotSearchPanel({ selectedTopic, category, refreshSeed, onRefresh }) {
  const { t } = useTranslation()
  const filteredTopics = getTopicsForDiscoveryCategory(category)
  const rotatedTopics = filteredTopics.length
    ? filteredTopics.map((_, index) => filteredTopics[(index + refreshSeed) % filteredTopics.length])
    : []

  return (
    <section className={s.weiboHotPanel}>
      <div className={s.weiboHotHeader}>
        <button type="button" onClick={onRefresh}>
          <RotateCw size={15} />
          <span>{t('data.refresh')}</span>
        </button>
      </div>
      <div className={s.weiboHotTabs}>
        <button type="button">{t('feed.mine')}</button>
        <button type="button" className={s.weiboHotTabActive}>{t('feed.network')}</button>
      </div>
      <div className={s.weiboHotRankList}>
        {rotatedTopics.slice(0, 10).map((topic, index) => (
          <Link
            key={`${topic.key}-${index}`}
            href={topic.href}
            className={`${s.weiboHotRankItem} ${selectedTopic === topic.key ? s.weiboHotRankItemActive : ''}`}
          >
            <span>{index + 1}</span>
            <strong>{getTopicLabel(t, topic).replace(/#/g, '')}</strong>
            <em>{topic.reads.replace(/[^\d.]/g, '') || topic.heat}</em>
            {index === 3 && <b>{t('feed.new')}</b>}
            {index === 5 && <b>{t('feed.up')}</b>}
            {index === 6 && <b>{t('feed.hot')}</b>}
          </Link>
        ))}
      </div>
      <Link href="/feed/social?tab=hot" className={s.weiboFullHotLink}>
        {t('feed.openSignalMap')}
        <ArrowUpRight size={14} />
      </Link>
    </section>
  )
}

function WeiboUtilityLinks() {
  const { t } = useTranslation()
  return (
    <div className={s.weiboUtilityLinks}>
      <span>{t('feed.help')}</span>
      <span>{t('feed.moderation')}</span>
      <span>{t('feed.communityNotes')}</span>
      <span>{t('feed.aboutCommons')}</span>
    </div>
  )
}

function SocialDiscoveryRail({ selectedTopic }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('hot')
  const normalizedQuery = query.trim().toLowerCase()
  const topics = normalizedQuery
    ? SOCIAL_HOT_TOPICS.filter((topic) => `${topic.label} ${getLocalizedBoardName(t, topic.boardSlug, true)} ${t(topic.categoryKey)} ${t(topic.descriptionKey)} ${t(topic.hostKey)}`.toLowerCase().includes(normalizedQuery))
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
          placeholder={t('feed.searchTopics')}
          aria-label={t('feed.searchTopics')}
        />
      </form>
      <div className={s.discoveryCategoryGrid} aria-label={t('feed.discoveryCategories')}>
        {DISCOVERY_CATEGORIES.map((item) => (
          <button
            key={item.key}
            className={`${s.discoveryCategoryButton} ${category === item.key ? s.discoveryCategoryButtonActive : ''}`}
            onClick={() => setCategory(item.key)}
          >
            <strong>{t(item.labelKey)}</strong>
            <span>{t(item.metaKey)}</span>
          </button>
        ))}
      </div>
      <div className={s.railHeader}>
        <span>{t('feed.hotSearch')}</span>
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
            <strong>{getTopicLabel(t, topic)}</strong>
            <small>{t(topic.categoryKey)} · {t(topic.descriptionKey)}</small>
            <em>{topic.reads}</em>
            <b>{t('feed.stewardLabel')}{': '}{t(topic.hostKey)}</b>
          </Link>
        )) : (
          <div className={s.hotSearchEmpty}>{t('feed.noMatchingTopics')}</div>
        )}
      </div>
    </section>
  )
}

function SuperTopicRail({ selectedTopic }) {
  const { t } = useTranslation()
  return (
    <section className={s.railSection}>
      <div className={s.railHeader}>
        <span>{t('feed.topicCircles')}</span>
        <BadgeCheck size={16} />
      </div>
      <div className={s.superTopicList}>
        {SOCIAL_HOT_TOPICS.slice(0, 5).map((topic) => (
          <div key={topic.key} className={`${s.superTopicItem} ${selectedTopic === topic.key ? s.superTopicItemActive : ''}`}>
            <Link href={topic.href}>
              <strong>{getTopicLabel(t, topic)}</strong>
              <span>{t(topic.categoryKey)} · {t('feed.readsLabel', { count: topic.reads })} · {t('feed.stewardLabel')} {t(topic.hostKey)}</span>
            </Link>
            <Link href={topic.boardHref} className={s.superTopicBoardLink}>
              {t('forum.board')}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function WeiboPulseRail({ selectedTopic }) {
  const { t } = useTranslation()
  const topic = getTopicByKey(selectedTopic) || SOCIAL_HOT_TOPICS[0]

  return (
    <section className={s.railSection}>
      <div className={s.pulsePanel}>
        <strong>{getTopicLabel(t, topic)}</strong>
        <p>{t(topic.descriptionKey)}</p>
        <div>
          <span>{t('feed.signalLabel')} {topic.index}</span>
          <span>{topic.heat} {t('feed.heat')}</span>
        </div>
      </div>
    </section>
  )
}

function BoardStrip({ activeBoardSlug, onAllBoards, onSelectBoard }) {
  const { t } = useTranslation()
  return (
    <div className={s.boardStrip} aria-label={t('forum.boardsLabel')}>
      <button
        className={`${s.boardStripChip} ${!activeBoardSlug ? s.boardStripChipActive : ''}`}
        onClick={onAllBoards}
      >
        {t('common.all')}
      </button>
      {BOARDS.map((board) => (
        <button
          key={board.slug}
          className={`${s.boardStripChip} ${activeBoardSlug === board.slug ? s.boardStripChipActive : ''}`}
          onClick={() => onSelectBoard(board.slug)}
        >
          /{board.slug}/
          <span>{getLocalizedBoardName(t, board)}</span>
        </button>
      ))}
    </div>
  )
}

function BoardThreadCard({ post, liked, onLike, onOpen, onBoardSelect }) {
  const { t } = useTranslation()
  if (!post) return null

  const displayedPost = post.reposted_post || post
  const identity = getSocialIdentity(displayedPost, t)
  const board = getBoardBySlug(displayedPost.board_slug)
  const shortId = `${displayedPost.id || ''}`.replace(/-/g, '').slice(0, 8) || 'thread'
  const title = displayedPost.title || truncateText(displayedPost.content || t('feed.untitledThread'), 64)
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
        <span>{identity.anonymous ? identity.name : t('feed.registeredUser')}</span>
        <span>{t('feed.bump')} {formatRelativeTime(displayedPost.bump_at || displayedPost.created_at)}</span>
        <span>{board ? getLocalizedBoardName(t, board) : t('forum.board')}</span>
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
  const { t } = useTranslation()
  const target = activeSection === 'social'
    ? { label: t('feed.imageboard'), meta: t('feed.openBoardCatalog'), href: '/feed/boards', icon: Hash }
    : { label: t('feed.social'), meta: t('feed.openAccountTimeline'), href: '/feed/social', icon: AtSign }
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
  const { t } = useTranslation()
  return (
    <section className={s.railSection}>
      <div className={s.railHeader}>
        <span>{t('forum.boardsLabel')}</span>
        <Hash size={16} />
      </div>
      <div className={s.boardList}>
        <button
          className={`${s.boardChip} ${!activeBoardSlug ? s.boardChipActive : ''}`}
          onClick={onAllBoards}
        >
          <span>{t('common.all')}</span>
          <span>{t('forum.boardsLabel').toLowerCase()}</span>
        </button>
        {BOARDS.map((board) => (
          <button
            key={board.slug}
            className={`${s.boardChip} ${activeBoardSlug === board.slug ? s.boardChipActive : ''}`}
            onClick={() => onSelectBoard(board.slug)}
          >
            <span>/{board.slug}/</span>
            <span>{getLocalizedBoardName(t, board)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function FeedPage({ initialSurface = null }) {
  const { t } = useTranslation()
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
  const pageTitle = selectedTopicInfo && !isBoards ? getTopicLabel(t, selectedTopicInfo) : getPageTitle(t, section, socialTab, boardSlug)
  const pageSubtitle = selectedTopicInfo && !isBoards ? getLocalizedBoardName(t, selectedTopicInfo.boardSlug, true) : getPageSubtitle(t, section, socialTab, boardSlug)

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
      return <div className={s.stateBlock}>{t('common.loading')}</div>
    }

    if (error) {
      return (
        <div className={s.stateBlock}>
          <div>
            <p>{error}</p>
            <button className={s.retryButton} onClick={refetch}>
              <RefreshCw size={14} /> {t('data.retry')}
            </button>
          </div>
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className={s.stateBlock}>
          {socialLocked
            ? t('feed.loginForTimeline')
            : selectedTopicInfo && !isBoards
              ? t('feed.noPostsForTopic', { topic: getTopicLabel(t, selectedTopicInfo) })
              : socialTab === 'following'
                ? t('feed.followPeoplePrompt')
                : isBoards
                  ? t('feed.noBoardThreads')
                  : t('feed.noPosts')}
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
            <Link href="/feed/boards" className={s.mobileSurfaceLink}>{t('feed.openImageboard')}</Link>

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
                  {t('common.previous')}
                </button>
                <span className={s.monoMeta}>{page} / {pagination.totalPages}</span>
                <button className={s.pageButton} disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                  {t('common.next')}
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
                <span>{isBoards ? (selectedBoard ? `/${selectedBoard.slug}/` : t('feed.allBoards')) : t('feed.accountSocial')}</span>
              </div>
            </div>

            <BoardStrip
              activeBoardSlug={boardSlug}
              onAllBoards={() => setBoardSlug('')}
              onSelectBoard={handleBoardSelect}
            />

            <Link href="/feed/social" className={s.mobileSurfaceLink}>{t('feed.openSocial')}</Link>
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
                {t('common.previous')}
              </button>
              <span className={s.monoMeta}>{page} / {pagination.totalPages}</span>
              <button className={s.pageButton} disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>
                {t('common.next')}
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
