import { useCallback, useEffect, useRef, useState } from 'react';

/* Per-book reading position, stored locally so reopening a book resumes
   where the reader left off (EpubReader keeps its own CFI-based position). */
const READER_POSITION_KEY = 'reader-position:';

export const saveReaderPosition = (bookId, payload) => {
    if (!bookId) return;
    try {
        localStorage.setItem(READER_POSITION_KEY + bookId, JSON.stringify(payload));
    } catch { /* storage full or unavailable — resume is best-effort */ }
};

export const loadReaderPosition = (bookId) => {
    if (!bookId) return null;
    try {
        const raw = localStorage.getItem(READER_POSITION_KEY + bookId);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/* Reading chrome state: the toolbar hides while scrolling into the text and
   returns on the first flick up, plus the mobile TOC sheet's open state. */
export const useReaderChrome = () => {
    const [toolbarHidden, setToolbarHidden] = useState(false);
    const [tocOpen, setTocOpen] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;
        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const y = window.scrollY;
                const delta = y - lastY;
                if (Math.abs(delta) < 4) return;
                if (y < 96) setToolbarHidden(false);
                else setToolbarHidden(delta > 0);
                lastY = y;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    const openToc = useCallback(() => {
        setToolbarHidden(false);
        setTocOpen(true);
    }, []);
    const closeToc = useCallback(() => setTocOpen(false), []);

    return { toolbarHidden, tocOpen, openToc, closeToc };
};

/* Position persistence throttled to one write per second — the scroll
   handler stays cheap while still capturing the resting place. */
export const usePositionSaver = (bookId) => {
    const lastSaveRef = useRef(0);
    return useCallback((payload) => {
        if (!bookId) return;
        const now = Date.now();
        if (now - lastSaveRef.current < 1000) return;
        lastSaveRef.current = now;
        saveReaderPosition(bookId, payload);
    }, [bookId]);
};
