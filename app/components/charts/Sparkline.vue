<script setup lang="ts">
import { monotonePath } from '~/utils/chart'

/**
 * A trend, not a chart: no axes, no labels, no interaction. It sits inside a
 * stat card to answer "which way has this been going" and nothing more.
 *
 * Uniform viewBox scaling is fine here — there is no text to shrink.
 */
const props = withDefaults(defineProps<{
  values: number[]
  color?: string
  height?: number
}>(), {
  color: 'var(--ui-primary)',
  height: 36
})

const WIDTH = 120

const path = computed(() => {
  if (props.values.length < 2) return ''

  const min = Math.min(...props.values)
  const max = Math.max(...props.values)
  const span = max - min || 1
  // Inset both axes by half the stroke so the first and last points are not
  // sliced in half by the viewBox edge.
  const inset = 3

  return monotonePath(props.values.map((value, index) => ({
    x: inset + (index / (props.values.length - 1)) * (WIDTH - inset * 2),
    y: inset + (1 - (value - min) / span) * (props.height - inset * 2)
  })))
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${WIDTH} ${height}`"
    preserveAspectRatio="none"
    class="h-9 w-full"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="path"
      :d="path"
      fill="none"
      :stroke="color"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
