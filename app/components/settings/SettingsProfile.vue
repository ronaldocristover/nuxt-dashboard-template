<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createProfileSchema, type ProfileInput } from '#shared/schemas'
import { initials } from '#shared/format'

const { t } = useI18n()
const { user, updateProfile } = useAuth()

const schema = computed(() => createProfileSchema(t))
const { notify, notifySuccess } = useApiError()

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney'
]

const state = reactive({
  name: '',
  email: '',
  jobTitle: '',
  company: '',
  timezone: 'Asia/Jakarta'
})

/** Seeds the form from the session, and re-seeds if the user changes. */
watchEffect(() => {
  if (!user.value) return
  state.name = user.value.name
  state.email = user.value.email
  state.jobTitle = user.value.jobTitle
  state.company = user.value.company
  state.timezone = user.value.timezone
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ProfileInput>) {
  loading.value = true
  try {
    await updateProfile(event.data)
    notifySuccess(t('settings.profile.saved'))
  } catch (error) {
    notify(error, t('settings.profile.failed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    @submit="onSubmit"
  >
    <PanelSection
      :title="$t('settings.profile.title')"
      :description="$t('settings.profile.description')"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div class="flex items-center gap-3 sm:flex-col sm:gap-3">
          <UAvatar
            :text="initials(state.name || '?')"
            size="3xl"
            :style="{ background: user?.avatarColor, color: '#fff' }"
          />
          <UButton
            label="Change"
            size="xs"
            color="neutral"
            variant="subtle"
            disabled
          />
        </div>

        <div class="grid flex-1 gap-4 sm:grid-cols-2">
          <UFormField :label="$t('settings.profile.name')" name="name" required class="sm:col-span-2">
            <UInput v-model="state.name" class="w-full" autocomplete="name" />
          </UFormField>

          <UFormField :label="$t('settings.profile.email')" name="email" required class="sm:col-span-2">
            <UInput v-model="state.email" type="email" class="w-full" autocomplete="email" />
          </UFormField>

          <UFormField :label="$t('settings.profile.jobTitle')" name="jobTitle">
            <UInput v-model="state.jobTitle" class="w-full" :placeholder="$t('settings.profile.jobPlaceholder')" />
          </UFormField>

          <UFormField :label="$t('settings.profile.company')" name="company">
            <UInput v-model="state.company" class="w-full" :placeholder="$t('settings.profile.companyPlaceholder')" />
          </UFormField>

          <UFormField
            :label="$t('settings.profile.timezone')"
            name="timezone"
            required
            class="sm:col-span-2"
            :help="$t('settings.profile.timezoneHelp')"
          >
            <USelect v-model="state.timezone" :items="TIMEZONES" class="w-full" />
          </UFormField>
        </div>
      </div>

      <template #footer>
        <UButton type="submit" :label="$t('common.save')" :loading="loading" />
      </template>
    </PanelSection>
  </UForm>
</template>
