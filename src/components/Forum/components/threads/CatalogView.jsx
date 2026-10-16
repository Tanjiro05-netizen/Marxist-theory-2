import React from 'react'
import { colors, spacing } from '../../styles/theme'
import { truncateText, formatDate } from '../../utils/formatters'

function CatalogCard({ thread, onView, onBookmark, isBookmarked }) {
  const {
    id,
    title,
    content,
    category_slug,
    comment_count = 0,
    like_count = 0,
    created_at,
  } = thread

  return (
    <div
      onClick={() => onView?.(thread)}
      style={{
        border: `1px solid ${colors.border.primary}`,
        backgroundColor: colors.bg.elevated,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '200px',
        overflow: 'hidden',
        transition: 'border-color var(--dur-micro)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.border.secondary}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border.primary}
    >
      <div style={{
        padding: spacing.sm,
        borderBottom: `1px solid ${colors.border.secondary}`,
        backgroundColor: colors.bg.primary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ 
          fontSize: '11px', 
          color: colors.text.muted,
        }}>
          /{category_slug}/
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBookmark?.(id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            color: isBookmarked ? colors.accent.green : colors.text.faded,
            fontSize: '10px',
            transition: 'color var(--dur-micro) var(--ease-standard)',
          }}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? '[saved]' : '[save]'}
        </button>
      </div>

      <div style={{ 
        padding: spacing.sm,
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 'bold',
          marginBottom: spacing.xs,
          color: colors.text.primary,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </h4>

        <p style={{
          fontSize: '11px',
          color: colors.text.tertiary,
          lineHeight: 1.4,
          flex: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        }}>
          {truncateText(content, 150)}
        </p>
      </div>

      <div style={{
        padding: `${spacing.xs} ${spacing.sm}`,
        borderTop: `1px solid ${colors.border.secondary}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: colors.text.muted,
      }}>
        <span>R: {comment_count} / L: {like_count}</span>
        <span>{formatDate(created_at)}</span>
      </div>
    </div>
  )
}

function CatalogView({
  threads,
  loading,
  error,
  onViewThread,
  onBookmark,
  isBookmarked,
  onRetry,
}) {
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: spacing.xl,
        color: colors.text.muted,
      }}>
        loading catalog...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: spacing.xl,
        color: colors.state.error,
      }}>
        <p>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: spacing.md,
              padding: `${spacing.xs} ${spacing.md}`,
              background: 'none',
              border: `1px solid ${colors.accent.green}`,
              color: colors.accent.green,
              cursor: 'pointer',
            }}
          >
            [retry]
          </button>
        )}
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: colors.text.muted,
        padding: spacing.xl,
        border: `1px solid ${colors.border.primary}`,
      }}>
        no threads yet. be the first to start a discussion.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: spacing.md,
    }}>
      {threads.map(thread => (
        <CatalogCard
          key={thread.id}
          thread={thread}
          onView={onViewThread}
          onBookmark={onBookmark}
          isBookmarked={isBookmarked?.(thread.id)}
        />
      ))}
    </div>
  )
}

export default CatalogView
