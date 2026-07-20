import { supabase } from '../../../supabaseClient'

export const SOCIAL_PROFILE_SELECT = [
  'id',
  'username',
  'avatar_url',
  'ideology',
  'is_certified',
  'follower_count',
  'following_count',
].join(', ')

const SOCIAL_POST_SELECT = `
  *,
  author:profiles!author_id(${SOCIAL_PROFILE_SELECT}),
  quoted_post:social_posts!quoted_post_id(
    id,
    author_id,
    content,
    title,
    board_slug,
    anonymous_name,
    is_anonymous,
    created_at,
    author:profiles!author_id(${SOCIAL_PROFILE_SELECT})
  ),
  reposted_post:social_posts!repost_of_id(
    id,
    author_id,
    content,
    title,
    board_slug,
    anonymous_name,
    is_anonymous,
    created_at,
    reply_count,
    like_count,
    repost_count,
    quote_count,
    author:profiles!author_id(${SOCIAL_PROFILE_SELECT})
  )
`

const PUBLIC_BOARD_POST_SELECT = `
  *,
  quoted_post:social_posts!quoted_post_id(
    id,
    author_id,
    content,
    title,
    board_slug,
    anonymous_name,
    is_anonymous,
    created_at
  ),
  reposted_post:social_posts!repost_of_id(
    id,
    author_id,
    content,
    title,
    board_slug,
    anonymous_name,
    is_anonymous,
    created_at,
    reply_count,
    like_count,
    repost_count,
    quote_count
  )
`

const normalizePage = ({ data, count, page, limit }) => ({
  data: data || [],
  page,
  total: count || 0,
  totalPages: Math.ceil((count || 0) / limit),
})

const ignoreDuplicate = (error) => {
  if (!error) return
  if (error.code === '23505') return
  throw error
}

const getUserId = async () => {
  const userId = (await supabase.auth.getUser()).data?.user?.id
  if (!userId) throw new Error('Not authenticated')
  return userId
}

const applyTopicFilter = (query, topic) => {
  const normalizedTopic = `${topic || ''}`.trim().replace(/^#/, '')
  if (!normalizedTopic) return query
  return query.ilike('content', `%#${normalizedTopic}%`)
}

const applyTimelineMode = async (query, { mode, boardSlug, userId, sortBy, topic }) => {
  let nextQuery = query.eq('is_deleted', false)

  if (boardSlug || mode === 'boards') {
    if (boardSlug) nextQuery = nextQuery.eq('board_slug', boardSlug)
    nextQuery = nextQuery.is('parent_id', null)
    return { query: nextQuery.order('bump_at', { ascending: false }) }
  }

  if (mode === 'following') {
    if (!userId) return { empty: true }
    const followingIds = await socialApiService.getFollowingIds(userId)
    if (!followingIds.length) return { empty: true }
    return {
      query: applyTopicFilter(nextQuery
        .in('author_id', followingIds)
        .eq('is_anonymous', false)
        .is('board_slug', null)
        .is('parent_id', null), topic)
        .order('created_at', { ascending: false }),
    }
  }

  if (mode === 'hot') {
    return {
      query: applyTopicFilter(nextQuery
        .is('board_slug', null)
        .is('parent_id', null), topic)
        .order(sortBy || 'like_count', { ascending: false })
        .order('created_at', { ascending: false }),
    }
  }

  return {
    query: applyTopicFilter(nextQuery
      .eq('is_anonymous', false)
      .is('board_slug', null)
      .is('parent_id', null), topic)
      .order(sortBy || 'created_at', { ascending: false }),
  }
}

export const socialApiService = {
  async getTimeline({ mode = 'home', boardSlug = null, page = 1, limit = 20, userId = null, sortBy = null, topic = null } = {}) {
    if (mode !== 'boards' && !userId) {
      return normalizePage({ data: [], count: 0, page, limit })
    }

    const select = mode === 'boards' && !userId ? PUBLIC_BOARD_POST_SELECT : SOCIAL_POST_SELECT
    let query = supabase
      .from('social_posts')
      .select(select, { count: 'exact' })

    const modeQuery = await applyTimelineMode(query, { mode, boardSlug, userId, sortBy, topic })
    if (modeQuery.empty) return normalizePage({ data: [], count: 0, page, limit })

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await modeQuery.query.range(from, to)
    if (error) throw error
    return normalizePage({ data, count, page, limit })
  },

  async getPost(postId, { includeProfiles = true } = {}) {
    const { data, error } = await supabase
      .from('social_posts')
      .select(includeProfiles ? SOCIAL_POST_SELECT : PUBLIC_BOARD_POST_SELECT)
      .eq('id', postId)
      .single()

    if (error) throw error
    return data
  },

  async getThread(rootId, { includeProfiles = true } = {}) {
    const { data, error } = await supabase
      .from('social_posts')
      .select(includeProfiles ? SOCIAL_POST_SELECT : PUBLIC_BOARD_POST_SELECT)
      .eq('root_id', rootId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createPost(postData, userId) {
    const boardSlug = postData.boardSlug || null
    const isBoardPost = Boolean(boardSlug)
    const authorId = userId || (isBoardPost ? null : await getUserId())
    const isAnonymous = isBoardPost && Boolean(postData.isAnonymous || !authorId)

    const { data, error } = await supabase
      .from('social_posts')
      .insert({
        author_id: authorId,
        content: postData.content?.trim() || '',
        title: postData.title?.trim() || null,
        board_slug: boardSlug,
        parent_id: postData.parentId || null,
        quoted_post_id: postData.quotedPostId || null,
        repost_of_id: postData.repostOfId || null,
        is_anonymous: isAnonymous,
        anonymous_name: isAnonymous ? (postData.anonymousName?.trim() || 'Anonymous') : null,
        visibility: isBoardPost ? 'public' : (postData.visibility || 'public'),
      })
      .select(authorId ? SOCIAL_POST_SELECT : PUBLIC_BOARD_POST_SELECT)
      .single()

    if (error) throw error
    return data
  },

  async likePost(postId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_post_likes')
      .insert({ user_id: userId, post_id: postId })
    ignoreDuplicate(error)
  },

  async unlikePost(postId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)
    if (error) throw error
  },

  async getUserLikeIds(userId, postIds = []) {
    if (!userId) return []
    let query = supabase
      .from('social_post_likes')
      .select('post_id')
      .eq('user_id', userId)

    if (postIds.length) query = query.in('post_id', postIds)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map((item) => item.post_id)
  },

  async repostPost(postId) {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('social_posts')
      .insert({ author_id: userId, content: '', repost_of_id: postId })
      .select(SOCIAL_POST_SELECT)
      .single()

    ignoreDuplicate(error)
    return data
  },

  async unrepostPost(postId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('author_id', userId)
      .eq('repost_of_id', postId)
    if (error) throw error
  },

  async getUserRepostIds(userId, postIds = []) {
    if (!userId) return []
    let query = supabase
      .from('social_posts')
      .select('repost_of_id')
      .eq('author_id', userId)
      .not('repost_of_id', 'is', null)

    if (postIds.length) query = query.in('repost_of_id', postIds)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map((item) => item.repost_of_id).filter(Boolean)
  },

  async followUser(targetUserId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_follows')
      .insert({ follower_id: userId, following_id: targetUserId })
    ignoreDuplicate(error)
  },

  async unfollowUser(targetUserId) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
    if (error) throw error
  },

  async isFollowing(targetUserId) {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('social_follows')
      .select('following_id')
      .eq('follower_id', userId)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (error) throw error
    return Boolean(data)
  },

  async getFollowingIds(userId) {
    if (!userId) return []
    const { data, error } = await supabase
      .from('social_follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (error) throw error
    return (data || []).map((row) => row.following_id)
  },

  async getFollowers(userId) {
    const { data, error } = await supabase
      .from('social_follows')
      .select(`created_at, follower:profiles!follower_id(${SOCIAL_PROFILE_SELECT})`)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((row) => ({ ...row.follower, followed_at: row.created_at })).filter(Boolean)
  },

  async getFollowing(userId) {
    const { data, error } = await supabase
      .from('social_follows')
      .select(`created_at, following:profiles!following_id(${SOCIAL_PROFILE_SELECT})`)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((row) => ({ ...row.following, followed_at: row.created_at })).filter(Boolean)
  },

  async getSuggestedUsers(userId, limit = 5) {
    const followingIds = userId ? await this.getFollowingIds(userId) : []
    const excluded = new Set([userId, ...followingIds].filter(Boolean))

    const { data, error } = await supabase
      .from('profiles')
      .select(SOCIAL_PROFILE_SELECT)
      .not('username', 'is', null)
      .order('follower_count', { ascending: false })
      .limit(limit + excluded.size + 8)

    if (error) throw error
    return (data || [])
      .filter((profile) => profile?.id && !excluded.has(profile.id))
      .slice(0, limit)
  },

  async getNotifications(userId, { limit = 30 } = {}) {
    const { data, error } = await supabase
      .from('social_notifications')
      .select(`*, source_user:profiles!source_user_id(${SOCIAL_PROFILE_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('social_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  },

  async markNotificationRead(notificationId) {
    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    if (error) throw error
  },

  async markAllNotificationsRead(userId) {
    const { error } = await supabase
      .from('social_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw error
  },

  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('social_notifications')
      .delete()
      .eq('id', notificationId)
    if (error) throw error
  },

  async clearAllNotifications(userId) {
    const { error } = await supabase
      .from('social_notifications')
      .delete()
      .eq('user_id', userId)
    if (error) throw error
  },

  async reportPost(postId, reason, details = null) {
    const userId = await getUserId()
    const { error } = await supabase
      .from('social_reports')
      .insert({ reporter_id: userId, post_id: postId, reason, details })
    ignoreDuplicate(error)
  },
}

export default socialApiService
