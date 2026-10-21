/* Lock the page scroll behind full-screen overlays.
 *
 * The lock belongs on the root <html> element, not on <body>: theme.css
 * keeps `html { overflow-x: clip }`, and a browser only propagates the
 * body's overflow up to the viewport while the root's overflow is
 * `visible`. A body-only lock therefore leaves the page scrollable —
 * scrollbar included — behind fixed overlays. The root element's own
 * overflow always reaches the viewport, so locking there holds.
 *
 * The lock is reference-counted: nested overlays (global search opened
 * inside the mobile menu, a dialog over the timeline) each hold it, and
 * the page unlocks only when the last one closes.
 */

let heldLocks = 0;
let previousOverflow = '';

export function lockPageScroll() {
    if (heldLocks === 0) {
        const root = document.documentElement;
        previousOverflow = root.style.overflow;
        root.style.overflow = 'hidden';
    }
    heldLocks += 1;
    let released = false;
    return function unlockPageScroll() {
        if (released) return;
        released = true;
        heldLocks = Math.max(0, heldLocks - 1);
        if (heldLocks === 0) {
            document.documentElement.style.overflow = previousOverflow;
        }
    };
}
