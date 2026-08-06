<script setup lang="ts">
import type { NotificationPreferences } from '#shared/types'

const { t } = useI18n()
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

/** Ordered by how urgently each one needs acting on. */
const TOGGLES: Array<keyof Omit<NotificationPreferences, 'channel'>> = [
  'paymentFailures',
  'churnAlerts',
  'newSignups',
  'weeklyDigest',
  'productUpdates'
]

const CHANNELS = computed(() => [
  { label: t('settings.notifications.email'), value: 'email' as const },
  { label: t('settings.notifications.slack'), value: 'slack' as const },
  { label: t('settings.notifications.both'), value: 'both' as const }
])

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await $fetch('/api/settings/notifications', { method: 'PUT', body: { ...state } })
    notifySuccess(t('settings.notifications.saved'))
  } catch (error) {
    notify(error, t('settings.notifications.failed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PanelSection
    :title="$t('settings.notifications.title')"
    :description="$t('settings.notifications.description')"
  >
    <div v-if="status === 'pending'" class="space-y-4">
      <div v-for="row in 5" :key="row" class="h-10 animate-pulse rounded bg-elevated" />
    </div>

    <div v-else class="divide-y divide-default">
      <div
        v-for="key in TOGGLES"
        :key="key"
        class="flex items-start justify-between gap-4 py-4 first:pt-0"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            {{ $t(`settings.notifications.${key}`) }}
          </p>
          <p class="mt-0.5 text-sm text-muted">
            {{ $t(`settings.notifications.${key}Body`) }}
          </p>
        </div>
        <USwitch
          v-model="state[key]"
          :aria-label="$t(`settings.notifications.${key}`)"
          class="mt-0.5 shrink-0"
        />
      </div>

      <div class="pt-4">
        <p class="text-sm font-medium text-highlighted">
          {{ $t('settings.notifications.whereTitle') }}
        </p>
        <URadioGroup
          v-model="state.channel"
          :items="CHANNELS"
          class="mt-3"
          :aria-label="$t('settings.notifications.channelLabel')"
        />
      </div>
    </div>

    <template #footer>
      <UButton :label="$t('common.save')" :loading="saving" @click="save" />
    </template>
  </PanelSection>
</template>
