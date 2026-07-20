import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { socialApiService } from '../components/Social/api'
import SocialComposer from '../components/Social/SocialComposer'
import SocialPostCard from '../components/Social/SocialPostCard'
import WhoToFollow from '../components/Social/WhoToFollow'
import { useSocialInteractions } from '../components/Social/hooks/useSocialInteractions'
import * as s from '../components/Social/Social.css.ts'

function FeedPostPage() {
  const { postId } = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [rootPost, setRootPost] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyParent, setReplyParent] = useState(null)
  const [quoteTarget, setQuoteTarget] = useState(null)
  const interactions = useSocialInteractions(posts, user?.id)
  const isBoardThread = Boolean(rootPost?.board_slug)

  const fetchThread = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError('')
    try {
      const includeProfiles = Boolean(user?.id)
      const post = await socialApiService.getPost(postId, { includeProfiles })
      const rootId = post.root_id || post.id
      const threadPosts = await socialApiService.getThread(rootId, { includeProfiles })
      setRootPost(post)
      setPosts(threadPosts.length ? threadPosts : [post])
    } catch (err) {
      console.error('Failed to fetch social thread:', err)
      setError(err.message || 'Thread unavailable.')
      setPosts([])
      setRootPost(null)
    } finally {
      setLoading(false)
    }
  }, [postId, user?.id])

  useEffect(() => {
    fetchThread()
  }, [fetchThread])

  const handleCreated = () => {
    setReplyParent(null)
    setQuoteTarget(null)
    fetchThread()
  }

  const requireLogin = () => {
    router.push('/login')
  }

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <main className={s.mainColumn}>
          <header className={s.timelineHeader}>
            <div className={s.headerTop}>
              <button className={s.actionButton} onClick={() => router.back()}>
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <div className={s.titleBlock}>
                <h1>{isBoardThread ? 'Thread' : 'Post'}</h1>
                <p>{posts.length > 1 ? `${posts.length - 1} replies` : 'Thread'}</p>
              </div>
            </div>
          </header>

          {loading ? (
            <div className={s.stateBlock}>Loading...</div>
          ) : error ? (
            <div className={s.stateBlock}>
              <div>
                <p>{error}</p>
                <button className={s.retryButton} onClick={fetchThread}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            </div>
          ) : rootPost ? (
            <>
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
                      onReply={(isBoardThread || user?.id) ? (target) => {
                        setReplyParent(target)
                        setQuoteTarget(null)
                      } : requireLogin}
                      onBoardSelect={(slug) => router.push(`/feed/boards?board=${encodeURIComponent(slug)}`)}
                      variant={isBoardThread ? 'board' : 'social'}
                    />
                  )
                })}
              </div>

              <SocialComposer
                user={user}
                profile={profile}
                mode={isBoardThread ? 'board' : 'social'}
                defaultBoardSlug={rootPost.board_slug || ''}
                parentId={(replyParent || rootPost).id}
                quotedPost={quoteTarget}
                onCancelQuote={() => {
                  setReplyParent(null)
                  setQuoteTarget(null)
                }}
                onCreated={handleCreated}
              />
            </>
          ) : (
            <div className={s.stateBlock}>Post not found.</div>
          )}
        </main>

        <aside className={s.rail}>
          {user?.id && <WhoToFollow userId={user.id} />}
        </aside>
      </div>
    </div>
  )
}

export default FeedPostPage
