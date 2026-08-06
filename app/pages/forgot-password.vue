<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createForgotPasswordSchema, type ForgotPasswordInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const { notify } = useApiError()

useSeoMeta({
  title: () => t('auth.forgot.title'),
  robots: 'noindex'
})

const schema = computed(() => createForgotPasswordSchema(t))

const state = reactive({ email: '' })
const loading = ref(false)
const sent = ref(false)
const sentTo = ref('')

/** Only populated in development, where there is no email provider. */
const devResetUrl = ref<string | undefined>()

async function onSubmit(event: FormSubmitEvent<ForgotPasswordInput>) {
  loading.value = true
  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: event.data
    })
    sentTo.value = event.data.email
    devResetUrl.value = response.devResetUrl
    sent.value = true
  } catch (error) {
    notify(error, t('auth.forgot.failed'))
  } finally {
    loading.value = false
  }
}

function tryAgain() {
  sent.value = false
  devResetUrl.value = undefined
}
</script>

<template>
  <div>
    <!-- Success is a different screen, not a toast: the next action lives
         in someone's inbox, and this page has to say so clearly. -->
    <template v-if="sent">
      <div class="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <UIcon name="i-lucide-mail-check" class="size-5 text-primary" />
      </div>

      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.forgot.sentTitle') }}
      </h1>
      <i18n-t keypath="auth.forgot.sentBody" tag="p" class="mt-2 text-sm text-muted" scope="global">
        <template #email>
          <span class="font-medium text-highlighted">{{ sentTo }}</span>
        </template>
      </i18n-t>

      <UAlert
        v-if="devResetUrl"
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        :title="$t('auth.forgot.devTitle')"
      >
        <template #description>
          <p class="text-xs">
            {{ $t('auth.forgot.devBody') }}
          </p>
          <UButton
            :to="devResetUrl"
            :label="$t('auth.forgot.devOpen')"
            size="xs"
            variant="subtle"
            color="warning"
            class="mt-2"
            trailing-icon="i-lucide-arrow-right"
          />
        </template>
      </UAlert>

      <div class="mt-6 space-y-2">
        <UButton to="/login" :label="$t('auth.forgot.back')" size="lg" block />
        <UButton
          :label="$t('auth.forgot.useAnother')"
          size="lg"
          color="neutral"
          variant="ghost"
          block
          @click="tryAgain"
        />
      </div>
    </template>

    <template v-else>
      <NuxtLink
        to="/login"
        class="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-2 transition-colors hover:text-highlighted"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        {{ $t('auth.forgot.back') }}
      </NuxtLink>

      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.forgot.title') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.forgot.body') }}
      </p>

      <UForm
        :schema="schema"
        :state="state"
        class="mt-7 space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('auth.signIn.email')" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="email"
            :placeholder="$t('auth.signIn.emailPlaceholder')"
            size="lg"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UButton
          type="submit"
          :label="$t('auth.forgot.submit')"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </div>
</template>
