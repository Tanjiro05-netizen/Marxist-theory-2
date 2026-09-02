import React, { useState, useEffect, useCallback } from 'react'
import { spacing } from '../../styles/theme'
import { formatDate } from '../../utils/formatters'
import Avatar from '../common/Avatar'

const notificationLabels = {
  reply: 'replied to your',
  like: 'liked your',
  mention: 'mentioned you in',
  quote: 'quoted your',
}

const frostedGlassStyle = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor: 'rgba(18, 18, 18, 0.85)',
}

function NotificationItem({ notification, onView, onMarkRead, onDelete }) {
  const {
    id,
    type,
    content_preview,
    is_read,
    created_at,
    thread_id,
    source_user,
  } = notification

  const targetType = thread_id ? 'thread' : 'comment'

  return (
    <div
      style={{
        padding: spacing.md,
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: is_read ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
        display: 'flex',
        gap: spacing.sm,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = is_read ? 'transparent' : 'rgba(255, 255, 255, 0.03)'}
      onClick={() => {
        if (!is_read) onMarkRead?.(id)
        onView?.(notification)
      }}
    >
      <Avatar
        src={source_user?.avatar_url}
        name={source_user?.username}
        size={32}
      />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', marginBottom: spacing.xs }}>
          <span style={{ color: '#c9c5b8', fontWeight: '500' }}>
            {source_user?.username || 'Someone'}
          </span>
          {' '}
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {notificationLabels[type] || type} {targetType}
          </span>
        </div>
        
        {content_preview && (
          <p style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.45)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontStyle: 'italic',
          }}>
            "{content_preview}"
          </p>
        )}
        
        <span style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.35)',
        }}>
          {formatDate(created_at)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.xs }}>
        {!is_read && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#4a7fb5',
            marginTop: '6px',
          }} />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(id)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '11px',
            lineHeight: 1,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
          title="Remove"
        >
          x
        </button>
      </div>
    </div>
  )
}

function NotificationsPanel({ 
  apiService, 
  userId, 
  onViewThread, 
  onClose,
  onUnreadCountChange,
}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await apiService.getNotifications(userId)
    setNotifications(data)
    setLoading(false)
  }, [apiService, userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (notificationId) => {
    await apiService.markNotificationRead(notificationId)
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    const unread = notifications.filter(n => !n.is_read && n.id !== notificationId).length
    onUnreadCountChange?.(unread)
  }

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    onUnreadCountChange?.(0)
  }

  const handleDelete = async (notificationId) => {
    await apiService.deleteNotification(notificationId)
    const deleted = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (deleted && !deleted.is_read) {
      const unread = notifications.filter(n => !n.is_read && n.id !== notificationId).length
      onUnreadCountChange?.(unread)
    }
  }

  const handleClearAll = async () => {
    await apiService.clearAllNotifications(userId)
    setNotifications([])
    onUnreadCountChange?.(0)
  }

  const handleView = (notification) => {
    if (notification.thread_id) {
      onViewThread?.({ id: notification.thread_id })
      onClose?.()
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
      />
      
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        bottom: '16px',
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...frostedGlassStyle,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ 
            fontWeight: '500', 
            color: '#c9c5b8',
            fontSize: '15px',
            letterSpacing: '-0.01em',
          }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.45)',
                fontWeight: '400',
                marginLeft: '8px',
              }}>
                {unreadCount} new
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            x
          </button>
        </div>

        {/* Actions bar */}
        {(unreadCount > 0 || notifications.length > 0) && (
          <div style={{
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
          }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4a7fb5',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12px',
                }}
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12px',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '13px',
            }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '13px',
            }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onView={handleView}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationsPanel
