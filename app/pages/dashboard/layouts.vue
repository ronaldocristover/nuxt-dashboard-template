<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

useSeoMeta({ title: 'Layouts', robots: 'noindex' })

/**
 * A working reference for the grid patterns the rest of the template is built
 * from. Every example shows the classes that produce it, so a new page can be
 * assembled by copying rows rather than by guessing at column counts.
 */
const SECTIONS = [
  { id: 'one', label: 'One column' },
  { id: 'two', label: 'Two columns' },
  { id: 'multi', label: 'Three and more' },
  { id: 'combined', label: 'Combinations' },
  { id: 'responsive', label: 'Responsive' }
]
</script>

<template>
  <UDashboardPanel id="layouts">
    <template #header>
      <UDashboardNavbar title="Layouts">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UBadge label="Reference" variant="subtle" color="neutral" size="sm" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-5xl">
        <div class="mb-5">
          <h2 class="font-display text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
            Grids, and when each one earns its place
          </h2>
          <p class="mt-1 max-w-2xl text-sm text-muted">
            Every example below is live, and each one shows the exact classes that
            produce it. Narrow the window to watch them fold down — they follow the
            viewport, not this panel, which is a distinction the last section covers.
          </p>
        </div>

        <nav class="mb-6 flex flex-wrap gap-2" aria-label="Sections on this page">
          <a
            v-for="section in SECTIONS"
            :key="section.id"
            :href="`#${section.id}`"
            class="rounded-full bg-elevated px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-accented hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {{ section.label }}
          </a>
        </nav>

        <div class="space-y-4">
          <div id="one" class="scroll-mt-4">
            <GridSingle />
          </div>
          <div id="two" class="scroll-mt-4">
            <GridTwo />
          </div>
          <div id="multi" class="scroll-mt-4">
            <GridMulti />
          </div>
          <div id="combined" class="scroll-mt-4">
            <GridCombined />
          </div>
          <div id="responsive" class="scroll-mt-4">
            <GridResponsive />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
