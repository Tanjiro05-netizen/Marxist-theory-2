export const BOARDS = [
  {
    name: 'Theory',
    slug: 't',
    fullName: 'Marxist theory and philosophy',
    description: 'Marxist theory and philosophy',
    nameKey: 'forum.boardNames.t.name',
    fullNameKey: 'forum.boardNames.t.fullName',
  },
  {
    name: 'Reading',
    slug: 'r',
    fullName: 'Study groups and discussions',
    description: 'Study groups and discussions',
    nameKey: 'forum.boardNames.r.name',
    fullNameKey: 'forum.boardNames.r.fullName',
  },
  {
    name: 'Organizing',
    slug: 'o',
    fullName: 'Praxis and action',
    description: 'Praxis and action',
    nameKey: 'forum.boardNames.o.name',
    fullNameKey: 'forum.boardNames.o.fullName',
  },
  {
    name: 'History',
    slug: 'h',
    fullName: 'Historical analysis',
    description: 'Historical analysis',
    nameKey: 'forum.boardNames.h.name',
    fullNameKey: 'forum.boardNames.h.fullName',
  },
  {
    name: 'Current Events',
    slug: 'c',
    fullName: 'News and analysis',
    description: 'News and analysis',
    nameKey: 'forum.boardNames.c.name',
    fullNameKey: 'forum.boardNames.c.fullName',
  },
  {
    name: 'Meta',
    slug: 'm',
    fullName: 'Site feedback',
    description: 'Site feedback',
    nameKey: 'forum.boardNames.m.name',
    fullNameKey: 'forum.boardNames.m.fullName',
  },
  {
    name: 'Random',
    slug: 'x',
    fullName: 'Off-topic',
    description: 'Off-topic',
    nameKey: 'forum.boardNames.x.name',
    fullNameKey: 'forum.boardNames.x.fullName',
  },
]

export const getBoardBySlug = (slug) => BOARDS.find(b => b.slug === slug) || null

export const getBoardName = (slug) => getBoardBySlug(slug)?.name || '—'

export const getLocalizedBoardName = (t, boardOrSlug, full = false) => {
  const board = typeof boardOrSlug === 'string' ? getBoardBySlug(boardOrSlug) : boardOrSlug
  if (!board) return '—'
  const key = full ? board.fullNameKey : board.nameKey
  const fallback = full ? board.fullName : board.name
  return key ? t(key, { defaultValue: fallback }) : fallback
}
