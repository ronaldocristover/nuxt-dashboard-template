<script setup lang="ts">
import { en, id, zh_cn, zh_tw } from '@nuxt/ui/locale'

const { t, locale } = useI18n()

/**
 * Nuxt UI carries its own translations for the strings inside its components
 * — pagination labels, "clear", calendar month names, and the text direction.
 * Without this, a page could be fully translated except for the widgets, which
 * reads worse than not translating at all.
 */
const UI_LOCALES = { 'en': en, 'id': id, 'zh-Hans': zh_cn, 'zh-Hant': zh_tw }

const uiLocale = computed(() => UI_LOCALES[locale.value as keyof typeof UI_LOCALES] ?? en)

// `lang` has to follow the active locale or a screen reader announces every
// page in English, and the browser offers to translate a page it is already
// reading correctly.
useHead(() => ({
  htmlAttrs: {
    lang: uiLocale.value.code,
    dir: uiLocale.value.dir
  }
}))

/**
 * Share-preview defaults.
 *
 * `twitterCard: summary_large_image` without an `og:image` is worse than no
 * card at all — the platform reserves the large slot and then renders it blank.
 * So the image is declared here alongside it, absolute (relative paths are
 * dropped by every scraper) and with explicit dimensions so the preview does
 * not reflow while it loads.
 *
 * Pages may override the title and description; they inherit everything else.
 */
const site = useRuntimeConfig().public.appUrl.replace(/\/+$/, '')
const route = useRoute()

const ogImage = `${site}/og.png`

useSeoMeta({
  titleTemplate: title => (title ? `${title} · ${t('app.name')}` : `${t('app.name')} — ${t('app.description')}`),
  description: () => t('app.description'),
  ogSiteName: () => t('app.name'),
  ogType: 'website',
  ogTitle: () => `${t('app.name')} — ${t('app.description')}`,
  ogDescription: () => t('app.description'),
  ogUrl: () => `${site}${route.path}`,
  ogImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => t('app.ogImageAlt'),
  ogLocale: () => uiLocale.value.code.replace('-', '_'),
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${t('app.name')} — ${t('app.description')}`,
  twitterDescription: () => t('app.description'),
  twitterImage: ogImage,
  twitterImageAlt: () => t('app.ogImageAlt')
})

// A canonical per path, so the four locales served at one URL are not read as
// four competing pages.
useHead(() => ({
  link: [{ rel: 'canonical', href: `${site}${route.path}` }]
}))
</script>

<template>
  <UApp :locale="uiLocale" :toaster="{ position: 'top-right', duration: 4500 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
