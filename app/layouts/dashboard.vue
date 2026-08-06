<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { sampleNavTree } from '~/utils/sample-nav'

const route = useRoute()
const { t } = useI18n()

/**
 * Navigation lives in the layout, not in a config file, because it is short
 * enough to read here and every entry needs `active` computed against the
 * current route. Labels come from translations so the sidebar follows the
 * reader's language.
 */
const primary = computed<NavigationMenuItem[]>(() => [
  { label: t('nav.overview'), icon: 'i-lucide-layout-dashboard', to: '/dashboard', active: route.path === '/dashboard' },
  { label: t('nav.analytics'), icon: 'i-lucide-chart-line', to: '/dashboard/analytics', active: route.path === '/dashboard/analytics' },
  { label: t('nav.subscribers'), icon: 'i-lucide-users', to: '/dashboard/subscribers', active: route.path === '/dashboard/subscribers' },
  { label: t('nav.kanban'), icon: 'i-lucide-kanban', to: '/dashboard/kanban', active: route.path === '/dashboard/kanban' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', to: '/dashboard/settings', active: route.path === '/dashboard/settings' }
])

/**
 * The reference pages are documentation for whoever bought the template, not
 * product. They sit in their own group so the product navigation above stays
 * short, and so deleting them before shipping is one obvious edit.
 */
const reference = computed<NavigationMenuItem[]>(() => [
  { label: t('nav.forms'), icon: 'i-lucide-square-pen', to: '/dashboard/forms', active: route.path === '/dashboard/forms' },
  { label: t('nav.layouts'), icon: 'i-lucide-layout-grid', to: '/dashboard/layouts', active: route.path === '/dashboard/layouts' },
  { label: t('nav.icons'), icon: 'i-lucide-shapes', to: '/dashboard/icons', active: route.path === '/dashboard/icons' },
  { label: t('nav.overlays'), icon: 'i-lucide-layers', to: '/dashboard/overlays', active: route.path === '/dashboard/overlays' },
  { label: t('nav.wizard'), icon: 'i-lucide-list-checks', to: '/dashboard/wizard', active: route.path === '/dashboard/wizard' },
  { label: t('nav.table'), icon: 'i-lucide-table', to: '/dashboard/table', active: route.path === '/dashboard/table' },
  { label: t('nav.navigation'), icon: 'i-lucide-list-tree', to: '/dashboard/navigation', active: route.path === '/dashboard/navigation' }
])

/**
 * A live three-level tree, so the nesting on `/dashboard/navigation` can be
 * tried in the real sidebar rather than only in a framed demo. Sample content —
 * delete it with the rest of the reference group.
 */
const sampleTree = computed<NavigationMenuItem[]>(() => sampleNavTree())

const secondary = computed<NavigationMenuItem[]>(() => [
  { label: t('nav.backToSite'), icon: 'i-lucide-arrow-left', to: '/' },
  { label: t('nav.documentation'), icon: 'i-lucide-book-open', to: 'https://nuxt.com/docs', target: '_blank' }
])
</script>

<template>
  <UDashboardGroup storage="cookie" storage-key="cadence-dashboard">
    <UDashboardSidebar
      collapsible
      resizable
      :min-size="14"
      :default-size="17"
      :max-size="24"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/dashboard" class="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <AppLogo :show-wordmark="!collapsed" />
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :items="primary" :collapsed="collapsed" orientation="vertical" tooltip />

        <USeparator v-if="!collapsed" :label="$t('nav.reference')" class="my-3" :ui="{ label: 'eyebrow text-dimmed' }" />
        <USeparator v-else class="my-3" />

        <UNavigationMenu
          :items="reference"
          :collapsed="collapsed"
          orientation="vertical"
          tooltip
          :ui="{ link: 'text-muted' }"
        />

        <USeparator
          v-if="!collapsed"
          :label="$t('nav.sampleTree')"
          class="my-3"
          :ui="{ label: 'eyebrow text-dimmed' }"
        />
        <USeparator v-else class="my-3" />

        <UNavigationMenu
          :items="sampleTree"
          :collapsed="collapsed"
          orientation="vertical"
          tooltip
          :ui="{ link: 'text-muted' }"
        />

        <div class="flex-1" />

        <UNavigationMenu
          :items="secondary"
          :collapsed="collapsed"
          orientation="vertical"
          tooltip
          :ui="{ link: 'text-muted' }"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
