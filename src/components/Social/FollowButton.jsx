import React from 'react'
import { useFollow } from './hooks/useFollow'
import * as s from './Social.css.ts'

function FollowButton({ targetUserId, currentUserId, compact = false, onChange }) {
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
      title={following ? 'Unfollow' : 'Follow'}
    >
      {following ? (compact ? 'On' : 'Following') : 'Follow'}
    </button>
  )
}

export default FollowButton
