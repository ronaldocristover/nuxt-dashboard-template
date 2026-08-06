<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.icons'), robots: 'noindex' })

const SECTIONS = [
  { id: 'browse', label: 'Find an icon' },
  { id: 'usage', label: 'Using them' },
  { id: 'context', label: 'In context' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.icons')"
    heading="Two icon sets, and the rules for using them"
    intro="Lucide covers the interface; Simple Icons covers brand marks. Both are installed and tree-shaken, so only the icons you actually reference reach the browser. Search the whole catalogue below and click any icon to copy its name."
    :sections="SECTIONS"
  >
    <div id="browse" class="scroll-mt-4">
      <IconsBrowser />
    </div>
    <div id="usage" class="scroll-mt-4">
      <IconsUsage />
    </div>
    <div id="context" class="scroll-mt-4">
      <IconsInContext />
    </div>
  </ReferenceShell>
</template>
