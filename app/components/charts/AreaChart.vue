<script setup lang="ts">
import type { Granularity, SeriesPoint } from '#shared/types'
import { monotonePath, niceTicks, thinLabels } from '~/utils/chart'

const props = withDefaults(defineProps<{
  points: SeriesPoint[]
  /** How to word the x-axis ticks. */
  granularity?: Granularity
  format?: 'currency' | 'number' | 'percent'
  height?: number
  /** Any CSS colour. Defaults to the brand accent. */
  color?: string
}>(), {
  granularity: 'month',
  format: 'currency',
  height: 260,
  color: 'var(--ui-primary)'
})

const { t } = useI18n()
const fmt = useFormat()

/** The printed x-axis label for a point. */
function pointLabel(point: SeriesPoint): string {
  return fmt.value.axis(point.at, props.granularity)
}

const { el, width } = useElementWidth()

/** Left gutter widens for long currency ticks so labels never clip. */
const PAD = computed(() => ({
  top: 12,
  right: 10,
  bottom: 26,
  left: props.format === 'currency' ? 52 : 40
}))

const plot = computed(() => ({
  width: Math.max(80, width.value - PAD.value.left - PAD.value.right),
  height: Math.max(60, props.height - PAD.value.top - PAD.value.bottom)
}))

const values = computed(() => props.points.map(point => point.value))

const ticks = computed(() => {
  const max = Math.max(...values.value, 0)
  const min = Math.min(...values.value, 0)
  // Percentages get a tight domain; money is always read against zero.
  const floor = props.format === 'percent' ? Math.min(...values.value) : Math.min(0, min)
  return niceTicks(floor, max, 4)
})

const domain = computed(() => {
  const low = ticks.value[0] ?? 0
  const high = ticks.value[ticks.value.length - 1] ?? 1
  return { low, high, span: high - low || 1 }
})

function xAt(index: number): number {
  const steps = Math.max(1, props.points.length - 1)
  return PAD.value.left + (index / steps) * plot.value.width
}

function yAt(value: number): number {
  const ratio = (value - domain.value.low) / domain.value.span
  return PAD.value.top + plot.value.height - ratio * plot.value.height
}

const coords = computed(() => props.points.map((point, index) => ({
  x: xAt(index),
  y: yAt(point.value)
})))

const linePath = computed(() => monotonePath(coords.value))

const areaPath = computed(() => {
  if (coords.value.length === 0) return ''
  const baseline = yAt(Math.max(domain.value.low, 0))
  const first = coords.value[0]!
  const last = coords.value[coords.value.length - 1]!
  return `${linePath.value} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
})

const visibleLabels = computed(() => {
  // Roughly 64px per label before they start colliding.
  const max = Math.max(2, Math.floor(plot.value.width / 64))
  return new Set(thinLabels(props.points.length, max))
})

/**
 * The first and last labels sit on the plot edges, so centring them pushes
 * half the text outside the chart. Anchor them inward instead.
 */
function labelAnchor(index: number): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start'
  if (index === props.points.length - 1) return 'end'
  return 'middle'
}

function tickLabel(value: number): string {
  if (props.format === 'currency') return fmt.value.currencyCompact(value)
  if (props.format === 'percent') return fmt.value.percent(value, 0)
  return fmt.value.number(value)
}

// --- Interaction --------------------------------------------------------------

const active = ref<number | null>(null)

function nearestIndex(clientX: number, target: SVGSVGElement): number {
  const box = target.getBoundingClientRect()
  const x = clientX - box.left
  const steps = Math.max(1, props.points.length - 1)
  const ratio = (x - PAD.value.left) / plot.value.width
  return Math.min(props.points.length - 1, Math.max(0, Math.round(ratio * steps)))
}

function onPointerMove(event: PointerEvent) {
  active.value = nearestIndex(event.clientX, event.currentTarget as SVGSVGElement)
}

function onKeydown(event: KeyboardEvent) {
  if (props.points.length === 0) return

  const current = active.value ?? props.points.length - 1

  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    const next = event.key === 'ArrowRight' ? current + 1 : current - 1
    active.value = Math.min(props.points.length - 1, Math.max(0, next))
  } else if (event.key === 'Home') {
    event.preventDefault()
    active.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    active.value = props.points.length - 1
  } else if (event.key === 'Escape') {
    active.value = null
  }
}

const activePoint = computed(() => (active.value === null ? null : props.points[active.value] ?? null))

/** Flips the tooltip to the left of the cursor near the right edge. */
const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const x = xAt(active.value)
  const flip = x > width.value - 96
  return {
    left: `${x}px`,
    transform: flip ? 'translate(-100%, 0)' : 'translate(-50%, 0)',
    marginLeft: flip ? '-8px' : '0'
  }
})

const summary = computed(() => {
  if (props.points.length === 0) return t('charts.noData')
  const first = props.points[0]!
  const last = props.points[props.points.length - 1]!
  return t('charts.lineSummary', {
    count: props.points.length,
    first: pointLabel(first),
    firstValue: fmt.value.metric(first.value, props.format),
    last: pointLabel(last),
    lastValue: fmt.value.metric(last.value, props.format)
  })
})

const gradientId = useId()
</script>

<template>
  <div ref="el" class="relative w-full">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      tabindex="0"
      :aria-label="summary"
      class="block touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-default"
      @pointermove="onPointerMove"
      @pointerleave="active = null"
      @keydown="onKeydown"
      @blur="active = null"
    >
      <defs>
        <linearGradient
          :id="gradientId"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" :stop-color="color" stop-opacity="0.22" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Gridlines double as the y-axis: the label sits on the line. -->
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
            fill="currentColor"
            class="tnum text-[10px] text-dimmed"
          >
            {{ tickLabel(tick) }}
          </text>
        </template>
      </g>

      <path v-if="areaPath" :d="areaPath" :fill="`url(#${gradientId})`" />

      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <g>
        <text
          v-for="(point, index) in points"
          v-show="visibleLabels.has(index)"
          :key="point.at"
          :x="xAt(index)"
          :y="height - 6"
          :text-anchor="labelAnchor(index)"
          fill="currentColor"
          class="text-[10px] text-dimmed"
        >
          {{ pointLabel(point) }}
        </text>
      </g>

      <g v-if="active !== null && activePoint">
        <line
          :x1="xAt(active)"
          :x2="xAt(active)"
          :y1="PAD.top"
          :y2="PAD.top + plot.height"
          :stroke="color"
          stroke-width="1"
          stroke-dasharray="3 3"
          opacity="0.5"
        />
        <circle
          :cx="xAt(active)"
          :cy="yAt(activePoint.value)"
          r="5"
          :fill="color"
          class="stroke-default"
          stroke-width="2.5"
        />
      </g>
    </svg>

    <div
      v-if="active !== null && activePoint"
      class="pointer-events-none absolute top-2 z-10 rounded-md bg-inverted px-2.5 py-1.5 shadow-lg"
      :style="tooltipStyle"
    >
      <p class="text-[10px] uppercase tracking-wide text-inverted/70">
        {{ pointLabel(activePoint) }}
      </p>
      <p class="tnum text-sm font-semibold text-inverted">
        {{ fmt.metric(activePoint.value, format) }}
      </p>
    </div>
  </div>
</template>
