<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { changePasswordSchema, scorePassword, type ChangePasswordInput } from '#shared/schemas'
import { formatDate } from '#shared/format'

const { user, changePassword } = useAuth()
const { notify, notifySuccess } = useApiError()

const state = reactive({
  currentPassword: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const strength = computed(() => scorePassword(state.password))

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const
const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<ChangePasswordInput>) {
  loading.value = true
  try {
    await changePassword(event.data)
    notifySuccess('Password updated', 'Use your new password next time you sign in.')
    state.currentPassword = ''
    state.password = ''
    state.confirmPassword = ''
  } catch (error) {
    notify(error, 'Could not update your password')
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
    { statusMessage: 'Account deletion is disabled in the demo. Wire it to your own endpoint before shipping.' },
    'Not available in the demo'
  )
}
</script>

<template>
  <div class="space-y-4">
    <UForm
      :schema="changePasswordSchema"
      :state="state"
      @submit="onSubmit"
    >
      <PanelSection
        title="Password"
        description="At least 8 characters, with upper and lower case and a number."
      >
        <div class="grid max-w-lg gap-4">
          <UFormField label="Current password" name="currentPassword" required>
            <UInput
              v-model="state.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <UFormField label="New password" name="password" required>
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
                {{ STRENGTH_LABELS[strength] }}
              </p>
            </div>
          </UFormField>

          <UFormField label="Confirm new password" name="confirmPassword" required>
            <UInput
              v-model="state.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>
        </div>

        <template #footer>
          <UButton type="submit" label="Update password" :loading="loading" />
        </template>
      </PanelSection>
    </UForm>

    <PanelSection
      title="Sessions"
      description="Where your account is currently signed in."
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex gap-3">
          <UIcon name="i-lucide-monitor" class="mt-0.5 size-5 shrink-0 text-dimmed" />
          <div>
            <p class="text-sm font-medium text-highlighted">
              This browser
            </p>
            <p class="mt-0.5 text-xs text-muted">
              Signed in now · account created {{ user ? formatDate(user.createdAt) : '—' }}
            </p>
          </div>
        </div>
        <UBadge label="Current" variant="subtle" color="success" size="sm" />
      </div>
    </PanelSection>

    <!-- Destructive actions get their own visual treatment and their own
         confirmation, so they cannot be triggered by momentum. -->
    <section class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-error/30">
      <div class="border-b border-error/20 px-4 py-4 sm:px-6">
        <h2 class="text-base font-semibold text-error">
          Delete this account
        </h2>
        <p class="mt-1 text-sm text-muted">
          Removes your account, its workspace and every report in it. Exports are
          not kept and this cannot be undone.
        </p>
      </div>
      <div class="px-4 py-4 sm:px-6">
        <UButton
          label="Delete account"
          color="error"
          variant="subtle"
          icon="i-lucide-trash-2"
          @click="deleteOpen = true"
        />
      </div>
    </section>

    <UModal v-model:open="deleteOpen" title="Delete this account">
      <template #body>
        <p class="text-sm text-muted">
          This removes your account and every report in the workspace. Type
          <span class="font-mono font-medium text-highlighted">delete</span>
          to confirm.
        </p>
        <UInput
          v-model="confirmText"
          class="mt-4 w-full"
          placeholder="delete"
          aria-label="Type delete to confirm"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Keep my account"
            color="neutral"
            variant="ghost"
            @click="deleteOpen = false"
          />
          <UButton
            label="Delete account"
            color="error"
            :disabled="!canDelete"
            @click="onDelete"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
