<script setup lang="ts">
import { formatCurrency, formatPercent } from '#shared/format'

/**
 * Donut for a three-to-five slice composition, with the total in the middle.
 *
 * Intrinsically square, so it scales from a fixed viewBox without any
 * measuring — the aspect ratio never changes.
 */
const props = defineProps<{
  slices: Array<{ label: string, value: number, color: string }>
}>()

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 78
const STROKE = 22

const total = computed(() => props.slices.reduce((sum, slice) => sum + slice.value, 0))

const circumference = 2 * Math.PI * RADIUS

/**
 * Slices are drawn as one stroked circle each, offset around the ring with
 * `stroke-dasharray`. Cheaper and crisper than arc paths, and it animates
 * for free via `stroke-dashoffset`.
 */
const arcs = computed(() => {
  let consumed = 0

  return props.slices.map((slice) => {
    const share = total.value === 0 ? 0 : slice.value / total.value
    const length = share * circumference
    // A 2px gap between slices, unless the slice is too small to afford it.
    const gap = length > 6 ? 2 : 0

    const arc = {
      ...slice,
      share,
      dash: `${Math.max(0, length - gap)} ${circumference}`,
      offset: -consumed
    }

    consumed += length
    return arc
  })
})

const active = ref<number | null>(null)

const focused = computed(() => (active.value === null ? null : arcs.value[active.value] ?? null))
</script>

<template>
  <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
    <div class="relative shrink-0">
      <svg
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        class="size-44 -rotate-90"
        role="img"
        :aria-label="`Donut chart, total ${formatCurrency(total)} across ${slices.length} plans.`"
      >
        <circle
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          fill="none"
          class="stroke-elevated"
          :stroke-width="STROKE"
        />
        <circle
          v-for="(arc, index) in arcs"
          :key="arc.label"
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          fill="none"
          :stroke="arc.color"
          :stroke-width="active === index ? STROKE + 4 : STROKE"
          :stroke-dasharray="arc.dash"
          :stroke-dashoffset="arc.offset"
          stroke-linecap="butt"
          :opacity="active === null || active === index ? 1 : 0.35"
          class="cursor-pointer transition-all duration-200"
          @pointerenter="active = index"
          @pointerleave="active = null"
        />
      </svg>

      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p class="eyebrow text-dimmed">
          {{ focused ? focused.label : 'Total MRR' }}
        </p>
        <p class="tnum text-xl font-semibold text-highlighted">
          {{ formatCurrency(focused ? focused.value : total) }}
        </p>
        <p v-if="focused" class="tnum text-xs text-muted">
          {{ formatPercent(focused.share * 100, 0) }} of plan mix
        </p>
      </div>
    </div>

    <ul class="w-full space-y-2 sm:w-44">
      <li
        v-for="(arc, index) in arcs"
        :key="arc.label"
        class="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors"
        :class="active === index ? 'bg-elevated' : ''"
        @pointerenter="active = index"
        @pointerleave="active = null"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="size-2.5 shrink-0 rounded-sm" :style="{ background: arc.color }" />
          <span class="truncate text-sm text-default">{{ arc.label }}</span>
        </span>
        <span class="tnum shrink-0 text-sm font-medium text-highlighted">
          {{ formatPercent(arc.share * 100, 0) }}
        </span>
      </li>
    </ul>
  </div>
</template>
