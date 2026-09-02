// Keeps src/i18n/locales/*.json canonical: `npx i18next-parser` re-extracts
// every t('ns.key') literal from the code, adds missing keys to en.json, and
// reports keys that no longer exist (remove those by hand — dynamic keys like
// `library.categories.${key}` must stay even if the scanner can't see them).
module.exports = {
  input: ['src/**/*.{js,jsx}'],
  output: 'src/i18n/locales',
  locales: ['en'],
  sort: false,
  keySeparator: '.',
  namespaceSeparator: '.',
  defaultValue: '',
  singleBucket: false,
  createOldCatalogs: false,
  verbose: false,
};
