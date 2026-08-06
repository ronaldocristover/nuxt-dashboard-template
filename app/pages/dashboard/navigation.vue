<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.navigation'), robots: 'noindex' })

const SECTIONS = [
  { id: 'tree', label: 'A three-level tree' },
  { id: 'shape', label: 'The item shape' },
  { id: 'rules', label: 'Rules for nesting' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.navigation')"
    heading="Nested sidebar navigation, three levels deep"
    intro="The same tree is live in the sidebar under “Sample tree”. Open a group, then a section, to reach the links. Three levels is the ceiling, and the last section explains why."
    :sections="SECTIONS"
  >
    <div id="tree" class="scroll-mt-4">
      <NavigationTree />
    </div>
    <div id="shape" class="scroll-mt-4">
      <NavigationShape />
    </div>
    <div id="rules" class="scroll-mt-4">
      <NavigationRules />
    </div>
  </ReferenceShell>
</template>
