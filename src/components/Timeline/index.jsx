import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, MapPin, X, Calendar, Tag, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import * as s from './Timeline.css.ts';

const CATEGORY_LABELS = {
    biography: 'Biography',
    academic: 'Academic',
    publication: 'Publication',
    organization: 'Organization',
    historical: 'Historical',
    revolution: 'Revolution',
    war: 'War',
    economic: 'Economic',
};

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(year, month, day) {
    let parts = [];
    if (month) parts.push(MONTHS[month]);
    if (day) parts.push(`${day},`);
    parts.push(String(year));
    return parts.join(' ');
}

function formatDayLabel(month, day) {
    return [MONTHS[month], day].filter(Boolean).join(' ');
}

function extractWikiTitle(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        const path = u.pathname;
        const match = path.match(/\/wiki\/(.+)/);
        return match ? decodeURIComponent(match[1]) : null;
    } catch { return null; }
}

const Timeline = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeEvent, setActiveEvent] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [filter, setFilter] = useState('all');
    const [isScrolled, setIsScrolled] = useState(false);
    const [thumbs, setThumbs] = useState({});
    const [modalEvent, setModalEvent] = useState(null);
    const [glossaryMatches, setGlossaryMatches] = useState([]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const resolveThumb = useCallback(async (title) => {
        try {
            const res = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            );
            if (!res.ok) return null;
            const json = await res.json();
            return json.thumbnail?.source || json.originalimage?.source || null;
        } catch { return null; }
    }, []);

    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            const { data, error } = await supabase
                .from('timeline_events')
                .select('*')
                .order('year', { ascending: true })
                .order('month', { ascending: true, nullsFirst: true })
                .order('day', { ascending: true, nullsFirst: true });

            if (error) {
                console.error('Failed to load timeline events:', error);
            } else {
                setEvents(data || []);
            }
            setLoading(false);
        }
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!events.length) return;
        let cancelled = false;
        async function fetchThumbs() {
            const batch = {};
            const queue = events.filter(e => e.wikipedia_url && !thumbs[e.id]);
            const BATCH_SIZE = 6;
            for (let i = 0; i < queue.length; i += BATCH_SIZE) {
                const chunk = queue.slice(i, i + BATCH_SIZE);
                const results = await Promise.all(
                    chunk.map(async (ev) => {
                        const title = extractWikiTitle(ev.wikipedia_url);
                        if (!title) return [ev.id, null];
                        const src = await resolveThumb(title);
                        return [ev.id, src];
                    })
                );
                if (cancelled) return;
                for (const [id, src] of results) {
                    if (src) batch[id] = src;
                }
                setThumbs(prev => ({ ...prev, ...batch }));
            }
        }
        fetchThumbs();
        return () => { cancelled = true; };
    }, [events, resolveThumb]);

    // Fetch glossary matches when modal opens
    useEffect(() => {
        if (!modalEvent) { setGlossaryMatches([]); return; }
        let cancelled = false;
        async function fetchGlossary() {
            const searchTerms = [
                modalEvent.title,
                ...(modalEvent.related_people || []),
            ].filter(Boolean);
            if (!searchTerms.length) return;
            const orFilter = searchTerms.map(t => `term.ilike.%${t}%`).join(',');
            const { data, error } = await supabase
                .from('glossary')
                .select('term, type, explanation')
                .or(orFilter)
                .limit(8);
            if (!cancelled && !error) setGlossaryMatches(data || []);
        }
        fetchGlossary();
        return () => { cancelled = true; };
    }, [modalEvent]);

    // Escape key closes modal
    useEffect(() => {
        if (!modalEvent) return;
        const onKey = (e) => { if (e.key === 'Escape') setModalEvent(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [modalEvent]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (modalEvent) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [modalEvent]);

    const categories = [
        { id: 'all', name: 'All' },
        ...Object.entries(CATEGORY_LABELS).map(([id, name]) => ({ id, name })),
    ];

    const filteredEvents = filter === 'all'
        ? events
        : events.filter(e => e.category === filter);

    if (loading) {
        return <div className={s.loadingWrap}>Loading timeline…</div>;
    }

    if (!events.length) {
        return <div className={s.emptyWrap}>No timeline events found.</div>;
    }

    return (
        <div className={s.root}>
            {/* Category Filter — underline text tabs */}
            <div className={s.filterBar}>
                <div className={s.filterInner}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setFilter(cat.id);
                                window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                            }}
                            className={`${s.filterBtn} ${filter === cat.id ? s.filterBtnActive : ''}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scroll to Top */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`${s.scrollBtn} ${isScrolled ? s.scrollBtnVisible : s.scrollBtnHidden}`}
                aria-label="Scroll to top"
            >
                <ChevronDown size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>

            {/* Events — one spine, hairline rows */}
            <div className={s.timeline}>
                {filteredEvents.map(event => {
                    const isActive = activeEvent === event.id;
                    const isExpanded = expandedEvent === event.id;
                    const isCritical = event.importance === 'critical';
                    const thumb = thumbs[event.id] || event.image_url;

                    return (
                        <article
                            key={event.id}
                            className={s.event}
                        >
                            <div className={s.when}>
                                <span className={`${s.year} ${isCritical ? s.yearCritical : ''}`}>{event.year}</span>
                                {formatDayLabel(event.month, event.day) && (
                                    <span className={s.dateLabel}>{formatDayLabel(event.month, event.day)}</span>
                                )}
                                <span className={s.catLabel}>
                                    {CATEGORY_LABELS[event.category] || event.category}
                                </span>
                            </div>

                            <div className={s.node} aria-hidden="true">
                                <span className={`${s.nodeDot} ${isActive ? s.nodeDotActive : ''}`} />
                            </div>

                            <div className={s.body}>
                                <h3
                                    className={s.title}
                                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                    onMouseEnter={() => setActiveEvent(event.id)}
                                    onMouseLeave={() => setActiveEvent(null)}
                                >
                                    {event.title}
                                    {event.detailed_description && (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); setModalEvent(event); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setModalEvent(event); } }}
                                            style={{ cursor: 'pointer', display: 'inline-flex' }}
                                        >
                                            <ExternalLink size={13} className={s.titleIcon} />
                                        </span>
                                    )}
                                </h3>

                                <p className={s.desc}>{event.description}</p>

                                {isExpanded && event.detailed_description && (
                                    <p className={s.desc} style={{ color: vars_colorSoft }}>
                                        {event.detailed_description}
                                    </p>
                                )}

                                {thumb && (
                                    <div className={s.eventImage}>
                                        <img
                                            src={thumb}
                                            alt={event.title}
                                            className={s.eventImg}
                                            loading="lazy"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                {(event.location || (event.related_people && event.related_people.length > 0)) && (
                                    <div className={s.metaLine}>
                                        {event.location && (
                                            <span>
                                                <MapPin size={11} style={{ verticalAlign: '-1px' }} /> {event.location}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {event.related_people && event.related_people.length > 0 && (
                                    <div className={s.people}>
                                        {event.related_people.map(person => (
                                            <span key={person} className={s.personTag}>{person}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Detail Modal — flat ink panel with drop cap */}
            {modalEvent && (
                <>
                    <div className={s.modalOverlay} onClick={() => setModalEvent(null)} />
                    <div className={s.modalPanel}>
                        <button className={s.modalClose} onClick={() => setModalEvent(null)} aria-label="Close">
                            <X size={18} />
                        </button>

                        {(thumbs[modalEvent.id] || modalEvent.image_url) && (
                            <img
                                src={thumbs[modalEvent.id] || modalEvent.image_url}
                                alt={modalEvent.title}
                                className={s.modalHero}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}

                        <div className={s.modalCategory}>
                            {CATEGORY_LABELS[modalEvent.category] || modalEvent.category}
                        </div>
                        <h2 className={s.modalTitle}>{modalEvent.title}</h2>
                        <div className={s.modalRule} aria-hidden="true" />

                        <div className={s.modalMeta}>
                            <span className={s.modalMetaItem}>
                                <Calendar size={12} />
                                {formatDate(modalEvent.year, modalEvent.month, modalEvent.day)}
                            </span>
                            {modalEvent.location && (
                                <span className={s.modalMetaItem}>
                                    <MapPin size={12} /> {modalEvent.location}
                                </span>
                            )}
                            {modalEvent.importance && (
                                <span className={s.modalMetaItem}>
                                    <Tag size={12} /> {modalEvent.importance}
                                </span>
                            )}
                        </div>

                        <hr className={s.modalDivider} />

                        <p className={s.modalBody}>
                            {modalEvent.detailed_description || modalEvent.description}
                        </p>

                        {modalEvent.related_people && modalEvent.related_people.length > 0 && (
                            <div className={s.modalPeople}>
                                {modalEvent.related_people.map(person => (
                                    <Link
                                        key={person}
                                        href={`/glossary/${encodeURIComponent(person)}`}
                                        className={s.personTag}
                                        onClick={() => setModalEvent(null)}
                                    >
                                        {person}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {glossaryMatches.length > 0 && (
                            <div className={s.glossarySection}>
                                <h3 className={s.glossarySectionTitle}>From the Internal Wiki</h3>
                                {glossaryMatches.map(g => (
                                    <div key={g.term} className={s.glossaryCard}>
                                        <div>
                                            <span className={s.glossaryCardTerm}>{g.term}</span>
                                            <span className={s.glossaryCardType}>{g.type}</span>
                                        </div>
                                        <p className={s.glossaryCardExcerpt}>{g.explanation}</p>
                                        <Link href={`/glossary/${encodeURIComponent(g.term)}`}
                                            className={s.glossaryCardLink}
                                            onClick={() => setModalEvent(null)}
                                        >
                                            Read full entry <ArrowRight size={10} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const vars_colorSoft = '#c9c5b8';

export default Timeline;
