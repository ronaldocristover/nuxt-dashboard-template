<script setup lang="ts">
import type { Metric } from '#shared/types'

/**
 * One figure, its direction of travel, and a trend line.
 *
 * `riseIsGood` matters: churn going up is bad news and must not be painted
 * green just because the arrow points up.
 *
 * The metric arrives as a key, not a phrase — the wording lives in the
 * `metrics.*` translations so the same payload reads in any language.
 */
const props = defineProps<{
  metric: Metric
}>()

const fmt = useFormat()

const isGoodNews = computed(() => {
  if (props.metric.delta === 0) return null
  return (props.metric.delta > 0) === props.metric.riseIsGood
})

const deltaClass = computed(() => {
  if (isGoodNews.value === null) return 'text-muted'
  return isGoodNews.value ? 'text-success' : 'text-error'
})

const trendColor = computed(() => {
  if (isGoodNews.value === false) return 'var(--cadence-churn)'
  return 'var(--ui-primary)'
})
</script>

<template>
  <div class="group relative flex flex-col justify-between gap-4 rounded-[calc(var(--ui-radius)*1.5)] bg-default p-4 ring ring-default transition-shadow hover:shadow-sm sm:p-5">
    <div>
      <div class="flex items-start justify-between gap-2">
        <p class="text-xs font-medium text-muted sm:text-sm">
          {{ $t(`metrics.${metric.key}.label`) }}
        </p>
        <UTooltip :text="$t(`metrics.${metric.key}.hint`)" :delay-duration="200">
          <UIcon
            name="i-lucide-info"
            class="size-3.5 shrink-0 text-dimmed opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            tabindex="0"
            :aria-label="$t(`metrics.${metric.key}.hint`)"
          />
        </UTooltip>
      </div>

      <div class="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span class="tnum text-2xl font-semibold text-highlighted sm:text-[1.75rem]">
          {{ fmt.metric(metric.value, metric.format) }}
        </span>
        <span class="tnum inline-flex items-center gap-0.5 text-xs font-medium" :class="deltaClass">
          <UIcon
            v-if="metric.delta !== 0"
            :name="metric.delta > 0 ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-right'"
            class="size-3.5"
          />
          {{ fmt.signed(metric.delta) }}
        </span>
      </div>
      <p class="mt-1 text-xs text-dimmed">
        {{ $t('common.vsPrevious') }}
      </p>
    </div>

    <ChartsSparkline :values="metric.sparkline" :color="trendColor" />
  </div>
</template>
