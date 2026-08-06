<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgotPasswordSchema, type ForgotPasswordInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useSeoMeta({
  title: 'Reset your password',
  description: 'Request a password reset link for your Cadence account.',
  robots: 'noindex'
})

const { notify } = useApiError()

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
    notify(error, 'Could not send the reset link')
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
        Check your inbox
      </h1>
      <p class="mt-2 text-sm text-muted">
        If <span class="font-medium text-highlighted">{{ sentTo }}</span> has an account,
        a reset link is on its way. The link works once and expires in 30 minutes.
      </p>

      <UAlert
        v-if="devResetUrl"
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        title="Development only"
        description="No email provider is configured, so the link is shown here."
      >
        <template #description>
          <p class="text-xs">
            No email provider is configured, so the link is shown here.
          </p>
          <UButton
            :to="devResetUrl"
            label="Open reset link"
            size="xs"
            variant="subtle"
            color="warning"
            class="mt-2"
            trailing-icon="i-lucide-arrow-right"
          />
        </template>
      </UAlert>

      <div class="mt-6 space-y-2">
        <UButton to="/login" label="Back to sign in" size="lg" block />
        <UButton
          label="Use a different email"
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
        Back to sign in
      </NuxtLink>

      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        Reset your password
      </h1>
      <p class="mt-2 text-sm text-muted">
        Enter the email address on your account and we will send a link to set a
        new password.
      </p>

      <UForm
        :schema="forgotPasswordSchema"
        :state="state"
        class="mt-7 space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email address" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            size="lg"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UButton
          type="submit"
          label="Send reset link"
          size="lg"
          block
          :loading="loading"
        />
      </UForm>
    </template>
  </div>
</template>
