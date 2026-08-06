// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

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
  }
})
