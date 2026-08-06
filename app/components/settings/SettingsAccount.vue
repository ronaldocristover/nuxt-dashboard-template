<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createChangePasswordSchema, scorePassword, type ChangePasswordInput } from '#shared/schemas'

const { t } = useI18n()
const fmt = useFormat()
const { user, changePassword } = useAuth()

const schema = computed(() => createChangePasswordSchema(t))
const { notify, notifySuccess } = useApiError()

const state = reactive({
  currentPassword: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const strength = computed(() => scorePassword(state.password))

const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<ChangePasswordInput>) {
  loading.value = true
  try {
    await changePassword(event.data)
    notifySuccess(t('settings.account.updated'), t('settings.account.updatedBody'))
    state.currentPassword = ''
    state.password = ''
    state.confirmPassword = ''
  } catch (error) {
    notify(error, t('settings.account.failed'))
  } finally {
    loading.value = false
  }
}

const deleteOpen = ref(false)
const confirmText = ref('')

/** Typing the word is the confirmation — no second dialog on top of a dialog. */
const canDelete = computed(() => confirmText.value.trim().toLowerCase() === 'delete')

function onDelete() {
  deleteOpen.value = false
  confirmText.value = ''
  notify(
    { statusMessage: t('settings.account.deleteDisabled') },
    t('settings.account.deleteDisabledTitle')
  )
}
</script>

<template>
  <div class="space-y-4">
    <UForm
      :schema="schema"
      :state="state"
      @submit="onSubmit"
    >
      <PanelSection
        :title="$t('settings.account.passwordTitle')"
        :description="$t('settings.account.passwordDescription')"
      >
        <div class="grid max-w-lg gap-4">
          <UFormField :label="$t('settings.account.current')" name="currentPassword" required>
            <UInput
              v-model="state.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="$t('settings.account.new')" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
            <div v-if="state.password" class="mt-2">
              <div class="flex gap-1" aria-hidden="true">
                <span
                  v-for="step in 4"
                  :key="step"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="step <= strength ? STRENGTH_COLORS[strength] : 'bg-accented'"
                />
              </div>
              <p class="mt-1.5 text-xs text-muted" aria-live="polite">
                {{ $t(`auth.strength.${strength}`) }}
              </p>
            </div>
          </UFormField>

          <UFormField :label="$t('settings.account.confirm')" name="confirmPassword" required>
            <UInput
              v-model="state.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>
        </div>

        <template #footer>
          <UButton type="submit" :label="$t('settings.account.submit')" :loading="loading" />
        </template>
      </PanelSection>
    </UForm>

    <PanelSection
      :title="$t('settings.account.sessionsTitle')"
      :description="$t('settings.account.sessionsDescription')"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-monitor" class="mt-0.5 size-5 shrink-0 text-dimmed" />
          <div>
            <p class="text-sm font-medium text-highlighted">
              {{ $t('settings.account.thisBrowser') }}
            </p>
            <p class="mt-0.5 text-xs text-muted">
              {{ $t('settings.account.signedInNow', { date: user ? fmt.date(user.createdAt) : '—' }) }}
            </p>
          </div>
        </div>
        <UBadge :label="$t('status.current')" variant="subtle" color="success" size="sm" />
      </div>
    </PanelSection>

    <!-- Destructive actions get their own visual treatment and their own
         confirmation, so they cannot be triggered by momentum. -->
    <section class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-error/30">
      <div class="border-b border-error/20 px-4 py-4 sm:px-6">
        <h2 class="text-base font-semibold text-error">
          {{ $t('settings.account.dangerTitle') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ $t('settings.account.dangerDescription') }}
        </p>
      </div>
      <div class="px-4 py-4 sm:px-6">
        <UButton
          :label="$t('settings.account.deleteButton')"
          color="error"
          variant="subtle"
          icon="i-lucide-trash-2"
          @click="deleteOpen = true"
        />
      </div>
    </section>

    <UModal v-model:open="deleteOpen" :title="$t('settings.account.dangerTitle')">
      <template #body>
        <i18n-t keypath="settings.account.deleteBody" tag="p" class="text-sm text-muted" scope="global">
          <template #word>
            <span class="font-mono font-medium text-highlighted">delete</span>
          </template>
        </i18n-t>
        <UInput
          v-model="confirmText"
          class="mt-4 w-full"
          placeholder="delete"
          :aria-label="$t('settings.account.deleteConfirmLabel')"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            :label="$t('settings.account.keepAccount')"
            color="neutral"
            variant="ghost"
            @click="deleteOpen = false"
          />
          <UButton
            :label="$t('settings.account.deleteButton')"
            color="error"
            :disabled="!canDelete"
            @click="onDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
