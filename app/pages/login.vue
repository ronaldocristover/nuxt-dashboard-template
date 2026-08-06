<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createSignInSchema, type SignInInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const { signIn } = useAuth()
const { notify } = useApiError()

useSeoMeta({
  title: () => t('auth.signIn.submit'),
  robots: 'noindex'
})

// Built with `t` so every message is in the reader's language. The server
// validates with the same rules, using message keys it never renders.
const schema = computed(() => createSignInSchema(t))

const state = reactive({
  email: '',
  password: '',
  remember: false
})

const loading = ref(false)
const showPassword = ref(false)

/** Only ever redirect to a path on this origin — never to a supplied URL. */
const redirectTo = computed(() => {
  const target = route.query.redirect
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard'
  }
  return target
})

async function onSubmit(event: FormSubmitEvent<SignInInput>) {
  loading.value = true
  try {
    const result = await signIn(event.data)

    // A correct password is not always a session. With two-step on, the server
    // holds a challenge and nothing is authenticated until it is answered.
    if (result.requiresTwoFactor) {
      await navigateTo({
        path: '/two-factor',
        query: {
          ...(redirectTo.value !== '/dashboard' ? { redirect: redirectTo.value } : {}),
          // Dev only: carries the code so the flow is walkable without email.
          ...(result.devCode ? { devCode: result.devCode } : {})
        }
      })
      return
    }

    await navigateTo(redirectTo.value)
  } catch (error) {
    notify(error, t('auth.signIn.failed'))
  } finally {
    loading.value = false
  }
}

function useDemoAccount() {
  state.email = 'demo@cadence.app'
  state.password = 'Cadence2026'
}
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
      {{ $t('auth.signIn.title') }}
    </h1>
    <p class="mt-2 text-sm text-muted">
      {{ $t('auth.signIn.newHere') }}
      <NuxtLink to="/register" class="font-medium text-primary underline-offset-2 hover:underline">
        {{ $t('auth.signIn.createAccount') }}
      </NuxtLink>
    </p>

    <UAlert
      v-if="config.public.demoMode"
      class="mt-6"
      color="neutral"
      variant="subtle"
      icon="i-lucide-key-round"
      :title="$t('auth.signIn.demoTitle')"
      :actions="[{ label: $t('auth.signIn.demoFill'), variant: 'subtle', size: 'xs', onClick: useDemoAccount }]"
    >
      <template #description>
        <span class="tnum text-xs">demo@cadence.app · Cadence2026</span>
      </template>
    </UAlert>

    <UForm
      :schema="schema"
      :state="state"
      class="mt-6 space-y-4"
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
        />
      </UFormField>

      <!-- The reset link goes in `hint`, which UFormField already places
           opposite the label. Putting it inside `label` pushed the required
           marker onto its own line. -->
      <UFormField :label="$t('auth.signIn.password')" name="password" required>
        <template #hint>
          <NuxtLink
            to="/forgot-password"
            class="text-xs font-normal text-muted underline-offset-2 hover:text-primary hover:underline"
          >
            {{ $t('auth.signIn.forgot') }}
          </NuxtLink>
        </template>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          :placeholder="$t('auth.signIn.passwordPlaceholder')"
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
      </UFormField>

      <UCheckbox v-model="state.remember" name="remember" :label="$t('auth.signIn.remember')" />

      <UButton
        type="submit"
        :label="$t('auth.signIn.submit')"
        size="lg"
        block
        :loading="loading"
      />
    </UForm>

    <USeparator :label="$t('auth.signIn.or')" class="my-6" />

    <div class="grid gap-2 sm:grid-cols-2">
      <UButton
        label="Google"
        icon="i-simple-icons-google"
        color="neutral"
        variant="subtle"
        size="lg"
        block
        disabled
      />
      <UButton
        label="GitHub"
        icon="i-simple-icons-github"
        color="neutral"
        variant="subtle"
        size="lg"
        block
        disabled
      />
    </div>
    <i18n-t keypath="auth.signIn.socialNote" tag="p" class="mt-2.5 text-center text-xs text-dimmed" scope="global">
      <template #file>
        <span class="font-mono">README.md</span>
      </template>
    </i18n-t>
  </div>
</template>
