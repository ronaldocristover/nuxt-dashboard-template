<script setup lang="ts">
import type { ActivityEvent } from '#shared/types'
import { formatCurrency } from '#shared/format'

defineProps<{
  events: ActivityEvent[]
  loading?: boolean
}>()

/**
 * Each event kind gets its own icon and colour, drawn from the same four
 * movement colours the waterfall uses — so a churn event reads as churn
 * wherever it appears.
 */
const KINDS: Record<ActivityEvent['kind'], { icon: string, color: string }> = {
  signup: { icon: 'i-lucide-user-plus', color: 'var(--cadence-new)' },
  upgrade: { icon: 'i-lucide-trending-up', color: 'var(--cadence-expansion)' },
  downgrade: { icon: 'i-lucide-trending-down', color: 'var(--cadence-contraction)' },
  churn: { icon: 'i-lucide-user-minus', color: 'var(--cadence-churn)' },
  payment: { icon: 'i-lucide-credit-card', color: 'var(--cadence-expansion)' },
  invite: { icon: 'i-lucide-mail', color: 'var(--ui-primary)' }
}
</script>

<template>
  <div class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
    <div class="flex items-center justify-between gap-3 border-b border-default px-4 py-3.5 sm:px-5">
      <h3 class="text-sm font-semibold text-highlighted">
        Activity
      </h3>
      <UButton
        to="/dashboard/subscribers"
        label="All subscribers"
        variant="link"
        color="neutral"
        size="xs"
        trailing-icon="i-lucide-arrow-right"
      />
    </div>

    <div v-if="loading" class="space-y-4 p-4 sm:p-5">
      <div v-for="row in 6" :key="row" class="flex animate-pulse gap-3">
        <div class="size-7 shrink-0 rounded-full bg-elevated" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 w-3/4 rounded bg-elevated" />
          <div class="h-3 w-20 rounded bg-elevated" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="events.length === 0"
      icon="i-lucide-activity"
      title="No activity yet"
      description="Signups, upgrades and cancellations will appear here as they happen."
    />

    <ul v-else class="divide-y divide-default">
      <li
        v-for="event in events"
        :key="event.id"
        class="flex gap-3 px-4 py-3 transition-colors hover:bg-elevated/50 sm:px-5"
      >
        <span
          class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
          :style="{ background: `color-mix(in oklab, ${KINDS[event.kind].color} 14%, transparent)` }"
        >
          <UIcon :name="KINDS[event.kind].icon" class="size-3.5" :style="{ color: KINDS[event.kind].color }" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="text-sm text-default">
            {{ event.description }}
          </p>
          <p class="mt-0.5 text-xs text-dimmed">
            {{ event.actor }} · {{ event.atLabel }}
          </p>
        </div>

        <span
          v-if="event.amount"
          class="tnum shrink-0 self-center text-sm font-medium"
          :class="event.kind === 'churn' || event.kind === 'downgrade' ? 'text-muted' : 'text-highlighted'"
        >
          {{ formatCurrency(event.amount) }}
        </span>
      </li>
    </ul>
  </div>
</template>
