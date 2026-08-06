<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()

useSeoMeta({ title: () => t('nav.forms'), robots: 'noindex' })

const SECTIONS = [
  { id: 'text', label: 'Text fields' },
  { id: 'choice', label: 'Choosing from a set' },
  { id: 'structured', label: 'Values with structure' },
  { id: 'anatomy', label: 'Anatomy of a field' },
  { id: 'example', label: 'A complete form' }
]
</script>

<template>
  <ReferenceShell
    :title="$t('nav.forms')"
    heading="Every control, in this template's clothes"
    intro="Each control below is live — type in it, drag it, submit it. All of them read their colour, radius and typography from app/assets/css/main.css, so restyling the template restyles this page too."
    :sections="SECTIONS"
  >
    <div id="text" class="scroll-mt-4">
      <FormsText />
    </div>
    <div id="choice" class="scroll-mt-4">
      <FormsChoice />
    </div>
    <div id="structured" class="scroll-mt-4">
      <FormsSpecialised />
    </div>
    <div id="anatomy" class="scroll-mt-4">
      <FormsAnatomy />
    </div>
    <div id="example" class="scroll-mt-4">
      <FormsExample />
    </div>
  </ReferenceShell>
</template>
