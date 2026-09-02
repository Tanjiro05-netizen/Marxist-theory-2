import i18n from '../../../i18n'

export function formatDate(date, includeTime = true) {
  const d = new Date(date)
  const locale = i18n.resolvedLanguage || i18n.language || 'en'
  return new Intl.DateTimeFormat(locale, includeTime
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' }
  ).format(d)
}

export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  const locale = i18n.resolvedLanguage || i18n.language || 'en'
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' })

  if (diffSeconds < 60) return relative.format(0, 'second')
  if (diffMinutes < 60) return relative.format(-diffMinutes, 'minute')
  if (diffHours < 24) return relative.format(-diffHours, 'hour')
  if (diffDays < 7) return relative.format(-diffDays, 'day')
  
  return formatDate(date, false)
}

export function truncateText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return String(num)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatPostNumber(id) {
  if (typeof id === 'string' && id.length > 8) {
    return id.slice(-4).toUpperCase()
  }
  return String(id)
}
