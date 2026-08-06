<script setup lang="ts">
import type { AnalyticsResponse, RangeKey } from '#shared/types'
import { formatCurrency, formatNumber, formatPercent } from '#shared/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

useSeoMeta({ title: 'Analytics', robots: 'noindex' })

const route = useRoute()
const router = useRouter()

const RANGES: Array<{ value: RangeKey, label: string, full: string }> = [
  { value: '7d', label: '7D', full: 'Last 7 days' },
  { value: '30d', label: '30D', full: 'Last 30 days' },
  { value: '90d', label: '90D', full: 'Last 90 days' },
  { value: '12m', label: '12M', full: 'Last 12 months' }
]

function parseRange(value: unknown): RangeKey {
  return RANGES.some(range => range.value === value) ? (value as RangeKey) : '30d'
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

const activeRange = computed(() => RANGES.find(item => item.value === range.value)!)

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
    label: slice.label,
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
      <UDashboardNavbar title="Analytics">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Segmented on desktop, a select on phones — four buttons plus a
               title do not fit a 360px bar. -->
          <div class="hidden sm:block">
            <UButtonGroup size="sm">
              <UButton
                v-for="item in RANGES"
                :key="item.value"
                :label="item.label"
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
            :items="RANGES.map(item => ({ label: item.full, value: item.value }))"
            size="sm"
            class="w-36 sm:hidden"
            aria-label="Date range"
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
          title="Analytics could not be loaded"
          :description="error.statusMessage ?? 'The request did not complete.'"
          :actions="[{ label: 'Try again', variant: 'subtle', color: 'error', onClick: () => refresh() }]"
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
            title="Revenue"
            :subtitle="activeRange.full"
            :height="300"
          >
            <ChartsAreaChart
              v-if="data"
              :points="data.revenue"
              format="currency"
              :height="300"
            />
            <template #footer>
              <p class="text-xs text-dimmed">
                Hover the chart, or focus it and use the arrow keys, to read individual points.
              </p>
            </template>
          </ChartsChartFrame>

          <div class="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <ChartsChartFrame
              title="Signups against cancellations"
              subtitle="Accounts gained and lost per period"
              :height="264"
            >
              <ChartsBarChart
                v-if="data"
                :points="data.signupsVsChurn"
                primary-label="Signups"
                secondary-label="Cancelled"
                :height="264"
              />
              <template #footer>
                <div class="flex flex-wrap gap-4 text-xs text-muted">
                  <span class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-sm" style="background: var(--cadence-new)" />
                    Signups
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="size-2.5 rounded-sm" style="background: var(--cadence-churn)" />
                    Cancelled
                  </span>
                </div>
              </template>
            </ChartsChartFrame>

            <ChartsChartFrame
              title="Plan mix"
              subtitle="Share of MRR by plan"
              :height="264"
            >
              <div class="px-3 py-2">
                <ChartsDonutChart v-if="planSlices.length" :slices="planSlices" />
              </div>
            </ChartsChartFrame>
          </div>

          <div class="grid gap-4 xl:grid-cols-2 xl:gap-5">
            <!-- A ranked list beats a bar chart here: the labels are long and
                 the comparison is ordinal. -->
            <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
              <div class="border-b border-default px-4 py-3.5 sm:px-5">
                <h3 class="text-sm font-semibold text-highlighted">
                  Where signups come from
                </h3>
                <p class="mt-0.5 text-xs text-muted">
                  {{ activeRange.full }}
                </p>
              </div>

              <ul class="divide-y divide-default">
                <li v-for="channel in data?.channels ?? []" :key="channel.label" class="px-4 py-3 sm:px-5">
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="text-sm text-default">{{ channel.label }}</span>
                    <span class="tnum text-sm font-medium text-highlighted">
                      {{ formatNumber(channel.value) }}
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
                  Cohort retention
                </h3>
                <p class="mt-0.5 text-xs text-muted">
                  Share of a signup cohort still subscribed
                </p>
              </div>

              <div class="flex items-end gap-1.5 px-4 py-5 sm:px-5">
                <div
                  v-for="point in data?.retention ?? []"
                  :key="point.label"
                  class="flex flex-1 flex-col items-center gap-2"
                >
                  <span class="tnum text-[10px] font-medium text-muted">
                    {{ formatPercent(point.value, 0) }}
                  </span>
                  <div
                    class="w-full rounded-t transition-[height] duration-500"
                    :style="{
                      height: `${point.value * 1.15}px`,
                      background: `color-mix(in oklab, var(--ui-primary) ${point.value}%, var(--ui-bg-elevated))`
                    }"
                  />
                  <span class="tnum text-[10px] text-dimmed">{{ point.label }}</span>
                </div>
              </div>

              <div class="border-t border-default px-4 py-3 sm:px-5">
                <p class="text-xs text-dimmed">
                  Total MRR across all plans:
                  <span class="tnum font-medium text-muted">
                    {{ formatCurrency(planSlices.reduce((sum, slice) => sum + slice.value, 0)) }}
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
