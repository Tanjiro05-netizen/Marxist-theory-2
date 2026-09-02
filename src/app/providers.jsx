'use client';

import React, { Suspense, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import '@/src/i18n';
import { AuthProvider } from '@/src/context/AuthContext.jsx';
import { AudioPlayerProvider } from '@/src/context/AudioPlayerContext.jsx';
import { ThemeProvider } from '@/src/context/ThemeContext.jsx';
import ErrorBoundary from '@/src/components/ErrorBoundary.jsx';
import FloatingMiniPlayer from '@/src/components/Library/FloatingMiniPlayer.jsx';
import MaintenancePage from '@/src/views/MaintenancePage.jsx';
import i18n from '@/src/i18n';

const DEVELOPMENT_CACHE_NAMES = ['api-cache', 'google-fonts', 'images', 'images-v2'];
const SERVICE_WORKER_RELOAD_KEY = 'marxist-platform-sw-reload-at';

/* Keep <html lang> in step with the selected language for a11y/SEO. */
const HtmlLangSync = () => {
  useEffect(() => {
    const set = (lng) => {
      document.documentElement.lang = (lng || 'en').split('-')[0];
    };
    set(i18n.language);
    i18n.on('languageChanged', set);
    return () => i18n.off('languageChanged', set);
  }, []);
  return null;
};

const isDevelopmentAppCache = (cacheName) =>
  DEVELOPMENT_CACHE_NAMES.includes(cacheName) ||
  cacheName.startsWith('workbox-precache') ||
  cacheName.includes('precache');

const clearDevelopmentServiceWorkersAndCaches = () => {
  if (process.env.NODE_ENV === 'production') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((error) => {
        console.warn('Failed to unregister development service workers:', error);
      });
  }

  if ('caches' in window) {
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(isDevelopmentAppCache)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .catch((error) => {
        console.warn('Failed to clear development caches:', error);
      });
  }
};

const reloadForServiceWorkerUpdate = () => {
  let shouldReload = true;

  try {
    const lastReloadAt = Number(sessionStorage.getItem(SERVICE_WORKER_RELOAD_KEY) || 0);
    shouldReload = Date.now() - lastReloadAt > 10000;
    if (shouldReload) sessionStorage.setItem(SERVICE_WORKER_RELOAD_KEY, `${Date.now()}`);
  } catch {
    shouldReload = true;
  }

  if (shouldReload) window.location.reload();
};

const activateWaitingServiceWorker = (registration) => {
  if (!navigator.serviceWorker.controller || !registration?.waiting) return;
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
};

const watchServiceWorkerUpdate = (registration) => {
  if (!registration?.installing) return;

  registration.installing.addEventListener('statechange', () => {
    activateWaitingServiceWorker(registration);
  });
};

const registerProductionServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    reloadForServiceWorkerUpdate();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        activateWaitingServiceWorker(registration);
        watchServiceWorkerUpdate(registration);
        registration.addEventListener('updatefound', () => watchServiceWorkerUpdate(registration));
        registration.update().catch((error) => {
          console.warn('Failed to check for service worker update:', error);
        });
      })
      .catch((error) => {
        console.error('Error during service worker registration:', error);
      });
  });
};

export default function Providers({ children, initialAuth }) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const content = maintenanceMode ? <MaintenancePage /> : children;

  useEffect(() => {
    const logGlobalError = (event) => {
      console.error('Global error:', event.error);
    };

    window.addEventListener('error', logGlobalError);
    clearDevelopmentServiceWorkersAndCaches();
    registerProductionServiceWorker();

    return () => window.removeEventListener('error', logGlobalError);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    console.log(
      '%cStop!',
      'color: #b3122e; font-size: 48px; font-weight: bold; -webkit-text-stroke: 2px black;'
    );
    console.log(
      "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam.\n\nThis site's source code is proprietary and protected. Unauthorised reproduction is prohibited.",
      'color: #fff; font-size: 14px; background: #111; padding: 8px 12px; border-left: 4px solid #b3122e;'
    );
  }, []);

  return (
    <ErrorBoundary>
      <HtmlLangSync />
      <AuthProvider
        initialUser={initialAuth?.user ?? null}
        initialProfile={initialAuth?.profile ?? null}
        initialAuthResolved={initialAuth?.resolved ?? false}
      >
        <AudioPlayerProvider>
          <ThemeProvider>
            <Suspense fallback={null}>{content}</Suspense>
          </ThemeProvider>
          <FloatingMiniPlayer />
        </AudioPlayerProvider>
      </AuthProvider>
      <Analytics />
    </ErrorBoundary>
  );
}
