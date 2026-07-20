export const BOARDS = [
  {
    name: 'Theory',
    slug: 't',
    fullName: 'Marxist theory and philosophy',
    description: 'Marxist theory and philosophy',
  },
  {
    name: 'Reading',
    slug: 'r',
    fullName: 'Study groups and discussions',
    description: 'Study groups and discussions',
  },
  {
    name: 'Organizing',
    slug: 'o',
    fullName: 'Praxis and action',
    description: 'Praxis and action',
  },
  {
    name: 'History',
    slug: 'h',
    fullName: 'Historical analysis',
    description: 'Historical analysis',
  },
  {
    name: 'Current Events',
    slug: 'c',
    fullName: 'News and analysis',
    description: 'News and analysis',
  },
  {
    name: 'Meta',
    slug: 'm',
    fullName: 'Site feedback',
    description: 'Site feedback',
  },
  {
    name: 'Random',
    slug: 'x',
    fullName: 'Off-topic',
    description: 'Off-topic',
  },
]

export const getBoardBySlug = (slug) => BOARDS.find(b => b.slug === slug) || null

export const getBoardName = (slug) => getBoardBySlug(slug)?.name || '—'
