<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { scorePassword, signUpSchema, type SignUpInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useSeoMeta({
  title: 'Create your account',
  description: 'Start a 14-day Cadence trial. No card required.',
  robots: 'noindex'
})

const { signUp } = useAuth()
const { notify, notifySuccess } = useApiError()

const state = reactive({
  name: '',
  email: '',
  password: '',
  terms: false
})

const loading = ref(false)
const showPassword = ref(false)

const strength = computed(() => scorePassword(state.password))

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const
const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<SignUpInput>) {
  loading.value = true
  try {
    await signUp(event.data)
    notifySuccess('Account created', 'Your 14-day Growth trial has started.')
    await navigateTo('/dashboard')
  } catch (error) {
    notify(error, 'Could not create your account')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
      Create your account
    </h1>
    <p class="mt-2 text-sm text-muted">
      Already have one?
      <NuxtLink to="/login" class="font-medium text-primary underline-offset-2 hover:underline">
        Sign in
      </NuxtLink>
    </p>

    <UForm
      :schema="signUpSchema"
      :state="state"
      class="mt-7 space-y-4"
      @submit="onSubmit"
    >
      <UFormField label="Full name" name="name" required>
        <UInput
          v-model="state.name"
          autocomplete="name"
          placeholder="Amara Adeyemi"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Work email" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" name="password" required>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="At least 8 characters"
          size="lg"
          class="w-full"
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

        <!-- Guidance, not a gate. The schema is what enforces the rules. -->
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
            {{ STRENGTH_LABELS[strength] }} — mix upper and lower case, a number, and a symbol.
          </p>
        </div>
      </UFormField>

      <UFormField name="terms">
        <UCheckbox v-model="state.terms" name="terms">
          <template #label>
            <span class="text-sm text-muted">
              I agree to the
              <NuxtLink to="/" class="text-primary underline-offset-2 hover:underline">terms of service</NuxtLink>
              and
              <NuxtLink to="/" class="text-primary underline-offset-2 hover:underline">privacy policy</NuxtLink>.
            </span>
          </template>
        </UCheckbox>
      </UFormField>

      <UButton
        type="submit"
        label="Create account"
        size="lg"
        block
        :loading="loading"
      />

      <p class="text-center text-xs text-dimmed">
        14 days on Growth. No card required.
      </p>
    </UForm>
  </div>
</template>
