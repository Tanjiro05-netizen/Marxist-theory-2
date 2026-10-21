import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../Globe/globeData';
import useMovementEvents from './useMovementEvents';
import { loadingSpinner } from '../../styles/obsidianTheme.css.ts';
import CountryDataPanel from './CountryDataPanel';
import * as s from './MovementsVisualization.css.ts';

/* The map view is code-split so its geometry/rendering cost is only
   paid when the Movements tab is opened. */
const MovementsMap2D = dynamic(() => import('./MovementsMap2D'), {
    ssr: false,
    loading: () => (
        <div className={s.messageState}>
            <div className={loadingSpinner} />
            <p className={s.messageText}>Loading map…</p>
        </div>
    ),
});

const PLAY_INTERVAL_MS = 120;

const MovementsVisualization = ({ onDataChange }) => {
    const { t } = useTranslation();
    const { events, connections, loading, error, yearMin, yearMax } = useMovementEvents();

    const [endYear, setEndYear] = useState(null); // null = show all
    const [playing, setPlaying] = useState(false);
    const [hiddenCategories, setHiddenCategories] = useState(() => new Set());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const playTimer = useRef(null);

    const effectiveEnd = endYear === null ? yearMax : endYear;

    /* Time animation: sweep endYear from min to max, then stop. */
    useEffect(() => {
        if (!playing) return undefined;
        playTimer.current = setInterval(() => {
            setEndYear(prev => {
                const current = prev === null ? yearMin : prev;
                if (current >= yearMax) {
                    setPlaying(false);
                    return yearMax;
                }
                return current + 1;
            });
        }, PLAY_INTERVAL_MS);
        return () => clearInterval(playTimer.current);
    }, [playing, yearMin, yearMax]);

    const visibleEvents = useMemo(
        () => events.filter(ev =>
            (!ev.year || ev.year <= effectiveEnd) &&
            !hiddenCategories.has(ev.category)
        ),
        [events, effectiveEnd, hiddenCategories]
    );

    const visibleConnections = useMemo(
        () => connections.filter(conn => {
            if (hiddenCategories.has(conn.category)) return false;
            const from = events.find(e => e.id === conn.from);
            const to = events.find(e => e.id === conn.to);
            return from && to && (!from.year || from.year <= effectiveEnd) && (!to.year || to.year <= effectiveEnd);
        }),
        [connections, events, effectiveEnd, hiddenCategories]
    );

    // Publish visible rows for the page's CSV export
    useEffect(() => {
        onDataChange?.(visibleEvents.map(ev => ({
            event: ev.name, year: ev.year, category: ev.category,
            country: ev.country || '', lat: ev.lat, lng: ev.lng,
        })));
    }, [visibleEvents, onDataChange]);

    const toggleCategory = (cat) => {
        setHiddenCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const handleSelectEvent = (ev) => {
        setSelectedEvent(prev => (ev && prev?.id === ev.id ? null : ev));
    };

    const handleSelectCountry = (code) => {
        setSelectedCountry(prev => (prev === code ? null : code));
    };

    return (
        <div className={s.root}>
            {/* Header row: counts + hint */}
            <div className={s.modeRow}>
                <span className={s.modeHint}>{t('data.mapHint')}</span>
                <span className={s.countNote} style={{ marginLeft: 'auto' }}>
                    {t('data.eventsShown', { count: visibleEvents.length })}
                </span>
            </div>

            {/* Time slider */}
            <div className={s.timeRow}>
                <span className={s.timeLabel}>{t('data.timeWindow')}</span>
                <button
                    onClick={() => setPlaying(p => !p)}
                    className={s.playBtn}
                    title={playing ? t('data.pause') : t('data.play')}
                >
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <input
                    type="range"
                    className={s.timeSlider}
                    min={yearMin}
                    max={yearMax}
                    value={effectiveEnd}
                    onChange={e => { setPlaying(false); setEndYear(parseInt(e.target.value, 10)); }}
                />
                <span className={s.timeYear}>
                    {yearMin}–{effectiveEnd}
                </span>
            </div>

            {/* Category legend */}
            <div className={s.legend}>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button
                        key={key}
                        onClick={() => toggleCategory(key)}
                        className={`${s.legendItem} ${hiddenCategories.has(key) ? s.legendItemDisabled : ''}`}
                    >
                        <span className={s.legendDot} style={{ background: cat.color }} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className={s.messageState}>
                    <div className={loadingSpinner} />
                    <p className={s.messageText}>{t('common.loading')}…</p>
                </div>
            ) : error ? (
                <div className={s.messageState}>
                    <p className={s.messageText}>{t('data.eventsError')}</p>
                </div>
            ) : (
                <div className={s.contentGrid}>
                    <div>
                        <MovementsMap2D
                            events={visibleEvents}
                            connections={visibleConnections}
                            selectedEvent={selectedEvent}
                            onSelectEvent={handleSelectEvent}
                            onSelectCountry={handleSelectCountry}
                            yearRange={`${yearMin}–${effectiveEnd}`}
                        />
                    </div>

                    <div className={s.sidePanel}>
                        {selectedEvent && (
                            <div className={s.detailCard}>
                                <div
                                    className={s.detailCategory}
                                    style={{ color: CATEGORIES[selectedEvent.category]?.color }}
                                >
                                    {CATEGORIES[selectedEvent.category]?.label}
                                </div>
                                <div className={s.detailTitle}>
                                    {selectedEvent.name}
                                    <span className={s.detailYear}>{selectedEvent.year}</span>
                                </div>
                                <p className={s.detailDesc}>{selectedEvent.description}</p>
                                {selectedEvent.country && (
                                    <button
                                        className={s.detailCountry}
                                        onClick={() => handleSelectCountry(selectedEvent.country)}
                                    >
                                        {t('data.countryStats')} →
                                    </button>
                                )}
                            </div>
                        )}
                        <CountryDataPanel countryCode={selectedCountry} onClose={() => setSelectedCountry(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovementsVisualization;
