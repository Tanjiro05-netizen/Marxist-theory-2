import { useCallback, useEffect, useState } from 'react'
import { socialApiService } from '../api'

export function useFollow(targetUserId, currentUserId) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!targetUserId || !currentUserId || targetUserId === currentUserId) {
      setFollowing(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      setFollowing(await socialApiService.isFollowing(targetUserId))
    } catch (err) {
      console.error('Failed to fetch follow state:', err)
      setError(err.message || 'Follow state unavailable.')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, targetUserId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleFollow = useCallback(async () => {
    if (!targetUserId || !currentUserId || targetUserId === currentUserId) return
    const next = !following
    setFollowing(next)
    setLoading(true)
    setError('')
    try {
      if (next) await socialApiService.followUser(targetUserId)
      else await socialApiService.unfollowUser(targetUserId)
    } catch (err) {
      console.error('Failed to toggle follow:', err)
      setFollowing(!next)
      setError(err.message || 'Could not update follow.')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, following, targetUserId])

  return {
    following,
    loading,
    error,
    refresh,
    toggleFollow,
  }
}

export default useFollow
