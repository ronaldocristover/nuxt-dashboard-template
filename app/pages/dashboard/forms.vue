<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

useSeoMeta({ title: 'Forms', robots: 'noindex' })

/**
 * A working reference for every form control in the template, styled by the
 * same tokens as the rest of the app. Copy a row, change the label, ship it.
 */
const SECTIONS = [
  { id: 'text', label: 'Text fields' },
  { id: 'choice', label: 'Choosing from a set' },
  { id: 'structured', label: 'Values with structure' },
  { id: 'anatomy', label: 'Anatomy of a field' },
  { id: 'example', label: 'A complete form' }
]
</script>

<template>
  <UDashboardPanel id="forms">
    <template #header>
      <UDashboardNavbar title="Forms">
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
            Every control, in this template's clothes
          </h2>
          <p class="mt-1 max-w-2xl text-sm text-muted">
            Each control below is live — type in it, drag it, submit it. All of them read
            their colour, radius and typography from
            <span class="font-mono text-xs">app/assets/css/main.css</span>, so restyling
            the template restyles this page too.
          </p>
        </div>

        <!-- Jump links. The page is long by design; this keeps it navigable
             without turning a reference into a set of tabs you have to click
             through to compare. -->
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
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
