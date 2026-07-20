import { supabase } from '../../../supabaseClient'

class KnowledgeApiService {
  // ============================================
  // TOPICS
  // ============================================

  async getTopics() {
    try {
      const { data, error } = await supabase
        .from('knowledge_topics')
        .select('*')
        .order('question_count', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching topics:', err)
      return []
    }
  }

  async getTopic(slug) {
    try {
      const { data, error } = await supabase
        .from('knowledge_topics')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching topic:', err)
      return null
    }
  }

  async createTopic({ name, slug, description }) {
    const { data, error } = await supabase
      .from('knowledge_topics')
      .insert({ name, slug, description })
      .select()
      .single()
    return { data, error }
  }

  async updateTopic(topicId, { name, slug, description }) {
    const { data, error } = await supabase
      .from('knowledge_topics')
      .update({ name, slug, description })
      .eq('id', topicId)
      .select()
      .single()
    return { data, error }
  }

  async deleteTopic(topicId) {
    const { error } = await supabase
      .from('knowledge_topics')
      .delete()
      .eq('id', topicId)
    return { error }
  }

  // ============================================
  // QUESTIONS
  // ============================================

  async getQuestions(options = {}) {
    const { topicSlug, page = 1, limit = 20, sortBy = 'recent', status = 'approved', search = '' } = options
    
    try {
      let query = supabase
        .from('knowledge_questions')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          topic:knowledge_topics(id, name, slug)
        `, { count: 'exact' })
        .eq('status', status)
      
      if (search && search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`)
      }
      
      if (topicSlug) {
        const topic = await this.getTopic(topicSlug)
        if (topic) {
          query = query.eq('topic_id', topic.id)
        }
      }
      
      if (sortBy === 'popular') {
        query = query.order('upvote_count', { ascending: false })
      } else if (sortBy === 'unanswered') {
        query = query.eq('is_answered', false).order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const start = (page - 1) * limit
      query = query.range(start, start + limit - 1)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      return {
        data: data || [],
        page,
        totalPages: Math.ceil((count || 0) / limit),
        total: count || 0,
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
      return { data: [], page: 1, totalPages: 0, total: 0 }
    }
  }

  async getQuestion(questionId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_questions')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          topic:knowledge_topics(id, name, slug)
        `)
        .eq('id', questionId)
        .single()
      
      if (error) throw error
      
      // Increment view count
      await supabase
        .from('knowledge_questions')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', questionId)
      
      return data
    } catch (err) {
      console.error('Error fetching question:', err)
      return null
    }
  }

  async createQuestion(questionData, userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_questions')
        .insert({
          author_id: userId,
          title: questionData.title,
          content: questionData.content,
          topic_id: questionData.topic_id || null,
          status: 'pending',
        })
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          topic:knowledge_topics(id, name, slug)
        `)
        .single()
      
      if (error) throw error
      return { success: true, question: data }
    } catch (err) {
      console.error('Error creating question:', err)
      return { success: false, error: err }
    }
  }

  // ============================================
  // ANSWERS
  // ============================================

  async getAnswers(questionId, status = 'approved') {
    try {
      const { data, error } = await supabase
        .from('knowledge_answers')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified)
        `)
        .eq('question_id', questionId)
        .eq('status', status)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching answers:', err)
      return []
    }
  }

  async createAnswer(answerData, userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_answers')
        .insert({
          question_id: answerData.question_id,
          author_id: userId,
          content: answerData.content,
          status: 'pending',
        })
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified)
        `)
        .single()
      
      if (error) throw error
      return { success: true, answer: data }
    } catch (err) {
      console.error('Error creating answer:', err)
      return { success: false, error: err }
    }
  }

  async acceptAnswer(questionId, answerId, userId) {
    try {
      // Verify user owns the question
      const { data: question } = await supabase
        .from('knowledge_questions')
        .select('author_id')
        .eq('id', questionId)
        .single()
      
      if (question?.author_id !== userId) {
        throw new Error('Only the question author can accept an answer')
      }
      
      // Unaccept any previously accepted answer
      await supabase
        .from('knowledge_answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId)
      
      // Accept the new answer
      const { error } = await supabase
        .from('knowledge_answers')
        .update({ is_accepted: true })
        .eq('id', answerId)
      
      if (error) throw error
      
      // Update question
      await supabase
        .from('knowledge_questions')
        .update({ accepted_answer_id: answerId, is_answered: true })
        .eq('id', questionId)
      
      return { success: true }
    } catch (err) {
      console.error('Error accepting answer:', err)
      return { success: false, error: err }
    }
  }

  // ============================================
  // VOTES
  // ============================================

  async vote(targetType, targetId, voteType) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Check if already voted
      const { data: existingVote } = await supabase
        .from('knowledge_votes')
        .select('id, vote_type')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle()
      
      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Same vote - remove it
          await supabase
            .from('knowledge_votes')
            .delete()
            .eq('id', existingVote.id)
          return { success: true, action: 'removed' }
        } else {
          // Different vote - update it
          await supabase
            .from('knowledge_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)
          return { success: true, action: 'changed' }
        }
      } else {
        // New vote
        await supabase
          .from('knowledge_votes')
          .insert({
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
            vote_type: voteType,
          })
        return { success: true, action: 'added' }
      }
    } catch (err) {
      console.error('Error voting:', err)
      return { success: false, error: err }
    }
  }

  async getUserVotes(userId, targetType) {
    try {
      const { data, error } = await supabase
        .from('knowledge_votes')
        .select('target_id, vote_type')
        .eq('user_id', userId)
        .eq('target_type', targetType)
      
      if (error) throw error
      
      const voteMap = {}
      data?.forEach(v => {
        voteMap[v.target_id] = v.vote_type
      })
      return voteMap
    } catch (err) {
      console.error('Error fetching user votes:', err)
      return {}
    }
  }

  // ============================================
  // ADMIN MODERATION
  // ============================================

  async getPendingQuestions() {
    try {
      const { data, error } = await supabase
        .from('knowledge_questions')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          topic:knowledge_topics(id, name, slug)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching pending questions:', err)
      return []
    }
  }

  async getPendingAnswers() {
    try {
      const { data, error } = await supabase
        .from('knowledge_answers')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          question:knowledge_questions(id, title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching pending answers:', err)
      return []
    }
  }

  async approveQuestion(questionId, adminId) {
    try {
      const { error } = await supabase
        .from('knowledge_questions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminId,
        })
        .eq('id', questionId)
      
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error approving question:', err)
      return { success: false, error: err }
    }
  }

  async rejectQuestion(questionId, reason) {
    try {
      const { error } = await supabase
        .from('knowledge_questions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', questionId)
      
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error rejecting question:', err)
      return { success: false, error: err }
    }
  }

  async approveAnswer(answerId, adminId) {
    try {
      const { error } = await supabase
        .from('knowledge_answers')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminId,
        })
        .eq('id', answerId)
      
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error approving answer:', err)
      return { success: false, error: err }
    }
  }

  async rejectAnswer(answerId, reason) {
    try {
      const { error } = await supabase
        .from('knowledge_answers')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', answerId)
      
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error rejecting answer:', err)
      return { success: false, error: err }
    }
  }

  // ============================================
  // TOPIC FOLLOWS
  // ============================================

  async followTopic(topicId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('knowledge_topic_follows')
        .insert({ user_id: user.id, topic_id: topicId })
      
      if (error && error.code !== '23505') throw error
      return { success: true }
    } catch (err) {
      console.error('Error following topic:', err)
      return { success: false, error: err }
    }
  }

  async unfollowTopic(topicId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('knowledge_topic_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
      
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error unfollowing topic:', err)
      return { success: false, error: err }
    }
  }

  async getUserFollowedTopics(userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_topic_follows')
        .select('topic_id')
        .eq('user_id', userId)
      
      if (error) throw error
      return (data || []).map(f => f.topic_id)
    } catch (err) {
      console.error('Error fetching followed topics:', err)
      return []
    }
  }

  // ============================================
  // TRENDING QUESTIONS
  // ============================================

  async getTrendingQuestions(limit = 7) {
    try {
      // Calculate trending score: views + (upvotes * 5) + (answers * 10)
      // Only questions from last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('knowledge_questions')
        .select(`
          id,
          title,
          view_count,
          upvote_count,
          answer_count,
          created_at,
          topic:knowledge_topics(name, slug)
        `)
        .eq('status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('view_count', { ascending: false })
        .limit(50) // Fetch more, then sort by score

      if (error) throw error

      // Calculate trending score and sort
      const scored = (data || []).map(q => {
        const hoursOld = (Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60)
        const score = (q.view_count || 0) * 1 
          + (q.upvote_count || 0) * 5 
          + (q.answer_count || 0) * 10
          - hoursOld * 0.5
        return { ...q, trending_score: score }
      })

      scored.sort((a, b) => b.trending_score - a.trending_score)
      return scored.slice(0, limit)
    } catch (err) {
      console.error('Error fetching trending questions:', err)
      return []
    }
  }

  // ============================================
  // FAVORITES
  // ============================================

  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select(`
          question_id,
          created_at,
          question:knowledge_questions(
            id, title, content, view_count, upvote_count, answer_count, created_at, is_answered,
            author:profiles(id, username, avatar_url, is_certified),
            topic:knowledge_topics(id, name, slug)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(f => f.question).filter(Boolean)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      return []
    }
  }

  async toggleFavorite(questionId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if already favorited
      const { data: existing } = await supabase
        .from('knowledge_favorites')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .maybeSingle()

      if (existing) {
        // Remove favorite
        await supabase
          .from('knowledge_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', questionId)
        return { success: true, action: 'removed' }
      } else {
        // Add favorite
        await supabase
          .from('knowledge_favorites')
          .insert({ user_id: user.id, question_id: questionId })
        return { success: true, action: 'added' }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      return { success: false, error: err }
    }
  }

  async getUserFavoriteIds(userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select('question_id')
        .eq('user_id', userId)

      if (error) throw error
      return (data || []).map(f => f.question_id)
    } catch (err) {
      console.error('Error fetching favorite IDs:', err)
      return []
    }
  }

  // ============================================
  // USER STATS (Creator Center)
  // ============================================

  async getUserStats(userId) {
    try {
      // Get total views on user's questions
      const { data: questions } = await supabase
        .from('knowledge_questions')
        .select('view_count, upvote_count')
        .eq('author_id', userId)
        .eq('status', 'approved')

      // Get upvotes on user's answers
      const { data: answers } = await supabase
        .from('knowledge_answers')
        .select('upvote_count')
        .eq('author_id', userId)
        .eq('status', 'approved')

      const { data: profile } = await supabase
        .from('profiles')
        .select('follower_count')
        .eq('id', userId)
        .maybeSingle()

      const totalViews = (questions || []).reduce((sum, q) => sum + (q.view_count || 0), 0)
      const questionLikes = (questions || []).reduce((sum, q) => sum + (q.upvote_count || 0), 0)
      const answerLikes = (answers || []).reduce((sum, a) => sum + (a.upvote_count || 0), 0)

      return {
        views: totalViews,
        likes: questionLikes + answerLikes,
        follows: profile?.follower_count || 0,
      }
    } catch (err) {
      console.error('Error fetching user stats:', err)
      return { views: 0, likes: 0, follows: 0 }
    }
  }

  async getUserStatsWithGrowth(userId) {
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      // Get all user's questions
      const { data: questions } = await supabase
        .from('knowledge_questions')
        .select('view_count, upvote_count, created_at')
        .eq('author_id', userId)
        .eq('status', 'approved')

      // Get all user's answers
      const { data: answers } = await supabase
        .from('knowledge_answers')
        .select('upvote_count, created_at')
        .eq('author_id', userId)
        .eq('status', 'approved')

      const { data: profile } = await supabase
        .from('profiles')
        .select('follower_count')
        .eq('id', userId)
        .maybeSingle()

      // Calculate current totals
      const totalViews = (questions || []).reduce((sum, q) => sum + (q.view_count || 0), 0)
      const questionLikes = (questions || []).reduce((sum, q) => sum + (q.upvote_count || 0), 0)
      const answerLikes = (answers || []).reduce((sum, a) => sum + (a.upvote_count || 0), 0)
      const totalLikes = questionLikes + answerLikes

      // Calculate this week's new content engagement
      const thisWeekQuestions = (questions || []).filter(q => new Date(q.created_at) >= oneWeekAgo)
      const lastWeekQuestions = (questions || []).filter(q => 
        new Date(q.created_at) >= twoWeeksAgo && new Date(q.created_at) < oneWeekAgo
      )

      const thisWeekEngagement = thisWeekQuestions.reduce((sum, q) => 
        sum + (q.view_count || 0) + (q.upvote_count || 0) * 2, 0
      )
      const lastWeekEngagement = lastWeekQuestions.reduce((sum, q) => 
        sum + (q.view_count || 0) + (q.upvote_count || 0) * 2, 0
      )

      // Calculate growth percentage
      let growth = 0
      if (lastWeekEngagement > 0) {
        growth = Math.round(((thisWeekEngagement - lastWeekEngagement) / lastWeekEngagement) * 100)
      } else if (thisWeekEngagement > 0) {
        growth = 100 // New user with activity this week
      }

      // Clamp growth to reasonable range
      growth = Math.max(-99, Math.min(999, growth))

      return {
        views: totalViews,
        likes: totalLikes,
        follows: profile?.follower_count || 0,
        growth,
      }
    } catch (err) {
      console.error('Error fetching user stats with growth:', err)
      return { views: 0, likes: 0, follows: 0, growth: 0 }
    }
  }

  // ============================================
  // SIDEBAR COUNTS
  // ============================================

  async getSidebarCounts(userId) {
    try {
      // Hot questions count (high engagement in last 24h)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { count: hotCount } = await supabase
        .from('knowledge_questions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('created_at', oneDayAgo.toISOString())

      // User's favorites count
      let favCount = 0
      if (userId) {
        const { count } = await supabase
          .from('knowledge_favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        favCount = count || 0
      }

      return {
        hotList: hotCount || 0,
        favorites: favCount,
      }
    } catch (err) {
      console.error('Error fetching sidebar counts:', err)
      return { hotList: 0, favorites: 0 }
    }
  }

  // ============================================
  // FOLLOWING FEED
  // ============================================

  async getQuestionsFromFollowedTopics(userId, options = {}) {
    const { page = 1, limit = 20 } = options
    try {
      const topicIds = await this.getUserFollowedTopics(userId)
      if (!topicIds.length) return { data: [], page, totalPages: 0, total: 0 }

      const start = (page - 1) * limit
      const { data, error, count } = await supabase
        .from('knowledge_questions')
        .select(`
          *,
          author:profiles(id, username, avatar_url, is_certified),
          topic:knowledge_topics(id, name, slug)
        `, { count: 'exact' })
        .eq('status', 'approved')
        .in('topic_id', topicIds)
        .order('created_at', { ascending: false })
        .range(start, start + limit - 1)

      if (error) throw error
      return {
        data: data || [],
        page,
        totalPages: Math.ceil((count || 0) / limit),
        total: count || 0,
      }
    } catch (err) {
      console.error('Error fetching following feed:', err)
      return { data: [], page, totalPages: 0, total: 0 }
    }
  }

  // ============================================
  // USER FOLLOWED TOPICS WITH DETAILS
  // ============================================

  async getUserFollowedTopicsWithDetails(userId) {
    try {
      const { data, error } = await supabase
        .from('knowledge_topic_follows')
        .select(`
          topic:knowledge_topics(id, name, slug)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return (data || []).map(f => f.topic).filter(Boolean)
    } catch (err) {
      console.error('Error fetching followed topics with details:', err)
      return []
    }
  }

  // ============================================
  // USER CONTENT (for Dashboard)
  // ============================================

  async getUserQuestions(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('knowledge_questions')
        .select(`
          id, title, view_count, upvote_count, answer_count, created_at, status,
          topic:knowledge_topics(name, slug)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching user questions:', err)
      return []
    }
  }

  async getUserAnswers(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('knowledge_answers')
        .select(`
          id, content, upvote_count, is_accepted, created_at, status,
          question:knowledge_questions(id, title)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching user answers:', err)
      return []
    }
  }

  async getUserContentCounts(userId) {
    try {
      const [questionsResult, answersResult] = await Promise.all([
        supabase
          .from('knowledge_questions')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId)
          .eq('status', 'approved'),
        supabase
          .from('knowledge_answers')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId)
          .eq('status', 'approved')
      ])

      return {
        questions: questionsResult.count || 0,
        answers: answersResult.count || 0
      }
    } catch (err) {
      console.error('Error fetching user content counts:', err)
      return { questions: 0, answers: 0 }
    }
  }
}

export const knowledgeApiService = new KnowledgeApiService()
export default KnowledgeApiService
