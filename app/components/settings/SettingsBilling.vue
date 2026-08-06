<script setup lang="ts">
const fmt = useFormat()

/**
 * Billing is presentational in the template — connecting a payment provider is
 * the buyer's decision. The shapes here match what Stripe's subscription and
 * invoice objects give you, so swapping in real data is a mapping job.
 */
const SEATS_USED = 18
const SEATS_INCLUDED = 25
const PER_SEAT = 29

const renewsOn = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1, 1)
  return date.toISOString()
})

const monthlyTotal = computed(() => SEATS_USED * PER_SEAT)

const seatUsage = computed(() => (SEATS_USED / SEATS_INCLUDED) * 100)

const cardExpiry = '2029-04-01'

const history = [
  { number: 'CAD-2026-0412', amount: 522, at: '2026-07-01' },
  { number: 'CAD-2026-0361', amount: 522, at: '2026-06-01' },
  { number: 'CAD-2026-0309', amount: 493, at: '2026-05-01' },
  { number: 'CAD-2026-0258', amount: 464, at: '2026-04-01' }
]
</script>

<template>
  <div class="space-y-4">
    <PanelSection
      :title="$t('settings.billing.planTitle')"
      :description="$t('settings.billing.planDescription')"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-display text-2xl font-semibold text-highlighted">{{ $t('plans.growth') }}</span>
            <UBadge :label="$t('status.active')" color="success" variant="subtle" size="sm" />
          </div>
          <p class="tnum mt-1.5 text-sm text-muted">
            {{ $t('settings.billing.perMonth', { amount: fmt.currency(monthlyTotal), date: fmt.date(renewsOn) }) }}
          </p>
        </div>

        <div class="flex gap-2">
          <UButton :label="$t('settings.billing.changePlan')" variant="subtle" />
          <UButton :label="$t('settings.billing.cancel')" color="neutral" variant="ghost" />
        </div>
      </div>

      <div class="mt-6 border-t border-default pt-5">
        <div class="flex items-baseline justify-between gap-3">
          <p class="text-sm font-medium text-highlighted">
            {{ $t('settings.billing.seatsInUse') }}
          </p>
          <p class="tnum text-sm text-muted">
            {{ $t('settings.billing.seatsCount', { used: SEATS_USED, total: SEATS_INCLUDED }) }}
          </p>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            class="h-full rounded-full transition-[width] duration-500"
            :style="{ width: `${seatUsage}%`, background: 'var(--ui-primary)' }"
          />
        </div>
        <p class="mt-2 text-xs text-dimmed">
          {{ $t('settings.billing.seatNote', { amount: fmt.currency(PER_SEAT) }) }}
        </p>
      </div>
    </PanelSection>

    <PanelSection
      :title="$t('settings.billing.paymentTitle')"
      :description="$t('settings.billing.paymentDescription')"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-md bg-elevated">
            <UIcon name="i-lucide-credit-card" class="size-5 text-dimmed" />
          </span>
          <div>
            <p class="tnum text-sm font-medium text-highlighted">
              Visa ···· 4242
            </p>
            <p class="text-xs text-muted">
              {{ $t('settings.billing.expires', { date: fmt.date(cardExpiry) }) }}
            </p>
          </div>
        </div>
        <UButton :label="$t('settings.billing.updateCard')" variant="subtle" size="sm" />
      </div>
    </PanelSection>

    <PanelSection
      :title="$t('settings.billing.historyTitle')"
      :description="$t('settings.billing.historyDescription')"
    >
      <ul class="divide-y divide-default">
        <li
          v-for="invoice in history"
          :key="invoice.number"
          class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div class="min-w-0">
            <p class="tnum truncate text-sm font-medium text-highlighted">
              {{ invoice.number }}
            </p>
            <p class="text-xs text-muted">
              {{ fmt.date(invoice.at) }}
            </p>
          </div>
          <span class="tnum text-sm text-default">{{ fmt.currency(invoice.amount) }}</span>
          <UBadge :label="$t('status.paid')" color="success" variant="subtle" size="sm" />
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="$t('settings.billing.download', { number: invoice.number })"
          />
        </li>
      </ul>
    </PanelSection>
  </div>
</template>
