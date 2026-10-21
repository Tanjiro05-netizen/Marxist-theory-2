'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Cross-fades the step from the landing page into the platform.
 *
 * Only that one step. Arriving is a change of place worth marking; moving
 * around inside the platform afterwards is not, and a dissolve on every link
 * would turn the whole site slow.
 *
 * next/link swaps the route in place, so the browser never sees a document
 * change and never runs a transition of its own — and in the app router it
 * dispatches its navigation internally rather than through router.push, so
 * there is no router method to wrap either. That leaves the click: catch it
 * before next/link does, run the route change inside startViewTransition,
 * and hold the transition open until the new route commits so the browser
 * has an old and a new snapshot to dissolve between.
 *
 * The dissolve itself is styled in src/styles/view-transitions.css.
 */

/* Where the cross-fade may start: the landing page, and only on the way out
   of it. Coming back lands plainly. */
const LANDING_ROUTES = new Set(['/login']);

/* If a route's chunk or data is slow, run the cross-fade anyway rather than
   leaving the old page frozen under a held-open transition. */
const COMMIT_TIMEOUT_MS = 700;

/* The app router flips the pathname the moment navigation starts, while a
   loading boundary may still be the only thing on screen. Snapshotting then
   catches a page with no masthead in it, and the wordmark has nothing to
   travel to — it fades out instead of landing. So wait for the platform's own
   masthead to be on screen before letting the browser take its second
   snapshot, and give up after COMMIT_TIMEOUT_MS so a slow route can't freeze
   the page. */
const PLATFORM_MASTHEAD = '[data-site-wordmark]';

const POLL_MS = 16;

/* Poll on a timer, never requestAnimationFrame: the browser suppresses
   rendering between the first snapshot and this promise resolving, so rAF
   callbacks never run and the wait would deadlock the transition open.
   Layout still answers, so measuring the element is fine. */
const waitForPlatformMasthead = () =>
  new Promise((resolve) => {
    const deadline = performance.now() + COMMIT_TIMEOUT_MS;

    const tick = () => {
      const masthead = document.querySelector(PLATFORM_MASTHEAD);
      const onScreen = masthead && masthead.getBoundingClientRect().width > 0;
      if (onScreen || performance.now() > deadline) {
        resolve();
        return;
      }
      setTimeout(tick, POLL_MS);
    };

    tick();
  });

const isPlainLeftClick = (event) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * next/link always puts its own onClick on the rendered <a>, so the DOM node
 * can't tell us whether the app asked for a handler too. React's fiber for
 * the Link component can: the props held there are the ones this codebase
 * wrote. Anything we can't read comes back null — data-no-transition is the
 * contract, this is only the net under it.
 */
const appPropsFor = (anchor) => {
  const fiberKey = Object.keys(anchor).find((key) => key.startsWith('__reactFiber$'));
  if (!fiberKey) return null;

  let fiber = anchor[fiberKey];
  for (let depth = 0; fiber && depth < 5; depth += 1) {
    const props = fiber.memoizedProps;
    if (typeof fiber.type === 'function' && props && 'href' in props) return props;
    fiber = fiber.return;
  }
  return null;
};

/**
 * Some links answer their own clicks — the members-only entries in
 * PublicationContents call preventDefault and open a dialog instead of
 * navigating. Taking those clicks would send the reader somewhere they never
 * asked to go, so a link that handles its own is left to React, fade or no
 * fade. Mark any such link with data-no-transition.
 */
const handlesItsOwnClicks = (anchor) => {
  if (anchor.dataset.noTransition !== undefined) return true;

  const props = appPropsFor(anchor);
  return typeof props?.onClick === 'function' || typeof props?.onNavigate === 'function';
};

const routeChangeFor = (anchor) => {
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download')) return null;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  // Same page, only the hash or query moving — that is a scroll or a filter,
  // not a change of place, and dissolving it would feel broken.
  if (url.pathname === window.location.pathname) return null;

  return `${url.pathname}${url.search}${url.hash}`;
};

export default function NavTransition() {
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    if (typeof document.startViewTransition !== 'function') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const onClick = (event) => {
      if (event.defaultPrevented || !isPlainLeftClick(event)) return;

      if (!LANDING_ROUTES.has(window.location.pathname)) return;

      const anchor = event.target?.closest?.('a[href]');
      if (!anchor || handlesItsOwnClicks(anchor)) return;

      const href = routeChangeFor(anchor);
      if (!href) return;

      // One dissolve at a time; a second click mid-transition would snapshot
      // a page that is already half gone. A hidden tab can't animate at all.
      if (running.current || document.visibilityState !== 'visible') return;

      // next/link checks defaultPrevented and leaves the navigation to us.
      event.preventDefault();

      running.current = true;

      const transition = document.startViewTransition(() => {
        router.push(href);
        return waitForPlatformMasthead();
      });

      // A transition the browser abandons (a backgrounded tab, a second one
      // starting) rejects these; the navigation itself still stands.
      transition.ready.catch(() => {});
      transition.finished.then(
        () => { running.current = false; },
        () => { running.current = false; },
      );
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
