<script setup lang="ts">
import type { Subscriber } from '#shared/types'
import { formatCurrency, formatDate, formatNumber, initials } from '#shared/format'

const props = defineProps<{
  subscriber: Subscriber | null
}>()

const open = defineModel<boolean>('open', { required: true })

const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', scale: 'Scale' } as const

const STATUS = {
  active: { label: 'Active', color: 'success' as const },
  trialing: { label: 'Trialing', color: 'info' as const },
  past_due: { label: 'Past due', color: 'warning' as const },
  churned: { label: 'Churned', color: 'neutral' as const }
}

const facts = computed(() => {
  if (!props.subscriber) return []
  const row = props.subscriber

  return [
    { label: 'Plan', value: PLAN_LABELS[row.plan] },
    { label: 'Monthly recurring revenue', value: formatCurrency(row.mrr), mono: true },
    { label: 'Seats', value: formatNumber(row.seats), mono: true },
    { label: 'Country', value: row.country },
    { label: 'Subscribed since', value: formatDate(row.joinedAt) },
    { label: 'Last seen', value: row.lastSeenLabel }
  ]
})
</script>

<template>
  <USlideover v-model:open="open" :title="subscriber?.company ?? 'Subscriber'">
    <template #body>
      <div v-if="subscriber">
        <div class="flex items-center gap-3">
          <UAvatar
            :text="initials(subscriber.company)"
            size="lg"
            :style="{ background: subscriber.avatarColor, color: '#fff' }"
          />
          <div class="min-w-0">
            <p class="truncate font-medium text-highlighted">
              {{ subscriber.name }}
            </p>
            <p class="truncate text-sm text-muted">
              {{ subscriber.email }}
            </p>
          </div>
        </div>

        <UBadge
          :label="STATUS[subscriber.status].label"
          :color="STATUS[subscriber.status].color"
          variant="subtle"
          class="mt-4"
        />

        <dl class="mt-6 divide-y divide-default border-y border-default">
          <div v-for="fact in facts" :key="fact.label" class="flex items-baseline justify-between gap-4 py-3">
            <dt class="text-sm text-muted">
              {{ fact.label }}
            </dt>
            <dd class="text-right text-sm font-medium text-highlighted" :class="fact.mono ? 'tnum' : ''">
              {{ fact.value }}
            </dd>
          </div>
        </dl>

        <div class="mt-6 space-y-2">
          <UButton
            :to="`mailto:${subscriber.email}`"
            label="Email this subscriber"
            icon="i-lucide-mail"
            variant="subtle"
            block
          />
          <UButton
            label="Open billing history"
            icon="i-lucide-receipt-text"
            color="neutral"
            variant="ghost"
            block
            disabled
          />
        </div>

        <p class="mt-4 text-xs text-dimmed">
          Billing history is a stub in the demo. Wire it to your billing provider
          in <span class="font-mono">server/api/subscribers/</span>.
        </p>
      </div>
    </template>
  </USlideover>
</template>
