<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.table'), robots: 'noindex' })

const SECTIONS = [
  { id: 'featured', label: 'UTable' },
  { id: 'states', label: 'Every state' },
  { id: 'choosing', label: 'Which approach' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.table')"
    heading="Tables, and the two ways to build one"
    intro="A fully featured UTable driven by real API data — sortable, selectable, expandable, paginated. Then every state it can be in, and an honest comparison with the hand-built table on the Subscribers page."
    :sections="SECTIONS"
    width="wide"
  >
    <div id="featured" class="scroll-mt-4">
      <TableFeatured />
    </div>
    <div id="states" class="scroll-mt-4">
      <TableStates />
    </div>
    <div id="choosing" class="scroll-mt-4">
      <TableChoosing />
    </div>
  </ReferenceShell>
</template>
