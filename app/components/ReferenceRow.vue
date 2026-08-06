<script setup lang="ts">
/**
 * One entry in the form reference: what the control is called, when to reach
 * for it, and the control itself.
 *
 * Label and guidance sit on the left at desktop widths and stack above the
 * control on a phone, so the page reads as documentation either way.
 */
defineProps<{
  title: string
  description?: string
  /** Controls that need room — file upload, sliders — take the wider column. */
  wide?: boolean
}>()
</script>

<template>
  <div
    class="grid gap-x-8 gap-y-3 py-5 first:pt-0 last:pb-0"
    :class="wide ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'lg:grid-cols-2'"
  >
    <div class="min-w-0">
      <h3 class="text-sm font-medium text-highlighted">
        {{ title }}
      </h3>
      <p v-if="description" class="mt-1 text-sm text-muted">
        {{ description }}
      </p>
    </div>

    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
