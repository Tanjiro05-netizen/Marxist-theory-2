import React, { useState, useEffect, useCallback } from 'react'
import { spacing } from '../../styles/theme'
import { formatDate, truncateText } from '../../utils/formatters'

const frostedGlassStyle = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundColor: 'rgba(18, 18, 18, 0.85)',
}

function BookmarkItem({ bookmark, onView, onRemove }) {
  const { thread } = bookmark

  if (!thread) return null

  return (
    <div 
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '16px 20px',
        display: 'flex',
        gap: spacing.md,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={() => onView?.(thread)}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{
          color: '#c9c5b8',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '6px',
          lineHeight: 1.3,
        }}>
          {thread.title}
        </h4>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.45)',
          marginBottom: '8px',
          lineHeight: 1.4,
        }}>
          {truncateText(thread.content, 100)}
        </p>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.35)',
          display: 'flex',
          gap: '12px',
        }}>
          <span>/{thread.category_slug}/</span>
          <span>{thread.comment_count} replies</span>
          <span>saved {formatDate(bookmark.created_at)}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove?.(thread.id)
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          padding: '4px',
          fontSize: '11px',
          alignSelf: 'flex-start',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
        title="Remove"
      >
        x
      </button>
    </div>
  )
}

function BookmarksPanel({ apiService, userId, onViewThread, onClose }) {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await apiService.getBookmarks(userId)
    setBookmarks(data)
    setLoading(false)
  }, [apiService, userId])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleRemove = async (threadId) => {
    await apiService.removeBookmark(threadId)
    setBookmarks(prev => prev.filter(b => b.thread?.id !== threadId))
  }

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
            Saved Threads
            {bookmarks.length > 0 && (
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.45)',
                fontWeight: '400',
                marginLeft: '8px',
              }}>
                {bookmarks.length}
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
          ) : bookmarks.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '13px',
            }}>
              No saved threads yet
            </div>
          ) : (
            bookmarks.map(bookmark => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onView={(thread) => {
                  onViewThread?.(thread)
                  onClose?.()
                }}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default BookmarksPanel
