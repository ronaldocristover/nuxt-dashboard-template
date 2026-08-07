<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

/**
 * The trail from the dashboard root to the page you are on.
 *
 * Most of it is derived from the route, because the route already knows: the
 * first segment under `/dashboard` maps to the same `nav.*` label the sidebar
 * uses, so a section renamed in one place is renamed in both.
 *
 * What the route cannot know is passed in — a member's name is not in the URL,
 * only their id. Pages supply those as `trail`.
 *
 * Deliberately renders nothing on `/dashboard` itself. A breadcrumb with a
 * single item that links to the page you are already on is decoration, and it
 * pushes the actual content down for no one's benefit.
 */

const props = defineProps<{
  /** Crumbs below the section, e.g. the record's name and then `Edit`. */
  trail?: BreadcrumbItem[]
}>()

const route = useRoute()
const { t } = useI18n()

/** `/dashboard/members/tm_2/edit` → `members`. */
const section = computed(() => {
  const [, , segment] = route.path.split('/')
  return segment ?? ''
})

const items = computed<BreadcrumbItem[]>(() => {
  const root: BreadcrumbItem = {
    label: t('breadcrumb.home'),
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard'
  }

  if (!section.value) return []

  return [
    root,
    {
      // Same key the sidebar reads, so the two can never disagree.
      label: t(`nav.${section.value}`),
      to: `/dashboard/${section.value}`
    },
    ...(props.trail ?? [])
  ]
})
</script>

<template>
  <UBreadcrumb
    v-if="items.length"
    :items="items"
    class="mb-1"
  />
</template>
