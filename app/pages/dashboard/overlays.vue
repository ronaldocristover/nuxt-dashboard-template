<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.overlays'), robots: 'noindex' })

const SECTIONS = [
  { id: 'modals', label: 'Modals' },
  { id: 'panels', label: 'Slideovers and drawers' },
  { id: 'lightweight', label: 'Lightweight overlays' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.overlays')"
    heading="Everything that appears on top"
    intro="Ordered by how much they interrupt: a modal takes the page over, a slideover keeps it visible, a toast asks for nothing at all. Each example below opens for real — the point is to feel the difference, not read about it."
    :sections="SECTIONS"
  >
    <div id="modals" class="scroll-mt-4">
      <OverlaysModals />
    </div>
    <div id="panels" class="scroll-mt-4">
      <OverlaysPanels />
    </div>
    <div id="lightweight" class="scroll-mt-4">
      <OverlaysLightweight />
    </div>
  </ReferenceShell>
</template>
