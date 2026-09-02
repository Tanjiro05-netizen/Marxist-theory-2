import { useCallback, useEffect, useState } from 'react'
import { socialApiService } from '../api'

const getFriendlyError = (err) => {
  const message = err?.message || ''
  if (err?.code === 'PGRST200' || message.includes('relationship between')) {
    return 'Social post relationships are not available through the API yet.'
  }
  if (
    message.includes('Could not find the table')
    || message.includes('Could not find the public.social_posts')
    || message.includes('Could not find the public.social_follows')
  ) {
    return 'Social database migration is not applied yet.'
  }
  return message || 'Feed unavailable.'
}

export function useSocialFeed({ mode = 'home', boardSlug = null, userId = null, page = 1, limit = 20, sortBy = null, topic = null, enabled = true } = {}) {
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFeed = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setError('')
      setPosts([])
      setPagination({ page, totalPages: 0, total: 0 })
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await socialApiService.getTimeline({ mode, boardSlug, userId, page, limit, sortBy, topic })
      setPosts(result.data || [])
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      })
    } catch (err) {
      console.error('Failed to fetch social feed:', err)
      setError(getFriendlyError(err))
      setPosts([])
      setPagination({ page, totalPages: 0, total: 0 })
    } finally {
      setLoading(false)
    }
  }, [boardSlug, enabled, limit, mode, page, sortBy, topic, userId])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  return {
    posts,
    pagination,
    loading,
    error,
    refetch: fetchFeed,
  }
}

export default useSocialFeed
