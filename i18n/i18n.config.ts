/**
 * vue-i18n options that the Nuxt module passes straight through.
 *
 * `fallbackLocale` matters most: `en.json` is the source of truth, so a key
 * that has not been translated yet renders the English sentence rather than
 * the raw key path. A half-finished translation degrades to readable English
 * instead of showing `settings.billing.planTitle` to a customer.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  // Missing keys are a build-time concern, not something to log at runtime in
  // production. `npm run i18n:check` compares the files instead.
  missingWarn: import.meta.dev,
  fallbackWarn: false
}))
