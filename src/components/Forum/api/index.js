import { supabase } from '../../../supabaseClient'

const AUTHOR_SELECT = 'id, username, avatar_url, ideology'

export const forumApiService = {
  // ── Threads ──────────────────────────────────────────────

  async getThreads({ category, page = 1, limit = 20, sortBy = 'created_at' } = {}) {
    let query = supabase
      .from('forum_threads')
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')', { count: 'exact' })
      .order(sortBy, { ascending: false })

    if (category) {
      query = query.eq('category_slug', category)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: data || [],
      page,
      totalPages: Math.ceil((count || 0) / limit),
      total: count || 0,
    }
  },

  async getThread(threadId) {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .eq('id', threadId)
      .single()

    if (error) throw error
    return data
  },

  async createThread(threadData, userId) {
    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        title: threadData.title,
        content: threadData.content,
        category_slug: threadData.category_slug,
        author_id: userId,
        anonymous_name: threadData.anonymous_name || null,
      })
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .single()

    if (error) throw error
    return data
  },

  async updateThread(threadId, updates) {
    const { data, error } = await supabase
      .from('forum_threads')
      .update(updates)
      .eq('id', threadId)
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .single()

    if (error) throw error
    return data
  },

  async deleteThread(threadId) {
    const { error } = await supabase
      .from('forum_threads')
      .delete()
      .eq('id', threadId)

    if (error) throw error
  },

  // ── Board aggregates ─────────────────────────────────────

  async getBoardStats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [threadsRes, recentCommentsRes] = await Promise.all([
      supabase
        .from('forum_threads')
        .select('category_slug, created_at, author_id'),
      supabase
        .from('forum_comments')
        .select('author_id, thread:forum_threads!thread_id(category_slug)')
        .gte('created_at', sevenDaysAgo),
    ])

    if (threadsRes.error) throw threadsRes.error

    const stats = {}
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    ;(threadsRes.data || []).forEach((t) => {
      if (!stats[t.category_slug]) {
        stats[t.category_slug] = { threadCount: 0, activeCount: 0, recentPosters: new Set() }
      }
      stats[t.category_slug].threadCount += 1
      if (now - new Date(t.created_at).getTime() < 7 * dayMs) {
        stats[t.category_slug].activeCount += 1
        if (t.author_id) stats[t.category_slug].recentPosters.add(t.author_id)
      }
    })

    ;(recentCommentsRes.data || []).forEach((c) => {
      const slug = c.thread?.category_slug
      if (!slug) return
      if (!stats[slug]) {
        stats[slug] = { threadCount: 0, activeCount: 0, recentPosters: new Set() }
      }
      if (c.author_id) stats[slug].recentPosters.add(c.author_id)
    })

    const result = {}
    for (const [slug, s] of Object.entries(stats)) {
      result[slug] = {
        threadCount: s.threadCount,
        activeCount: s.activeCount,
        uniquePostersWeek: s.recentPosters.size,
      }
    }
    return result
  },

  // ── Comments ─────────────────────────────────────────────

  async getComments(threadId) {
    const { data, error } = await supabase
      .from('forum_comments')
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createComment(commentData, userId) {
    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        thread_id: commentData.thread_id,
        content: commentData.content,
        parent_id: commentData.parent_id || null,
        author_id: userId,
        anonymous_name: commentData.anonymous_name || null,
      })
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .single()

    if (error) throw error
    return data
  },

  async updateComment(commentId, content) {
    const { data, error } = await supabase
      .from('forum_comments')
      .update({ content })
      .eq('id', commentId)
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .single()

    if (error) throw error
    return data
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
  },

  // ── Likes ────────────────────────────────────────────────

  async like(targetType, targetId) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_likes')
      .insert({ user_id: userId, target_type: targetType, target_id: targetId })

    if (error) throw error
  },

  async unlike(targetType, targetId) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_likes')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)

    if (error) throw error
  },

  async getUserLikes(userId) {
    const { data, error } = await supabase
      .from('forum_likes')
      .select('target_type, target_id')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  },

  async getUserLikedThreads(userId) {
    const { data, error } = await supabase
      .from('forum_likes')
      .select('target_id, forum_threads:target_id(*, author:profiles!author_id(' + AUTHOR_SELECT + '))')
      .eq('user_id', userId)
      .eq('target_type', 'thread')

    if (error) throw error
    return (data || []).map((d) => d.forum_threads).filter(Boolean)
  },

  async getUserLikedComments(userId) {
    const { data, error } = await supabase
      .from('forum_likes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'comment')

    if (error) throw error
    return (data || []).map((d) => d.target_id)
  },

  // ── Bookmarks ────────────────────────────────────────────

  async getBookmarks(userId) {
    const { data, error } = await supabase
      .from('forum_bookmarks')
      .select('id, created_at, thread:forum_threads!thread_id(*, author:profiles!author_id(' + AUTHOR_SELECT + '))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getUserBookmarkIds(userId) {
    const { data, error } = await supabase
      .from('forum_bookmarks')
      .select('thread_id')
      .eq('user_id', userId)

    if (error) throw error
    return (data || []).map((d) => d.thread_id)
  },

  async addBookmark(threadId) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_bookmarks')
      .insert({ user_id: userId, thread_id: threadId })

    if (error) throw error
  },

  async removeBookmark(threadId) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('thread_id', threadId)

    if (error) throw error
  },

  // ── Reposts ──────────────────────────────────────────────

  async getUserRepostIds(userId) {
    const { data, error } = await supabase
      .from('forum_reposts')
      .select('thread_id')
      .eq('user_id', userId)

    if (error) throw error
    return (data || []).map((d) => d.thread_id)
  },

  async repost(threadId, quoteContent = null) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_reposts')
      .insert({ user_id: userId, thread_id: threadId, quote_content: quoteContent })

    if (error) throw error
    return { success: true }
  },

  async unrepost(threadId) {
    const userId = (await supabase.auth.getUser()).data?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('forum_reposts')
      .delete()
      .eq('user_id', userId)
      .eq('thread_id', threadId)

    if (error) throw error
    return { success: true }
  },

  // ── Notifications ────────────────────────────────────────

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('forum_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  },

  async getNotifications(userId, { limit = 30 } = {}) {
    const { data, error } = await supabase
      .from('forum_notifications')
      .select('*, source_user:profiles!source_user_id(id, username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async markNotificationsRead(userId) {
    const { error } = await supabase
      .from('forum_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  },

  // ── Profile / User activity ──────────────────────────────

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, ideology, created_at')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async getUserThreads(userId) {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + ')')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getUserComments(userId) {
    const { data, error } = await supabase
      .from('forum_comments')
      .select('*, author:profiles!author_id(' + AUTHOR_SELECT + '), thread:forum_threads!thread_id(id, title)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getUserReposts(userId) {
    const { data, error } = await supabase
      .from('forum_reposts')
      .select('*, thread:forum_threads!thread_id(*, author:profiles!author_id(' + AUTHOR_SELECT + '))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}

export default forumApiService
