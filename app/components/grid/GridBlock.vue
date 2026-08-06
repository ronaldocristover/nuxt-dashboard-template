<script setup lang="ts">
/**
 * A stand-in for real content inside a layout example.
 *
 * Deliberately plain: the point of these pages is the arrangement, and a
 * block with a chart in it would pull attention away from the grid it sits in.
 * The label names the block's role so each example is still readable as a
 * layout rather than a set of grey rectangles.
 */
withDefaults(defineProps<{
  label: string
  /** `lead` marks the block a reader's eye should land on first. */
  tone?: 'lead' | 'default'
  height?: 'sm' | 'md' | 'lg'
}>(), {
  tone: 'default',
  height: 'md'
})

// Kept short on purpose: this page carries roughly twenty examples, and a
// block tall enough to look like a real card would make it unscrollable.
const HEIGHTS = {
  sm: 'min-h-12',
  md: 'min-h-16',
  lg: 'min-h-28'
}
</script>

<template>
  <div
    class="flex items-center justify-center rounded-[var(--ui-radius)] px-3 py-2 text-center"
    :class="[
      HEIGHTS[height],
      tone === 'lead'
        ? 'bg-primary/10 ring ring-primary/25 text-primary'
        : 'bg-elevated ring ring-default text-dimmed'
    ]"
  >
    <span class="eyebrow">{{ label }}</span>
  </div>
</template>
