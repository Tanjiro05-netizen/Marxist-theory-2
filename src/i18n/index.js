import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';

/**
 * English is bundled; every other locale is fetched on demand.
 *
 * The six translation files together are about a third of a megabyte of
 * JSON. Bundling them all put the whole set in the chunk the root layout
 * loads, so every visitor downloaded and parsed five languages they would
 * never read, on every page. Now only the language actually in use is
 * fetched, as its own chunk, and it is cached for the rest of the session.
 */

export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'zh', 'fr', 'it'];

/* Static import paths, so the bundler can split each locale into its own
   chunk — a computed `import(path)` would defeat that. */
const LOADERS = {
  es: () => import('./locales/es.json'),
  de: () => import('./locales/de.json'),
  zh: () => import('./locales/zh.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
};

const inFlight = new Map();

/** Fetch and register a locale's bundle. Resolves once `t()` can use it. */
export const loadLocale = (language) => {
  const lng = (language || 'en').split('-')[0];
  if (lng === 'en' || !LOADERS[lng]) return Promise.resolve();
  if (i18n.hasResourceBundle(lng, 'translation')) return Promise.resolve();
  if (inFlight.has(lng)) return inFlight.get(lng);

  const promise = LOADERS[lng]()
    .then((mod) => {
      i18n.addResourceBundle(lng, 'translation', mod.default || mod, true, true);
    })
    .catch(() => {
      /* English is already loaded and is the fallback, so a failed locale
         fetch degrades to English rather than to an empty page. */
    })
    .finally(() => {
      inFlight.delete(lng);
    });

  inFlight.set(lng, promise);
  return promise;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    /* Languages arrive after init, so i18next must not treat a missing
       bundle as "this language has nothing". */
    partialBundledLanguages: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      /* Re-render when a lazily added bundle lands, not only on a switch. */
      bindI18n: 'languageChanged loaded added',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'marxist_lang',
    },
  });

/* Pull the bundle for whatever the detector settled on. Exported so the
   app can hold its first paint briefly rather than flash English. */
export const initialLocaleReady = loadLocale(i18n.language);

/* Switching language loads the bundle first, so the new language appears in
   one step instead of flickering through English. */
i18n.on('languageChanged', (lng) => {
  loadLocale(lng);
});

export default i18n;
