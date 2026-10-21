'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { GLOBE_EVENTS, GLOBE_CONNECTIONS, resolveLocation, LOCATION_COUNTRIES } from '../Globe/globeData';

/* Resolve the ISO alpha-2 country for an event, via the gazetteer key
   that matched its location text (or its curated name). */
const countryForKey = (key) => (key && LOCATION_COUNTRIES[key]) || null;

const resolveEventCountry = (text) => {
  const resolved = resolveLocation(text);
  return resolved ? countryForKey(resolved.key) : null;
};

/**
 * Shared data layer for the Movements map views (flat + satellite).
 * Merges the curated GLOBE_EVENTS with Supabase timeline_events, geocoded
 * through the gazetteer, and resolves each event to a country code.
 */
export function useMovementEvents() {
  const [timeline, setTimeline] = useState({ events: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchTimeline() {
      try {
        const { data, error: err } = await supabase
          .from('timeline_events')
          .select('id, title, description, year, location, category')
          .order('year', { ascending: true });
        if (cancelled) return;
        if (err || !data) throw err || new Error('No data');

        const events = [];
        for (const ev of data) {
          const resolved = resolveLocation(ev.location);
          if (!resolved) continue;
          events.push({
            id: `tl-${ev.id}`,
            name: ev.title,
            lat: resolved.coords[0],
            lng: resolved.coords[1],
            year: ev.year,
            category: 'timeline',
            description: ev.description || ev.location,
            country: countryForKey(resolved.key),
          });
        }
        /* Chain timeline events chronologically into a continuous path */
        const connections = [];
        for (let i = 0; i < events.length - 1; i++) {
          if (events[i].lat === events[i + 1].lat && events[i].lng === events[i + 1].lng) continue;
          connections.push({ from: events[i].id, to: events[i + 1].id, category: 'timeline' });
        }
        setTimeline({ events, connections });
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTimeline();
    return () => { cancelled = true; };
  }, []);

  const events = useMemo(
    () => [
      ...GLOBE_EVENTS.map(ev => ({ ...ev, country: resolveEventCountry(ev.name) })),
      ...timeline.events,
    ],
    [timeline.events]
  );

  const connections = useMemo(
    () => [...GLOBE_CONNECTIONS, ...timeline.connections],
    [timeline.connections]
  );

  const { yearMin, yearMax } = useMemo(() => {
    if (events.length === 0) return { yearMin: 1818, yearMax: new Date().getFullYear() };
    return {
      yearMin: Math.min(...events.map(e => e.year || 9999)),
      yearMax: Math.max(...events.map(e => e.year || 0)),
    };
  }, [events]);

  return { events, connections, loading, error, yearMin, yearMax };
}

export default useMovementEvents;
