<script setup lang="ts">
import type { Subscriber } from '#shared/types'
import { initials } from '#shared/format'

const props = defineProps<{
  subscriber: Subscriber | null
  generatedAt?: string
}>()

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const fmt = useFormat()

const STATUS_COLOR = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  churned: 'neutral'
} as const

const facts = computed(() => {
  if (!props.subscriber) return []
  const row = props.subscriber

  return [
    { label: t('subscribers.detail.plan'), value: t(`plans.${row.plan}`) },
    { label: t('subscribers.detail.mrr'), value: fmt.value.currency(row.mrr), mono: true },
    { label: t('subscribers.detail.seats'), value: fmt.value.number(row.seats), mono: true },
    { label: t('subscribers.detail.country'), value: row.country },
    { label: t('subscribers.detail.since'), value: fmt.value.date(row.joinedAt) },
    {
      label: t('subscribers.detail.lastSeen'),
      value: props.generatedAt ? fmt.value.relative(row.lastSeenAt, props.generatedAt) : '—'
    }
  ]
})
</script>

<template>
  <USlideover v-model:open="open" :title="subscriber?.company ?? $t('subscribers.detail.title')">
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
          :label="$t(`status.${subscriber.status}`)"
          :color="STATUS_COLOR[subscriber.status]"
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
            :label="$t('subscribers.detail.email')"
            icon="i-lucide-mail"
            variant="subtle"
            block
          />
          <UButton
            :label="$t('subscribers.detail.billing')"
            icon="i-lucide-receipt-text"
            color="neutral"
            variant="ghost"
            block
            disabled
          />
        </div>

        <i18n-t keypath="subscribers.detail.billingNote" tag="p" class="mt-4 text-xs text-dimmed" scope="global">
          <template #path>
            <span class="font-mono">server/api/subscribers/</span>
          </template>
        </i18n-t>
      </div>
    </template>
  </USlideover>
</template>
