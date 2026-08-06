<script setup lang="ts">
/**
 * The breakpoint readout below is pure CSS — each label is hidden except at
 * its own range. No resize listener, no hydration mismatch, and it stays
 * correct if the panel is resized rather than the window.
 */
const BREAKPOINTS = [
  { name: 'base', min: '0', show: 'sm:hidden' },
  { name: 'sm', min: '640px', show: 'hidden sm:inline-flex md:hidden' },
  { name: 'md', min: '768px', show: 'hidden md:inline-flex lg:hidden' },
  { name: 'lg', min: '1024px', show: 'hidden lg:inline-flex xl:hidden' },
  { name: 'xl', min: '1280px', show: 'hidden xl:inline-flex' }
]
</script>

<template>
  <PanelSection
    title="Responsive behaviour"
    description="Every layout here is written mobile-first: the base classes describe the phone, and each breakpoint prefix adds width the design has earned."
  >
    <div class="divide-y divide-default">
      <div class="pb-6">
        <h3 class="text-sm font-medium text-highlighted">
          Active breakpoint
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-muted">
          Resize the window to watch this change. Note what it does
          <em>not</em> respond to: collapsing the sidebar narrows this panel by
          about 200px and the breakpoint stays exactly where it was. Tailwind's
          <span class="font-mono text-xs">sm:</span> and
          <span class="font-mono text-xs">lg:</span> prefixes are viewport media
          queries — they know nothing about the container they sit in.
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span
            v-for="breakpoint in BREAKPOINTS"
            :key="breakpoint.name"
            class="items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary ring ring-primary/25"
            :class="breakpoint.show"
          >
            <span class="eyebrow">{{ breakpoint.name }}</span>
            <span class="tnum text-xs">≥ {{ breakpoint.min }}</span>
          </span>
        </div>
      </div>

      <GridExample
        title="One breakpoint at a time"
        description="Adding a column at every breakpoint keeps each step small. Jumping from one column straight to four leaves the tablet width looking unfinished."
        code="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <GridBlock label="1 → 2 → 3 → 4" height="sm" />
          <GridBlock label="1 → 2 → 3 → 4" height="sm" />
          <GridBlock label="1 → 2 → 3 → 4" height="sm" />
          <GridBlock label="1 → 2 → 3 → 4" height="sm" />
        </div>
      </GridExample>

      <GridExample
        title="Reordering on desktop"
        description="Put the more important block first in the markup so it comes first on a phone, then move it with order-* where there is room for both."
        code="flex flex-col gap-4 lg:flex-row"
        child-code="lg:order-2 on the block that should move right"
      >
        <div class="flex flex-col gap-4 lg:flex-row">
          <div class="flex-1 lg:order-2">
            <GridBlock label="first on mobile, right on desktop" tone="lead" />
          </div>
          <div class="flex-1 lg:order-1">
            <GridBlock label="second on mobile, left on desktop" />
          </div>
        </div>
      </GridExample>

      <GridExample
        title="Dropping a column entirely"
        description="Some panels are not worth their space on a phone. Hiding beats squeezing — but only for content that is genuinely supplementary."
        code="grid gap-4 lg:grid-cols-3"
        child-code="hidden lg:block on the optional aside"
      >
        <div class="grid gap-4 lg:grid-cols-3">
          <GridBlock label="always visible" tone="lead" class="lg:col-span-2" />
          <GridBlock label="hidden lg:block" class="hidden lg:block" />
        </div>
      </GridExample>

      <GridExample
        title="Container queries"
        description="For a component that must react to the space it is given rather than to the window — a card that appears both full-width and inside a narrow column. Mark the parent @container, then size with @md: / @2xl: instead of md: / xl:."
        code="@container"
        child-code="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-4"
      >
        <p class="mb-2 flex items-center gap-1.5 text-xs text-dimmed">
          <UIcon name="i-lucide-move-horizontal" class="size-3.5" />
          Drag the bottom-right corner to resize the container
        </p>

        <!-- `resize-x` gives the reader a real handle, so the container's width
             can be changed without touching the window. Native CSS, no JS. -->
        <div class="@container min-w-64 max-w-full resize-x overflow-auto rounded-[var(--ui-radius)] border border-dashed border-accented p-3">
          <div class="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-4">
            <GridBlock label="container-aware" height="sm" />
            <GridBlock label="container-aware" height="sm" />
            <GridBlock label="container-aware" height="sm" />
            <GridBlock label="container-aware" height="sm" />
          </div>
        </div>
      </GridExample>
    </div>
  </PanelSection>
</template>
