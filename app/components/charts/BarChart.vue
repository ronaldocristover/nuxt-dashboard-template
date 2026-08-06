<script setup lang="ts">
import type { DualSeriesPoint } from '#shared/types'
import { formatNumber } from '#shared/format'
import { niceTicks, thinLabels } from '~/utils/chart'

/**
 * Grouped bars for two series that are read against each other — signups
 * against cancellations. Grouped rather than stacked, because the comparison
 * is the point and stacking hides it.
 */
const props = withDefaults(defineProps<{
  points: DualSeriesPoint[]
  primaryLabel: string
  secondaryLabel: string
  height?: number
}>(), {
  height: 260
})

const { el, width } = useElementWidth()

const PAD = { top: 12, right: 10, bottom: 26, left: 40 }

const plot = computed(() => ({
  width: Math.max(80, width.value - PAD.left - PAD.right),
  height: Math.max(60, props.height - PAD.top - PAD.bottom)
}))

const ticks = computed(() => {
  const max = Math.max(...props.points.flatMap(point => [point.primary, point.secondary]), 1)
  return niceTicks(0, max, 4)
})

const top = computed(() => ticks.value[ticks.value.length - 1] || 1)

function yAt(value: number): number {
  return PAD.top + plot.value.height - (value / top.value) * plot.value.height
}

function heightOf(value: number): number {
  return Math.max(value > 0 ? 2 : 0, (value / top.value) * plot.value.height)
}

/** Each group gets a slot; the two bars share it with a 2px gap. */
const geometry = computed(() => {
  const slot = plot.value.width / Math.max(1, props.points.length)
  const groupWidth = Math.min(44, slot * 0.62)
  const barWidth = Math.max(3, (groupWidth - 2) / 2)
  return { slot, groupWidth, barWidth }
})

function groupX(index: number): number {
  const { slot, groupWidth } = geometry.value
  return PAD.left + index * slot + (slot - groupWidth) / 2
}

const visibleLabels = computed(() => {
  const max = Math.max(2, Math.floor(plot.value.width / 48))
  return new Set(thinLabels(props.points.length, max))
})

const active = ref<number | null>(null)

const activePoint = computed(() => (active.value === null ? null : props.points[active.value] ?? null))

const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const { slot } = geometry.value
  const x = PAD.left + active.value * slot + slot / 2
  const flip = x > width.value - 110
  return {
    left: `${x}px`,
    transform: flip ? 'translate(-100%, 0)' : 'translate(-50%, 0)'
  }
})

const summary = computed(() =>
  `Grouped bar chart comparing ${props.primaryLabel} and ${props.secondaryLabel} across ${props.points.length} periods.`
)
</script>

<template>
  <div ref="el" class="relative w-full">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="summary"
      class="block"
      @pointerleave="active = null"
    >
      <g>
        <template v-for="tick in ticks" :key="tick">
          <line
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="yAt(tick)"
            :y2="yAt(tick)"
            class="stroke-default"
            stroke-width="1"
            :stroke-dasharray="tick === 0 ? undefined : '2 4'"
          />
          <text
            :x="PAD.left - 8"
            :y="yAt(tick)"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-dimmed text-[10px] tnum"
          >
            {{ formatNumber(tick) }}
          </text>
        </template>
      </g>

      <g v-for="(point, index) in points" :key="point.label">
        <!-- A full-height hit area, so hovering anywhere in the column works. -->
        <rect
          :x="PAD.left + index * geometry.slot"
          :y="PAD.top"
          :width="geometry.slot"
          :height="plot.height"
          fill="transparent"
          @pointerenter="active = index"
        />
        <rect
          :x="groupX(index)"
          :y="yAt(point.primary)"
          :width="geometry.barWidth"
          :height="heightOf(point.primary)"
          rx="2"
          style="fill: var(--cadence-new)"
          :opacity="active === null || active === index ? 1 : 0.35"
          class="transition-opacity duration-150"
        />
        <rect
          :x="groupX(index) + geometry.barWidth + 2"
          :y="yAt(point.secondary)"
          :width="geometry.barWidth"
          :height="heightOf(point.secondary)"
          rx="2"
          style="fill: var(--cadence-churn)"
          :opacity="active === null || active === index ? 1 : 0.35"
          class="transition-opacity duration-150"
        />
        <text
          v-show="visibleLabels.has(index)"
          :x="PAD.left + index * geometry.slot + geometry.slot / 2"
          :y="height - 6"
          text-anchor="middle"
          class="fill-dimmed text-[10px]"
        >
          {{ point.label }}
        </text>
      </g>
    </svg>

    <div
      v-if="activePoint"
      class="pointer-events-none absolute top-2 z-10 min-w-32 rounded-md bg-inverted px-2.5 py-2 shadow-lg"
      :style="tooltipStyle"
    >
      <p class="text-[10px] uppercase tracking-wide text-inverted/70">
        {{ activePoint.label }}
      </p>
      <div class="mt-1 space-y-0.5">
        <p class="flex items-center justify-between gap-3 text-xs text-inverted">
          <span class="flex items-center gap-1.5">
            <span class="size-2 rounded-full" style="background: var(--cadence-new)" />
            {{ primaryLabel }}
          </span>
          <span class="tnum font-semibold">{{ formatNumber(activePoint.primary) }}</span>
        </p>
        <p class="flex items-center justify-between gap-3 text-xs text-inverted">
          <span class="flex items-center gap-1.5">
            <span class="size-2 rounded-full" style="background: var(--cadence-churn)" />
            {{ secondaryLabel }}
          </span>
          <span class="tnum font-semibold">{{ formatNumber(activePoint.secondary) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
