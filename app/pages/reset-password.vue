<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createResetPasswordSchema, scorePassword, type ResetPasswordInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const route = useRoute()
const { notify, notifySuccess } = useApiError()

useSeoMeta({
  title: () => t('auth.reset.title'),
  robots: 'noindex'
})

const schema = computed(() => createResetPasswordSchema(t))

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
const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<ResetPasswordInput>) {
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: event.data })
    notifySuccess(t('auth.reset.updated'), t('auth.reset.updatedBody'))
    await navigateTo('/login')
  } catch (error) {
    notify(error, t('auth.reset.failed'))
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
        {{ $t('auth.reset.brokenTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.reset.brokenBody') }}
      </p>

      <div class="mt-6 space-y-2">
        <UButton to="/forgot-password" :label="$t('auth.reset.requestNew')" size="lg" block />
        <UButton
          to="/login"
          :label="$t('auth.forgot.back')"
          size="lg"
          color="neutral"
          variant="ghost"
          block
        />
      </div>
    </template>

    <template v-else>
      <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.reset.title') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.reset.body') }}
      </p>

      <UForm
        :schema="schema"
        :state="state"
        class="mt-7 space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('auth.reset.newPassword')" name="password" required>
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :placeholder="$t('auth.signUp.passwordPlaceholder')"
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
                :aria-label="showPassword ? $t('common.hidePassword') : $t('common.showPassword')"
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
              {{ $t(`auth.strength.${strength}`) }}
            </p>
          </div>
        </UFormField>

        <UFormField :label="$t('auth.reset.confirmPassword')" name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            type="password"
            autocomplete="new-password"
            :placeholder="$t('auth.reset.confirmPlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          :label="$t('auth.reset.submit')"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </div>
</template>
