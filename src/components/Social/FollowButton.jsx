import React from 'react'
import { useTranslation } from 'react-i18next'
import { useFollow } from './hooks/useFollow'
import * as s from './Social.css.ts'

function FollowButton({ targetUserId, currentUserId, compact = false, onChange }) {
  const { t } = useTranslation()
  const { following, loading, toggleFollow } = useFollow(targetUserId, currentUserId)
  const isSelf = targetUserId && currentUserId && targetUserId === currentUserId

  if (!targetUserId || isSelf) return null

  const handleClick = async () => {
    await toggleFollow()
    onChange?.(!following)
  }

  return (
    <button
      className={`${s.followButton} ${following ? s.followButtonFollowing : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={following ? t('social.unfollow') : t('social.follow')}
    >
      {following ? (compact ? t('social.on') : t('social.following')) : t('social.follow')}
    </button>
  )
}

export default FollowButton
