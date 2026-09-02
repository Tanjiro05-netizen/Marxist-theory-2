import React from 'react'
import { useTranslation } from 'react-i18next'
import * as s from './Social.css.ts'

const cleanAnonymousName = (name) => {
  const trimmed = `${name || ''}`.trim()
  if (!trimmed || ['undefined', 'null'].includes(trimmed.toLowerCase())) return ''
  return trimmed
}

export function getSocialIdentity(postOrProfile, t = (key, options) => options?.defaultValue || key) {
  const anonymousName = cleanAnonymousName(postOrProfile?.anonymous_name)
  if (postOrProfile?.is_anonymous || anonymousName) {
    return {
      name: !anonymousName || anonymousName === 'Anonymous'
        ? t('social.anonymous', { defaultValue: 'Anonymous' })
        : anonymousName,
      handle: t('social.anonymousHandle', { defaultValue: 'anonymous' }),
      avatarUrl: null,
      anonymous: true,
      profile: null,
    }
  }

  const profile = postOrProfile?.author || postOrProfile
  const username = profile?.username || t('social.someone', { defaultValue: 'Someone' })
  return {
    name: username,
    handle: username ? `@${username}` : '@someone',
    avatarUrl: profile?.avatar_url || null,
    anonymous: false,
    profile,
  }
}

function SocialAvatar({ item, size = 'md' }) {
  const { t } = useTranslation()
  const identity = getSocialIdentity(item, t)
  const initials = identity.name
    .split(/[\s_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?'

  const style = size === 'sm' ? { width: 34, height: 34 } : undefined

  if (identity.avatarUrl) {
    return (
      <img
        className={s.avatar}
        style={style}
        src={identity.avatarUrl}
        alt={identity.name}
      />
    )
  }

  return (
    <div className={`${s.avatar} ${identity.anonymous ? s.avatarAnon : ''}`} style={style}>
      {initials}
    </div>
  )
}

export default SocialAvatar
