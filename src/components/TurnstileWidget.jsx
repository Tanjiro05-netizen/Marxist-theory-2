'use client';

import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';
const TEST_SITE_KEY = '1x00000000000000000000AA';

const getSiteKey = () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (
  process.env.NODE_ENV !== 'production' ? TEST_SITE_KEY : ''
);

const TurnstileWidget = ({ onToken, resetKey = 0, className = '' }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const sitekey = getSiteKey();
    if (!sitekey) {
      onToken(null);
      return undefined;
    }

    let cancelled = false;
    let script = document.getElementById(SCRIPT_ID);

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        action: 'submit_work',
        theme: 'dark',
        size: 'flexible',
        appearance: 'interaction-only',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    if (window.turnstile) {
      render();
    } else if (script) {
      script.addEventListener('load', render, { once: true });
    } else {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken, resetKey]);

  if (!getSiteKey()) {
    return <p className={className}>The secure upload check is not configured yet.</p>;
  }

  return <div ref={containerRef} className={className} aria-label="Security check" />;
};

export default TurnstileWidget;
