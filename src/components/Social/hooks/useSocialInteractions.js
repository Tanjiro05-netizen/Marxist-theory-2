import { useCallback, useEffect, useMemo, useState } from 'react'
import { socialApiService } from '../api'

export function useSocialInteractions(posts, userId) {
  const [likedIds, setLikedIds] = useState(new Set())
  const [repostedIds, setRepostedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const postIds = useMemo(() => {
    const ids = []
    ;(posts || []).forEach((post) => {
      if (post?.id) ids.push(post.id)
      if (post?.reposted_post?.id) ids.push(post.reposted_post.id)
    })
    return [...new Set(ids)]
  }, [posts])

  const refresh = useCallback(async () => {
    if (!userId || !postIds.length) {
      setLikedIds(new Set())
      setRepostedIds(new Set())
      return
    }

    setLoading(true)
    try {
      const [likes, reposts] = await Promise.all([
        socialApiService.getUserLikeIds(userId, postIds),
        socialApiService.getUserRepostIds(userId, postIds),
      ])
      setLikedIds(new Set(likes))
      setRepostedIds(new Set(reposts))
    } catch (err) {
      console.error('Failed to fetch social interactions:', err)
    } finally {
      setLoading(false)
    }
  }, [postIds, userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleLike = useCallback(async (postId) => {
    const next = new Set(likedIds)
    const liked = next.has(postId)
    if (liked) next.delete(postId)
    else next.add(postId)
    setLikedIds(next)

    try {
      if (liked) await socialApiService.unlikePost(postId)
      else await socialApiService.likePost(postId)
    } catch (err) {
      console.error('Failed to toggle like:', err)
      setLikedIds(likedIds)
    }
  }, [likedIds])

  const toggleRepost = useCallback(async (postId) => {
    const next = new Set(repostedIds)
    const reposted = next.has(postId)
    if (reposted) next.delete(postId)
    else next.add(postId)
    setRepostedIds(next)

    try {
      if (reposted) await socialApiService.unrepostPost(postId)
      else await socialApiService.repostPost(postId)
    } catch (err) {
      console.error('Failed to toggle repost:', err)
      setRepostedIds(repostedIds)
    }
  }, [repostedIds])

  return {
    loading,
    isLiked: (postId) => likedIds.has(postId),
    isReposted: (postId) => repostedIds.has(postId),
    toggleLike,
    toggleRepost,
    refresh,
  }
}

export default useSocialInteractions
