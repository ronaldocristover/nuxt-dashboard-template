<script setup lang="ts">
const SIZES = [
  { cls: 'size-3', label: 'size-3' },
  { cls: 'size-4', label: 'size-4' },
  { cls: 'size-5', label: 'size-5' },
  { cls: 'size-6', label: 'size-6' },
  { cls: 'size-8', label: 'size-8' }
]

const TONES = [
  { cls: 'text-dimmed', label: 'text-dimmed' },
  { cls: 'text-muted', label: 'text-muted' },
  { cls: 'text-default', label: 'text-default' },
  { cls: 'text-highlighted', label: 'text-highlighted' },
  { cls: 'text-primary', label: 'text-primary' },
  { cls: 'text-success', label: 'text-success' },
  { cls: 'text-warning', label: 'text-warning' },
  { cls: 'text-error', label: 'text-error' }
]

const loading = ref(false)

function simulate() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1600)
}
</script>

<template>
  <PanelSection
    title="Using them"
    description="An icon inherits the current text colour and is sized by class, never by a prop. That is what lets one icon component sit inside a button, a badge or a paragraph and always look right."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Sizes" description="size-4 inside text, size-5 in buttons and list rows, size-8 and up only for empty states.">
        <div class="flex flex-wrap items-end gap-5">
          <div v-for="size in SIZES" :key="size.label" class="flex flex-col items-center gap-1.5">
            <UIcon name="i-lucide-chart-line" :class="size.cls" class="text-primary" />
            <span class="font-mono text-[10px] text-dimmed">{{ size.label }}</span>
          </div>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Colour" description="Icons take currentColor, so a text utility is all you need. Never hard-code a hex on an icon — it will not follow the theme." wide>
        <div class="flex flex-wrap gap-4">
          <div v-for="tone in TONES" :key="tone.label" class="flex flex-col items-center gap-1.5">
            <UIcon name="i-lucide-circle-alert" class="size-5" :class="tone.cls" />
            <span class="font-mono text-[10px] text-dimmed">{{ tone.label }}</span>
          </div>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Inside a button" description="Pass icon, leading-icon or trailing-icon rather than nesting one — the button then handles spacing and size for you.">
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-plus" label="Add account" />
          <UButton trailing-icon="i-lucide-arrow-right" label="Continue" variant="subtle" />
          <UButton icon="i-lucide-settings" color="neutral" variant="ghost" aria-label="Settings" />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Icon-only buttons need a label" description="An icon has no accessible name. Without aria-label a screen reader announces “button” and nothing else.">
        <div class="flex flex-wrap items-center gap-3">
          <UButton icon="i-lucide-trash-2" color="error" variant="subtle" aria-label="Delete account" />
          <code class="rounded bg-elevated px-2 py-1 font-mono text-xs text-muted">aria-label="Delete account"</code>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Motion" description="Spin belongs on something that is genuinely working. A permanently spinning icon reads as a stuck page.">
        <div class="flex flex-wrap items-center gap-3">
          <UButton
            :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
            :ui="{ leadingIcon: loading ? 'animate-spin' : '' }"
            label="Refresh"
            variant="subtle"
            :disabled="loading"
            @click="simulate"
          />
          <UButton label="Save" :loading="loading" @click="simulate" />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Decorative or meaningful" description="An icon beside a label repeats it, so hide it from assistive tech. An icon that IS the message needs a text alternative.">
        <div class="space-y-3">
          <p class="flex items-center gap-2 text-sm text-default">
            <UIcon name="i-lucide-mail" class="size-4 text-dimmed" aria-hidden="true" />
            Decorative — the word beside it already says “email”
          </p>
          <p class="flex items-center gap-2 text-sm text-default">
            <UIcon name="i-lucide-circle-check" class="size-4 text-success" role="img" aria-label="Paid" />
            Meaningful — this tick is the only thing saying “paid”
          </p>
        </div>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
