<script setup lang="ts">
/**
 * Shared chrome for the developer reference pages — forms, layouts, icons,
 * overlays, wizard, table.
 *
 * Each of those is a long scroll of live examples, and each needs the same
 * frame: a dashboard panel, a heading, an intro, and jump links. Keeping that
 * here means a new reference page is a list of sections, not a copy of a page.
 *
 * The prose on these pages stays in English. They document the template for
 * whoever bought it, so they are not part of the translated product surface —
 * only the sidebar entry that leads here is translated.
 */
defineProps<{
  /** Navbar title. Pass an already-translated string. */
  title: string
  heading: string
  intro: string
  /** `id` must match the anchor on each section wrapper. */
  sections: Array<{ id: string, label: string }>
  /** Wider pages — the table — need more than the default reading width. */
  width?: 'default' | 'wide'
}>()
</script>

<template>
  <UDashboardPanel :id="sections[0]?.id ?? 'reference'">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UBadge label="Reference" variant="subtle" color="neutral" size="sm" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full" :class="width === 'wide' ? 'max-w-7xl' : 'max-w-5xl'">
        <!-- One place, so all seven reference pages get the trail. -->
        <AppBreadcrumb class="mb-4" />

        <div class="mb-5">
          <h2 class="font-display text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
            {{ heading }}
          </h2>
          <p class="mt-1 max-w-2xl text-sm text-muted">
            {{ intro }}
          </p>
        </div>

        <!-- The page is long by design; these keep it navigable without
             turning a reference into tabs you must click through to compare. -->
        <nav v-if="sections.length > 1" class="mb-6 flex flex-wrap gap-2" aria-label="Sections on this page">
          <a
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="rounded-full bg-elevated px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-accented hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {{ section.label }}
          </a>
        </nav>

        <div class="space-y-4">
          <slot />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
