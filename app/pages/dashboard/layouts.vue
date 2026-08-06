<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.layouts'), robots: 'noindex' })

const SECTIONS = [
  { id: 'one', label: 'One column' },
  { id: 'two', label: 'Two columns' },
  { id: 'multi', label: 'Three and more' },
  { id: 'combined', label: 'Combinations' },
  { id: 'responsive', label: 'Responsive' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.layouts')"
    heading="Grids, and when each one earns its place"
    intro="Every example below is live, and each one shows the exact classes that produce it. Narrow the window to watch them fold down — they follow the viewport, not this panel, which is a distinction the last section covers."
    :sections="SECTIONS"
  >
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
  </ReferenceShell>
</template>
