<script setup lang="ts">
import type { NotificationPreferences } from '#shared/types'

const { notify, notifySuccess } = useApiError()

const { data, status } = await useApiFetch<NotificationPreferences>('/api/settings/notifications')

const state = reactive<NotificationPreferences>({
  productUpdates: true,
  weeklyDigest: true,
  paymentFailures: true,
  churnAlerts: true,
  newSignups: false,
  channel: 'email'
})

watchEffect(() => {
  if (data.value) Object.assign(state, data.value)
})

const TOGGLES: Array<{ key: keyof Omit<NotificationPreferences, 'channel'>, label: string, description: string }> = [
  {
    key: 'paymentFailures',
    label: 'Failed payments',
    description: 'The moment a charge fails, with the account and the amount at risk.'
  },
  {
    key: 'churnAlerts',
    label: 'Cancellations',
    description: 'When a subscription is cancelled, including what it was worth.'
  },
  {
    key: 'newSignups',
    label: 'New signups',
    description: 'Every new account. Quiet teams leave this off and read the digest instead.'
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'Monday morning summary of last week’s movement, in your timezone.'
  },
  {
    key: 'productUpdates',
    label: 'Product updates',
    description: 'Occasional notes about what changed in Cadence.'
  }
]

const CHANNELS = [
  { label: 'Email only', value: 'email' as const },
  { label: 'Slack only', value: 'slack' as const },
  { label: 'Email and Slack', value: 'both' as const }
]

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await $fetch('/api/settings/notifications', { method: 'PUT', body: { ...state } })
    notifySuccess('Notification settings saved')
  } catch (error) {
    notify(error, 'Could not save your notification settings')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PanelSection
    title="Notifications"
    description="Choose what Cadence tells you about, and where it arrives."
  >
    <div v-if="status === 'pending'" class="space-y-4">
      <div v-for="row in 5" :key="row" class="h-10 animate-pulse rounded bg-elevated" />
    </div>

    <div v-else class="divide-y divide-default">
      <div
        v-for="toggle in TOGGLES"
        :key="toggle.key"
        class="flex items-start justify-between gap-4 py-4 first:pt-0"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            {{ toggle.label }}
          </p>
          <p class="mt-0.5 text-sm text-muted">
            {{ toggle.description }}
          </p>
        </div>
        <USwitch
          v-model="state[toggle.key]"
          :aria-label="toggle.label"
          class="mt-0.5 shrink-0"
        />
      </div>

      <div class="pt-4">
        <p class="text-sm font-medium text-highlighted">
          Where to send them
        </p>
        <URadioGroup
          v-model="state.channel"
          :items="CHANNELS"
          class="mt-3"
          aria-label="Delivery channel"
        />
      </div>
    </div>

    <template #footer>
      <UButton label="Save changes" :loading="saving" @click="save" />
    </template>
  </PanelSection>
</template>
