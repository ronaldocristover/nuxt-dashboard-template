<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPasswordSchema, scorePassword, type ResetPasswordInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useSeoMeta({
  title: 'Set a new password',
  robots: 'noindex'
})

const route = useRoute()
const { notify, notifySuccess } = useApiError()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const state = reactive({
  token: token.value,
  password: '',
  confirmPassword: ''
})

// The token can arrive after the first render on a client-side navigation.
watch(token, (value) => {
  state.token = value
})

const loading = ref(false)
const showPassword = ref(false)

const strength = computed(() => scorePassword(state.password))
const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const
const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<ResetPasswordInput>) {
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: event.data })
    notifySuccess('Password updated', 'Sign in with your new password.')
    await navigateTo('/login')
  } catch (error) {
    notify(error, 'Could not update your password')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- A missing token is a dead end, so say so instead of showing a form
         that cannot possibly succeed. -->
    <template v-if="!token">
      <div class="flex size-11 items-center justify-center rounded-full bg-warning/10">
        <UIcon name="i-lucide-link-2-off" class="size-5 text-warning" />
      </div>

      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        This link is incomplete
      </h1>
      <p class="mt-2 text-sm text-muted">
        Reset links expire after 30 minutes and work only once. Request a fresh
        one and open it directly from your inbox.
      </p>

      <div class="mt-6 space-y-2">
        <UButton to="/forgot-password" label="Request a new link" size="lg" block />
        <UButton
          to="/login"
          label="Back to sign in"
          size="lg"
          color="neutral"
          variant="ghost"
          block
        />
      </div>
    </template>

    <template v-else>
      <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        Set a new password
      </h1>
      <p class="mt-2 text-sm text-muted">
        Choose a password you have not used on Cadence before. You will be signed
        out of other sessions.
      </p>

      <UForm
        :schema="resetPasswordSchema"
        :state="state"
        class="mt-7 space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="New password" name="password" required>
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            size="lg"
            class="w-full"
            autofocus
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>

          <div v-if="state.password" class="mt-2">
            <div class="flex gap-1" aria-hidden="true">
              <span
                v-for="step in 4"
                :key="step"
                class="h-1 flex-1 rounded-full transition-colors duration-200"
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
            placeholder="Type it again"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Update password"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </div>
</template>
