import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { socialApiService } from './api'
import { formatRelativeTime } from '../Forum/utils/formatters'
import * as s from '../Header.css.ts'

const labelKeys = {
  follow: 'social.notificationFollow',
  reply: 'social.notificationReply',
  like: 'social.notificationLike',
  repost: 'social.notificationRepost',
  quote: 'social.notificationQuote',
  mention: 'social.notificationMention',
}

function SocialNotificationsButton({ userId }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0)
      return
    }
    try {
      setUnreadCount(await socialApiService.getUnreadCount(userId))
    } catch (err) {
      console.error('Failed to fetch social unread count:', err)
    }
  }, [userId])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await socialApiService.getNotifications(userId)
      setNotifications(data)
      setUnreadCount(data.filter((item) => !item.is_read).length)
    } catch (err) {
      console.error('Failed to fetch social notifications:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [fetchNotifications, open])

  if (!userId) return null

  const handleOpen = () => {
    setOpen((value) => !value)
  }

  const handleNotification = async (notification) => {
    if (!notification.is_read) {
      await socialApiService.markNotificationRead(notification.id)
    }
    setOpen(false)
    fetchUnread()

    if (notification.type === 'follow' && notification.source_user?.username) {
      router.push(`/profile/${notification.source_user.username}`)
      return
    }

    if (notification.post_id) {
      router.push(`/feed/post/${notification.post_id}`)
    }
  }

  const handleMarkAll = async () => {
    await socialApiService.markAllNotificationsRead(userId)
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className={s.notificationWrap}>
      <button className={s.iconButton} onClick={handleOpen} title={t('social.notifications')}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={s.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={s.notificationPanel}>
          <div className={s.notificationPanelHeader}>
            <span>{t('social.notifications')}</span>
            <button className={s.notificationAction} onClick={handleMarkAll}>{t('social.markRead')}</button>
          </div>
          <div className={s.notificationList}>
            {loading ? (
              <span className={s.notificationItem}>{t('common.loading')}</span>
            ) : notifications.length > 0 ? notifications.map((notification) => (
              <button
                key={notification.id}
                className={`${s.notificationItem} ${!notification.is_read ? s.notificationItemUnread : ''}`}
                onClick={() => handleNotification(notification)}
              >
                <span className={s.notificationText}>
                  <strong>{notification.source_label || notification.source_user?.username || t('social.someone')}</strong>{' '}
                  {labelKeys[notification.type] ? t(labelKeys[notification.type]) : notification.type}
                </span>
                {notification.content_preview && (
                  <span className={s.notificationMeta}>{notification.content_preview}</span>
                )}
                <span className={s.notificationMeta}>{formatRelativeTime(notification.created_at)}</span>
              </button>
            )) : (
              <span className={s.notificationItem}>{t('social.noNotifications')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialNotificationsButton
