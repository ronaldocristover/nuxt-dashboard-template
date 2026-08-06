// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/i18n'],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#2D5BFF' }
      ]
    }
  },

  css: [
    '@fontsource-variable/bricolage-grotesque',
    '@fontsource-variable/ibm-plex-sans',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '@fontsource/ibm-plex-mono/600.css',
    '~/assets/css/main.css'
  ],

  runtimeConfig: {
    // Overridden by NUXT_SESSION_PASSWORD. Must be at least 32 characters.
    sessionPassword: '',
    // Overridden by NUXT_APP_URL. Used to build password-reset links.
    appUrl: 'http://localhost:3000',
    public: {
      // Overridden by NUXT_PUBLIC_DEMO_MODE. Shows the demo credentials hint on /login.
      demoMode: true
    }
  },

  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-07-15',

  nitro: {
    // Precompress static assets so a CDN or reverse proxy can serve them directly.
    compressPublicAssets: { brotli: true, gzip: true }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    // `no_prefix` keeps one canonical URL set and stores the choice in a
    // cookie. Nothing in the app has to remember to localise a link, which is
    // the failure mode that makes half-translated apps.
    //
    // If you need per-language URLs for SEO on the marketing pages, switch to
    // `prefix_except_default` and replace every `to="/…"` with
    // `:to="localePath('/…')"` — see README.
    strategy: 'no_prefix',
    defaultLocale: 'en',
    // `en` is the source of truth; a key missing from another file falls back
    // to English rather than rendering the raw key. Configured in
    // `i18n/i18n.config.ts`, which vue-i18n owns.
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'id', name: 'Bahasa Indonesia', language: 'id-ID', file: 'id.json' },
      { code: 'zh-Hans', name: '简体中文', language: 'zh-Hans-CN', file: 'zh-Hans.json' },
      { code: 'zh-Hant', name: '繁體中文', language: 'zh-Hant-TW', file: 'zh-Hant.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'cadence-locale',
      alwaysRedirect: false,
      fallbackLocale: 'en',
      // The cookie must outlive the session or the choice is lost on return.
      cookieSecure: false
    }
  }
})
