<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSignUpSchema, scorePassword, type SignUpInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const { signUp } = useAuth()
const { notify, notifySuccess } = useApiError()

useSeoMeta({
  title: () => t('auth.signUp.title'),
  robots: 'noindex'
})

const schema = computed(() => createSignUpSchema(t))

const state = reactive({
  name: '',
  email: '',
  password: '',
  terms: false
})

const loading = ref(false)
const showPassword = ref(false)

const strength = computed(() => scorePassword(state.password))

const STRENGTH_COLORS = ['bg-error', 'bg-error', 'bg-warning', 'bg-info', 'bg-success'] as const

async function onSubmit(event: FormSubmitEvent<SignUpInput>) {
  loading.value = true
  try {
    await signUp(event.data)
    notifySuccess(t('auth.signUp.created'), t('auth.signUp.createdBody'))
    await navigateTo('/dashboard')
  } catch (error) {
    notify(error, t('auth.signUp.failed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
      {{ $t('auth.signUp.title') }}
    </h1>
    <p class="mt-2 text-sm text-muted">
      {{ $t('auth.signUp.haveAccount') }}
      <NuxtLink to="/login" class="font-medium text-primary underline-offset-2 hover:underline">
        {{ $t('auth.signUp.signIn') }}
      </NuxtLink>
    </p>

    <UForm
      :schema="schema"
      :state="state"
      class="mt-7 space-y-4"
      @submit="onSubmit"
    >
      <UFormField :label="$t('auth.signUp.name')" name="name" required>
        <UInput
          v-model="state.name"
          autocomplete="name"
          :placeholder="$t('auth.signUp.namePlaceholder')"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('auth.signUp.email')" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          :placeholder="$t('auth.signIn.emailPlaceholder')"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('auth.signUp.password')" name="password" required>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="$t('auth.signUp.passwordPlaceholder')"
          size="lg"
          class="w-full"
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
            {{ $t(`auth.strength.${strength}`) }} — {{ $t('auth.strength.hint') }}
          </p>
        </div>
      </UFormField>

      <UFormField name="terms">
        <UCheckbox v-model="state.terms" name="terms">
          <template #label>
            <i18n-t keypath="auth.signUp.terms" tag="span" class="text-sm text-muted" scope="global">
              <template #terms>
                <NuxtLink to="/" class="text-primary underline-offset-2 hover:underline">
                  {{ $t('auth.signUp.termsLink') }}
                </NuxtLink>
              </template>
              <template #privacy>
                <NuxtLink to="/" class="text-primary underline-offset-2 hover:underline">
                  {{ $t('auth.signUp.privacyLink') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
        </UCheckbox>
      </UFormField>

      <UButton
        type="submit"
        :label="$t('auth.signUp.submit')"
        size="lg"
        block
        :loading="loading"
      />

      <p class="text-center text-xs text-dimmed">
        {{ $t('auth.signUp.trialNote') }}
      </p>
    </UForm>
  </div>
</template>
