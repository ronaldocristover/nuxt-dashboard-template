<script setup lang="ts">
import type { OverviewResponse } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const { user } = useAuth()
const { notify } = useApiError()
const fmt = useFormat()

useSeoMeta({ title: () => t('nav.overview'), robots: 'noindex' })

const { data, status, error, refresh } = await useApiFetch<OverviewResponse>('/api/metrics/overview')

const pending = computed(() => status.value === 'pending')

const refreshing = ref(false)

async function onRefresh() {
  refreshing.value = true
  try {
    await refresh()
  } catch (cause) {
    notify(cause, t('overview.refreshFailed'))
  } finally {
    refreshing.value = false
  }
}

const INVOICE_COLOR = {
  paid: 'success',
  open: 'neutral',
  failed: 'error'
} as const

/** Greets by first name only — a dashboard is not a formal letter. */
const firstName = computed(() => user.value?.name?.split(' ')[0] ?? '')
</script>

<template>
  <UDashboardPanel id="overview">
    <template #header>
      <UDashboardNavbar :title="$t('nav.overview')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="refreshing"
            :aria-label="$t('overview.refresh')"
            @click="onRefresh"
          />
          <UButton
            to="/dashboard/analytics"
            :label="$t('nav.analytics')"
            trailing-icon="i-lucide-arrow-right"
            size="sm"
            class="hidden sm:inline-flex"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4 sm:space-y-5">
        <div>
          <h2 class="font-display text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
            {{ $t('overview.greeting', { name: firstName }) }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ $t('overview.subtitle') }}
          </p>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="$t('overview.loadFailed')"
          :description="$t('overview.loadFailedBody')"
          :actions="[{ label: $t('common.retry'), variant: 'subtle', color: 'error', onClick: onRefresh }]"
        />

        <template v-else>
          <!-- Four figures, then the movement behind the first one. -->
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

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-5">
            <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default p-4 ring ring-default sm:p-5">
              <div v-if="pending" class="animate-pulse space-y-4">
                <div class="h-4 w-40 rounded bg-elevated" />
                <div class="h-9 w-48 rounded bg-elevated" />
                <div class="h-11 w-full rounded bg-elevated" />
                <div class="h-12 w-full rounded bg-elevated" />
              </div>
              <MrrWaterfall v-else-if="data" :movement="data.movement" />
            </div>

            <ChartsChartFrame
              :title="$t('overview.mrrChart')"
              :subtitle="$t('overview.mrrChartSub')"
              :height="248"
            >
              <ChartsAreaChart
                v-if="data"
                :points="data.mrrSeries"
                granularity="month"
                format="currency"
                :height="248"
              />
            </ChartsChartFrame>
          </div>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:gap-5">
            <ActivityFeed
              :events="data?.activity ?? []"
              :generated-at="data?.generatedAt"
              :loading="pending"
            />

            <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
              <div class="flex items-center justify-between gap-3 border-b border-default px-4 py-3.5 sm:px-5">
                <h3 class="text-sm font-semibold text-highlighted">
                  {{ $t('overview.invoices') }}
                </h3>
                <UBadge
                  v-if="data?.invoices.some(invoice => invoice.status === 'failed')"
                  :label="$t('overview.paymentFailed')"
                  color="error"
                  variant="subtle"
                  size="sm"
                />
              </div>

              <div v-if="pending" class="space-y-3 p-4 sm:p-5">
                <div v-for="row in 5" :key="row" class="h-8 animate-pulse rounded bg-elevated" />
              </div>

              <ul v-else class="divide-y divide-default">
                <li
                  v-for="invoice in data?.invoices ?? []"
                  :key="invoice.id"
                  class="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-highlighted">
                      {{ invoice.subscriber }}
                    </p>
                    <p class="tnum mt-0.5 text-xs text-dimmed">
                      {{ invoice.number }} · {{ fmt.date(invoice.issuedAt) }}
                    </p>
                  </div>
                  <span class="tnum shrink-0 text-sm text-default">
                    {{ fmt.currencyExact(invoice.amount) }}
                  </span>
                  <UBadge
                    :label="$t(`status.${invoice.status}`)"
                    :color="INVOICE_COLOR[invoice.status]"
                    variant="subtle"
                    size="sm"
                    class="shrink-0"
                  />
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
