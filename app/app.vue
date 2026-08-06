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

useSeoMeta({
  titleTemplate: title => (title ? `${title} · ${t('app.name')}` : `${t('app.name')} — ${t('app.description')}`),
  ogSiteName: () => t('app.name'),
  ogType: 'website',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :locale="uiLocale" :toaster="{ position: 'top-right', duration: 4500 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
