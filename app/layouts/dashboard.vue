<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

/**
 * Navigation lives in the layout, not in a config file, because it is short
 * enough to read here and every entry needs `active` computed against the
 * current route.
 */
const primary = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Overview',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    active: route.path === '/dashboard'
  },
  {
    label: 'Analytics',
    icon: 'i-lucide-chart-line',
    to: '/dashboard/analytics',
    active: route.path === '/dashboard/analytics'
  },
  {
    label: 'Subscribers',
    icon: 'i-lucide-users',
    to: '/dashboard/subscribers',
    active: route.path === '/dashboard/subscribers'
  },
  {
    label: 'Forms',
    icon: 'i-lucide-square-pen',
    to: '/dashboard/forms',
    active: route.path === '/dashboard/forms'
  },
  {
    label: 'Layouts',
    icon: 'i-lucide-layout-grid',
    to: '/dashboard/layouts',
    active: route.path === '/dashboard/layouts'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/dashboard/settings',
    active: route.path === '/dashboard/settings'
  }
])

const secondary = computed<NavigationMenuItem[]>(() => [
  { label: 'Back to site', icon: 'i-lucide-arrow-left', to: '/' },
  {
    label: 'Documentation',
    icon: 'i-lucide-book-open',
    to: 'https://nuxt.com/docs',
    target: '_blank'
  }
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
        <UNavigationMenu
          :items="primary"
          :collapsed="collapsed"
          orientation="vertical"
          tooltip
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
