<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Language picker.
 *
 * Each language is written in its own script — someone looking for 繁體中文
 * is not helped by a list that says "Chinese (Traditional)" in English. The
 * choice is persisted by the i18n cookie, so it survives a reload and is
 * available to the server on the next request, which keeps SSR in the right
 * language rather than flashing English first.
 */
withDefaults(defineProps<{
  variant?: 'ghost' | 'subtle'
}>(), {
  variant: 'ghost'
})

const { locale, locales, setLocale } = useI18n()

const current = computed(() => locales.value.find(item => item.code === locale.value))

const items = computed<DropdownMenuItem[]>(() =>
  locales.value.map(item => ({
    label: item.name ?? item.code,
    // A check beside the active language, and nothing beside the others, so
    // the labels stay left-aligned with each other.
    icon: item.code === locale.value ? 'i-lucide-check' : undefined,
    onSelect: () => setLocale(item.code)
  }))
)
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', sideOffset: 8 }" :ui="{ content: 'w-44' }">
    <UButton
      color="neutral"
      :variant="variant"
      icon="i-lucide-languages"
      :aria-label="$t('language.change')"
      :title="$t('language.label')"
    >
      <span class="sr-only sm:not-sr-only sm:inline">{{ current?.name }}</span>
    </UButton>
  </UDropdownMenu>
</template>
