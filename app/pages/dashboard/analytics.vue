<script setup lang="ts">
import type { AnalyticsResponse, RangeKey } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const fmt = useFormat()

useSeoMeta({ title: () => t('analytics.title'), robots: 'noindex' })

const RANGE_KEYS: RangeKey[] = ['7d', '30d', '90d', '12m']

function parseRange(value: unknown): RangeKey {
  return RANGE_KEYS.includes(value as RangeKey) ? (value as RangeKey) : '30d'
}

const range = ref<RangeKey>(parseRange(route.query.range))

/** The range lives in the URL so a view can be shared or bookmarked. */
watch(range, (value) => {
  router.replace({ query: { ...route.query, range: value } })
})

const { data, status, error, refresh } = await useApiFetch<AnalyticsResponse>(
  () => `/api/metrics/analytics?range=${range.value}`,
  { watch: [range] }
)

const pending = computed(() => status.value === 'pending')

const rangeItems = computed(() =>
  RANGE_KEYS.map(key => ({
    value: key,
    short: t(`analytics.ranges.${key}.short`),
    full: t(`analytics.ranges.${key}.full`)
  }))
)

const activeRangeLabel = computed(() => t(`analytics.ranges.${range.value}.full`))

/**
 * Plans are ordinal — Starter, Growth, Scale climb in size — so they get a
 * sequential ramp of the brand colour rather than the movement palette.
 * Reusing the movement colours here would say amber means contraction in one
 * chart and Scale in the next.
 */
const PLAN_COLORS: Record<string, string> = {
  starter: 'var(--color-cobalt-300)',
  growth: 'var(--color-cobalt-500)',
  scale: 'var(--color-cobalt-700)'
}

const planSlices = computed(() =>
  (data.value?.planMix ?? []).map(slice => ({
    label: t(`plans.${slice.plan}`),
    value: slice.value,
    color: PLAN_COLORS[slice.plan] ?? 'var(--ui-primary)'
  }))
)

const channelMax = computed(() =>
  Math.max(...(data.value?.channels ?? []).map(channel => channel.value), 1)
)
</script>

<template>
  <UDashboardPanel id="analytics">
    <template #header>
      <UDashboardNavbar :title="$t('analytics.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Segmented on desktop, a select on phones — four buttons plus a
               title do not fit a 360px bar. -->
          <div class="hidden sm:block">
            <UButtonGroup size="sm">
              <UButton
                v-for="item in rangeItems"
                :key="item.value"
                :label="item.short"
                :color="range === item.value ? 'primary' : 'neutral'"
                :variant="range === item.value ? 'solid' : 'outline'"
                :aria-pressed="range === item.value"
                :aria-label="item.full"
                @click="range = item.value"
              />
            </UButtonGroup>
          </div>
          <USelect
            v-model="range"
            :items="rangeItems.map(item => ({ label: item.full, value: item.value }))"
            size="sm"
            class="w-36 sm:hidden"
            :aria-label="$t('analytics.range')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4 sm:space-y-5">
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="$t('analytics.loadFailed')"
          :description="$t('analytics.loadFailedBody')"
          :actions="[{ label: $t('common.retry'), variant: 'subtle', color: 'error', onClick: () => refresh() }]"
        />

        <template v-else>
          <div class="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <template v-if="pending">
              <StatCardSkeleton v-for="i in 4" :key="i" />
            </template>
            <StatCard
              v-for="metric in data?.metrics ?? []"
              v-else
              :key="metric.key"
              :metric="metric"
            />
          </div>

          <ChartsChartFrame
            :title="$t('analytics.revenue')"
            :subtitle="activeRangeLabel"
            :height="300"
          >
            <ChartsAreaChart
              v-if="data"
              :points="data.revenue"
              :granularity="data.granularity"
              format="currency"
              :height="300"
            />
            <template #footer>
              <p class="text-xs text-dimmed">
                {{ $t('analytics.chartHint') }}
              </p>
            </template>
          </ChartsChartFrame>

          <div class="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <ChartsChartFrame
              :title="$t('analytics.signupsTitle')"
              :subtitle="$t('analytics.signupsSub')"
              :height="264"
            >
              <ChartsBarChart
                v-if="data"
                :points="data.signupsVsChurn"
                :granularity="data.signupsGranularity"
                :primary-label="$t('analytics.signupsLegend')"
                :secondary-label="$t('analytics.cancelledLegend')"
                :height="264"
              />
              <template #footer>
                <div class="flex flex-wrap gap-4 text-xs text-muted">
                  <span class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-sm" style="background: var(--cadence-new)" />
                    {{ $t('analytics.signupsLegend') }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-sm" style="background: var(--cadence-churn)" />
                    {{ $t('analytics.cancelledLegend') }}
                  </span>
                </div>
              </template>
            </ChartsChartFrame>

            <ChartsChartFrame
              :title="$t('analytics.planMix')"
              :subtitle="$t('analytics.planMixSub')"
              :height="264"
            >
              <div class="px-3 py-2">
                <ChartsDonutChart
                  v-if="planSlices.length"
                  :slices="planSlices"
                  :total-label="$t('analytics.totalMrr')"
                />
              </div>
            </ChartsChartFrame>
          </div>

          <div class="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <!-- A ranked list beats a bar chart here: the labels are long and
                 the comparison is ordinal. -->
            <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
              <div class="border-b border-default px-4 py-3.5 sm:px-5">
                <h3 class="text-sm font-semibold text-highlighted">
                  {{ $t('analytics.channelsTitle') }}
                </h3>
                <p class="mt-0.5 text-xs text-muted">
                  {{ activeRangeLabel }}
                </p>
              </div>

              <ul class="divide-y divide-default">
                <li v-for="channel in data?.channels ?? []" :key="channel.key" class="px-4 py-3 sm:px-5">
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="text-sm text-default">{{ $t(`channels.${channel.key}`) }}</span>
                    <span class="tnum text-sm font-medium text-highlighted">
                      {{ fmt.number(channel.value) }}
                    </span>
                  </div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      class="h-full rounded-full transition-[width] duration-500"
                      :style="{
                        width: `${(channel.value / channelMax) * 100}%`,
                        background: 'var(--ui-primary)'
                      }"
                    />
                  </div>
                </li>
              </ul>
            </div>

            <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
              <div class="border-b border-default px-4 py-3.5 sm:px-5">
                <h3 class="text-sm font-semibold text-highlighted">
                  {{ $t('analytics.retentionTitle') }}
                </h3>
                <p class="mt-0.5 text-xs text-muted">
                  {{ $t('analytics.retentionSub') }}
                </p>
              </div>

              <div class="flex items-end gap-1.5 px-4 py-5 sm:px-5">
                <div
                  v-for="point in data?.retention ?? []"
                  :key="point.month"
                  class="flex flex-1 flex-col items-center gap-2"
                >
                  <span class="tnum text-[10px] font-medium text-muted">
                    {{ fmt.percent(point.value, 0) }}
                  </span>
                  <div
                    class="w-full rounded-t transition-[height] duration-500"
                    :style="{
                      height: `${point.value * 1.15}px`,
                      background: `color-mix(in oklab, var(--ui-primary) ${point.value}%, var(--ui-bg-elevated))`
                    }"
                  />
                  <span class="tnum text-[10px] text-dimmed">
                    {{ $t('charts.cohortMonth', { n: point.month }) }}
                  </span>
                </div>
              </div>

              <div class="border-t border-default px-4 py-3 sm:px-5">
                <p class="text-xs text-dimmed">
                  {{ $t('analytics.totalAcrossPlans') }}
                  <span class="tnum font-medium text-muted">
                    {{ fmt.currency(planSlices.reduce((sum, slice) => sum + slice.value, 0)) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
