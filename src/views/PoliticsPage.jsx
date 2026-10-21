import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Image as ImageIcon, Newspaper, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import * as s from './PoliticsPage.css.ts';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'movements', label: 'Movements' },
  { id: 'international', label: 'International' },
  { id: 'theory', label: 'Theory' },
];

const MOCK_ARTICLES = [
  { id: '1', slug: 'crisis-of-imperialism', title: 'The Deepening Crisis of Imperialism', excerpt: 'An examination of the structural contradictions driving the current phase of imperialist decline and what it means for the global working class.', category: 'analysis', source: 'Editorial Board', date: '2025-04-25', imageUrl: null },
  { id: '2', slug: 'labour-movement-resurgence', title: 'Labour Movement Resurgence in Southeast Asia', excerpt: 'Across the region, workers are organising at unprecedented rates. We trace the new wave of militancy from garment factories to tech campuses.', category: 'movements', source: 'Field Correspondent', date: '2025-04-24', imageUrl: null },
  { id: '3', slug: 'multipolarity-and-class', title: 'Multipolarity and Class Struggle', excerpt: 'Does the shift toward a multipolar world order create openings for socialist politics, or does it merely reshuffle the deck of inter-imperialist rivalry?', category: 'international', source: 'International Desk', date: '2025-04-23', imageUrl: null },
  { id: '4', slug: 'dialectics-of-nature-today', title: 'Dialectics of Nature in the 21st Century', excerpt: 'Revisiting Engels in the age of climate catastrophe. How dialectical materialism illuminates the ecological crisis and the path forward.', category: 'theory', source: 'Theory Circle', date: '2025-04-22', imageUrl: null },
  { id: '5', slug: 'housing-struggle-berlin', title: 'The Housing Struggle in Berlin', excerpt: 'Tenants across the German capital are fighting back against speculative landlords. A report from the front lines of the Mietenkampf.', category: 'movements', source: 'European Bureau', date: '2025-04-21', imageUrl: null },
  { id: '6', slug: 'sanctions-and-sovereignty', title: 'Sanctions, Sovereignty, and the Global South', excerpt: 'How unilateral sanctions regimes function as instruments of neo-colonial control and the growing resistance from the periphery.', category: 'international', source: 'International Desk', date: '2025-04-20', imageUrl: null },
  { id: '7', slug: 'platform-workers-unite', title: 'Platform Workers of the World, Unite', excerpt: 'From delivery riders to ride-share drivers, gig workers are forming new kinds of unions. A look at the emerging strategies of digital-age organising.', category: 'movements', source: 'Labour Desk', date: '2025-04-19', imageUrl: null },
  { id: '8', slug: 'state-and-revolution-revisited', title: 'State and Revolution, Revisited', excerpt: 'Lenin\'s classic text remains indispensable. We discuss its relevance to contemporary debates on state power and revolutionary strategy.', category: 'theory', source: 'Theory Circle', date: '2025-04-18', imageUrl: null },
  { id: '9', slug: 'inflation-and-wages', title: 'Inflation, Wages, and the Profit Squeeze', excerpt: 'Behind the headlines on inflation lies a class struggle over distribution. We break down who really pays and who profits.', category: 'analysis', source: 'Economics Desk', date: '2025-04-17', imageUrl: null },
];

const formatDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PoliticsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = MOCK_ARTICLES;
    if (activeCategory !== 'all') {
      list = list.filter((a) => a.category === activeCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((a) =>
        [a.title, a.excerpt, a.source].join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const featured = filtered[0] || null;
  const rest = filtered.slice(1);

  return (
    <div className={s.page}>
      <main className={s.main}>
        {/* ── Header ── */}
        <PageHeader
          kicker="Politics"
          title="Current Affairs"
          note="Political analysis, movement reports, and international dispatches."
          actions={<span className={s.countBadge}>{filtered.length} articles</span>}
        />

        {/* ── Toolbar ── */}
        <div className={s.toolbar}>
          <div className={s.searchRow}>
            <div className={s.searchWrap}>
              <Search size={18} className={s.searchIcon} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={s.searchInput}
              />
            </div>
          </div>
          <div className={s.filterRow}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`${s.filterPill} ${activeCategory === cat.id ? s.filterPillActive : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured article ── */}
        {featured && (
          <Link href={`/politics/${featured.slug}`} className={s.featured}>
            {featured.imageUrl ? (
              <img src={featured.imageUrl} alt={featured.title} className={s.featuredImage} />
            ) : (
              <div className={s.featuredImageFallback}>
                <ImageIcon size={48} />
              </div>
            )}
            <div className={s.featuredBody}>
              <span className={s.featuredBadge}>{featured.category}</span>
              <h2 className={s.featuredTitle}>{featured.title}</h2>
              <p className={s.featuredExcerpt}>{featured.excerpt}</p>
              <div className={s.featuredMeta}>
                <span>{featured.source}</span>
                <span>{formatDate(featured.date)}</span>
              </div>
              <span className={s.featuredLink}>
                Read article <ChevronRight size={16} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Grid ── */}
        {rest.length > 0 ? (
          <div className={s.grid}>
            {rest.map((article) => (
              <Link key={article.id} href={`/politics/${article.slug}`} className={s.card}>
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.title} className={s.cardImage} />
                ) : (
                  <div className={s.cardImageFallback}>
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className={s.cardBody}>
                  <span className={s.cardBadge}>{article.category}</span>
                  <h3 className={s.cardTitle}>{article.title}</h3>
                  <p className={s.cardExcerpt}>{article.excerpt}</p>
                </div>
                <div className={s.cardFooter}>
                  <span className={s.cardMeta}>{article.source} · {formatDate(article.date)}</span>
                  <span className={s.cardLink}>
                    Read <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : !featured ? (
          <div className={s.emptyState}>
            <p>No articles match your search.</p>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default PoliticsPage;
