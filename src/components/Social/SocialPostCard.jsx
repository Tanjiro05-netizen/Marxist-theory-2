import React from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  Heart,
  MessageCircle,
  Quote,
  Repeat2,
} from 'lucide-react'
import { formatRelativeTime, truncateText } from '../Forum/utils/formatters'
import SocialAvatar, { getSocialIdentity } from './SocialAvatar'
import * as s from './Social.css.ts'

function EmbeddedPost({ post }) {
  const { t } = useTranslation()
  if (!post) return null
  const identity = getSocialIdentity(post, t)

  return (
    <div className={s.embeddedPost}>
      <div className={s.identityLine}>
        <span className={s.displayName}>{identity.name}</span>
        <span className={s.handle}>{identity.handle}</span>
        {post.board_slug && <span className={s.boardBadge}>/{post.board_slug}/</span>}
      </div>
      {post.title && <h4 className={s.postTitle}>{post.title}</h4>}
      <p className={s.postContent}>{truncateText(post.content, 220)}</p>
    </div>
  )
}

function ActionButton({ icon: Icon, count, active, label, onClick }) {
  return (
    <button
      className={`${s.actionButton} ${active ? s.actionActive : ''}`}
      onClick={onClick}
      title={label}
    >
      <Icon size={17} />
      <span>{count ?? label}</span>
    </button>
  )
}

function SocialPostCard({
  post,
  variant = 'social',
  liked,
  reposted,
  onReply,
  onLike,
  onRepost,
  onQuote,
  onBoardSelect,
}) {
  const { t } = useTranslation()
  if (!post) return null

  const isBoard = variant === 'board'
  const displayedPost = post.reposted_post || post
  const identity = getSocialIdentity(displayedPost, t)
  const repostIdentity = post.reposted_post ? getSocialIdentity(post, t) : null
  const profileHref = identity.profile?.username ? `/profile/${identity.profile.username}` : null

  return (
    <article className={`${s.postCard} ${isBoard ? s.boardPostCard : s.socialPostCard}`}>
      {post.reposted_post && (
        <div className={s.repostBanner}>
          <Repeat2 size={14} />
          <span>{t('social.repostedBy', { name: repostIdentity?.name || t('social.someone') })}</span>
        </div>
      )}

      <div>
        {profileHref && !identity.anonymous ? (
          <Link href={profileHref}>
            <SocialAvatar item={displayedPost} />
          </Link>
        ) : (
          <SocialAvatar item={displayedPost} />
        )}
      </div>

      <div className={s.postBody}>
        <div className={s.identityLine}>
          {profileHref && !identity.anonymous ? (
            <Link href={profileHref} className={s.displayName}>{identity.name}</Link>
          ) : (
            <span className={s.displayName}>{identity.name}</span>
          )}
          <span className={s.handle}>{identity.handle}</span>
          <span>·</span>
          <span>{formatRelativeTime(displayedPost.created_at)}</span>
          {displayedPost.board_slug && (
            <button className={s.boardBadge} onClick={() => onBoardSelect?.(displayedPost.board_slug)}>
              /{displayedPost.board_slug}/
            </button>
          )}
        </div>

        {displayedPost.title && <h3 className={s.postTitle}>{displayedPost.title}</h3>}
        {displayedPost.content && <p className={s.postContent}>{displayedPost.content}</p>}
        {displayedPost.quoted_post && <EmbeddedPost post={displayedPost.quoted_post} />}

        <div className={`${s.actions} ${isBoard ? s.boardActions : s.socialActions}`}>
          <ActionButton
            icon={MessageCircle}
            count={displayedPost.reply_count || 0}
            active={false}
            label={t('social.reply')}
            onClick={() => onReply?.(displayedPost)}
          />
          {!isBoard && (
            <ActionButton
              icon={Repeat2}
              count={displayedPost.repost_count || 0}
              active={reposted}
              label={t('social.repost')}
              onClick={() => onRepost?.(displayedPost.id)}
            />
          )}
          <ActionButton
            icon={Heart}
            count={displayedPost.like_count || 0}
            active={liked}
            label={t('social.like')}
            onClick={() => onLike?.(displayedPost.id)}
          />
          {!isBoard && (
            <ActionButton
              icon={Quote}
              count={displayedPost.quote_count || 0}
              label={t('social.quote')}
              onClick={() => onQuote?.(displayedPost)}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default SocialPostCard
