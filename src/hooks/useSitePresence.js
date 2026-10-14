import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Site-wide live presence — same Supabase Realtime pattern as the forum's
 * useForumPresence, but on one shared 'site-presence' channel. Every visitor
 * joins (guest or member), so the count reflects the whole site:
 *
 *   - logged-in users are keyed by their user id (several tabs = one person)
 *   - guests are keyed by a per-tab session id (each tab is a visitor)
 *
 * The websocket presence protocol detects joins/leaves within seconds, so the
 * returned count is live. Returns null until the first sync completes.
 */
const TAB_ID_KEY = 'marxist_tab_id';

const guestTabId = () => {
    try {
        let id = sessionStorage.getItem(TAB_ID_KEY);
        if (!id) {
            id = `guest-${typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem(TAB_ID_KEY, id);
        }
        return id;
    } catch {
        // Storage disabled — a transient id still counts this tab correctly
        return `guest-${Math.random().toString(36).slice(2)}`;
    }
};

export function useSitePresence(userId) {
    const [online, setOnline] = useState(null);
    const trackedRef = useRef(null);

    useEffect(() => {
        const key = userId || guestTabId();

        const channel = supabase.channel('site-presence', {
            config: { presence: { key } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                let members = 0;
                // One presence key = one person (or one guest tab)
                Object.values(state).forEach((presences) => {
                    if (presences.some((p) => p.user_id)) members += 1;
                });
                const total = Object.keys(state).length;
                setOnline({ total, members, guests: total - members });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    trackedRef.current = { user_id: userId || null, online_at: new Date().toISOString() };
                    channel.track(trackedRef.current);
                }
            });

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return online;
}

export default useSitePresence;
