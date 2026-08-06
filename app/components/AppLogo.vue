<script setup lang="ts">
/**
 * The mark is four bars of rising height — the same four movements the
 * waterfall breaks MRR into, and the reason the product is called Cadence.
 */
withDefaults(defineProps<{
  showWordmark?: boolean
  class?: string
}>(), {
  showWordmark: true
})

const BARS = [
  { height: 8, opacity: 0.45 },
  { height: 12, opacity: 0.65 },
  { height: 17, opacity: 0.82 },
  { height: 22, opacity: 1 }
]
</script>

<template>
  <span class="inline-flex items-center gap-2.5" :class="$props.class">
    <svg
      viewBox="0 0 28 28"
      class="size-7 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="0"
        y="0"
        width="28"
        height="28"
        rx="7"
        fill="var(--ui-primary)"
      />
      <g>
        <rect
          v-for="(bar, index) in BARS"
          :key="index"
          :x="5 + index * 5"
          :y="22 - bar.height"
          width="3"
          :height="bar.height"
          rx="1.5"
          fill="white"
          :opacity="bar.opacity"
        />
      </g>
    </svg>
    <span v-if="showWordmark" class="font-display text-lg font-semibold tracking-tight text-highlighted">
      Cadence
    </span>
    <span class="sr-only">Cadence</span>
  </span>
</template>
