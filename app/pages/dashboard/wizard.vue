<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.wizard'), robots: 'noindex' })

const SECTIONS = [
  { id: 'flow', label: 'Onboarding wizard' },
  { id: 'patterns', label: 'Progress patterns' },
  { id: 'rules', label: 'Rules worth keeping' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.wizard')"
    heading="Splitting a long form into steps people finish"
    intro="A working four-step flow with per-step validation, a running total, an editable review, and a success state that replaces the form. Submit it, go back, break it — it behaves like the real thing because it is."
    :sections="SECTIONS"
  >
    <div id="flow" class="scroll-mt-4">
      <WizardOnboarding />
    </div>
    <div id="patterns" class="scroll-mt-4">
      <WizardPatterns />
    </div>
    <div id="rules" class="scroll-mt-4">
      <WizardRules />
    </div>
  </ReferenceShell>
</template>
