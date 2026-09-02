import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { socialApiService } from './api'
import FollowButton from './FollowButton'
import SocialAvatar from './SocialAvatar'
import * as s from './Social.css.ts'

function WhoToFollow({ userId, limit = 5 }) {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await socialApiService.getSuggestedUsers(userId, limit))
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [limit, userId])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  return (
    <section className={s.railSection}>
      <div className={s.railHeader}>
        <span>{t('social.whoToFollow')}</span>
        <Users size={16} />
      </div>
      <div className={s.suggestionList}>
        {loading ? (
          <div className={s.stateBlock}>{t('common.loading')}</div>
        ) : users.length > 0 ? users.map((profile) => (
          <div key={profile.id} className={s.suggestionItem}>
            <Link href={`/profile/${profile.username}`}>
              <SocialAvatar item={profile} size="sm" />
            </Link>
            <Link href={`/profile/${profile.username}`} className={s.suggestionText}>
              <strong>{profile.username}</strong>
              <span>{t('social.followersCount', { count: profile.follower_count || 0 })}</span>
            </Link>
            <FollowButton
              targetUserId={profile.id}
              currentUserId={userId}
              compact
              onChange={fetchSuggestions}
            />
          </div>
        )) : (
          <div className={s.stateBlock}>{t('social.noSuggestions')}</div>
        )}
      </div>
    </section>
  )
}

export default WhoToFollow
